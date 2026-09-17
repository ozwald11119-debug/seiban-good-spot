(()=>{
'use strict';

window.togglePublish=async(id,next)=>{
  const label=next?'公開':'非公開';
  if(!next&&!confirm('このスポットを非公開にしますか？\n一般ページからは表示されなくなります。'))return;

  const {data:sessionData}=await db.auth.getSession();
  if(!sessionData?.session?.user){
    alert('管理者セッションが切れています。もう一度ログインしてください。');
    if(typeof checkAdmin==='function')checkAdmin();
    return;
  }

  const {data,error}=await db.rpc('seiban_admin_set_spot_published',{
    p_id:Number(id),
    p_published:!!next
  });

  if(error){
    console.error('publish toggle failed',error);
    alert(label+'にできませんでした：'+error.message);
    return;
  }
  if(data!==true){
    alert('対象スポットが見つかりませんでした。管理画面を再読み込みしてください。');
    if(typeof window.loadAdmin==='function')await window.loadAdmin();
    return;
  }

  if(typeof loadRemoteSpots==='function')await loadRemoteSpots();
  if(typeof window.loadAdmin==='function')await window.loadAdmin();
  alert(next?'公開しました。':'非公開にしました。');
};
})();