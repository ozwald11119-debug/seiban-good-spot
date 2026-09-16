(()=>{
'use strict';

async function restoreAdminAfterReload(){
  try{
    const {data,error}=await db.auth.getSession();
    if(error||!data?.session?.user)return;

    // Confirm that the signed-in user is actually registered as a Seiban admin.
    // RLS on seiban_admins only exposes the caller's own row.
    const {data:adminRows,error:adminError}=await db
      .from('seiban_admins')
      .select('user_id')
      .eq('user_id',data.session.user.id)
      .limit(1);

    if(adminError||!adminRows?.length)return;

    // A browser reload normally returns index.html to the public "discover" view.
    // Restore the admin view when a valid admin session already exists.
    if(typeof showAdmin==='function')showAdmin();
  }catch(err){
    console.warn('Admin session restore failed',err);
  }
}

// Supabase restores its persisted session asynchronously on Safari/iOS.
// Run once after the page scripts are ready, then again when the initial
// signed-in state is announced. The guard in showAdmin/checkAdmin is idempotent.
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',restoreAdminAfterReload,{once:true});
}else{
  restoreAdminAfterReload();
}

db.auth.onAuthStateChange((event,session)=>{
  if(event==='INITIAL_SESSION'&&session?.user){
    setTimeout(restoreAdminAfterReload,0);
  }
});
})();