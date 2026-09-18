(()=>{
'use strict';
let adminRecommendations=[];
async function sessionOK(){const {data,error}=await db.auth.getSession();if(error||!data?.session?.user){alert('管理者ログインが切れています。もう一度ログインしてください。');return false}return true}
async function reload(){if(typeof window.loadAdmin==='function')await window.loadAdmin();if(typeof loadRemoteSpots==='function')await loadRemoteSpots()}
window.togglePublish=async(id,next)=>{if(!await sessionOK())return;if(!next&&!confirm('このスポットを非公開にしますか？\n一般ページからは表示されなくなります。'))return;const {data,error}=await db.rpc('seiban_admin_set_spot_published',{p_id:id,p_published:!!next});if(error)return alert((next?'公開':'非公開')+'にできませんでした：'+error.message);if(data!==true)return alert('対象スポットが見つかりませんでした。');await reload();alert(next?'公開しました。':'非公開にしました。')};
window.deleteSpot=async id=>{if(!await sessionOK())return;if(!confirm('このスポットを削除しますか？\nこの操作は元に戻せません。'))return;const {data,error}=await db.rpc('seiban_admin_delete_spot',{p_id:id});if(error)return alert('削除できませんでした：'+error.message);if(data!==true)return alert('対象スポットが見つかりませんでした。');await reload();alert('削除しました。')};
window.setRecStatus=async(id,status)=>{if(!await sessionOK())return;if(status==='rejected'&&!confirm('このおすすめを見送りにしますか？'))return;const {data,error}=await db.rpc('seiban_admin_set_recommendation_status',{p_id:id,p_status:status});if(error)return alert('更新できませんでした：'+error.message);if(data!==true)return alert('対象のおすすめが見つかりませんでした。');await reload()};
window.seibanSetRecommendationStatus=window.setRecStatus;
async function fetchRecommendations(){const {data,error}=await db.rpc('get_seiban_admin_recommendations');if(!error)adminRecommendations=data||[]}
window.adoptRecommendation=async id=>{if(!await sessionOK())return;await fetchRecommendations();const r=adminRecommendations.find(x=>String(x.id)===String(id));if(!r)return alert('おすすめデータを読み直せませんでした。');const f=document.querySelector('#spotForm');if(!f)return alert('登録フォームが見つかりません。');const set=(n,v)=>{if(f.elements[n])f.elements[n].value=v||''};set('name',r.spot_name);set('municipality',r.municipality);set('category',r.category||'おすすめ');set('description',r.recommendation);if(r.url){if(/instagram\.com/i.test(r.url))set('instagram_url',r.url);else set('website_url',r.url)}if(f.elements.is_published)f.elements.is_published.checked=false;window.__seibanAdoptingRecommendationId=id;const msg=document.querySelector('#spotMsg');if(msg)msg.textContent='おすすめ内容を引き継ぎました。内容を確認して登録してください。';f.scrollIntoView({behavior:'smooth',block:'start'})};
window.seibanAdoptRecommendation=window.adoptRecommendation;
function removeDuplicateTools(){document.querySelector('#recommendFixTools')?.remove()}
const observer=new MutationObserver(removeDuplicateTools);observer.observe(document.documentElement,{childList:true,subtree:true});
removeDuplicateTools();fetchRecommendations();
})();