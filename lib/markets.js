'use strict';
async function jsonFetch(url){const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),6000);try{const r=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; JournalBriefing/1.0)','Accept':'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t)}}
async function yahoo(symbol){const j=await jsonFetch('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?range=5d&interval=1d');const c=j.chart?.result?.[0];if(!c)throw Error('Sem dados Yahoo');let q=c.indicators.quote[0].close.map((v,i)=>({v,t:c.timestamp[i]})).filter(x=>Number.isFinite(x.v));if(!q.length)throw Error('Sem pregão');const a=q.at(-1),p=q.at(-2);return {value:a.v,change:p?((a.v-p.v)/p.v*100):null,date:new Date(a.t*1000).toISOString(),source:'Yahoo Finance'};}
async function btc(){const j=await jsonFetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true');const b=j.bitcoin;if(!Number.isFinite(b?.usd))throw Error('Sem preço');return {value:b.usd,change:Number.isFinite(b.usd_24h_change)?b.usd_24h_change:null,date:b.last_updated_at?new Date(b.last_updated_at*1000).toISOString():new Date().toISOString(),source:'CoinGecko'};}
function validSelic(records, today){
  if(!Array.isArray(records))throw Error('Série Selic inválida');
  const cutoff=today || new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',
    year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const eligible=records.map(x=>{
    const m=String(x?.data||'').match(/^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/);
    if(!m)return null;
    const date=m[3]+'-'+m[2]+'-'+m[1];
    const value=Number(String(x.valor||'').replace(',','.'));
    return date<=cutoff && Number.isFinite(value) && value>=0 && value<=100?{date,value}:null;
  }).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date));
  if(!eligible.length)throw Error('Selic sem observação confirmada até hoje');
  const a=eligible[0];
  return {value:a.value,change:null,date:a.date+'T12:00:00-03:00',source:'BCB SGS 432'};
}
async function selic(){
  const j=await jsonFetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/100?formato=json');
  return validSelic(j);
}
async function getMarkets(){const tasks=[['ibovespa',()=>yahoo('^BVSP')],['dolar',()=>yahoo('BRL=X')],['bitcoin',btc],['selic',selic]];const x=await Promise.allSettled(tasks.map(([,f])=>f()));const out={generatedAt:new Date().toISOString(),values:{},errors:{}};for(let i=0;i<x.length;i++){const k=tasks[i][0];if(x[i].status==='fulfilled')out.values[k]=x[i].value;else{out.values[k]=null;out.errors[k]='Dado indisponível nesta atualização';}}return out;}
module.exports={getMarkets,validSelic};