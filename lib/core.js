'use strict';
const {workAssessment,selectWork}=require('./work-radar');
const {classifyStory,relevanceScore,selectEditorial}=require('./editorial');

const FEEDS = [
  {name:'Agência Brasil',category:'Economia',url:'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml',priority:4},
  {name:'Agência Brasil',category:'Política',url:'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml',priority:3},
  {name:'Agência Brasil',category:'Geopolítica',url:'https://agenciabrasil.ebc.com.br/rss/internacional/feed.xml',priority:3},
  {name:'Agência Brasil',category:'Tênis',url:'https://agenciabrasil.ebc.com.br/rss/esportes/feed.xml',priority:3,require:/t[eê]nis|tenista|quadra|atp\b|wta\b|jo[aã]o fonseca|luisa stefani|roland garros|wimbledon|us open|australian open|sinner|alcaraz|djokovic|swiatek|sabalenka/i},
  {name:'InfoMoney',category:'Economia',url:'https://www.infomoney.com.br/feed/',priority:3},
  {name:'Folha Mercado',category:'Economia',url:'https://feeds.folha.uol.com.br/mercado/rss091.xml',priority:4},
  {name:'g1 Economia',category:'Economia',url:'https://g1.globo.com/dynamo/economia/rss2.xml',priority:3},
  {name:'UOL Economia',category:'Economia',url:'http://rss.uol.com.br/feed/economia.xml',priority:3},
  {name:'Finsiders Brasil',category:'Bancos',url:'https://finsidersbrasil.com.br/feed/',priority:5,
    require:/banc|fintech|investiment|open finance|\bIA\b|intelig[eê]ncia artificial|consumidor|reclama|cr[eé]dito|pagament|pix|fraude|regula|atendimento|distribui|produto financeiro|CVM/i},
  {name:'TenisBrasil',category:'Tênis',url:'https://tenisbrasil.uol.com.br/feed/',priority:5},
  {name:'MIT Technology Review Brasil',category:'IA',url:'https://mittechreview.com.br/feed/',priority:4,
    require:/intelig[eê]ncia artificial|agente|IA generativa|LLM|OpenAI|Anthropic|modelos? de linguagem|autom[aá]tica|governan[cç]a de IA|sistema financeiro/i},
  {name:'Banco Central',category:'Bancos',url:'https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/noticias?ano=2026',priority:5,
    require:/consumidor|ouvidoria|reclama[cç]|atendimento|distribui[cç]|contrata[cç][aã]o|oferta|open finance|seguran[cç]a|transpar[eê]ncia|cr[eé]dito|regula[cç][aã]o/i},
  {name:'Banco Central - Notas',category:'Bancos',url:'https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/notasImprensa',priority:5,
    require:/cr[eé]dito|banco|regula[cç]|consumidor|pix|open finance|ouvidoria|seguran[cç]|risco|institui[cç][oõ]es financeiras/i},
  {name:'CVM - Legislação',category:'Bancos',url:'https://conteudo.cvm.gov.br/feed/legislacao.xml',priority:5,require:/investid|distribui[cç]|suitability|dever de informa[cç]|transpar[eê]ncia|supervis[aã]o|intermedi[aá]ri|conduta|comiss[aã]o|oferta|reclama[cç]|atendimento/i},
  {name:'CVM - Decisões',category:'Bancos',url:'https://conteudo.cvm.gov.br/feed/decisoes.xml',priority:5,require:/investid|distribui[cç]|suitability|reclama[cç]|comercial|atendimento|intermedi[aá]ri|conduta/i},
  {name:'Tecnoblog',category:'IA',url:'https://tecnoblog.net/feed/',priority:3,require:/intelig[eê]ncia artificial|\bIA\b|chatgpt|openai|google gemini|anthropic|chip|semicondut|nvidia|robot|agente|llm|machine learning|tecnologia/i},
  {name:'Cointelegraph',category:'Bitcoin',url:'https://cointelegraph.com/rss',priority:3},
  {name:'CoinDesk',category:'Bitcoin',url:'https://www.coindesk.com/arc/outboundfeeds/rss/',priority:3},
  {name:'BBC Sport',category:'Tênis',url:'https://feeds.bbci.co.uk/sport/0/tennis/rss.xml',priority:3},
  {name:'Estadão Economia',category:'Economia',url:'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/economia/',priority:3},
  {name:'Estadão Política',category:'Política',url:'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/politica/',priority:2},
  {name:'Estadão Internacional',category:'Geopolítica',url:'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/internacional/',priority:2}
];
function decodeXml(s){ return (s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{try{return String.fromCodePoint(v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):parseInt(v,10))}catch{return ''}}).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&nbsp;/g,' '); }
function plain(s){return decodeXml(s).replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pick(xml,tag){let m=xml.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i')); return m?m[1]:'';}
function linkFrom(xml){const raw=pick(xml,'link');if(raw && /^\s*(https?:|<!\[CDATA\[https?:)/i.test(raw))return plain(raw);const v=xml.match(/<link\b[^>]*?href=["']([^"']+)["']/i);return v?decodeXml(v[1]):plain(raw);}
function slug(s){return plain(s).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'').slice(0,95);}
function safeUrl(input){try{
  // Folha RSS uses an intermediate redir URL with the publisher's direct URL after '*'.
  // Always resolve and validate the actual URL before exposing it to readers.
  const raw=String(input||'');
  if(raw.startsWith('https://redir.folha.com.br/')){
    const pos=raw.indexOf('*https://');
    if(pos>=0)return safeUrl(raw.slice(pos+1));
  }
  const u=new URL(input);if(!['https:','http:'].includes(u.protocol))return '';if(/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(u.hostname))return '';return u.toString();}catch{return '';}}
function classify(title,desc,base){return classifyStory(title,desc,base);}
function reason(cat,text){ const t=text.toLowerCase();if(/selic|copom|juros|infla[cç][aã]o/.test(t))return 'Pode alterar expectativas de juros, custo do crédito e preços dos ativos.';if(/banco|cr[eé]dito|inadimpl[eê]ncia|pix/.test(t))return 'Ajuda a acompanhar rentabilidade bancária, crédito e riscos operacionais.';if(/bitcoin|cripto|etf/.test(t))return 'É relevante para liquidez, volatilidade e gestão da exposição a criptoativos.';if(/chip|semicondut|nvidia|data center/.test(t))return 'Pode influenciar custos, oferta de infraestrutura e a competição em IA.';if(/t[eê]nis|atp|wta|tenista/.test(t))return 'Atualiza resultados e momentos decisivos do circuito profissional de tênis.'; if(cat==='Geopolítica')return 'Pode afetar comércio internacional, commodities e percepção de risco.';if(cat==='Política')return 'Importa para expectativas econômicas, regulação e políticas públicas.';if(cat==='IA')return 'Ajuda a avaliar aplicação prática, riscos e escala das tecnologias de IA.';return 'É relevante para a atividade econômica e as decisões de investimento.'; }
function importance(item){return relevanceScore(item);}
function parseFeed(xml,feed){if(!/<(?:rss|feed|rdf:RDF)\b/i.test(xml))return [];const blocks=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)];const out=[];for(const m of blocks){const b=m[1],title=plain(pick(b,'title')), url=safeUrl(linkFrom(b)),desc=plain(pick(b,'description')||pick(b,'summary')||pick(b,'content')||pick(b,'encoded')),dateStr=plain(pick(b,'pubDate')||pick(b,'published')||pick(b,'updated')||pick(b,'date'));if(!title||!url||!dateStr || (feed.require&&!feed.require.test(title+' '+desc)))continue;const time=Date.parse(dateStr);if(!Number.isFinite(time)||time>Date.now()+3600000)continue;const cat=classify(title,desc,feed.category),date=new Date(time).toISOString();let excerpt=desc.replace(/\b(Leia mais|Saiba mais)\b.*$/i,'').slice(0,260).trim();if(excerpt && excerpt.length>=240){excerpt=excerpt.slice(0,excerpt.lastIndexOf(' '))+'…'}out.push({id:slug(title),title,category:cat,summary:excerpt||'Confira os detalhes na matéria original.',why:reason(cat,title+' '+desc),url,source:feed.name,published:date,priority:feed.priority})}return out;}
function decodeFeedBuffer(buffer,contentType=''){
  const raw=new Uint8Array(buffer),header=new TextDecoder('windows-1252').decode(raw.subarray(0,300));
  const declared=/encoding=["']([^"']+)/i.exec(header)?.[1]||'';
  const ct=/charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType)?.[1]||'';
  const charset=(declared||ct||'utf-8').toLowerCase();
  const decoder=/(iso-8859-1|latin-1|windows-1252)/i.test(charset)?'windows-1252':'utf-8';
  return new TextDecoder(decoder).decode(raw).slice(0,900000);
}
async function fetchText(url){const ctrl=new AbortController();const tid=setTimeout(()=>ctrl.abort(),8000);
  try{const r=await fetch(url,{headers:{'User-Agent':'BriefingExecutivo/1.2 (RSS reader)','Accept':'application/rss+xml, application/xml, text/xml, */*'},signal:ctrl.signal,cache:'no-store'});
    if(!r.ok)throw Error('HTTP '+r.status);
    return decodeFeedBuffer(await r.arrayBuffer(),r.headers.get('content-type')||'');
  }finally{clearTimeout(tid)}
}
function selectItems(items,windowHours=48,limit=12,opts={}){return selectEditorial(items,windowHours,limit,opts);}
async function getNews(limit=14,opts={}){const settled=await Promise.allSettled(FEEDS.map(async f=>({feed:f,items:parseFeed(await fetchText(f.url),f)})));const items=[],errors=[],sources=[];for(let i=0;i<settled.length;i++){const r=settled[i];if(r.status==='fulfilled'){items.push(...r.value.items);sources.push({name:FEEDS[i].name,category:FEEDS[i].category,count:r.value.items.length,status:r.value.items.length?'ok':'vazio'});}else{errors.push(FEEDS[i].name+' / '+FEEDS[i].category);sources.push({name:FEEDS[i].name,category:FEEDS[i].category,count:0,status:'erro'});}}const latest=selectItems(items,36,limit,opts);const windowHours=latest.length<9?48:36;
const selected=windowHours===48?selectItems(items,48,limit,opts):latest;
return {generatedAt:new Date().toISOString(),windowHours,count:selected.length,totalCandidates:items.length,sources,coverage:Object.fromEntries([...new Set(selected.map(a=>a.category))].map(c=>[c,selected.filter(a=>a.category===c).length])),
    articles:selected,workCandidates:selectWork(items,336,12),errors,integrity:selected.length?'feeds':'unavailable'}}
module.exports={getNews,parseFeed,selectItems,plain,safeUrl,slug,FEEDS,workAssessment,selectWork,decodeFeedBuffer,classify,importance};