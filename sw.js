const CACHE='nishiharima-guide-v6';
const ASSETS=['./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./merrywidow-1.jpg','./merrywidow-2.jpg','./coneru-1.jpg','./coneru-2.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(async resp=>{
   const type=resp.headers.get('content-type')||'';
   if(!type.includes('text/html'))return resp;
   let html=await resp.text();
   html=html.replace("msg.textContent='送信できませんでした。少し時間を置いてもう一度お試しください。';console.error(error);","msg.textContent='送信エラー：'+(error.message||error.code||JSON.stringify(error));console.error(error);");
   return new Response(html,{status:resp.status,statusText:resp.statusText,headers:resp.headers});
  }).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;})));
});
