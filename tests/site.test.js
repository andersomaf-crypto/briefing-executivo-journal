'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const file = p => fs.readFileSync(path.join(root,p),'utf8');

test('Arquivos essenciais do jornal existem', () => {
  for(const p of ['index.html','app.js','styles.css','manifest.webmanifest',
                   'service-worker.js','scripts/build-pages.js',
                   '.github/workflows/jornal-diario.yml']){
    assert.ok(fs.statSync(path.join(root,p)).size > 0, p);
  }
});
test('Interface usa arquivos locais e formato mobile', () => {
  const html=file('index.html');
  assert.match(html, /lang="pt-BR"/);
  assert.match(html, /viewport/);
  assert.match(html, /styles\.css/);
  assert.match(html, /app\.js/);
  assert.match(html, /manifest\.webmanifest/);
});
test('PWA tem ícones e caminhos relativos', () => {
  const p=JSON.parse(file('manifest.webmanifest'));
  assert.equal(p.display,'standalone');
  assert.ok(p.icons.length >= 2);
  for(const item of p.icons) {
    assert.match(item.src, /^\.\//);
    assert.ok(fs.existsSync(path.join(root,item.src)));
  }
});
test('Dados iniciais não exibem manchetes inventadas como atuais', () => {
  const edition=JSON.parse(file('data/latest.json'));
  assert.ok(Array.isArray(edition.articles));
  if(edition.generatedAt === null)assert.equal(edition.articles.length,0);
});
test('Rotina agenda coleta em horário de Brasília e publica pelo Pages', () => {
  const workflow=file('.github/workflows/jornal-diario.yml');
  assert.match(workflow, /30 10 \* \* \*/);
  assert.match(workflow, /actions\/configure-pages/);
  assert.match(workflow, /actions\/deploy-pages/);
});

test('Selic nunca exibe uma observação com data futura', () => {
  const {validSelic}=require('../lib/markets');
  const sample=[{data:'09/12/2026',valor:'99,99'},
                {data:'04/11/2026',valor:'13,75'},
                {data:'03/11/2026',valor:'13,75'}];
  const result=validSelic(sample,'2026-11-18');
  assert.equal(result.value,13.75);
  assert.match(result.date,/^2026-11-04/);
  assert.throws(()=>validSelic([{data:'09/12/2026',valor:'99,99'}],'2026-11-18'));
});
