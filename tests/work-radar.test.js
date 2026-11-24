'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {workAssessment,selectWork}=require('../lib/work-radar');
const today=new Date().toISOString();
const base={published:today,url:'https://example.com/materia',source:'Folha',category:'Economia'};
test('Seleciona reclamações bancárias para o radar profissional',()=>{
 const a=workAssessment({...base,title:'Banco Central apresenta regras sobre reclamações de clientes bancários'});
 assert.ok(a&&a.score>=8);assert.match(a.angle,/Reclamações/);
});
test('Seleciona qualidade de atendimento em bancos e conduta na distribuição de investimentos',()=>{
 const a=workAssessment({...base,title:'Bancos ampliam inteligência artificial no atendimento a clientes'});
 const b=workAssessment({...base,title:'CVM reforça suitability na distribuição de investimentos'});
 assert.ok(a?.score>=8);assert.ok(b?.score>=8);
});
test('Não classifica dólar, resultados genéricos ou tecnologia isolada como conduta comercial',()=>{
 for(const title of ['Dólar cai e Ibovespa sobe em São Paulo','Empresas de tecnologia investem em IA','Banco apresenta resultado trimestral'])
   assert.equal(workAssessment({...base,title,summary:''}),null,title);
});
test('Radar não inventa itens e elimina duplicações e notícias velhas',()=>{
 const title='Reclamações de clientes de bancos sobem no trimestre';
 const a={...base,title};const b={...a,url:'https://example.com/materia2'};
 assert.equal(selectWork([a,b,{...base,published:'2020-01-01T00:00:00Z',url:'https://example.com/velha',title:'Banco Central regulamenta reclamações'}]).length,1);
});
test('Recupera pauta regulatória da última quinzena, mas não de meses anteriores',()=>{
 const published=new Date(Date.now()-10*24*3600*1000).toISOString();
 const item={...base,title:'Banco Central reforça proteção ao consumidor na contratação de crédito',published,url:'https://example.com/bcb'};
 assert.equal(selectWork([item],336,4).length,1);
 assert.equal(selectWork([item],48,4).length,0);
});
