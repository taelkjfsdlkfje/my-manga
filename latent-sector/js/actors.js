"use strict";
/* ============ actors: people, machines, the Arbiter sidearm ============ */
const GEO={leg:new T.BoxGeometry(.17,.86,.2).translate(0,-.43,0),arm:new T.BoxGeometry(.12,.68,.14).translate(0,-.32,0),torso:new T.BoxGeometry(.46,.66,.26),coat:new T.BoxGeometry(.5,.5,.3),head:new T.BoxGeometry(.23,.27,.25),hair:new T.BoxGeometry(.25,.1,.27),trim:new T.BoxGeometry(.48,.04,.28),visor:new T.BoxGeometry(.25,.055,.03),stick:new T.CylinderGeometry(.012,.012,1.0,5),canopy:new T.ConeGeometry(.78,.32,12,1,true),rim:new T.TorusGeometry(.78,.018,5,24),pipe:new T.CylinderGeometry(.03,.03,.85,6),knife:new T.BoxGeometry(.03,.32,.06)};
const matCache={};
const stdMat=(c,r=.72,m=.12)=>matCache[c+'_'+r+'_'+m]||(matCache[c+'_'+r+'_'+m]=new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
const COATS=[0x1b1d26,0x2a1f2f,0x3a2a1c,0x1f2c33,0x2b2b2b,0x412233,0x24331f,0x4a3b30,0x262a40];
const SKINS=[0xc89f86,0x8d5e44,0xe0bca0,0x5a3a2a,0xb08060];
const HAIRS=[0x0d0d0d,0x2a1a10,0xc8c8d4,0x5a2a7a,0x1a4a6a,0x7a1a2a];
const PANTS=stdMat(0x121218,.8,.1);
const FACE_MAT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  g.fillStyle='rgba(235,240,255,.9)';g.fillRect(12,24,14,7);g.fillRect(38,24,14,7);
  g.fillStyle='rgba(12,10,16,.95)';g.fillRect(17,24,7,7);g.fillRect(40,24,7,7);g.fillRect(10,17,17,3);g.fillRect(37,17,17,3);
  g.fillStyle='rgba(60,20,30,.6)';g.fillRect(24,46,16,3);
  return new T.MeshBasicMaterial({map:canvasTex(c),transparent:true,depthWrite:false});})();
const FACE_GEO=new T.PlaneGeometry(.22,.24);
const UMB=NEON.map(c=>new T.MeshBasicMaterial({color:c,transparent:true,opacity:.22,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
const PRESETS={
  civ:{},stall:{umbrella:false},victim:{umbrella:false},
  mibu:{coat:0x3a1420,trim:0xff2d55,umbrella:false,visor:false,longCoat:false},
  kuze:{coat:0x2a2a22,trim:0xff6a2b,umbrella:false,visor:true,longCoat:true,weapon:'pipe'},
  thug:{coat:0x1a1a22,trim:0xff4fd8,umbrella:false,visor:true,longCoat:false,weapon:'knife'},
  rioter:{trim:0xff2d55,umbrella:false,visor:true,visorC:0xff2d55},
  armed:{coat:0x2a1010,trim:0xff2d55,umbrella:false,visor:true,visorC:0xff2d55,longCoat:true,weapon:'knife'},
  amane:{coat:0xd8d8e4,trim:0xe8e8ff,hair:0xe6e6f0,umbrella:false,visor:false,longCoat:true},
  inspector:{coat:0x18203a,trim:0x39f0ff,umbrella:false,visor:false,longCoat:true}
};
function makeHuman(seed,preset){
  const r=mulberry32(seed),rp=a=>a[Math.floor(r()*a.length)],P=PRESETS[preset]||{};
  const g=new T.Group();g.rotation.order='YXZ';
  const coatM=stdMat(P.coat??rp(COATS)),skin=stdMat(rp(SKINS),.6,.05);
  const legL=new T.Mesh(GEO.leg,PANTS),legR=new T.Mesh(GEO.leg,PANTS);legL.position.set(-.11,.88,0);legR.position.set(.11,.88,0);
  const torso=new T.Mesh(GEO.torso,coatM);torso.position.y=1.21;
  const armL=new T.Mesh(GEO.arm,coatM),armR=new T.Mesh(GEO.arm,coatM);armL.position.set(-.3,1.5,0);armR.position.set(.3,1.5,0);
  const head=new T.Mesh(GEO.head,skin);head.position.y=1.69;
  const hair=new T.Mesh(GEO.hair,stdMat(P.hair??rp(HAIRS),.5,.05));hair.position.y=1.85;
  const face=new T.Mesh(FACE_GEO,FACE_MAT);face.position.set(0,1.69,.1265);
  g.add(legL,legR,torso,armL,armR,head,hair,face);
  if(P.longCoat??r()<.45){const c=new T.Mesh(GEO.coat,coatM);c.position.y=.82;g.add(c);}
  const tr=new T.Mesh(GEO.trim,neonMat(P.trim??rp(NEON)));tr.position.y=1.0;g.add(tr);
  if(P.visor??r()<.3){const v=new T.Mesh(GEO.visor,neonMat(P.visorC??rp(NEON)));v.position.set(0,1.71,.13);g.add(v);}
  let umb=false;
  if(P.umbrella??r()<.4){umb=true;const ci=Math.floor(r()*NEON.length);const s=new T.Mesh(GEO.stick,PANTS);s.position.set(.12,2.05,.1);g.add(s);
    const cp=new T.Mesh(GEO.canopy,UMB[ci]);cp.position.set(.12,2.6,.1);g.add(cp);const rm=new T.Mesh(GEO.rim,neonMat(NEON[ci]));rm.rotation.x=Math.PI/2;rm.position.set(.12,2.45,.1);g.add(rm);armR.rotation.x=-.9;}
  if(P.weapon==='pipe'){const w=new T.Mesh(GEO.pipe,stdMat(0x6a6a70,.3,.9));w.position.set(0,-.62,.12);w.rotation.x=1.2;armR.add(w);}
  if(P.weapon==='knife'){const w=new T.Mesh(GEO.knife,new T.MeshBasicMaterial({color:0xffb0c0,toneMapped:false}));w.position.set(0,-.72,.08);w.rotation.x=1.1;armR.add(w);}
  scene.add(g);
  return {g,legL,legR,armL,armR,head,umb,phase:r()*TAU,speedR:r()};
}

/* ---------- the Arbiter (first person, partner's hand, cutscenes) ---------- */
const MODES={
  locked:{c:0x6d8fa8,css:'#8fa8bf',name:'TRIGGER LOCKED',jp:'施錠'},
  paralyzer:{c:0x39f0ff,css:'#39f0ff',name:'PARALYZER',jp:'麻痺'},
  lethal:{c:0xff2d55,css:'#ff2d55',name:'LETHAL',jp:'致死'},
  decon:{c:0xb18cff,css:'#b18cff',name:'DECONSTRUCT',jp:'分解'}};
const MODE_IDX=['locked','paralyzer','lethal','decon'];
function buildGun(parent,withDisplay){
  const root=new T.Group();parent.add(root);
  const shell=new T.MeshStandardMaterial({color:0x1a202b,metalness:.85,roughness:.3});
  const plate=new T.MeshStandardMaterial({color:0x323e52,metalness:.7,roughness:.38});
  const glow=new T.MeshBasicMaterial({color:0x6d8fa8,toneMapped:false});
  const parts=[];
  const P=(geo,mat,cfg)=>{const m=new T.Mesh(geo,mat);root.add(m);const st={};for(const k of MODE_IDX)st[k]=Object.assign({p:[0,0,0],r:[0,0,0],s:[1,1,1]},cfg.all||{},cfg[k]||cfg.locked||{});m.position.set(...st.locked.p);m.rotation.set(...st.locked.r);m.scale.set(...st.locked.s);parts.push({m,st});return m;};
  P(new T.BoxGeometry(.06,.15,.085),shell,{all:{p:[0,-.095,.07],r:[.28,0,0]}});
  P(new T.BoxGeometry(.085,.085,.3),shell,{all:{p:[0,0,-.05]}});
  P(new T.BoxGeometry(.004,.012,.24),glow,{all:{p:[-.0435,.012,-.06]}});
  P(new T.BoxGeometry(.004,.012,.24),glow,{all:{p:[.0435,.012,-.06]}});
  const sh=s=>({locked:{p:[s*.022,.062,-.07]},paralyzer:{p:[s*.027,.066,-.08],r:[0,0,s*-.1]},lethal:{p:[s*.052,.078,-.1],r:[0,0,s*-.5]},decon:{p:[s*.078,.058,-.13],r:[0,0,s*-1.15],s:[1,1,1.15]}});
  P(new T.BoxGeometry(.045,.034,.26),plate,sh(-1));P(new T.BoxGeometry(.045,.034,.26),plate,sh(1));
  P(new T.BoxGeometry(.01,.006,.22),glow,{locked:{p:[0,.081,-.07],s:[1,1,.25]},paralyzer:{p:[0,.084,-.07]},lethal:{p:[0,.088,-.08],s:[2.2,1,1.1]},decon:{p:[0,.072,-.1],s:[3.4,1,1.25]}});
  const fin=s=>({locked:{p:[s*.05,-.004,-.04]},paralyzer:{p:[s*.053,0,-.06]},lethal:{p:[s*.088,0,-.1],r:[0,s*.28,0]},decon:{p:[s*.115,.005,-.16],r:[0,s*.5,s*.2],s:[1,1.3,1.35]}});
  P(new T.BoxGeometry(.008,.07,.18),plate,fin(-1));P(new T.BoxGeometry(.008,.07,.18),plate,fin(1));
  const fg=s=>({locked:{p:[s*.05,-.004,-.04],s:[1,.2,.2]},paralyzer:{p:[s*.058,0,-.06],s:[1,.6,.8]},lethal:{p:[s*.094,0,-.1],r:[0,s*.28,0]},decon:{p:[s*.122,.005,-.16],r:[0,s*.5,s*.2],s:[1,1.3,1.35]}});
  P(new T.BoxGeometry(.005,.04,.14),glow,fg(-1));P(new T.BoxGeometry(.005,.04,.14),glow,fg(1));
  P(new T.CylinderGeometry(.02,.024,.12,14).rotateX(Math.PI/2),shell,{locked:{p:[0,0,-.23],s:[1,1,.6]},paralyzer:{p:[0,0,-.24],s:[1,1,.9]},lethal:{p:[0,0,-.27],s:[1.25,1.25,1.4]},decon:{p:[0,0,-.28],s:[1.9,1.9,1.2]}});
  const ring=P(new T.TorusGeometry(.03,.006,8,24),glow,{locked:{p:[0,0,-.265],s:[.8,.8,.8]},paralyzer:{p:[0,0,-.295]},lethal:{p:[0,0,-.345],s:[1.35,1.35,1.35]},decon:{p:[0,0,-.36],s:[2.3,2.3,2.3]}});
  P(new T.TorusGeometry(.045,.004,8,28),glow,{locked:{p:[0,0,-.2],s:[.001,.001,.001]},paralyzer:{p:[0,0,-.22],s:[.001,.001,.001]},lethal:{p:[0,0,-.31],s:[1.1,1.1,1.1]},decon:{p:[0,0,-.33],r:[0,0,.8],s:[1.9,1.9,1.9]}});
  P(new T.BoxGeometry(.05,.025,.14),plate,{locked:{p:[0,-.056,-.12]},paralyzer:{p:[0,-.058,-.13]},lethal:{p:[0,-.078,-.16],r:[.25,0,0]},decon:{p:[0,-.088,-.2],r:[.42,0,0],s:[1.4,1,1.2]}});
  const muzzle=new T.Object3D();ring.add(muzzle);
  const gun={root,parts,glow,muzzle,mode:'locked',charge:0};
  if(withDisplay){const dc=document.createElement('canvas');dc.width=256;dc.height=128;const dt=canvasTex(dc);
    const disp=new T.Mesh(new T.PlaneGeometry(.08,.04),new T.MeshBasicMaterial({map:dt,transparent:true,toneMapped:false,depthWrite:false}));disp.position.set(0,.1,.03);disp.rotation.x=-.75;root.add(disp);gun.dc=dc;gun.dt=dt;}
  return gun;
}
const _gc=new T.Color(),_white=new T.Color(0xffffff);
function gunMorph(gun,dt){
  const m=gun.mode,k=1-Math.exp(-14*dt);
  for(const p of gun.parts){const s=p.st[m];p.m.position.x=lerp(p.m.position.x,s.p[0],k);p.m.position.y=lerp(p.m.position.y,s.p[1],k);p.m.position.z=lerp(p.m.position.z,s.p[2],k);
    p.m.rotation.x=lerp(p.m.rotation.x,s.r[0],k);p.m.rotation.y=lerp(p.m.rotation.y,s.r[1],k);p.m.rotation.z=lerp(p.m.rotation.z,s.r[2],k);
    p.m.scale.x=lerp(p.m.scale.x,s.s[0],k);p.m.scale.y=lerp(p.m.scale.y,s.s[1],k);p.m.scale.z=lerp(p.m.scale.z,s.s[2],k);}
  _gc.set(MODES[m].c);if(gun.charge>0)_gc.lerp(_white,gun.charge*.6);
  gun.glow.color.lerp(_gc,1-Math.exp(-8*dt));
}
function drawGunDisplay(gun,mode,cc){
  if(!gun.dc)return;const g=gun.dc.getContext('2d'),M=MODES[mode];g.clearRect(0,0,256,128);
  g.fillStyle='rgba(4,8,16,.7)';g.fillRect(0,0,256,128);g.strokeStyle=M.css;g.lineWidth=4;g.strokeRect(4,4,248,120);
  g.fillStyle=M.css;g.font=`600 58px ${MONOF}`;g.textAlign='left';g.textBaseline='middle';g.fillText(cc==null?'---':pad3(cc),16,52);
  g.font=`700 30px ${JPF}`;g.textAlign='right';g.fillText(M.jp,240,52);
  g.font=`700 22px ${HUDF}`;g.textAlign='left';g.fillText(M.name,16,102);gun.dt.needsUpdate=true;
}

/* ---------- machines ---------- */
function makeDrone(){
  const g=new T.Group();
  const shell=new T.MeshStandardMaterial({color:0x22283a,metalness:.9,roughness:.25});
  const body=new T.Mesh(new T.SphereGeometry(.55,20,12),shell);body.scale.y=.55;g.add(body);
  const eyeM=new T.MeshBasicMaterial({color:0x39f0ff,toneMapped:false});
  const eye=new T.Mesh(new T.TorusGeometry(.42,.04,6,30),eyeM);eye.rotation.x=Math.PI/2;g.add(eye);
  const lens=new T.Mesh(new T.SphereGeometry(.13,12,8),eyeM);lens.position.set(0,-.15,.38);g.add(lens);
  const rotorM=new T.MeshBasicMaterial({color:0x39f0ff,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
  const rotors=[];
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([x,z])=>{const a=new T.Mesh(new T.BoxGeometry(.7,.05,.08),shell);a.position.set(x*.45,0,z*.45);a.rotation.y=-Math.atan2(z,x);g.add(a);
    const r=new T.Mesh(new T.CylinderGeometry(.35,.35,.02,16),rotorM);r.position.set(x*.75,.08,z*.75);g.add(r);rotors.push(r);});
  scene.add(g);return {g,eyeM,rotorM,rotors};
}
function makeMech(){
  const g=new T.Group();
  const armor=new T.MeshStandardMaterial({color:0x5a6276,metalness:.7,roughness:.35,emissive:0x141824});
  const dark=new T.MeshStandardMaterial({color:0x15171f,metalness:.8,roughness:.4});
  const warn=neonMat(0xf2e600);
  const eyeM=new T.MeshBasicMaterial({color:0xff2d55,toneMapped:false});
  const hips=new T.Mesh(new T.BoxGeometry(1.5,.5,1.1),dark);hips.position.y=2.0;g.add(hips);
  const torso=new T.Mesh(new T.BoxGeometry(2.1,1.3,1.6),armor);torso.position.y=2.9;g.add(torso);
  const visor=new T.Mesh(new T.BoxGeometry(1.2,.16,.05),eyeM);visor.position.set(0,3.2,.82);g.add(visor);
  const s1=new T.Mesh(new T.BoxGeometry(2.12,.08,1.62),warn);s1.position.y=2.35;g.add(s1);
  const s2=new T.Mesh(new T.BoxGeometry(2.12,.05,1.62),neonMat(0x39f0ff));s2.position.y=3.5;g.add(s2);
  [-1,1].forEach(s=>{const st=new T.Mesh(new T.BoxGeometry(.04,1.0,.04),warn);st.position.set(s*1.06,2.9,.81);g.add(st);});
  const cannons=[];
  [-1,1].forEach(s=>{const sh=new T.Mesh(new T.BoxGeometry(.6,.6,.9),armor);sh.position.set(s*1.35,3.2,0);g.add(sh);
    const c=new T.Mesh(new T.CylinderGeometry(.13,.16,1.1,10).rotateX(Math.PI/2),dark);c.position.set(s*1.35,3.15,.75);g.add(c);
    const tip=new T.Mesh(new T.TorusGeometry(.14,.03,6,16),eyeM);tip.position.set(s*1.35,3.15,1.3);g.add(tip);cannons.push(tip);});
  const legs=[];
  [-1,1].forEach(s=>{const hip=new T.Group();hip.position.set(s*.6,1.95,0);g.add(hip);
    const th=new T.Mesh(new T.BoxGeometry(.45,1.0,.55),armor);th.position.y=-.5;hip.add(th);
    const knee=new T.Group();knee.position.y=-1.0;hip.add(knee);
    const sh=new T.Mesh(new T.BoxGeometry(.4,.95,.45),dark);sh.position.y=-.47;knee.add(sh);
    const ft=new T.Mesh(new T.BoxGeometry(.6,.15,.9),armor);ft.position.set(0,-.92,.12);knee.add(ft);
    legs.push({hip,knee});});
  const ant=new T.Mesh(new T.CylinderGeometry(.02,.02,.9,4),dark);ant.position.set(.6,3.9,-.4);g.add(ant);
  scene.add(g);return {g,eyeM,legs,cannons};
}

/* ---------- entity registry ---------- */
const ENT=new Map(),NPCS=[];
const ST=['idle','walk','flee','aggro','down','dying','gone','leave','pause','runner','patrol','hunt'];
const F_REFERRED=1,F_LATENT=2,F_HACKED=4,F_ATTACK=8,F_AGITATED=16;
let nextEntId=1;
const FIRST=["Haruto","Ren","Sota","Yui","Aoi","Mei","Kaito","Hina","Riku","Sakura","Takumi","Noa","Jun","Emi","Daichi","Mio","Kenji","Yuna","Shin","Rina","Maya","Viktor","Alma","Dex","Lucia","Omar","Ines","Taro"];
const LAST=["Sato","Tanaka","Arai","Fujita","Kono","Oda","Shimizu","Hayase","Morita","Ueda","Nakai","Kimura","Ishida","Okabe","Reyes","Novak"];
function createEntity(spec){
  const e={id:spec.id,kind:spec.kind,spec,name:spec.name,pid:spec.pid,cc:spec.cc||0,role:spec.role||null,group:spec.group||null,state:spec.state||'idle',flags:spec.flags||0,hp:spec.hp||1,rx:0,sc:1,scanned:false,dieT:0,lx:spec.x,lz:spec.z,animSp:0,goneDone:false};
  if(spec.kind==='human'){Object.assign(e,makeHuman(spec.seed,spec.preset));e.tagH=e.umb?2.85:2.15;}
  else if(spec.kind==='drone'){Object.assign(e,makeDrone());e.tagH=.8;}
  else if(spec.kind==='mech'){Object.assign(e,makeMech());e.tagH=4.4;}
  e.g.position.set(spec.x,spec.y||0,spec.z);e.g.rotation.y=spec.yaw||0;
  e.tx=spec.x;e.ty=spec.y||0;e.tz=spec.z;e.tyaw=spec.yaw||0;
  if(e.state==='gone'){e.g.visible=false;e.goneDone=true;}
  if(e.state==='down'){e.g.rotation.x=-Math.PI/2;e.g.position.y=.15;}
  if(spec.role==='victim')goreVictim(e);
  ENT.set(e.id,e);NPCS.push(e);return e;
}
function removeAllEntities(){for(const e of NPCS){scene.remove(e.g);if(e.tagEl)e.tagEl.remove();}ENT.clear();NPCS.length=0;}
const alive=e=>e&&e.state!=='down'&&e.state!=='dying'&&e.state!=='gone'&&e.state!=='leave';
function chestOf(e,out){out=out||new V3();return out.set(e.g.position.x,e.kind==='drone'?e.g.position.y:e.kind==='mech'?2.9:(e.state==='down'?.3:1.3),e.g.position.z);}

/* state-change visuals shared by host and guest */
function onEntState(e,prev,next){
  if(next==='down'){burst(chestOf(e).setY(.6),40,[0x39f0ff,0xffffff,0x66aaff],3,1,.7,.5);SFX.thud();}
  if(next==='dying'){e.dieT=0;}
  if(next==='gone'&&!e.goneDone){e.goneDone=true;
    if(e.kind==='human'&&prev!=='leave'&&GORE.on){goreBurst(e);}
    else if(e.kind==='human'&&prev!=='leave'){const c=chestOf(e);c.y=1.3;burst(c,150,[0xff2d55,0xff7a3a,0x7a0a2a,0xffd0a0],6.5,2.5,1.3,.7);burst(c,40,[0xffffff,0xff9ab0],2,4,.6,-.3);
      const sc=new T.Mesh(new T.CircleGeometry(1.1,24),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.55,depthWrite:false}));sc.rotation.x=-Math.PI/2;sc.position.set(e.g.position.x,.16,e.g.position.z);scene.add(sc);
      const em=new T.Mesh(new T.RingGeometry(1.0,1.15,32),new T.MeshBasicMaterial({color:0xff4020,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));em.rotation.x=-Math.PI/2;em.position.set(e.g.position.x,.17,e.g.position.z);scene.add(em);}
    if(e.kind!=='human'){goreOil(e);burst(e.kind==='mech'?chestOf(e):e.g.position,e.kind==='mech'?220:90,[0xb18cff,0xffffff,0x6040c0],e.kind==='mech'?7:4,1,1.1,.3);}
    e.g.visible=false;if(e.tagEl)e.tagEl.style.display='none';}
}
function setEntState(e,next){const prev=e.state;if(prev===next)return;e.state=next;onEntState(e,prev,next);}

/* per-frame visuals: animation is derived from motion, so the same code drives host and guest */
function animHuman(e,dt){
  const dx=e.g.position.x-e.lx,dz=e.g.position.z-e.lz;e.lx=e.g.position.x;e.lz=e.g.position.z;
  const sp=dt>0?Math.hypot(dx,dz)/dt:0;e.animSp=lerp(e.animSp,sp,1-Math.exp(-10*dt));
  const k=1-Math.exp(-8*dt);
  if(e.state==='down'){e.g.rotation.x=lerp(e.g.rotation.x,-Math.PI/2,1-Math.exp(-7*dt));e.g.position.y=lerp(e.g.position.y,.15,1-Math.exp(-7*dt));
    if(e.role!=='victim'&&Math.random()<dt*5)emit(e.g.position.x+MR(-.4,.4),.4,e.g.position.z+MR(-.4,.4),0,MR(.5,1.5),0,0x39f0ff,.4,0);
    if(e.role==='victim'&&Math.random()<dt*2)emit(e.g.position.x,.3,e.g.position.z,MR(-.2,.2),1.5,MR(-.2,.2),0x2bff9a,.8,-.1);return;}
  if(e.state==='dying'){if(GORE.on){goreSwell(e,dt);return;}e.dieT+=dt;const s=1+e.dieT*1.2;e.g.scale.set(s,s,s);return;}
  if(e.state==='leave'){e.g.scale.set(1,Math.max(.01,e.sc),1);if(e.sc<.98&&Math.random()<dt*30)emit(e.g.position.x+MR(-.3,.3),MR(.2,1.9),e.g.position.z+MR(-.3,.3),MR(-.3,.3),MR(.3,1),MR(-.3,.3),0xe8e8ff,1,-.05);}
  if(e.animSp>.25){e.phase+=e.animSp*dt*2.6;const a=Math.sin(e.phase)*Math.min(.6,e.animSp*.18);e.legL.rotation.x=a;e.legR.rotation.x=-a;e.armL.rotation.x=-a*.8;if(!e.umb)e.armR.rotation.x=a*.8;}
  else{e.legL.rotation.x=lerp(e.legL.rotation.x,0,k);e.legR.rotation.x=lerp(e.legR.rotation.x,0,k);
    if(e.flags&F_AGITATED){e.armL.rotation.x=Math.sin(S.t*6+e.phase)*.35;e.armR.rotation.x=-Math.sin(S.t*6+e.phase)*.35;}
    else{e.armL.rotation.x=lerp(e.armL.rotation.x,Math.sin(S.t*.8+e.phase)*.05,k);if(!e.umb)e.armR.rotation.x=lerp(e.armR.rotation.x,0,k);}}
  if(e.flags&F_ATTACK)e.armR.rotation.x=-2.3;
}
function animDrone(e,dt){
  e.rotors.forEach(r=>r.rotation.y+=dt*40);
  const hacked=!!(e.flags&F_HACKED);const want=hacked?0xff2d55:0x39f0ff;
  if(e._hk!==hacked){e._hk=hacked;e.eyeM.color.setHex(want);e.rotorM.color.setHex(want);}
  if(e.state==='dying'){e.dieT+=dt;const s=Math.max(.01,1-e.dieT/.6);e.g.scale.setScalar(s);e.g.rotation.y+=dt*12;if(Math.random()<.6)burst(e.g.position,6,[0xb18cff,0xffffff],3,0,.6,.2);}
}
function animMech(e,dt){
  const dx=e.g.position.x-e.lx,dz=e.g.position.z-e.lz;e.lx=e.g.position.x;e.lz=e.g.position.z;
  const sp=dt>0?Math.hypot(dx,dz)/dt:0;e.animSp=lerp(e.animSp,sp,1-Math.exp(-6*dt));
  if(e.state==='dying'){e.dieT+=dt;e.g.rotation.z=Math.sin(e.dieT*40)*.05;const s=Math.max(.01,1-e.dieT/1.0);e.g.scale.setScalar(s);if(Math.random()<.8)burst(chestOf(e),8,[0xb18cff,0xffffff],4,0,.6,.2);return;}
  const prevPh=e.phase;e.phase+=e.animSp*dt*1.6;const a=Math.sin(e.phase)*Math.min(.45,e.animSp*.25);
  e.legs[0].hip.rotation.x=a;e.legs[1].hip.rotation.x=-a;e.legs[0].knee.rotation.x=Math.max(0,-a)*.9;e.legs[1].knee.rotation.x=Math.max(0,a)*.9;
  if(e.animSp>.2&&Math.floor(prevPh/Math.PI)!==Math.floor(e.phase/Math.PI)){if(camera.position.distanceTo(e.g.position)<30)SFX.stomp();}
  e.eyeM.color.setHex(e.flags&F_ATTACK?0xffffff:0xff2d55);
}
function animEntity(e,dt){
  if(e.state==='gone'){if(e.g.visible){onEntState(e,'dying','gone');}return;}
  if(e.kind==='human')animHuman(e,dt);else if(e.kind==='drone')animDrone(e,dt);else animMech(e,dt);
}

/* ---------- partner avatar ---------- */
function makeAvatar(seed){
  const h=makeHuman(seed,'inspector');
  const gun=buildGun(h.armR,false);gun.root.scale.setScalar(1.5);gun.root.position.set(0,-.66,.05);gun.root.rotation.set(-Math.PI/2,0,Math.PI);
  const av=Object.assign(h,{gun,lx:0,lz:0,animSp:0,tx:0,tz:0,tyaw:0,tpitch:0,state:'walk',flags:0,role:'partner',kind:'human',sc:1});
  av.g.visible=false;return av;
}
