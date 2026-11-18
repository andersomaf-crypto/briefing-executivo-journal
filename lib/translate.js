'use strict';
/** Tradução pontual de títulos e excertos RSS para PT-BR. Fonte e URL não são alteradas. */
const crypto=require('node:crypto');
const ENGLISH_SOURCES=new Set(['BBC Sport','CoinDesk','Cointelegraph']);
const PROVIDER='MyMemory';
const MAX_INPUT_BYTES=480; // MyMemory limita cada segmento a 500 bytes.
const MAX_DAILY_CHARS=4400; // Reserva para permanecer abaixo dos 5.000 caracteres anônimos/dia.

function key(text){return crypto.createHash('sha256').update('en|pt-BR|'+text).digest('hex');}
function unescapeText(input){return String(input||'').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi,(whole,entity)=>{
  if(entity[0]==='#'){const hex=entity[1].toLowerCase()==='x';const n=parseInt(entity.slice(hex?2:1),hex?16:10);return Number.isInteger(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):whole;}
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[entity.toLowerCase()]||whole;
}).trim();}
function numbersOf(text){return (String(text).match(/\d[\d.,]*/g)||[]).map(v=>v.replace(/\D/g,'')).sort();}
function numbersPreserved(original,translated){const before=numbersOf(original),after=numbersOf(translated);return before.every(n=>after.includes(n));}
function validTranslation(original,translated){
  const clean=unescapeText(translated);
  return clean.length>=3 && clean.length<1200 && clean!==original && numbersPreserved(original,clean) &&
    !/^(query length limit|my\s*memory warning|you used all available|no translation found)/i.test(clean);
}
async function requestTranslation(original,{fetchImpl=globalThis.fetch,email='',timeoutMs=9000,languagePair='en|pt-BR'}={}){
  const input=String(original||'').trim();
  if(!input||Buffer.byteLength(input,'utf8')>MAX_INPUT_BYTES)throw Error('Texto maior que o limite da tradução');
  const u=new URL('https://api.mymemory.translated.net/get');
  u.searchParams.set('q',input);u.searchParams.set('langpair',languagePair);
  if(email && /^\S+@\S+\.\S+$/.test(email))u.searchParams.set('de',email);
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const response=await fetchImpl(u.toString(),{signal:c.signal,headers:{'Accept':'application/json'}});
    if(!response.ok)throw Error('Tradução indisponível (HTTP '+response.status+')');
    const payload=await response.json();
    if(Number(payload?.responseStatus)!==200)throw Error('Tradução indisponível: '+String(payload?.responseDetails||'status inválido'));
    const output=unescapeText(payload?.responseData?.translatedText);
    if(!validTranslation(input,output))throw Error('Resposta de tradução inválida ou valores alterados');
    return output;
  }finally{clearTimeout(timer)}
}
async function translateArticles(articles,rawCache={},opts={}){
  const cache={...rawCache,entries:{...(rawCache.entries||{})}};
  const email=opts.email||process.env.MYMEMORY_EMAIL||'';
  const fetchImpl=opts.fetchImpl||globalThis.fetch;
  const quota=Number.isFinite(opts.budget)?opts.budget:MAX_DAILY_CHARS;
  let consumed=0,translated=0,failures=0,cacheHits=0;
  const result=[];
  for(const article of articles){
    if(!ENGLISH_SOURCES.has(article.source)){
      result.push({...article,language:'pt-BR',translationStatus:'original'});continue;
    }
    const copy={...article,originalTitle:article.title,originalSummary:article.summary,language:'pt-BR'};
    let successes=0;
    for(const field of ['title','summary']){
      const original=String(article[field]||'').trim();
      if(!original){successes++;continue;}
      const h=key(original);
      const cached=cache.entries[h];
      if(cached && validTranslation(original,cached.text)){
        copy[field]=cached.text;successes++;cacheHits++;continue;
      }
      const size=Buffer.byteLength(original,'utf8');
      if(size>MAX_INPUT_BYTES || consumed+size>quota)continue;
      consumed+=size;
      try{
        const value=await requestTranslation(original,{fetchImpl,email,timeoutMs:opts.timeoutMs||9000});
        cache.entries[h]={text:value,at:new Date().toISOString()};
        copy[field]=value;successes++;
      }catch(e){
        if(/Resposta de tradução inválida ou valores alterados/.test(e.message) && consumed+size<=quota){
          consumed+=size;
          try{
            const value=await requestTranslation(original,{fetchImpl,email,timeoutMs:opts.timeoutMs||9000,languagePair:'en|pt'});
            cache.entries[h]={text:value,at:new Date().toISOString()};
            copy[field]=value;successes++;
            continue;
          }catch(second){if(opts.onError)opts.onError(`${article.source} / ${field}: segunda tentativa: ${second.message}`);}
        }else if(opts.onError)opts.onError(`${article.source} / ${field}: ${e.message}`);
      }
    }
    copy.translationStatus=successes===2?'automatica':successes===1?'parcial':'indisponivel';
    if(successes===2)translated++;else failures++;
    result.push(copy);
  }
  const recent=Object.entries(cache.entries).sort((a,b)=>String(b[1].at).localeCompare(String(a[1].at))).slice(0,500);
  cache.entries=Object.fromEntries(recent);
  cache.updatedAt=new Date().toISOString();
  return {articles:result,cache,stats:{translated,failures,cacheHits,consumed}};
}
module.exports={translateArticles,requestTranslation,validTranslation,numbersPreserved,ENGLISH_SOURCES};