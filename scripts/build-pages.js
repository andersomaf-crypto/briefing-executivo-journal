#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),out=path.join(root,'.site');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','app.js','styles.css','service-worker.js','manifest.webmanifest'])fs.copyFileSync(path.join(root,file),path.join(out,file));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
fs.cpSync(path.join(root,'data'),path.join(out,'data'),{recursive:true});
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Site preparado em .site/ (sem testes, código de servidor ou arquivos privados).');