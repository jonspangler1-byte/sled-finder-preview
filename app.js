(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MAKERS=window.MAKERS_RAW.map(r=>({id:r[0],name:r[1],type:r[2],years:r[3],models:r[4],area:r[5],book:r[6],p:window.PROFILES[r[0]]||null}));
const M=id=>MAKERS.find(m=>m.id==id);
const FREE=window.FREE_MAKERS||{};
const isFree=m=>!!m&&Object.prototype.hasOwnProperty.call(FREE,m.id);
const disp=m=>m?(FREE[m.id]||(window.MAKER_LABELS||{})[m.id]||m.name):"Unknown maker";
// Matrix #2 is split into two maker choices (Jonathan, 19 Nov 2026): Fire Fly and Yankee Clipper.
// Stored as maker:2 plus brand. Older row-2 posts with no brand stay "Fire Fly / Yankee Clipper" until someone picks one.
const SPLIT_BRANDS={"2-ff":{maker:2,brand:"Fire Fly",label:"Fire Fly – Planet Jr / S.L. Allen Co."},"2-yc":{maker:2,brand:"Yankee Clipper",label:"Yankee Clipper – Planet Jr / S.L. Allen Co."}};
const brandKey=s=>{if(!s||+s.maker!==2)return "";const b=String(s.brand||"");return Object.keys(SPLIT_BRANDS).find(k=>SPLIT_BRANDS[k].brand===b)||""};
const companyOf=m=>m&&(window.COMPANIES||[]).find(c=>c.brands.some(b=>b.maker==m.id));
const brandsOf=m=>{const c=companyOf(m);return c?c.brands.filter(b=>b.maker==m.id):[]};
const brandBox=m=>{const c=companyOf(m);if(!c)return "";const seen={};
  return `<h3 class="sec">Company & brands</h3><div class="card brandbox"><div class="bb-h"><b>${esc(c.name)}</b><div class="small muted">${esc(c.note)}</div></div>${c.brands.map(b=>{const bm=M(b.maker),here=b.maker==m.id,lk=!premium()&&!isFree(bm);
   return `<a class="bb-r${here?" here":""}" href="#/maker/${b.maker}"><span class="tx"><span class="n">${esc(b.name)}</span><span class="small muted"> · matrix #${b.maker}${here?" · this page":""}</span></span>${isFree(bm)?'<span class="free-pill">Free</span>':(lk?'<span class="lock-pill">🔒 Premium</span>':'<span class="lock-pill">Premium</span>')}</a>`}).join("")}</div>`};
const models=m=>(window.MODELS||{})[m.id]||[];
const mImgs=x=>x.imgs&&x.imgs.length?x.imgs:(x.img?[x.img]:[]);
const firstSentence=t=>{const m=t.match(/^.*?(?:[a-z0-9)”"]{3}|\d)\.(?=\s+[A-Z“"])/);return m?m[0]:t};
const canSell=()=>premium(); // posting sleds AND sale ads now requires paid membership (Jonathan, 18 Nov 2026)
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem("svc_"+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem("svc_"+k,JSON.stringify(v))};
// Photo store (fix 19 Nov 2026): photos go to IndexedDB, which has far more room than localStorage (~5 MB on
// iPhone Safari). Saved sleds keep "idb:<key>" refs. Older posts with inline photos are left as they are; they
// are only moved into IndexedDB (written there first, then the ref swapped in) if localStorage runs out of room.
const PH={db:null,cache:new Map(),rev:new Map()};
function phOpen(){return new Promise(res=>{try{const r=indexedDB.open("svc_photos",1);r.onupgradeneeded=()=>r.result.createObjectStore("p");r.onsuccess=()=>res(r.result);r.onerror=r.onblocked=()=>res(null)}catch(e){res(null)}})}
function phLoadAll(db){return new Promise(res=>{try{const rq=db.transaction("p","readonly").objectStore("p").openCursor();rq.onsuccess=()=>{const c=rq.result;if(c){PH.cache.set(c.key,c.value);PH.rev.set(c.value,c.key);c.continue()}else res()};rq.onerror=()=>res()}catch(e){res()}})}
function phPut(entries){return new Promise((res,rej)=>{try{const tx=PH.db.transaction("p","readwrite"),st=tx.objectStore("p");entries.forEach(([k,v])=>st.put(v,k));tx.oncomplete=()=>res();tx.onerror=tx.onabort=()=>rej(tx.error||new Error("photo store failed"))}catch(e){rej(e)}})}
const phURL=u=>typeof u==="string"&&u.startsWith("idb:")?(PH.cache.get(u.slice(4))||""):u;
async function storePics(list){if(!PH.db)return list;const out=[],put=[];
  list.forEach((u,i)=>{if(typeof u==="string"&&u.startsWith("data:")){let k=PH.rev.get(u);if(!k){k="p"+Date.now().toString(36)+i+Math.random().toString(36).slice(2,7);put.push([k,u])}out.push("idb:"+k)}else out.push(u)});
  if(put.length){await phPut(put);put.forEach(([k,v])=>{PH.cache.set(k,v);PH.rev.set(v,k)})}return out}
const isQuota=e=>!!e&&(e.name==="QuotaExceededError"||e.code===22||e.code===1014||/quota/i.test(String(e.message||e)));
async function migrateInlinePhotos(){if(!PH.db)return false;let moved=false;
  const fix=async arr=>{for(const x of arr){if(x&&Array.isArray(x.imgs)&&x.imgs.some(u=>String(u).startsWith("data:"))){x.imgs=await storePics(x.imgs);x.img=x.imgs[0];moved=true}else if(x&&String(x.img||"").startsWith("data:")){x.img=(await storePics([x.img]))[0];moved=true}}};
  const sl=LS.get("sleds",[]),li=LS.get("listings",[]),ed=LS.get("edits",{}),le=LS.get("ledits",{});
  await fix(sl);await fix(li);await fix(Object.values(ed));await fix(Object.values(le));
  if(moved){LS.set("sleds",sl);LS.set("listings",li);LS.set("edits",ed);LS.set("ledits",le)}return moved}
async function lsSave(fn){try{fn()}catch(e){if(!isQuota(e))throw e;if(await migrateInlinePhotos()){fn();return}throw e}}
function saveErr(e){console.error(e);toast(isQuota(e)?"Couldn't save: this phone's storage for the app is full. Nothing was lost. Try fewer photos, or tell Sled Finder.":"Couldn't save: "+(e&&e.message||e),6000)}
// Demo roles: free (never paid), premium (paid member), lapsed (membership ran out), admin (Jonathan / Sled Finder).
const ROLES={free:"Free (never paid)",premium:"Paid member",lapsed:"Membership lapsed",admin:"Admin · Sled Finder (Jonathan)"};
// Live mode (config.js filled in): the role comes from the signed-in account on the server (cloud.js).
// Only an admin can "view as" another role there, and only on their own screen.
const CLOUD=window.SFCloud&&window.SFCloud.enabled?window.SFCloud:null;
const canViewAs=()=>!CLOUD||CLOUD.realRole()==="admin";
const role=()=>{if(CLOUD)return CLOUD.role();const r=LS.get("role",null);return ROLES[r]?r:(LS.get("premium",false)?"premium":"free")};
const setRole=r=>{if(CLOUD){if(CLOUD.realRole()==="admin")CLOUD.setViewAs(r);return}LS.set("role",r);LS.set("premium",r==="premium"||r==="admin")};
const me=()=>CLOUD?(CLOUD.user?(CLOUD.handle()||"you"):"you"):"sample_collector";
const cloudTouch=(kind,id,op)=>{if(CLOUD)CLOUD.queue(kind,id,op)};
const premium=()=>{const r=role();return r==="premium"||r==="admin"};
const isAdmin=()=>role()==="admin";
const lapsed=()=>role()==="lapsed";
const userSleds=()=>LS.get("sleds",[]);
const normPics=s=>{const o=Object.assign({},s);o.imgs=(o.imgs&&o.imgs.length?o.imgs:(o.img?[o.img]:[])).map(phURL).filter(Boolean);o.img=o.imgs[0]||"";o.years=o.years||o.year||"Unknown";return o};
const allSleds=()=>{const ov=LS.get("edits",{}),del=LS.get("deleted",[]);return userSleds().concat(CLOUD?CLOUD.sharedSleds():[]).concat(window.SAMPLE_SLEDS.map(s=>ov[s.id]?Object.assign({},s,ov[s.id]):s)).filter(s=>!del.includes(s.id)).map(normPics)};
const allListings=()=>{const ov=LS.get("ledits",{}),del=LS.get("ldeleted",[]);return LS.get("listings",[]).concat(CLOUD?CLOUD.publicListings():[]).concat(window.SALE_LISTINGS.map(l=>ov[l.id]?Object.assign({},l,ov[l.id]):l)).filter(l=>!del.includes(l.id)).map(normPics)};
const SLED_TYPES=["Runner","Toboggan","Cutter","Bobsled","Saucer","Traverse","Flexy Racer","Other"];
const typeOf=x=>(x&&SLED_TYPES.includes(x.sledType)?x.sledType:"");
const typeSel=(name,cur)=>`<select name="${name}"><option value="">Type (optional)</option>${SLED_TYPES.map(t=>`<option value="${esc(t)}"${cur===t?" selected":""}>${esc(t)}</option>`).join("")}</select>`;
const typeLine=x=>{const t=typeOf(x);return t?`<div><dt>Sled type</dt><dd>${esc(t)}</dd></div>`:""};
const typeChipBar=(cur,makeHref)=>`<div class="chips" id="typef"><a class="chip ${cur?"":"on"}" href="${makeHref("")}">All types</a>${SLED_TYPES.map(t=>`<a class="chip ${cur===t?"on":""}" href="${makeHref(t)}">${esc(t)}</a>`).join("")}</div>`;
const YT_URL="https://youtube.com/@sleddymercury";
const MUSEUM_URL="https://rosebudsledmuseum.com/";
const OUT_LINKS=[["YouTube: Sleddy Mercury",YT_URL],["Rosebud Sled Museum website",MUSEUM_URL]];
const outLinkChips=()=>OUT_LINKS.map(([l,u])=>`<a class="chip" href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("");
const outLinkMenu=()=>`<div class="menu">${OUT_LINKS.map(([l,u])=>`<a href="${u}" target="_blank" rel="noopener">${esc(l)} <span>↗</span></a>`).join("")}</div>`;
const outLinkAbout=()=>`<div class="about-links" id="about"><h3 class="sec">About</h3>${outLinkMenu()}</div>`;
const userPhotos=()=>LS.get("photoPosts",[]);
const userComments=()=>LS.get("comments",[]);
const allPhotoPosts=()=>{const ov=LS.get("pedits",{}),del=LS.get("pdeleted",[]);return userPhotos().concat(CLOUD?CLOUD.sharedPhotos():[]).concat((window.SAMPLE_PHOTO_POSTS||[]).map(s=>ov[s.id]?Object.assign({},s,ov[s.id]):s)).filter(s=>!del.includes(s.id)).map(x=>{const o=normPics(x);o.caption=o.caption||"";return o})};
const allComments=()=>{const del=LS.get("cdeleted",[]);return userComments().concat(CLOUD?CLOUD.sharedComments():[]).concat(window.SAMPLE_COMMENTS||[]).filter(c=>!del.includes(c.id)).map(c=>{const o=Object.assign({},c);o.imgs=(o.imgs&&o.imgs.length?o.imgs:(o.img?[o.img]:[])).map(phURL).filter(Boolean);return o})};
const commentsOn=(type,id)=>allComments().filter(c=>c.targetType===type&&String(c.targetId)===String(id));
// Grouping: each submission is its own record (one user, one location); same maker + model are grouped for display.
const modelKey=s=>s.maker+"|"+String(s.model||"").toLowerCase().replace(/[“”"']/g,"").replace(/\s+/g," ").trim();
const sameModel=s=>allSleds().filter(x=>modelKey(x)===modelKey(s)&&(x.shared||isOwn(x)));
// Swipeable gallery with dots; locked items show the lock tile instead.
const gallery=(imgs,locked)=>locked?lockedPh("detail-ph"):(imgs.length<2?`<div class="detail-ph" style="background-image:url('${imgs[0]||""}')"></div>`:
  `<div class="gal"><div class="gal-track">${imgs.map((u,i)=>`<div class="detail-ph gal-slide" style="background-image:url('${u}')" aria-label="Photo ${i+1} of ${imgs.length}"></div>`).join("")}</div><div class="gal-count">1 / ${imgs.length}</div><div class="dots">${imgs.map((u,i)=>`<i class="${i?"":"on"}"></i>`).join("")}</div></div>`);
function bindGalleries(){document.querySelectorAll(".gal").forEach(g=>{const t=g.querySelector(".gal-track"),d=[...g.querySelectorAll(".dots i")],c=g.querySelector(".gal-count");
  t.onscroll=()=>{const i=Math.round(t.scrollLeft/t.clientWidth);d.forEach((x,j)=>x.classList.toggle("on",j===i));c.textContent=(i+1)+" / "+d.length};
  d.forEach((x,j)=>x.onclick=()=>t.scrollTo({left:j*t.clientWidth,behavior:"smooth"}))})}
// Multi-photo picker: real file upload (resized in the browser) plus demo photos. First photo = cover.
function resizeFile(file,max,q){max=max||1000;q=q||.72;return new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",q))};im.src=r.result};r.readAsDataURL(file)})}
const pickerHTML=(id,req)=>`<div class="picker" id="${id}"><div class="pk-thumbs"></div><div class="row2"><label class="btn pk-up">📷 Add photos${req?" *":""}<input type="file" accept="image/*" multiple hidden></label><button type="button" class="btn pk-demo">＋ Demo photo</button></div><small class="muted pk-help">Add several photos. The first one is the cover; tap a photo to make it the cover.</small></div>`;
function picker(id,initial,demo){const root=$("#"+id),T=root.querySelector(".pk-thumbs");let pics=(initial||[]).slice();
  const draw=()=>{T.innerHTML=pics.map((u,i)=>`<div class="pk-t" data-i="${i}" style="background-image:url('${u}')">${i===0?'<span class="pk-cover">Cover</span>':""}<button type="button" class="pk-x" data-x="${i}" aria-label="Remove">×</button></div>`).join("")||'<div class="pk-empty">No photos yet</div>';
    T.querySelectorAll(".pk-x").forEach(b=>b.onclick=e=>{e.stopPropagation();pics.splice(+b.dataset.x,1);draw()});
    T.querySelectorAll(".pk-t").forEach(t=>t.onclick=()=>{const i=+t.dataset.i;if(i){const [p]=pics.splice(i,1);pics.unshift(p);draw();toast("Cover photo set")}})};
  root.querySelector("input[type=file]").onchange=async e=>{for(const f of [...e.target.files].slice(0,10)){const sm=await resizeFile(f);pics.push(sm);if(driveSyncOn()){try{HIRES.set(sm,await resizeFile(f,1600,.85))}catch(x){}}}e.target.value="";draw()};
  root.querySelector(".pk-demo").onclick=()=>{const left=demo.filter(u=>!pics.includes(u));pics.push(left.length?left[0]:demo[Math.floor(Math.random()*demo.length)]);draw();toast("Demo photo added (sample image)")};
  draw();return ()=>pics.slice()}
// ===== Drive sync (admin only): copies each saved sled (photos + maker, model, years, origin ZIP, notes)
// into Jonathan's "Sled Finder Uploads" Google Drive folder via a Google Apps Script web app.
// The token is never in this file: it is typed once on the admin's device and kept in that browser.
// localStorage stays the source of truth; failed uploads queue and can be retried from Profile.
const DRIVE_SYNC_URL=""; // paste the Apps Script web app /exec URL here after it is deployed
const HIRES=new Map(); // small photo -> larger copy (1600px) for training, this session only
const syncUrl=()=>LS.get("syncUrl","")||DRIVE_SYNC_URL;
const driveSyncOn=()=>isAdmin()&&!!syncUrl()&&!!LS.get("syncToken","");
const syncedMap=()=>LS.get("synced",{});
const unsyncedSleds=()=>{const sm=syncedMap();return userSleds().filter(s=>sm[s.id]!==sledSig(s))};
const sledSig=s=>[s.maker,s.brand,s.country,s.region,s.postal,s.makerText,s.model,s.years,s.zip,s.condition,s.size,s.found,s.notes,s.shared,(s.imgs||[]).length,(s.imgs||[]).map(u=>String(u).length).join(".")].join("|");
async function drivePost(body){const r=await fetch(syncUrl(),{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(Object.assign({token:LS.get("syncToken","")},body))});return r.json()}
async function pushSledToDrive(s){
  const own=(s.imgs||[]).map(phURL).filter(u=>/^data:image\//.test(u)); // idb: refs resolved to the stored photo // only photos taken/uploaded on this device; demo sample images are skipped
  const m=+s.maker?M(s.maker):null;
  const sled={id:s.id,maker:+s.maker||0,brand:+s.maker===2?(s.brand||""):"",makerText:s.makerText||"",model:s.model,years:s.years,zip:ccOf(s)!=="US"?"":(/^\d{5}$/.test(String(s.zip||""))?s.zip:((String(s.town||"").match(/^ZIP (\d{5})$/)||[])[1]||"")),country:ccOf(s),region:s.locType==="na"?"":(s.region||""),nation:s.nation||"",postalArea:ccOf(s)==="US"||s.locType==="na"?"":(s.postal||""),locType:s.locType,condition:s.condition,size:s.size,found:s.found,notes:s.notes,shared:!!s.shared};
  const res=await drivePost({action:"upsert",sled,makerLabel:brandKey(s)?SPLIT_BRANDS[brandKey(s)].label:m?disp(m):(s.makerText?s.makerText+" (custom)":"Unknown maker"),photos:own.map(u=>HIRES.get(u)||u)});
  if(!res||!res.ok)throw new Error(res&&res.error||"upload failed");
  const sm=syncedMap();sm[s.id]=sledSig(s);LS.set("synced",sm);return res}
function autoSync(s){if(!driveSyncOn())return;pushSledToDrive(s).then(r=>toast("Copied to Drive · "+r.folder+" · "+r.photos+" photo"+(r.photos===1?"":"s"))).catch(e=>toast("Saved here; Drive copy failed ("+e.message+"). Retry from Profile."))}
async function syncAllToDrive(btn){const list=unsyncedSleds();if(!list.length){toast("Everything is already in Drive");return}
  let ok=0,fail=0;for(const s of list){btn.textContent="Uploading "+(ok+fail+1)+" of "+list.length+"…";try{await pushSledToDrive(s);ok++}catch(e){fail++}}
  toast(ok+" sled"+(ok===1?"":"s")+" copied to Drive"+(fail?" · "+fail+" failed":""));route()}
const driveSyncHTML=()=>{if(!isAdmin())return "";const n=userSleds().length,u=unsyncedSleds().length,set=!!syncUrl()&&!!LS.get("syncToken","");
  return `<h3 class="sec">Drive sync · training photos (admin)</h3><div class="form" id="dsync" style="padding-top:0">
  <p class="legend" style="margin:0;padding:0">Copies each sled you save (photos, maker, model, years, origin ZIP, notes) to the “Sled Finder Uploads” folder in Google Drive, sorted by maker, for training the photo identifier. ZIP only, never a street address.</p>
  <label>Upload link<input name="url" value="${esc(syncUrl())}" placeholder="https://script.google.com/macros/s/…/exec"></label>
  <label>Sync key<input name="token" type="password" value="${esc(LS.get("syncToken",""))}" placeholder="Paste the key once on this phone"></label>
  <div class="row2"><button type="button" class="btn" id="dsave">Save</button><button type="button" class="btn" id="dtest">Test</button></div>
  <button type="button" class="btn solid" id="dall" ${set?"":"disabled"}>Sync my saved sleds to Drive (${u} of ${n} not yet copied)</button>
  <small class="muted" style="font-size:.7rem">${set?"New sleds you save are copied automatically.":"Not connected yet: sleds are saved only in this browser."} Don't tap “Reset demo” before syncing; it erases sleds saved on this phone.</small></div>`};
const bindDriveSync=()=>{const f=$("#dsync");if(!f)return;
  $("#dsave").onclick=()=>{LS.set("syncUrl",f.querySelector("[name=url]").value.trim());LS.set("syncToken",f.querySelector("[name=token]").value.trim());toast("Drive sync settings saved on this device");route()};
  $("#dtest").onclick=async()=>{LS.set("syncUrl",f.querySelector("[name=url]").value.trim());LS.set("syncToken",f.querySelector("[name=token]").value.trim());try{const r=await drivePost({action:"ping"});toast(r&&r.ok?"Connected to Drive ✓":"Drive said: "+(r&&r.error||"no answer"))}catch(e){toast("Couldn't reach the upload link")}};
  $("#dall").onclick=e=>{e.target.disabled=true;syncAllToDrive(e.target)}};
// Editing rule: Admin (Sled Finder) can edit/delete ANY submission or sale ad. Paid members only their OWN. Maker histories are never user-editable.
const canEdit=item=>!!item&&(isAdmin()||(!!(item.mine||item.userAdded)&&premium()));
// Local copy first (works offline); in live mode each change is also queued for upload (cloud.js outbox).
// "c<uuid>" ids are other members' posts from the cloud; only the admin can change those.
function saveSled(s){s.updatedAt=Date.now();if(CLOUD&&CLOUD.isCloudId(s.id)){CLOUD.adminSave("sled",s);return}if(String(s.id).startsWith("u")){const u=userSleds().map(x=>x.id===s.id?s:x);LS.set("sleds",u);cloudTouch("sled",s.id)}else{const ov=LS.get("edits",{});ov[s.id]=s;LS.set("edits",ov)}}
function saveListing(l){l.updatedAt=Date.now();if(CLOUD&&CLOUD.isCloudId(l.id)){CLOUD.adminSave("listing",l);return}if(String(l.id).startsWith("ul")){LS.set("listings",LS.get("listings",[]).map(x=>x.id===l.id?l:x));cloudTouch("listing",l.id)}else{const ov=LS.get("ledits",{});ov[l.id]=l;LS.set("ledits",ov)}}
function addSled(s){s.updatedAt=Date.now();const u=userSleds();u.unshift(s);LS.set("sleds",u);cloudTouch("sled",s.id)}
function addListing(l){l.updatedAt=Date.now();const u=LS.get("listings",[]);u.unshift(l);LS.set("listings",u);cloudTouch("listing",l.id)}
function deleteListing(id){if(CLOUD&&CLOUD.isCloudId(id)){CLOUD.adminDelete("listing",id);return}if(String(id).startsWith("ul")){LS.set("listings",LS.get("listings",[]).filter(x=>x.id!==id));cloudTouch("listing",id,"delete")}else{const d=LS.get("ldeleted",[]);d.push(id);LS.set("ldeleted",d)}}
function deleteSled(id){if(CLOUD&&CLOUD.isCloudId(id)){CLOUD.adminDelete("sled",id);return}if(String(id).startsWith("u")){LS.set("sleds",userSleds().filter(x=>x.id!==id));cloudTouch("sled",id,"delete")}else{const d=LS.get("deleted",[]);d.push(id);LS.set("deleted",d)}}
function savePhoto(x){x.updatedAt=Date.now();if(CLOUD&&CLOUD.isCloudId(x.id)){CLOUD.adminSave("photo",x);return}if(String(x.id).startsWith("ph")){LS.set("photoPosts",userPhotos().map(y=>y.id===x.id?x:y));cloudTouch("photo",x.id)}else{const ov=LS.get("pedits",{});ov[x.id]=x;LS.set("pedits",ov)}}
function addPhoto(x){x.updatedAt=Date.now();const u=userPhotos();u.unshift(x);LS.set("photoPosts",u);cloudTouch("photo",x.id)}
function deletePhoto(id){if(CLOUD&&CLOUD.isCloudId(id)){CLOUD.adminDelete("photo",id);return}if(String(id).startsWith("ph")){LS.set("photoPosts",userPhotos().filter(x=>x.id!==id));cloudTouch("photo",id,"delete")}else{const d=LS.get("pdeleted",[]);d.push(id);LS.set("pdeleted",d)}}
function addComment(c){c.updatedAt=Date.now();const u=userComments();u.unshift(c);LS.set("comments",u);cloudTouch("comment",c.id)}
function deleteComment(id){if(CLOUD&&CLOUD.isCloudId(id)){CLOUD.adminDelete("comment",id);return}if(String(id).startsWith("cm")&&!String(id).startsWith("cmt")){LS.set("comments",userComments().filter(x=>x.id!==id));cloudTouch("comment",id,"delete")}else{const d=LS.get("cdeleted",[]);d.push(id);LS.set("cdeleted",d)}}
const editBar=(item,editHref,kind)=>{const own=!!(item.mine||item.userAdded);
  const btns=lbl=>`<div class="row2"><a class="btn" href="${editHref}">✎ ${lbl}</a><button class="btn" data-del="${item.id}" data-kind="${kind}" style="color:var(--red);border-color:var(--red)">Delete</button></div>`;
  if(isAdmin())return btns(own?"Edit "+kind:"Admin edit")+(own?"":'<p class="legend" style="margin:6px 0 0;padding:0">Admin (Sled Finder): you can correct or remove any post or ad for accuracy.</p>');
  if(!own)return "";
  return premium()?btns("Edit "+kind):`<a class="btn" href="#/upgrade">🔒 ${lapsed()?"Renew":"Upgrade"} to edit your submissions</a>`};
const editedNote=x=>x&&x.editedBy?`<span class="edited">✎ Edited by ${esc(x.editedBy)}</span>`:"";
// Membership gate: posting and viewing the Sled Maker and Model Database require paid membership.
const lapsedText=n=>`Your membership has lapsed. ${n?`Your ${n} earlier post${n==1?"":"s"} stay`:"Your earlier posts stay"} in Sled Finder and come back as soon as you renew.`;
const gate=(title,text)=>`<div class="gate"><div class="gl">🔒</div><b>${title}</b><p>${text}</p><a class="btn gold" href="#/upgrade">${lapsed()?"Renew membership · $15/yr":"Join · $15/yr"}</a><a class="small" href="#/terms">Terms &amp; Community Guidelines (draft)</a></div>`;
const databaseGate=()=>gate(lapsed()?"Membership lapsed":"The Sled Maker and Model Database is for members",lapsed()?lapsedText(0)+" Renew to see the Sled Maker and Model Database again.":"Subscribers (paid members) can view and add their sleds, and search and map others' sleds. Free members can still browse the free makers' galleries.");
const dbIntro=()=>`<h3 class="sec" id="database">Sled Maker and Model Database</h3><p class="legend">Subscribers (paid members) can view and add their sleds, and search and map others' sleds.</p><p class="legend db-links"><a href="#/identify">📷 Photo ID${premium()?"":" 🔒"}</a><a href="#/map">🗺 Sled Picker Map${premium()?"":" 🔒"}</a><a href="#/search">Search</a>${premium()?'<a href="#/add">＋ Add a sled</a>':""}</p>`;
const ackHTML=()=>`<label class="ack"><input type="checkbox" name="ack" required><span>I agree my post and photos become part of Sled Finder and may be edited or removed by Sled Finder for accuracy. <a href="#/terms" target="_blank">Read the Terms</a></span></label>`;
// Maker on a post: a real maker id, or 0 = unknown with an optional custom text ("Likely Pratt").
const mk=s=>s&&brandKey(s)?SPLIT_BRANDS[brandKey(s)].label:s&&+s.maker?disp(M(s.maker)):(s&&s.makerText?s.makerText+" (unconfirmed)":"Unknown maker");
const makerFields=(id,E)=>`<label>Maker<select name="maker" id="${id}"><option value="0">Unknown maker</option><option value="custom">Custom…</option>${makerOpts(!!E&&+E.maker===2&&!brandKey(E))}</select></label>
  <label class="${E&&!+E.maker&&E.makerText?"":"hide"}" id="${id}-cw">Custom maker<input name="makerText" value="${esc(E&&E.makerText||"")}" placeholder="e.g. Likely Pratt or Kalamazoo"><small class="hint">Saved as typed and shown as unconfirmed. Sled Finder may reassign it later.</small></label>`;
function bindMaker(id,E){const s=$("#"+id),w=$("#"+id+"-cw");if(E)s.value=brandKey(E)||(+E.maker?E.maker:(E.makerText?"custom":"0"));const f=()=>w.classList.toggle("hide",s.value!=="custom");s.onchange=f;f()}
const makerVals=f=>{const v=String(f.get("maker"));if(SPLIT_BRANDS[v])return {maker:2,brand:SPLIT_BRANDS[v].brand,makerText:""};return v==="custom"?{maker:0,brand:"",makerText:String(f.get("makerText")||"").trim()}:{maker:+v,brand:"",makerText:""}};
const liked=()=>LS.get("liked",{});
document.title=window.APP_NAME+(window.SFCloud&&window.SFCloud.enabled?"":" — clickable mockup");
$("#sideTitle").textContent=window.APP_NAME;

function toast(t,ms){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("show"),ms||1900)}
const DEFAULT_NOTIFY_SETTINGS={sleds:true,articles:true,photos:true,listings:true};
function notifySettings(){
  const src=CLOUD&&CLOUD.notifySettings?CLOUD.notifySettings():LS.get("notifySettings",{});
  return Object.assign({},DEFAULT_NOTIFY_SETTINGS,src||{});
}
function setNotifySetting(key,on){
  if(CLOUD&&CLOUD.saveNotifySettings){CLOUD.saveNotifySettings({[key]:!!on});return}
  const s=notifySettings();s[key]=!!on;LS.set("notifySettings",s);
}
function notifyReads(){
  if(CLOUD&&CLOUD.notifyReads)return CLOUD.notifyReads()||{};
  return LS.get("notifyReads",{})||{};
}
function markNotificationRead(id){
  if(!id)return;
  if(CLOUD&&CLOUD.markNotificationRead){CLOUD.markNotificationRead(id);return}
  const r=notifyReads();r[id]=true;LS.set("notifyReads",r);
}
function markAllNotificationsRead(){
  const ids=visibleNotifications().map(n=>n.id);
  if(CLOUD&&CLOUD.markNotificationsRead){CLOUD.markNotificationsRead(ids);return}
  const r=notifyReads();ids.forEach(id=>r[id]=true);LS.set("notifyReads",r);
}
function rawNotifications(){
  if(CLOUD&&CLOUD.enabled&&CLOUD.user&&CLOUD.notifications)return CLOUD.notifications()||[];
  return window.SAMPLE_NOTIFICATIONS||[];
}
function visibleNotifications(){
  const st=notifySettings();
  return rawNotifications().filter(n=>{
    if(!n||!n.kind)return false;
    if((n.kind==="listing"||n.kind==="sled"||n.kind==="photo")&&!premium())return false;
    if(n.kind==="sled"&&st.sleds===false)return false;
    if(n.kind==="article"&&st.articles===false)return false;
    if(n.kind==="photo"&&st.photos===false)return false;
    if(n.kind==="listing"&&st.listings===false)return false;
    return true;
  }).slice().sort((a,b)=>(b.created||0)-(a.created||0));
}
function unreadNotificationCount(){const r=notifyReads();return visibleNotifications().filter(n=>!r[n.id]).length}
function notifyWhen(ts){
  const t=+ts||0;if(!t)return"";
  const d=Date.now()-t;
  if(d<60000)return"Just now";
  if(d<3600000)return Math.floor(d/60000)+" min ago";
  if(d<86400000)return Math.floor(d/3600000)+" hr ago";
  return new Date(t).toLocaleDateString();
}
const NOTIFY_ICONS={sled:"❄",article:"📖",photo:"📷",listing:"$"};
function bellBtn(){
  const n=unreadNotificationCount();
  const on=(location.hash||"").indexOf("#/notifications")===0;
  return `<a class="act bell${on?" on":""}" href="#/notifications" aria-label="${n?n+" unread notifications":"Notifications"}">${n?`<span class="bell-count">${n>9?"9+":n}</span>`:""}<span class="bell-ic" aria-hidden="true">🔔</span></a>`;
}
function bar(title,{back=false,sub="",act=""}={}){
  $("#appbar").innerHTML=(back?'<button class="back" onclick="history.length>1?history.back():location.hash=\'#/home\'" aria-label="Back">‹</button>':"")+
  '<h2>'+esc(title)+(sub?'<span class="sub">'+esc(sub)+'</span>':"")+'</h2>'+(canViewAs()?`<label class="viewas" title="${CLOUD?"Admin: preview another role on this screen only":"Switch the demo role"}"><span>Viewing as</span><select id="viewAs" aria-label="Viewing as">${[["free","Free"],["premium","Premium"],["lapsed","Lapsed"],["admin","Admin"]].map(([k,l])=>`<option value="${k}" ${role()===k?"selected":""}>${l}</option>`).join("")}</select></label>`:"")+bellBtn()+act;
  const va=$("#viewAs");if(va)va.onchange=()=>{setRole(va.value);toast("Viewing as "+va.options[va.selectedIndex].text);route()};
}
function tab(t){document.querySelectorAll(".tabbar a").forEach(a=>a.classList.toggle("on",a.dataset.tab===t))}
const isOwn=s=>!!(s.mine||s.userAdded);
const hidden=s=>{const m=M(s.maker);return !premium()&&!isOwn(s)&&!!m&&!isFree(m)};
const lockedPh=(cls,tag="a")=>`<${tag} class="${cls} lockph"${tag==="a"?' href="#/upgrade"':""}><span class="lk">🔒</span><span class="lt">Premium maker. Upgrade to see</span></${tag}>`;
const tileHref=s=>hidden(s)?"#/upgrade":"#/sled/"+s.id;
const tileTh=s=>hidden(s)?lockedPh("th","div"):`<div class="th" style="background-image:url('${s.img}')"></div>`;
const groupList=(arr,cur,showMk)=>`<div class="list card">${arr.map(x=>`<a class="mrow" href="${tileHref(x)}"><span class="gthumb">${hidden(x)?'<span class="glk">🔒</span>':`<span style="background-image:url('${x.img}')"></span>`}</span><span class="tx"><div class="n">@${esc(x.user)}${x.id===cur?" · this entry":""}${isOwn(x)?" (you)":""}</div>${showMk?`<div class="d">${esc(mk(x))} · ${esc(x.model)}</div>`:""}<div class="d">📅 ${esc(x.years)} · 📍 ${esc(x.locType==="na"?"Location NA":(x.town||"—"))} · ${x.imgs.length} photo${x.imgs.length==1?"":"s"}${hidden(x)?" · Premium maker":""}</div></span><span class="lk">›</span></a>`).join("")}</div>`;
const nudge=s=>{const m=+s.maker&&M(s.maker);return isOwn(s)&&m&&!isFree(m)&&!premium()?`<a class="nudge" href="#/upgrade">🔒 Unlock the full history of ${esc(disp(m))} →</a>`:""};
const makerName=id=>disp(M(id));
const sampleTag=s=>s.user&&!s.userAdded?' <span class="sample-tag">Example data</span>':"";
const initials=u=>u.replace(/[^a-z]/gi," ").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();

function postCard(s){
  const L=liked()[s.id];
  return `<article class="card post">${hidden(s)?lockedPh("ph"):`<a href="#/sled/${s.id}"><div class="ph" style="background-image:url('${s.img}')">${s.imgs&&s.imgs.length>1?`<span class="pcount">▣ ${s.imgs.length}</span>`:""}</div></a>`}
  <div class="meta"><div class="who"><span class="av">${initials(s.user)}</span>@${esc(s.user)}${sampleTag(s)}</div>
  <a href="#/sled/${s.id}" style="text-decoration:none"><div class="t">${esc(mk(s))} ${esc(s.model)}</div>
  <div class="m">Est. ${esc(s.years)} · ${esc(s.condition)}${s.town&&s.locType!=="na"?" · 📍 "+esc(s.town):""}</div></a>${editedNote(s)}${nudge(s)}
  <div class="bar"><button data-like="${s.id}">${L?"♥":"♡"} ${s.likes+(L?1:0)}</button><button type="button" data-soon>💬 Comment</button><button type="button" data-soon>↗ Share</button></div></div></article>`;
}
function bindLikes(){document.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>{const l=liked();l[b.dataset.like]=!l[b.dataset.like];LS.set("liked",l);route()})}
function commentBlock(targetType,targetId){
  const list=commentsOn(targetType,targetId);
  const form=premium()?`<form class="form cmt-form" data-cmt="${esc(targetType)}" data-tid="${esc(String(targetId))}">
    <label>Add a comment<textarea name="body" rows="3" maxlength="2000" placeholder="Write a comment…"></textarea></label>
    ${pickerHTML("cmtpk-"+String(targetId).replace(/[^a-z0-9_-]/gi,""),false)}
    <p class="legend" style="margin:0;padding:0">Optional photos (JPEG, PNG or WebP, about 2 MB each). You can post a comment, photos, or both.</p>
    <button class="btn pine" type="submit">Post comment</button></form>`
    :(lapsed()?`<p class="legend">Renew to comment or add photos.</p><a class="btn gold" href="#/upgrade">Renew membership · $15/yr</a>`:`<p class="legend">Commenting and photo comments are part of Premium.</p><a class="btn gold" href="#/upgrade">Join · $15/yr</a>`);
  const rows=list.map(c=>`<article class="cmt-card"><div class="who"><span class="av">${initials(c.user||"")}</span>@${esc(c.user||"member")}${sampleTag(c)}</div>
    ${c.body?`<p>${esc(c.body)}</p>`:""}
    ${(c.imgs||[]).length?`<div class="cmt-phs">${c.imgs.map(u=>`<span style="background-image:url('${u}')"></span>`).join("")}</div>`:""}
    ${canEdit(c)?`<button type="button" class="linkish" data-delcmt="${esc(c.id)}">Delete</button>`:""}</article>`).join("")||'<p class="legend">No comments yet.</p>';
  return `<h3 class="sec" id="comments">Comments</h3><div class="cmt-list">${rows}</div><div class="pad" style="padding-top:0">${form}</div>`;
}
function bindComments(){
  document.querySelectorAll("[data-delcmt]").forEach(b=>b.onclick=()=>{if(!confirm("Delete this comment?"))return;deleteComment(b.dataset.delcmt);toast("Comment deleted");route()});
  document.querySelectorAll("form.cmt-form").forEach(f=>{
    const pid=f.getAttribute("data-tid"), typ=f.getAttribute("data-cmt"), pk=f.querySelector(".picker");
    const getPics=pk?picker(pk.id,[],["images/ff-flexy-racer-200.jpg","images/collection-pictorial-deck-photos-p31.jpg","images/collection-red-swirl-deck-photos-p28.jpg"]):()=>[];
    f.onsubmit=async e=>{e.preventDefault();if(!premium()){location.hash="#/upgrade";return}const body=String(new FormData(f).get("body")||"").trim().slice(0,2000);const pics=getPics();if(!body&&!pics.length){toast("Write a comment or add a photo");return}
      try{const imgs=pics.length?await storePics(pics):[];addComment({id:"cm"+Date.now(),user:me(),userAdded:true,mine:true,targetType:typ,targetId:pid,body,imgs});toast("Comment posted");route()}catch(err){saveErr(err)}}});
}

const R={};
const STATE_NAMES={"illinois":"IL","wisconsin":"WI","michigan":"MI","indiana":"IN","iowa":"IA","minnesota":"MN","ohio":"OH","pennsylvania":"PA","new york":"NY","maine":"ME","massachusetts":"MA","california":"CA","texas":"TX","colorado":"CO","missouri":"MO"};
async function geocode(city,state,zip){
  city=(city||"").trim();state=(state||"").trim();zip=(zip||"").trim();
  let st=state.length>2?(STATE_NAMES[state.toLowerCase()]||state.toUpperCase()):state.toUpperCase();
  const key=(city+", "+st).toLowerCase();
  if(city&&window.TOWN_COORDS[key])return {lat:window.TOWN_COORDS[key][0],lng:window.TOWN_COORDS[key][1],how:"table"};
  try{ // low-volume Nominatim fallback (mockup only), rounded to town level
    const q=zip?`postalcode=${encodeURIComponent(zip)}`:`city=${encodeURIComponent(city)}&state=${encodeURIComponent(st)}`;
    if(zip||city){const ac=window.AbortController?new AbortController():null;const to=setTimeout(()=>ac&&ac.abort(),4000);const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&${q}`,{headers:{"Accept":"application/json"},signal:ac?ac.signal:undefined});clearTimeout(to);
      const j=await r.json();if(j&&j[0])return {lat:Math.round(+j[0].lat*100)/100,lng:Math.round(+j[0].lon*100)/100,how:"nominatim"};}
  }catch(e){}
  if(window.STATE_CENTROIDS[st])return {lat:window.STATE_CENTROIDS[st][0],lng:window.STATE_CENTROIDS[st][1],how:"state"};
  return null;
}
// ===== Countries: US (ZIP), Canada (province + optional FSA), UK (county + optional outward postcode),
// Ireland (county + optional Eircode routing key). Town level only: never a street address or full postcode.
const COUNTRIES={US:{name:"United States",short:"USA",flag:"🇺🇸",cc:"us"},CA:{name:"Canada",short:"Canada",flag:"🇨🇦",cc:"ca"},GB:{name:"United Kingdom",short:"UK",flag:"🇬🇧",cc:"gb"},IE:{name:"Ireland",short:"Ireland",flag:"🇮🇪",cc:"ie"}};
const ccOf=s=>s&&COUNTRIES[s.country]?s.country:"US";
const CA_PROV={AB:"Alberta",BC:"British Columbia",MB:"Manitoba",NB:"New Brunswick",NL:"Newfoundland and Labrador",NS:"Nova Scotia",NT:"Northwest Territories",NU:"Nunavut",ON:"Ontario",PE:"Prince Edward Island",QC:"Quebec",SK:"Saskatchewan",YT:"Yukon"};
const CA_CENT={AB:[53.9,-116.6],BC:[53.7,-127.6],MB:[53.8,-98.8],NB:[46.5,-66.2],NL:[53.1,-57.7],NS:[44.7,-63.7],NT:[64.8,-124.8],NU:[70.3,-83.1],ON:[50.0,-85.3],PE:[46.5,-63.4],QC:[52.9,-73.5],SK:[52.9,-106.5],YT:[64.3,-135.0]};
const UK_NATIONS={England:[52.6,-1.5],Scotland:[56.8,-4.2],Wales:[52.3,-3.7],"Northern Ireland":[54.6,-6.7]};
const IE_COUNTIES=["Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny","Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"];
// Keep only the coarse part of a postcode. Returns {v, cut} (cut = we dropped the rest).
function coarsePostal(cc,raw){const t=String(raw||"").toUpperCase().replace(/[^A-Z0-9 ]/g,"").trim();if(!t)return {v:"",cut:false};
  if(cc==="US"){const m=t.match(/^\d{5}/);return {v:m?m[0]:"",cut:t.replace(/\s/g,"").length>5}}
  const n=t.replace(/\s+/g,"");
  if(cc==="CA"){const m=n.match(/^[ABCEGHJ-NPRSTVXY]\d[A-Z]/);return {v:m?m[0]:"",cut:n.length>3}}
  if(cc==="IE"){const m=n.match(/^([AC-FHKNPRTV-Y]\d{2}|D6W)/);return {v:m?m[0]:"",cut:n.length>3}}
  if(cc==="GB"){let out=t.includes(" ")?t.split(/\s+/)[0]:(n.length>=5&&/\d[A-Z]{2}$/.test(n)?n.slice(0,-3):n);const ok=/^[A-Z]{1,2}\d[A-Z\d]?$/.test(out);return {v:ok?out:"",cut:ok&&out!==n}}
  return {v:"",cut:false}}
const regionDisp=(cc,r)=>!r?"":cc==="IE"?"Co. "+r:r;
function placeTown(cc,city,region,nation,postal){if(cc==="US")return null;const parts=[city,regionDisp(cc,region)].filter(Boolean);if(!parts.length&&postal)parts.push(postal);if(cc==="GB"&&nation&&!region)parts.push(nation);parts.push(COUNTRIES[cc].short);return parts.join(", ")}
// Free, no-key geocoding via OpenStreetMap Nominatim: browser sends the page as Referer; we space calls >1 s apart
// and stop after a few seconds each. Results are rounded to town level (2 decimals ≈ 1 km); region fallbacks to 1 decimal.
let nomLast=0;
async function nominatim(params){const wait=nomLast+1100-Date.now();if(wait>0)await new Promise(r=>setTimeout(r,wait));nomLast=Date.now();
  const ac=window.AbortController?new AbortController():null;const to=setTimeout(()=>ac&&ac.abort(),4000);
  try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&accept-language=en&"+params,{headers:{"Accept":"application/json"},signal:ac?ac.signal:undefined});return await r.json()}catch(e){return []}finally{clearTimeout(to)}}
const rnd=(x,d)=>Math.round(+x*Math.pow(10,d))/Math.pow(10,d);
const PLACE_TYPES=/^(city|town|village|hamlet|suburb|municipality|locality|neighbourhood|quarter|borough|isolated_dwelling|county|state_district)$/;
async function geocodeIntl(cc,city,region,nation,postal){
  const C=COUNTRIES[cc],enc=encodeURIComponent,reg=cc==="CA"?(CA_PROV[region]||region):region,start=Date.now(),late=()=>Date.now()-start>11000;
  const pick=(j,needle)=>{j=(j||[]).filter(x=>PLACE_TYPES.test(x.addresstype||x.type||""));if(!j.length)return null;if(needle){const n=needle.toLowerCase();const hit=j.find(x=>String(x.display_name).toLowerCase().includes(n));if(hit)return hit}return j[0]};
  if(city){let j=await nominatim(`countrycodes=${C.cc}&limit=5&q=${enc([city,reg].filter(Boolean).join(", "))}`);let h=pick(j);
    if(!h&&!late()){j=await nominatim(`countrycodes=${C.cc}&limit=8&q=${enc(city)}`);h=pick(j,reg||nation)}
    if(h)return {lat:rnd(h.lat,2),lng:rnd(h.lon,2),how:"town"}}
  if(postal&&!late()){const j=await nominatim(`countrycodes=${C.cc}&limit=1&postalcode=${enc(postal)}`);if(j&&j[0])return {lat:rnd(j[0].lat,2),lng:rnd(j[0].lon,2),how:"postal"}}
  if(reg&&!late()){const j=await nominatim(`countrycodes=${C.cc}&limit=1&q=${enc(reg)}`);if(j&&j[0])return {lat:rnd(j[0].lat,1),lng:rnd(j[0].lon,1),how:"region"}}
  if(cc==="CA"&&CA_CENT[region])return {lat:CA_CENT[region][0],lng:CA_CENT[region][1],how:"region"};
  if(cc==="GB"&&UK_NATIONS[nation])return {lat:UK_NATIONS[nation][0],lng:UK_NATIONS[nation][1],how:"region"};
  return null}
const ccSelect=(name,cur)=>`<select name="${name}">${Object.keys(COUNTRIES).map(k=>`<option value="${k}" ${k===cur?"selected":""}>${COUNTRIES[k].flag} ${COUNTRIES[k].name}</option>`).join("")}</select>`;
function locFields(cc,L){L=L||{};const city=esc(L.city||""),reg=L.region||"",pc=esc(L.postal||"");const sm='style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted)"';
  if(cc==="US")return `<div class="row2"><label>City / town<input name="city" value="${city}" placeholder="Schaumburg"></label><label>State<input name="state" value="${esc(reg)}" placeholder="IL" maxlength="20"></label></div>
  <label>or ZIP<input name="zip" value="${pc}" inputmode="numeric" maxlength="5" placeholder="60193"></label>`;
  if(cc==="CA")return `<label>City / town<input name="city" value="${city}" placeholder="Toronto"></label>
  <label>Province / territory<select name="state"><option value="">Choose…</option>${Object.keys(CA_PROV).map(k=>`<option value="${k}" ${k===reg?"selected":""}>${CA_PROV[k]}</option>`).join("")}</select></label>
  <label>Postal code — first 3 only (optional)<input name="zip" value="${pc}" maxlength="7" placeholder="M5V" autocapitalize="characters"><small ${sm}>Only the first 3 characters (e.g. M5V) are kept. Never the full postal code.</small></label>`;
  if(cc==="GB")return `<label>City / town / village<input name="city" value="${city}" placeholder="Kendal"></label>
  <div class="row2"><label>County<input name="state" value="${esc(reg)}" placeholder="Cumbria" maxlength="40"></label><label>Nation<select name="nation"><option value="">Choose…</option>${Object.keys(UK_NATIONS).map(k=>`<option ${k===L.nation?"selected":""}>${k}</option>`).join("")}</select></label></div>
  <label>Postcode — first part only (optional)<input name="zip" value="${pc}" maxlength="8" placeholder="LA9" autocapitalize="characters"><small ${sm}>Only the first part (e.g. LA9 or SW1A) is kept. Never the full postcode.</small></label>`;
  return `<label>City / town / village<input name="city" value="${city}" placeholder="Galway"></label>
  <label>County<select name="state"><option value="">Choose…</option>${IE_COUNTIES.map(k=>`<option ${k===reg?"selected":""}>${k}</option>`).join("")}</select></label>
  <label>Eircode — first 3 only (optional)<input name="zip" value="${pc}" maxlength="8" placeholder="H91" autocapitalize="characters"><small ${sm}>Only the routing key (e.g. H91) is kept. Never the full Eircode.</small></label>`}
const townC=x=>x&&x.town?(x.town+(x.country&&x.country!=="US"&&!/(Canada|UK|Ireland)$/.test(x.town)?", "+COUNTRIES[x.country].short:"")):"";
const locLine=s=>s.locType==="na"?"Unknown / NA (no map pin)":(s.town?`${s.locType==="now"?"Now in":"Found in"} ${s.town}`:"");
const makerEntries=()=>MAKERS.flatMap(m=>m.id==2?Object.keys(SPLIT_BRANDS).map(k=>({value:k,label:SPLIT_BRANDS[k].label,m,brand:SPLIT_BRANDS[k].brand})):[{value:String(m.id),label:disp(m),m,brand:""}]).sort((a,b)=>a.label.localeCompare(b.label));
const makerOpts=legacy2=>(legacy2?`<option value="2">${esc(disp(M(2)))} (older post: pick Fire Fly or Yankee Clipper)</option>`:"")+makerEntries().map(e=>`<option value="${e.value}">${esc(e.label)}</option>`).join("");
function teaser(m){
  const p=m.p, ms=models(m);
  const line=p&&p.text?firstSentence(p.text[0]):"[History coming soon] No written history for this maker yet.";
  const ml=(m.models||"").split(/,\s*/).filter(Boolean);
  return `<div class="teaser"><p class="eyebrow" style="margin:0 0 6px">From the Premium profile 🔒</p>
  <p class="t1">${esc(line)}</p><p class="t2">${esc(p&&p.text?(p.text.slice(1).join(" ")||"More history, dates and sources in Premium."):"Premium will add the company history as it is researched.")}</p>
  ${ml.length?`<div class="mlist"><b>Models (${ml.length})</b>${ml.map((x,i)=>`<span class="${i>0?"bl":""}">${esc(i>0?"████████":x)}</span>`).join("")}</div>`:""}
  ${p&&(p.ad||p.img)?`<div class="tad" style="background-image:url('${p.ad||p.img}')"><span>🔒 Period ad &amp; photos</span></div>`:""}
  <a class="btn gold" href="#/upgrade" style="margin-top:10px">Unlock ${esc(disp(m))} · $15/yr</a></div>`;
}
R.home=()=>{bar(window.APP_SHORT,{sub:"Rosebud Sled Museum",act:'<a class="act" href="#/search" aria-label="Search">⌕</a>'});tab("home");
  const feed=allSleds().filter(s=>s.shared);
  const free=MAKERS.filter(isFree);
  return `<div class="hero" style="background-image:url(images/hero-flexible-flyer-3c-deck-p60.jpg)"><div class="in"><b>Coasting Through History</b><span>American sled makers, 1850–1990 · tap for the timeline</span></div><a href="#/timeline" style="position:absolute;inset:0;z-index:2" aria-label="Timeline"></a></div>
  <div class="chips"><a class="chip on" href="#/database">Sled Maker and Model Database</a><a class="chip" href="#/identify">📷 Photo ID</a><a class="chip" href="#/idhelp">What sled is this?</a><a class="chip" href="#/map">🗺 Sled Picker Map ${premium()?"":"🔒"}</a><a class="chip" href="#/sale">Sleds for Sale ${premium()?"":"🔒"}</a><a class="chip" href="#/photos">Community photos ${premium()?"":"🔒"}</a><a class="chip" href="#/search">Search</a><a class="chip" href="#/timeline">Timeline ${premium()?"":"🔒"}</a><a class="chip" href="#/articles">Articles ${premium()?"":"🔒"}</a><a class="chip" href="#/events">Upcoming Events</a>${outLinkChips()}</div>
  <div class="pad" style="padding-top:12px;padding-bottom:0"><a class="btn pine" href="#/identify">📷 Identify a sled from a photo${premium()?"":" · try the demo"}</a>${orderMagBtn("margin-top:10px")}<button type="button" class="btn" style="margin-top:10px" onclick="startTour()">▶ Start tour</button><p class="legend" style="margin:8px 0 0;padding:0;text-align:center"><a href="#/suggest">💬 Send a suggestion to the developer</a></p></div>
  ${premium()?"":dbIntro()+databaseGate()}
  ${!premium()?"":`<h3 class="sec">What sled is this? <a href="#/idhelp">See all</a></h3>
  <div style="padding:0 16px">${window.ID_POSTS.slice(0,1).map(q=>`<a class="card idcard" href="#/idhelp"><div class="th" style="background-image:url('${q.img}')"></div><div><div class="small" style="font-weight:600">@${esc(q.user)} <span class="sample-tag">Example</span></div><div style="font-size:.84rem;margin-top:3px">${esc(q.q)}</div><div class="small muted" style="margin-top:3px">${q.answers.length} answer${q.answers.length==1?"":"s"} · Help identify →</div></div></a>`).join("")}</div>`}
  <h3 class="sec">Free makers <a href="#/makers">All 61</a></h3>
  <div class="hscroll">${free.map(m=>`<a class="card mk" href="#/maker/${m.id}"><div class="th" style="background-image:url('${(mImgs(models(m).find(x=>mImgs(x).length)||{})[0])||""}')"></div><div class="n">${esc(disp(m))}</div><div class="d">${esc(m.area)}</div></a>`).join("")}</div>
  ${premium()?"":`<a class="promo" href="#/upgrade"><img class="cv" src="images/vintage-runner-tuxedo-racer-cover-p1.jpg" alt=""><div><b>Become a member</b><span style="display:block;opacity:.8;margin-bottom:2px">${Object.keys(FREE).length} free · ${61-Object.keys(FREE).length} premium</span><span>Post your sleds, use the Sled Maker and Model Database, full histories, period ads, the timeline, no-frills magazine articles and selling. $15/year.</span></div></a>`}
  <h3 class="sec">Sleds for Sale <a href="#/sale">See all</a></h3>
  ${premium()?`<div class="hscroll">${allListings().slice(0,4).map(l=>`<a class="card mk" href="#/listing/${l.id}"><div class="th" style="background-image:url('${l.img}')"></div><div class="n">${l.price?esc(l.price)+" · ":""}${esc(l.title.replace("[sample] ",""))}</div><div class="d">${esc(l.town)} · Ships: ${esc(l.ship)}</div></a>`).join("")}</div>`:`<div style="padding:0 16px 8px">${gate("Sleds for Sale is for members","Only paid members can browse listings or post a sled for sale.")}</div>`}
  ${premium()?dbIntro()+`<div class="feed">${feed.map(postCard).join("")}</div>`:""}
  ${outLinkAbout()}`;
};
R.database=()=>{const html=R.home();setTimeout(()=>{const el=$("#database"),v=$("#view");if(el&&v)v.scrollTop=Math.max(0,el.offsetTop-8)},0);return html};
R.collection=()=>{bar("My Collection",{sub:"@"+me(),act:'<a class="act" href="#/add" aria-label="Add">＋</a>'});tab("collection");
  setTimeout(()=>{const g=$("#colgrid");if(!g)return;const tiles=[...g.children];document.querySelectorAll("#colf [data-f]").forEach(b=>b.onclick=()=>{const f=b.dataset.f;document.querySelectorAll("#colf [data-f]").forEach(x=>x.classList.toggle("on",x===b));
    tiles.forEach(t=>t.style.display=(f==="shared"&&t.dataset.sh!=="1")||(f==="private"&&t.dataset.sh==="1")?"none":"");
    (f==="maker"?tiles.slice().sort((a,b)=>a.dataset.mk.localeCompare(b.dataset.mk)):tiles).forEach(t=>g.appendChild(t))})});
  const mine=allSleds().filter(s=>s.mine||s.userAdded);
  if(!premium())return lapsed()?`<div class="lapsed-ghost">${mine.slice(0,4).map(()=>'<div class="lgt"></div>').join("")}</div>${gate("Membership lapsed",lapsedText(mine.length)+" While it's lapsed, your posts are hidden, including from you.")}`
    :gate("Post your sleds with membership","Cataloging and sharing sleds is part of Sled Finder membership ($15/yr). Free members can browse the free makers' curated galleries, the maker directory and Sleds for Sale.");
  const makers=new Set(mine.map(s=>s.maker));
  return `<div class="stats"><div><b>${mine.length}</b><span>Sleds</span></div><div><b>${makers.size}</b><span>Makers</span></div><div><b>${mine.filter(s=>s.shared).length}</b><span>Shared</span></div></div>
  <div class="chips" id="colf"><button type="button" class="chip on" data-f="all">All</button><button type="button" class="chip" data-f="shared">Shared</button><button type="button" class="chip" data-f="private">Private</button><button type="button" class="chip" data-f="maker">By maker</button><a class="chip" href="#/insurance">🖨 Insurance list</a></div>
  <div class="grid2" id="colgrid">${mine.map(s=>`<a class="card tile" href="#/sled/${s.id}" data-sh="${s.shared?1:0}" data-mk="${esc(mk(s))}"><div class="th" style="background-image:url('${s.img}')"></div><span class="vis">${s.shared?"Shared":"🔒 Private"}</span><div class="n">${esc(mk(s))}</div><div class="d">${esc(s.model)} · ${esc(s.years)}</div><div class="d">📍 ${esc(s.locType==="na"?"Location NA":(s.town||"—"))}</div>${s.editedBy?'<div class="d edited-s">✎ Edited by Sled Finder</div>':""}${+s.maker&&M(s.maker)&&!isFree(M(s.maker))&&!premium()?'<div class="d" style="color:var(--red);font-weight:600">🔒 Unlock full history</div>':""}</a>`).join("")}</div>
  <p class="legend" style="margin-bottom:20px">Sleds marked as samples are example data for this mockup. ${driveSyncOn()?"Sleds you add are saved in this browser and copied to Sled Finder's Google Drive.":"Sleds you add here are stored only in this browser."} Paid members can edit or delete their own posts.</p>`;
};
R.add=(editId)=>{const E=editId?allSleds().find(x=>x.id==editId):null;
  const draft=!editId?LS.get("idDraft",null):null;
  if(!editId&&!premium()){bar("Add a Sled",{sub:"Members only"});tab("add");return gate(lapsed()?"Membership lapsed":"Posting sleds is for members",lapsed()?lapsedText(allSleds().filter(isOwn).length)+" Renew to post again.":"Adding and sharing your sleds is part of Sled Finder membership ($15/yr).")}
  if(editId&&!canEdit(E))return R.upgrade("Editing your own submissions is a paid-member feature.");
  const pre=E||(draft?{maker:draft.maker,brand:draft.brand||"",makerText:draft.makerText||"",model:draft.model||"",years:draft.years||"",zip:draft.zip||""}:null);
  const adminEdit=E&&isAdmin()&&!isOwn(E);
  bar(E?(adminEdit?"Admin edit":"Edit Sled"):"Add a Sled",{back:!!E,sub:E?(adminEdit?"@"+E.user+" · as Sled Finder":"Your submission"):"Members"});tab(E?"collection":"add");
  const v=k=>E&&E[k]!=null?esc(E[k]):(draft&&draft[k]!=null?esc(draft[k]):"");
  const pics=["collection-red-swirl-deck-photos-p28.jpg","collection-pictorial-deck-photos-p31.jpg","sherwood-bros-sled-top-owner-horizontal.jpg","whx-young-america-c1855-p51.jpg","paris-dirigo-clipper-p56.jpg"];
  setTimeout(()=>{
    const getPics=picker("addpk",E?E.imgs:[],pics.map(p=>"images/"+p));
    bindMaker("addmk",pre);
    if(E){$("#addf").condition.value=E.condition;const lt=$("#addf").querySelector(`input[name=locType][value=${E.locType||"found"}]`);if(lt)lt.checked=true;$("#addf").shared.checked=!!E.shared}
    if(draft){if(draft.years)$("#addf").years.value=draft.years;if(draft.zip&&$("#addf").zip)$("#addf").zip.value=draft.zip;if(draft.model)$("#addf").model.value=draft.model}
    $("#addunk").onclick=()=>{$("#addf").years.value="Unknown"};
    $("#addf").country.onchange=ev=>{const F=$("#addf");$("#addloc").innerHTML=locFields(ev.target.value,{city:F.city?F.city.value:""})};
    $("#addf").onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector("button[type=submit]");if(btn.disabled)return;const lbl=btn.textContent;btn.disabled=true;btn.textContent="Saving…";try{const f=new FormData(e.target);
      const lt=f.get("locType"),cc=COUNTRIES[f.get("country")]?f.get("country"):"US",city=String(f.get("city")||"").trim(),st=String(f.get("state")||"").trim(),nation=String(f.get("nation")||"");
      const pc=coarsePostal(cc,f.get("zip")),zip=pc.v;
      if(lt!=="na"&&String(f.get("zip")||"").trim()&&!zip){toast(cc==="US"?"Please enter a 5-digit ZIP, or leave it blank.":"That postcode doesn't look right. Enter just the first part, or leave it blank.",4500);return}
      let g=null,town="NA";
      if(lt!=="na"){btn.textContent="Finding the map spot…";
        if(cc==="US"){g=(city||st||zip)?await geocode(city,st,zip):null;town=city?(city+(st?", "+st.toUpperCase():"")):(zip?"ZIP "+zip:(st?st.toUpperCase():""))}
        else{town=(city||st||zip||nation)?placeTown(cc,city,st,nation,zip):"";g=town?await geocodeIntl(cc,city,st,nation,zip):null}
        btn.textContent="Saving…";
        if(!town&&E){town=E.town;g=E.lat!=null?{lat:E.lat,lng:E.lng,how:E.geo}:null}}
      const pinNote=lt==="na"||!town?"":(!g?" · no map pin: we couldn't find that town (you can edit it later)":(g.how==="region"||g.how==="state"?" · map pin placed at the "+(cc==="US"?"state":cc==="CA"?"province":"county/region")+" centre":""))+(pc.cut?" · only the first part of the postcode was kept":"");
      const base=E?Object.assign({},E):{id:"u"+Date.now(),user:"you",userAdded:true,mine:true,likes:0};
      const s=Object.assign(base,makerVals(f),{model:f.get("model")||"Untitled sled",sledType:SLED_TYPES.includes(f.get("sledType"))?f.get("sledType"):"",years:String(f.get("years")||"").trim()||"Unknown",year:undefined,size:f.get("size")||"—",condition:f.get("condition"),found:f.get("found")||"—",notes:f.get("notes")||"",shared:!!f.get("shared"),locType:lt,country:cc,city:lt==="na"?"":city,region:lt==="na"?"":st,nation:cc==="GB"&&lt!=="na"?nation:"",postal:lt==="na"?"":zip,zip:cc==="US"&&lt!=="na"?zip:"",town:town,lat:g?g.lat:null,lng:g?g.lng:null,geo:g?g.how:null,imgs:getPics().length?await storePics(getPics()):["images/collection-red-swirl-deck-photos-p28.jpg"],img:undefined});s.img=s.imgs[0];if(adminEdit)s.editedBy="Sled Finder";
      if(E){await lsSave(()=>saveSled(s));toast("Changes saved"+pinNote,pinNote?5000:0)}else{await lsSave(()=>addSled(s));try{LS.set("idDraft",null)}catch(x){}toast("Sled saved to your collection"+pinNote,pinNote?5000:0)}
      if(String(s.id).startsWith("u"))autoSync(s);
      location.hash="#/sled/"+s.id}catch(err){saveErr(err)}finally{btn.disabled=false;btn.textContent=lbl}};
  });
  const [ci,stt]=(E&&E.town&&E.town!=="NA"&&!/^ZIP /.test(E.town))?E.town.split(/,\s*/):["",""];
  const locInit=E&&E.country&&E.country!=="US"?{cc:E.country,city:E.city||"",region:E.region||"",nation:E.nation||"",postal:E.postal||""}:{cc:"US",city:E&&E.city!=null?E.city:(ci||""),region:E&&E.region!=null?E.region:(stt||""),postal:(E&&(E.zip||((String(E.town||"").match(/^ZIP (\d{5})$/)||[])[1])))||(draft&&draft.zip)||""};
  return `<form class="form" id="addf">
  ${pickerHTML("addpk",false)}
  ${makerFields("addmk",pre)}
  <label>Model<input name="model" value="${v("model")}" placeholder="e.g. Speedster, Lightning Guider"></label>
  <label>Sled type${typeSel("sledType",E&&E.sledType||"")}</label>
  <label>Estimated years of manufacture<span class="inl"><input name="years" value="${v("years")}" placeholder="e.g. c. 1925–1935"><button type="button" class="btn sm" id="addunk">Unknown</button></span><small class="hint">Your best estimate. Leave blank or tap Unknown if you're not sure.</small></label>
  <label>Size<input name="size" value="${v("size")}" placeholder="e.g. 42 in."></label>
  <label>Condition<select name="condition"><option>Excellent</option><option selected>Good</option><option>Fair</option><option>Poor</option><option>Restored</option></select></label>
  <label>Where found<input name="found" value="${v("found")}" placeholder="Estate sale, barn, auction…"></label>
  <fieldset class="locset"><legend>Map location (town level only)</legend>
  <div class="seg"><label><input type="radio" name="locType" value="found" checked> Where it was found / sourced</label><label><input type="radio" name="locType" value="now"> Where it is now</label><label><input type="radio" name="locType" value="na"> Unknown / NA (no map pin)</label></div>
  <label>Country${ccSelect("country",locInit.cc)}</label>
  <div id="addloc" style="display:flex;flex-direction:column;gap:14px">${locFields(locInit.cc,locInit)}</div>
  <small class="muted" style="font-size:.7rem">Only the town shows on the map. Never enter a street address or a full postcode. Choose NA if you don't know.</small></fieldset>
  <label>Notes<textarea name="notes" placeholder="Stencils, stamps, repairs, provenance…">${v("notes")}</textarea></label>
  <label class="toggle"><span>Share in the Sled Maker and Model Database<small>Off = only you can see it</small></span><span class="sw"><input type="checkbox" name="shared" checked><i></i></span></label>
  ${adminEdit?'<p class="legend" style="margin:0;padding:0">Saving marks this post “Edited by Sled Finder”.</p>':ackHTML()}
  <button class="btn solid" type="submit">${E?"Save changes":"Save sled"}</button>
  ${E?"":`<p class="legend" style="margin:0">Paid members can edit or delete their own posts later.</p>${draft?'<p class="legend" style="margin:0">Maker, years and origin ZIP were filled from the photo ID demo. You can change anything before you save.</p>':""}<a class="btn" href="#/identify">📷 Identify from a photo first</a><a class="btn" href="#/idhelp">Not sure? Ask “What sled is this?”</a>`}</form>`;
};
R.edit=id=>R.add(id);
R.sled=id=>{const s=allSleds().find(x=>x.id==id);if(!s)return R.home();const m=+s.maker?M(s.maker):null;
  if(!premium()){bar("Sled",{back:true});tab(isOwn(s)?"collection":"home");return isOwn(s)&&lapsed()?gate("Membership lapsed",lapsedText(allSleds().filter(isOwn).length)):databaseGate()}
  bar(m?disp(m):"Sled",{back:true,sub:s.model});tab(s.mine||s.userAdded?"collection":"home");
  const grp=sameModel(s);
  return `${gallery(s.imgs,hidden(s))}
  <div class="title-block"><h1>${esc(mk(s))} ${esc(s.model)}</h1><div class="small muted" style="margin-top:4px">@${esc(s.user)}${sampleTag(s)} · ${s.shared?"Shared":"🔒 Private"}</div>${editedNote(s)}</div>
  ${nudge(s)?`<div style="padding:8px 16px 0">${nudge(s)}</div>`:""}<dl class="dl"><div><dt>Maker</dt><dd>${m?`<a href="#/maker/${m.id}">${esc(mk(s))}</a>`:(s.makerText?esc(s.makerText)+' <span class="unconf">unconfirmed</span>':"Unknown maker")}</dd></div><div><dt>Model</dt><dd>${esc(s.model)}</dd></div>${typeLine(s)}<div><dt>Est. years made</dt><dd>${esc(s.years)}</dd></div><div><dt>Size</dt><dd>${esc(s.size)}</dd></div><div><dt>Condition</dt><dd>${esc(s.condition)}</dd></div><div><dt>Where found</dt><dd>${esc(s.found)}</dd></div>${s.town||s.locType==="na"?`<div><dt>Map location</dt><dd>${esc(locLine(s))}${!s.userAdded?" [sample]":""}${s.lat!=null?' · <a href="#/map">Sled Picker Map</a>':""}</dd></div>`:""}<div><dt>Notes</dt><dd>${esc(s.notes)}</dd></div></dl>
  ${isOwn(s)&&m&&!isFree(m)&&!premium()?teaser(m):""}<div style="padding:16px;display:flex;flex-direction:column;gap:10px">${m?`<a class="btn pine" href="#/maker/${m.id}">About ${esc(disp(m))}</a>`:`<a class="btn pine" href="#/unknown">Unknown / unconfirmed makers</a>`}${editBar(s,"#/edit/"+s.id,"sled")}</div>
  ${commentBlock("sled",s.id)}
  ${m&&grp.length>1?`<h3 class="sec">${esc(mk(s))} ${esc(s.model)}: ${grp.length} collectors</h3>${groupList(grp,s.id)}`:""}`;
};
R.makers=()=>{bar("Makers",{sub:"61 American sled companies",act:'<a class="act" href="#/map" aria-label="Sled Picker Map">🗺</a>'});tab("makers");
  setTimeout(()=>{const i=$("#mq");i.oninput=()=>{const q=i.value.toLowerCase();document.querySelectorAll(".mrow").forEach(r=>r.style.display=r.dataset.s.includes(q)?"":"none")}});
  const row=m=>`<a class="mrow" href="#/maker/${m.id}" data-s="${esc((disp(m)+" "+m.name+" "+m.area+" "+m.models+" "+(companyOf(m)?companyOf(m).name+" "+companyOf(m).brands.map(b=>b.name).join(" "):"")).toLowerCase())}"><span class="num">${m.id}</span><span class="tx"><div class="n">${esc(disp(m))}</div><div class="d"><span class="dot ${m.book?"blk":"grn"}"></span>${esc(m.area||"Location unknown")}${m.years?" · "+esc(m.years):""}</div>${companyOf(m)?`<div class="d co">Brand of ${esc(companyOf(m).name)}</div>`:""}</span>${isFree(m)?'<span class="free-pill">Free</span>':(premium()?'<span class="lk">›</span>':'<span class="lk">🔒</span>')}</a>`;
  const free=MAKERS.filter(isFree),rest=MAKERS.filter(m=>!isFree(m));
  return `<div class="search"><span>⌕</span><input id="mq" placeholder="Search 61 makers, towns, models"></div>
  <p class="legend"><span class="dot blk"></span>Listed in Joan Palicia's books &nbsp; <span class="dot grn"></span>Jonathan Spangler's finds</p>
  <p class="legend" style="margin-top:8px;font-weight:600;color:var(--ink-soft)">${free.length} free makers · ${rest.length} premium</p>
  <h3 class="sec">Free makers (${free.length}) <span class="small muted" style="font-family:var(--sans)">limited gallery</span></h3><div class="list card">${free.map(row).join("")}</div>
  <h3 class="sec">${premium()?"Premium profiles":"Premium · name & dates only"} (${rest.length}) ${premium()?"":'<a href="#/upgrade">Unlock</a>'}</h3><div class="list card">${rest.map(row).join("")}</div>
  <h3 class="sec">Unknown / unconfirmed makers</h3><div class="list card"><a class="mrow" href="#/unknown"><span class="num">?</span><span class="tx"><div class="n">Sleds with an unknown or custom maker</div><div class="d">${allSleds().filter(s=>!+s.maker&&(s.shared||isOwn(s))).length} posts · not filed under any real maker</div></span>${premium()?'<span class="lk">›</span>':'<span class="lk">🔒</span>'}</a></div><div style="height:16px"></div>`;
};
function lockBox(title,sub){return `<div class="locked"><div class="blur">Company history, founders, factory locations, model guide with dates, catalog numbers and identifying marks, and period advertisements from the trade press.</div><div class="ov">🔒<b>${title}</b><span>${sub}</span><a class="btn gold" href="#/upgrade">See Premium · $15/yr</a></div></div>`}
R.maker=id=>{const m=M(id);if(!m)return R.makers();const p=m.p,free=isFree(m),P=premium(),ms=models(m);
  bar(disp(m),{back:true,sub:P?"Premium profile":(free?"Free · limited":"Premium maker · locked")});tab("makers");
  const facts=`<dl class="facts"><div><dt>Production area</dt><dd>${esc(m.area||"—")}</dd></div><div><dt>Years (matrix)</dt><dd>${esc(m.years||"—")}</dd></div><div><dt>Sled type</dt><dd>${esc(m.type||"—")}</dd></div><div><dt>Source</dt><dd>${m.book?"Palicia's books":"Spangler find"}</dd></div></dl>`;
  const mcard=(x,i)=>{const im=mImgs(x);return `<${im.length?`a href="#/mphotos/${m.id}/${i}"`:"div"} class="card tile">${im.length?`<div class="th" style="background-image:url('${im[0]}')">${im.length>1?`<span class="pcount">▣ ${im.length}</span>`:""}</div>`:`<div class="th nophoto">${x.sample?"[sample model]":"No photo yet"}</div>`}<div class="n">${esc(x.n)}${x.sample?' <span class="sample-tag">Placeholder</span>':""}</div><div class="d">${esc(x.d)}</div></${im.length?"a":"div"}>`};
  let body="";
  if(P){
    body=`${p&&p.img?`<figure class="fig"><img src="${p.img}" alt=""><figcaption>${esc(p.cap)}</figcaption></figure>`:""}
    ${p?`<div class="mp-head" style="padding-top:6px"><div class="small" style="font-weight:600">${esc(p.head)}</div><div class="conf" style="margin-top:4px">Confidence: ${esc(p.conf)}</div></div><div class="prose">${p.text.map(t=>`<p>${esc(t)}</p>`).join("")}</div>`:`<div class="prose"><p class="muted">[History coming soon] No written history for this maker yet.</p></div>`}
    <h3 class="sec">Models & brands (matrix)</h3><div class="prose"><p>${esc(m.models||"—")}</p></div>
    ${brandsOf(m).length>1?brandsOf(m).map(b=>{const bi=ms.map((x,i)=>[x,i]).filter(([x])=>x.brand===b.name);return `<h3 class="sec">${esc(b.name)} models (${bi.length})</h3>${bi.length?`<div class="grid2">${bi.map(([x,i])=>mcard(x,i)).join("")}</div>`:'<p class="small muted" style="padding:0 16px">No models catalogued yet.</p>'}`}).join(""):(ms.length?`<h3 class="sec">Model gallery (${ms.length})</h3><div class="grid2">${ms.map(mcard).join("")}</div>`:"")}
    ${p&&p.ad?`<h3 class="sec">Period advertisement</h3><figure class="fig"><img src="${p.ad}" alt=""><figcaption>${esc(p.adcap)}</figcaption></figure>`:""}
    <p class="src">${p?"History condensed from the Rosebud Sled Museum company briefs (Jonathan Spangler, Nov 2026), which list full sources.":"Name, place and dates from Jonathan Spangler's sled manufacturer matrix."}</p>`;
  }else if(free){
    const n=window.FREE_GALLERY_COUNT||5, shown=ms.slice(0,n), more=ms.length-shown.length;
    body=`<h3 class="sec">Model gallery <span class="small muted" style="font-family:var(--sans)">${shown.length} of ${ms.length}</span></h3><div class="grid2">${shown.map(mcard).join("")}</div>
    ${lockBox(more>0?`${more} more models & photos`:"Complete model list","The complete model list, extra photos, full history and period ads are Premium.")}
    ${p?`<h3 class="sec">History</h3><div class="prose"><p>${esc(firstSentence(p.text[0]))}</p></div>`+lockBox("Full history is Premium","Founders, factories, dates and sources."):""}
    ${p&&p.ad?`<h3 class="sec">Period advertisement</h3>`+lockBox("Period ads are Premium","Trade-press and catalog ads."):""}`;
  }else{
    body=`<div class="prose"><p class="muted">Free members see the name, place and dates. Premium unlocks the history, model gallery and period ads.</p></div>${lockBox("Premium maker","History, model gallery and period advertisements.")}`;
  }
  return `<div class="mp-head"><p class="eyebrow">Maker #${m.id} of 61 ${free?'· <span class="free-pill">Free</span>':""}</p><h1>${esc(disp(m))}</h1>${disp(m)!==m.name?`<div class="small muted">Matrix entry: ${esc(m.name)}</div>`:""}</div>${facts}${brandBox(m)}${body}
  <h3 class="sec">Collectors' sleds by model</h3>${!premium()?databaseGate():(()=>{const G={};allSleds().filter(s=>s.maker==m.id&&(s.shared||isOwn(s))).forEach(s=>{(G[modelKey(s)]=G[modelKey(s)]||[]).push(s)});const ks=Object.keys(G);
    return ks.length?ks.map(k=>{const g=G[k];return `<p class="grp-h"><b>${esc(disp(m))} ${esc(g[0].model)}</b> · ${g.length} collector${g.length==1?"":"s"}</p>${groupList(g)}`}).join(""):'<p class="small muted" style="padding:0 16px">No shared sleds yet.</p>'})()}<div style="height:20px"></div>`;
};
R.search=()=>{bar("Search",{back:true,sub:"Makers, models, collectors"});tab("home");
  setTimeout(()=>{const i=$("#q"),out=$("#res");const run=()=>{const q=i.value.trim().toLowerCase();
    if(!q){out.innerHTML='<p class="legend">Try “Flyer”, “Chicago”, “Speedster”, “Garton” or “Flexy Racer”.</p>';return}
    const mks=makerEntries().filter(e=>(e.label+" "+(e.brand?"":e.m.name+" "+e.m.models)+" "+e.m.area).toLowerCase().includes(q));
    const sl=premium()?allSleds().filter(s=>s.shared||s.mine||s.userAdded).filter(s=>(mk(s)+" "+s.model+" "+(s.sledType||"")+" "+s.user+" "+s.years+" "+(s.locType!=="na"?(s.town||"")+" "+COUNTRIES[ccOf(s)].name+" "+(s.region||""):"")).toLowerCase().includes(q)):[];
    out.innerHTML=`<h3 class="sec">Makers (${mks.length})</h3><div class="list card">${mks.map(({m,label})=>`<a class="mrow" href="#/maker/${m.id}"><span class="num">${m.id}</span><span class="tx"><div class="n">${esc(label)}</div><div class="d">${esc(m.area)} · ${esc(m.models||"")}</div></span>${isFree(m)?'<span class="free-pill">Free</span>':premium()?"›":"🔒"}</a>`).join("")||'<div class="mrow">No makers</div>'}</div>
    ${premium()?`<h3 class="sec">Collectors' sleds (${sl.length})</h3><div class="grid2">${sl.map(s=>`<a class="card tile" href="${tileHref(s)}">${tileTh(s)}<div class="n">${esc(mk(s))}</div><div class="d">${esc(s.model)}${typeOf(s)?" · "+esc(typeOf(s)):""} · ${esc(s.years)}</div><div class="d">@${esc(s.user)}${s.town&&s.locType!=="na"?" · 📍 "+esc(s.town):""}</div></a>`).join("")}</div>`:`<h3 class="sec">Collectors' sleds</h3>${databaseGate()}`}`};
    i.oninput=run;i.value=LS.get("lastq","Paris");run();i.addEventListener("change",()=>LS.set("lastq",i.value))});
  return `<div class="search"><span>⌕</span><input id="q" placeholder="Search makers, models, types (e.g. Flexy Racer), collectors, towns" autofocus></div><div id="res"></div>`;
};
R.idhelp=()=>{bar("What sled is this?",{back:true,sub:"Community ID help"});tab("home");
  if(!premium())return databaseGate();
  return `<div class="pad"><a class="btn pine" href="#/identify">📷 Identify from a photo</a><a class="btn solid" style="margin-top:10px" href="#/add">Post a photo for community ID</a></div>
  <div class="feed">${window.ID_POSTS.map(q=>`<article class="card post"><div class="ph" style="background-image:url('${q.img}')"></div><div class="meta"><div class="who"><span class="av">${initials(q.user)}</span>@${esc(q.user)} <span class="sample-tag">Example data</span></div><div style="font-size:.88rem">${esc(q.q)}</div>
  ${q.answers.map(a=>`<div style="margin-top:8px;padding:8px 10px;background:var(--stone);border-radius:10px;font-size:.8rem">${esc(a)}</div>`).join("")}
  <div class="bar"><span>💬 ${q.answers.length} answers</span><span>✋ I know this one</span></div></div></article>`).join("")}</div>`;
};
R.timeline=()=>{bar("Coasting Through History",{back:true,sub:premium()?"Sledding in America":"Preview · Premium"});tab("home");
  if(!premium()){const T=window.TIMELINE||[];return `<p class="legend" style="margin-top:14px">A preview of the Rosebud Sled Museum timeline. The full timeline is part of Premium.</p>
  <ol class="tl">${T.slice(0,3).map(t=>`<li class="${t.il?"il":""}"><div class="y">${esc(t.y)}${t.il?"<em>Illinois</em>":""}</div><p>${esc(t.t)}</p></li>`).join("")}</ol>
  <div class="locked" style="margin:0 16px 20px"><div class="blur">${T.slice(3,6).map(t=>esc(t.y+" — "+t.t)).join(" ")}</div><div class="ov">🔒<b>${T.length-3} more moments</b><span>The full Coasting Through History timeline is Premium.</span><a class="btn gold" href="#/upgrade">${lapsed()?"Renew membership · $15/yr":"Join · $15/yr"}</a></div></div>`}
  return `<p class="legend" style="margin-top:14px">From the Rosebud Sled Museum timeline prepared for the Gail Borden Public Library display (Jan 2027). Green dots are Illinois stories.</p>
  <ol class="tl">${window.TIMELINE.map(t=>`<li class="${t.il?"il":""}"><div class="y">${esc(t.y)}${t.il?"<em>Illinois</em>":""}</div><p>${esc(t.t)}</p></li>`).join("")}</ol>`;
};
function magazine(){return window.MAGAZINE||{articles:[],orderUrl:"https://rosebudsledmuseum.com/#magazine",cover:"images/vintage-runner-tuxedo-racer-cover-p1.jpg"}}
// Online-only exclusive articles (not printed in the magazine). Titles and
// teasers are placeholders only — no invented historical facts.
const EXCLUSIVES=[
  {id:"placeholder-1",title:"Coming soon: online-only article 1",dek:"A short exclusive for members, not printed in the magazine."},
  {id:"placeholder-2",title:"Coming soon: online-only article 2",dek:"A future short article that will not appear in the printed Vintage Runner."},
  {id:"placeholder-3",title:"Coming soon: online-only article 3",dek:"Another members-only short piece, being written now."}
];
const exclusivePlaceholderBody="This exclusive article is still being written. When it is ready, paid members will read it here. It is online only and will not be printed in the magazine. This entry is an example placeholder.";
function exclusives(){const cloud=CLOUD&&CLOUD.exclusives();if(cloud&&cloud.length)return cloud.map(a=>({id:a.id,title:a.title,dek:a.dek||"",body:a.body||exclusivePlaceholderBody,example:!!a.example}));return EXCLUSIVES.map(a=>Object.assign({body:exclusivePlaceholderBody,example:true},a))}

// Order link for everyone (all tiers): the magazine section on rosebudsledmuseum.com (same link the app already uses).
const orderMagBtn=(st)=>`<a class="btn gold" href="${esc(magazine().orderUrl)}" target="_blank" rel="noopener"${st?` style="${st}"`:""}>📖 Order Vintage Runner Magazine</a>`;
function magCta(){
  const M=magazine();
  return `<div class="art-cta"><div><b>Want the photographs and the layout?</b><p>These are no-frills text editions for reading in the app. The printed Vintage Runner keeps the photos, catalog plates and original design.</p><p class="small muted">${esc(M.orderPrices||"")}. ${esc(M.shipping||"")}</p></div><a class="btn pine" href="${esc(M.orderUrl)}" target="_blank" rel="noopener">Order the print edition</a></div>`;
}
function artBlocks(blocks){
  return (blocks||[]).map(b=>{
    if(b.type==="h") return `<h3 class="art-h">${esc(b.text)}</h3>`;
    if(b.type==="p") return `<p>${esc(b.text)}</p>`;
    if(b.type==="quote") return `<blockquote class="art-q"><p>${esc(b.text)}</p>${b.cite?`<cite>${esc(b.cite)}</cite>`:""}</blockquote>`;
    if(b.type==="caption") return `<p class="art-cap">${esc(b.text)}</p>`;
    if(b.type==="note") return `<p class="art-note">${esc(b.text)}</p>`;
    if(b.type==="catalog") return `<ol class="art-cat">${(b.items||[]).map(it=>`<li><b>${esc(it.name)}</b><span>${esc([it.maker,it.place,it.years].filter(Boolean).join(" · "))}</span></li>`).join("")}</ol>`;
    if(b.type==="results") return `<div class="art-res"><h4>${esc(b.title||"Results")}</h4>${(b.groups||[]).map(g=>`<div class="art-res-g"><div class="art-res-h">${esc(g.name)}</div><ol>${(g.places||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`).join("")}</div>`;
    if(b.type==="timeline") return `<ol class="art-years">${(b.items||[]).map(it=>`<li><b>${esc(it.year)}</b><span>${esc(it.text)}</span></li>`).join("")}</ol>`;
    return "";
  }).join("");
}
R.articles=()=>R.magazine();
R.magazine=()=>{
  const M=magazine(), arts=M.articles||[], P=premium();
  bar("Articles",{back:true,sub:P?"Vintage Runner Magazine + Exclusive Articles":"Titles and teasers"});tab("home");
  const go=(href,n,title,dek,extra)=>`<a class="art-row" href="${href}"><span class="art-n">${n}</span><span class="art-meta"><b>${esc(title)}</b><em>${esc(dek)}</em>${extra||""}</span><span class="${P?"art-go":"art-lock"}">${P?"›":"🔒"}</span></a>`;
  const exTags=`<span class="art-tags"><span class="sample-tag">Example</span><span class="sample-tag">Coming soon</span><span class="sample-tag">Online only</span></span>`;
  const exList=(typeof exclusives==="function"?exclusives():EXCLUSIVES);
  return `<div class="art-issue">
  <div style="margin:0 0 14px">${orderMagBtn()}</div>
  <h3 class="sec" id="exclusives" style="margin:0 0 8px">Exclusive Articles</h3>
  <p class="legend" style="margin:0 0 10px">Short, online-only articles published throughout the year for paid members. They are not printed in Vintage Runner Magazine, which comes out once a year around Thanksgiving and winter. Free and lapsed members can read the titles and teasers. Opening an article is part of Premium. Entries marked Example or Coming soon are placeholders, not finished articles.</p>
  <div class="art-list">${exList.map((a,i)=>go("#/exclusive/"+a.id,String(i+1).padStart(2,"0"),a.title,a.dek,exTags)).join("")}</div>
  <div class="art-hero" id="magazine" style="margin-top:22px"><img src="${esc(M.cover)}" alt="Vintage Runner cover"><div><div class="eyebrow">${esc(M.issue)} · ${esc(M.edition)}</div><b>Vintage Runner Magazine</b><p>Published annually around Thanksgiving and winter. These are no-frills text editions to read in the app. The printed magazine keeps the photographs and the layout. Exclusive Articles above are a separate, online-only category and do not appear in the magazine.</p></div></div>
  ${magCta()}
  <p class="legend" style="margin:8px 0 4px">Print copies are sold separately; Apple only allows digital content in an in-app subscription.${P?"":" Opening Issue 1 articles is part of Premium."}</p>
  <div class="art-list">${arts.map((a,i)=>go("#/article/"+a.id,String(i+1).padStart(2,"0"),a.title,a.dek,a.byline?`<span class="small muted">By ${esc(a.byline)}</span>`:"")).join("")}</div></div>`;
};
R.exclusive=id=>{
  const a=exclusives().find(x=>x.id===id);
  if(!a)return R.magazine();
  if(!premium())return paywall("Exclusive Articles are included with Premium. They are short, online-only pieces published throughout the year and are not printed in the magazine.");
  bar("Exclusive Articles",{back:true,sub:"Online only · not in the magazine"});tab("home");
  return `<article class="art-read">
    ${a.example?'<div class="mock-banner">Example placeholder · online only · not printed in the magazine</div>':""}
    <p class="eyebrow">Exclusive Article · Online only · throughout the year</p>
    <h1>${esc(a.title)}</h1>
    <p class="art-dek">${esc(a.dek)}</p>
    <div class="art-body"><p class="art-note">${esc(a.body||exclusivePlaceholderBody)}</p></div>
    <p class="legend"><a href="#/articles">Back to Exclusive Articles and Vintage Runner</a></p>
  </article>`;
};
R.article=id=>{if(!premium())return paywall("Vintage Runner articles are included with Premium. The print magazine is sold separately.");
  const M=magazine(), arts=M.articles||[], a=arts.find(x=>x.id===id);
  if(!a)return R.magazine();
  const i=arts.indexOf(a), prev=arts[i-1], next=arts[i+1];
  bar("Vintage Runner",{back:true,sub:(a.kicker||"Issue 1")+" · text edition"});tab("home");
  return `<article class="art-read">
    <p class="eyebrow">${esc(a.kicker||M.issue||"")}${a.dateline?" · "+esc(a.dateline):""}</p>
    <h1>${esc(a.title)}</h1>
    ${a.fullTitle&&a.fullTitle!==a.title?`<p class="art-full">${esc(a.fullTitle)}</p>`:""}
    <p class="art-dek">${esc(a.dek)}</p>
    ${a.byline?`<p class="art-by">By ${esc(a.byline)}</p>`:""}
    <div class="art-body">${artBlocks(a.blocks)}</div>
    <nav class="art-next">${prev?`<a href="#/article/${prev.id}">‹ ${esc(prev.title)}</a>`:"<span></span>"}${next?`<a href="#/article/${next.id}">${esc(next.title)} ›</a>`:"<span></span>"}</nav>
    ${magCta()}
    <p class="legend"><a href="#/articles">All Issue 1 articles</a></p>
  </article>`;
};
function paywall(reason){return R.upgrade(reason)}
R.upgrade=(reason)=>{if(CLOUD)return liveUpgrade(reason);bar(window.APP_NAME+" Premium",{back:true,sub:"Mock paywall"});tab("");
  if(premium()){return `<div class="mock-banner">MOCKUP · no real payment was taken</div><div class="pad" style="text-align:center"><p style="font-family:var(--serif);font-size:1.6rem;margin:20px 0 6px">${isAdmin()?"Admin preview (Sled Finder)":"You're previewing Premium"}</p><p class="small muted">All 61 makers, model lists, ads, the timeline, the articles and selling are unlocked in this demo.</p><div style="display:flex;flex-direction:column;gap:10px;margin-top:18px"><a class="btn pine" href="#/makers">Browse all 61 makers</a><a class="btn" href="#/articles">Read the articles</a><a class="btn" href="#/timeline">Open the timeline</a><button class="btn" id="cancelP">End preview (back to Free)</button></div></div>`}
  setTimeout(()=>{$("#buy").onclick=()=>{const was=lapsed();setRole("premium");toast(was?"Mockup: membership renewed, your posts are back":"Mockup: Premium unlocked, no payment taken");location.hash=was?"#/collection":"#/makers"}});
  const r=(t,f,p)=>`<div class="r"><span>${t}</span><span class="${f?"yes":"no"}">${f===true?"✓":f||"—"}</span><span class="yes">✓</span></div>`;
  return `<div class="mock-banner">MOCKUP · no real payment · nothing is charged</div>
  <div class="pw-hero"><p class="eyebrow" style="color:#e7b7a5">${esc(window.APP_NAME)} Premium</p><h1>${lapsed()?"Welcome back. Renew to bring your posts back.":"Post, see and sell sleds. All 61 makers."}</h1><p>${esc(typeof reason==="string"?reason:(lapsed()?lapsedText(allSleds().filter(isOwn).length):"Your research library and community for antique sleds."))}</p></div>
  <div class="compare"><div class="r h"><span>What you get</span><span>Free</span><span>Premium</span></div>
  ${r("Search makers & models",true)}${r("Browse Sleds for Sale",false)}${r("Maker profiles",`${Object.keys(FREE).length} free, limited`)}${r("Curated model galleries","Limited")}${r("Post & catalog your sleds",false)}${r("Sled Maker and Model Database (view, add, search &amp; map)",false)}${r("“What sled is this?” ID help",false)}${r("All 61 company histories",false)}${r("Complete model lists & extra photos",false)}${r("Period advertisements",false)}${r("Sell your sleds",false)}${r("Edit & delete your own submissions",false)}${r("Coasting Through History timeline",false)}${r("Vintage Runner articles (text)",false)}${r("Exclusive Articles (online only, throughout the year, not in the magazine)","Titles only")}${r("Community photo posts &amp; comments",false)}${r("Museum admission ticket",false)}${r("Printable insurance list",false)}</div>
  <div class="price"><div><div class="small muted">Yearly · renews automatically</div><b>$15.00 / year</b></div><span class="badge-prem">Best value</span></div>
  <div class="pad"><button class="btn gold" id="buy">${lapsed()?"Renew membership (mock)":"Start Premium (mock)"}</button><a class="btn" style="margin-top:10px;border:0" href="#/home">Not now</a></div>
  <p class="fine">In the real app, payment would go through the App Store. The subscription renews each year unless cancelled at least 24 hours before renewal in your phone's Settings. This mockup does not charge anything. If a membership lapses, your posts stay in Sled Finder and come back when you renew. See the <a href="#/terms">Terms &amp; Community Guidelines (draft)</a>.</p>`;
};
R.profile=()=>{bar("Profile",{sub:ROLES[role()]});tab("profile");
  setTimeout(()=>{document.querySelectorAll("input[name=role]").forEach(r=>r.onchange=()=>{setRole(r.value);toast("Demo role: "+ROLES[r.value]);route()});bindDriveSync()});
  const mine=allSleds().filter(s=>s.mine||s.userAdded);
  const signedIn=!!(CLOUD&&CLOUD.user);
  return `<div class="prof"><span class="av big">${esc(initials(me())||"SF")}</span><div><h1>@${esc(me())}</h1><div class="small muted">${CLOUD?(signedIn?esc(CLOUD.email())+" · "+mine.length+" sleds":"Not signed in · "+mine.length+" sleds on this phone"):"Example profile · "+mine.length+" sleds · joined 2026"}</div></div></div>
  ${CLOUD?`<div class="menu"><a href="#/account">${signedIn?"Account, membership &amp; sync":"Sign in or create an account"} <span class="small muted">${signedIn?(CLOUD.pending()?CLOUD.pending()+" waiting to upload ›":"Synced ›"):"›"}</span></a></div>`:""}
  <div class="menu"><a href="#/notifications">Notifications ${unreadNotificationCount()?`<span class="small muted">${unreadNotificationCount()} new ›</span>`:"<span>›</span>"}</a><a href="#/collection">My collection <span>›</span></a><a href="#/photos">Community photos ${premium()?"":"🔒"}<span>›</span></a><a href="#/ticket">Museum ticket ${premium()?"":"🔒"}<span>›</span></a><a href="#/idhelp">My ID requests <span>›</span></a><a href="#/upgrade">Subscription <span class="small muted">${ROLES[role()]} ›</span></a><a href="${esc(magazine().orderUrl)}" target="_blank" rel="noopener">📖 Order Vintage Runner Magazine <span>↗</span></a><a href="#/suggest">💬 Send a suggestion to the developer <span>›</span></a></div>
  ${driveSyncHTML()}
  ${canViewAs()?`<h3 class="sec">${CLOUD?"Preview as (admin, this screen only)":"Demo role switcher"}</h3><div class="menu roles">${Object.keys(ROLES).map(k=>`<label><span>${ROLES[k]}</span><input type="radio" name="role" value="${k}" ${role()===k?"checked":""}></label>`).join("")}</div>`:""}
  <div class="menu"><a href="#/database">Sled Maker and Model Database ${premium()?"":"🔒"}<span>›</span></a><a href="#/identify">Identify a sled from a photo ${premium()?"":"🔒"}<span>›</span></a><a href="#/map">Sled Picker Map ${premium()?"":"🔒"}<span>›</span></a><a href="#/timeline">Coasting Through History ${premium()?"":"🔒"}<span>›</span></a><a href="#/articles">Vintage Runner Magazine ${premium()?"":"🔒"}<span>›</span></a><a href="#/articles">Exclusive Articles ${premium()?"":"🔒"}<span>›</span></a><a href="#/events">Upcoming Events <span>›</span></a><a href="#/makers">Sled makers directory <span>›</span></a></div>
  <h3 class="sec">About</h3>
  ${outLinkMenu()}
  <div class="menu"><a href="#/terms">Privacy: private sleds are visible only to you <span>›</span></a><a href="#/terms">Terms &amp; Community Guidelines (draft) <span>›</span></a></div>
  <p class="legend" style="padding-bottom:24px">${CLOUD?"Sled Finder "+APP_VER+". Your sleds are kept on this phone and, when you're signed in, in your Sled Finder account.":"Clickable mockup for review. No accounts, servers or payments."}</p>`;
};
R.sale=(arg)=>{const parts=String(arg||"").split(",").filter(Boolean);const fcc=COUNTRIES[parts[0]]?parts[0]:"";const typ=SLED_TYPES.includes(parts[0])?parts[0]:(SLED_TYPES.includes(parts[1])?parts[1]:"");
  bar("Sleds for Sale",{sub:premium()?"Collector marketplace":"Members only",act:`<a class="act" href="${canSell()?"#/sell":"#/upgrade"}" aria-label="Sell">${canSell()?"＋":"🔒"}</a>`});tab("sale");
  if(!premium()){const mine=allListings().filter(l=>l.mine).length;return `<div class="sale-tease" aria-hidden="true">${[0,1,2].map(()=>'<div class="lgt"></div>').join("")}</div>${gate(lapsed()?"Membership lapsed":"Sleds for Sale is for members",lapsed()?lapsedText(mine)+" Renew to browse and post listings again.":"Only paid members can browse sleds for sale or post a listing. Locations are shown by town only.")}`}
  const all=allListings(),L=all.filter(l=>!fcc||ccOf(l)===fcc).filter(l=>!typ||typeOf(l)===typ),hid=0;
  const href=(c,t)=>"#/sale"+((c||t)?"/"+[c,t].filter(Boolean).map(encodeURIComponent).join(","):"");
  const ccChips=`<div class="chips"><a class="chip ${fcc?"":"on"}" href="${href("",typ)}">All countries</a>${Object.keys(COUNTRIES).map(k=>`<a class="chip ${fcc===k?"on":""}" href="${href(k,typ)}">${COUNTRIES[k].flag} ${COUNTRIES[k].short}</a>`).join("")}</div>`;
  return `<div class="pad" style="padding-bottom:4px"><a class="btn solid" href="#/sell">＋ Post a sled for sale</a></div>
  <p class="legend">Paid members can browse listings and post their own. Locations are shown by town only.</p>
  ${ccChips}${typeChipBar(typ,t=>href(fcc,t))}<div class="feed" style="margin-top:12px">${L.map(l=>`<a class="card post" href="#/listing/${l.id}" style="text-decoration:none"><div class="ph" style="background-image:url('${l.img}')"></div><div class="meta"><div class="who"><span class="av">${initials(l.user)}</span>@${esc(l.user)} ${l.mine?'<span class="sample-tag" style="background:#e5efe9;color:var(--pine);border-color:#bcd3c5">Your listing</span>':'<span class="sample-tag">Example data</span>'}</div><div class="t">${l.price?esc(l.price)+" · ":""}${esc(l.title)}</div><div class="m">${esc(mk(l))}${l.model?" · "+esc(l.model):""}${typeOf(l)?" · "+esc(typeOf(l)):""} · Est. ${esc(l.years)}${l.condition?" · "+esc(l.condition):""}</div><div class="m">📍 ${esc(townC(l))} · 📦 Ships: ${esc(l.ship)}</div><div class="m">✉ ${esc(l.email)}</div>${l.desc?`<p class="snip">${esc(l.desc)}</p>`:""}${editedNote(l)}</div></a>`).join("")||'<p class="legend">No listings in this filter.</p>'}</div>`;
};
R.listing=id=>{const l=allListings().find(x=>x.id==id);if(!l)return R.sale();
  if(!premium()){bar("For Sale",{back:true});tab("sale");return gate(lapsed()?"Membership lapsed":"Sleds for Sale is for members",lapsed()?lapsedText(1):"Only paid members can view listings.")}
  bar("For Sale",{back:true,sub:l.price||"Price not listed"});tab("sale");
  return `${gallery(l.imgs,false)}
  <div class="title-block"><h1>${esc(l.title)}</h1><div style="font-family:var(--serif);font-size:1.6rem;font-weight:700;color:var(--red);margin-top:4px">${l.price?esc(l.price):'<span class="muted" style="font-size:1rem">Price not listed · contact seller</span>'}</div><div class="small muted">@${esc(l.user)} ${l.mine?"· Your listing":'<span class="sample-tag">Example data</span>'}</div>${editedNote(l)}</div>
  <dl class="dl"><div><dt>Maker</dt><dd>${+l.maker&&M(l.maker)?`<a href="#/maker/${l.maker}">${esc(mk(l))}</a>`:(l.makerText?esc(l.makerText)+' <span class="unconf">unconfirmed</span>':"Unknown maker")}</dd></div><div><dt>Model</dt><dd>${esc(l.model||"—")}</dd></div>${typeLine(l)}<div><dt>Est. years made</dt><dd>${esc(l.years)}</dd></div><div><dt>Condition</dt><dd>${esc(l.condition)}</dd></div><div><dt>Location</dt><dd>${esc(townC(l))}</dd></div><div><dt>Can ship?</dt><dd>${esc(l.ship)}</dd></div><div><dt>Contact</dt><dd><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></dd></div></dl>${l.desc?`<div class="prose" style="padding-top:12px"><p>${esc(l.desc)}</p></div>`:""}
  <div class="pad"><a class="btn solid" href="mailto:${esc(l.email)}?subject=${encodeURIComponent("Your sled listing: "+l.title)}">✉ Email seller</a><div style="margin-top:10px">${editBar(l,"#/editlisting/"+l.id,"listing")}</div><p class="legend" style="margin:10px 0 0">Opens your email app. Sample listings use example.com addresses, which don't reach anyone. No sale happens in the app.</p></div>`;
};
R.editlisting=id=>R.sell(id);
R.sell=(editId)=>{const E=editId?allListings().find(x=>x.id==editId):null;
  if(editId&&!canEdit(E))return R.upgrade("Editing your own submissions is a paid-member feature.");
  if(!editId&&!canSell())return R.upgrade("Selling your sleds is a paid-member feature. Browsing listings stays free.");
  const adminEdit=E&&isAdmin()&&!E.mine;
  bar(E?(adminEdit?"Admin edit · listing":"Edit Listing"):"Post a Sled for Sale",{back:true,sub:adminEdit?"@"+E.user+" · as Sled Finder":(CLOUD?(CLOUD.user?"Posted to Sled Finder":"Sign in to post"):"Saved in this browser only")});tab("sale");
  const pics=["sale-flexible-flyer-eagle-deck.jpg","sale-hand-painted-sled.jpg","collection-red-swirl-deck-photos-p28.jpg","collection-pictorial-deck-photos-p31.jpg"];
  setTimeout(()=>{const getPics=picker("sellpk",E?normPics(E).imgs:[],pics.map(p=>"images/"+p));bindMaker("sellmk",E);$("#sellunk").onclick=()=>{$("#sellf").years.value="Unknown"};if(E){const F=$("#sellf");F.title.value=E.title;F.model.value=E.model||"";F.years.value=E.years&&E.years!=="Unknown"?E.years:"";F.condition.value=E.condition||"Good";F.price.value=(E.price||"").replace(/^\$/,"");F.town.value=E.town;F.ship.value=E.ship;F.email.value=E.email;F.desc.value=E.desc||"";$("#scount").textContent=F.desc.value.length+" / 500"}const ta=$("#sdesc"),sc=$("#scount");ta.oninput=()=>{sc.textContent=ta.value.length+" / 500"};
    $("#sellf").onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target);const P0=getPics();if(!P0.length){toast("Please add at least one photo");return}const P=await storePics(P0);
      const l=Object.assign({},E||{id:"ul"+Date.now(),user:"you",mine:true},makerVals(f),{years:String(f.get("years")||"").trim()||"Unknown",sledType:SLED_TYPES.includes(f.get("sledType"))?f.get("sledType"):"",title:f.get("title"),ship:f.get("ship"),email:f.get("email"),model:f.get("model"),condition:f.get("condition"),price:f.get("price")?"$"+String(f.get("price")).replace(/^\$/,""):"",country:COUNTRIES[f.get("country")]?f.get("country"):"US",town:String(f.get("town")||"").trim(),imgs:P,img:P[0],desc:String(f.get("desc")||"").slice(0,500)});if(adminEdit)l.editedBy="Sled Finder";
      if(E){await lsSave(()=>saveListing(l));toast("Listing updated")}else{await lsSave(()=>addListing(l));toast(CLOUD?"Listing posted":"Listing posted (mockup)")}location.hash="#/listing/"+l.id}catch(err){saveErr(err)}}});
  return `<form class="form" id="sellf">${pickerHTML("sellpk",true)}
  <label>Sled name *<input name="title" required placeholder="e.g. Flexible Flyer No. 3C, original paint"></label>
  ${makerFields("sellmk",E)}
  <label>Model<input name="model" placeholder="Model name if known"></label>
  <label>Sled type${typeSel("sledType",E&&E.sledType||"")}</label>
  <label>Estimated years of manufacture<span class="inl"><input name="years" placeholder="e.g. c. 1925–1935"><button type="button" class="btn sm" id="sellunk">Unknown</button></span></label>
  <div class="row2"><label>Condition<select name="condition"><option>Excellent</option><option selected>Good</option><option>Fair</option><option>Poor</option><option>Restored</option></select></label><label>Price (optional)<input name="price" inputmode="decimal" placeholder="150"></label></div>
  <label>Country${ccSelect("country",E?ccOf(E):"US")}</label>
  <label>Location (town and state / province / county) *<input name="town" required placeholder="e.g. Schaumburg, IL · Kendal, Cumbria"><small style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted)">Town only. Please don't post a street address.</small></label>
  <label>Can ship? *<select name="ship" required><option value="">Choose…</option><option>Yes</option><option>No</option></select></label>
  <label>Contact email *<input name="email" type="email" required placeholder="you@example.com"><small style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted)">Shown on your listing so buyers can email you.</small></label>
  <label>Description (optional)<textarea name="desc" id="sdesc" maxlength="500" placeholder="Markings, size, repairs, pickup or shipping…"></textarea><small id="scount" style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted);text-align:right">0 / 500</small></label>
  ${adminEdit?'<p class="legend" style="margin:0;padding:0">Saving marks this ad “Edited by Sled Finder”.</p>':ackHTML()}
  <button class="btn solid" type="submit">${E?"Save changes":"Post listing"}</button></form>`;
};

const MAP_MAKERS=window.MAP_MAKERS||[];
const mapByKey=k=>MAP_MAKERS.find(m=>m.key===k);
const mapLabel=m=>m?(m.short||m.label):"";
function mapKeyForSled(s){
  if(!s||!+s.maker)return null;
  if(+s.maker===2){
    if(s.brand==="Yankee Clipper")return "yclipper";
    if(s.brand==="Fire Fly")return "firefly";
    const md=String(s.model||"").toLowerCase();
    if(/yankee/.test(md))return "yclipper";
    if(/fire\s*fly|firefly/.test(md))return "firefly";
    return null;
  }
  const e=MAP_MAKERS.find(x=>x.id==s.maker&&!x.brand);
  return e?e.key:null;
}
function idChoiceFromKey(key, customText){
  if(key==="unknown")return {maker:0,brand:"",makerText:"",model:""};
  if(key==="custom")return {maker:0,makerText:customText||"",model:""};
  const m=mapByKey(key);
  if(!m)return {maker:0,makerText:"",model:""};
  return {maker:m.id,brand:m.brand||"",makerText:"",model:""};
}
const ID_DEMO={
  high:{band:"likely",title:"Likely Flexible Flyer",note:"These are sample scores for the mockup. A real model is not running.",
    rows:[{key:"fflyer",pct:72},{key:"firefly",pct:14},{key:"paris",pct:6},{key:"snw",pct:4},{key:"garton",pct:2}]},
  low:{band:"low",title:"Low confidence — no clear match",note:"When scores are low, choose Unknown maker or type a Custom guess rather than accepting a weak suggestion.",
    rows:[{key:"acme",pct:22},{key:"pratt",pct:18},{key:"kal",pct:11},{key:"garton",pct:9},{key:"paris",pct:8}]}
};

R.identify=()=>{
  bar("Identify a sled",{back:true,sub:"Photo search · demo"});tab("home");
  const tryNote=premium()?"":`<div class="id-try"><b>Try the demo.</b> Use the sample photo to see how Photo ID works. Real identifications are part of Premium.<a class="btn gold sm" href="#/upgrade" style="margin-top:8px">${lapsed()?"Renew membership · $15/yr":"Join · $15/yr"}</a></div>`;
  setTimeout(()=>{
    const preview=$("#idpreview"), file=$("#idfile"), go=$("#idgo"), results=$("#idresults"), hint=$("#idhint");
    const showPreview=src=>{preview.style.backgroundImage=`url('${src}')`;preview.classList.add("has");preview.dataset.src=src;go.disabled=false;hint.textContent="You can retake or choose a different photo, then run the demo identification."};
    file.onchange=async ev=>{const f=ev.target.files&&ev.target.files[0];if(!f)return;try{showPreview(await resizeFile(f))}catch(e){const r=new FileReader();r.onload=()=>showPreview(r.result);r.readAsDataURL(f)}};
    $("#idsample").onclick=()=>showPreview("images/flexible-flyer-3c-p60.jpg");
    const renderResults=(mode,busy)=>{
      if(busy){results.innerHTML=`<div class="id-busy"><span class="spin"></span> Identifying…</div>`;results.classList.remove("hide");return}
      const demo=ID_DEMO[mode]||ID_DEMO.high, low=demo.band==="low";
      const rows=demo.rows.map((r,i)=>{const m=mapByKey(r.key);return `<label class="id-row"><input type="radio" name="idpick" value="${r.key}" ${!low&&i===0?"checked":""}><span class="id-sw" style="background:${m?m.color:"#888"}"></span><span class="id-name">${esc(m?m.label:r.key)} <span class="sample-tag">Sample result</span></span><span class="id-pct">${r.pct}%</span><span class="id-bar"><i style="width:${r.pct}%;background:${m?m.color:"#888"}"></i></span></label>`}).join("");
      results.classList.remove("hide");
      results.innerHTML=`<div class="id-banner">Demo — sample results, not a real identification.</div>
        <div class="id-head"><b>${esc(demo.title)}</b><p>${esc(demo.note)}</p></div>
        <div class="id-list">${rows}</div>
        ${low?`<div class="id-low"><p>You can file this as <b>Unknown maker</b> or type a <b>Custom</b> guess (for example, “Likely Pratt or Kalamazoo”).</p>
          <div class="row2" style="margin-top:8px"><button type="button" class="btn sm" id="idunk">Unknown maker</button><button type="button" class="btn sm" id="idcustbtn">Custom…</button></div>
          <label class="hide" id="idcustwrap" style="margin-top:8px">Custom maker<input id="idcustom" placeholder="e.g. Likely Pratt or Kalamazoo"></label></div>`:""}
        <div class="id-fields form">
          <label>Estimated years of manufacture<input id="idyears" placeholder="e.g. c. 1925–1935"><small class="hint">The demo does not guess years. Leave blank if you are not sure.</small></label>
          <label>Origin ZIP<input id="idzip" inputmode="numeric" maxlength="5" placeholder="60193"><small class="hint">Town / ZIP level only. Never enter a street address.</small></label>
        </div>
        <button type="button" class="btn solid" id="idconfirm">${low?"Continue with a selection":"Confirm and add this sled"}</button>
        <button type="button" class="btn" id="idcorrect">Correct — pick a different maker</button>
        <div id="idcorrectbox" class="id-correct form hide">
          <label>Maker<select id="idalt"><option value="unknown">Unknown maker</option><option value="custom">Custom…</option>${MAP_MAKERS.map(m=>`<option value="${m.key}">${esc(m.label)}</option>`).join("")}</select></label>
          <label class="hide" id="idaltcw">Custom maker<input id="idaltcustom" placeholder="e.g. Likely Pratt or Kalamazoo"></label>
          <button type="button" class="btn pine" id="idaltgo">Use this maker and add the sled</button>
        </div>
        <button type="button" class="btn" id="iddone">I'm done — just needed the ID</button>
        <p class="legend" style="margin:8px 0 0"><button type="button" class="linkish" id="idtoggle">${low?"Show typical sample results":"Show the low-confidence example"}</button></p>`;
      const goAdd=sel=>{LS.set("idDraft",Object.assign({},sel,{years:($("#idyears")||{}).value||"",zip:($("#idzip")||{}).value||""}));location.hash="#/add"};
      const picked=()=>{const r=results.querySelector('input[name=idpick]:checked');return r?idChoiceFromKey(r.value):null};
      const conf=$("#idconfirm");if(conf)conf.onclick=()=>{const custom=($("#idcustom")||{}).value;if(custom&&String(custom).trim()){goAdd(idChoiceFromKey("custom",String(custom).trim()));return}const sel=picked();if(!sel){toast("Pick a maker, or use Unknown / Custom");return}goAdd(sel)};
      const corr=$("#idcorrect");if(corr)corr.onclick=()=>{$("#idcorrectbox").classList.remove("hide");$("#idcorrectbox").scrollIntoView({block:"nearest"})};
      const alt=$("#idalt"),cw=$("#idaltcw");if(alt)alt.onchange=()=>cw.classList.toggle("hide",alt.value!=="custom");
      const altgo=$("#idaltgo");if(altgo)altgo.onclick=()=>goAdd(idChoiceFromKey(alt.value,($("#idaltcustom")||{}).value||""));
      const unk=$("#idunk");if(unk)unk.onclick=()=>goAdd(idChoiceFromKey("unknown"));
      const cb=$("#idcustbtn");if(cb)cb.onclick=()=>{$("#idcustwrap").classList.remove("hide");const i=$("#idcustom");if(i)i.focus()};
      const done=$("#iddone");if(done)done.onclick=()=>{toast("Identification not posted");location.hash="#/home"};
      const tog=$("#idtoggle");if(tog)tog.onclick=()=>renderResults(low?"high":"low",false);
    };
    go.onclick=()=>{if(!preview.dataset.src){toast("Add a photo first");return}renderResults("high",true);setTimeout(()=>renderResults("high",false),700)};
  });
  return `<div class="id-banner">Demo — sample results, not a real identification.</div>
    <div class="pad id-flow">${tryNote}
      <p class="id-lead">Take or upload a photo of a vintage sled. This mockup does not run a real model; it shows how ranked matches, confirm/correct, and the add-sled form will work.</p>
      <div class="id-preview" id="idpreview"><span>No photo yet</span></div>
      <div class="row2">
        <label class="btn">Upload a photo<input type="file" id="idfile" accept="image/*" hidden></label>
        <button type="button" class="btn" id="idsample">Use a sample photo</button>
      </div>
      <p class="small muted" id="idhint">In a real build, location data is stripped from the photo before it is stored or sent. This demo never leaves your browser.</p>
      <div class="id-angles">
        <b>Helpful angles</b>
        <ul>
          <li>Top-down of the whole sled</li>
          <li>Side profile of the runners</li>
          <li>Close-up of a decal or stamp</li>
          <li>Underside hardware / bolt patterns</li><li>Steering bar (front crossbar)</li><li>Bumper / front end</li>
        </ul>
        <p>One clear photo is enough for this demo. Extra angles can be added later.</p>
      </div>
      <button type="button" class="btn solid" id="idgo" disabled>Identify (demo)</button>
      <div id="idresults" class="id-results hide"></div>
    </div>`;
};

R.map=()=>{const locked=!premium();
  bar("Sled Picker Map",{back:true,sub:locked?"Preview · members can use the map":"Where picked sleds were found · demo"});tab("makers");
  const userPins=locked?[]:allSleds().filter(s=>s.userAdded&&(s.shared||isOwn(s))&&s.lat!=null&&s.locType!=="na").map(s=>{const key=mapKeyForSled(s);return key?Object.assign({key,fromUser:true},s):null}).filter(Boolean);
  const demo=window.MAP_DEMO||{count:200,label:"Demo — 200 sample pins, not real finds.",makers:["fflyer","firefly","yclipper","paris","snw","acme","autowheel","garton","pratt","kal"]};
  const demoKeys=new Set(demo.makers||[]);
  const NE_BOUNDS=[[39.7,-80.55],[47.45,-66.95]];
  const showNE=m=>{if(m&&m.fitBounds)m.fitBounds(NE_BOUNDS,{padding:[16,16],maxZoom:7,animate:false})};
  const CC_BOUNDS={US:[[24.5,-125],[49.5,-66.9]],CA:[[41.7,-141],[70,-52.6]],GB:[[49.8,-8.7],[60.9,1.8]],IE:[[51.3,-10.7],[55.45,-5.9]],NA:[[24.5,-141],[70,-52.6]],UKI:[[49.8,-10.7],[60.9,1.8]]};
  let mcc="",mtype="";
  setTimeout(()=>{
    if(!window.L){$("#map").innerHTML='<p class="pad small">Map library could not load (offline?).</p>';return}
    const map=L.map("map",{worldCopyJump:true,zoomControl:!locked,attributionControl:true,dragging:!locked,scrollWheelZoom:!locked,doubleClickZoom:!locked,boxZoom:!locked,keyboard:!locked,touchZoom:!locked,maxZoom:11});
    showNE(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:11,attribution:"© OpenStreetMap contributors"}).addTo(map);
    const layer=L.layerGroup().addTo(map);
    const selected=()=>locked?[...demoKeys]:[...document.querySelectorAll(".map-mks input:checked")].map(i=>i.value);
    const draw=()=>{
      layer.clearLayers();
      const on=new Set(selected());
      const typeOk=p=>{if(!mtype)return true;if(typeOf(p)===mtype)return true;if(p.fromUser||p.id)return typeOf(p)===mtype;const ent=mapByKey(p.key),mk=ent&&ent.id&&M(ent.id);return !!(mk&&String(mk.type||"").toLowerCase().includes(mtype.toLowerCase())&&mtype!=="Flexy Racer")};
      const extra=mtype?allSleds().filter(s=>(s.shared||isOwn(s))&&s.lat!=null&&s.locType!=="na"&&typeOf(s)===mtype&&(!mcc||ccOf(s)===mcc)).map(s=>{const key=mapKeyForSled(s)||("user-"+s.id);return Object.assign({key,fromUser:!!s.userAdded,typePin:true},s)}):[];
      const pins=(mcc&&mcc!=="US"?[]:(window.SAMPLE_MAP_PINS||[])).filter(p=>on.has(p.key)).filter(typeOk).map(p=>Object.assign({sample:true},p))
        .concat(userPins.filter(p=>on.has(p.key)&&(!mcc||ccOf(p)===mcc)&&typeOk(p)))
        .concat(extra.filter(p=>!userPins.some(u=>u.id===p.id)));
      const counts={};
      pins.forEach(p=>{
        const ent=mapByKey(p.key), color=ent?ent.color:"#555", name=ent?ent.label:p.key;
        counts[p.key]=(counts[p.key]||0)+1;
        const isHome=!!p.home;
        const c=L.circleMarker([p.lat,p.lng],{radius:isHome?11:7,weight:2,color:"#fff",fillColor:color,fillOpacity:.92,interactive:!locked});
        if(!locked){
          const html=p.fromUser
            ? `<div class="mp-card"><a href="#/sled/${p.id}"><div class="mp-ph" style="background-image:url('${p.img||(p.imgs&&p.imgs[0])||""}')"></div></a><b>${esc(mk(p))}</b><br>${esc(p.model)} · Est. ${esc(p.years||"Unknown")}<br><span>📍 ${esc(p.town||"")} · your post</span><br><a href="#/sled/${p.id}">Open →</a></div>`
            : `<div class="mp-card"><span class="sample-tag">SAMPLE</span>${isHome?' <span class="sample-tag" style="background:#e5efe9;color:var(--pine);border-color:#bcd3c5">Company home</span>':""}<br><b>${esc(name)}</b><br>${p.model?esc(p.model)+" · ":""}Est. ${esc(p.years)}<br><span>${esc(p.town)} · ZIP ${esc(p.zip)}</span><br><span>Sample pin — not a real find.${isHome?" Auto-Wheel Coaster home: North Tonawanda, NY.":""}</span></div>`;
          c.bindPopup(html,{maxWidth:240});
        }
        layer.addLayer(c);
      });
      const rows=MAP_MAKERS.filter(m=>counts[m.key]).map(m=>`<span class="map-leg-i"><i style="background:${m.color}"></i>${esc(m.short)} ${counts[m.key]}</span>`).join("");
      const el=$("#mlegend");if(el)el.innerHTML=rows||'<span class="muted">No makers selected</span>';
      const n=pins.length, shownSample=pins.filter(x=>x.sample).length, mc=$("#mcount");
      if(mc)mc.textContent=n+" pin"+(n===1?"":"s")+" shown · "+on.size+" maker"+(on.size===1?"":"s")+(shownSample?` · ${shownSample} sample`:"");
    };
    if(!locked){
      document.querySelectorAll(".map-mks input").forEach(i=>i.onchange=draw);
      $("#mapdemo").onclick=()=>{document.querySelectorAll(".map-mks input").forEach(i=>i.checked=demoKeys.has(i.value));draw()};
      $("#mapall").onclick=()=>{document.querySelectorAll(".map-mks input").forEach(i=>i.checked=true);draw()};
      $("#mapnone").onclick=()=>{document.querySelectorAll(".map-mks input").forEach(i=>i.checked=false);draw()};
      const fit=b=>map.fitBounds(b,{padding:[16,16],maxZoom:9,animate:false});
      document.querySelectorAll("#mcc [data-cc]").forEach(b=>b.onclick=()=>{mcc=b.dataset.cc;document.querySelectorAll("#mcc [data-cc]").forEach(x=>x.classList.toggle("on",x===b));draw();if(mcc)fit(CC_BOUNDS[mcc]);else showNE(map)});
      document.querySelectorAll("#mtype [data-type]").forEach(b=>b.onclick=()=>{mtype=b.dataset.type;document.querySelectorAll("#mtype [data-type]").forEach(x=>x.classList.toggle("on",x===b));draw()});
      document.querySelectorAll("#mview [data-v]").forEach(b=>b.onclick=()=>{const v=b.dataset.v;if(v==="ne")showNE(map);else if(v==="mine"){const pts=userPins.filter(p=>!mcc||ccOf(p)===mcc).map(p=>[p.lat,p.lng]);if(pts.length)fit(L.latLngBounds(pts).pad(.3));else toast("None of your sleds have a map pin yet")}else fit(CC_BOUNDS[v])});
    }else{
      const prev=$("#mapPreview");if(prev)prev.onclick=()=>{setRole("premium");toast("Demo role: Paid member");route()};
    }
    draw();setTimeout(()=>{map.invalidateSize();showNE(map)},50);
  });
  const banner=`<div class="map-banner">${esc(demo.label||"Demo — 200 sample pins, not real finds.")}</div>`;
  const legend=`<div id="mlegend" class="map-legend"></div>`;
  if(locked)return `${banner}
    <p class="legend">A map of where picked sleds were found. This Northeast demo (Maine through Pennsylvania) has 200 sample pins across ten makers, at town / ZIP level only. They are not real finds.</p>
    ${legend}
    <div class="map-stage">
      <div id="map" class="mapbox"></div>
      <div class="map-veil" aria-hidden="true"></div>
      <div class="map-lock-card">
        <div class="gl">🔒</div>
        <b>The Sled Picker Map is for members</b>
        <p>${lapsed()?"Renew to pan, zoom and open pins.":"Join to pan, zoom and open pins. This preview shows the Northeast demo."}</p>
        <a class="btn gold" href="#/upgrade">${lapsed()?"Renew membership · $15/yr":"Join · $15/yr"}</a>
        <button type="button" class="btn" id="mapPreview">Try the demo as Premium</button>
      </div>
    </div>`;
  return `${banner}
    <p class="legend">A map of where picked sleds were found. Use the 25 black-list makers to colour-code and filter the pins, or filter by sled type (including Flexy Racer). This Northeast demo (Maine through Pennsylvania) has exactly 200 sample pins across ten makers, at town / ZIP level only — never a street address. They are not real finds. Fire Fly and Yankee Clipper are listed separately from Flexible Flyer.</p>
    <div class="map-actions"><button type="button" class="btn sm" id="mapdemo">Demo 10 makers</button><button type="button" class="btn sm" id="mapall">All 25</button><button type="button" class="btn sm" id="mapnone">Clear</button><span id="mcount" class="muted"></span></div>
    <div class="chips" id="mcc" style="padding-top:0"><button type="button" class="chip on" data-cc="">All countries</button>${Object.keys(COUNTRIES).map(k=>`<button type="button" class="chip" data-cc="${k}">${COUNTRIES[k].flag} ${COUNTRIES[k].short}</button>`).join("")}</div>
    <div class="chips" id="mtype" style="padding-top:0"><button type="button" class="chip on" data-type="">All types</button>${SLED_TYPES.map(t=>`<button type="button" class="chip" data-type="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <div class="map-actions" id="mview"><span class="muted" style="font-size:.72rem">View:</span><button type="button" class="btn sm" data-v="ne">Northeast US</button><button type="button" class="btn sm" data-v="NA">North America</button><button type="button" class="btn sm" data-v="UKI">UK &amp; Ireland</button><button type="button" class="btn sm" data-v="mine">My pins</button></div>
    <div class="map-mks">${MAP_MAKERS.map(m=>`<label class="map-mk"><input type="checkbox" value="${m.key}" ${demoKeys.has(m.key)?"checked":""}><i style="background:${m.color}"></i>${esc(m.short)}</label>`).join("")}</div>
    ${legend}
    <div id="map" class="mapbox"></div>
    <p class="legend" style="padding-bottom:16px">Sleds you add in this browser with a town (US, Canada, UK or Ireland) and a black-list maker also appear, marked as your post. Dots sit at the town, never a street address; if the town can't be found the dot goes at the state, province or county centre, or the sled is saved without a dot. Green-list, unknown and custom makers stay off this map for now.</p>`;
};

R.mphotos=(arg)=>{const [mid,idx]=String(arg).split(",");const m=M(mid),x=m&&models(m)[+idx];if(!x)return R.makers();
  const ok=premium()||(isFree(m)&&+idx<(window.FREE_GALLERY_COUNT||5));if(!ok)return R.upgrade("Extra model photos are part of Premium.");
  bar(x.n,{back:true,sub:disp(m)});tab("makers");
  return `${gallery(mImgs(x),false)}<div class="title-block"><h1>${x.brand?esc(x.n):esc(disp(m))+" "+esc(x.n)}</h1>${x.brand?`<p class="small muted" style="margin:4px 0 0">${esc(x.brand)} brand · ${esc(companyOf(m)?companyOf(m).name:disp(m))}</p>`:""}<p class="small muted" style="margin:6px 0 0">${esc(x.d)}</p></div><div class="pad"><a class="btn pine" href="#/maker/${m.id}">Back to ${esc(disp(m))}</a></div>`;
};

R.unknown=()=>{bar("Unknown / unconfirmed makers",{back:true,sub:"Not filed under any real maker"});tab("makers");
  if(!premium())return databaseGate();
  const arr=allSleds().filter(s=>!+s.maker&&(s.shared||isOwn(s))),G={};
  arr.forEach(s=>{const k=(s.makerText||"").trim()||"Unknown maker";(G[k]=G[k]||[]).push(s)});
  return `<p class="legend" style="margin-top:12px">Posts whose maker is unknown or typed in as a guess. They stay here, not under any of the 61 makers, until Sled Finder confirms and reassigns them.${isAdmin()?" As admin, open a post and use Admin edit to pick the real maker.":""}</p>
  ${Object.keys(G).sort().map(k=>`<p class="grp-h"><b>${esc(k==="Unknown maker"?k:k+" (unconfirmed)")}</b> · ${G[k].length} post${G[k].length==1?"":"s"}</p>${groupList(G[k],null,true)}`).join("")||'<p class="small muted" style="padding:0 16px">No posts yet.</p>'}<div style="height:20px"></div>`;
};
// ===== Suggestions to the developer. Delivered free with no keys in the app:
// 1) a Google Form in Sled Finder's Google account (set SUGGEST_FORM.action + entry ids once the form exists), posted
//    straight from the app so the existing Google Form alert catches it; 2) otherwise a pre-filled email to the museum.
const APP_VER="b11";
const SUGGEST_FORM={action:"https://docs.google.com/forms/d/e/1FAIpQLSeL5-bPPHkSnMlo-utOtZdRJfQN5yUCQRQOt19Bgt4VAjkmBA/formResponse",fields:{category:"entry.1937538793",message:"entry.790371823",name:"entry.1603670551",email:"entry.1586826346",context:"entry.1782360007"}};
let lastScreen="#/home";window.addEventListener("hashchange",e=>{try{const h=new URL(e.oldURL).hash||"#/home";if(!/^#\/suggest/.test(h))lastScreen=h}catch(x){}});
const SUGGEST_EMAIL="rbsledmuseum@gmail.com";
const SUGGEST_CATS=[["Suggestion","Suggestion"],["Bug","Bug / something isn't working"],["Missing maker or info","Missing maker or info"],["Other","Other"]]; // values must match the Google Form choices exactly

R.notifications=()=>{
  bar("Notifications",{back:true,sub:CLOUD&&CLOUD.user?"Your alerts":"Example alerts"});tab("profile");
  const list=visibleNotifications();
  const reads=notifyReads();
  const st=notifySettings();
  const signed=!(CLOUD&&CLOUD.enabled)||!!(CLOUD&&CLOUD.user);
  setTimeout(()=>{
    document.querySelectorAll("[data-nread]").forEach(a=>a.addEventListener("click",()=>markNotificationRead(a.dataset.nread)));
    const all=$("#nAllRead");if(all)all.onclick=()=>{markAllNotificationsRead();toast("All caught up");route()};
    document.querySelectorAll("[data-nset]").forEach(inp=>inp.onchange=()=>{setNotifySetting(inp.dataset.nset,inp.checked);toast(inp.checked?"You'll be notified":"This category is off");route()});
    const push=$("#nPush");if(push)push.onclick=()=>{if(!CLOUD||!CLOUD.enablePush)return;push.disabled=true;CLOUD.enablePush().then(()=>{toast("This device will get alerts");route()}).catch(e=>{push.disabled=false;toast(e.message||String(e),4000)})};
    const unpush=$("#nUnpush");if(unpush)unpush.onclick=()=>{if(!CLOUD||!CLOUD.disablePush)return;CLOUD.disablePush().then(()=>{toast("Alerts on this device are off");route()}).catch(e=>{toast(e.message||String(e),4000)})};
  });
  const rows=list.map(n=>{
    const unread=!reads[n.id];
    const when=notifyWhen(n.created);
    const tag=n.example?' <span class="sample-tag">Example</span>':"";
    return `<a class="${unread?"unread":""}" data-nread="${esc(n.id)}" href="${esc(n.href||"#/notifications")}"><span class="nk">${NOTIFY_ICONS[n.kind]||"•"}</span><span><div class="nt">${esc(n.title||"Sled Finder")}${tag}</div><div class="nb">${esc(n.body||"")}</div><div class="nm">${when}${unread?" · New":""}</div></span></a>`;
  }).join("");
  const empty=signed?`<p class="legend">No notifications right now. When someone shares a sled, posts a photo, publishes an article, or (for members) lists a sled for sale, it will show up here.</p>`:`<p class="legend">Sign in to see notifications when the community or Sled Finder adds something new.</p><div class="pad"><a class="btn solid" href="#/account">Sign in</a></div>`;
  const cats=`<div class="nset card" style="margin:16px;padding:8px 16px"><h3 class="sec" style="margin:8px 0 4px">Notify me about</h3>
    <label>Shared sleds <input type="checkbox" data-nset="sleds" ${st.sleds?"checked":""} ${premium()?"":"disabled"}></label>
    <label>Articles <input type="checkbox" data-nset="articles" ${st.articles?"checked":""}></label>
    <label>Community photos <input type="checkbox" data-nset="photos" ${st.photos?"checked":""} ${premium()?"":"disabled"}></label>
    <label>Sleds for Sale ${premium()?"":"· members only "}<input type="checkbox" data-nset="listings" ${st.listings?"checked":""} ${premium()?"":"disabled"}></label>
    ${premium()?"":'<p class="small muted">Shared sleds, community photos and sale listings notify paid members only.</p>'}
  </div>`;
  const vapid=!!(window.SF_CONFIG&&window.SF_CONFIG.VAPID_PUBLIC_KEY);
  const pushOn=CLOUD&&CLOUD.pushEnabled&&CLOUD.pushEnabled();
  const livePush=CLOUD&&CLOUD.user&&vapid;
  const pushBox=CLOUD?`<div class="nset card" style="margin:16px;padding:12px 16px" id="nPushBox"><h3 class="sec" style="margin:0 0 8px">Alerts on this device</h3>
    ${livePush?(pushOn
      ?`<p class="small muted">This installed app or browser will get a banner when something new is posted (and the category is on).</p><button type="button" class="btn" id="nUnpush">Turn off alerts on this device</button>`
      :`<p class="small muted">Install Sled Finder (Add to Home Screen) or keep it in this browser, then turn on alerts. On iPhone, the app must be added to the Home Screen first.</p><button type="button" class="btn solid" id="nPush">Notify me on this device</button>`
    ):(CLOUD.user?`<p class="small muted">Web push will be available once the VAPID public key is set in config.js (see docs/go-live.md). In-app notices still work.</p>`:`<p class="small muted">Sign in to turn on alerts on this device.</p>`)}</div>`:`<div class="nset card" style="margin:16px;padding:12px 16px"><p class="small muted">This is the demo. Sample notifications are marked Example. Device alerts are part of the live app.</p></div>`;
  return `${list.length?`<div class="n-actions">${list.some(n=>!reads[n.id])?`<button type="button" class="btn" id="nAllRead">Mark all read</button>`:""}</div><div class="nlist" id="nList">${rows}</div>`:empty}${cats}${pushBox}`;
};

R.insurance=()=>{bar("Insurance list",{back:true,sub:premium()?"Printable list of your sleds":"Preview · Premium"});tab("collection");
  const mine=allSleds().filter(isOwn);
  const rows=(arr)=>`<table class="ins"><thead><tr><th>Maker</th><th>Model</th><th>Years</th><th>Condition</th><th>Size</th></tr></thead><tbody>${arr.map(s=>`<tr><td>${esc(mk(s))}</td><td>${esc(s.model)}</td><td>${esc(s.years)}</td><td>${esc(s.condition||"")}</td><td>${esc(s.size||"")}</td></tr>`).join("")||'<tr><td colspan="5" class="muted">No sleds yet. Add one with ＋.</td></tr>'}</tbody></table>`;
  if(!premium())return `<p class="legend" style="margin-top:14px">A printable list of your collection (maker, model, years, condition, size and photos) to give your insurer. Part of Premium.</p>
  <div class="locked" style="margin:12px 16px 20px"><div class="blur">${rows([{maker:1,model:"No. 3C",years:"c. 1925",condition:"Good",size:"42 in."},{maker:7,model:"Coast to Coast",years:"1969–1970",condition:"Good",size:"66 in."}])}</div><div class="ov">🔒<b>Insurance list is Premium</b><span>Print or save a list of every sled you own.</span><a class="btn gold" href="#/upgrade">${lapsed()?"Renew membership · $15/yr":"Join · $15/yr"}</a></div></div>`;
  return `<div class="pad"><p class="small muted" style="margin:0 0 10px">${mine.length} sled${mine.length===1?"":"s"} · ${new Date().toLocaleDateString()}</p>${rows(mine)}<button type="button" class="btn solid" style="margin-top:14px" onclick="window.print()">🖨 Print or save as PDF</button></div>`};
R.suggest=()=>{bar("Send a suggestion",{back:true,sub:"To the Sled Finder developer"});tab("profile");
  setTimeout(()=>{const F=$("#sugf");if(!F)return;F.onsubmit=async e=>{e.preventDefault();const f=new FormData(F);const msg=String(f.get("message")||"").trim();
    if(msg.length<3){toast("Please write a short message first.",3500);return}
    const d={category:f.get("category"),message:msg.slice(0,3000),name:String(f.get("name")||"").trim().slice(0,100),email:String(f.get("email")||"").trim().slice(0,200),context:"Sled Finder "+APP_VER+" · role: "+role()+" · screen: "+lastScreen+" · "+navigator.userAgent.slice(0,120)};
    const btn=F.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Sending…";let how="form";
    try{if(!SUGGEST_FORM.action)throw new Error("no form");const b=new URLSearchParams();Object.keys(SUGGEST_FORM.fields).forEach(k=>{if(SUGGEST_FORM.fields[k])b.append(SUGGEST_FORM.fields[k],d[k]||"")});
      await fetch(SUGGEST_FORM.action,{method:"POST",mode:"no-cors",body:b})}
    catch(err){how="email";const body=`${d.message}\n\n— ${d.name||"(no name)"}${d.email?" · "+d.email:""}\nCategory: ${d.category}\n${d.context}`;location.href=`mailto:${SUGGEST_EMAIL}?subject=${encodeURIComponent("Sled Finder suggestion: "+d.category)}&body=${encodeURIComponent(body)}`}
    $("#view").innerHTML=`<div class="pad" style="text-align:center;padding-top:40px"><div style="font-size:2.4rem">🙏</div><h2 style="font-family:var(--serif);margin:8px 0">Thank you!</h2><p class="small muted" style="max-width:300px;margin:0 auto 18px">${how==="form"?"Your note went straight to the Sled Finder developer. Nothing else to do.":"Your email app should have opened with your note filled in. Press <b>Send</b> there to deliver it."}${d.email?" We'll reply to "+esc(d.email)+" if needed.":""}</p><a class="btn solid" href="#/home">Back to Home</a><a class="btn" style="margin-top:10px" href="#/suggest">Send another</a></div>`}});
  return `<form class="form" id="sugf"><p class="legend" style="margin:0;padding:0">Ideas, bugs, a missing maker or a fact to fix: tell us here. It goes to the person building Sled Finder.</p>
  <label>Category<select name="category">${SUGGEST_CATS.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select></label>
  <label>Message *<textarea name="message" required maxlength="3000" placeholder="What would make Sled Finder better?"></textarea></label>
  <div class="row2"><label>Your name (optional)<input name="name" maxlength="100" autocomplete="name"></label><label>Email for a reply (optional)<input name="email" type="email" maxlength="200" autocomplete="email"></label></div>
  <small class="muted" style="font-size:.7rem">Please don't include a street address or anything private.</small>
  <button class="btn solid" type="submit">Send suggestion</button></form>`};
R.terms=()=>{bar("Terms & Guidelines",{back:true,sub:"Draft for review"});tab("profile");
  const S=(h,ps)=>`<h3 class="sec">${h}</h3><div class="prose">${ps.map(p=>`<p>${p}</p>`).join("")}</div>`;
  return `<div class="mock-banner">DRAFT · plain-language summary for review · not legal advice · have a lawyer review before launch</div>
  <div class="mp-head"><p class="eyebrow">Sled Finder</p><h1>Terms &amp; Community Guidelines</h1><div class="small muted">Draft, November 2026. Placeholder text for the mockup.</div></div>
  ${S("1. Membership",["Posting sleds, posting sale ads, and seeing other members' posts and photos (the Sled Maker and Model Database, the Sled Picker Map, “What sled is this?” and collectors' sleds on maker pages) require a paid Sled Finder membership, currently $15 a year, renewing automatically until you cancel.","Without a membership you can still browse the maker directory, the free makers' curated galleries and Sleds for Sale listings."])}
  ${S("2. Your posts and photos",["You keep ownership of the photos and information you post.","By posting, you give Sled Finder permission to store, show, resize and organize your posts and photos inside Sled Finder for other members to see, for as long as they stay in Sled Finder. Your posts become part of Sled Finder's shared record of antique sleds."])}
  ${S("3. Only post photos you own",["Post only photos you took yourself or have permission to use. Don't post other people's photos, catalog scans or ads unless you have the right to share them."])}
  ${S("4. Keep it accurate",["Give the maker, model, estimated years of manufacture and location as accurately as you can. A best guess is fine. Choose “Unknown” or use a custom maker such as “Likely Pratt” when you're not sure.","Use town-level locations only. Never post a street address."])}
  ${S("5. Sled Finder may edit or remove posts",["To keep the record accurate, Sled Finder may correct a post's maker, model, years, location, name or photos, or remove posts and ads. Corrected posts show a small “Edited by Sled Finder” note.","Sled Finder may remove posts that break these guidelines, such as photos you don't have the right to share, off-topic or offensive content, or spam."])}
  ${S("6. Editing and deleting your own posts",["Paid members can edit or delete their own posts and ads. You can't edit other members' posts or Sled Finder's own content, such as maker histories."])}
  ${S("7. If your membership lapses",["Your posts stay in Sled Finder. While your membership is lapsed you can't see the Sled Maker and Model Database, including your own posts, and you can't post or edit. When you renew, your posts come back."])}
  ${S("8. Sleds for Sale",["Buying and selling happen directly between members by email. Sled Finder isn't part of the sale and doesn't hold payments or guarantee items, descriptions or shipping."])}
  ${S("9. Be respectful",["Be kind and helpful, especially when helping identify sleds. No harassment, spam or misleading listings."])}
  ${S("10. Changes",["Sled Finder may update these terms. If changes are significant, members will be told in the app."])}
  <p class="fine">Draft for discussion between Jonathan Spangler and his advisers. This is not legal advice.</p>`;
};
window.__toast=toast;
// ===== Live mode screens: account (email code sign-in), membership, sync, migration =====
const ago=t=>{if(!t)return "never";const m=Math.round((Date.now()-t)/60000);return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+" h ago"};
const memberLine=()=>{const p=CLOUD&&CLOUD.profile,r=CLOUD?CLOUD.realRole():"free";if(r==="admin")return "Admin · Sled Finder";if(r==="premium")return "Premium member · renews or ends "+new Date(p.premium_until).toLocaleDateString();if(r==="lapsed")return "Membership lapsed on "+new Date(p.premium_until).toLocaleDateString();return "Free account"};
const openStripeUrl=async(btn,kind)=>{if(!CLOUD)return;const prev=btn.textContent;btn.disabled=true;btn.textContent="Opening…";try{const url=kind==="portal"?await CLOUD.startPortal():await CLOUD.startCheckout();if(!url)throw new Error("Couldn't open Stripe");location.href=url}catch(err){btn.disabled=false;btn.textContent=prev;toast(err.message||String(err),6000)}};
R.account=()=>{bar("Account",{back:true,sub:CLOUD&&CLOUD.user?"@"+me():"Sign in"});tab("profile");
  if(!CLOUD)return `<div class="pad"><p>Accounts are turned off in this demo. Everything you add is saved only in this browser.</p><a class="btn" href="#/profile">Back to Profile</a></div>`;
  if(!CLOUD.ready&&!CLOUD.lastError)return `<div class="pad"><p class="muted">Connecting…</p></div>`;
  if(!CLOUD.user){const pe=CLOUD.pendingEmail();
    setTimeout(()=>{const f=$("#signf");if(f)f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector("button");b.disabled=true;b.textContent="Sending…";
        try{await CLOUD.sendCode(String(new FormData(f).get("email")).trim());toast("Check your email for the 6-digit code",4000);route()}catch(err){toast("Couldn't send: "+(err.message||err),5000);b.disabled=false;b.textContent="Email me a sign-in code"}};
      const v=$("#codef");if(v)v.onsubmit=async e=>{e.preventDefault();const b=v.querySelector("button[type=submit]");b.disabled=true;b.textContent="Checking…";
        try{await CLOUD.verifyCode(pe,new FormData(v).get("code"));toast("Signed in");location.hash="#/account"}catch(err){toast("That code didn't work: "+(err.message||err),5000);b.disabled=false;b.textContent="Sign in"}};
      const o=$("#otherEmail");if(o)o.onclick=()=>{LS.set("pendingEmail","");route()}});
    return `<div class="form">${CLOUD.lastError?`<p class="legend" style="color:var(--red)">${esc(CLOUD.lastError)}</p>`:""}
    ${pe?`<form id="codef" class="form" style="padding:0"><p class="legend" style="padding:0">We emailed a sign-in code to <b>${esc(pe)}</b>. Type it here, or tap the link in that email on this phone.</p>
      <label>6-digit code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" required></label><button type="submit" class="btn solid">Sign in</button><button type="button" class="btn" id="otherEmail">Use a different email</button></form>`
    :`<form id="signf" class="form" style="padding:0"><p class="legend" style="padding:0">No password needed. Enter your email and we'll send you a sign-in code. New here? This also creates your free account.</p>
      <label>Email<input name="email" type="email" autocomplete="email" required></label><button type="submit" class="btn solid">Email me a sign-in code</button></form>`}
    <small class="muted">Sleds you saved on this phone stay here; after you sign in you can add them to your account.</small></div>`}
  const r=CLOUD.realRole(),n=CLOUD.unclaimedCount(),pend=CLOUD.pending();
  setTimeout(()=>{
    const h=$("#handlef");if(h)h.onsubmit=async e=>{e.preventDefault();try{await CLOUD.setHandle(new FormData(h).get("handle"));toast("Name saved")}catch(err){toast(err.message,5000)}};
    const dn=$("#dispnamef");if(dn)dn.onsubmit=async e=>{e.preventDefault();try{await CLOUD.setDisplayName(new FormData(dn).get("display_name"));toast("Ticket name saved")}catch(err){toast(err.message,5000)}};
    const m=$("#migrate");if(m)m.onclick=async()=>{m.disabled=true;m.textContent="Uploading…";await CLOUD.claimLocal();toast(CLOUD.pending()?"Some sleds are still waiting to upload":"Your sleds are in your account");route()};
    const k=$("#skipmig");if(k)k.onclick=()=>{CLOUD.skipMigration();route()};
    const y=$("#syncnow");if(y)y.onclick=async()=>{y.disabled=true;y.textContent="Syncing…";await CLOUD.syncNow();toast(CLOUD.lastError?"Sync problem: "+CLOUD.lastError:"Synced");route()};
    const mp=$("#manageP");if(mp)mp.onclick=()=>openStripeUrl(mp,"portal");
    const dl=$("#delacct");if(dl)dl.onclick=async()=>{if(!confirm("Delete your Sled Finder account? This removes your account, your shared sleds, sale ads and uploaded photos from Sled Finder for good, and cancels your membership. Sleds on this phone stay on this phone."))return;if(prompt("Type DELETE to confirm")!=="DELETE")return;dl.disabled=true;try{await CLOUD.deleteAccount();toast("Account deleted",4000);location.hash="#/profile"}catch(err){dl.disabled=false;toast(err.message,6000)}};
    const o=$("#signout");if(o)o.onclick=async()=>{if(!confirm("Sign out of Sled Finder on this phone?"))return;try{await CLOUD.signOut();toast("Signed out");location.hash="#/profile"}catch(err){toast(err.message,6000)}}});
  return `<div class="form">
  <h3 class="sec" style="margin:0">Membership</h3><p style="margin:0"><b>${esc(memberLine())}</b></p>
  ${CLOUD.paymentsOn()&&(r==="premium"||CLOUD.hasOpenSubscription())?`<button type="button" class="btn" id="manageP">Manage or cancel membership ↗</button>`:(r==="premium"||r==="admin"?"":`<a class="btn gold" href="#/upgrade">${r==="lapsed"?"Renew membership · $15/yr":"Join Premium · $15/yr"}</a>`)}
  ${n&&!CLOUD.migrationAsked()?`<div class="card" style="padding:12px"><b>${n} item${n===1?"":"s"} saved on this phone</b><p class="small" style="margin:6px 0">These were saved before you had an account. Add them to your account so they show on your other devices and on the website?${r==="premium"||r==="admin"?"":" They upload once your membership is active."}</p><div class="row2"><button type="button" class="btn solid" id="migrate">Add to my account</button><button type="button" class="btn" id="skipmig">Not now</button></div></div>`:(n?`<button type="button" class="btn" id="migrate">Add ${n} item${n===1?"":"s"} saved on this phone to my account</button>`:"")}
  <h3 class="sec" style="margin:8px 0 0">Your public name</h3>
  <form id="handlef" class="row2" style="align-items:end"><label style="flex:1">Shown as @name on shared sleds<input name="handle" value="${esc(CLOUD.handle())}" pattern="[a-z0-9_]{3,30}" required></label><button class="btn" type="submit">Save</button></form>
  <h3 class="sec" style="margin:8px 0 0">Name on your museum ticket</h3>
  <form id="dispnamef" class="row2" style="align-items:end"><label style="flex:1">The name staff will see at the door<input name="display_name" maxlength="80" value="${esc(CLOUD.displayName&&CLOUD.displayName()||"")}" placeholder="Your name"></label><button class="btn" type="submit">Save</button></form>
  <a class="btn pine" href="#/ticket">Museum ticket</a>
  <h3 class="sec" style="margin:8px 0 0">Sync</h3>
  <p class="small" style="margin:0">${pend?pend+" change"+(pend===1?"":"s")+" waiting to upload":"Everything on this phone is uploaded"} · last synced ${ago(CLOUD.lastSync)}${navigator.onLine?"":" · offline"}</p>
  ${CLOUD.lastError?`<p class="small" style="color:var(--red);margin:0">${esc(CLOUD.lastError)}</p>`:""}
  <button type="button" class="btn" id="syncnow">Sync now</button>
  <p class="small muted" style="margin:0">Signed in as ${esc(CLOUD.email())}</p>
  <button type="button" class="btn" id="signout" style="color:var(--red);border-color:var(--red)">Sign out</button>
  <button type="button" class="linkbtn small" id="delacct" style="color:var(--red);margin-top:6px">Delete my account…</button></div>`};
function liveUpgrade(reason){bar(window.APP_NAME+" Premium",{back:true,sub:"$15 per year"});tab("");
  const r=CLOUD.realRole(),signedIn=!!CLOUD.user,usePortal=signedIn&&CLOUD.hasOpenSubscription();
  if(r==="premium"||r==="admin")return `<div class="pad" style="text-align:center"><p style="font-family:var(--serif);font-size:1.6rem;margin:20px 0 6px">${r==="admin"?"Admin (Sled Finder)":"You're a Premium member"}</p><p class="small muted">${esc(memberLine())}</p><div style="display:flex;flex-direction:column;gap:10px;margin-top:18px"><a class="btn pine" href="#/makers">Browse all 61 makers</a><a class="btn" href="#/ticket">Museum ticket</a><a class="btn" href="#/account">Account &amp; membership</a></div></div>`;
  const payCta=usePortal?`<button type="button" class="btn gold" id="joinP">Update payment or manage membership</button>`:`<button type="button" class="btn gold" id="joinP">${r==="lapsed"?"Renew membership · $15/yr":"Join Premium · $15/yr"}</button>`;
  const cta=!signedIn?`<a class="btn gold" href="#/account">Sign in to join · $15/yr</a>`:(CLOUD.paymentsOn()?`${payCta}<p class="small muted" style="text-align:center">Secure checkout by Stripe. Back in the app, tap “I've paid, refresh” if Premium doesn't switch on by itself.</p><button type="button" class="btn" id="refreshP">I've paid, refresh</button>`:`<button class="btn gold" disabled>Memberships open soon</button>`);
  setTimeout(()=>{const b=$("#refreshP");if(b)b.onclick=async()=>{b.disabled=true;await CLOUD.loadProfile();await CLOUD.syncNow();toast(premium()?"Premium is on. Thank you!":"Not showing yet. Give it a minute and try again.",4000);route()};const j=$("#joinP");if(j)j.onclick=()=>openStripeUrl(j,usePortal?"portal":"checkout")});
  return `<div class="pw-hero"><p class="eyebrow" style="color:#e7b7a5">${esc(window.APP_NAME)} Premium</p><h1>${r==="lapsed"?"Welcome back. Renew to bring your posts back.":"Post, see and sell sleds. All 61 makers."}</h1><p>${esc(typeof reason==="string"?reason:(r==="lapsed"?lapsedText(allSleds().filter(isOwn).length):"Your research library and community for antique sleds."))}</p></div>
  <div class="price"><div><div class="small muted">Yearly · renews automatically</div><b>$15.00 / year</b></div></div>
  <div class="pad">${cta}<a class="btn" style="margin-top:10px;border:0" href="#/home">Not now</a></div>
  <p class="fine">The membership renews each year until you cancel. You can cancel any time from Account → Manage membership; it stays active until the end of the year you paid for. If a membership lapses, your posts stay in Sled Finder and come back when you renew. See the <a href="#/terms">Terms &amp; Community Guidelines (draft)</a>.</p>`}
function chicagoDate(iso){try{return new Date(iso).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"America/Chicago"})}catch(e){return ""}}
function ticketName(){if(CLOUD&&CLOUD.user){const n=CLOUD.displayName&&CLOUD.displayName();return n||("@"+me())}return isAdmin()?"Jonathan Spangler":"Sample Member"}
function ticketSince(){if(CLOUD&&CLOUD.memberSince&&CLOUD.memberSince())return chicagoDate(CLOUD.memberSince());return "November 21, 2026"}
function ticketUntil(){const p=CLOUD&&CLOUD.profile;if(p&&p.premium_until)return chicagoDate(p.premium_until);if(CLOUD&&isAdmin()&&!(p&&p.premium_until))return "Museum staff";return "November 21, 2027"}
function ticketId(){if(CLOUD&&CLOUD.memberId&&CLOUD.memberId())return CLOUD.memberId();return isAdmin()?"SF-ADMIN":"SF-DEMO-P"}
R.ticket=()=>{bar("Museum Ticket",{back:true,sub:"Rosebud Sled Museum"});tab("profile");
  if(!premium())return gate(lapsed()?"Membership lapsed":"The museum ticket is for members",lapsed()?"Renew to show your admission ticket at the museum.":"Paid members get a museum admission ticket to show at the door. Free and lapsed members can join or renew to unlock it.");
  const name=ticketName(),needName=CLOUD&&CLOUD.user&&!(CLOUD.displayName&&CLOUD.displayName());
  return `<div class="ticket-wrap">
    <div class="ticket" id="museumTicket">
      <div class="ticket-stub"><div class="ticket-admit">ADMIT</div><div class="ticket-stub-id">${esc(ticketId())}</div></div>
      <div class="ticket-body">
        <p class="eyebrow">Rosebud Sled Museum · Schaumburg</p>
        <h1>Rosebud Sled Museum — Member Admission</h1>
        <p class="ticket-name">${esc(name)}${!CLOUD?' <span class="sample-tag">Example</span>':""}</p>
        <dl class="ticket-meta">
          <div><dt>Member since</dt><dd>${esc(ticketSince())}</dd></div>
          <div><dt>Valid through</dt><dd>${esc(ticketUntil())}</dd></div>
          <div><dt>Member ID</dt><dd>${esc(ticketId())}</dd></div>
        </dl>
        <p class="ticket-fine">Present this ticket at the museum. Open by appointment. Location: Schaumburg, Illinois.</p>
      </div>
    </div>
  </div>
  ${needName?`<div class="pad"><p class="legend">Add the name you want on the ticket so staff can match it at the door.</p><form class="form" id="tnamef"><label>Name on ticket<input name="display_name" maxlength="80" placeholder="Your name" value="${esc((CLOUD.displayName&&CLOUD.displayName())||"")}"></label><button class="btn pine" type="submit">Save name</button></form></div>`:`<p class="legend">Show this screen at the door. ${CLOUD?"":"This is a demo ticket for the mockup."} No street address is printed — only Schaumburg.</p>${CLOUD?`<p class="legend"><a href="#/account">Update the name on your ticket</a></p>`:""}`}
  <div class="pad" style="padding-top:0"><a class="btn" href="https://rosebudsledmuseum.com/" target="_blank" rel="noopener">Rosebud Sled Museum website ↗</a></div>`;
};

R.photos=()=>{bar("Community photos",{back:true,sub:premium()?"Members' photo posts":"Members only",act:premium()?'<a class="act" href="#/addphoto" aria-label="Post photos">＋</a>':""});tab("home");
  if(!premium())return gate(lapsed()?"Membership lapsed":"Community photos are for members",lapsed()?lapsedText(userPhotos().length)+" Renew to post and see community photos again.":"Paid members can post photos with a caption, and comment on others' posts. Free and lapsed members can join or renew to take part.");
  const posts=allPhotoPosts().slice().sort((a,b)=>(b.created||b.updatedAt||0)-(a.created||a.updatedAt||0));
  return `<div class="pad" style="padding-bottom:4px"><a class="btn solid" href="#/addphoto">＋ Post photos</a></div>
  <p class="legend">Share photos from your collection with a caption. Other members can comment, and can add photos to a comment too. JPEG, PNG or WebP, about 2 MB each.</p>
  <div class="feed">${posts.map(p=>`<article class="card post"><a href="#/photopost/${p.id}"><div class="ph" style="background-image:url('${p.img}')">${p.imgs&&p.imgs.length>1?`<span class="pcount">▣ ${p.imgs.length}</span>`:""}</div></a>
    <div class="meta"><div class="who"><span class="av">${initials(p.user||"")}</span>@${esc(p.user||"member")}${sampleTag(p)}</div>
    <a href="#/photopost/${p.id}" style="text-decoration:none"><div class="t">${esc((p.caption||"Photo post").slice(0,80))}</div></a>
    <div class="m">${commentsOn("photo_post",p.id).length} comment${commentsOn("photo_post",p.id).length===1?"":"s"}</div></div></article>`).join("")||'<p class="legend">No photo posts yet. Be the first.</p>'}</div>`;
};
R.addphoto=()=>{if(!premium()){bar("Post photos",{sub:"Members only"});tab("home");return gate(lapsed()?"Membership lapsed":"Posting photos is for members",lapsed()?lapsedText(userPhotos().length)+" Renew to post again.":"Paid members can post photos with a caption for the community gallery.")}
  bar("Post photos",{back:true,sub:"Community gallery"});tab("home");
  setTimeout(()=>{const getPics=picker("phpk",[],["images/ff-flexy-racer-200.jpg","images/collection-pictorial-deck-photos-p31.jpg","images/collection-red-swirl-deck-photos-p28.jpg","images/sherwood-bros-sled-top-owner-horizontal.jpg"]);
    $("#phf").onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector("button[type=submit]");if(btn.disabled)return;btn.disabled=true;try{const pics=getPics();if(!pics.length){toast("Please add at least one photo");return}const caption=String(new FormData(e.target).get("caption")||"").trim();
      const imgs=await storePics(pics);const x={id:"ph"+Date.now(),user:me(),userAdded:true,mine:true,caption,imgs,img:imgs[0],created:Date.now()};await lsSave(()=>addPhoto(x));toast("Photo post published");location.hash="#/photopost/"+x.id}catch(err){saveErr(err)}finally{btn.disabled=false}}});
  return `<form class="form" id="phf">${pickerHTML("phpk",true)}
  <label>Caption / comment<textarea name="caption" rows="4" maxlength="2000" placeholder="What's in these photos?"></textarea></label>
  <p class="legend" style="margin:0;padding:0">JPEG, PNG or WebP. Keep each photo under 2 MB. The first photo is the cover.</p>
  ${ackHTML()}
  <button class="btn solid" type="submit">Post to the gallery</button></form>`;
};
R.photopost=id=>{const p=allPhotoPosts().find(x=>String(x.id)===String(id));if(!p)return R.photos();
  if(!premium()&&!isOwn(p)){bar("Community photos",{back:true});tab("home");return gate("Community photos are for members","Paid members can view and comment on community photo posts.")}
  if(!premium()&&isOwn(p)&&lapsed()){bar("Community photos",{back:true});tab("home");return gate("Membership lapsed",lapsedText(userPhotos().length))}
  bar("Photo post",{back:true,sub:"@"+(p.user||"member")});tab("home");
  return `${gallery(p.imgs,false)}
  <div class="title-block"><h1>${esc(p.caption||"Photo post")}</h1><div class="small muted" style="margin-top:4px">@${esc(p.user||"member")}${sampleTag(p)}</div>${editedNote(p)}</div>
  <div style="padding:16px">${canEdit(p)?`<div class="row2"><button class="btn" data-del="${p.id}" data-kind="photo" style="color:var(--red);border-color:var(--red)">Delete</button></div>`:""}</div>
  ${commentBlock("photo_post",p.id)}`;
};

R.events=()=>{bar("Upcoming Events",{back:true,sub:"Rosebud Sled Museum"});tab("events");
  const src=window.EVENTS_SOURCE||"https://rosebudsledmuseum.com/#upcoming";
  setTimeout(()=>{const url=window.EVENTS_JSON;if(!url)return;fetch(url,{mode:"cors"}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!Array.isArray(j.events)||!j.events.length)return;window.MUSEUM_EVENTS=j.events;if(j.lede)window.EVENTS_LEDE=j.lede;if(/^#\/events/.test(location.hash||""))route()}).catch(()=>{})},0);
  const ev=window.MUSEUM_EVENTS||[], lede=window.EVENTS_LEDE||"";
  return `<p class="legend">These are the upcoming talks and displays listed on the Rosebud Sled Museum website. Each event links back to that page. This list is a copy of the site's Upcoming Talks &amp; Displays section and should stay in sync with it.</p>
  ${lede?`<p class="legend" style="margin-top:0">${esc(lede)}</p>`:""}
  <div class="event-list">${ev.map(e=>`<article class="card event-card-app">
    <p class="eyebrow">${esc(e.kicker||"Event")}</p>
    <h3>${esc(e.title)}</h3>
    <p class="event-place">${esc(e.place||"")}</p>
    <p>${esc(e.detail||"")}</p>
    <a class="btn pine" href="${esc(e.url||src)}" target="_blank" rel="noopener">View on rosebudsledmuseum.com ↗</a>
  </article>`).join("")||'<p class="legend">No upcoming events are listed right now. See the museum website for the latest.</p>'}</div>
  <div class="pad"><a class="btn" href="${esc(src)}" target="_blank" rel="noopener">All upcoming events on the website ↗</a></div>`;
};

function route(){
  const h=(location.hash||"#/home").slice(2).split("/");const fn=R[h[0]]||R.home;
  $("#view").innerHTML=fn(h.length>2?h.slice(1).join(","):h[1]);$("#view").scrollTop=0;bindLikes();bindGalleries();bindComments();
  const c=$("#cancelP");if(c)c.onclick=()=>{setRole("free");toast("Back to Free");route()};
  const rs=$("#roleSel");if(rs){rs.value=role();rs.onchange=()=>{setRole(rs.value);toast("Demo role: "+ROLES[rs.value]);route()}}
  const tn=$("#tnamef");if(tn)tn.onsubmit=async e=>{e.preventDefault();try{await CLOUD.setDisplayName(new FormData(tn).get("display_name"));toast("Name saved");route()}catch(err){toast(err.message,5000)}};
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const kind=b.dataset.kind;const it=kind==="listing"?allListings().find(x=>x.id==b.dataset.del):kind==="photo"?allPhotoPosts().find(x=>x.id==b.dataset.del):allSleds().find(x=>x.id==b.dataset.del);if(!canEdit(it))return;if(!confirm("Delete this "+kind+"?"))return;
    if(kind==="listing"){deleteListing(b.dataset.del);toast("Listing deleted");location.hash="#/sale"}
    else if(kind==="photo"){deletePhoto(b.dataset.del);toast("Photo post deleted");location.hash="#/photos"}
    else{deleteSled(b.dataset.del);toast("Sled deleted");location.hash=isOwn(it)?"#/collection":"#/home"}});
}
window.addEventListener("hashchange",route);
document.addEventListener("click",e=>{const t=e.target.closest("[data-soon]");if(t){e.preventDefault();toast("Coming in the real app")}});
const TOUR=[
 {h:"#/home",t:"Welcome to Sled Finder",b:"A quick look around. Tap “Viewing as” at the top any time to see the app as Free, Premium, Lapsed or Admin."},
 {h:"#/identify",t:"Photo ID",b:"Snap or upload a sled photo and get ranked maker matches. This demo shows sample results; tap “Use a sample photo”, then Identify."},
 {h:"#/maker/1",t:"Maker pages",b:"Each of the 61 makers has a page: where and when they worked, models, photos and history. Some makers are free; the rest are Premium."},
 {h:"#/map",t:"Sled Picker Map",b:"Where sleds were found, coloured by maker, across the US, Canada, the UK and Ireland. Town level only, never an address. Members can pan, zoom and filter."},
 {h:"#/sale",t:"Sleds for Sale",b:"Paid members can browse sleds for sale and post their own listings. Free and lapsed members see a locked preview."},
 {h:"#/events",t:"Upcoming Events",b:"Talks and displays from the Rosebud Sled Museum website, with a link back to that page."},
 {h:"#/ticket",t:"Museum ticket",b:"Paid members can show a museum admission ticket at the door. It lists your name, member since, valid-through date and member ID."}];
let tourI=-1;
function tourShow(){let o=$("#tour");if(tourI<0||tourI>=TOUR.length){if(o)o.remove();tourI=-1;return}
  if(!o){o=document.createElement("div");o.id="tour";o.className="tour";document.querySelector(".screen").appendChild(o)}
  const st=TOUR[tourI];o.innerHTML=`<div class="tour-card"><div class="small muted">Tour · ${tourI+1} of ${TOUR.length}</div><b>${esc(st.t)}</b><p>${esc(st.b)}</p><div class="row2"><button type="button" class="btn" id="tourSkip">Skip</button><button type="button" class="btn solid" id="tourNext">${tourI===TOUR.length-1?"Done":"Next"}</button></div></div>`;
  $("#tourSkip").onclick=()=>{tourI=-1;tourShow()};$("#tourNext").onclick=()=>{tourI++;if(tourI<TOUR.length)location.hash=TOUR[tourI].h;tourShow()};
  if(location.hash!==st.h)location.hash=st.h}
window.startTour=()=>{tourI=0;tourShow()};
document.addEventListener("invalid",e=>{const t=e.target,l=t.closest("label");toast(t.name==="ack"?"Please tick the agreement box to save.":"Please fill in: "+(l?(l.childNodes[0].textContent||"").replace("*","").trim()||t.name:t.name),4000)},true);
$("#resetDemo").onclick=()=>{["premium","role","sleds","liked","lastq","edits","deleted","listings","ledits","ldeleted","idDraft","photoPosts","pedits","pdeleted","comments","cdeleted"].forEach(k=>localStorage.removeItem("svc_"+k));location.hash="#/home";route();toast("Demo reset")};
window.SFApp={phURL};
// Live mode: re-draw when the account or synced data changes, but never while someone is typing in a form.
const NO_LIVE_REDRAW=["add","edit","sell","editlisting","suggest","identify","addphoto"];
if(CLOUD){CLOUD.onChange(()=>{const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest("#view"))return;if(NO_LIVE_REDRAW.includes((location.hash||"#/home").slice(2).split("/")[0]))return;const rs1=$("#roleSel");if(rs1)rs1.closest("p").style.display=canViewAs()?"":"none";if(PH.ready)route()});
  const sn=document.querySelector(".side-note .eyebrow");if(sn)sn.textContent="Sled Finder · live beta";
  const rd=$("#resetDemo");if(rd)rd.parentNode.style.display="none";
  const rs0=$("#roleSel");if(rs0&&!canViewAs())rs0.closest("p").style.display="none"}
Promise.race([phOpen(),new Promise(r=>setTimeout(()=>r(null),3000))]).then(async db=>{PH.db=db;if(db)await phLoadAll(db);PH.ready=true;route();if(CLOUD)CLOUD.init().catch(e=>console.error("cloud init",e))});
})();
