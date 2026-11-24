/* Preferências editoriais do leitor — somente no aparelho. Sem rede ou telemetria. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.BriefingFeedback=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const MAX=250,WINDOW_DAYS=120;
function fold(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
const THEMES=[
 ['conduta-comercial',/conduta|venda casada|meta[s]? de venda|comiss[aã]o|remuneracao variavel|incentivo comercial|qualidade de venda|distribuicao de produtos/],
 ['reclamacoes',/reclamac|ouvidoria|procon|consumidor|atendimento ruim|pratica abusiva/],
 ['atendimento',/atendimento|experiencia do cliente|jornada do cliente|nps|satisfacao|relacionamento/],
 ['investimentos',/investiment|cvm|suitability|perfil do investidor|corretora|fundos|renda fixa|etf/],
 ['open-finance',/open finance|open banking|pix|portabilidade|conta digital/],
 ['credito',/credito|financiamento|inadimplencia|juros do banco|spread bancario/],
 ['regulacao',/regulacao|regulamentacao|banco central|cvm|supervisao|norma|fiscalizacao/],
 ['ia',/inteligencia artificial|\bia\b|llm|agente autonomo|automacao|openai|anthropic|gemini/],
 ['bitcoin',/bitcoin|\bbtc\b|cripto|blockchain|stablecoin|satoshi/],
 ['macroeconomia',/selic|ipca|inflacao|pib|ibovespa|dolar|taxa de juros|politica monetaria/],
 ['geopolitica',/guerra|geopolit|comercio internacional|tarifa comercial|sancoes|otan/],
 ['tenis',/\btenis\b|\batp\b|\bwta\b|wimbledon|roland garros|alcaraz|sinner|djokovic|sabalenka/],
 ['tenis-brasileiro',/joao fonseca|luisa stefani|beatriz haddad|bia haddad|rafael matos|orlando luz|thiago wild/]
];
function keyFor(article){const id=String(article?.id||article?.url||'').trim();return id.slice(0,160);}
function tagsFor(article){
 const text=fold((article?.title||'')+' '+(article?.summary||''));
 return THEMES.filter(([,rx])=>rx.test(text)).map(([tag])=>tag);
}
function sanitize(raw){
 const x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const out={};
 for(const [id,entry] of Object.entries(x)){
  if(!id||id.length>160||!entry||typeof entry!=='object')continue;
  if(entry.value!==1&&entry.value!==-1)continue;
  const at=Number(entry.at);
  if(!Number.isFinite(at)||at<=0||at>Date.now()+86400000)continue;
  out[id]={value:entry.value,at,category:String(entry.category||'').slice(0,40),
   tags:Array.isArray(entry.tags)?entry.tags.filter(t=>typeof t==='string').slice(0,8):[]};
 }
 return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1].at-a[1].at).slice(0,MAX));
}
function rating(history,article){return sanitize(history)[keyFor(article)]?.value||0;}
function record(history,article,value,at=Date.now()){
 if(value!==1&&value!==-1)throw Error('Avaliação inválida');
 const id=keyFor(article);if(!id)return sanitize(history);
 const data=sanitize(history);
 if(data[id]?.value===value)delete data[id];
 else data[id]={value,at,category:String(article.category||''),tags:tagsFor(article)};
 return sanitize(data);
}
function bonus(article,history,now=Date.now()){
 const id=keyFor(article),entries=Object.entries(sanitize(history));
 if(!entries.length)return 0;
 const tags=tagsFor(article),topicSet=new Set(tags),category=String(article.category||'');
 let score=0;
 for(const [votedId,vote] of entries){
  if(votedId===id)continue;
  const days=(now-vote.at)/86400000;if(days>WINDOW_DAYS||days<0)continue;
  const shared=(vote.tags||[]).filter(t=>topicSet.has(t)).length;
  if(!shared && vote.category!==category)continue;
  const decay=Math.max(.15,1-days/WINDOW_DAYS);
  const contribution=(Math.min(2,shared)*1.5+(vote.category===category?.35:0))*vote.value*decay;
  score+=contribution;
 }
 score=Math.max(-4,Math.min(4,score));
 const self=sanitize(history)[id]?.value||0;
 return score+(self*2.5);
}
function prioritize(items,history){
 if(!Array.isArray(items)||items.length<2)return Array.isArray(items)?[...items]:[];
 const weighted=items.map((article,index)=>({article,index,adjustment:bonus(article,history)}));
 weighted.sort((a,b)=>(-a.index*1.15+a.adjustment)-(-b.index*1.15+b.adjustment)||a.index-b.index);
 return weighted.reverse().map(x=>x.article);
}
function count(history){return Object.keys(sanitize(history)).length;}
return {keyFor,tagsFor,sanitize,rating,record,bonus,prioritize,count};
});
