const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseFeed,plain,selectItems,safeUrl}=require('../lib/core');
const feed={name:'Agência Brasil',category:'Economia',priority:3};
const now=new Date().toUTCString();
const sample=`<?xml version="1.0"?><rss version="2.0"><channel><item><title>Copom anuncia taxa Selic &amp; inflação</title><link>https://example.com/materia</link><description><![CDATA[<p>Banco Central anuncia nova taxa.</p>]]></description><pubDate>${now}</pubDate></item></channel></rss>`;
test('RSS gera link original, sem HTML e data verdadeira',()=>{const a=parseFeed(sample,feed);assert.equal(a.length,1);assert.equal(a[0].category,'Economia');assert.equal(a[0].title,'Copom anuncia taxa Selic & inflação');assert.equal(a[0].url,'https://example.com/materia');assert.equal(a[0].summary,'Banco Central anuncia nova taxa.');assert.ok(a[0].why)});
test('URL insegura é rejeitada',()=>{assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('file:///etc/passwd'),'');assert.equal(safeUrl('http://localhost/a'),'')});
test('Matéria sem data não vira notícia verificada',()=>{assert.equal(parseFeed(sample.replace(/<pubDate>.*?<\/pubDate>/,''),feed).length,0)});
test('Notícias acima de 48 horas saem da edição',()=>{const a=parseFeed(sample,feed)[0];assert.equal(selectItems([{...a,published:new Date(0).toISOString()}],48).length,0)});
test('HTML é removido',()=>assert.equal(plain('<div>A &amp; B <strong>sim</strong></div>'),'A & B sim'));
test('Decodifica RSS em ISO-8859-1 sem corromper acentuação',()=>{
 const {decodeFeedBuffer}=require('../lib/core');
 const original='<?xml version="1.0" encoding="ISO-8859-1"?><rss><title>Crédito, contratação e reclamações</title></rss>';
 const source=Buffer.from(original,'latin1');
 const out=decodeFeedBuffer(source,'application/xml');
 assert.equal(out,original);
});
test('Não repete quatro manchetes sobre o mesmo evento e mesma fonte',()=>{
 const {selectItems}=require('../lib/core');
 const now=new Date().toISOString();
 const x=Array.from({length:5},(_,i)=>({title:'Nvidia anuncia movimentação '+i,category:'IA',priority:4,source:i<3?'Fonte A':'Fonte B',published:now,url:'https://example.com/'+i}));
 const other={title:'CVM debate qualidade na distribuição',category:'Bancos',priority:3,source:'CVM',published:now,url:'https://example.com/cvm'};
 const selected=selectItems([...x,other],48,10);
 assert.ok(selected.filter(a=>/Nvidia/.test(a.title)).length<=2);
 assert.ok(selected.some(a=>a.title===other.title));
});

test('Folha entrega link direto à fonte original em vez de redirecionador RSS',()=>{
 const direct='https://www1.folha.uol.com.br/mercado/2026/11/exemplo.shtml';
 const redir='https://redir.folha.com.br/redir/online/mercado/rss091/*'+direct;
 assert.equal(safeUrl(redir),direct);
});
