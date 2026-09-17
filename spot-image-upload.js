(()=>{
'use strict';
const BUCKET='seiban-spot-images';
const $=s=>document.querySelector(s);
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function compressImage(file){
  if(!file.type.startsWith('image/')) throw new Error('画像ファイルを選択してください。');
  if(file.size>20*1024*1024) throw new Error('1枚20MB以下の画像を選択してください。');
  const bmp=await createImageBitmap(file);
  const max=2000, scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
  const w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(bmp,0,0,w,h);bmp.close?.();
  const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.84));
  if(!blob) throw new Error('画像を変換できませんでした。');
  return blob;
}
function ensureUI(){
  const form=$('#spotForm'); if(!form||$('#spotPhotoInput')) return false;
  const urlBox=form.elements.image_urls;
  if(!urlBox) return false;
  const wrap=document.createElement('div');wrap.id='spotPhotoUploader';wrap.style='display:grid;gap:8px';
  wrap.innerHTML='<label style="font-weight:700">写真</label><input id="spotPhotoInput" type="file" accept="image/*" multiple><div class="small">iPhoneの写真から複数選択できます。アップロード時にWeb向けサイズへ自動圧縮します。</div><div id="spotPhotoStatus" class="formmsg"></div><div id="spotPhotoPreview" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div>';
  urlBox.before(wrap);urlBox.style.display='none';
  $('#spotPhotoInput').addEventListener('change',uploadSelected);
  renderPreview();return true;
}
function urls(){const box=$('#spotForm')?.elements.image_urls;return box?String(box.value||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean):[]}
function setUrls(a){const box=$('#spotForm')?.elements.image_urls;if(box){box.value=[...new Set(a)].join('\n');box.dispatchEvent(new Event('input',{bubbles:true}))}renderPreview()}
function renderPreview(){const p=$('#spotPhotoPreview');if(!p)return;const a=urls();p.innerHTML=a.map((u,i)=>`<div style="position:relative"><img src="${u.replace(/"/g,'&quot;')}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px"><button type="button" data-rm="${i}" style="position:absolute;right:4px;top:4px;border:0;border-radius:999px;width:28px;height:28px;background:#fff">×</button></div>`).join('');p.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{const a=urls();a.splice(Number(b.dataset.rm),1);setUrls(a)})}
async function uploadSelected(e){
 const files=[...e.target.files];if(!files.length)return;const status=$('#spotPhotoStatus');
 const {data:{session}}=await db.auth.getSession();if(!session){status.textContent='写真を追加するには管理者ログインが必要です。';return}
 status.textContent=`写真をアップロード中… 0/${files.length}`;const out=urls();
 try{
  for(let i=0;i<files.length;i++){
   const blob=await compressImage(files[i]);
   const path=`spots/${session.user.id}/${Date.now()}-${i}-${crypto.randomUUID()}.jpg`;
   const {error}=await db.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',cacheControl:'3600',upsert:false});
   if(error)throw error;
   const {data}=db.storage.from(BUCKET).getPublicUrl(path);out.push(data.publicUrl);
   status.textContent=`写真をアップロード中… ${i+1}/${files.length}`;
  }
  setUrls(out);status.textContent=`${files.length}枚追加しました。スポットを保存すると写真も反映されます。`;
 }catch(err){status.textContent='写真をアップロードできませんでした：'+(err?.message||err)}finally{e.target.value=''}
}
function observe(){ensureUI();const f=$('#spotForm');if(f&&!f.dataset.photoObserver){f.dataset.photoObserver='1';f.addEventListener('reset',()=>setTimeout(renderPreview,0));f.addEventListener('input',e=>{if(e.target?.name==='image_urls')renderPreview()})}}
const mo=new MutationObserver(observe);mo.observe(document.documentElement,{childList:true,subtree:true});
observe();let n=0;const t=setInterval(()=>{observe();if(++n>40)clearInterval(t)},250);
})();