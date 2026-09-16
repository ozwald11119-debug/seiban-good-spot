const CACHE='nishiharima-guide-v7';
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
   const patch=`<script>
(function(){
 const form=document.getElementById('recommendForm');
 if(!form)return;
 form.addEventListener('submit',async function(e){
  e.preventDefault();e.stopImmediatePropagation();
  const msg=document.getElementById('recommendMsg');
  const btn=form.querySelector('button[type="submit"]');
  if(btn.disabled)return;
  btn.disabled=true;btn.textContent='送信中…';msg.textContent='送信中…';
  const f=new FormData(form);
  const payload={spot_name:String(f.get('spot_name')||'').trim(),municipality:String(f.get('municipality')||''),category:String(f.get('category')||'').trim()||null,recommendation:String(f.get('recommendation')||'').trim(),url:String(f.get('url')||'').trim()||null,nickname:String(f.get('nickname')||'').trim()||null,status:'pending'};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  try{
   const key='sb_publishable_VAvl9iXOGE6UuKodBJNjjg_3nOKmPFo';
   const r=await fetch('https://agfelycqtgmtbrmwtnoc.supabase.co/rest/v1/seiban_recommendations',{method:'POST',headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(payload),signal:controller.signal});
   clearTimeout(timer);
   if(!r.ok)throw new Error((await r.text())||('HTTP '+r.status));
   form.reset();msg.textContent='ありがとう！おすすめ情報を受け付けました。';btn.textContent='送信しました';
  }catch(err){
   clearTimeout(timer);msg.textContent=err.name==='AbortError'?'通信確認に時間がかかっています。重複防止のため、いったん再送せずお待ちください。':'送信エラー：'+err.message;btn.disabled=false;btn.textContent='おすすめを送る';
  }
 },true);
})();
<\/script>`;
   html=html.replace('</body>',patch+'</body>');
   return new Response(html,{status:resp.status,statusText:resp.statusText,headers:resp.headers});
  }).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;})));
});
