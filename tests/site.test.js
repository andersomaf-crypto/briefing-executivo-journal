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

test('Tema editorial usa Linen, Navy e Amber e melhora a tipografia', () => {
  const css=file('styles.css');
  assert.match(css, /--paper:#F3EFE8/);
  assert.match(css, /--ink:#15233D/);
  assert.match(css, /--gold:#FFB020/);
  assert.match(css, /\.story-title\{font-size:19px;[^}]*font-weight:800/);
  assert.match(css, /\.story-summary\{font-size:16px;font-weight:400/);
});
test('Radar do trabalho aparece na interface e preserva filtros', () => {
  const html=file('index.html'),script=file('app.js');
  assert.match(html, /id="work-radar-grid"/);
  assert.match(html, /data-tab="Trabalho"/);
  assert.match(script, /state\.category==='Trabalho'/);
});

test('Avaliação de relevância com acessibilidade, armazenamento e limpeza',()=>{
 const html=file('index.html'),script=file('app.js'),css=file('styles.css');
 assert.match(html,/client-feedback\.js/);
 assert.match(html,/id="reset-feedback"/);
 assert.match(script,/Feedback\.record/);
 assert.match(script,/write\('feedback',state\.feedback\)/);
 assert.match(script,/data-feedback/);
 assert.match(css,/\.feedback-button\{min-height:44px/);
});
test('Client-feedback é publicado e precacheado no aplicativo instalado',()=>{
 assert.match(file('scripts/build-pages.js'),/client-feedback\.js/);
 assert.match(file('service-worker.js'),/client-feedback\.js/);
});
