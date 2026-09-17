(()=>{
'use strict';
const q=s=>document.querySelector(s);
let baseSpots=null;

function getSpots(){
  try{return typeof SPOTS!=='undefined'?SPOTS:window.SPOTS}catch{return window.SPOTS}
}
function setSpots(next){
  try{SPOTS=next}catch(e){window.SPOTS=next}
}
function rememberBase(){
  if(baseSpots)return;
  const spots=getSpots();
  if(Array.isArray(spots)) baseSpots=spots.filter(p=>p&&!String(p.id||'').startsWith('db-'));
}
function mapRemote(r){return {id:'db-'+r.id,dbid:r.id,area:r.municipality,name:r.name,genre:r.category||'その他',emoji:'📍',visual:'food',lead:r.description||'西播磨で見つけたおすすめスポット。',desc:r.description||'',tags:[r.category||'おすすめ'],website:r.website_url,instagram:r.instagram_url,post:r.post_url,map:r.map_url,images:Array.isArray(r.image_urls)?r.image_urls:[]}}
function refreshPublishedUI(){
  try{
    const spots=getSpots();if(!Array.isArray(spots))return;
    if(typeof render==='function')render();
    const featured=q('#featured');
    if(featured&&typeof featureCard==='function'){
      const remote=spots.filter(p=>p&&String(p.id||'').startsWith('db-'));
      const originals=spots.filter(p=>p&&p.featured&&!String(p.id||'').startsWith('db-'));
      featured.innerHTML=[...remote.slice(0,5),...originals].slice(0,8).map(featureCard).join('');
      if(typeof bindCards==='function')bindCards();
    }
  }catch(e){console.warn('published UI refresh failed',e)}
}
async function syncPublished(){
  try{
    rememberBase();
    const {data,error}=await db.from('seiban_spots').select('*').eq('is_published',true).order('created_at',{ascending:false});
    if(error)throw error;
    const remote=(data||[]).map(mapRemote);
    const names=new Set(remote.map(x=>x.name));
    const base=(baseSpots||[]).filter(x=>!names.has(x.name));
    setSpots([...base,...remote]);
    try{remoteSpots=remote}catch(e){window.remoteSpots=remote}
    refreshPublishedUI();
  }catch(e){console.warn('published spot sync failed',e)}
}
window.syncPublishedSpots=syncPublished;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPublished()});
window.addEventListener('pageshow',syncPublished);
window.addEventListener('focus',syncPublished);
setTimeout(syncPublished,300);
setTimeout(syncPublished,1500);
})();
