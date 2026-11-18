const {getNews}=require('../lib/core');
module.exports=async function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({error:'Método não permitido'});return;}
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=900');
  try {res.status(200).json(await getNews());}
  catch(e){res.status(503).json({error:'Fontes temporariamente indisponíveis',generatedAt:new Date().toISOString(),articles:[]});}
}