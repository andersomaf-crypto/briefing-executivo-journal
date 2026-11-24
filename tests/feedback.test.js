'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fb=require('../client-feedback');
const time=Date.now();
function story(id,title,category='Bancos'){return {id,title,summary:'',category};}
test('Marcação, troca de voto e segundo toque para desfazer',()=>{
 const a=story('a','Banco Central apura reclamações dos clientes');
 let h=fb.record({},a,1,time);
 assert.equal(fb.rating(h,a),1);
 h=fb.record(h,a,-1,time);
 assert.equal(fb.rating(h,a),-1);
 h=fb.record(h,a,-1,time);
 assert.equal(fb.rating(h,a),0);
 assert.equal(fb.count(h),0);
});
test('Aprende interesses correlatos sem apagar itens ou alterar matérias',()=>{
 const a=story('a','CVM reforça regras de suitability de investimentos');
 const b=story('b','CVM anuncia novas regras para distribuição de investimentos');
 const unrelated=story('c','ATP Finals: João Fonseca vence semifinal','Tênis');
 const h=fb.record({},a,1,time);
 assert.ok(fb.bonus(b,h,time)>fb.bonus(unrelated,h,time));
 assert.equal(fb.prioritize([unrelated,b],h).length,2);
 assert.equal(fb.prioritize([unrelated,b],h)[0].id,'b');
});
test('Não reclassifica notícia, nem usa votos antigos fora de 120 dias',()=>{
 const a=story('a','Bancos avançam com Open Finance');
 const b=story('b','Open Finance melhora atendimento nos bancos');
 const h=fb.record({},a,1,time-130*86400000);
 assert.equal(fb.bonus(b,h,time),0);
 assert.equal(b.category,'Bancos');
});
test('Limita histórico e ignora registros malformados',()=>{
 let h={invalid:{value:7,at:time}};
 const a=story('a','Inflação e Selic alteram juros');
 h=fb.record(h,a,1,time);
 assert.equal(fb.count(h),1);
 assert.equal(fb.rating(h,a),1);
});
test('Votos negativos rebaixam matérias semelhantes, mas não escondem',()=>{
 const a=story('a','Resultados trimestrais da fintech e investimento');
 const b=story('b','Resultados de fintech e investimento','Bancos');
 const c=story('c','Banco melhora atendimento e resolução de reclamações','Bancos');
 const h=fb.record({},a,-1,time);
 const list=fb.prioritize([b,c],h);
 assert.equal(list.length,2);
 assert.equal(list[0].id,'c');
});
