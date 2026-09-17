(()=>{
'use strict';

let restoring=false;
async function restoreAdminAfterReload(){
  if(restoring)return;
  restoring=true;
  try{
    const {data,error}=await db.auth.getSession();
    if(error||!data?.session?.user)return;

    const {data:adminRows,error:adminError}=await db
      .from('seiban_admins')
      .select('user_id')
      .eq('user_id',data.session.user.id)
      .limit(1);

    if(adminError||!adminRows?.length)return;

    if(typeof showAdmin==='function')showAdmin();
    // showAdmin/checkAdmin may race with Safari's asynchronous session restore.
    // Explicitly refresh the lists once the verified session is available.
    setTimeout(()=>{
      if(typeof window.loadAdmin==='function')window.loadAdmin().catch(err=>console.warn('Admin list reload failed',err));
    },50);
  }catch(err){
    console.warn('Admin session restore failed',err);
  }finally{
    restoring=false;
  }
}

function scheduleRestore(){
  restoreAdminAfterReload();
  setTimeout(restoreAdminAfterReload,250);
  setTimeout(restoreAdminAfterReload,900);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',scheduleRestore,{once:true});
}else{
  scheduleRestore();
}

db.auth.onAuthStateChange((event,session)=>{
  if((event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session?.user){
    setTimeout(restoreAdminAfterReload,0);
  }
});
})();