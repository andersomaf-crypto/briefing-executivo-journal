'use strict';
/** Curadoria determinística: assuntos e fontes públicas, sem dados internos ou ranking por popularidade. */
const {workAssessment}=require('./work-radar');
const CATEGORIES=['Economia','Bancos','IA','Bitcoin','Geopolítica','Política','Tênis'];
const MINIMUM={Economia:2,Bancos:2,IA:2,Bitcoin:1,Geopolítica:1,Política:1,'Tênis':1};
const MAXIMUM={Economia:4,Bancos:4,IA:3,Bitcoin:2,Geopolítica:2,Política:2,'Tênis':2};
const STOP=new Set('a o os as de da do das dos que e em um uma uns umas para por com sem ao aos no na nos nas sobre entre seu sua seus suas se mais como após antes quando ante o novo nova outros hoje nesta nesta essa esse este estes já muito esse assim and the for with from into after this that its are was will has been amid says over into here bank says brazil'.split(' '));
function norm(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9%$ ]/g,' ').replace(/\s+/g,' ').trim();}
function hits(x,re){return re.test(norm(x));}
function classifyStory(title,summary='',base='Economia'){
  const t=norm(title),d=norm(summary);
  if(base==='Tênis')return 'Tênis';
  if(base==='Bitcoin')return 'Bitcoin';
  if(hits(t,/\bbitcoin\b|\bbtc\b|cripto|ethereum|stablecoin|blockchain|tokeniza|exchange de ativos|etf de bitcoin/))return 'Bitcoin';
  if(hits(t,/\btenis\b|\btenista\b|\batp\b|\bwta\b|fonseca|stefani|sinner|alcaraz|djokovic|roland garros|wimbledon|us open|australian open|sabalenka|swiatek/))return 'Tênis';
  // Política monetária, contas públicas e atividade pertencem à economia — não à editoria Bancos.
  const macro=/\bpib\b|\bipca\b|inflacao|selic|copom|federal reserve|\bfed\b|juros (?:no|do|em)|taxa de juros|bolsa|ibovespa|dolar|cambio|desemprego|mercado de trabalho|contas publicas|arcabouco fiscal|divida publica|projecao de crescimento|previsao de crescimento|boletim macrofiscal/;
  if(hits(t,macro))return 'Economia';
  const bank=/\bbanco\b|\bbancos\b|bancari|instituic(?:ao|oes) financeira|\bitau\b|\bion\b|bradesco|santander|nubank|\bcvm\b|\bbcb\b|\bbacen\b|banco central|\bpix\b|open finance|credito|fintech|corretora|consumidor financeiro|investidor|suitability|ouvidoria|fraude bancari|supervisao financeira|pagamentos/;
  const tech=/inteligencia artificial|\bia\b|agente autonomo|agente de ia|\bopenai\b|chatgpt|\bnvidia\b|\bchip\b|semicondutor|\bgemini\b|\banthropic\b|\bllm\b|aprendizado de maquina|machine learning|\brobotica\b|data center|\bcopilot\b/;
  if(hits(t,bank))return 'Bancos';
  if(hits(t,tech))return 'IA';
  if(hits(t,/guerra|conflito|tarifas (?:dos|entre)|\bomc\b|geopolit|sancoes internacionais|petroleo|\bopep\b|ucrania|russia|china e eua|ataque de drones|iran|oriente medio|exportacao de chips/))return 'Geopolítica';
  if(base==='Bancos' && hits(t+' '+d,bank))return 'Bancos';
  if(base==='IA' && hits(t+' '+d,tech))return 'IA';
  return CATEGORIES.includes(base)?base:'Economia';
}
const HIGH_IMPACT=/\bdecide\b|\baprova\b|aprova(?:cao|da|do)|anuncia|novo regulamento|novas regras|resolucao|norma|muda regra|limita|suspende|multa|sanciona|investiga|\bproibe\b|corte de juros|elevacao de juros|reducao de juros|resultado trimestral|balanco|lucro|prejuizo|aquisicao|\bcompra\b|fusa(?:o|o)|lanca|seguranca|fraude|vazamento|falha|crise|indicador|revisao|previsao|\bentra em vigor\b/;
const PROFESSIONAL=/conduta|reclamac|ouvidoria|suitability|distribuicao de investimentos|qualidade do atendimento|experiencia do cliente|protecao ao consumidor|transparencia|incentivos? comerciais?|remuneracao variavel|agente de ia|governanca|open finance|autorregulacao/;
const SENSATIONAL=/rumores? de|boato|segredo de|fotos? de|veja (?:video|fotos)|\bviral\b|celebridade|romance|caso amoroso|espia|polemica pessoal|caiu na rede|imperdivel|aproveite|ganhou milhoes (?:com|em) acoes|ganhou.*acoes da nvidia|retorna ao comando|return as ceo|back as ceo|jensen huang.*trump|trump.*jensen huang|memecoin|\$trump|\bpreco alvo\b|pode multiplicar por|\bpatrocinad[oa]\b|um conteudo|sponsored/;
const CORE_ECO=/\bpib\b|\bipca\b|inflacao|juros|copom|selic|\bfed\b|federal reserve|fiscal|\bdolar\b|desemprego|atividade economica|emprego|mercado de trabalho|arrecadacao|\bcredito\b|\bcambio\b/;
const CORE_BANK=/\bbanco\b|\bbancos\b|bancari|\bitau\b|bradesco|santander|nubank|\bcvm\b|\bbcb\b|banco central|\bpix\b|open finance|fintech|investimentos|credito|ouvidoria|cliente|distribuicao|conduta|atendimento|fraude|pagamentos|corretora|\bion\b/;
const CORE_AI=/inteligencia artificial|\bia\b|agentes? autonom|\bopenai\b|\bchatgpt\b|\bnvidia\b|\bchip\b|semicondutor|\bgoogle gemini\b|\banthropic\b|\brobotica\b|\bdata center\b|modelos de linguagem|\bllm\b/;
const CORE_BTC=/\bbitcoin\b|\bbtc\b|criptoativ|criptomoeda|blockchain|ethereum|stablecoin|etf de bitcoin/;
const CORE_TENNIS=/tenis|tenista|\batp\b|\bwta\b|fonseca|stefani|sinner|alcaraz|djokovic|sabalenka|swiatek|wimbledon|roland garros|grand slam/;
const CORE_GEO=/geopolitica|guerra|tarifa|\bchina\b|\brussia\b|ucrania|sancoes|petroleo|\bopep\b|oriente medio|\bomc\b|exportacao|ataque/;
function categorySignal(item){const p={Economia:CORE_ECO,Bancos:CORE_BANK,IA:CORE_AI,Bitcoin:CORE_BTC,'Tênis':CORE_TENNIS,Geopolítica:CORE_GEO,Política:/congresso|senado|camara|governo|eleicao|presidente|ministro|projeto de lei|reforma|tributari|fiscal/};return hits(item.title,p[item.category]||/.^/);}
function relevanceScore(item, now=Date.now()){
 const title=norm(item.title),summary=norm(item.summary);let score=(Number(item.priority)||1)*1.6;
 const age=(now-new Date(item.published).getTime())/3600000;
 if(Number.isFinite(age))score-=Math.min(9,Math.max(0,age/9));
 if(categorySignal(item))score+=6;else score-=7;
 if(hits(title,HIGH_IMPACT))score+=3;
 if(hits(title,PROFESSIONAL))score+=4;
 if(item.category==='Bancos'||item.category==='Economia')score+=1.8;
 if(item.category==='Tênis' && hits(title,/brasil|brasileir|joao fonseca|luisa stefani|fonseca|stefani|atp finals|wta finals|grand slam/))score+=4;
 if(item.category==='Bitcoin' && hits(title,/etf|fluxo|fundos?|institucional|custodia|regulac|bitcoin|halving/))score+=1;
 if(item.category==='IA' && hits(title,/\bia\b|agentes?|modelos?|\bchips?\b|regulac|risco|seguranca|produtividade|financeiro|bancos?/))score+=3;
 if(hits(title,SENSATIONAL))score-=17;
 if(/^\s*(?:opiniao|opinion|patrocinado|publieditorial)/i.test(item.title))score-=30;
 if(item.category==='Economia' && !hits(title,CORE_ECO))score-=3;
 const work=workAssessment(item);if(work)score+=Math.min(6,work.score*.44);
 return Number(score.toFixed(3));
}
function canonicalUrl(u){try{const p=new URL(u);p.hash='';for(const key of [...p.searchParams.keys()]){if(/^utm_|^(fbclid|gclid|utm|ref|rss|output)$/i.test(key))p.searchParams.delete(key)}return p.origin+p.pathname.replace(/\/$/,'')+'?'+p.searchParams.toString();}catch{return String(u||'')}}
function tokens(title){return new Set(norm(title).split(' ').filter(w=>w.length>=4&&!STOP.has(w)&&!/^\d+$/.test(w)));}
function eventKey(item){const t=norm(item.title);if(/nvidia/.test(t)&&/huang|ceo|presiden|comando|trump|returns?/.test(t))return 'nvidia-administracao';if(/bitcoin|btc/.test(t)&&/\b(preco|cotacao|cai|queda|sobe|alta|abaixo|recuo|rally|drop|fall|surge|dip|price)\b/.test(t))return 'bitcoin-preco';return '';}
function sameStory(a,b){if(canonicalUrl(a.url)===canonicalUrl(b.url))return true;
 const ak=eventKey(a),bk=eventKey(b);if(ak&&ak===bk)return true;
 const x=tokens(a.title),y=tokens(b.title);if(!x.size||!y.size)return false;
 const n=[...x].filter(v=>y.has(v)).length;
 return n>=3 && n/Math.min(x.size,y.size)>=.67;
}
function selectEditorial(items,windowHours=48,limit=12,opts={}){
 const now=Number.isFinite(opts.now)?opts.now:Date.now();const minTime=now-windowHours*3600000;
 const blocked=new Set((opts.excludeUrls||[]).map(canonicalUrl));
 const valid=items.filter(a=>{const dt=Date.parse(a?.published||'');return a?.title&&a?.url&&Number.isFinite(dt)&&dt>=minTime&&dt<=now+3600000&&!blocked.has(canonicalUrl(a.url))}).map(item=>({...item,score:relevanceScore(item,now)})).filter(x=>x.score>=7);
 valid.sort((a,b)=>b.score-a.score||b.published.localeCompare(a.published));
 const result=[],categories={},sources={};
 function insert(item){if(result.length>=limit)return false;
  if((categories[item.category]||0)>=(MAXIMUM[item.category]||2))return false;
  if((sources[item.source]||0)>=3)return false;
  if(result.some(r=>sameStory(r,item)))return false;
  result.push(item);categories[item.category]=(categories[item.category]||0)+1;sources[item.source]=(sources[item.source]||0)+1;return true;}
 for(const [category,min] of Object.entries(MINIMUM)){
  for(const x of valid){if(result.length>=limit||(categories[category]||0)>=min)break;if(x.category===category)insert(x)}
 }
 for(const x of valid){if(result.length>=limit)break;insert(x)}
 return result.map(({score,...a})=>({...a,editorialScore:score}));
}
module.exports={classifyStory,relevanceScore,selectEditorial,sameStory,categorySignal,canonicalUrl,eventKey,CATEGORIES};