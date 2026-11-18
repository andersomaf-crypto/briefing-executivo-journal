'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,'http://localhost');
    if(u.pathname==='/api/news'||u.pathname==='/api/markets'){
      if(process.env.DEMO==='1'){res.setHeader('Content-Type','application/json; charset=utf-8');const filename=u.pathname==='/api/news'?'fixture-news.json':'fixture-markets.json';return res.end(fs.readFileSync(path.join(root,'tests',filename),'utf-8'));}
      res.status=(n)=>{res.statusCode=n;return res};res.json=(v)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(v));};
      return await require('./api/'+u.pathname.split('/').pop())(req,res);
    }
    let p=path.normalize(decodeURIComponent(u.pathname)).replace(/^[/\\]+/,'');if(!p||p==='.')p='index.html';
    const file=path.resolve(root,p);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Não encontrado')}
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  }catch(e){res.writeHead(500);res.end('Erro')}
});
server.listen(Number(process.env.PORT||3210),'127.0.0.1',()=>console.log('Briefing digital: http://127.0.0.1:'+(process.env.PORT||3210)));