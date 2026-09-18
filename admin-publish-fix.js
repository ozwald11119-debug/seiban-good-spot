(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const label=s=>({pending:'確認待ち',approved:'採用済み',rejected:'見送り'}[s]||s);
let filter='pending',rows=[];

window.togglePublish=async(id,next)=>{const text=next?'公開':'非公開';if(!next&&!confirm('このスポットを非公開にしますか？\n一般ページからは表示されなくなります。'))return;const {data:sessionData}=await db.auth.getSession();if(!sessionData?.session?.user)return alert('管理者セッションが切れています。もう一度ログインしてください。');const {data,error}=await db.rpc('seiban_admin_set_spot_published',{p_id:Number(id),p_published:!!next});if(error)return alert(text+'にできませんでした：'+error.message);if(data!==true)return alert('対象スポットが見つかりませんでした。');if(typeof loadRemoteSpots==='function')await loadRemoteSpots();if(typeof window.loadAdmin==='function')await window.loadAdmin();alert(next?'公開しました。':'非公開にしました。')};

async function setStatus(id,status){if(status==='rejected'&&!confirm('このおすすめを見送りにしますか？'))return;const {data,error}=await db.from('seiban_recommendations').update({status}).eq('id',id).select('id,status');if(error)return alert('更新できませんでした：'+error.message);if(!data?.length)return alert('更新できませんでした。管理者権限を確認してください。');await loadRecommendations()}
window.seibanSetRecommendationStatus=setStatus;

function ensureTools(){const list=document.querySelector('#recommendList');if(!list)return null;let box=document.querySelector('#recommendFixTools');if(!box){box=document.createElement('div');box.id='recommendFixTools';box.style='margin:10px 0 14px;display:flex;gap:7px;flex-wrap:wrap';list.before(box)}const counts=s=>rows.filter(r=>r.status===s).length;box.innerHTML=[['pending','確認待ち '+counts('pending')],['approved','採用済み '+counts('approved')],['rejected','見送り '+counts('rejected')],['all','すべて '+rows.length]].map(([v,t])=>`<button type="button" class="btn ${filter===v?'primary':'soft'}" data-rf="${v}">${t}</button>`).join('');box.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{filter=b.dataset.rf;renderRecommendations()});return list}
function renderRecommendations(){const list=ensureTools();if(!list)return;const shown=filter==='all'?rows:rows.filter(r=>r.status===filter);list.innerHTML=shown.length?shown.map(r=>`<div class="adminitem"><b>${esc(r.spot_name)}</b><div class="small">${esc(r.municipality)}${r.category?' · '+esc(r.category):''} · ${label(r.status)}</div><div style="margin-top:7px;font-size:13px;line-height:1.6">${esc(r.recommendation)}</div>${r.nickname?`<div class="small">投稿者：${esc(r.nickname)}</div>`:''}${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="small">参考URLを開く ↗</a>`:''}<div class="adminbar">${r.status==='pending'&&typeof window.adoptRecommendation==='function'?`<button class="btn primary" onclick="adoptRecommendation('${r.id}')">採用して編集</button>`:''}${r.status==='pending'?`<button class="btn danger" onclick="seibanSetRecommendationStatus('${r.id}','rejected')">見送り</button>`:`<button class="btn soft" onclick="seibanSetRecommendationStatus('${r.id}','pending')">確認待ちに戻す</button>`}</div></div>`).join(''):'<div class="small">この一覧にはありません。</div>'}
async function loadRecommendations(){const list=document.querySelector('#recommendList');if(!list)return;const {data:sessionData,error:sessionError}=await db.auth.getSession();if(sessionError||!sessionData?.session?.user){list.innerHTML='<div class="note">管理者ログインを確認できません。いったん管理者ページを開き直してください。</div>';return}list.innerHTML='<div class="small">おすすめを読み込み中…</div>';const {data,error}=await db.rpc('get_seiban_admin_recommendations');if(error){list.innerHTML='<div class="note">おすすめ一覧を読み込めません：'+esc(error.message)+'</div>';return}rows=data||[];renderRecommendations()}
window.loadSeibanRecommendations=loadRecommendations;

document.addEventListener('click',e=>{if(e.target.closest('#openAdmin,#reloadAdmin'))setTimeout(loadRecommendations,250)});
db.auth.onAuthStateChange((event,session)=>{if(session?.user)setTimeout(loadRecommendations,300)});
window.addEventListener('pageshow',()=>setTimeout(loadRecommendations,400));
setTimeout(loadRecommendations,700);
setTimeout(loadRecommendations,1800);
})();