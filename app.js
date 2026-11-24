/* Briefing Executivo / jornal digital — versão 1.4 · GitHub Pages */
(() => {
'use strict';
const KEY='briefing.executivo.v1.';
const Feedback=window.BriefingFeedback;
const CATS=['Todas','Trabalho','Economia','Bancos','IA','Bitcoin','Política','Geopolítica','Tênis','Salvos'];
const $=s=>document.querySelector(s);
const state={articles:[],markets:null,meta:{},category:'Todas',query:'',expanded:new Set(),saved:new Set(read('saved',[])),savedArticles:read('saved-articles',{}),feedback:Feedback.sanitize(read('feedback',{})),archive:read('archive',{}),remoteIndex:[],viewDate:null,loading:true,live:true};
function read(key,def){try{return JSON.parse(localStorage.getItem(KEY+key))??def}catch{return def}}
function write(key,val){try{localStorage.setItem(KEY+key,JSON.stringify(val));return true}catch{return false}}
function esc(input){return String(input??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeLink(raw){try{const u=new URL(raw);return ['http:','https:'].includes(u.protocol)?u.href.replace(/&/g,'&amp;').replace(/"/g,'%22'):'#'}catch{return '#'}}
function formatDate(raw,opts={day:'2-digit',month:'short'}){const d=new Date(raw);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',...opts}).format(d):'—'}
function localDate(raw){const d=new Date(raw);if(!Number.isFinite(d.getTime()))return null;return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function today(){return localDate(new Date())}
function setStatus(text,level='neutral'){const e=$('#status-bar');e.textContent=text;e.className='notice notice-'+level;}
function getCategory(a){return a.category==='Trabalho'?'Bancos':CATS.includes(a.category)?a.category:'Economia'}
function asNum(v){return (v===null||v===undefined||v==='')?null:(Number.isFinite(Number(v))?Number(v):null)}
function number(v,digits=0){const n=asNum(v);return n===null?'—':new Intl.NumberFormat('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n)}
function markets(){const items=[
  ['ibovespa','IBOVESPA','',0],['dolar','DÓLAR','R$ ',3],['bitcoin','BITCOIN','US$ ',0],['selic','SELIC','',2]
];const data=state.markets?.values||{};$('#markets-grid').innerHTML=items.map(([id,label,prefix,prec])=>{const it=data[id];const value=it?prefix+number(it.value,prec)+(id==='selic'?'%':''):'—';const ch=it?.change;const cls=ch===null||ch===undefined||id==='selic'?'neutral':ch<0?'down':'up';const sign=ch>0?'+':'';const change=ch===null||ch===undefined||id==='selic'?(id==='selic'?'Taxa-meta vigente':'Variação indisponível'):`${sign}${number(ch,2)}%`;return `<div class="metric"><div class="metric-title"><span>${label}</span><span>●</span></div><strong>${esc(value)}</strong><span class="diff ${cls}">${esc(change)}</span><span class="metric-foot">${it?`${esc(it.source)} · ${formatDate(it.date)}`:'Sem atualização verificada'}</span></div>`}).join('');const times=Object.values(data).filter(Boolean).map(x=>new Date(x.date).getTime()).filter(Number.isFinite);$('#markets-asof').textContent=times.length?'Cotação / fechamento por indicador':'Aguardando dados confirmados';}
function articleDateLine(a){return `${esc(getCategory(a))} · ${esc(a.source)} · ${formatDate(a.published)}`}
function nav(){const n=$('#category-filter');n.innerHTML=CATS.map(c=>`<button data-category="${esc(c)}" class="chip ${state.category===c?'active':''}" aria-pressed="${state.category===c}">${esc(c)}</button>`).join('');document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('bottom-active',el.dataset.tab===state.category));}
function lead(){const available=state.articles.slice(0,3);if(!available.length){$('#lead-grid').innerHTML=`<div class="empty-box" style="grid-column:1/-1">Sem manchetes recentes confirmadas. Atualize para consultar as fontes novamente.</div>`;return}const [a,b,c]=available;$('#lead-grid').innerHTML=`<div class="hero"><span class="tag">01 / ${esc(getCategory(a))}</span><h2>${esc(a.title)}</h2><p>${esc(a.summary||'Leia a matéria original.')}</p><div class="hero-bottom"><span class="micro" style="color:#b5d6be">${esc(a.source)} · ${formatDate(a.published)}</span><a target="_blank" rel="noopener noreferrer" href="${safeLink(a.url)}">Ler matéria ↗</a></div></div><div class="lead-side">${[b,c].filter(Boolean).map((x,i)=>`<div class="lead-item"><span class="tag">0${i+2} / ${esc(getCategory(x))}</span><h3>${esc(x.title)}</h3><a target="_blank" rel="noopener noreferrer" href="${safeLink(x.url)}">${esc(x.source)} · Ler ↗</a></div>`).join('')}</div>`;}
function radar(){
  const root=$('#work-radar-grid');
  const list=Feedback.prioritize(state.articles.filter(a=>a.workRelated===true).sort((a,b)=>(b.workScore||0)-(a.workScore||0)),state.feedback).slice(0,4);
  if(!list.length){root.innerHTML='<div class="radar-empty">Nenhuma matéria recente passou pelo filtro profissional nesta edição. Não completamos o radar com assuntos sem relação comprovável.</div>';return;}
  root.innerHTML=list.map(a=>`<article class="radar-card"><div class="radar-card-top"><span>RELEVÂNCIA PROFISSIONAL</span><span>${formatDate(a.published)}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.summary||'Consulte a fonte original.')}</p><div class="radar-context"><strong>Conexão:</strong> ${esc(a.workAngle||'Qualidade e governança comercial no setor financeiro')}</div><a href="${safeLink(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.source)} · Ler fonte original ↗</a>${feedbackHTML(a,true)}</article>`).join('');
}

function feedbackHTML(article,compact=false){
 const vote=Feedback.rating(state.feedback,article),id=esc(article.id);
 return `<div class="feedback-controls ${compact?'feedback-compact':''}" role="group" aria-label="Avaliar relevância desta notícia">
    ${compact?'':'<span class="feedback-question">Esta notícia foi relevante?</span>'}
    <button type="button" class="feedback-button ${vote===1?'feedback-positive':''}" data-feedback="1" data-article-id="${id}" aria-pressed="${vote===1}">✓ Relevante</button>
    <button type="button" class="feedback-button ${vote===-1?'feedback-negative':''}" data-feedback="-1" data-article-id="${id}" aria-pressed="${vote===-1}">− Não relevante</button>
  </div>`;
}
function applyFeedbackVote(btn){
 const id=btn?.dataset?.articleId, value=Number(btn?.dataset?.feedback);
 if(!id||![1,-1].includes(value))return;
 const article=state.articles.find(a=>a.id===id)||Object.values(state.savedArticles).find(a=>a.id===id);
 if(!article)return;
 state.feedback=Feedback.record(state.feedback,article,value);
 const stored=write('feedback',state.feedback);
 present();
 setStatus(stored?'Avaliação salva neste aparelho. A ordem de notícias semelhantes será ajustada.':'Avaliação aplicada nesta sessão, mas o navegador não permitiu armazená-la.',stored?'success':'neutral');
}
function storyHTML(a,index){const id=esc(a.id),open=state.expanded.has(a.id),saved=state.saved.has(a.id);return `<article class="story" data-story-id="${id}"><button type="button" class="story-main" data-toggle="${id}" aria-expanded="${open}"><div class="story-top"><span class="story-meta">${articleDateLine(a)}${a.workRelated?' · Radar profissional':''}</span><span class="story-arrow">${open?'⌃':'⌄'}</span></div><h3 class="story-title">${esc(a.title)}</h3><p class="story-summary">${esc(a.summary)}</p></button>${feedbackHTML(a)}${open?`<div class="story-detail"><p class="why"><strong>Por que importa:</strong> ${esc(a.why||'Confira o contexto diretamente na fonte.')}</p>${a.translationStatus==='automatica'?'<p class="translation-info">Tradução automática para português do Brasil; fonte original preservada.</p>':a.translationStatus==='parcial'?'<p class="translation-info">Tradução parcial disponível; confira a fonte original.</p>':a.translationStatus==='indisponivel'?'<p class="translation-info">Tradução indisponível nesta edição; texto original exibido.</p>':''}<div class="story-actions"><a class="source-link" target="_blank" rel="noopener noreferrer" href="${safeLink(a.url)}">${esc(a.source)} · Fonte original ↗</a><button class="save-button ${saved?'saved':''}" data-save="${id}" aria-pressed="${saved}">${saved?'★ Salvo':'☆ Salvar'}</button></div></div>`:''}</article>`}
function filterArticles(){let a=state.articles;if(state.category==='Salvos')a=Object.values(state.savedArticles).filter(validateArticle).sort((x,y)=>y.published.localeCompare(x.published));else if(state.category==='Trabalho')a=a.filter(x=>x.workRelated===true);else if(state.category!=='Todas')a=a.filter(x=>getCategory(x)===state.category);if(state.query)a=a.filter(x=>[x.title,x.summary,x.category,x.source].join(' ').toLocaleLowerCase('pt-BR').includes(state.query));return a;}
function news(){let items=filterArticles();$('#results-count').textContent=`${items.length} ${items.length===1?'notícia':'notícias'}`;$('#sidebar-count').textContent=state.articles.length;$('#saved-count').textContent=state.saved.size;$('#archive-count').textContent=Object.keys(state.archive).length;$('#feedback-count').textContent=Feedback.count(state.feedback);$('#editoria-title').textContent=state.viewDate?`Edição de ${formatDate(state.viewDate+'T12:00:00')}`:(state.category==='Todas'?'Todas as editorias':state.category==='Salvos'?'Meus salvos':state.category);const list=$('#news-list');if(!items.length){list.innerHTML=`<div class="empty-box">${state.category==='Salvos'?'Nenhuma notícia salva. Abra uma matéria e toque em ☆ Salvar.':state.query?'Nenhum resultado para esta busca.':'Nenhuma notícia recente nesta editoria.'}</div>`;return}let html='';
  if(state.category==='Todas'&&!state.query){
    // Editorias contíguas, ordenadas pela relevância da primeira notícia.
    const groups=new Map();for(const item of items){const cat=getCategory(item);if(!groups.has(cat))groups.set(cat,[]);groups.get(cat).push(item)}
    for(const [cat,stories] of groups){html+=`<div class="article-group-label">${esc(cat)}</div>`;Feedback.prioritize(stories,state.feedback).forEach((item,i)=>html+=storyHTML(item,i));}
  }else (state.category==='Salvos'?items:Feedback.prioritize(items,state.feedback)).forEach((a,i)=>html+=storyHTML(a,i));
  list.innerHTML=html;}
function archive(){const dates=new Set([...Object.keys(state.archive),...state.remoteIndex.map(x=>x.date)]);$('#archive-count').textContent=dates.size;$('#saved-count').textContent=state.saved.size;}
function archiveList(){
  state.category='Todas';nav();$('#editoria-title').textContent='Arquivo de edições';
  const remote=new Map(state.remoteIndex.map(x=>[x.date,x]));
  const dates=[...new Set([...Object.keys(state.archive),...remote.keys()])].sort().reverse();
  $('#results-count').textContent=dates.length+' edições';
  $('#news-list').innerHTML=dates.length?dates.map(d=>`<button class="archive-item" data-history="${esc(d)}"><span>${formatDate(d+'T12:00:00',{day:'numeric',month:'long',year:'numeric'})}</span><small>${remote.get(d)?.count||state.archive[d]?.articles?.length||0} notícias ›</small></button>`).join(''):`<div class="empty-box">Ainda não há edições salvas. O histórico começa após a primeira atualização confirmada.</div>`;
  $('#back-to-now').classList.remove('hidden');
  window.scrollTo({top:$('#news-list').getBoundingClientRect().top+scrollY-120,behavior:'smooth'});
}
function present(){
  nav();markets();lead();radar();news();archive();
  const ref=state.viewDate?state.viewDate+'T12:00:00':(state.meta.generatedAt||null);
  $('#edition-date').textContent=ref?(state.viewDate?'ARQUIVO · ':'EDIÇÃO · ')+formatDate(ref,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toLocaleUpperCase('pt-BR'):'AGUARDANDO PRIMEIRA EDIÇÃO VERIFICADA';
  $('#issue-count').textContent=`${state.articles.length} NOTÍCIAS · LEITURA ~${Math.max(2,Math.ceil(state.articles.length/2.5))} MIN`;
  $('#footer-stamp').textContent=state.meta.generatedAt?`DADOS: ${formatDate(state.meta.generatedAt,{dateStyle:'short',timeStyle:'short'})}`:'SEM DADOS RECENTES';
  $('#back-to-now').classList.toggle('hidden',!state.viewDate);
  events();
}
function setCategory(cat){if(state.viewDate){const last=read('last-news',null);state.articles=(last?.articles||[]).filter(validateArticle);state.meta=last?.meta||{};state.markets=read('last-markets',null);state.viewDate=null;}state.category=cat;state.query='';$('#search').value='';$('#clear-search').hidden=true;present();if(window.innerWidth<621)window.scrollTo({top:$('#category-filter').getBoundingClientRect().top+scrollY-85,behavior:'smooth'});}
async function get(url){const controller=new AbortController();const id=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(url,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(id)}}
function snapshot(){if(!state.articles.length)return;let key=state.meta.editionDate||localDate(state.meta.generatedAt);if(!key)return;state.archive[key]={articles:state.articles,meta:state.meta,markets:state.markets};const keys=Object.keys(state.archive).sort().reverse();for(const k of keys.slice(30))delete state.archive[k];write('archive',state.archive);}
function validateArticle(a){return a && typeof a.title==='string' && a.title.length && typeof a.url==='string' && safeLink(a.url)!=='#' && typeof a.id==='string';}
async function update(force=false){
  setStatus('Consultando a edição e os indicadores disponíveis...');$('#refresh-btn').disabled=true;
  let updated=false,errors=[];
  const results=await Promise.allSettled([
    get('./data/latest.json').then(d=>d.articles?.length?d:get('./api/news')).catch(()=>get('./api/news')),
    get('./data/markets.json').then(d=>Object.keys(d.values||{}).length?d:get('./api/markets')).catch(()=>get('./api/markets')),
    get('./data/index.json')
  ]);
  if(results[0].status==='fulfilled' && Array.isArray(results[0].value.articles) && results[0].value.articles.length){
    const data=results[0].value;
    state.articles=data.articles.filter(validateArticle);state.meta=data;
    updated=!!state.articles.length;
    if(updated)write('last-news',{articles:state.articles,meta:state.meta});
    if(data.errors?.length)errors.push(`${data.errors.length} feed(s) não responderam`);
  }else{
    const old=read('last-news',null);
    if(old?.articles?.length){state.articles=old.articles.filter(validateArticle);state.meta=old.meta||{};errors.push('Exibindo edição anterior armazenada: sem nova atualização confirmada');}
    else{state.articles=[];state.meta={};errors.push('Notícias ainda indisponíveis. Aguarde a primeira coleta verificada.');}
  }
  if(results[1].status==='fulfilled' && results[1].value.values){
    state.markets=results[1].value;write('last-markets',state.markets);
    if(Object.values(state.markets.values).some(x=>x===null))errors.push('Alguns indicadores indisponíveis');
  }else{state.markets=read('last-markets',null);errors.push('Mercado sem nova atualização');}
  if(results[2].status==='fulfilled' && Array.isArray(results[2].value.editions)){
    state.remoteIndex=results[2].value.editions.filter(x=>/^\d{4}-\d\d-\d\d$/.test(x.date));
  }
  state.viewDate=null;state.loading=false;snapshot();present();
  const stale=state.meta.generatedAt && localDate(state.meta.generatedAt)!==today();
  if(state.meta.demo){setStatus('DEMONSTRAÇÃO: notícias e indicadores de exemplo, não dados ao vivo.','neutral');}
  else if(updated){
    const date=formatDate(state.meta.generatedAt,{dateStyle:'short',timeStyle:'short'});
    setStatus(`${stale?'EDIÇÃO ANTERIOR — ':'Edição verificada — '}${state.articles.length} notícias coletadas em ${date}. ${errors.join('; ')}`,stale||errors.length?'neutral':'success');
  }else setStatus(errors.join('; '),'error');
  $('#refresh-btn').disabled=false;write('last-check',Date.now());
}
function restore(){state.viewDate=null;const last=read('last-news',null);if(last){state.articles=(last.articles||[]).filter(validateArticle);state.meta=last.meta||{}}state.markets=read('last-markets',null);state.category='Todas';present();update();}
function exportEdition(){const data={editionDate:state.viewDate||state.meta.editionDate||localDate(state.meta.generatedAt)||today(),generatedAt:state.meta.generatedAt||null,articles:state.articles,markets:state.markets,disclaimer:'Dados do RSS e fontes externas. Sem validação jornalística independente.'};const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=`briefing-executivo-${data.editionDate}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function share(){if(navigator.share){navigator.share({title:'Briefing Executivo',text:'Meu jornal digital executivo',url:location.href}).catch(()=>{});}else if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(()=>setStatus('Link copiado.','success'),()=>setStatus('Não foi possível copiar o link.','error'));}else setStatus('Compartilhe a URL exibida na barra do navegador.');}
function events(){
  const list=Array.isArray(state.meta.events)?state.meta.events:[];
  const valid=list.filter(x=>x && x.verified===true && Date.parse(x.datetime)>Date.now() && safeLink(x.url)!=='#').slice(0,3);
  $('#agenda-list').innerHTML=valid.length?valid.map(x=>`<a class="agenda-item" target="_blank" rel="noopener noreferrer" href="${safeLink(x.url)}"><strong>${esc(x.title)}</strong> · ${formatDate(x.datetime,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</a>`).join(''):`<div class="agenda-empty">Nenhum acontecimento futuro foi confirmado nas fontes desta edição. Consulte os calendários oficiais abaixo.</div>`;
}
function bind(){ $('#work-radar-filter').addEventListener('click',()=>setCategory('Trabalho'));$('#refresh-btn').addEventListener('click',()=>update(true));$('#share-btn').addEventListener('click',share);$('#category-filter').addEventListener('click',e=>{const btn=e.target.closest('[data-category]');if(btn)setCategory(btn.dataset.category)});$('#bottom-bar').addEventListener('click',e=>{const btn=e.target.closest('[data-tab]');if(btn)setCategory(btn.dataset.tab)});$('#search').addEventListener('input',e=>{state.query=e.target.value.trim().toLocaleLowerCase('pt-BR');$('#clear-search').hidden=!state.query;news()});$('#clear-search').addEventListener('click',()=>{$('#search').value='';state.query='';$('#clear-search').hidden=true;news()});$('#work-radar-grid').addEventListener('click',e=>{const btn=e.target.closest('[data-feedback]');if(btn)applyFeedbackVote(btn);});
$('#news-list').addEventListener('click',async e=>{const fb=e.target.closest('[data-feedback]');if(fb){applyFeedbackVote(fb);return;}const toggle=e.target.closest('[data-toggle]');const save=e.target.closest('[data-save]');const history=e.target.closest('[data-history]');if(toggle){const id=toggle.dataset.toggle;state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);news()}if(save){const id=save.dataset.save;if(state.saved.has(id)){state.saved.delete(id);delete state.savedArticles[id]}else{const item=state.articles.find(x=>x.id===id);if(item){state.saved.add(id);state.savedArticles[id]=item}}write('saved',[...state.saved]);write('saved-articles',state.savedArticles);news();archive()}if(history){const date=history.dataset.history;let data=state.archive[date];if(!data){try{const remotely=await get('./data/arquivo/'+encodeURIComponent(date)+'.json');if(remotely?.articles?.length){data={articles:remotely.articles,meta:remotely,markets:state.markets};}}catch{setStatus('Arquivo remoto indisponível nesta consulta.','error')}}if(data){state.viewDate=date;state.articles=(data.articles||[]).filter(validateArticle);state.markets=data.markets||null;state.meta=data.meta||{};state.category='Todas';state.expanded.clear();present();}}});$('#show-favorites').addEventListener('click',()=>setCategory('Salvos'));$('#show-history').addEventListener('click',archiveList);$('#export-btn').addEventListener('click',exportEdition);$('#reset-feedback').addEventListener('click',()=>{if(!Feedback.count(state.feedback))return;if(!window.confirm('Limpar todas as avaliações de relevância neste aparelho? Favoritos e histórico serão mantidos.'))return;state.feedback={};write('feedback',state.feedback);present();setStatus('Avaliações locais limpas. Favoritos e histórico preservados.','success');});$('#back-to-now').addEventListener('click',restore);window.addEventListener('scroll',()=>{const h=document.documentElement;const den=h.scrollHeight-h.clientHeight;$('#reading-progress').style.width=(den?Math.max(0,Math.min(100,h.scrollTop/den*100)):0)+'%';},{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!state.viewDate&&Date.now()-read('last-check',0)>30*60*1000)update()});window.addEventListener('online',()=>{if(!state.viewDate)update()});}
function start(){bind();events();const last=read('last-news',null);if(last){state.articles=(last.articles||[]).filter(validateArticle);state.meta=last.meta||{};state.markets=read('last-markets',null);present()}else{nav()}update();if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}}
start();
})();