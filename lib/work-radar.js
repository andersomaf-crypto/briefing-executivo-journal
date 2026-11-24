'use strict';
/** Public-news relevance model — no internal bank information or proprietary vocabulary. */
const RULES=[
 {pattern:/reclama[cç](?:[aã]o|[oõ]es)|ouvidoria|consumidor[.]gov|procon|venda casada|vendas? abusivas?|pr[aá]ticas? abusivas?|conduta comercial|ass[eé]dio comercial|publicidade enganosa/i,points:11,angle:'Reclamações, transparência e qualidade comercial'},
 {pattern:/suitability|perfil (de|do) investidor|adequa[cç][aã]o (ao|do) perfil|distribui[cç][aã]o de (fundos|investimentos|produtos financeiros)|recomenda[cç][aã]o de investimento|dever de informa[cç][aã]o/i,points:10,angle:'Conduta na distribuição de investimentos'},
 {pattern:/qualidade (do|de|no) atendimento|experi[eê]ncia do cliente|satisfa[cç][aã]o (do|de) cliente|nps|relacionamento com (os )?clientes|jornada do cliente|tratamento de clientes/i,points:10,angle:'Experiência do cliente e qualidade de atendimento'},
 {pattern:/incentivos? comerciais?|metas de vendas|remunera[cç][aã]o vari[aá]vel|comissionamento|comiss[oõ]es de vendas|cross.sell|vendas? (de )?produtos financeiros/i,points:10,angle:'Incentivos, metas e qualidade de vendas'},
 {pattern:/intelig[eê]ncia artificial.{0,90}(banco|financeir|atendimento|clientes)|(?:banco|financeir|atendimento|clientes).{0,90}intelig[eê]ncia artificial|agentes? de ia.{0,90}(banco|financeir)|(?:banco|financeir).{0,90}agentes? de ia/i,points:9,angle:'IA, governança e experiência bancária'},
 {pattern:/prote[cç][aã]o (do|ao) consumidor|portabilidade (de cr[eé]dito|banc[aá]ria)|atendimento banc[aá]rio|relacionamento banc[aá]rio|seguran[cç]a nas (opera[cç][oõ]es|transa[cç][oõ]es)/i,points:8,angle:'Proteção do consumidor e atendimento financeiro'},
 {pattern:/open finance|contrata[cç][aã]o de cr[eé]dito|oferta (de|e) cr[eé]dito|prote[cç][aã]o ao consumidor|produtos de capta[cç][aã]o|finan[cç]as (abertas|digitais)|portabilidade de (conta|sal[aá]rio)/i,points:9,angle:'Jornada digital, transparência e proteção do cliente'},
 {pattern:/autorregula[cç][aã]o|fiscaliza[cç][aã]o|supervis[aã]o|normas? de conduta|regula[cç][aã]o (de|da|do) (bancos?|investimentos|mercado)/i,points:6,angle:'Regulação e supervisão do setor financeiro'}
];
const FINANCIAL=/(?:\bbanc(?:o|os|a|os)?\b|banc[aá]ri|financeir|investiment|cr[eé]dito|cart[aã]o|CVM\b|BACEN\b|\bBCB\b|Banco Central|\bPix\b|corretora|fintech|open finance|cons[oó]rcio|seguro|fundos? de investiment)/i;
const NEWS_WINDOW=336;
function workAssessment(item){
 const title=String(item?.title||'');
 const summary=String(item?.summary||'').slice(0,500);
 const text=title+' '+summary;
 // Keep the personal radar limited to genuinely financial/commercial topics.
 if(!FINANCIAL.test(text) && !/^(?:CVM|Banco Central)/.test(String(item?.source||'')))return null;
 const matches=RULES.filter(r=>r.pattern.test(text));
 if(!matches.length)return null;
 matches.sort((a,b)=>b.points-a.points);
 const best=matches[0];
 if(best.points<8){
   const regulator=/(CVM\b|Banco Central|BCB\b|banco|corretora|investidor)/i.test(text);
   if(!regulator)return null;
 }
 return {score:best.points+(matches.length>1?2:0)+(best.pattern.test(title)?2:0),angle:best.angle};
}
function selectWork(items,windowHours=NEWS_WINDOW,limit=4){
 const cutoff=Date.now()-windowHours*3600000, byUrl=new Set(), byTitle=new Set(), selected=[];
 for(const item of items){const dt=Date.parse(item?.published||'');const info=workAssessment(item);if(!info||!Number.isFinite(dt)||dt<cutoff||dt>Date.now()+3600000||!item.url)continue;
 selected.push({...item,workRelated:true,workScore:info.score,workAngle:info.angle});}
 selected.sort((a,b)=>b.workScore-a.workScore||b.published.localeCompare(a.published));
 return selected.filter(item=>{const t=String(item.title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'').slice(0,100);if(byUrl.has(item.url)||byTitle.has(t))return false;byUrl.add(item.url);byTitle.add(t);return true;}).slice(0,limit);
}
module.exports={workAssessment,selectWork,RULES};