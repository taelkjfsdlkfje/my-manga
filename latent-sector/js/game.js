"use strict";
/* ============ game: players, judgement, mission, cutscenes, sync, HUD, loop ============ */
const S={t:0,rt:0,started:false,inGame:false,paused:false,ended:false,cut:null,events:[],stress:40,witness:0,traceCD:0,traceT:0,lastHurt:-99,aiHold:0,phase:0,contagion:0,subUntil:0,amaneScanned:false};
const AUTH=()=>NET.role!=='guest';
const myIdx=()=>NET.role==='guest'?1:0;
const P={pos:new V3(0,0,30),vel:new V3(),yaw:0,pitch:.04,hp:100,cc:32,bob:0,stepT:0,name:'INSPECTOR'};
const STATS={subdued:0,eliminated:0,decon:0,referred:0,damage:0,witnesses:0};
const SC={holding:false,cand:null,prog:0,lock:null,lostT:0,mode:'locked',fireCD:0,charging:null,needRelease:false,tickT:0};
const LOOK={sx:0,sy:0},KEYS={};
const PARTNER={active:false,inGame:false,name:'',pos:new V3(0,0,30),tx:0,tz:30,tyaw:0,yaw:0,pitch:0,hp:100,cc:32,mode:'locked',stats:null,cut:false,av:null};
let GUN=null,LOCKFX=null,lockMat=null,flash=null;
const _v=new V3(),_v2=new V3();
const later=(d,fn)=>S.events.push({t:S.t+d,fn});

/* ---------- HUD helpers ---------- */
const H={hud:$('#hud'),retic:$('#reticle'),retProg:$('#retProg'),subs:$('#subs'),cutSubs:$('#cutSubs'),objList:$('#objList'),markers:$('#markers'),tags:$('#tags'),locktag:$('#locktag'),
  sb:{box:$('#scanbox'),name:$('#sbName'),id:$('#sbId'),cc:$('#sbCC'),sw:$('#sbSwatch'),hue:$('#sbHue'),ver:$('#sbVerdict')}};
function setModeCss(m){document.documentElement.style.setProperty('--mode',MODES[m].css);$('#modeJP').textContent=MODES[m].jp;$('#modeName').textContent=MODES[m].name;}
let modeFlashT=0;
function modeSub(text,flash){$('#modeSub').textContent=text;if(flash){$('#modePanel').classList.add('flash');modeFlashT=1.2;}}
subHook=(who,text,dur,cls)=>{const el=S.cut?H.cutSubs:H.subs;(el===H.subs?H.cutSubs:H.subs).innerHTML='';el.innerHTML=`<div class="who ${cls||''}">${who}</div><div class="txt">${text}</div>`;el.style.opacity=1;S.subUntil=S.rt+dur;};
function sysText(text,dur=3.6){subHook('ARBITER',text,dur,'sys');}
let toastT=0;
function toast(t,s,cls='',dur=3.2){const el=$('#toast');el.className=cls;$('#toastT').textContent=t;$('#toastS').textContent=s;el.style.opacity=1;toastT=dur;}
function setMode(m){
  if(m===SC.mode)return;SC.mode=m;setModeCss(m);SFX.morph(m);
  const mp=new V3();GUN.muzzle.getWorldPosition(mp);burst(mp,22,[MODES[m].c,0xffffff],1.2,0,.4,0);
  lockMat.color.set(MODES[m].c);
  modeSub(m==='locked'?(SC.lock?'Trigger locked':'Scan a citizen to judge'):m==='paralyzer'?'Fire · stun the target':m==='lethal'?'Fire · charge and eliminate':'Fire · erase the object');
  drawGunDisplay(GUN,m,SC.lock&&SC.lock.kind==='human'?SC.lock.cc:null);
}

/* ---------- objectives (host owns, everyone renders) ---------- */
let OBJ=[];
function addObj(o){OBJ.push(Object.assign({state:'active',opt:false,label:'',mk:''},o));syncObj();}
function setObj(id,patch){const o=OBJ.find(x=>x.id===id);if(!o)return;Object.assign(o,patch);o.fresh=true;syncObj();}
function syncObj(){emitEv({k:'obj',list:OBJ.map(o=>({id:o.id,text:o.text,state:o.state,opt:o.opt,label:o.label,mk:o.mk,pos:o.pos||null,ent:o.ent||null,group:o.group||null}))});}
let objFresh=new Set();
function renderObj(list){
  const prev=new Map(OBJ_VIEW.map(o=>[o.id,o.text+o.state]));
  OBJ_VIEW=list;
  H.objList.innerHTML=list.map(o=>{const fresh=prev.get(o.id)!==o.text+o.state;return `<li class="${o.state==='done'?'done':o.state==='unres'?'unres':''} ${o.opt&&o.state==='active'?'opt':''} ${fresh?'fresh':''}">${o.text}</li>`;}).join('');
}
let OBJ_VIEW=[];
function objMarkerPos(o){
  if(o.ent){const e=ENT.get(o.ent);if(e&&alive(e))return chestOf(e).setY(e.kind==='drone'?e.g.position.y+1:e.kind==='mech'?4.6:2);return null;}
  if(o.group){let best=null,bd=1e9;for(const e of NPCS){if(e.group!==o.group||!alive(e))continue;const d=e.g.position.distanceTo(P.pos);if(d<bd){bd=d;best=e;}}return best?chestOf(best).setY(best.kind==='drone'?best.g.position.y+1:best.kind==='mech'?4.6:2):null;}
  if(o.pos)return new V3(o.pos[0],o.pos[1],o.pos[2]);return null;
}

/* ---------- events: host emits, every client applies ---------- */
function emitEv(ev){applyEv(ev);if(NET.role==='host')netSend({t:'ev',ev});}
function applyEv(ev){
  switch(ev.k){
    case 'obj':renderObj(ev.list);break;
    case 'vo':voRadio(ev.id);break;
    case 'gunall':voGun(ev.id);break;
    case 'toast':toast(ev.t,ev.s,ev.cls||'',ev.dur||3.2);if(ev.alert)SFX.alert();break;
    case 'text':sysText(ev.text,ev.dur||3.6);break;
    case 'cut':playCut(ev.id,ev.arg);break;
    case 'fx':applyFx(ev);break;
    case 'credit':if(ev.to===myIdx()){STATS[ev.what]=(STATS[ev.what]||0)+1;if(ev.vo)voGun(ev.vo);if(ev.strain){P.cc+=ev.strain;STATS.witnesses+=ev.w||0;}if(ev.what==='referred'){P.cc=Math.max(0,P.cc-3);}}break;
    case 'hurt':if(ev.to===myIdx())hurt(ev.amt);break;
    case 'end':showEnd();break;
    case 'carpark':PATROL.g.position.y=0;break;
    case 'meta':{const e=ENT.get(ev.id);if(e){Object.assign(e,ev.patch);Object.assign(e.spec,ev.patch);}break;}
  }
}

/* ---------- judgement ---------- */
function evaluate(e){
  if(e.kind==='drone')return (e.flags&F_HACKED)?{mode:'decon',vo:'arb_decon',verdict:'Hostile object. Threat to public order.'}:{mode:'locked',vo:'arb_drone_ok',verdict:'Public security unit. Status nominal.'};
  if(e.kind==='mech')return {mode:'decon',vo:'arb_mech',verdict:`Heavy armored unit. Armor ${Math.max(0,e.hp)}/3.`};
  if(e.role==='amane')return {mode:'locked',vo:'arb_zero',verdict:'Coefficient zero. Not an enforcement target.'};
  const cc=Math.round(e.cc);
  if(cc>=300)return {mode:'lethal',vo:'arb_lethal',verdict:'Lethal enforcement authorized. Aim and eliminate.'};
  if(cc>=100)return {mode:'paralyzer',vo:'arb_para',verdict:'Enforcement target. Non-lethal subdual authorized.'};
  if(cc>=70&&!(e.flags&F_REFERRED))return {mode:'locked',vo:'arb_cloud',verdict:'Hue clouding. Mental care recommended.'};
  return {mode:'locked',vo:'arb_clear',verdict:'Not an enforcement target.'};
}

/* ---------- FX ---------- */
const FX=[];
const boltGeo=new T.CylinderGeometry(.035,.035,1.6,6).rotateX(Math.PI/2);
function spawnBolt(from,target){
  const m=new T.Mesh(boltGeo,new T.MeshBasicMaterial({color:0x39f0ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));m.position.copy(from);scene.add(m);
  FX.push({type:'bolt',m,from:from.clone(),target,t:0,dur:Math.max(.05,from.distanceTo(chestOf(target))/110)});
}
function spawnBeam(from,to,color,w,life){
  const len=from.distanceTo(to);const m=new T.Mesh(new T.CylinderGeometry(w,w,len,10,1,true).rotateX(Math.PI/2),new T.MeshBasicMaterial({color,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
  m.position.copy(from).lerp(to,.5);m.lookAt(to);scene.add(m);FX.push({type:'beam',m,t:0,dur:life});
}
function spawnSphere(pos,color,r,life){const m=new T.Mesh(new T.SphereGeometry(1,24,16),holoMat(color,1.4));m.position.copy(pos);m.scale.setScalar(.01);scene.add(m);FX.push({type:'sphere',m,t:0,dur:life,r});}
function spawnPulse(pos,color,r,life){const m=new T.Mesh(new T.RingGeometry(.96,1,96),new T.MeshBasicMaterial({color,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(pos.x,.2,pos.z);m.scale.setScalar(.1);scene.add(m);FX.push({type:'pulse',m,t:0,dur:life,r});}
function doFlash(pos,color,i){flash.position.copy(pos);flash.color.set(color);flash.intensity=i;}
function shotFx(kind,from,e){
  const to=chestOf(e);
  if(kind==='paralyzer'){SFX.para();spawnBolt(from,e);doFlash(from,0x39f0ff,4);}
  else if(kind==='lethal'){SFX.boom();spawnBeam(from,to,0xff2d55,.05,.35);spawnBeam(from,to,0xffd0d8,.015,.25);doFlash(to,0xff3050,9);}
  else{SFX.decon();spawnBeam(from,to,0xb18cff,.09,.5);spawnSphere(to,0xb18cff,e.kind==='mech'?4.5:3.2,.9);doFlash(to,0xb18cff,10);}
}
function applyFx(ev){
  if(ev.by===myIdx())return; // the shooter already drew it
  const e=ENT.get(ev.id);if(!e)return;const from=new V3(ev.from[0],ev.from[1],ev.from[2]);
  if(ev.f==='care'){burst(chestOf(e),36,[0x2bff9a,0xd6fff0],1.5,2,1.2,-.2);SFX.care();return;}
  if(ev.f==='hit'){burst(chestOf(e),60,[0xb18cff,0xffffff,0xffd060],5,1,.8,.4);SFX.thud();return;}
  shotFx(ev.f,from,e);
}
function updFX(dt){
  for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t+=dt;const k=f.t/f.dur;
    if(f.type==='bolt'){const to=chestOf(f.target);f.m.position.copy(f.from).lerp(to,Math.min(k,1));f.m.lookAt(to);emit(f.m.position.x,f.m.position.y,f.m.position.z,MR(-.5,.5),MR(-.5,.5),MR(-.5,.5),0x39f0ff,.25,0);if(k>=1){scene.remove(f.m);FX.splice(i,1);}continue;}
    if(f.type==='beam'){f.m.material.opacity=1-k;f.m.scale.x=f.m.scale.y=1-k*.8;if(k>=1){scene.remove(f.m);f.m.geometry.dispose();FX.splice(i,1);}continue;}
    if(f.type==='sphere'){f.m.scale.setScalar(.1+f.r*Math.sin(Math.min(k,1)*Math.PI*.6)/Math.sin(Math.PI*.6));f.m.material.uniforms.uOpacity.value=1.6*(1-k);if(k>=1){scene.remove(f.m);FX.splice(i,1);}continue;}
    if(f.type==='pulse'){f.m.scale.setScalar(.1+f.r*k);f.m.material.opacity=(1-k)*.9;if(k>=1){scene.remove(f.m);FX.splice(i,1);}continue;}
  }
  flash.intensity*=Math.exp(-7*dt);
}

/* ---------- orbs (machine fire): host simulates, guest mirrors ---------- */
const ORBS=[];const orbGeo=new T.SphereGeometry(.16,10,8);const orbMat=new T.MeshBasicMaterial({color:0xff2d55,toneMapped:false});
const ORB_POOL=[];
function fireOrb(from,target,speed){const v=target.clone().sub(from).normalize().multiplyScalar(speed);const m=new T.Mesh(orbGeo,orbMat);m.position.copy(from);scene.add(m);ORBS.push({m,v,t:0});}
function updOrbsHost(dt){
  for(let i=ORBS.length-1;i>=0;i--){const o=ORBS[i];o.t+=dt;o.m.position.addScaledVector(o.v,dt);emit(o.m.position.x,o.m.position.y,o.m.position.z,0,0,0,0xff2d55,.3,0);
    let hit=false;for(const pl of players()){_v.set(pl.pos.x,1.6,pl.pos.z);if(o.m.position.distanceTo(_v)<.75){damagePlayer(pl.idx,o.dmg||10);hit=true;break;}}
    if(hit||o.t>4||o.m.position.y<.1){scene.remove(o.m);ORBS.splice(i,1);}}
}
function syncOrbsGuest(arr){
  const n=arr.length/3;while(ORB_POOL.length<n){const m=new T.Mesh(orbGeo,orbMat);scene.add(m);ORB_POOL.push(m);}
  ORB_POOL.forEach((m,i)=>{if(i<n){m.visible=true;m.position.set(arr[i*3],arr[i*3+1],arr[i*3+2]);if(Math.random()<.5)emit(m.position.x,m.position.y,m.position.z,0,0,0,0xff2d55,.3,0);}else m.visible=false;});
}

/* ---------- players ---------- */
function players(){const a=[{idx:0,pos:P.pos}];if(PARTNER.active&&PARTNER.inGame)a.push({idx:1,pos:PARTNER.pos});return a;}
function nearestPlayer(p){let best=null,bd=1e9;for(const pl of players()){const d=Math.hypot(pl.pos.x-p.x,pl.pos.z-p.z);if(d<bd){bd=d;best=pl;}}return {pl:best,d:bd};}
function damagePlayer(idx,amt){if(S.t<S.aiHold)return;if(idx===0)hurt(amt);else netSend({t:'ev',ev:{k:'hurt',to:1,amt}});}
function hurt(amt){
  if(S.ended||S.cut)return;P.hp-=amt;S.lastHurt=S.t;STATS.damage+=amt;P.cc+=amt*.12;SFX.hurt();$('#dmg').style.opacity=.9;
  if(P.hp<=0){P.hp=60;P.cc+=12;voGun('arb_patch');toast('INTEGRITY CRITICAL','Med-patch applied · hue strained','',2.6);}
}

/* ---------- scanning & firing (local to each player) ---------- */
function hasLOS(e){return !segBlocked(camera.position.x,camera.position.z,e.g.position.x,e.g.position.z);}
const _fwd=new V3();
function aimInfo(e){const c=chestOf(e,_v2);_v.copy(c).sub(camera.position);const d=_v.length();_fwd.set(0,0,-1).applyQuaternion(camera.quaternion);return {d,ang:Math.acos(clamp(_v.normalize().dot(_fwd),-1,1))};}
function findAimed(){let best=null,bs=1;for(const e of NPCS){if(!alive(e)||!e.g.visible)continue;const {d,ang}=aimInfo(e);if(d>60)continue;const allow=.07+Math.atan((e.kind==='mech'?1.6:.5)/d);const s=ang/allow;if(s<bs&&hasLOS(e)){bs=s;best=e;}}return best;}
function onTarget(e){const {d,ang}=aimInfo(e);return d<75&&ang<.075+Math.atan((e.kind==='mech'?1.8:.6)/d)&&hasLOS(e);}
function completeScan(e){
  e.scanned=true;SC.lock=e;SC.lostT=0;const ev=evaluate(e);SFX.scanned();showScanbox(e,ev);
  if(ev.mode===SC.mode){modeSub(ev.mode==='locked'?'Trigger locked':MODES[ev.mode].name+' ready');}
  setMode(ev.mode);drawGunDisplay(GUN,SC.mode,e.kind==='human'?e.cc:null);
  voGun(ev.vo);LOCKFX.visible=true;
  if(AUTH())hostOnScan(e,myIdx());else netSend({t:'scan',id:e.id});
  if(e.kind==='human'&&!e.role&&!(e.flags&F_REFERRED)&&e.cc>=70&&e.cc<100)modeSub(IS_TOUCH?'Get close · CARE to refer':'Get close · [E] refer to care');
}
function clearLock(msg){if(!SC.lock)return;SC.lock=null;LOCKFX.visible=false;setMode('locked');modeSub(msg||'Scan a citizen to judge',!!msg);drawGunDisplay(GUN,'locked',null);}
function muzzlePos(){const mp=new V3();GUN.muzzle.getWorldPosition(mp);return mp;}
function fire(){
  if(!S.inGame||S.paused&&NET.role==='solo'||S.ended&&!S.free||S.cut)return;if(SC.fireCD>0||SC.charging)return;
  const L=SC.lock;
  if(!L){SFX.buzz();modeSub('No scan data · hold scan first',true);return;}
  if(SC.mode==='locked'){SFX.buzz();modeSub('Trigger locked',true);if(!SC.lockedSaid){SC.lockedSaid=true;voGun('arb_locked');setTimeout(()=>SC.lockedSaid=false,2500);}return;}
  if(!onTarget(L)){SFX.buzz();modeSub('Aim at the locked target',true);return;}
  if(SC.mode==='paralyzer'){const mp=muzzlePos();GUN.kick=1;SC.fireCD=.55;shotFx('paralyzer',mp,L);requestEnforce(L,'paralyzer',mp);}
  else{const dur=SC.mode==='lethal'?.5:.85;SC.charging={mode:SC.mode,t:0,dur,target:L};SFX.charge(dur);}
}
function releaseCharge(){
  const c=SC.charging;SC.charging=null;SC.fireCD=.8;const L=c.target;GUN.kick=1.6;
  if(!alive(L)||!hasLOS(L)){SFX.buzz();modeSub('Target lost',true);return;}
  const mp=muzzlePos();shotFx(c.mode,mp,L);requestEnforce(L,c.mode,mp);
}
function requestEnforce(e,mode,from){
  const f=[r2(from.x),r2(from.y),r2(from.z)];
  if(AUTH())hostEnforce(e.id,mode,myIdx(),f);else netSend({t:'fire',id:e.id,mode,from:f});
}
function refer(){
  const e=SC.lock;if(!e||e.kind!=='human'||e.role||(e.flags&F_REFERRED)||e.cc<70||e.cc>=100)return;
  if(e.g.position.distanceTo(P.pos)>5.5)return;
  SFX.care();burst(chestOf(e),36,[0x2bff9a,0xd6fff0],1.5,2,1.2,-.2);
  if(AUTH())hostRefer(e.id,myIdx());else netSend({t:'refer',id:e.id});
  clearLock();
}
function trace(){if(!S.inGame||S.cut||S.traceCD>0)return;S.traceCD=9;S.traceT=6;SFX.trace();spawnPulse(P.pos,0x39f0ff,75,1.4);}

/* ---------- HOST: authority over people, machines, and the mission ---------- */
const kOf=(sx,sz)=>sz<0?(sx<0?0:1):(sx>0?2:3);
const SX=[-1,1,1,-1],SZ=[-1,-1,1,1];
const corner=(bx,bz,k)=>[bx*40+SX[k]*13,bz*40+SZ[k]*13];
function spawn(spec){
  spec.id=nextEntId++;if(spec.seed==null)spec.seed=Math.floor(Math.random()*1e9);
  if(!spec.name){spec.name=spec.kind==='human'?`${mpick(FIRST)} ${mpick(LAST)}`:spec.name;}
  if(!spec.pid)spec.pid=spec.kind==='human'?'K7-'+Math.floor(MR(1000,9999))+'-'+String.fromCharCode(65+Math.floor(Math.random()*26))+Math.floor(MR(10,99)):'PSB-'+spec.name.split(' ').pop();
  const e=createEntity(spec);
  if(NET.role==='host'&&NET.tr&&PARTNER.active)netSend({t:'spawn',spec:liveSpec(e)});
  return e;
}
function liveSpec(e){return Object.assign({},e.spec,{x:r2(e.g.position.x),y:r2(e.g.position.y),z:r2(e.g.position.z),yaw:r2(e.g.rotation.y),state:e.state,cc:Math.round(e.cc),flags:e.flags,hp:e.hp});}
function spawnWalker(o={}){
  const bx=o.bx??Math.floor(MR(-1,2)),bz=o.bz??Math.floor(MR(-1,2)),k=Math.floor(Math.random()*4),dir=Math.random()<.5?1:-1;
  const [ax,az]=corner(bx,bz,(k-dir+4)%4),[cx,cz]=corner(bx,bz,k),t=Math.random();
  const e=spawn(Object.assign({kind:'human',preset:'civ',state:'walk',x:lerp(ax,cx,t),z:lerp(az,cz,t)},o));
  e.nav={bx,bz,k,dir};e.nx=cx;e.nz=cz;e.speed=o.speed||MR(1.05,1.55);return e;
}
function civCC(){const r=Math.random();if(r<.7)return MR(8,55);if(r<.86)return MR(55,69);return MR(72,96);}
let A=null;
function spawnPopulation(){
  removeAllEntities();nextEntId=1;
  for(let i=0;i<38;i++)spawnWalker({cc:civCC()});
  [[-4,4.5],[3.5,5],[-5.5,-2],[5,-1.5],[1,-5.2],[-2,6.4]].forEach(([x,z])=>spawn({kind:'human',preset:'civ',state:'idle',cc:civCC(),x,z,yaw:Math.atan2(-x,-z)}));
  spawn({kind:'human',preset:'stall',state:'idle',cc:58,x:9.3,z:-7.6,yaw:Math.PI,name:'Mio Ishida',role:'stall',group:null});
  spawn({kind:'human',preset:'stall',state:'idle',cc:63,x:10.4,z:-7.7,yaw:Math.PI,name:'Taro Okabe',role:'stall'});
  A=spawn({kind:'human',preset:'mibu',state:'idle',cc:146,x:6.6,z:-7.3,yaw:2.4,name:'Haruto Mibu',role:'A',flags:F_AGITATED});A.fleeSpeed=6.3;
  const d=spawn({kind:'drone',name:'SD-14',role:'sd14',state:'patrol',x:9,y:7,z:0,group:null});d.a=0;d.fireT=2;
}
function nextCorner(e,flee){
  const {bx,bz,k}=e.nav;const opts=[{bx,bz,k:(k+1)%4,dir:1},{bx,bz,k:(k+3)%4,dir:-1}];const sx=SX[k],sz=SZ[k];
  if(Math.abs(bx+sx)<=1)opts.push({bx:bx+sx,bz,k:kOf(-sx,sz),dir:e.nav.dir});
  if(Math.abs(bz+sz)<=1)opts.push({bx,bz:bz+sz,k:kOf(sx,-sz),dir:e.nav.dir});
  let ch;
  if(flee){let best=-1;const np=nearestPlayer(e.g.position).pl;for(const o of opts){const [x,z]=corner(o.bx,o.bz,o.k);const d=np?Math.hypot(x-np.pos.x,z-np.pos.z)+Math.random()*6:Math.random();if(d>best){best=d;ch=o;}}}
  else ch=Math.random()<.72?opts[e.nav.dir>0?0:1]:opts[2+Math.floor(Math.random()*(opts.length-2))]||opts[0];
  e.nav=ch;[e.nx,e.nz]=corner(ch.bx,ch.bz,ch.k);
}
function startFlee(e){const sx=Math.sign(e.g.position.x)||1,sz=Math.sign(e.g.position.z)||1;e.nav={bx:Math.round(e.g.position.x/40),bz:Math.round(e.g.position.z/40),k:kOf(sx,sz),dir:1};[e.nx,e.nz]=corner(e.nav.bx,e.nav.bz,e.nav.k);setEntState(e,'flee');e.flags&=~F_AGITATED;e.faceYaw=null;}
function turnTo(e,yaw,dt,rate=8){let d=yaw-e.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));e.g.rotation.y+=d*(1-Math.exp(-rate*dt));}
function moveToward(e,tx,tz,sp,dt){const dx=tx-e.g.position.x,dz=tz-e.g.position.z,d=Math.hypot(dx,dz);if(d<.01)return d;const st=Math.min(d,sp*dt);e.g.position.x+=dx/d*st;e.g.position.z+=dz/d*st;turnTo(e,Math.atan2(dx,dz),dt);return d;}
const OPEN_PTS=[];for(let x=-11;x<=11;x+=5.5)for(let z=-11;z<=11;z+=5.5)if(Math.hypot(x,z)>4&&!(x>5&&z<-6))OPEN_PTS.push([x,z]);
[[20,-12],[20,0],[20,12],[-20,-12],[-20,0],[-20,12],[-12,20],[0,20],[12,20],[-12,-20],[0,-20],[12,-20]].forEach(p=>OPEN_PTS.push(p));
function runnerTarget(e){
  const np=nearestPlayer(e.g.position);let best=null,bs=-1e9;
  for(let i=0;i<6;i++){const p=OPEN_PTS[Math.floor(Math.random()*OPEN_PTS.length)];const s=(np.pl&&np.d<10?Math.hypot(p[0]-np.pl.pos.x,p[1]-np.pl.pos.z):0)+Math.random()*8-Math.hypot(p[0]-e.g.position.x,p[1]-e.g.position.z)*.15;if(s>bs){bs=s;best=p;}}
  [e.nx,e.nz]=best;
}
function aiHuman(e,dt){
  if(e.atkFlagT>0){e.atkFlagT-=dt;if(e.atkFlagT<=0)e.flags&=~F_ATTACK;}
  switch(e.state){
    case 'walk':{const d=moveToward(e,e.nx,e.nz,e.speed*(e.flags&F_LATENT?1.25:1),dt);if(d<.3)nextCorner(e,false);break;}
    case 'flee':{const d=moveToward(e,e.nx,e.nz,e.fleeSpeed||5.4,dt);if(d<.4)nextCorner(e,true);break;}
    case 'pause':e.pauseT-=dt;if(e.pauseT<=0)setEntState(e,e.nav?'walk':'idle');break;
    case 'idle':{
      if(e.role==='amane'&&e.faceYaw==null){const np=nearestPlayer(e.g.position);if(np.pl&&np.d<30)turnTo(e,Math.atan2(np.pl.pos.x-e.g.position.x,np.pl.pos.z-e.g.position.z),dt,3);}
      if(e.faceYaw!=null)turnTo(e,e.faceYaw,dt,6);else if(e.role==='A')turnTo(e,Math.sin(S.t*.9)*1.2+2.4,dt,2);
      if(e.ambush){const np=nearestPlayer(e.g.position);if(np.pl&&np.d<e.ambush&&!segBlocked(e.g.position.x,e.g.position.z,np.pl.pos.x,np.pl.pos.z))groupAggro(e.group);}
      break;}
    case 'runner':{
      const np=nearestPlayer(e.g.position);
      if(e.nx==null||Math.hypot(e.nx-e.g.position.x,e.nz-e.g.position.z)<.5||(np.pl&&np.d<6&&Math.random()<dt*2))runnerTarget(e);
      moveToward(e,e.nx,e.nz,np.pl&&np.d<9?4.6:2.6,dt);resolveCircle(e.g.position,.35);break;}
    case 'aggro':{
      const np=nearestPlayer(e.g.position);if(!np.pl)break;e.atkT=(e.atkT||0)-dt;
      const dx=np.pl.pos.x-e.g.position.x,dz=np.pl.pos.z-e.g.position.z,d=Math.hypot(dx,dz);
      if(d>1.5){const sp=e.aggroSpeed||6.2;e.g.position.x+=dx/d*sp*dt;e.g.position.z+=dz/d*sp*dt;resolveCircle(e.g.position,.4);}
      turnTo(e,Math.atan2(dx,dz),dt,10);
      if(d<1.6&&e.atkT<=0&&S.t>S.aiHold){e.atkT=1.15;e.flags|=F_ATTACK;e.atkFlagT=.28;const target=np.pl.idx,dmg=e.dmg||14;later(.18,()=>{if(alive(e)){const pl=players().find(p=>p.idx===target);if(pl&&Math.hypot(pl.pos.x-e.g.position.x,pl.pos.z-e.g.position.z)<2.2)damagePlayer(target,dmg);}});}
      break;}
    case 'leave':{e.leaveT=(e.leaveT||0)+dt;moveToward(e,-53,-30,1.3,dt);if(e.leaveT>4.5)e.sc=Math.max(0,1-(e.leaveT-4.5)/1.6);if(e.sc<=0)setEntState(e,'gone');break;}
    case 'dying':e.dieT2=(e.dieT2||0)+dt;if(e.dieT2>.16){setEntState(e,'gone');onNeutralized(e,'eliminated');}break;
  }
}
function aiDrone(e,dt){
  if(e.state==='dying'){e.dieT2=(e.dieT2||0)+dt;if(e.dieT2>.6){setEntState(e,'gone');onNeutralized(e,'deconstructed');}return;}
  if(e.state==='patrol'){e.a=(e.a||0)+dt*.25;e.g.position.set(Math.cos(e.a)*10,7+Math.sin(S.t*1.3)*.3,Math.sin(e.a)*10);e.g.rotation.y=-e.a;return;}
  if(e.state==='idle'){e.g.position.y=e.ty0||e.g.position.y;return;}
  if(e.state!=='hunt')return;
  const np=nearestPlayer(e.g.position);if(!np.pl)return;
  const to=_v.set(np.pl.pos.x-e.g.position.x,0,np.pl.pos.z-e.g.position.z);const d=to.length();to.normalize();
  const want=d>13?1:d<9?-1:0;e.g.position.x+=to.x*want*5*dt+Math.cos(S.t*.9+e.id)*dt*2;e.g.position.z+=to.z*want*5*dt+Math.sin(S.t*.7+e.id)*dt*2;
  e.g.position.y=lerp(e.g.position.y,6+Math.sin(S.t*2+e.id)*.6,1-Math.exp(-1.5*dt));resolveCircle(e.g.position,.8);
  e.g.rotation.y=Math.atan2(np.pl.pos.x-e.g.position.x,np.pl.pos.z-e.g.position.z);
  e.fireT=(e.fireT??2)-dt;
  if(e.fireT<=0&&d<40&&S.t>S.aiHold&&!segBlocked(e.g.position.x,e.g.position.z,np.pl.pos.x,np.pl.pos.z)){e.fireT=MR(1.7,2.4);if(camera.position.distanceTo(e.g.position)<40)SFX.pew();
    fireOrb(e.g.position.clone(),new V3(np.pl.pos.x,1.5,np.pl.pos.z),17);ORBS[ORBS.length-1].dmg=10;}
}
function aiMech(e,dt){
  if(e.atkFlagT>0){e.atkFlagT-=dt;if(e.atkFlagT<=0)e.flags&=~F_ATTACK;}
  if(e.state==='dying'){e.dieT2=(e.dieT2||0)+dt;if(e.dieT2>1){setEntState(e,'gone');onNeutralized(e,'deconstructed');}return;}
  if(e.state!=='hunt')return;
  const np=nearestPlayer(e.g.position);if(!np.pl)return;
  const dx=np.pl.pos.x-e.g.position.x,dz=np.pl.pos.z-e.g.position.z,d=Math.hypot(dx,dz);
  if(e.stagger>0)e.stagger-=dt;else if(d>9){e.g.position.x+=dx/d*1.8*dt;e.g.position.z+=dz/d*1.8*dt;resolveCircle(e.g.position,1.3);}
  turnTo(e,Math.atan2(dx,dz),dt,2.2);
  e.fireT=(e.fireT??3)-dt;
  if(e.fireT<=0&&d<45&&S.t>S.aiHold&&!segBlocked(e.g.position.x,e.g.position.z,np.pl.pos.x,np.pl.pos.z)){e.fireT=3.2;e.flags|=F_ATTACK;e.atkFlagT=.9;
    for(let i=0;i<3;i++)later(i*.25,()=>{if(!alive(e))return;e.cannons.forEach(c=>{const p=new V3();c.getWorldPosition(p);const np2=nearestPlayer(e.g.position);if(np2.pl){fireOrb(p,new V3(np2.pl.pos.x+MR(-.8,.8),1.5,np2.pl.pos.z+MR(-.8,.8)),15);ORBS[ORBS.length-1].dmg=9;}});if(camera.position.distanceTo(e.g.position)<45)SFX.pew();});}
}
function hostOnScan(e,by){
  if(!e)return;
  if(e.role==='A'&&e.state==='idle'&&!S.mibuCut){S.mibuCut=true;{const pl=players().find(q=>q.idx===by)||players()[0];e.faceYaw=Math.atan2(pl.pos.x-e.g.position.x,pl.pos.z-e.g.position.z);e.g.rotation.y=e.faceYaw;}cutscene('mibu',{yaw:e.faceYaw});setObj('A',{ent:e.id,pos:null,text:'Stop Haruto Mibu before he reaches the crowd'});later(CUTS.mibu.dur,()=>{if(alive(A)){startFlee(A);emitEv({k:'vo',id:'d_run'});}});}
  if(e.group&&e.ambush&&e.state==='idle')groupAggro(e.group);
  if(e.role==='stallLatent'&&e.state==='idle'){e.state='idle';setEntState(e,'runner');}
  if(e.role==='amane'&&!S.amaneScanned){S.amaneScanned=true;later(4.6,amaneFinale);}
}
function hostEnforce(id,mode,by,from){
  const e=ENT.get(id);if(!alive(e))return;const ev=evaluate(e);if(ev.mode!==mode)return;
  const fromV=new V3(from[0],from[1],from[2]);
  if(mode==='paralyzer'){
    netSendFx({k:'fx',f:'paralyzer',id,from,by});if(by!==myIdx())shotFx('paralyzer',fromV,e);
    later(fromV.distanceTo(chestOf(e))/110,()=>{if(alive(e)){e.nav=e.nav||null;setEntState(e,'down');e.flags&=~(F_AGITATED|F_ATTACK);emitEv({k:'credit',to:by,what:'subdued',vo:'arb_subdued'});onNeutralized(e,'paralyzed');}});
  }else if(mode==='lethal'){
    netSendFx({k:'fx',f:'lethal',id,from,by});if(by!==myIdx())shotFx('lethal',fromV,e);
    setEntState(e,'dying');e.dieT2=0;
    let w=0;for(const c of NPCS){if(c.kind!=='human'||c===e||!alive(c)||c.role)continue;const d=c.g.position.distanceTo(e.g.position);if(d<22&&!segBlocked(c.g.position.x,c.g.position.z,e.g.position.x,e.g.position.z)){const before=c.cc;c.cc=Math.min(c.cc+MR(7,15),180);if(before<100&&c.cc>=100)makeLatent(c);w++;}}
    S.witness+=8+w;
    emitEv({k:'credit',to:by,what:'eliminated',vo:w>0?'arb_witness':'arb_elim',strain:4+Math.min(9,w*1.5),w});
  }else{
    netSendFx({k:'fx',f:'decon',id,from,by});if(by!==myIdx())shotFx('decon',fromV,e);
    if(e.kind==='mech'){e.hp--;e.stagger=1.2;if(e.hp>0){netSendFx({k:'fx',f:'hit',id,from,by:-1});burst(chestOf(e),60,[0xb18cff,0xffffff,0xffd060],5,1,.8,.4);emitEv({k:'text',text:`Armor breached · ${3-e.hp}/3`,dur:2});return;}}
    setEntState(e,'dying');e.dieT2=0;emitEv({k:'credit',to:by,what:'decon',vo:'arb_erased'});
  }
}
function setMeta(e,patch){Object.assign(e,patch);Object.assign(e.spec,patch);if(NET.role==='host'&&NET.tr&&PARTNER.active)netSend({t:'ev',ev:{k:'meta',id:e.id,patch}});}
function netSendFx(ev){if(NET.role==='host'&&NET.tr&&PARTNER.active)netSend({t:'ev',ev});}
function hostRefer(id,by){
  const e=ENT.get(id);if(!e||!alive(e)||e.role||(e.flags&F_REFERRED)||e.cc<70||e.cc>=100)return;
  e.flags|=F_REFERRED;e.cc=MR(36,52);if(e.state==='walk'){setEntState(e,'pause');e.pauseT=3;}
  S.witness=Math.max(0,S.witness-4);S.referrals=(S.referrals||0)+1;
  setObj('care',{text:`Optional: refer clouded citizens to Hue Care (${S.referrals})`});
  emitEv({k:'credit',to:by,what:'referred',vo:'arb_refer'});
  if(by!==myIdx())netSendFx({k:'fx',f:'care',id,from:[0,0,0],by});
}
function makeLatent(c){
  if(c.flags&F_LATENT||c.role)return;if(S.contagion>=4){c.cc=Math.min(c.cc,99);return;}
  S.contagion++;c.flags|=F_LATENT;setMeta(c,{group:'latent'});
  if(!OBJ.find(o=>o.id==='L'))addObj({id:'L',text:'',opt:true,group:'latent',label:'LATENT',mk:'hot'});
  setObj('L',{text:`Secondary latents subdued (${S.latentDone||0}/${S.contagion})`});
  emitEv({k:'gunall',id:'arb_latent'});SFX.alert();
}
function groupAggro(g){for(const e of NPCS)if(e.group===g&&e.state==='idle'&&alive(e)){setEntState(e,'aggro');e.ambush=0;}
  if(g==='ne'&&!S.neAggro){S.neAggro=true;emitEv({k:'vo',id:'kuze_2'});setObj('ne',{pos:null,label:'SCANNER 7-C'});}
  if(g==='riot'&&!S.riotArmed){S.riotArmed=true;emitEv({k:'vo',id:'thug_1'});}}
function groupLeft(g){let n=0;for(const e of NPCS)if(e.group===g&&alive(e))n++;return n;}
function groupTotal(g){let n=0;for(const e of NPCS)if(e.group===g)n++;return n;}
function onNeutralized(e,how){
  if(!AUTH())return;
  if(e.role==='A'){setObj('A',{state:'done',text:`Stress source ${how} — Haruto Mibu`});emitEv({k:'vo',id:how==='paralyzed'?'d_a_down':'d_a_dead'});later(2,phaseStall);}
  if(e.flags&F_LATENT){S.latentDone=(S.latentDone||0)+1;setObj('L',{text:`Secondary latents subdued (${S.latentDone}/${S.contagion})`});}
  const g=e.group;if(!g||g==='latent')return;
  const left=groupLeft(g),tot=groupTotal(g),done=tot-left;
  const O={stall:'Subdue the infected customers at the stall',ne:'Neutralize the scanner 7-C group',drones:'Deconstruct the hijacked drones',riot:'Subdue the plaza cascade'};
  if(O[g])setObj(g,{text:`${O[g]} (${done}/${tot})`});
  if(left===0){
    S.gDone=S.gDone||{};if(S.gDone[g])return;S.gDone[g]=true;
    setObj(g,{state:'done'});
    if(g==='stall')later(3,phaseNE);
    if(g==='ne'){emitEv({k:'vo',id:'d_b_done'});later(9,phaseDrones);}
    if(g==='drones'){S.dronesDone=true;if(!S.mechSpawned)later(2,spawnMechPhase);else if(S.mechDone)later(2,dronesComplete);}
    if(g==='mech'){S.mechDone=true;setObj('mech',{state:'done',text:'Riot sentinel deconstructed'});if(S.dronesDone)later(2,dronesComplete);}
    if(g==='riot'){emitEv({k:'vo',id:'d_casc_done'});later(5,phaseAmane);}
  }else if(g==='drones'&&left<=1&&!S.mechSpawned)later(3,spawnMechPhase);
}
function cutscene(id,arg){const def=CUTS[id];S.aiHold=Math.max(S.aiHold,S.t+def.dur+.5);emitEv({k:'cut',id,arg:arg||null});}

/* mission phases */
function startMission(){
  S.started=true;S.phase=1;
  if(NET.role==='host')netSend({t:'start'});
  cutscene('intro');
  later(CUTS.intro.dur+.4,()=>{
    emitEv({k:'carpark'});S.live=true;
    addObj({id:'A',text:'Find the stress source near Okami Ramen',pos:[8,2,-8],label:'STRESS SOURCE',mk:'hot'});
    addObj({id:'care',text:'Optional: refer clouded citizens to Hue Care (0)',opt:true});
    later(4,()=>emitEv({k:'vo',id:'d_hint'}));
  });
  // a hard ceiling so the plaza never stalls: if no one finds Mibu, he bolts on his own
}
function phaseStall(){
  const st=NPCS.filter(e=>e.role==='stall'&&alive(e));
  st.forEach((e,i)=>{setMeta(e,{role:'stallLatent',group:'stall'});e.cc=[118,134][i%2];e.flags|=F_AGITATED;});
  if(st.length){addObj({id:'stall',text:`Subdue the infected customers at the stall (0/${st.length})`,group:'stall',label:'STALL',mk:'hot'});emitEv({k:'gunall',id:'arb_latent'});}
  else later(3,phaseNE);
}
function phaseNE(){
  S.phase=2;
  const K=spawn({kind:'human',preset:'kuze',state:'idle',cc:327,x:26.4,z:-28.6,name:'Daigo Kuze',role:'kuze',group:'ne'});K.dmg=18;K.aggroSpeed=6.6;K.ambush=15;
  const t1=spawn({kind:'human',preset:'thug',state:'idle',cc:188,x:28.6,z:-26.2,name:'Ren Hayase',role:'thug',group:'ne'});t1.dmg=10;t1.aggroSpeed=5.6;t1.ambush=15;
  const t2=spawn({kind:'human',preset:'thug',state:'idle',cc:341,x:24.6,z:-26.6,name:'Sho Arai',role:'thug',group:'ne'});t2.dmg=14;t2.aggroSpeed=6;t2.ambush=15;
  const v=spawn({kind:'human',preset:'victim',state:'idle',cc:44,x:27.9,z:-29.6,name:'Hina Ueda'});v.faceYaw=Math.atan2(26.4-27.9,-28.6+29.6);
  [K,t1,t2].forEach(e=>e.faceYaw=Math.atan2(v.g.position.x-e.g.position.x,v.g.position.z-e.g.position.z));
  K.g.rotation.y=K.faceYaw;
  cutscene('kuze');
  later(2.6,()=>{K.faceYaw=Math.atan2(-1,1);});
  later(CUTS.kuze.dur,()=>{K.faceYaw=null;emitEv({k:'vo',id:'d_b_start'});emitEv({k:'toast',t:'SCANNER 7-C SPIKE',s:'Readings over 300 · north-east',alert:true});
    addObj({id:'ne',text:'Neutralize the scanner 7-C group (0/3)',pos:[27,2,-27],group:null,label:'SCANNER 7-C',mk:'hot'});
    later(1,()=>setObj('ne',{group:'ne',pos:null}));
    later(4,()=>{if(alive(v)){v.faceYaw=null;v.nav={bx:0,bz:-1,k:2,dir:1};[v.nx,v.nz]=corner(0,-1,2);v.speed=2.4;setEntState(v,'walk');}});});
}
function phaseDrones(){
  S.phase=3;
  const sd14=NPCS.find(e=>e.role==='sd14');
  const d2=spawn({kind:'drone',name:'SD-22',role:'sd22',state:'idle',x:-24,y:24,z:8,group:'drones',flags:F_HACKED});d2.ty0=24;
  const d3=spawn({kind:'drone',name:'SD-31',role:'sd31',state:'idle',x:24,y:26,z:-8,group:'drones',flags:F_HACKED});d3.ty0=26;
  if(sd14&&alive(sd14))setMeta(sd14,{group:'drones'});
  if(sd14&&alive(sd14)){setEntState(sd14,'idle');sd14.ty0=sd14.g.position.y;}
  cutscene('hack');
  later(1.6,()=>{if(sd14)sd14.flags|=F_HACKED;});
  later(CUTS.hack.dur,()=>{
    for(const e of NPCS)if(e.group==='drones'&&alive(e)){e.flags|=F_HACKED;setEntState(e,'hunt');}
    emitEv({k:'vo',id:'d_c_start'});emitEv({k:'toast',t:'DRONES COMPROMISED',s:'Three units hostile',cls:'vi',alert:true});
    addObj({id:'drones',text:`Deconstruct the hijacked drones (0/${groupTotal('drones')})`,group:'drones',label:'DRONE',mk:'vi'});
    later(35,()=>{if(!S.mechSpawned)spawnMechPhase();});});
}
function spawnMechPhase(){
  if(S.mechSpawned)return;S.mechSpawned=true;
  const m=spawn({kind:'mech',name:'Riot Sentinel RS-3',role:'mech',state:'idle',x:60,z:-6,yaw:0,group:'mech',hp:3,flags:F_HACKED});
  cutscene('mech');
  later(CUTS.mech.dur,()=>{setEntState(m,'hunt');addObj({id:'mech',text:'Deconstruct the riot sentinel · armor 3',ent:m.id,label:'SENTINEL',mk:'vi'});});
}
function dronesComplete(){
  if(S.cascadeQueued)return;S.cascadeQueued=true;
  emitEv({k:'vo',id:'d_c_done'});emitEv({k:'vo',id:'hack_2'});later(16,phaseCascade);
}
function phaseCascade(){
  S.phase=4;
  const pts=[[-7,4],[6,6],[-3,-8],[9,2],[-9,-4]];
  pts.forEach((p,i)=>{const e=spawn({kind:'human',preset:'rioter',state:'idle',cc:Math.round(MR(112,232)),x:p[0],z:p[1],group:'riot',role:'rioter',flags:F_AGITATED});e.name=e.spec.name;});
  const arm=spawn({kind:'human',preset:'armed',state:'idle',cc:316,x:2,z:9,name:'Kenji Okubo',group:'riot',role:'armed',flags:F_AGITATED});arm.dmg=14;arm.aggroSpeed=6;
  cutscene('cascade');
  later(CUTS.cascade.dur,()=>{
    for(const e of NPCS)if(e.group==='riot'&&alive(e)){e.flags&=~F_AGITATED;if(e.role==='armed'){e.ambush=16;}else setEntState(e,'runner');}
    emitEv({k:'vo',id:'d_casc_lethal'});emitEv({k:'toast',t:'PLAZA CASCADE',s:'Six latent readings',alert:true});
    addObj({id:'riot',text:`Subdue the plaza cascade (0/${groupTotal('riot')})`,group:'riot',label:'CASCADE',mk:'hot'});});
}
function phaseAmane(){
  S.phase=5;
  spawn({kind:'human',preset:'victim',state:'down',cc:41,x:-56,z:-1,yaw:.4,name:'Rina Morita',role:'victim'});
  const am=spawn({kind:'human',preset:'amane',state:'idle',cc:0,x:-53.6,z:-3.6,yaw:-Math.PI/2,name:'Seiji Amane',role:'amane'});
  emitEv({k:'vo',id:'d_d_start'});emitEv({k:'toast',t:'ASSAULT REPORTED',s:'West sidewalk · Route 3',alert:true});
  addObj({id:'D',text:'Respond to the assault on the west sidewalk',pos:[-55,2,-2],label:'ASSAULT'});
  S.amaneWatch=am.id;
}
function amaneApproach(){
  if(S.amaneMet)return;S.amaneMet=true;{const am=ENT.get(S.amaneWatch);if(am){am.faceYaw=-Math.PI/2;am.g.rotation.y=-Math.PI/2;later(CUTS.amane1.dur,()=>{am.faceYaw=null;});}}cutscene('amane1');
  later(CUTS.amane1.dur,()=>{setObj('D',{text:'Judge the man in white',pos:null,ent:S.amaneWatch,label:'SUSPECT'});});
  later(CUTS.amane1.dur+28,()=>{if(!S.amaneScanned){S.amaneScanned=true;amaneFinale();}});
}
function amaneFinale(){
  if(S.finale)return;S.finale=true;const am=ENT.get(S.amaneWatch);if(am&&alive(am)){am.faceYaw=-Math.PI/2+.25;am.g.rotation.y=am.faceYaw;}
  cutscene('amane2');
  later(8,()=>{if(am){am.faceYaw=null;setEntState(am,'leave');}});
  later(14,()=>setObj('D',{state:'unres',text:'Suspect cleared by the system — Seiji Amane, coefficient 000'}));
  later(CUTS.amane2.dur+.6,()=>emitEv({k:'end'}));
}

/* per-second simulation */
function simTick(){
  if(A&&alive(A)){A.cc=Math.min(420,A.cc+(A.state==='flee'?1.6:.12));}
  if(!S.live)return;
  const sources=NPCS.filter(e=>e.kind==='human'&&alive(e)&&e.cc>=100&&e.role!=='amane');
  for(const c of NPCS){if(c.kind!=='human'||c.role||!alive(c)||(c.flags&F_LATENT))continue;
    for(const s of sources){if(c.g.position.distanceTo(s.g.position)<8){const before=c.cc;c.cc=Math.min(c.cc+.8,160);if(before<100&&c.cc>=100)makeLatent(c);break;}}}
  P.cc+=Math.max(0,S.stress-65)*.003;
}
function computeStress(){
  let s=18,lat=0,sum=0,cnt=0;
  for(const e of NPCS){if(!alive(e))continue;
    if(e.kind==='human'){if(e.role==='amane'||e.role==='victim')continue;if(e.cc>=100)s+=e.role==='A'&&e.state==='flee'?12:5;else{sum+=e.cc;cnt++;}}
    else if(e.flags&F_HACKED&&e.state!=='idle')s+=e.kind==='mech'?14:6;}
  if(cnt)s+=Math.max(0,sum/cnt-38)*.8;s+=S.witness;return clamp(s,0,100);
}
function hostSim(dt){
  for(let i=S.events.length-1;i>=0;i--){if(S.t>=S.events[i].t){const f=S.events[i].fn;S.events.splice(i,1);try{f();}catch(e){console.error(e);}}}
  for(const e of NPCS){if(e.state==='gone')continue;if(e.kind==='human')aiHuman(e,dt);else if(e.kind==='drone')aiDrone(e,dt);else aiMech(e,dt);}
  updOrbsHost(dt);
  S.simT=(S.simT||0)+dt;if(S.simT>=1){S.simT-=1;simTick();}
  S.witness=Math.max(0,S.witness-dt);
  S.stress=lerp(S.stress,computeStress(),1-Math.exp(-.6*dt));
  if(S.amaneWatch&&!S.amaneMet){const am=ENT.get(S.amaneWatch);const np=am&&nearestPlayer(am.g.position);if(np&&np.pl&&np.d<19)amaneApproach();}
  if(NET.role==='host'&&NET.tr&&PARTNER.active){S.snapT=(S.snapT||0)-dt;if(S.snapT<=0){S.snapT=1/15;sendSnapshot();}}
}

/* ---------- sync ---------- */
function sendSnapshot(){
  const e=[];for(const x of NPCS){if(x.state==='gone'&&x.sentGone)continue;if(x.state==='gone')x.sentGone=true;
    e.push([x.id,r2(x.g.position.x),r2(x.g.position.y),r2(x.g.position.z),r2(x.g.rotation.y),ST.indexOf(x.state),Math.round(x.cc),x.flags,x.hp,r2(x.sc)]);}
  const o=[];for(const b of ORBS)o.push(r2(b.m.position.x),r2(b.m.position.y),r2(b.m.position.z));
  netSend({t:'s',e,o,st:r2(S.stress),hp:selfState()});
}
function selfState(){return {x:r2(P.pos.x),z:r2(P.pos.z),yaw:r2(P.yaw),pitch:r2(P.pitch),hp:Math.round(P.hp),cc:Math.round(P.cc),mode:SC.mode,name:P.name,ig:S.inGame,cut:!!S.cut,st:STATS};}
function applySnapshot(s){
  S.stress=s.st;
  for(const a of s.e){const e=ENT.get(a[0]);if(!e)continue;e.tx=a[1];e.ty=a[2];e.tz=a[3];e.tyaw=a[4];e.cc=a[6];e.flags=a[7];e.hp=a[8];e.sc=a[9];const st=ST[a[5]];if(st!==e.state)setEntState(e,st);}
  syncOrbsGuest(s.o||[]);applyPartner(s.hp);
}
function applyPartner(p){
  if(!p)return;PARTNER.tx=p.x;PARTNER.tz=p.z;PARTNER.tyaw=p.yaw;PARTNER.pitch=p.pitch;PARTNER.hp=p.hp;PARTNER.cc=p.cc;PARTNER.mode=p.mode;PARTNER.name=p.name;PARTNER.inGame=p.ig;PARTNER.cut=p.cut;PARTNER.stats=p.st;
  PARTNER.pos.set(PARTNER.tx,0,PARTNER.tz);
}
function interpEntities(dt){
  const k=1-Math.exp(-14*dt);
  for(const e of NPCS){if(e.state==='gone')continue;const dx=e.tx-e.g.position.x,dz=e.tz-e.g.position.z;
    if(dx*dx+dz*dz>36){e.g.position.set(e.tx,e.ty,e.tz);e.lx=e.tx;e.lz=e.tz;}else{e.g.position.x+=dx*k;e.g.position.z+=dz*k;if(e.state!=='down')e.g.position.y+=(e.ty-e.g.position.y)*k;}
    let d=e.tyaw-e.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));e.g.rotation.y+=d*k;}
}
function welcomeData(){return {t:'welcome',specs:NPCS.map(liveSpec),objs:OBJ_VIEW,started:S.started,host:P.name,stress:r2(S.stress),phase:S.phase,hp:selfState()};}
NET.onMsg=d=>{
  if(!d||!d.t)return;
  if(NET.role==='host'){
    switch(d.t){
      case 'hello':PARTNER.active=true;PARTNER.name=d.name||'PARTNER';netSend(welcomeData());lobbyStatus(`${PARTNER.name} joined.`,'ok');
        if(S.inGame){toast('PARTNER LINKED',PARTNER.name+' joined the patrol','cy',3);voGun('arb_partner');SFX.join();}break;
      case 'p':applyPartner(d.p);break;
      case 'scan':hostOnScan(ENT.get(d.id),1);break;
      case 'fire':hostEnforce(d.id,d.mode,1,d.from);break;
      case 'refer':hostRefer(d.id,1);break;
    }
  }else if(NET.role==='guest'){
    switch(d.t){
      case 'welcome':removeAllEntities();for(const sp of d.specs)createEntity(sp);renderObj(d.objs||[]);S.stress=d.stress;PARTNER.active=true;PARTNER.name=d.host;applyPartner(d.hp);
        if(d.started)enterGame(true);else lobbyStatus(`Connected to ${d.host}. Waiting for them to start the mission…`,'ok');break;
      case 'start':if(!S.inGame)enterGame(false);break;
      case 'spawn':if(!ENT.has(d.spec.id))createEntity(d.spec);break;
      case 's':applySnapshot(d);break;
      case 'ev':applyEv(d.ev);break;
    }
  }
};
NET.onClose=()=>{
  if(NET.role==='host'){PARTNER.active=false;PARTNER.inGame=false;if(PARTNER.av)PARTNER.av.g.visible=false;toast('PARTNER DISCONNECTED',PARTNER.name+' left the patrol','',3);lobbyStatus('Your partner left. The room is still open.','bad');}
  else if(NET.role==='guest'){PARTNER.active=false;if(PARTNER.av)PARTNER.av.g.visible=false;
    if(S.inGame&&!S.ended){S.hostGone=true;showPause(true,'The host left, so the patrol has ended.');}else lobbyStatus('Lost the connection to the host.','bad');}
};

/* ---------- cutscenes ---------- */
const lerp3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const findRole=r=>NPCS.find(e=>e.role===r);
const posOf=(e,fallback)=>e?[e.g.position.x,e.g.position.y,e.g.position.z]:fallback;
const off=(p,dx,dy,dz)=>[p[0]+dx,p[1]+dy,p[2]+dz];
function card(t,jp,s){const c=$('#card');c.classList.remove('out');c.hidden=false;$('#cardT').textContent=t;$('#cardJP').textContent=jp;$('#cardS').textContent=s;c.style.animation='none';void c.offsetWidth;c.style.animation='';}
function cardOut(){const c=$('#card');c.classList.add('out');setTimeout(()=>{c.hidden=true;c.classList.remove('out');},800);}
const CUTS={
  intro:{dur:24.5,
    setup(){PATROL.g.position.y=16;return {};},
    shots:()=>[
      {t:0,d:7.2,p0:[-130,78,150],p1:[-62,46,84],l0:[0,22,0],l1:[0,14,0],fov:58},
      {t:7.2,d:6,p0:[26,31,24],p1:[11,17,12],l0:[0,16,0],l1:[0,12,0],fov:55},
      {t:13.2,d:5.3,p0:[7,1.6,47],p1:[4.5,1.4,41],l0:[0,8,34],l1:[0,1.4,34],fov:48},
      {t:18.5,d:6,p0:[-1.2,1.65,31],p1:[-1.2,1.65,31],l0:[0,1.7,10],l1:[0,1.7,10],fov:60,gun:true}],
    cues:()=>[[.6,()=>voNow('d_intro1')],[1.2,()=>card('LATENT SECTOR','潜在犯区域','Ward 7 · Kagero District · 02:14 · Heavy rain')],[5.8,cardOut],[7.6,()=>voNow('d_intro2')],[13.2,()=>SFX.whoosh()],
      [18.6,()=>{voNow('arb_boot');GUN.mode='locked';}],[19.7,()=>{GUN.mode='paralyzer';SFX.morph('paralyzer');}],[21,()=>{GUN.mode='lethal';SFX.morph('lethal');}],[22.3,()=>{GUN.mode='decon';SFX.morph('decon');}],[23.6,()=>{GUN.mode='locked';SFX.morph('locked');}]],
    update(c){PATROL.g.position.y=c.t<13.2?16:lerp(16,0,smooth(clamp((c.t-13.2)/4.6,0,1)));if(c.t>13&&c.t<18.5&&Math.random()<.5)emit(PATROL.g.position.x+MR(-.6,.6),PATROL.g.position.y+.2,PATROL.g.position.z+MR(-1.5,1.5),0,-2,0,0x39f0ff,.4,0);},
    end(){PATROL.g.position.y=0;placeAtSpawn();}},
  mibu:{dur:3.6,
    setup(arg){const a=findRole('A');const ap=posOf(a,[6.6,0,-7.3]);const y=arg.yaw!=null?arg.yaw:(a?a.g.rotation.y:0);if(a)a.g.rotation.y=y;const fx=Math.sin(y),fz=Math.cos(y);return {a:ap,f:[fx,fz]};},
    shots:c=>[{t:0,d:3.6,p0:off(c.a,c.f[0]*2.8-c.f[1]*.9,1.5,c.f[1]*2.8+c.f[0]*.9),p1:off(c.a,c.f[0]*1.9-c.f[1]*.5,1.62,c.f[1]*1.9+c.f[0]*.5),l0:off(c.a,0,1.55,0),l1:off(c.a,0,1.66,0),fov:42}],
    cues:()=>[[.15,()=>voNow('mibu_1')]]},
  kuze:{dur:9.5,
    setup(){const k=findRole('kuze');return {k:posOf(k,[26.4,0,-28.6])};},
    shots:c=>[{t:0,d:4.2,p0:off(c.k,-13,5,9),p1:off(c.k,-8.5,3.2,6),l0:off(c.k,1,1,-.5),l1:off(c.k,1,1.2,-.5),fov:50},
      {t:4.2,d:5.3,p0:off(c.k,-1.75,1.7,1.65),p1:off(c.k,-1.3,1.72,1.3),l0:off(c.k,0,1.66,0),l1:off(c.k,0,1.7,0),fov:42}],
    cues:()=>[[.3,()=>SFX.alert()],[4.6,()=>voNow('kuze_1')]]},
  hack:{dur:9,
    setup(){const d=findRole('sd14');return {d:posOf(d,[9,7,0])};},
    shots:c=>[{t:0,d:5.6,p0:off(c.d,3.4,.9,3.4),p1:off(c.d,2.1,.35,2.1),l0:c.d,l1:c.d,fov:42},
      {t:5.6,d:3.4,p0:[0,2,14],p1:[0,1.6,11],l0:[-10,18,0],l1:[0,16,0],fov:62}],
    cues:()=>[[1.2,()=>{$('#glitch').hidden=false;SFX.glitch();}],[1.5,()=>voNow('hack_1')],[4.6,()=>{$('#glitch').hidden=true;}],[5.6,()=>SFX.whoosh()]]},
  mech:{dur:7,
    setup(){const m=findRole('mech');return {m:posOf(m,[60,0,-6])};},
    shots:c=>[{t:0,d:7,p0:off(c.m,2.4,.45,10),p1:off(c.m,1.3,.8,6.4),l0:off(c.m,0,3.3,0),l1:off(c.m,0,2.9,0),fov:54}],
    cues:()=>[[.2,()=>SFX.stomp()],[.9,()=>SFX.stomp()],[1.0,()=>voNow('d_mech')]]},
  cascade:{dur:10,
    setup(){return {};},
    shots:()=>[{t:0,d:10,orbit:{r0:18,r1:13,a0:-.6,a1:.8,y0:7,y1:3.5},l0:[0,1.5,0],l1:[0,1.6,0],fov:55}],
    cues:()=>[[.4,()=>voNow('riot_1')],[3.2,()=>voNow('d_cascade')]]},
  amane1:{dur:9,
    setup(){const a=findRole('amane');return {a:posOf(a,[-53.6,0,-3.6])};},
    shots:c=>[{t:0,d:4,p0:[-59,3.6,13],p1:[-58,2.6,8],l0:[-55,.6,-2],l1:[-54.5,1.2,-3],fov:50},
      {t:4,d:5,p0:off(c.a,-2.1,1.7,.6),p1:off(c.a,-1.6,1.72,.45),l0:off(c.a,0,1.68,0),l1:off(c.a,0,1.71,0),fov:38}],
    cues:()=>[[4.2,()=>voNow('am_1')]]},
  amane2:{dur:20,
    setup(){const a=findRole('amane');return {a:posOf(a,[-53.6,0,-3.6])};},
    shots:c=>[{t:0,d:8,p0:off(c.a,-1.8,1.72,-.5),p1:off(c.a,-1.35,1.72,-.4),l0:off(c.a,0,1.7,0),l1:off(c.a,0,1.72,0),fov:36},
      {t:8,d:6,p0:off(c.a,-3.2,2.2,7),p1:off(c.a,-3.6,2.4,5.5),l0:off(c.a,0,1.4,-6),l1:off(c.a,0,1.4,-14),fov:48},
      {t:14,d:6,p0:off(c.a,-3.6,2.4,5.5),p1:off(c.a,-4.6,30,12),l0:off(c.a,0,1.4,-14),l1:[-60,12,-90],fov:60}],
    cues:()=>[[.3,()=>sysText('Crime coefficient: 000. Not an enforcement target. Trigger locked.',3.8)],[4.4,()=>voNow('am_2')],[8.5,()=>voNow('am_3')],[14.4,()=>voNow('d_d_end')],
      [16.6,()=>card('ANOMALY 7-0','異常','Case open · Seiji Amane · coefficient 000')]]}
};
function playCut(id,arg){
  const def=CUTS[id];if(!def)return;if(S.cut)endCut(true);
  const ctx=def.setup?def.setup(arg||{}):{};
  S.cut={id,def,ctx,shots:def.shots(ctx),cues:def.cues(ctx),t:0,ci:0};
  $('#app').classList.add('cine');H.hud.hidden=true;$('#touch').hidden=true;GUN.root.visible=false;SC.holding=false;SC.charging=null;
  H.subs.innerHTML='';$('#skipBtn').hidden=false;$('#scanTint').style.opacity=0;
}
function updCut(dt){
  const c=S.cut;c.t+=dt;
  while(c.ci<c.cues.length&&c.t>=c.cues[c.ci][0]){try{c.cues[c.ci][1]();}catch(e){console.error(e);}c.ci++;}
  let sh=c.shots[0];for(const s of c.shots)if(c.t>=s.t)sh=s;
  const k=smooth(clamp((c.t-sh.t)/sh.d,0,1));
  if(sh.orbit){const o=sh.orbit,a=lerp(o.a0,o.a1,k),r=lerp(o.r0,o.r1,k);camera.position.set(Math.sin(a)*r,lerp(o.y0,o.y1,k),Math.cos(a)*r);}
  else{const p=lerp3(sh.p0,sh.p1,k);camera.position.set(p[0],p[1],p[2]);}
  const l=lerp3(sh.l0,sh.l1,k);camera.lookAt(l[0],l[1],l[2]);
  if(camera.fov!==sh.fov){camera.fov=lerp(camera.fov,sh.fov,c.t-sh.t<.05?1:.2);camera.updateProjectionMatrix();}
  GUN.root.visible=!!sh.gun;
  if(sh.gun){const k2=clamp((c.t-sh.t)/sh.d,0,1);GUN.root.position.set(.03,-.02,-.56+k2*.06);GUN.root.rotation.set(.18,1.15+Math.sin(c.t*.6)*.45,.04);}
  if(c.def.update)c.def.update(c);
  if(c.t>=c.def.dur)endCut(false);
}
function endCut(silent){
  const c=S.cut;if(!c)return;S.cut=null;
  $('#app').classList.remove('cine');$('#skipBtn').hidden=true;$('#glitch').hidden=true;
  if(!$('#card').hidden)cardOut();
  camera.fov=72;camera.updateProjectionMatrix();
  GUN.root.position.copy(GUN.base);GUN.root.rotation.set(0,0,0);GUN.mode=SC.mode;
  if(c.def.end)c.def.end();
  if(S.inGame&&!S.ended){H.hud.hidden=false;GUN.root.visible=true;if(IS_TOUCH)$('#touch').hidden=false;}
  H.cutSubs.innerHTML='';
  if(!silent&&c.id==='intro'&&!S.introDone){S.introDone=true;}
}
function skipCut(){if(!S.cut)return;const rem=Math.max(0,S.cut.def.dur-S.cut.t);voClear();endCut(false);
  if(AUTH()&&rem>0){for(const ev of S.events)ev.t-=rem;S.aiHold=Math.min(S.aiHold,S.t+.5);}}
function placeAtSpawn(){const g=NET.role==='guest';P.pos.set(g?2.6:-2.6,0,30.5);P.yaw=0;P.pitch=.04;P.vel.set(0,0,0);}

/* ---------- local player update ---------- */
function updPlayer(dt){
  const fwd=_v.set(-Math.sin(P.yaw),0,-Math.cos(P.yaw)),rt=new V3(Math.cos(P.yaw),0,-Math.sin(P.yaw));
  let mx=0,mz=0;
  if(!S.cut&&!(S.paused&&NET.role==='solo')){const f=(KEYS.KeyW||KEYS.ArrowUp?1:0)-(KEYS.KeyS||KEYS.ArrowDown?1:0),r=(KEYS.KeyD||KEYS.ArrowRight?1:0)-(KEYS.KeyA||KEYS.ArrowLeft?1:0);mx=fwd.x*f+rt.x*r;mz=fwd.z*f+rt.z*r;
    if(JOY.id!==null){const jx=clamp((JOY.x-JOY.x0)/45,-1,1),jy=clamp((JOY.y-JOY.y0)/45,-1,1);mx+=fwd.x*-jy+rt.x*jx;mz+=fwd.z*-jy+rt.z*jx;}}
  const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
  const sprint=KEYS.ShiftLeft||KEYS.ShiftRight||(JOY.id!==null&&Math.hypot(JOY.x-JOY.x0,JOY.y-JOY.y0)>42);
  const spd=sprint?8.6:5,ak=1-Math.exp(-10*dt);P.vel.x=lerp(P.vel.x,mx*spd,ak);P.vel.z=lerp(P.vel.z,mz*spd,ak);
  P.pos.x+=P.vel.x*dt;P.pos.z+=P.vel.z*dt;resolveCircle(P.pos,.35);
  for(const e of NPCS){if(!alive(e))continue;const rr=e.kind==='mech'?1.4:e.kind==='drone'?0:.65;if(!rr)continue;const dx=P.pos.x-e.g.position.x,dz=P.pos.z-e.g.position.z,d=Math.hypot(dx,dz);if(d<rr&&d>1e-4){P.pos.x=e.g.position.x+dx/d*rr;P.pos.z=e.g.position.z+dz/d*rr;}}
  if(PARTNER.av&&PARTNER.av.g.visible){const a=PARTNER.av.g.position,dx=P.pos.x-a.x,dz=P.pos.z-a.z,d=Math.hypot(dx,dz);if(d<.7&&d>1e-4){P.pos.x=a.x+dx/d*.7;P.pos.z=a.z+dz/d*.7;}}
  const hs=Math.hypot(P.vel.x,P.vel.z);P.bob+=hs*dt*1.9;P.stepT+=hs*dt;if(P.stepT>(sprint?2.2:1.7)){P.stepT=0;SFX.step();}
  camera.position.set(P.pos.x,1.68+Math.sin(P.bob*2)*.035*Math.min(hs/5,1),P.pos.z);camera.rotation.set(P.pitch,P.yaw,0);
}
function updGunFP(dt){
  if(!S.cut)GUN.mode=SC.mode;
  GUN.charge=SC.charging?SC.charging.t/SC.charging.dur:0;gunMorph(GUN,dt);
  GUN.mlight.color.copy(GUN.glow.color);GUN.mlight.intensity=lerp(GUN.mlight.intensity,(SC.mode==='locked'?.15:.9)+GUN.charge*3,.2);
  if(S.cut)return;
  GUN.kick*=Math.exp(-10*dt);const sh=GUN.charge;
  const sp=Math.hypot(P.vel.x,P.vel.z),bob=Math.sin(P.bob)*Math.min(sp/5,1);
  GUN.root.position.set(GUN.base.x+bob*.012+LOOK.sx+(Math.random()-.5)*sh*.006,GUN.base.y+Math.abs(Math.cos(P.bob))*Math.min(sp/5,1)*.012+LOOK.sy+(Math.random()-.5)*sh*.006,GUN.base.z+GUN.kick*.08);
  GUN.root.rotation.set(GUN.kick*.35,LOOK.sx*-2,LOOK.sx*-1.5);
  LOOK.sx*=Math.exp(-8*dt);LOOK.sy*=Math.exp(-8*dt);
}
function updScan(dt){
  SC.fireCD=Math.max(0,SC.fireCD-dt);let scanning=false;
  if(SC.holding&&!SC.charging&&!S.cut&&!SC.needRelease){
    const c=findAimed();if(c!==SC.cand){SC.cand=c;SC.prog=0;}
    if(c){scanning=true;SC.prog+=dt/.6;SC.tickT-=dt;if(SC.tickT<=0){SC.tickT=.1;SFX.tick(SC.prog);}if(SC.prog>=1){completeScan(c);SC.prog=0;SC.cand=null;SC.needRelease=true;}}
  }else{SC.cand=null;SC.prog=0;}
  H.retic.classList.toggle('scanning',scanning);H.retic.classList.toggle('locked',!!SC.lock);
  H.retProg.style.strokeDasharray=`${(SC.prog*327).toFixed(1)} 400`;
  const sq=scanning?(1-SC.prog)*10:SC.lock?-4:0;
  $('#brTL').style.transform=`translate(${-sq}px,${-sq}px)`;$('#brTR').style.transform=`translate(${sq}px,${-sq}px)`;$('#brBL').style.transform=`translate(${-sq}px,${sq}px)`;$('#brBR').style.transform=`translate(${sq}px,${sq}px)`;
  $('#scanTint').style.opacity=scanning?.8:SC.charging?1:0;
  const L=SC.lock;
  if(L){
    if(!alive(L))clearLock();
    else{const d=L.g.position.distanceTo(P.pos);if(d>75||!hasLOS(L)){SC.lostT+=dt;if(SC.lostT>3.5)clearLock('Lock lost');}else SC.lostT=0;
      if(SC.lock){const ev=evaluate(L);if(ev.mode!==SC.mode){const up=ev.mode==='lethal';setMode(ev.mode);voGun(up?'arb_rise':ev.vo);if(SB.target===L)H.sb.ver.textContent=ev.verdict;}
        LOCKFX.position.set(L.g.position.x,L.kind==='drone'?L.g.position.y-1.6:.12,L.g.position.z);LOCKFX.rotation.y+=dt*1.5;LOCKFX.scale.setScalar(L.kind==='mech'?2.2:1);LOCKFX.children[2].visible=L.kind==='human';
        if(L.kind==='human'&&Math.floor(S.rt*4)!==Math.floor((S.rt-dt)*4))drawGunDisplay(GUN,SC.mode,L.cc);}}
  }
  if(SC.charging){SC.charging.t+=dt;const mp=muzzlePos();if(Math.random()<.7)emit(mp.x+MR(-.05,.05),mp.y+MR(-.05,.05),mp.z+MR(-.05,.05),MR(-.3,.3),MR(-.3,.3),MR(-.3,.3),MODES[SC.charging.mode].c,.25,0);if(SC.charging.t>=SC.charging.dur)releaseCharge();}
  const pr=$('#prompt');const can=L&&L.kind==='human'&&!L.role&&!(L.flags&F_REFERRED)&&L.cc>=70&&L.cc<100&&alive(L)&&L.g.position.distanceTo(P.pos)<5.5;
  if(can){pr.hidden=false;pr.textContent=IS_TOUCH?'CARE · refer to Hue Care':'[E] Refer to Hue Care';}else pr.hidden=true;
}
function updAvatar(dt){
  const av=PARTNER.av;if(!av)return;
  av.g.visible=PARTNER.active&&PARTNER.inGame;if(!av.g.visible)return;
  const k=1-Math.exp(-14*dt);const dx=PARTNER.tx-av.g.position.x,dz=PARTNER.tz-av.g.position.z;
  if(dx*dx+dz*dz>64){av.g.position.set(PARTNER.tx,0,PARTNER.tz);av.lx=PARTNER.tx;av.lz=PARTNER.tz;}else{av.g.position.x+=dx*k;av.g.position.z+=dz*k;}
  let d=PARTNER.tyaw+Math.PI-av.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));av.g.rotation.y+=d*k;
  animHuman(av,dt);av.armR.rotation.x=-Math.PI/2-PARTNER.pitch*.9;av.armL.rotation.x=-1.2-PARTNER.pitch*.5;av.armL.rotation.z=-.45;
  av.gun.mode=PARTNER.mode;gunMorph(av.gun,dt);
}

/* ---------- HUD per-frame ---------- */
const SB={target:null,shown:0,hold:0};
function showScanbox(e,ev){SB.target=e;SB.shown=0;SB.hold=6;H.sb.box.hidden=false;H.sb.name.textContent=e.name.toUpperCase();H.sb.id.textContent=e.pid||'';H.sb.ver.textContent=ev.verdict;}
function updScanbox(dt){
  const e=SB.target;if(!e){H.sb.box.hidden=true;return;}
  if(e!==SC.lock){SB.hold-=dt;if(SB.hold<=0){SB.target=null;H.sb.box.hidden=true;return;}}
  if(e.kind!=='human'){const hk=!!(e.flags&F_HACKED);H.sb.cc.textContent=e.kind==='mech'?`${Math.max(0,e.hp)}/3`:hk?'ERR':'N/A';H.sb.sw.style.background=hk?'#ff2d55':'#39f0ff';H.sb.hue.textContent=hk?'Control stack compromised':'Machine · no psyche';return;}
  SB.shown=lerp(SB.shown,e.cc,1-Math.exp(-6*dt));if(Math.abs(SB.shown-e.cc)<.6)SB.shown=e.cc;
  H.sb.cc.textContent=pad3(SB.shown);H.sb.sw.style.background=hueCss(e.cc);H.sb.hue.textContent=hueName(e.cc);
}
const mkEls={};
function updMarkers(){
  const W=innerWidth,Hh=innerHeight,live=new Set();
  for(const o of OBJ_VIEW){if(o.state!=='active')continue;const p=objMarkerPos(o);if(!p)continue;live.add(o.id);
    let el=mkEls[o.id];if(!el){el=document.createElement('div');el.innerHTML='<i></i><span></span>';H.markers.appendChild(el);mkEls[o.id]=el;}
    el.className='mk '+(o.mk||'');
    _v.copy(p).project(camera);let x=(_v.x*.5+.5)*W,y=(-_v.y*.5+.5)*Hh;const behind=_v.z>1;if(behind){x=W-x;y=Hh-y;}
    const m=46;if(behind||x<m||x>W-m||y<m+60||y>Hh-m){const cx=W/2,cy=Hh/2;let dx=x-cx,dy=y-cy;if(behind&&Math.abs(dy)<1)dy=1;const s=Math.min((W/2-m)/Math.abs(dx||1e-3),(Hh/2-m-30)/Math.abs(dy||1e-3));x=cx+dx*s;y=cy+dy*s;}
    const d=Math.round(p.distanceTo(camera.position));el.style.left=x+'px';el.style.top=y+'px';el.querySelector('span').textContent=`${o.label||'OBJECTIVE'} · ${d}m`;el.style.opacity=d<4?.25:1;}
  for(const k in mkEls)if(!live.has(k)){mkEls[k].remove();delete mkEls[k];}
}
let partnerTag=null;
function updTags(){
  const W=innerWidth,Hh=innerHeight,show=S.traceT>0;
  for(const e of NPCS){
    const vis=show&&alive(e)&&e!==SC.lock&&e.g.visible&&e.g.position.distanceTo(camera.position)<75;
    if(!vis){if(e.tagEl)e.tagEl.style.display='none';continue;}
    _v.set(e.g.position.x,e.kind==='drone'?e.g.position.y+.8:e.tagH,e.g.position.z).project(camera);
    if(_v.z>1||Math.abs(_v.x)>1.1||Math.abs(_v.y)>1.1){if(e.tagEl)e.tagEl.style.display='none';continue;}
    if(!e.tagEl){e.tagEl=document.createElement('div');e.tagEl.className='tag';e.tagEl.innerHTML='<i></i><span></span>';H.tags.appendChild(e.tagEl);}
    const threat=e.kind!=='human'?!!(e.flags&F_HACKED):e.cc>=100&&e.role!=='amane';
    const txt=e.kind!=='human'?(threat?'OBJ !':'OBJ'):(e.scanned?pad3(e.cc):'···');
    const col=e.kind!=='human'?(threat?'#ff2d55':'#39f0ff'):hueCss(e.cc);
    if(e._tt!==txt){e.tagEl.querySelector('span').textContent=txt;e._tt=txt;}
    if(e._tc!==col){e.tagEl.querySelector('i').style.background=col;e._tc=col;}
    e.tagEl.classList.toggle('threat',threat&&(e.scanned||e.kind!=='human'));
    e.tagEl.style.display='flex';e.tagEl.style.left=((_v.x*.5+.5)*W)+'px';e.tagEl.style.top=((-_v.y*.5+.5)*Hh)+'px';
  }
  // partner callsign
  const av=PARTNER.av;
  if(av&&av.g.visible){if(!partnerTag){partnerTag=document.createElement('div');partnerTag.className='tag partner';partnerTag.innerHTML='<i></i><span></span>';H.tags.appendChild(partnerTag);}
    _v.set(av.g.position.x,2.25,av.g.position.z).project(camera);
    if(_v.z<1&&Math.abs(_v.x)<1.1&&Math.abs(_v.y)<1.1){partnerTag.style.display='flex';partnerTag.style.left=((_v.x*.5+.5)*W)+'px';partnerTag.style.top=((-_v.y*.5+.5)*Hh)+'px';
      partnerTag.querySelector('span').textContent=PARTNER.name;partnerTag.querySelector('i').style.background=hueCss(PARTNER.cc);}else partnerTag.style.display='none';}
  else if(partnerTag)partnerTag.style.display='none';
}
function updLocktag(){
  const e=SC.lock;if(!e){H.locktag.hidden=true;return;}
  _v.set(e.g.position.x,e.kind==='drone'?e.g.position.y+.9:e.kind==='mech'?4.6:e.tagH+.15,e.g.position.z).project(camera);
  if(_v.z>1){H.locktag.hidden=true;return;}
  H.locktag.hidden=false;H.locktag.style.left=((_v.x*.5+.5)*innerWidth)+'px';H.locktag.style.top=((-_v.y*.5+.5)*innerHeight)+'px';
  const t=e.kind!=='human'?`LOCK · ${e.name}`:`LOCK · ${pad3(e.cc)}`;if(H.locktag._t!==t){H.locktag.textContent=t;H.locktag._t=t;}
}
let hudT=0;
function updHUD(dt){
  hudT-=dt;
  if(hudT<=0){hudT=.1;
    $('#stressBar').style.width=S.stress.toFixed(1)+'%';$('#stressVal').textContent=Math.round(S.stress)+'%';
    $('#selfCC').textContent=pad3(P.cc);$('#selfSwatch').style.background=hueCss(P.cc);$('#selfHue').textContent=hueName(P.cc);
    $('#hpBar').style.width=Math.max(0,P.hp)+'%';$('#hpVal').textContent=Math.round(Math.max(0,P.hp));
    const ts=$('#traceStat');const tt=S.traceT>0?'Hue trace active':S.traceCD>0?`Hue trace ${Math.ceil(S.traceCD)}s`:(IS_TOUCH?'Hue trace ready':'Hue trace [F] ready');if(ts._t!==tt){ts.textContent=tt;ts._t=tt;}ts.classList.toggle('cool',S.traceCD>0&&S.traceT<=0);
    const pp=$('#partnerPanel');const showP=NET.role!=='solo'&&PARTNER.active;pp.hidden=!showP;
    if(showP){$('#ptName').textContent=PARTNER.name;$('#ptHp').style.width=Math.max(0,PARTNER.hp)+'%';$('#ptSwatch').style.background=hueCss(PARTNER.cc);$('#ptHue').textContent=hueName(PARTNER.cc);$('#ptCC').textContent=pad3(PARTNER.cc);
      $('#ptDist').textContent=PARTNER.inGame?Math.round(PARTNER.pos.distanceTo(P.pos))+'m':'lobby';}
    const pill=$('#netPill');pill.hidden=NET.role==='solo';if(NET.role!=='solo'){pill.textContent=NET.tr?`CO-OP · ${NET.code}`:'CO-OP · OFFLINE';pill.classList.toggle('off',!NET.tr);}
    $('#aimHint').hidden=IS_TOUCH||pLocked||noLock||S.cut||!S.inGame;
  }
  const dm=$('#dmg');dm.style.opacity=Math.max(0,parseFloat(dm.style.opacity||0)-dt*2);
  if(toastT>0){toastT-=dt;if(toastT<=0)$('#toast').style.opacity=0;}
  if(modeFlashT>0){modeFlashT-=dt;if(modeFlashT<=0)$('#modePanel').classList.remove('flash');}
  updScanbox(dt);updMarkers();updTags();updLocktag();
}

/* ---------- input ---------- */
let pLocked=false,noLock=false;
function lockPointer(){if(IS_TOUCH||noLock)return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){noLock=true;}}
document.addEventListener('pointerlockchange',()=>{pLocked=document.pointerLockElement===canvas;if(!pLocked&&S.inGame&&!S.ended&&!S.paused&&!IS_TOUCH&&!S.cut)showPause(true);});
document.addEventListener('pointerlockerror',()=>{noLock=true;});
function look(dx,dy){P.yaw-=dx*.0022;P.pitch=clamp(P.pitch-dy*.0022,-1.35,1.35);LOOK.sx=clamp(LOOK.sx-dx*.00006,-.02,.02);LOOK.sy=clamp(LOOK.sy+dy*.00006,-.02,.02);}
addEventListener('mousemove',e=>{if(!S.inGame||S.paused||S.cut||IS_TOUCH)return;if(pLocked||noLock)look(e.movementX||0,e.movementY||0);});
canvas.addEventListener('mousedown',e=>{if(IS_TOUCH||!S.inGame)return;if(S.cut){if(e.button===0)return;}
  if(!pLocked&&!noLock){lockPointer();return;}
  if(e.button===0)fire();if(e.button===2)SC.holding=true;});
addEventListener('mouseup',e=>{if(e.button===2){SC.holding=false;SC.needRelease=false;}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT')return;
  KEYS[e.code]=true;if(!S.inGame)return;
  if(['KeyW','KeyA','KeyS','KeyD','Space','KeyF','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if((e.code==='Space'||e.code==='Enter')&&S.cut&&!e.repeat){skipCut();return;}
  if(S.cut)return;
  if(e.code==='KeyQ')SC.holding=true;
  if(e.code==='KeyF'&&!e.repeat)trace();
  if(e.code==='KeyE'&&!e.repeat)refer();
  if(e.code==='KeyV'&&!e.repeat){VO.enabled=!VO.enabled;$('#voiceTog').checked=VO.enabled;toast(VO.enabled?'VOICE ON':'VOICE OFF','Voice acting','cy',1.2);}
  if(e.code==='KeyP'&&!e.repeat)showPause(!S.paused);
});
addEventListener('keyup',e=>{KEYS[e.code]=false;if(e.code==='KeyQ'){SC.holding=false;SC.needRelease=false;}});
addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;SC.holding=false;});
const JOY={id:null,x0:0,y0:0,x:0,y:0},LK={id:null,x:0,y:0};
{const touchEl=$('#touch'),joyEl=$('#joy');
  touchEl.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;
    if(e.clientX<innerWidth*.45&&JOY.id===null){JOY.id=e.pointerId;JOY.x0=JOY.x=e.clientX;JOY.y0=JOY.y=e.clientY;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';joyEl.style.opacity=1;}
    else if(LK.id===null){LK.id=e.pointerId;LK.x=e.clientX;LK.y=e.clientY;}});
  touchEl.addEventListener('pointermove',e=>{
    if(e.pointerId===JOY.id){JOY.x=e.clientX;JOY.y=e.clientY;const dx=clamp(JOY.x-JOY.x0,-45,45),dy=clamp(JOY.y-JOY.y0,-45,45);joyEl.firstElementChild.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
    if(e.pointerId===LK.id){if(S.inGame&&!S.cut)look((e.clientX-LK.x)*1.6,(e.clientY-LK.y)*1.6);LK.x=e.clientX;LK.y=e.clientY;}});
  const endT=e=>{if(e.pointerId===JOY.id){JOY.id=null;joyEl.style.opacity=0;joyEl.firstElementChild.style.transform='';}if(e.pointerId===LK.id)LK.id=null;};
  touchEl.addEventListener('pointerup',endT);touchEl.addEventListener('pointercancel',endT);
  const tb=(id,down,up)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();down();});if(up){b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);}};
  tb('#tScan',()=>{SC.holding=true;},()=>{SC.holding=false;SC.needRelease=false;});
  tb('#tFire',fire);tb('#tTrace',trace);tb('#tCare',refer);tb('#tPause',()=>showPause(true));}
$('#skipBtn').addEventListener('click',skipCut);

/* ---------- screens & lobby ---------- */
const params=new URLSearchParams(location.search);
const JOIN_CODE=(params.get('join')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
function getCallsign(){const v=$('#callsign').value.trim().toUpperCase().replace(/[^A-Z0-9 \-_.]/g,'').slice(0,14);return v||'INSPECTOR';}
{let saved=null;try{saved=localStorage.getItem('ls-callsign');}catch(e){}$('#callsign').value=saved||('INSPECTOR-'+Math.floor(MR(10,99)));}
function saveCallsign(){P.name=getCallsign();try{localStorage.setItem('ls-callsign',P.name);}catch(e){}}
function lobbyStatus(text,cls){for(const id of ['#netStatus','#guestStatus']){const el=$(id);el.textContent=text;el.className='netStatus '+(cls||'');}}
if(IS_TOUCH){$('#keyList').innerHTML='<div><kbd>Left thumb</kbd> move</div><div><kbd>Right thumb</kbd> look</div><div><kbd>SCAN</kbd> hold to judge</div><div><kbd>FIRE</kbd> enforce</div><div><kbd>TRACE</kbd> hue pulse</div><div><kbd>CARE</kbd> refer citizen</div>';}
$('#voiceTog').addEventListener('change',e=>{VO.enabled=e.target.checked;});
if(JOIN_CODE){$('#lobbyMain').hidden=true;$('#guestBox').hidden=false;$('#guestCode').textContent=JOIN_CODE;}
$('#soloBtn').addEventListener('click',()=>{saveCallsign();initAudio();NET.role='solo';beginHostGame();});
$('#hostBtn').addEventListener('click',()=>{
  saveCallsign();initAudio();$('#lobbyMain').hidden=true;$('#hostBox').hidden=false;lobbyStatus('Opening room…');
  hostRoom({ready:code=>{$('#roomCode').textContent=code;$('#inviteLink').value=inviteLink(code);lobbyStatus('Room open. Waiting for your partner…','ok');},error:msg=>lobbyStatus(msg,'bad')});
  NET.onConnect=()=>{lobbyStatus('Partner connecting…','ok');};
});
$('#cancelHostBtn').addEventListener('click',()=>{try{NET.peer&&NET.peer.destroy();}catch(e){}NET.role='solo';NET.tr=null;$('#hostBox').hidden=true;$('#lobbyMain').hidden=false;});
$('#copyBtn').addEventListener('click',()=>{const inp=$('#inviteLink');const done=()=>{$('#copyBtn').textContent='Copied';setTimeout(()=>$('#copyBtn').textContent='Copy link',1500);};
  if(navigator.clipboard)navigator.clipboard.writeText(inp.value).then(done,()=>{inp.select();});else{inp.select();try{document.execCommand('copy');done();}catch(e){}}});
$('#startBtn').addEventListener('click',()=>{saveCallsign();beginHostGame();});
function doJoin(code){
  saveCallsign();initAudio();lobbyStatus('Connecting to room '+code+'…');
  joinRoom(code,{connected:()=>{lobbyStatus('Connected. Syncing the district…','ok');netSend({t:'hello',name:P.name});},error:msg=>{lobbyStatus(msg,'bad');}});
}
$('#joinBtn').addEventListener('click',()=>{const c=$('#joinCode').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length<5){$('#joinCode').focus();return;}
  $('#lobbyMain').hidden=true;$('#guestBox').hidden=false;$('#guestCode').textContent=c;doJoin(c);});
$('#guestJoinBtn').addEventListener('click',()=>{$('#guestJoinBtn').disabled=true;doJoin(JOIN_CODE||$('#guestCode').textContent);});
$('#guestSoloBtn').addEventListener('click',()=>{location.href=location.pathname+(LOCAL_NET?'?net=local':'');});
function enterGame(started){
  S.inGame=true;$('#title').hidden=true;H.hud.hidden=false;if(IS_TOUCH)$('#touch').hidden=false;GUN.root.visible=true;
  if(started){ // dropping into a mission already underway
    const hp=PARTNER;P.pos.set((hp.tx||0)+1.5,0,(hp.tz||30)+1.5);resolveCircle(P.pos,.35);PATROL.g.position.y=0;
    toast('PATROL JOINED',`Linked with ${PARTNER.name}`,'cy',3);voGun('arb_partner');SFX.join();
  }
  lockPointer();
}
function beginHostGame(){
  if(NET.role==='host'&&NET.tr){/* partner in lobby gets 'start' */}
  S.inGame=true;$('#title').hidden=true;H.hud.hidden=false;if(IS_TOUCH)$('#touch').hidden=false;GUN.root.visible=true;
  lockPointer();startMission();
}
function showPause(v,note){
  if(S.ended&&!S.hostGone)return;S.paused=v;$('#pause').hidden=!v;
  $('#pauseNote').textContent=note||(NET.role!=='solo'?'Co-op keeps running while you are paused.':'');
  $('#resumeBtn').hidden=!!S.hostGone;
  if(v){SC.holding=false;for(const k in KEYS)KEYS[k]=false;if(NET.role==='solo'){if(AC)AC.suspend();}}
  else{if(AC)AC.resume();lockPointer();}
}
$('#resumeBtn').addEventListener('click',()=>showPause(false));
const restart=()=>{location.href=location.pathname+(LOCAL_NET?'?net=local':'');};
$('#restartBtn').addEventListener('click',restart);$('#againBtn').addEventListener('click',restart);
$('#freeBtn').addEventListener('click',()=>{$('#end').hidden=true;H.hud.hidden=false;if(IS_TOUCH)$('#touch').hidden=false;S.ended=false;S.free=true;lockPointer();});
function rankOf(cc){if(cc<60)return {t:'Inspector · hue clear',b:`Hue held at ${hueName(cc)}. The system trusts this judgement for another shift.`,m:'#39f0ff'};
  if(cc<100)return {t:'Inspector · counseling advised',b:`Hue drifted to ${hueName(cc)}. Book a Hue Care session before the next patrol.`,m:'#b18cff'};
  return {t:'Reassigned as Enforcer',b:`Coefficient reached ${Math.round(cc)}. Now a latent criminal, kept on the street as a hunting dog under another Inspector's watch.`,m:'#ff2d55'};}
function reportHtml(name,st,cc,me){const r=rankOf(cc);st=st||{};
  return `<div class="rep" style="--m:${r.m}"><div class="repHead"><b>${r.t}</b><span>${name}${me?' · you':''}</span></div><p>${r.b}</p>
  <div class="report">${[[st.subdued||0,'Paralyzed'],[st.eliminated||0,'Eliminated'],[st.decon||0,'Deconstructed'],[st.referred||0,'Referred'],[st.witnesses||0,'Witnesses clouded'],[pad3(cc),'Coefficient']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div></div>`;}
function showEnd(){
  S.ended=true;try{document.exitPointerLock();}catch(e){}if(S.cut)endCut(true);$('#card').hidden=true;$('#app').classList.remove('cine');
  let html=reportHtml(P.name,STATS,P.cc,true);
  if(NET.role!=='solo'&&PARTNER.name)html+=reportHtml(PARTNER.name,PARTNER.stats,PARTNER.cc,false);
  $('#reports').innerHTML=html;$('#end').hidden=false;H.hud.hidden=true;$('#touch').hidden=true;
}

/* ---------- main loop ---------- */
let last=performance.now(),boardT=0,attractA=0,sendT=0;
let HOLD=false,SIMRT=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(HOLD)return;
  tick(dt,now/1000);
  renderer.render(scene,camera);
}
function tick(dt,rt){
  S.rt=rt;
  const frozen=S.paused&&NET.role==='solo';
  if(!frozen){S.t+=dt;U_TIME.value=S.t;}
  voTick();
  if(S.rt>S.subUntil){H.subs.style.opacity=0;H.cutSubs.innerHTML='';}
  if(frozen)return;
  updateWorld(dt,S.t);
  if(AUTH())hostSim(dt);else interpEntities(dt);
  for(const e of NPCS)animEntity(e,dt);
  updParticles(dt);updFX(dt);updAvatar(dt);
  if(S.cut)updCut(dt);
  else if(S.inGame){updPlayer(dt);if(!S.ended||S.free)updScan(dt);}
  else{attractA+=dt*.06;camera.position.set(Math.sin(attractA)*30,8+Math.sin(attractA*1.7)*1.5,Math.cos(attractA)*30);camera.lookAt(0,10,0);}
  if(GUN)updGunFP(dt);
  if(S.inGame){
    S.traceCD=Math.max(0,S.traceCD-dt);S.traceT=Math.max(0,S.traceT-dt);
    if(S.t-S.lastHurt>4)P.hp=Math.min(100,P.hp+dt*3);P.cc=clamp(P.cc,0,400);
    if(!S.cut){camera.updateMatrixWorld();updHUD(dt);}
  }
  boardT-=dt;if(boardT<=0){boardT=.4;drawBoard(S.stress);}
  if(NET.role==='guest'&&NET.tr&&S.inGame){sendT-=dt;if(sendT<=0){sendT=1/20;netSend({t:'p',p:selfState()});}}
}

/* ---------- boot ---------- */
(async function boot(){
  await loadFonts();
  buildWorld();
  GUN=buildGun(camera,true);GUN.base=new V3(.26,-.24,-.5);GUN.root.position.copy(GUN.base);GUN.root.visible=false;GUN.kick=0;
  {const fill=new T.PointLight(0xbfd8ff,.9,2.2,2);fill.position.set(.1,.25,.1);camera.add(fill);
    GUN.mlight=new T.PointLight(0x6d8fa8,0,6,2);GUN.mlight.position.set(0,0,-.4);GUN.root.add(GUN.mlight);}
  drawGunDisplay(GUN,'locked',null);
  flash=new T.PointLight(0xffffff,0,22,2);scene.add(flash);
  lockMat=new T.MeshBasicMaterial({color:0x39f0ff,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
  LOCKFX=new T.Group();scene.add(LOCKFX);LOCKFX.visible=false;
  {const a=new T.Mesh(new T.TorusGeometry(.8,.03,6,48),lockMat);a.rotation.x=Math.PI/2;LOCKFX.add(a);const b=new T.Mesh(new T.TorusGeometry(.95,.012,6,48),lockMat);b.rotation.x=Math.PI/2;LOCKFX.add(b);const c=new T.Mesh(new T.CylinderGeometry(.015,.015,3.4,6),lockMat);c.position.y=1.7;LOCKFX.add(c);}
  PARTNER.av=makeAvatar(424242);
  spawnPopulation();setModeCss('locked');
  $('#loading').remove();
  requestAnimationFrame(frame);
  window.__LS={hold:v=>{HOLD=v;},advance:(sec,step=.05)=>{for(let t=0;t<sec;t+=step){SIMRT+=step;tick(step,performance.now()/1000+SIMRT);}},render:()=>renderer.render(scene,camera),S,P,NET,NPCS,ENT,PARTNER,SC,STATS,OBJ_VIEW:()=>OBJ_VIEW,hostEnforce,evaluate,playCut,skipCut,fire,completeScan,look,KEYS,later};
})();
