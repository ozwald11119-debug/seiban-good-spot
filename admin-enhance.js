(()=>{
'use strict';
let recRows=[],spotRows=[],editingSpotId=null,adoptingRecId=null;
const q=s=>document.querySelector(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const statusLabel=s=>({pending:'確認待ち',approved:'採用済み',rejected:'見送り'}[s]||s);

function enhanceSpotForm(){
 const form=q('#spotForm'); if(!form||form.dataset.enhanced)return; form.dataset.enhanced='1';
 const map=form.querySelector('[name="map_url"]');
 const images=document.createElement('textarea'); images.name='image_urls'; images.placeholder='画像URL（複数の場合は改行またはカンマ区切り）'; images.style.minHeight='78px'; map.after(images);
 const submit=form.querySelector('button[type="submit"]'); submit.id='spotSubmitBtn';
 const cancel=document.createElement('button'); cancel.type='button'; cancel.id='cancelEditSpot'; cancel.className='btn soft hidden'; cancel.textContent='編集をキャンセル'; submit.after(cancel); cancel.onclick=resetSpotForm;
 form.addEventListener('submit',saveSpot,true);
}
function resetSpotForm(){
 const form=q('#spotForm'); if(!form)return; form.reset(); form.elements.is_published.checked=true; editingSpotId=null; adoptingRecId=null;
 q('#spotSubmitBtn').textContent='スポットを登録'; q('#cancelEditSpot').classList.add('hidden'); q('#spotMsg').textContent='';
}
function parseImages(v){return String(v||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean)}
async function saveSpot(e){
 e.preventDefault();e.stopImmediatePropagation();
 const form=e.currentTarget,msg=q('#spotMsg'),btn=q('#spotSubmitBtn'); btn.disabled=true; msg.textContent=editingSpotId?'更新中…':'登録中…';
 const f=new FormData(form); const payload={name:String(f.get('name')||'').trim(),municipality:String(f.get('municipality')||''),category:String(f.get('category')||'').trim(),description:String(f.get('description')||'').trim(),website_url:String(f.get('website_url')||'').trim()||null,instagram_url:String(f.get('instagram_url')||'').trim()||null,post_url:String(f.get('post_url')||'').trim()||null,map_url:String(f.get('map_url')||'').trim()||null,image_urls:parseImages(f.get('image_urls')),is_published:f.get('is_published')==='on',updated_at:new Date().toISOString()};
 let res=editingSpotId?await db.from('seiban_spots').update(payload).eq('id',editingSpotId):await db.from('seiban_spots').insert(payload);
 if(res.error){msg.textContent='保存できませんでした：'+res.error.message;btn.disabled=false;return}
 if(adoptingRecId){await db.from('seiban_recommendations').update({status:'approved'}).eq('id',adoptingRecId)}
 msg.textContent=editingSpotId?'更新しました。':'登録しました。'; btn.disabled=false; editingSpotId=null;adoptingRecId=null; form.reset();form.elements.is_published.checked=true;btn.textContent='スポットを登録';q('#cancelEditSpot').classList.add('hidden'); await loadRemoteSpots();await loadAdmin();
}
window.adoptRecommendation=function(id){
 const r=recRows.find(x=>x.id===id);if(!r)return; enhanceSpotForm(); const f=q('#spotForm'); editingSpotId=null;adoptingRecId=id;
 f.elements.name.value=r.spot_name||'';f.elements.municipality.value=r.municipality||'';f.elements.category.value=r.category||'おすすめ';f.elements.description.value=r.recommendation||'';
 if(r.url){if(/instagram\.com/i.test(r.url))f.elements.instagram_url.value=r.url;else f.elements.website_url.value=r.url}
 f.elements.is_published.checked=false;q('#spotSubmitBtn').textContent='内容を確認して登録';q('#cancelEditSpot').classList.remove('hidden');q('#spotMsg').textContent='おすすめ内容を引き継ぎました。必要な情報を整えてから登録してください。';f.scrollIntoView({behavior:'smooth',block:'start'});
};
window.editSpot=function(id){
 const r=spotRows.find(x=>x.id===id);if(!r)return; enhanceSpotForm();const f=q('#spotForm');editingSpotId=id;adoptingRecId=null;
 ['name','municipality','category','description','website_url','instagram_url','post_url','map_url'].forEach(k=>{if(f.elements[k])f.elements[k].value=r[k]||''});f.elements.image_urls.value=(r.image_urls||[]).join('\n');f.elements.is_published.checked=!!r.is_published;q('#spotSubmitBtn').textContent='変更を保存';q('#cancelEditSpot').classList.remove('hidden');q('#spotMsg').textContent='編集中：'+r.name;f.scrollIntoView({behavior:'smooth',block:'start'});
};
window.setRecStatus=async function(id,status){const {error}=await db.from('seiban_recommendations').update({status}).eq('id',id);if(error)return alert('更新できませんでした：'+error.message);await loadAdmin()};
window.loadAdmin=async function(){
 enhanceSpotForm();const rl=q('#recommendList'),sl=q('#adminSpotList');if(!rl||!sl)return;rl.innerHTML='<div class="small">読み込み中…</div>';sl.innerHTML='<div class="small">読み込み中…</div>';
 const [rr,ss]=await Promise.all([db.from('seiban_recommendations').select('*').order('created_at',{ascending:false}),db.from('seiban_spots').select('*').order('created_at',{ascending:false})]);
 if(rr.error){rl.innerHTML='<div class="note">おすすめ一覧を読み込めません：'+safe(rr.error.message)+'</div>'}else{recRows=rr.data||[];const pending=recRows.filter(r=>r.status==='pending'),done=recRows.filter(r=>r.status!=='pending');const renderRec=r=>`<div class="adminitem"><b>${safe(r.spot_name)}</b><div class="small">${safe(r.municipality)}${r.category?' · '+safe(r.category):''} · ${statusLabel(r.status)}</div><div style="margin-top:7px;font-size:13px;line-height:1.6">${safe(r.recommendation)}</div>${r.nickname?`<div class="small">投稿者：${safe(r.nickname)}</div>`:''}${r.url?`<a href="${safe(r.url)}" target="_blank" rel="noopener" class="small">参考URLを開く ↗</a>`:''}<div class="adminbar">${r.status==='pending'?`<button class="btn primary" onclick="adoptRecommendation(${r.id})">採用して編集</button><button class="btn danger" onclick="setRecStatus(${r.id},'rejected')">見送り</button>`:`<button class="btn soft" onclick="setRecStatus(${r.id},'pending')">確認待ちに戻す</button>`}</div></div>`;rl.innerHTML=(pending.length?`<div class="small">確認待ち ${pending.length}件</div>`+pending.map(renderRec).join(''):'<div class="small">確認待ちはありません。</div>')+(done.length?`<details style="margin-top:12px"><summary class="small">処理済み ${done.length}件</summary>${done.map(renderRec).join('')}</details>`:'')}
 if(ss.error){sl.innerHTML='<div class="note">スポット一覧を読み込めません：'+safe(ss.error.message)+'</div>'}else{spotRows=ss.data||[];sl.innerHTML=spotRows.length?spotRows.map(r=>`<div class="adminitem"><b>${safe(r.name)}</b><div class="small">${safe(r.municipality)} · ${safe(r.category)} · ${r.is_published?'公開中':'下書き'}</div><div class="adminbar"><button class="btn soft" onclick="editSpot(${r.id})">編集</button><button class="btn soft" onclick="togglePublish(${r.id},${!r.is_published})">${r.is_published?'非公開にする':'公開する'}</button><button class="btn danger" onclick="deleteSpot(${r.id})">削除</button></div></div>`).join(''):'<div class="small">管理画面から追加したスポットはまだありません。</div>'}
};

const publicForm=q('#recommendForm');
if(publicForm){publicForm.addEventListener('submit',async e=>{e.preventDefault();e.stopImmediatePropagation();const msg=q('#recommendMsg'),btn=publicForm.querySelector('button[type="submit"]');if(btn.disabled)return;btn.disabled=true;btn.textContent='送信中…';msg.textContent='送信中…';const f=new FormData(publicForm),payload={spot_name:String(f.get('spot_name')||'').trim(),municipality:String(f.get('municipality')||''),category:String(f.get('category')||'').trim()||null,recommendation:String(f.get('recommendation')||'').trim(),url:String(f.get('url')||'').trim()||null,nickname:String(f.get('nickname')||'').trim()||null,status:'pending'};try{const {error}=await db.from('seiban_recommendations').insert(payload);if(error)throw error;publicForm.reset();msg.textContent='ありがとう！おすすめ情報を受け付けました。';btn.textContent='送信しました';setTimeout(()=>{btn.disabled=false;btn.textContent='おすすめを送る'},2500)}catch(err){msg.textContent='送信エラー：'+(err.message||'通信に失敗しました');btn.disabled=false;btn.textContent='おすすめを送る'}},true)}
enhanceSpotForm();
})();