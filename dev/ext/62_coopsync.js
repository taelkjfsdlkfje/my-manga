// =====================================================================
// CO-OP, LOW-LATENCY MODE: the friend's browser runs the game too and plays Ali locally.
// The host (Shayan) stays in charge of the twins, their attacks, damage and cutscenes and sends
// ~20 updates a second. The guest sends Ali's position, actions and hits back.
// Everything visual the host creates (telegraphs, projectiles, beams) is mirrored as shapes;
// particles, sounds, voices and screen effects are forwarded as small events.
// The video mode (?mode=video) stays available as a fallback.
// =====================================================================
const NS={on:false,guest:false,host:false,applying:0,evq:[],base:new Set(),objs:new Map(),sent:new Map(),geoSent:new Set(),texSent:new Set(),gs:null,snT:0,gsT:0,last:0,nid:1,
  foes:new Map(),P:null,shSpr:null,lastBanner:'',lastSub:'',down:false,texCache:{},geoCache:{},lastRecv:0};
const NS_TEXG={}; (function(){ for(const n of ['GLOW','CRESC','PX_SHADOW','CROSS','MECHTEX']){ try{ const v=eval(n); if(v) NS_TEXG[n]=v; }catch(e){} } })();
const r3=v=>Math.round(v*1000)/1000, r2=v=>Math.round(v*100)/100;

// ---------- event forwarding (both directions) ----------
function nsFwd(name,args){ if(!NS.on||NS.applying) return; NS.evq.push([name].concat(Array.from(args).map(a=>typeof a==='number'?r2(a):a))); if(NS.evq.length>600) NS.evq.splice(0,NS.evq.length-600); }
const NS_FN={};
(function(){ let inFx=0;
  for(const k of ['burst','spark','ring','arc','cut','marker','line','ash','spawn']){ const f=FX[k].bind(FX); NS_FN['fx.'+k]=f;
    FX[k]=function(){ if(k==='spawn'&&inFx) return f.apply(null,arguments); const fwd=NS.on&&!NS.applying&&!inFx; if(fwd) nsFwd('fx.'+k,arguments);
      const n0=scene.children.length; inFx++; let r; try{ r=f.apply(null,arguments); } finally{ inFx--; } for(let i=n0;i<scene.children.length;i++) scene.children[i].userData.fx=1; return r; }; }
  const wrapObj=(obj,k,key)=>{ const f=obj[k].bind(obj); NS_FN[key]=f; obj[k]=function(){ nsFwd(key,arguments); return f.apply(null,arguments); }; };
  wrapObj(Sound,'sfx','sfx'); wrapObj(Sound,'play','music'); wrapObj(Sound,'stop','mstop'); wrapObj(Voice,'stop','vstop'); wrapObj(Voice,'overlay','vover'); wrapObj(Voice,'bark','vbark');
  { const f=Voice.play.bind(Voice); NS_FN.vplay=f; Voice.play=function(who,text){ nsFwd('vplay',[who,text]); return f(who,text); }; }
  const g=(nm,get,set)=>{ const f=get(); NS_FN[nm]=f; set(function(){ nsFwd(nm,arguments); return f.apply(this,arguments); }); };
  g('shake',()=>shake,v=>{ shake=v; }); g('impact',()=>impactFrame,v=>{ impactFrame=v; }); g('eva',()=>evaCard,v=>{ evaCard=v; }); g('card',()=>card,v=>{ card=v; });
  g('big',()=>twBig,v=>{ twBig=v; }); g('cutin',()=>twCutin,v=>{ twCutin=v; }); })();
function nsApplyEvents(list){ if(!list) return; NS.applying++; try{ for(const e of list){ const f=NS_FN[e[0]]; if(f){ const n0=scene.children.length; try{ f.apply(null,e.slice(1)); }catch(err){} for(let i=n0;i<scene.children.length;i++) scene.children[i].userData.fx=1; } } } finally{ NS.applying--; } }

// ---------- mirroring scene objects (both directions) ----------
function nsTexKey(t){ if(!t) return null; for(const k in TWTX) if(TWTX[k]===t) return 'w:'+k; for(const k in NS_TEXG) if(NS_TEXG[k]===t) return 'g:'+k; return 'u:'+t.uuid; }
function nsTexDef(t,key){ if(NS.texSent.has(key)||key.startsWith('g:')) return null; NS.texSent.add(key); const im=t.image; try{ if(im&&(im.toDataURL||im.src)) return {k:key,u:im.toDataURL?im.toDataURL():im.src}; }catch(e){} return null; }
function nsMatSer(m,defs){ if(Array.isArray(m)) m=m[0]; if(!m) return null; const o={t:m.isSpriteMaterial?'s':m.isMeshLambertMaterial||m.isMeshStandardMaterial||m.isMeshPhongMaterial?'l':'b',c:m.color?m.color.getHex():0xffffff,o:m.opacity,tr:m.transparent?1:0,bl:m.blending,sd:m.side,dw:m.depthWrite?1:0,dt:m.depthTest===false?0:1,at:m.alphaTest||0};
  if(m.emissive) o.e=m.emissive.getHex(); if(m.map){ const k=nsTexKey(m.map); o.m=k; const d=nsTexDef(m.map,k); if(d) defs.tex.push(d); } return o; }
function nsGeoSer(g,defs){ if(!g||!g.attributes||!g.attributes.position) return null; const id=g.uuid; if(!NS.geoSent.has(id)){ NS.geoSent.add(id); const d={id,p:Array.from(g.attributes.position.array,r3)};
    if(g.attributes.uv) d.uv=Array.from(g.attributes.uv.array,r3); if(g.index) d.i=Array.from(g.index.array); defs.geo.push(d); } return id; }
function nsSer(o,defs){ const r={k:o.isSprite?'s':o.isMesh?'m':(o.isGroup||o.type==='Object3D')?'g':null}; if(!r.k) return null;
  if(o.isMesh){ r.g=nsGeoSer(o.geometry,defs); r.mt=nsMatSer(o.material,defs); if(!r.g) return null; } if(o.isSprite) r.mt=nsMatSer(o.material,defs);
  r.ro=o.renderOrder||0; r.c=[]; for(const ch of o.children){ const s=nsSer(ch,defs); if(s) r.c.push(s); } return r; }
function nsTf(o,deep){ const m=Array.isArray(o.material)?o.material[0]:o.material; const a=[r3(o.position.x),r3(o.position.y),r3(o.position.z),r3(o.quaternion.x),r3(o.quaternion.y),r3(o.quaternion.z),r3(o.quaternion.w),r3(o.scale.x),r3(o.scale.y),r3(o.scale.z),o.visible?1:0,m?r3(m.opacity):1,m&&m.color?m.color.getHex():-1];
  if(deep&&o.children.length&&o.children.length<=40) a.push(o.children.filter(c=>c.isMesh||c.isSprite||c.isGroup).map(c=>nsTf(c,true))); return a; }
function nsCollect(){ const ex=new Set(); for(const s of SPRITES){ ex.add(s.mesh); ex.add(s.shadow); } if(NS.shSpr){ ex.add(NS.shSpr.mesh); ex.add(NS.shSpr.shadow); }
  return scene.children.filter(o=>!NS.base.has(o)&&!ex.has(o)&&!o.userData.net&&!o.userData.fx&&!o.isLight&&!o.isPoints&&(o.isMesh||o.isSprite||o.isGroup||o.type==='Object3D')); }
function nsMirrorOut(){ const defs={geo:[],tex:[]}, mk=[], tf=[], rm=[], live=new Set();
  for(const o of nsCollect()){ let id=o.userData.nsid; if(!id){ id=o.userData.nsid=(NS.host?'h':'g')+(NS.nid++); const s=nsSer(o,defs); if(!s){ o.userData.nsSkip=1; continue; } mk.push([id,s]); }
    if(o.userData.nsSkip) continue; live.add(id); const t=nsTf(o,true), js=JSON.stringify(t); if(NS.sent.get(id)!==js){ NS.sent.set(id,js); tf.push([id,t]); } }
  for(const id of Array.from(NS.sent.keys())) if(!live.has(id)){ NS.sent.delete(id); rm.push(id); }
  return {geo:defs.geo,tex:defs.tex,mk,tf,rm}; }
function nsBuildTex(key,cb){ if(NS.texCache[key]) return NS.texCache[key]; if(key.startsWith('w:')&&TWTX[key.slice(2)]) return TWTX[key.slice(2)]; if(key.startsWith('g:')) return NS_TEXG[key.slice(2)]||null; return null; }
function nsMirrorIn(d){ if(!d) return; for(const t of d.tex||[]){ if(NS.texCache[t.k]) continue; const im=new Image(); const tx=new THREE.Texture(im); tx.magFilter=THREE.NearestFilter; tx.minFilter=THREE.NearestFilter; try{ tx.encoding=THREE.sRGBEncoding; }catch(e){} im.onload=()=>{ tx.needsUpdate=true; }; im.src=t.u; NS.texCache[t.k]=tx; }
  for(const g of d.geo||[]){ const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3)); if(g.uv) geo.setAttribute('uv',new THREE.Float32BufferAttribute(g.uv,2)); if(g.i) geo.setIndex(g.i); geo.computeVertexNormals(); NS.geoCache[g.id]=geo; }
  const build=s=>{ let o; const mt=s.mt;
    const mkMat=()=>{ if(!mt) return new THREE.MeshBasicMaterial(); const p={color:mt.c,transparent:!!mt.tr,opacity:mt.o,blending:mt.bl,side:mt.sd,depthWrite:!!mt.dw,depthTest:mt.dt!==0,alphaTest:mt.at||0}; const map=mt.m?nsBuildTex(mt.m):null; if(map) p.map=map;
      if(mt.t==='s') return new THREE.SpriteMaterial({map:p.map,color:p.color,transparent:true,opacity:p.opacity,blending:p.blending,depthWrite:p.depthWrite});
      if(mt.t==='l'){ const q=Object.assign({},p); if(mt.e!=null) q.emissive=mt.e; return new THREE.MeshLambertMaterial(q); } return new THREE.MeshBasicMaterial(p); };
    if(s.k==='s') o=new THREE.Sprite(mkMat()); else if(s.k==='m'){ const geo=NS.geoCache[s.g]; if(!geo) return null; o=new THREE.Mesh(geo,mkMat()); } else o=new THREE.Group();
    o.renderOrder=s.ro||0; for(const c of s.c||[]){ const ch=build(c); if(ch) o.add(ch); } return o; };
  for(const [id,s] of d.mk||[]){ if(NS.objs.has(id)) continue; const o=build(s); if(!o) continue; o.userData.net=1; o.userData.temp=1; o.visible=false; scene.add(o); NS.objs.set(id,{o,first:true}); }
  const apply=(o,t,snap)=>{ o.position.set(t[0],t[1],t[2]); o.quaternion.set(t[3],t[4],t[5],t[6]); o.scale.set(t[7],t[8],t[9]); o.visible=!!t[10]; const m=o.material; if(m){ m.opacity=t[11]; if(t[12]>=0&&m.color) m.color.setHex(t[12]); }
    if(t[13]){ const kids=o.children.filter(c=>c.isMesh||c.isSprite||c.isGroup); t[13].forEach((ct,i)=>{ if(kids[i]) apply(kids[i],ct,snap); }); } };
  for(const [id,t] of d.tf||[]){ const e=NS.objs.get(id); if(!e) continue; if(e.first){ apply(e.o,t); e.first=false; e.tp=null; } else { e.tp={x:t[0],y:t[1],z:t[2]}; const keep=e.o.position.clone(); apply(e.o,t); e.o.position.copy(keep); } }
  for(const id of d.rm||[]){ const e=NS.objs.get(id); if(e){ scene.remove(e.o); NS.objs.delete(id); } } }
function nsSmoothMirrors(dt){ const k=Math.min(1,dt*22); for(const e of NS.objs.values()){ if(e.tp){ e.o.position.x=lerp(e.o.position.x,e.tp.x,k); e.o.position.y=lerp(e.o.position.y,e.tp.y,k); e.o.position.z=lerp(e.o.position.z,e.tp.z,k); } } }
function nsClearMirrors(){ for(const e of NS.objs.values()) scene.remove(e.o); NS.objs.clear(); }

// ---------- HOST ----------
const NS_FOE_F=['who','x','y','z','f','hp','maxHp','phase','phases','state','stun','flash','fire','cast','push','glintT','glintN','showN','down','hide','scale','form','tint','heartEyes','nose','cracked','scythe','swing','noGlasses','lockF','alpha','title','sub','noBar','gone','inv','hy','maid'];
function nsHostStart(){ NS.on=true; NS.host=true; NS.guest=false; MP.sync=true; NS.base=new Set(scene.children); NS.sent.clear(); NS.geoSent.clear(); NS.texSent.clear(); NS.evq=[];
  // things already in the scene when the guest arrives still need to be mirrored
  for(const o of scene.children) if(o.userData&&(o.userData.tw||o.userData.temp)) NS.base.delete(o);
  const A=TW.allies.find(a=>a.who==='ali'), F=TW.fight;
  mpSend({t:'init',lvl:L.key,arena:Game.arena&&Game.arena.lock||null,ax:A?A.x:Player.x+1.5,az:A?A.z:Player.z,hp:A?A.hp:18,mhp:A?A.maxHp:18}); }
function nsHostStop(){ NS.on=false; NS.host=false; MP.sync=false; NS.gs=null; }
function nsSnapshot(){ const P=Player, A=TW.allies.find(a=>a.who==='ali'), F=TW.fight, cine=Game.state!=='play';
  for(const T of TW.foes) if(!T.nid) T.nid=NS.nid++;
  const foes=TW.foes.filter(T=>!T.gone).map(T=>{ const o={id:T.nid}; for(const k of NS_FOE_F) if(T[k]!==undefined) o[k]=typeof T[k]==='number'?r3(T[k]):T[k]; return o; });
  const d=Game.dlg; const mi=Game.mira;
  return {t:'sn',st:Game.state,cam:cine?(Cam.cine?[r3(Cam.cine.px),r3(Cam.cine.py),r3(Cam.cine.pz),r3(Cam.cine.lx),r3(Cam.cine.ly),r3(Cam.cine.lz)]:[r3(camera.position.x),r3(camera.position.y),r3(camera.position.z),r3(Cam.look.x),r3(Cam.look.y),r3(Cam.look.z)]):null,
    P:{x:r3(P.x),y:r3(P.y),z:r3(P.z),f:P.f,ang:r3(P.ang||0),anim:P.anim,ap:r3(P.ap||0),combo:P.combo||0,hid:P.hidden?1:0,down:P.mpDown?1:0},
    A:A?{x:r3(A.x),y:r3(A.y),z:r3(A.z),f:A.f,hp:r3(A.hp),mhp:A.maxHp,down:A.coopDown?1:0,ult:r2(A.ult||0)}:null,
    foes,F:F?{kind:F.kind,phase:F.phase,shared:F.shared?1:0,noBar:F.noBar?1:0}:null,arena:Game.arena&&Game.arena.lock||null,
    mira:mi&&mi.vis!==false?{x:r3(mi.x),y:r3(mi.y),z:r3(mi.z),f:mi.f,anim:mi.anim||'idle'}:null,
    scr:{fl:r2(FX.flash),fc:grade.uniforms.flashCol.value.toArray().map(r2),tint:grade.uniforms.tint.value.toArray().map(r2),lt:Game.letterTo,ts:Game.timeScale,
      banner:Game.banner?{name:Game.banner.name,sub:Game.banner.sub,small:Game.banner.small}:null,sub:Game.subtitle?{who:Game.subtitle.who,text:Game.subtitle.text}:null,
      dlg:d?{type:d.type,who:d.who,text:d.text,ex:d.ex,opts:d.opts,sel:d.sel}:null,sen:TW.sentence,hg:TW.hg,spot:TW.spot,dark:TW.dark,mash:TW.mash?{v:r2(TW.mash.v),t:r2(TW.mash.t),dur:TW.mash.dur}:null},
    ev:NS.evq.splice(0),mir:nsMirrorOut()}; }
function nsHostTick(dt){ if(!NS.host||!MP.on) return; NS.snT-=dt; if(NS.snT<=0){ NS.snT=.05; try{ mpSend(nsSnapshot()); }catch(e){ console.error('snapshot',e); } } }
// Ali on the host follows what the guest sends
function nsRemoteAli(A,dt,play){ const P=Player, g=NS.gs; A.t+=dt; A.inv=Math.max(0,A.inv-dt); A.flash=Math.max(0,A.flash-dt); const q=MP.pq; MP.pq=[];
  const gy=groundY(A.x,A.z); if(A.coopDown){ A.anim='hurt'; A.y=(gy>-50?gy:P.y)+.1; return; }
  if(g&&Game.state==='play'){ const k=Math.min(1,dt*20); A.x=lerp(A.x,g.x,k); A.z=lerp(A.z,g.z,k); A.y=g.y; A.f=g.f; A.anim=g.anim||'idle'; A.block=!!g.block||(performance.now()-(NS.blockAt||0)<160); if(g.block) NS.blockAt=performance.now(); }
  else { A.y=lerp(A.y,(gy>-50?gy:P.y),Math.min(1,dt*6)); }
  for(const a of q){ if(a==='attack'&&P.mpDown&&Math.hypot(P.x-A.x,P.z-A.z)<3.6) mpReviveTick(); }
  if(play) twAllyThreats(A); }
function nsHostMsg(m){ if(m.t==='gs'){ NS.gs=m; if(m.ev) nsApplyEvents(m.ev); if(m.mir) nsMirrorIn(m.mir); return true; }
  if(m.t==='ult'){ const A=TW.allies.find(a=>a.remote); if(m.on){ NS.hostUlt=performance.now(); if(A){ A.hp=A.maxHp; A.inv=99; A.coopDown=0; } twBig('ALI STOPPED TIME',{size:44,col:'#ff8a9a',y:UH*.24,dur:1.6,sub:'Judgement Cut End'}); } else { NS.hostUlt=0; if(A) A.inv=.8; } return true; }
  if(m.t==='hit'){ const T=TW.foes.find(f=>f.nid===m.id); if(T){ TW._ally=1; try{ if(twHurt(T,m.d,'net')){ const A=TW.allies.find(a=>a.remote); if(A) A.ult=Math.min(1,(A.ult||0)+.02); } }finally{ TW._ally=0; } } return true; }
  return false; }

// ---------- GUEST ----------
function nsGuestInit(m){ NS.on=true; NS.guest=true; NS.host=false; MP.sync=true; MP.on=true; mpClosePanel(); try{ Sound.unlock(); }catch(e){} try{ Voice.prewarm&&Voice.prewarm(); }catch(e){}
  Game.flags={ali:1,metMira:1,bellMemory:1,twinsDone:1}; Object.assign(SCR,SCRA); Game.hamza=null; Game.mira=null;
  loadLevel(m.lvl||'flowers',{keepHP:1}); Game.hamza=null; if(hSprite) hSprite.show(false);
  for(const n of NPCS.slice()){ try{ n.spr&&n.spr.dispose(); }catch(e){} } NPCS.length=0; for(const mb of MOBS.slice()){ try{ mb.spr&&mb.spr.dispose(); }catch(e){} } MOBS.length=0;
  for(const a of (Game.actors||[])){ try{ a.spr&&a.spr.show(false); if(a.g) scene.remove(a.g); }catch(e){} } Game.actors=[];
  resetPlayer({x:m.ax,z:m.az},true); Player.maxHp=m.mhp||18; Player.hp=m.hp||Player.maxHp; Player.sp=0; Player.ang=0; Game.paulLock=false;
  Game.arena=m.arena?{lock:m.arena}:null; TW.foes=[]; TW.allies=[]; TW.hz=[]; TW.fight={kind:'duo',shared:1,noAttack:true,phase:1,C:null,O:null,lock:m.arena,center:{x:m.ax,z:m.az}};
  NS.base=new Set(scene.children); Game.state='play'; Game.letterTo=0; Game.fade=0; Game.fadeTo=0; Cam.cine=null; Cam.focus=null; Cam.zoom=1.3; NS.lastRecv=performance.now();
  Game.banner={name:'Co-op',sub:'You are Ali. Attack: Getsuga · Right click: guard · Shift: blink. Hit Shayan 10 times if he goes down.',t:0,small:1}; nsGuestHud('Playing as Ali (low-latency mode)'); }
function nsGuestHud(text){ const s=document.getElementById('mpGStat'); if(s) s.textContent=text; }
function nsGuestSnap(m){ NS.lastRecv=performance.now(); const P=Player;
  // state + camera
  const cut=m.st!=='play', local=!!Game.script; if(!local){ if(cut){ if(Game.state==='play') Game.state='cut'; if(m.cam) Cam.cine={px:m.cam[0],py:m.cam[1],pz:m.cam[2],lx:m.cam[3],ly:m.cam[4],lz:m.cam[5]}; } else { if(Game.state==='cut') Game.state='play'; Cam.cine=null; } }
  // Ali: host owns HP and cutscene positions
  if(m.A){ P.maxHp=m.A.mhp; if(!local) P.hp=Math.max(m.A.down?0:.01,m.A.hp); NS.ult=m.A.ult; if(cut&&!local){ P.x=lerp(P.x,m.A.x,.5); P.z=lerp(P.z,m.A.z,.5); P.vx=P.vz=0; P.f=m.A.f; } NS.down=!!m.A.down; }
  NS.P=m.P; Game.arena=m.arena?{lock:m.arena}:Game.arena;
  // the twins
  const seen=new Set(); for(const fo of m.foes||[]){ seen.add(fo.id); let T=NS.foes.get(fo.id); if(!T){ T=twMake(fo.who,fo.x,fo.z,{}); T.nid=fo.id; NS.foes.set(fo.id,T); T.t=rnd(0,3); }
    for(const k in fo){ if(k==='x'||k==='y'||k==='z'||k==='id') continue; T[k]=fo[k]; } T.tx=fo.x; T.ty=fo.y; T.tz=fo.z; if(T.first==null){ T.x=fo.x; T.y=fo.y; T.z=fo.z; T.first=0; } }
  for(const [id,T] of Array.from(NS.foes)){ if(!seen.has(id)){ try{ twRemoveFoe(T); }catch(e){ T.gone=1; } NS.foes.delete(id); } }
  if(m.F&&TW.fight){ TW.fight.phase=m.F.phase; TW.fight.shared=m.F.shared; TW.fight.noBar=m.F.noBar; TW.fight.C=TW.foes.find(t=>t.who==='caotan')||null; TW.fight.O=TW.foes.find(t=>t.who==='omar')||null; }
  // Mira
  if(m.mira){ if(!Game.mira){ Game.mira={x:m.mira.x,y:m.mira.y,z:m.mira.z,f:m.mira.f,anim:m.mira.anim,t:0,follow:false,vis:true}; try{ makeMiraSprite(); if(mSprite) mSprite.show(true); }catch(e){} } Object.assign(Game.mira,m.mira,{follow:false,vis:true}); } else if(Game.mira){ Game.mira=null; if(mSprite) mSprite.show(false); }
  // screen
  const s=m.scr; if(s){ FX.flash=Math.max(FX.flash,s.fl); if(s.fl>.05) grade.uniforms.flashCol.value.fromArray(s.fc); grade.uniforms.tint.value.fromArray(s.tint); Game.letterTo=s.lt;
    const bj=JSON.stringify(s.banner); if(bj!==NS.lastBanner){ NS.lastBanner=bj; Game.banner=s.banner?Object.assign({t:0},s.banner):null; }
    const sj=JSON.stringify(s.sub); if(sj!==NS.lastSub){ NS.lastSub=sj; Game.subtitle=s.sub?Object.assign({t:0},s.sub):null; }
    if(s.dlg){ const d=Game.dlg; if(!d||d.text!==s.dlg.text||d.type!==s.dlg.type) Game.dlg=Object.assign({shown:0,t:0},s.dlg); else d.sel=s.dlg.sel; } else Game.dlg=null;
    TW.sentence=s.sen||null; TW.hg=s.hg||null; TW.spot=s.spot||null; TW.dark=s.dark||null; TW.mash=s.mash?Object.assign(TW.mash||{n:0},s.mash):null; }
  nsApplyEvents(m.ev); nsMirrorIn(m.mir); }
function nsGuestTick(dt){ if(!NS.guest||!MP.on) return; nsSmoothMirrors(dt);
  for(const T of NS.foes.values()){ if(T.tx==null||Game.zw) continue; const k=Math.min(1,dt*14); T.x=lerp(T.x,T.tx,k); T.z=lerp(T.z,T.tz,k); T.y=lerp(T.y,T.ty,k); T.aliCd=(T.aliCd||0)-dt; T.t+=dt; }
  NS.gsT-=dt; if(NS.gsT<=0){ NS.gsT=.033; const P=Player; const msg={t:'gs',x:r3(P.x),y:r3(P.y),z:r3(P.z),f:P.f,anim:P.anim,block:P.block?1:0,ev:NS.evq.splice(0)}; NS.mirT=(NS.mirT||0)-1; if(NS.mirT<=0){ NS.mirT=2; msg.mir=nsMirrorOut(); } mpSend(msg); }
  if(performance.now()-NS.lastRecv>5000&&!NS.warned){ NS.warned=1; nsOfferVideo('No updates from the host for 5 seconds.'); } }
function nsOfferVideo(why){ const d=mpPanel('<div style="font:700 22px Georgia,serif;margin-bottom:8px">Connection trouble</div><div style="color:#a8906a;margin-bottom:12px">'+why+' You can switch to video mode (more compatible, a bit more delay).</div><button id="nsVid" style="'+MP_BTN+'">Switch to video mode</button><button id="nsStay" style="'+MP_BTN2+'">Keep waiting</button>');
  d.querySelector('#nsVid').onclick=()=>nsSwitchVideo(); d.querySelector('#nsStay').onclick=()=>{ NS.warned=0; NS.lastRecv=performance.now(); mpClosePanel(); }; }
function nsSwitchVideo(){ try{ mpSend({t:'leave',switching:1}); }catch(e){} const code=MP.code||''; setTimeout(()=>{ location.href=location.pathname+'?join='+code+'&mode=video'; },250); }
// the guest's hits go to the host; the guest shows instant feedback
(function(){ const th=twHurt; twHurt=function(T,d,src){ if(!NS.guest) return th(T,d,src); if(!T||T.hp<=0||T.gone||T.down) return false;
    if(T.inv||T.hide||T.state==='cut'){ FX.spark(T.x,T.y+1.4,T.z); return false; } let dd=d; if(src==='beam'){ if(T.aliCd>0) return false; T.aliCd=.3; dd*=.32; } if(src==='melee') dd*=.8; dd=Math.round(dd*10)/10;
    mpSend({t:'hit',id:T.nid,d:dd}); T.flash=.1; FX.burst(T.x,T.y+1.4,T.z,8,T.who==='omar'?0x8a3aff:0xfff0f8,3,.22); Game.dmgNums.push({x:T.x,y:T.y+3.3*(T.scale||1),z:T.z,n:dd,t:0}); return true; };
  const uf=twUpdateFoe; twUpdateFoe=function(T,dt,play){ if(NS.guest) return; return uf(T,dt,play); };
  const ud=updateDialog; updateDialog=function(dt){ if(NS.guest){ hit.confirm=false; } return ud(dt); };
  const od=Game.onDeath; Game.onDeath=function(){ if(NS.guest){ Player.hp=Math.max(Player.hp,.01); return; } return od.call(Game); };
  const up=updatePlayer; updatePlayer=function(dt){ if(NS.guest){ hit.pause=false; if(NS.down){ for(const k of ['attack','dash','jump','block']) hit[k]=false; for(const k of ['left','right','up','down','attack','block']) held[k]=false; Player.anim='hurt';
        if(NS.P) Cam.focus={x:NS.P.x,y:0,z:NS.P.z}; } else if(Cam.focus&&!Game.arena) Cam.focus=null; else if(!NS.down&&Cam.focus) Cam.focus=null; } return up(dt); };
  const op=twOnPress; twOnPress=function(a){ op(a); if(NS.guest&&a==='attack') mpSend({t:'p',a:'attack'}); };
  const eo=twEscOk; twEscOk=function(){ if(MP.role==='guest') return false; return eo(); }; })();
// the host's Shayan on the guest's screen
(function(){ const ds=drawSprites; drawSprites=function(){ ds(); if(!NS.guest||!NS.P) return; try{ if(!NS.shSpr||SPRITES.indexOf(NS.shSpr)<0) NS.shSpr=new Sprite3D(64,64); const S=NS.P, Q=NS.shP||(NS.shP={x:S.x,y:S.y,z:S.z,t:0});
    const k=.35; Q.x=lerp(Q.x,S.x,k); Q.y=lerp(Q.y,S.y,k); Q.z=lerp(Q.z,S.z,k); Q.t+=1/60; NS.shSpr.show(!S.hid);
    const anim=S.down?'dead':S.anim; NS.shSpr.draw((c,cx,by)=>drawShayanHD(c,cx,by,S.f,{t:Q.t,anim,ap:S.ap,combo:S.combo})); NS.shSpr.place(Q.x,Q.y,Q.z,Math.min(Q.y,groundY(Q.x,Q.z))); }catch(e){} }; })();
(function(){ const uw=updateWorld; updateWorld=function(dt){ uw(dt); try{ nsHostTick(dt); nsGuestTick(dt); }catch(e){ console.error('nsync',e); } }; })();
function nsGuestMsg(m){ if(m.t==='init'){ nsGuestInit(m); return true; } if(m.t==='sn'){ if(NS.guest) nsGuestSnap(m); return true; }
  if(m.t==='hurt'){ NS.applying++; try{ const P=Player; P.hurt=.25; Sound.sfx('hurt'); shake(.3); FX.flash=.3; grade.uniforms.flashCol.value.set(.9,.1,.15); FX.burst(P.x,P.y+1,P.z,10,0xff5060,4,.22); Game.dmgNums.push({x:P.x,y:P.y+2.4,z:P.z,n:m.n,t:0,col:'#ff9a9a'}); P.hp=m.hp; }finally{ NS.applying--; } return true; }
  if(m.t==='parry'){ NS.applying++; try{ const P=Player; Sound.sfx('parry'); FX.spark(P.x,P.y+1.2,P.z); P.counter=Math.min(5,(P.counter||0)+1); P.noBlink=Game.time+.4; Game.dmgNums.push({x:P.x,y:P.y+2.4,z:P.z,n:'PARRY '+P.counter+'/5',t:0,big:true,col:'#ff8a9a'}); }finally{ NS.applying--; } return true; }
  if(m.t==='tp'){ Player.x=m.x; Player.z=m.z; Player.vx=Player.vz=0; if(m.hp) Player.hp=m.hp; return true; }
  if(m.t==='end'){ NS.on=false; nsClearMirrors(); mpGuestScreen('The twins are defeated! Thanks for playing.','Play your own game',()=>location.href=location.pathname); return true; }
  return false; }

// a restart moves Ali back to his spot on the guest's screen
(function(){ const dr=twDuoRestart; twDuoRestart=function(F,C,O){ dr(F,C,O); if(MP.sync&&NS.host){ const A=TW.allies.find(a=>a.who==='ali'); if(A) mpSend({t:'tp',x:A.x,z:A.z,hp:A.maxHp}); } }; })();
// leaving the duo fight any other way closes the co-op room
(function(){ const end=()=>{ if(MP.role==='host'&&(MP.peer||MP.conn)){ try{ mpSend({t:'end'}); }catch(e){} nsHostStop(); nsClearMirrors(); mpShutdown(); } };
  const wr=twWarpReset; twWarpReset=function(a){ end(); return wr(a); };
  const tt=toTitle; toTitle=function(){ end(); return tt.apply(this,arguments); };
  const ng=newGame; newGame=function(){ end(); return ng.apply(this,arguments); }; })();

// Ali's Q (Judgement Cut End) for the friend: runs in their browser, freezes the twins on both screens
(function(){ const au=aliUltimate; aliUltimate=function*(){ if(!NS.guest){ yield* au(); return; } mpSend({t:'ult',on:1}); try{ yield* au(); } finally{ mpSend({t:'ult',on:0}); } };
  const uf=twUpdateFoe; twUpdateFoe=function(T,dt,play){ if(NS.host&&NS.hostUlt&&performance.now()-NS.hostUlt<8000){ T.flash=Math.max(0,T.flash-dt); return; } return uf(T,dt,play); }; })();
