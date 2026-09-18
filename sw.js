const CACHE='nishiharima-guide-v21';
const ASSETS=['./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./merrywidow-1.jpg','./merrywidow-2.jpg','./coneru-1.jpg','./coneru-2.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET') return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
   return;
 }
 const u=new URL(e.request.url);
 if(u.pathname.endsWith('.js')||u.pathname.endsWith('.html')||u.pathname.endsWith('/sw.js')){
   e.respondWith(fetch(e.request,{cache:'no-store'}));
   return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;})));
});