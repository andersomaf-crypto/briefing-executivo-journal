const CACHE='briefing-journal-shell-v3-linen-navy-amber';
const SHELL=['./','./index.html','./app.js','./styles.css','./manifest.webmanifest','./assets/icon.svg','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
 self.clients.claim();
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 // Network-first. On failed requests, use the last cached page or dataset.
 event.respondWith(fetch(request).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
   return response;
 }).catch(async()=>await caches.match(request)|| (request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});