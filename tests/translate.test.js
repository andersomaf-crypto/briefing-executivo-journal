'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {requestTranslation,translateArticles,numbersPreserved,validTranslation}=require('../lib/translate');
function mockTranslate(map){let n=0;return {get calls(){return n},fetch:async url=>{n++;const u=new URL(url);assert.equal(u.searchParams.get('langpair'),'en|pt-BR');return {ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:map[u.searchParams.get('q')]||'Tradução indisponível'}})};}};}
test('Traduz título e resumo sem mudar fonte, link ou números',async()=>{
  const title='Bitcoin drops 1.1% as prices reach $64,100';
  const summary='Bitcoin fell to $64,100 this morning.';
  const fake=mockTranslate({[title]:'Bitcoin cai 1,1% com preço a US$ 64.100',[summary]:'Bitcoin recuou para US$ 64.100 nesta manhã.'});
  const original={id:'btc',source:'CoinDesk',title,summary,url:'https://www.coindesk.com/story',category:'Bitcoin',published:'2026-11-18T11:00:00Z'};
  const output=await translateArticles([original],{entries:{}},{fetchImpl:fake.fetch,budget:4400});
  assert.equal(output.articles[0].translationStatus,'automatica');
  assert.equal(output.articles[0].title,'Bitcoin cai 1,1% com preço a US$ 64.100');
  assert.equal(output.articles[0].source,original.source);
  assert.equal(output.articles[0].url,original.url);
  assert.equal(output.stats.translated,1);
  const again=await translateArticles([original],output.cache,{fetchImpl:fake.fetch,budget:4400});
  assert.equal(again.stats.cacheHits,2);
  assert.equal(fake.calls,2);
});
test('Não traduz veículos originalmente em português',async()=>{
  const output=await translateArticles([{source:'Agência Brasil',title:'Copom mantém Selic',summary:'A taxa permanece.'}],{entries:{}},{fetchImpl:()=>{throw Error('Não deveria chamar API')}});
  assert.equal(output.articles[0].translationStatus,'original');
});
test('Descarta tradução que altera valores numéricos',async()=>{
  assert.equal(numbersPreserved('Up 1.1% to $64,100','Alta de 1,1% para US$ 64.100'),true);
  assert.equal(validTranslation('Up 1.1% to $64,100','Alta de 1,1% para US$ 60.100'),false);
  await assert.rejects(requestTranslation('BTC is $64,100',{fetchImpl:async()=>({ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:'Bitcoin está em US$ 60.100'}})})}));
});
test('Tradução indisponível é sinalizada, sem criar manchete fictícia',async()=>{
  const a={source:'BBC Sport',title:'Sinner beats Alcaraz',summary:'Sinner defeated Alcaraz.'};
  const output=await translateArticles([a],{entries:{}},{fetchImpl:async()=>({ok:false,status:429}),budget:4400});
  assert.equal(output.articles[0].title,a.title);
  assert.equal(output.articles[0].translationStatus,'indisponivel');
});