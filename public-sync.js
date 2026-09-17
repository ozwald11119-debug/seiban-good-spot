(()=>{
'use strict';
const q=s=>document.querySelector(s);

function refreshPublishedUI(){
  try{
    if(!Array.isArray(window.SPOTS) && typeof SPOTS==='undefined') return;
    const spots = typeof SPOTS!=='undefined' ? SPOTS : window.SPOTS;
    if(typeof render==='function') render();
    const featured=q('#featured');
    if(featured && typeof featureCard==='function'){
      const remote=spots.filter(p=>p && String(p.id||'').startsWith('db-'));
      const originals=spots.filter(p=>p && p.featured && !String(p.id||'').startsWith('db-'));
      const list=[...remote.slice(0,5),...originals].slice(0,8);
      featured.innerHTML=list.map(featureCard).join('');
      if(typeof bindCards==='function') bindCards();
    }
  }catch(e){ console.warn('published UI refresh failed',e); }
}

async function syncPublished(){
  try{
    if(typeof loadRemoteSpots==='function') await loadRemoteSpots();
    refreshPublishedUI();
  }catch(e){ console.warn('published spot sync failed',e); }
}

document.addEventListener('visibilitychange',()=>{ if(!document.hidden) syncPublished(); });
window.addEventListener('pageshow',syncPublished);
window.addEventListener('focus',syncPublished);
setTimeout(syncPublished,300);
setTimeout(syncPublished,1500);
})();
