(()=>{
'use strict';

const VIEW_KEY='seiban-last-view';
let restoring=false;

function currentView(){
  const active=document.querySelector('.view.active');
  return active?.id||'discover';
}
function rememberView(id){
  if(id)sessionStorage.setItem(VIEW_KEY,id);
}
function restoreView(){
  const id=sessionStorage.getItem(VIEW_KEY);
  if(!id||id==='admin')return false;
  const target=document.getElementById(id);
  if(!target)return false;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  return true;
}

// Remember normal navigation. Admin is remembered only when the user explicitly opens it.
document.addEventListener('click',e=>{
  const nav=e.target.closest('.nav button[data-view]');
  if(nav)rememberView(nav.dataset.view);
  const admin=e.target.closest('#openAdmin');
  if(admin)rememberView('admin');
},true);

async function restoreAfterReload(){
  if(restoring)return;
  restoring=true;
  try{
    const wanted=sessionStorage.getItem(VIEW_KEY)||currentView();
    if(wanted!=='admin'){
      restoreView();
      return;
    }

    const {data,error}=await db.auth.getSession();
    if(error||!data?.session?.user){
      sessionStorage.setItem(VIEW_KEY,'discover');
      restoreView();
      return;
    }
    const {data:adminRows,error:adminError}=await db.from('seiban_admins').select('user_id').eq('user_id',data.session.user.id).limit(1);
    if(adminError||!adminRows?.length){
      sessionStorage.setItem(VIEW_KEY,'discover');
      restoreView();
      return;
    }
    if(typeof showAdmin==='function')showAdmin();
    setTimeout(()=>{if(typeof window.loadAdmin==='function')window.loadAdmin().catch(err=>console.warn('Admin list reload failed',err));},50);
  }catch(err){
    console.warn('View restore failed',err);
  }finally{restoring=false;}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restoreAfterReload,{once:true});
else restoreAfterReload();

db.auth.onAuthStateChange((event,session)=>{
  if((event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session?.user&&sessionStorage.getItem(VIEW_KEY)==='admin')setTimeout(restoreAfterReload,0);
});
})();