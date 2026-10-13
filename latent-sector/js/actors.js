"use strict";
/* ============ actors: people, machines, the Arbiter sidearm ============ */
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,3,r??Math.min(w,h,d)*.32);

/* ---------- the Arbiter (first person, partner's hand, cutscenes) ---------- */
const MODES={
  locked:{c:0x6d8fa8,css:'#8fa8bf',name:'TRIGGER LOCKED',jp:'施錠'},
  paralyzer:{c:0x39f0ff,css:'#39f0ff',name:'PARALYZER',jp:'麻痺'},
  lethal:{c:0xff2d55,css:'#ff2d55',name:'LETHAL',jp:'致死'},
  decon:{c:0xb18cff,css:'#b18cff',name:'DECONSTRUCT',jp:'分解'}};
const MODE_IDX=['locked','paralyzer','lethal','decon'];
function buildGun(parent,withDisplay){
  const root=new T.Group();parent.add(root);
  const shell=new T.MeshPhysicalMaterial({color:0x10141c,metalness:.75,roughness:.28,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.4});
  const plate=new T.MeshPhysicalMaterial({color:0x5c6a80,metalness:.85,roughness:.22,clearcoat:.8,clearcoatRoughness:.1,envMapIntensity:1.6});
  const rubber=new T.MeshStandardMaterial({color:0x0b0c10,metalness:.1,roughness:.85});
  const glow=new T.MeshBasicMaterial({color:0x6d8fa8,toneMapped:false});
  const parts=[];
  const P=(geo,mat,cfg)=>{const m=new T.Mesh(geo,mat);root.add(m);const st={};for(const k of MODE_IDX)st[k]=Object.assign({p:[0,0,0],r:[0,0,0],s:[1,1,1]},cfg.all||{},cfg[k]||cfg.locked||{});m.position.set(...st.locked.p);m.rotation.set(...st.locked.r);m.scale.set(...st.locked.s);parts.push({m,st});return m;};
  P(RB(.058,.155,.085,.02),rubber,{all:{p:[0,-.095,.07],r:[.28,0,0]}});
  P(RB(.086,.088,.3,.03),shell,{all:{p:[0,0,-.05]}});
  P(new T.BoxGeometry(.004,.012,.24),glow,{all:{p:[-.0435,.012,-.06]}});
  P(new T.BoxGeometry(.004,.012,.24),glow,{all:{p:[.0435,.012,-.06]}});
  const sh=s=>({locked:{p:[s*.022,.062,-.07]},paralyzer:{p:[s*.027,.066,-.08],r:[0,0,s*-.1]},lethal:{p:[s*.052,.078,-.1],r:[0,0,s*-.5]},decon:{p:[s*.078,.058,-.13],r:[0,0,s*-1.15],s:[1,1,1.15]}});
  P(RB(.046,.034,.26,.014),plate,sh(-1));P(RB(.046,.034,.26,.014),plate,sh(1));
  P(new T.BoxGeometry(.01,.006,.22),glow,{locked:{p:[0,.081,-.07],s:[1,1,.25]},paralyzer:{p:[0,.084,-.07]},lethal:{p:[0,.088,-.08],s:[2.2,1,1.1]},decon:{p:[0,.072,-.1],s:[3.4,1,1.25]}});
  const fin=s=>({locked:{p:[s*.05,-.004,-.04]},paralyzer:{p:[s*.053,0,-.06]},lethal:{p:[s*.088,0,-.1],r:[0,s*.28,0]},decon:{p:[s*.115,.005,-.16],r:[0,s*.5,s*.2],s:[1,1.3,1.35]}});
  P(RB(.01,.072,.18,.004),plate,fin(-1));P(RB(.01,.072,.18,.004),plate,fin(1));
  const fg=s=>({locked:{p:[s*.05,-.004,-.04],s:[1,.2,.2]},paralyzer:{p:[s*.058,0,-.06],s:[1,.6,.8]},lethal:{p:[s*.094,0,-.1],r:[0,s*.28,0]},decon:{p:[s*.122,.005,-.16],r:[0,s*.5,s*.2],s:[1,1.3,1.35]}});
  P(new T.BoxGeometry(.005,.04,.14),glow,fg(-1));P(new T.BoxGeometry(.005,.04,.14),glow,fg(1));
  P(new T.CylinderGeometry(.021,.025,.12,28).rotateX(Math.PI/2),shell,{locked:{p:[0,0,-.23],s:[1,1,.6]},paralyzer:{p:[0,0,-.24],s:[1,1,.9]},lethal:{p:[0,0,-.27],s:[1.25,1.25,1.4]},decon:{p:[0,0,-.28],s:[1.9,1.9,1.2]}});
  const ring=P(new T.TorusGeometry(.03,.006,12,40),glow,{locked:{p:[0,0,-.265],s:[.8,.8,.8]},paralyzer:{p:[0,0,-.295]},lethal:{p:[0,0,-.345],s:[1.35,1.35,1.35]},decon:{p:[0,0,-.36],s:[2.3,2.3,2.3]}});
  P(new T.TorusGeometry(.045,.004,12,48),glow,{locked:{p:[0,0,-.2],s:[.001,.001,.001]},paralyzer:{p:[0,0,-.22],s:[.001,.001,.001]},lethal:{p:[0,0,-.31],s:[1.1,1.1,1.1]},decon:{p:[0,0,-.33],r:[0,0,.8],s:[1.9,1.9,1.9]}});
  P(RB(.05,.026,.14,.011),plate,{locked:{p:[0,-.056,-.12]},paralyzer:{p:[0,-.058,-.13]},lethal:{p:[0,-.078,-.16],r:[.25,0,0]},decon:{p:[0,-.088,-.2],r:[.42,0,0],s:[1.4,1,1.2]}});
  // fixed detail: trigger guard, sight rail, rear cap, emitter lens
  {const tg=new T.Mesh(new T.TorusGeometry(.03,.006,8,24,Math.PI),shell);tg.rotation.set(0,Math.PI/2,Math.PI);tg.position.set(0,-.045,.02);root.add(tg);
   const rail=new T.Mesh(RB(.022,.012,.12,.005),rubber);rail.position.set(0,.05,.02);root.add(rail);
   const cap=new T.Mesh(new T.CylinderGeometry(.034,.034,.02,24).rotateX(Math.PI/2),plate);cap.position.set(0,0,.1);root.add(cap);
   const lens=new T.Mesh(new T.CircleGeometry(.016,24),glow);lens.position.set(0,0,-.2);root.add(lens);
   for(let i=0;i<4;i++){const v=new T.Mesh(RB(.09,.004,.012,.002),rubber);v.position.set(0,.02-i*.012,.07);root.add(v);}}
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
  const shell=new T.MeshPhysicalMaterial({color:0x2a3248,metalness:.85,roughness:.22,clearcoat:1,clearcoatRoughness:.1});
  const body=new T.Mesh(new T.SphereGeometry(.55,40,24),shell);body.scale.y=.55;g.add(body);
  const eyeM=new T.MeshBasicMaterial({color:0x39f0ff,toneMapped:false});
  const eye=new T.Mesh(new T.TorusGeometry(.42,.04,6,30),eyeM);eye.rotation.x=Math.PI/2;g.add(eye);
  const lens=new T.Mesh(new T.SphereGeometry(.13,12,8),eyeM);lens.position.set(0,-.15,.38);g.add(lens);
  const rotorM=new T.MeshBasicMaterial({color:0x39f0ff,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
  const rotors=[];
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([x,z])=>{const a=new T.Mesh(RB(.7,.06,.09,.025),shell);a.position.set(x*.45,0,z*.45);a.rotation.y=-Math.atan2(z,x);g.add(a);
    const r=new T.Mesh(new T.CylinderGeometry(.35,.35,.02,32),rotorM);const hub=new T.Mesh(new T.CylinderGeometry(.06,.06,.08,16),shell);hub.position.set(x*.75,.03,z*.75);g.add(hub);r.position.set(x*.75,.08,z*.75);g.add(r);rotors.push(r);});
  scene.add(g);return {g,eyeM,rotorM,rotors};
}
function makeMech(){
  const g=new T.Group();
  const armor=new T.MeshPhysicalMaterial({color:0x5a6276,metalness:.75,roughness:.3,clearcoat:.7,clearcoatRoughness:.2,emissive:0x0c1018});
  const dark=new T.MeshStandardMaterial({color:0x15171f,metalness:.8,roughness:.4});
  const warn=neonMat(0xf2e600);
  const eyeM=new T.MeshBasicMaterial({color:0xff2d55,toneMapped:false});
  const hips=new T.Mesh(RB(1.5,.5,1.1,.12),dark);hips.position.y=2.0;g.add(hips);
  const torso=new T.Mesh(RB(2.1,1.3,1.6,.28),armor);torso.position.y=2.9;g.add(torso);
  const visor=new T.Mesh(RB(1.2,.16,.05,.02),eyeM);visor.position.set(0,3.2,.82);g.add(visor);
  const s1=new T.Mesh(RB(2.14,.08,1.64,.03),warn);s1.position.y=2.35;g.add(s1);
  const s2=new T.Mesh(RB(2.14,.05,1.64,.02),neonMat(0x39f0ff));s2.position.y=3.5;g.add(s2);
  [-1,1].forEach(s=>{const st=new T.Mesh(new T.BoxGeometry(.04,1.0,.04),warn);st.position.set(s*1.06,2.9,.81);g.add(st);});
  const cannons=[];
  [-1,1].forEach(s=>{const sh=new T.Mesh(RB(.6,.6,.9,.16),armor);sh.position.set(s*1.35,3.2,0);g.add(sh);
    const c=new T.Mesh(new T.CylinderGeometry(.13,.16,1.1,10).rotateX(Math.PI/2),dark);c.position.set(s*1.35,3.15,.75);g.add(c);
    const tip=new T.Mesh(new T.TorusGeometry(.14,.03,6,16),eyeM);tip.position.set(s*1.35,3.15,1.3);g.add(tip);cannons.push(tip);});
  const legs=[];
  [-1,1].forEach(s=>{const hip=new T.Group();hip.position.set(s*.6,1.95,0);g.add(hip);
    const th=new T.Mesh(RB(.45,1.0,.55,.12),armor);th.position.y=-.5;hip.add(th);
    const knee=new T.Group();knee.position.y=-1.0;hip.add(knee);
    const sh=new T.Mesh(RB(.4,.95,.45,.1),dark);sh.position.y=-.47;knee.add(sh);
    const ft=new T.Mesh(RB(.6,.15,.9,.06),armor);ft.position.set(0,-.92,.12);knee.add(ft);
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
  if(spec.kind==='human'){Object.assign(e,makeCharacter(spec.seed,spec.preset));e.umb=!!e.umbMesh;e.tagH=e.umb?2.6:2.1;}
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
const _fw=new V3(),_up3=new V3(0,1,0);
function setW(e,dt,want){const k=1-Math.exp(-7*dt);for(const n in e.acts){e.w[n]=lerp(e.w[n],want[n]||0,k);e.acts[n].setEffectiveWeight(e.w[n]);}}
function animHuman(e,dt){
  const dx=e.g.position.x-e.lx,dz=e.g.position.z-e.lz;e.lx=e.g.position.x;e.lz=e.g.position.z;
  const sp=dt>0?Math.min(9,Math.hypot(dx,dz)/dt):0;e.animSp=lerp(e.animSp,sp,1-Math.exp(-10*dt));
  // distance culling and reduced animation rate far away
  const dist=camera.position.distanceTo(e.g.position);
  if(!e.goneDone&&e.state!=='gone')e.g.visible=dist<(QUALITY.high?78:58)||!!e.keep;
  if(!e.g.visible)return;
  if(e.state==='down'){
    if(!e.downInit){e.downInit=true;e.mixer.stopAllAction();e.downT=0;if(e.shadow)e.shadow.visible=false;}
    e.downT+=dt;const k=Math.min(1,e.downT/.5),ease=k*k;
    e.g.rotation.x=lerp(0,-Math.PI/2,ease);e.g.position.y=lerp(e.g.position.y,.05,1-Math.exp(-8*dt));
    // limp: arms drop to the sides, knees bend a little
    const B=e.bones;if(B.LeftArm&&!e.limpDone){e.limpDone=k>=1;
      _fw.set(0,-1,0).applyQuaternion(e.g.quaternion);pointBone(B.LeftArm,B.LeftForeArm,_fw.clone().add(new V3(.35,0,0)).normalize(),.3);pointBone(B.RightArm,B.RightForeArm,_fw.clone().add(new V3(-.35,0,0)).normalize(),.3);}
    if(e.role!=='victim'&&Math.random()<dt*5)emit(e.g.position.x+MR(-.4,.4),.4,e.g.position.z+MR(-.4,.4),0,MR(.5,1.5),0,0x39f0ff,.4,0);
    if(e.role==='victim'&&Math.random()<dt*2)emit(e.g.position.x,.3,e.g.position.z,MR(-.2,.2),1.5,MR(-.2,.2),0x2bff9a,.8,-.1);return;}
  if(e.state==='dying'){if(GORE.on){goreSwell(e,dt);return;}e.dieT+=dt;const s=1+e.dieT*1.2;e.g.scale.set(s,s,s);return;}
  if(e.state==='leave'){e.g.scale.set(1,Math.max(.01,e.sc),1);if(e.sc<.98&&Math.random()<dt*30)emit(e.g.position.x+MR(-.3,.3),MR(.2,1.9),e.g.position.z+MR(-.3,.3),MR(-.3,.3),MR(.3,1),MR(-.3,.3),0xe8e8ff,1,-.05);}
  // blend idle / walk / run / agitated from actual movement speed
  const v=e.animSp,want={};
  if(v>3.4){want.run=1;}else if(v>.3){const t=clamp((v-2.4)/1,0,1);want.walk=1-t;want.run=t;}
  else want[(e.flags&F_AGITATED)&&e.acts.headShake?'headShake':'idle']=1;
  setW(e,dt,want);
  if(e.acts.walk)e.acts.walk.timeScale=clamp(v/1.3,.6,1.9);if(e.acts.run)e.acts.run.timeScale=clamp(v/4.2,.7,1.5);
  e.mixT+=dt;const every=dist<28?1:dist<50?2:4;e.frameN=(e.frameN||0)+1;
  if(e.frameN%every===0){e.mixer.update(e.mixT);e.mixT=0;}
  const B=e.bones;
  if(e.umbMesh&&B.LeftArm){ // hold the umbrella: forearm up in front, stick follows the hand
    _fw.set(.15,-.75,.65).applyQuaternion(e.g.quaternion).normalize();pointBone(B.LeftArm,B.LeftForeArm,_fw,.85);
    _fw.set(-.1,.95,.3).applyQuaternion(e.g.quaternion).normalize();pointBone(B.LeftForeArm,B.LeftHand,_fw,.9);
    B.LeftHand.getWorldPosition(_bw);e.g.worldToLocal(_bw);e.umbMesh.position.set(_bw.x,_bw.y-.42,_bw.z);}
  if(e.flags&F_ATTACK&&B.RightArm){_fw.set(0,.9,.5).applyQuaternion(e.g.quaternion).normalize();pointBone(B.RightArm,B.RightForeArm,_fw);_fw.set(0,.2,1).applyQuaternion(e.g.quaternion).normalize();pointBone(B.RightForeArm,B.RightHand,_fw);}
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
  const h=makeCharacter(seed,'inspector');
  const holder=new T.Group();const gun=buildGun(holder,false);gun.root.scale.setScalar(1.15);
  const rh=h.g.worldToLocal(h.bones.RightHand.getWorldPosition(new V3()));
  attachRest(h.bones.RightHand,holder,rh.add(new V3(-.07,-.02,0)),new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI/2,0)),h.g);
  const av=Object.assign(h,{gun,lx:0,lz:0,animSp:0,tx:0,tz:0,tyaw:0,tpitch:0,state:'walk',flags:0,role:'partner',kind:'human',sc:1,keep:true,umb:false});
  av.g.visible=false;return av;
}
