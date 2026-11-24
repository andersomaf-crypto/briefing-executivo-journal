#!/usr/bin/env node
'use strict';
/** Creates a verified-source RSS snapshot for GitHub Pages (no LLM or invented prices). */
const fs=require('node:fs');
const path=require('node:path');
const {getNews}=require('../lib/core');
const {workAssessment}=require('../lib/work-radar');
const {getMarkets}=require('../lib/markets');
const {translateArticles}=require('../lib/translate');
const DIR=path.join(__dirname,'..','data');
function brDate(value){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
function put(file,obj){const full=path.join(DIR,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,JSON.stringify(obj,null,2)+'\n','utf8');}
function get(file,defaultValue){try{return JSON.parse(fs.readFileSync(path.join(DIR,file),'utf8'))}catch{return defaultValue}}
async function main(){
  const [newsResult,marketResult]=await Promise.allSettled([getNews(30),getMarkets()]);
  const prev=get('latest.json',null);
  if(marketResult.status==='fulfilled' && Object.values(marketResult.value.values||{}).some(Boolean)){
    put('markets.json',marketResult.value);
  }else{
    console.warn('Dados de mercado indisponíveis; preservando último snapshot e suas datas originais.');
    if(!fs.existsSync(path.join(DIR,'markets.json'))) put('markets.json',{generatedAt:null,values:{}});
  }
  if(newsResult.status!=='fulfilled')throw new Error('Falha na consulta de notícias: '+String(newsResult.reason));
  const news=newsResult.value;
  // Never repeat a story already shown in the previous day's edition.
  if(prev?.editionDate && prev.editionDate!==brDate(news.generatedAt)){
    const seen=new Set(prev.articles.map(a=>a.url));
    const seenIds=new Set(prev.articles.map(a=>a.id));
    news.articles=news.articles.filter(a=>!seen.has(a.url)&&!seenIds.has(a.id));
  }
  // Dez manchetes gerais + até quatro adicionais sobre conduta e atendimento financeiro.
  const general=news.articles.slice(0,10);
  const seenLinks=new Set(general.map(a=>a.url));
  const workExtra=(news.workCandidates||[]).filter(a=>!seenLinks.has(a.url) &&
    !(prev?.editionDate && prev.editionDate!==brDate(news.generatedAt) && prev.articles?.some(p=>p.url===a.url))).slice(0,4);
  news.articles=[...general,...workExtra].map(a=>{
    const match=workAssessment(a);
    return match?{...a,workRelated:true,workScore:match.score,workAngle:match.angle,radarExtra:workExtra.some(w=>w.url===a.url)}:a;
  });
  if(!news.articles.length){
    if(prev?.articles?.length){console.warn('Nenhuma nova matéria verificada; última edição mantida sem alterar sua data.');return;}
    throw new Error('Nenhuma matéria verificada; não foi gerada uma edição vazia como se fosse atual.');
  }
  const translation=await translateArticles(news.articles,get('translations.json',{entries:{}}),{onError:msg=>console.warn('Tradução:',msg)});
  news.articles=translation.articles;
  put('translations.json',translation.cache);
  console.log('Tradução PT-BR:',JSON.stringify(translation.stats));
  const date=brDate(news.generatedAt);
  const edition={editionDate:date,generatedAt:news.generatedAt,windowHours:news.windowHours,
    count:news.articles.length,baseCount:general.length,workCount:news.articles.filter(a=>a.workRelated).length,workExtraCount:workExtra.length,totalCandidates:news.totalCandidates,errors:news.errors,articles:news.articles,
    integrity:'rss-automatizado',translation:translation.stats,notice:'Notícias extraídas de feeds RSS. Textos internacionais traduzidos automaticamente para português quando disponível; consulte sempre a fonte original.'};
  // Idempotent updates to the same edition, preserving snapshots for earlier dates.
  put('latest.json',edition);
  put('arquivo/'+date+'.json',edition);
  let index=get('index.json',{editions:[]});
  const existing=(index.editions||[]).filter(x=>x.date!==date);
  existing.unshift({date,count:edition.count,generatedAt:edition.generatedAt});
  index={generatedAt:news.generatedAt,editions:existing.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,180)};
  put('index.json',index);
  console.log(`Edição ${date}: ${edition.count} notícias recentes (${workExtra.length} extras de trabalho) em ${news.windowHours}h; ${news.errors.length} feeds indisponíveis.`);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={brDate};