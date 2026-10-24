// =====================================================================
// THE GATEKEEPER TWINS, REMASTERED
// Boss framework: twin bosses (Caotan / Omar), AI allies, hazards, HUD.
// Everything here plugs into the base game through small wrappers.
// =====================================================================
const TW={foes:[],hz:[],allies:[],fight:null,barkT:0,cutin:null,dark:null,vn:null,glints:[],big:null,t:0};
const twP=()=>Player;
const twPlay=()=>Game.state==='play'&&!Game.dlg;
function twAng(a,b){ return Math.atan2(b.z-a.z,b.x-a.x); }
function twDist(a,b){ return Math.hypot(b.x-a.x,b.z-a.z); }
function twSp(T){ return 1+((T&&T.phase||1)-1)*.1+(ALI()?.1:0); }
function twBounds(){ const F=TW.fight; return F&&(F.bounds||F.lock)||L.arena||{x0:2,x1:(L&&L.w||200)-2,z0:2,z1:(L&&L.d||200)-2}; }
function twLock(){ const B=twBounds(), P=Player, hw=Math.min(12.5,(B.x1-B.x0)/2), hd=Math.min(9.5,(B.z1-B.z0)/2); let x0=P.x-hw,x1=P.x+hw,z0=P.z-hd,z1=P.z+hd;
  if(x0<B.x0){ x1+=B.x0-x0; x0=B.x0; } if(x1>B.x1){ x0-=x1-B.x1; x1=B.x1; } if(z0<B.z0){ z1+=B.z0-z0; z0=B.z0; } if(z1>B.z1){ z0-=z1-B.z1; z1=B.z1; } return {x0,x1,z0,z1}; }
function twClampXZ(x,z,m){ const A=twBounds(); m=m||.8; return {x:clamp(x,A.x0+m,A.x1-m),z:clamp(z,A.z0+m,A.z1-m)}; }
function twCenter(){ const A=twLock(); return {x:(A.x0+A.x1)/2,z:(A.z0+A.z1)/2}; }
function twRandIn(m){ const A=twLock(); m=m||1.5; return {x:rnd(A.x0+m,A.x1-m),z:rnd(A.z0+m,A.z1-m)}; }

// ---------- extra sound effects (synthesised like the base game's) ----------
const TW_SFX={
  ting(){ Sound.tone('sine',2600,4200,.18,.16); Sound.tone('sine',5200,5600,.3,.08,.05); Sound.hiss(9000,.15,.05,'highpass'); },
  kyun(){ Sound.tone('square',900,1800,.08,.07); Sound.tone('square',1200,2400,.08,.07,.09); Sound.tone('sine',2400,3200,.2,.08,.18); },
  tick(){ Sound.tone('square',1800,1700,.04,.08); Sound.hiss(4000,.03,.05,'highpass'); },
  gong(){ Sound.tone('sine',110,90,2.2,.3); Sound.tone('sine',165,140,1.6,.14); Sound.tone('triangle',55,50,2.6,.22); },
  whoosh(){ Sound.hiss(700,.35,.14,'bandpass'); Sound.hiss(1400,.25,.08,'bandpass',.08); },
  doki(){ Sound.tone('sine',90,60,.18,.35); Sound.tone('sine',90,60,.18,.3,.22); },
  vnblip(){ Sound.tone('square',1400,1500,.05,.05); },
  sparkle(){ for(let i=0;i<5;i++) Sound.tone('sine',1800+i*420,2200+i*420,.12,.05,i*.05); },
  wrong(){ Sound.tone('sawtooth',220,110,.35,.12); Sound.tone('sawtooth',233,116,.35,.1); },
  right(){ Sound.tone('square',880,880,.08,.08); Sound.tone('square',1320,1320,.16,.08,.09); },
  fuse(){ Sound.tone('sawtooth',80,600,1.2,.16); Sound.hiss(2000,1.2,.12,'bandpass'); },
  void(){ Sound.tone('sine',60,30,1.6,.32); Sound.hiss(300,1.4,.18,'lowpass'); }
};
(function(){ const base=Sound.sfx; Sound.sfx=function(n){ if(TW_SFX[n]){ if(this.ctx&&!this.muted) try{ TW_SFX[n](); }catch(e){} return; } return base.call(this,n); }; })();

// ---------- small procedural textures ----------
const TWTX={};
function twTex(key,w,h,draw,outline){ if(TWTX[key]) return TWTX[key]; const [cv,c]=mkCanvas(w,h); draw(c,w,h); if(outline!==false) outlinePass(c,w,h,OUT); const t=tex(cv); t.encoding=THREE.sRGBEncoding; TWTX[key]=t; return t; }
function texHeart(col){ return twTex('heart'+col,16,16,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); P(2,3,5,4,col); P(9,3,5,4,col); P(1,5,14,4,col); P(3,9,10,2,col); P(5,11,6,2,col); P(7,13,2,1,col); P(3,4,2,2,'#ffffff'); }); }
function texLetter(){ return twTex('letter',24,16,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); P(1,2,22,13,'#fff4f8'); P(1,2,22,1,'#e8c0d0'); for(let i=0;i<11;i++){ P(1+i,3+i*.6|0,1,1,'#e0a8c0'); P(22-i,3+i*.6|0,1,1,'#e0a8c0'); } P(9,7,6,5,'#ff3a7a'); P(10,6,2,2,'#ff3a7a'); P(13,6,2,2,'#ff3a7a'); P(10,7,1,1,'#ffd0e0'); }); }
function texPillow(){ return twTex('pillow',20,56,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k);
  P(2,1,16,54,'#fbf6f8'); P(2,1,2,54,'#e8dce4'); P(16,1,2,54,'#efe4ec'); P(3,0,14,1,'#e8dce4'); P(3,55,14,1,'#e8dce4');
  // a very innocent anime girl. she is a pillow. she has seen things.
  P(4,4,12,10,'#ff8ac8'); P(3,6,2,16,'#ff8ac8'); P(15,6,2,16,'#ff8ac8'); P(5,10,10,9,'#ffe2d0'); P(5,8,10,3,'#ff8ac8');
  P(6,12,3,3,'#3a6aff'); P(11,12,3,3,'#3a6aff'); P(7,12,1,1,'#fff'); P(12,12,1,1,'#fff'); P(5,15,2,1,'#ff9aa8'); P(13,15,2,1,'#ff9aa8'); P(9,17,2,1,'#c0405a');
  P(5,20,10,12,'#ffffff'); P(5,20,10,2,'#3a3a8a'); P(8,22,4,3,'#ff3a5a'); P(4,32,12,10,'#3a3a8a'); P(5,42,4,10,'#ffe2d0'); P(11,42,4,10,'#ffe2d0'); P(6,25,8,1,'#e8e8f0'); }); }
function texStar(){ return twTex('star',32,32,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); P(15,0,2,32,'#ffffff'); P(0,15,32,2,'#ffffff'); P(14,8,4,16,'#ffffff'); P(8,14,16,4,'#ffffff'); P(13,13,6,6,'#ffffff'); for(let i=0;i<6;i++){ P(9+i,9+i,2,2,'#dff4ff'); P(21-i,9+i,2,2,'#dff4ff'); } },false); }
function texHand(){ return twTex('hand',16,24,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); const b='#d8c8f0', d='#8a6ab8';
  P(5,12,7,12,b); P(5,12,2,12,d); P(3,4,2,9,b); P(6,1,2,12,b); P(9,0,2,13,b); P(12,3,2,10,b); P(1,10,3,4,b); P(4,15,9,2,d); P(6,19,6,1,d); for(const x of [3,6,9,12]) P(x,6,2,1,d); }); }
function texEyes(){ return twTex('eyes',24,8,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); P(2,2,7,4,'#ff1a2a'); P(15,2,7,4,'#ff1a2a'); P(4,3,3,2,'#ffd0d0'); P(17,3,3,2,'#ffd0d0'); P(1,1,9,1,'#5a0008'); P(14,1,9,1,'#5a0008'); },false); }
function texSoul(){ return twTex('soul',16,20,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); P(4,2,8,9,'#bfe8ff'); P(3,4,10,6,'#bfe8ff'); P(5,11,6,4,'#8ac8ff'); P(7,15,3,4,'#5a9aff'); P(5,5,2,2,'#14203a'); P(9,5,2,2,'#14203a'); P(6,9,4,1,'#14203a'); }); }
function texHourglass(){ return twTex('hg',24,32,c=>{ const P=(x,y,w,h,k)=>R(c,x,y,w,h,k); P(2,0,20,3,'#c9a24a'); P(2,29,20,3,'#c9a24a'); for(let i=0;i<12;i++){ const w=18-i*1.4|0; P(12-w/2|0,3+i,w,1,'#bfe0ff'); P(12-w/2|0,28-i,w,1,'#bfe0ff'); } P(9,20,6,8,'#ffd27a'); P(11,14,2,6,'#ffd27a'); }); }
function texCrack(){ return twTex('crack',32,32,c=>{ c.strokeStyle='#ff2a4a'; c.lineWidth=2; for(let k=0;k<5;k++){ c.beginPath(); let x=16,y=16; c.moveTo(x,y); for(let i=0;i<5;i++){ x+=rnd(-6,6); y+=rnd(-6,6); c.lineTo(x,y); } c.stroke(); } },false); }
// a billboard that faces the camera like the game's sprites
function twBB(t,w,h,o){ o=o||{}; const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:o.add?0:.35,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide,fog:false,color:o.col!=null?o.col:0xffffff,opacity:o.op!=null?o.op:1}));
  m.rotation.x=o.flat?-Math.PI/2:TILT; m.renderOrder=o.ro||4; m.userData.tw=1; scene.add(m); return m; }
function twGlow(col,s){ const g=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); g.scale.set(s,s,1); g.userData.tw=1; scene.add(g); return g; }
function twRm(m){ if(m){ scene.remove(m); if(m.geometry&&m.geometry.dispose) m.geometry.dispose(); } }

// ---------- hazards: each is {upd(dt,play)->keep?, kill()} ----------
function twHz(h){ h.t=h.t||0; TW.hz.push(h); return h; }
function twClearHz(){ for(const h of TW.hz){ try{ h.kill&&h.kill(); }catch(e){} } TW.hz=[]; scene.children.filter(o=>o.userData&&o.userData.tw).forEach(o=>scene.remove(o)); }
// player damage: unblockable attacks also pierce Ali's "I block everything" guard
function twHitP(dmg,sx,sz,o){ o=o||{}; const op={}; if(o.ub){ op.unblockable=true; if(ALI()) op.pierce=true; } if(o.heavy) op.heavy=true; if(o.melee) op.melee=true; if(o.pierce) op.pierce=true; if(o.onParry) op.onParry=o.onParry;
  return playerHit(dmg,sx,sz,op); }
function twInR(x,z,r,hmax){ const P=twP(); return Math.hypot(P.x-x,P.z-z)<r&&(hmax==null||P.y<groundY(x,z)+hmax); }
// ground circle telegraph -> boom
function twBlast(x,z,r,delay,o){ o=o||{}; const col=o.col||0xff3a6a, mk=FX.marker(x,z,r,col,delay+.05);
  return twHz({upd(dt,play){ if(play) this.t+=dt; if(this.t<delay) return true; const gy=groundY(x,z);
    FX.ring(x,gy,z,o.ring||'#ffb0d0',r*1.4,.4); FX.burst(x,gy+.3,z,o.n||22,o.burst||col,o.sp||5,.3,true); if(o.dark) FX.burst(x,gy+.3,z,14,0x140a1a,4,.4,false);
    if(!o.quiet){ Sound.sfx(o.sfx||'slam'); shake(o.shake||.22); }
    if(o.onBoom) o.onBoom(x,z); if(play) twAllyAoE(x,z,r,o.dmg||2); if(play&&twInR(x,z,r,o.h||2.2)){ const res=twHitP(o.dmg||2,x,z,{ub:o.ub!==false}); if(o.onHit&&res==='hit') o.onHit(); } return false; },
    kill(){ if(mk) scene.remove(mk.m); }}); }
// beam along the ground at chest height, with a blinking telegraph strip first
function twBeam(o){ o=Object.assign({w:1,len:26,warn:.7,dur:.3,dmg:2,col:0xff5aa8,core:0xffffff,y:1,ub:true},o); if(typeof o.ang==='function'&&o.jump==null){ o.jump=true; o.y=.45; }
  const strip=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:o.col,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  strip.geometry.translate(.5,0,0); strip.rotation.x=-Math.PI/2; strip.userData.tw=1; scene.add(strip); let mm=null, fired=false;
  const ang=()=>typeof o.ang==='function'?o.ang(this_t()):o.ang; let tt=0; const this_t=()=>tt;
  const ox=()=>typeof o.x==='function'?o.x(tt):o.x, oz=()=>typeof o.z==='function'?o.z(tt):o.z;
  return twHz({upd(dt,play){ if(play) tt+=dt; const a=ang(), x=ox(), z=oz(), gy=groundY(x,z), act=tt>=o.warn&&tt<o.warn+o.dur;
    strip.position.set(x,gy+.06,z); strip.rotation.z=-a; strip.scale.set(o.len,o.w*(act?1:.35+.25*(Math.floor(tt*14)%2)),1); strip.material.opacity=act?.2:.45;
    if(act&&!fired){ fired=true; mm=[beamMesh(o.col,.32*o.w),beamMesh(o.core,.12*o.w)]; mm.forEach(m=>m.userData.tw=1); Sound.sfx(o.sfx||'beam'); shake(.2); if(o.onFire) o.onFire(); }
    if(mm){ const k=act?Math.min(1,(tt-o.warn)/.05)*Math.min(1,(o.warn+o.dur-tt)/.08):0; for(const m of mm){ m.position.set(x,gy+o.y,z); m.lookAt(x+Math.cos(a),gy+o.y,z+Math.sin(a)); m.scale.set(Math.max(.01,k*(1+Math.sin(tt*60)*.1)),Math.max(.01,k*(1+Math.sin(tt*60)*.1)),o.len); }
      if(act&&play){ const P=twP(), px=P.x-x, pz=P.z-z, ux=Math.cos(a), uz=Math.sin(a), al=px*ux+pz*uz, pe=Math.abs(px*uz-pz*ux);
        if(al>-.3&&al<o.len&&pe<o.w*.5+.25&&P.y<gy+(o.jump?.8:2.6)) twHitP(o.dmg,x+ux*al,z+uz*al,{ub:o.ub}); twAllyLine(x,z,ux,uz,o.len,o.w*.5+.25,o.dmg);
        if(Math.random()<.7) FX.spawn(x+ux*rnd(0,o.len),gy+o.y,z+uz*rnd(0,o.len),rnd(-1,1),rnd(.5,2),rnd(-1,1),.3,o.col,.3,0,true); } }
    return tt<o.warn+o.dur; },
    kill(){ scene.remove(strip); if(mm) mm.forEach(m=>scene.remove(m)); }}); }
// expanding ground ring: jump it
function twWave(x,z,o){ o=Object.assign({sp:7,max:11,col:0xff7ab0,dmg:2,delay:0},o); let r=.5, hit=false, m=null; const gy=groundY(x,z);
  return twHz({upd(dt,play){ if(!play) return true; if(o.delay>0){ o.delay-=dt; return true; }
    if(!m){ m=new THREE.Mesh(new THREE.RingGeometry(.86,1,56),new THREE.MeshBasicMaterial({color:o.col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; m.position.set(x,gy+.08,z); m.userData.tw=1; scene.add(m); }
    r+=o.sp*dt; m.scale.setScalar(r); m.material.opacity=Math.max(0,1-r/o.max);
    twAllyRing(x,z,r,o.dmg); const P=twP(), d=Math.hypot(P.x-x,P.z-z); if(!hit&&Math.abs(d-r)<.45&&P.y<gy+.6){ if(twHitP(o.dmg,x,z,{ub:true})!=='none') hit=true; }
    if(Math.random()<.5){ const a=rnd(0,6.28); FX.spawn(x+Math.cos(a)*r,gy+.2,z+Math.sin(a)*r,0,rnd(1,2.5),0,.35,o.col,.25,4,true); } return r<o.max; },
    kill(){ if(m) scene.remove(m); }}); }
// a lingering zone that slows (puddle) or hurts (void) the player
function twZone(x,z,r,dur,o){ o=o||{}; const gy=groundY(x,z), m=new THREE.Mesh(new THREE.CircleGeometry(r,32),new THREE.MeshBasicMaterial({color:o.col||0xf8f4ff,transparent:true,opacity:0,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending}));
  m.rotation.x=-Math.PI/2; m.position.set(x,gy+.05,z); m.userData.tw=1; scene.add(m); let tick=0;
  return twHz({upd(dt,play){ if(play) this.t+=dt; const k=Math.min(1,this.t*4)*Math.min(1,(dur-this.t)*2); m.material.opacity=(o.op||.75)*k; tick-=dt;
    if(play&&this.t>.2&&twInR(x,z,r,.6)){ const P=twP(); if(o.slow){ P.x-=P.vx*dt*o.slow; P.z-=P.vz*dt*o.slow; if(Math.random()<.2) FX.spawn(P.x,P.y+.1,P.z,0,.6,0,.4,0xffffff,.2,0,false); }
      if(o.dmg&&tick<=0){ tick=o.every||.6; twHitP(o.dmg,x,z,{ub:true}); } }
    if(o.fx&&Math.random()<o.fx) FX.spawn(x+rnd(-r,r)*.7,gy+.1,z+rnd(-r,r)*.7,0,rnd(.5,1.5),0,.6,o.fxCol||0xffffff,.25,0,true); return this.t<dur; },
    kill(){ scene.remove(m); }}); }
// gravity well
function twPull(x,z,str,dur,o){ o=o||{}; return twHz({upd(dt,play){ if(play) this.t+=dt; const P=twP(); if(play&&P.dash<=0&&!P.hidden){ const dx=x-P.x, dz=z-P.z, d=Math.hypot(dx,dz)||1; if(d<(o.r||16)&&d>.4){ const k=str*(o.flat?1:Math.min(1.4,2.2/Math.sqrt(d))); P.x+=dx/d*k*dt; P.z+=dz/d*k*dt; const s=twClampXZ(P.x,P.z,.3); P.x=s.x; P.z=s.z; } }
    if(Math.random()<.8){ const a=rnd(0,6.28), r=rnd(2,6); FX.spawn(x+Math.cos(a)*r,groundY(x,z)+rnd(.2,2),z+Math.sin(a)*r,-Math.cos(a)*r*1.2,0,-Math.sin(a)*r*1.2,.6,o.col||0x8a2aff,.3,0,true); }
    return this.t<dur; }}); }
// a hostile projectile through the base game's bolt system (deflectable / parryable)
function twBolt(T,o){ return spawnProj(Object.assign({src:T,dmg:2,life:4},o)); }
function twAimBolt(T,kind,sx,sy,sz,sp,off,o){ const P=twP(), a=Math.atan2(P.z-sz,P.x-sx)+(off||0), d=Math.hypot(P.x-sx,P.z-sz)||1, vy=((P.y+1.1)-sy)/d*sp;
  return twBolt(T,Object.assign({kind,x:sx,y:sy,z:sz,vx:Math.cos(a)*sp,vz:Math.sin(a)*sp,vy},o||{})); }

// ---------- boss entities ----------
function twMake(who,x,z,o){ const T=Object.assign({who,x,z,y:groundY(x,z)+1.3,hy:1.3,hp:100,maxHp:100,phase:1,gen:null,wait:0,cd:1.4,t:rnd(0,3),f:-1,flash:0,inv:false,state:'idle',
    fire:0,cast:0,push:0,glintN:0,glintT:0,down:0,hide:0,scale:1,stun:0,lcDone:{},bag:[],mv:null,spr:null,orb:rnd(0,6.28),dist:who==='omar'?3.8:5.4,aliCd:0,kit:'p',tint:0,alpha:1},o||{});
  TW.foes.push(T); return T; }
function twFoeAlive(){ return TW.foes.filter(T=>T.hp>0&&!T.gone); }
function twSprOf(o){ if(!o.spr||SPRITES.indexOf(o.spr)<0) o.spr=o.who==='ali'?new Sprite3D(64,64):new Sprite3D(128,128,28); return o.spr; }
function twRemoveFoe(T){ if(T.spr) T.spr.dispose(); T.spr=null; T.gone=1; const i=TW.foes.indexOf(T); if(i>=0) TW.foes.splice(i,1); }
function twClearFoes(){ TW.foes.slice().forEach(twRemoveFoe); TW.foes=[]; }
function twMoveTo(T,x,z,dur){ const p=twClampXZ(x,z); T.mv={sx:T.x,sz:T.z,x:p.x,z:p.z,t:0,dur:Math.max(.05,dur)}; return dur; }
function twBlink(T,x,z){ const p=twClampXZ(x,z); FX.burst(T.x,T.y+1.4,T.z,24,T.who==='omar'?0x140a1a:0xffffff,4,.45,T.who!=='omar'); FX.burst(T.x,T.y+1.4,T.z,10,T.who==='omar'?0x8a3aff:0xff8ac8,3,.3);
  T.x=p.x; T.z=p.z; T.mv=null; T.y=groundY(T.x,T.z)+T.hy; FX.burst(T.x,T.y+1.4,T.z,24,T.who==='omar'?0x140a1a:0xffffff,4,.45,T.who!=='omar'); Sound.sfx('dash'); }
// Caotan pushes his glasses up: n glints, each one a "ting"
function* twGlint(T,n,gap,cine){ gap=gap||.22; for(let i=0;i<n;i++){ T.push=.35; T.glintN=i+1; T.glintT=.5; Sound.sfx('ting'); FX.flash=Math.max(FX.flash,.12); grade.uniforms.flashCol.value.set(1,1,1);
    const g=twGlow(0xffffff,3.2); const s=twBB(texStar(),1.6,1.6,{add:true}); const hx=T.x+T.f*.15, hy=T.y+2.05*T.scale, hz=T.z+.4; g.position.set(hx,hy,hz); s.position.set(hx,hy,hz);
    const k={t:0}; Game.fxUpd.push(dt=>{ k.t+=dt; const u=k.t/.45; s.scale.setScalar(Math.max(.01,(1-u)*2.4*Math.sin(Math.min(1,u*3)*Math.PI/2))); s.rotation.z=k.t*4; g.material.opacity=Math.max(0,1-u); if(u>=1){ scene.remove(g); scene.remove(s); return false; } return true; });
    yield cine?wait(gap):gap; } }
function twFoeHead(T){ return {x:T.x,y:T.y+1.9*T.scale,z:T.z}; }

// ---------- damage into the bosses ----------
function twHurt(T,d,src){ const F=TW.fight; if(!F||!T||T.hp<=0||T.gone) return false;
  if(T.inv||T.hide||T.state==='cut'){ FX.spark(T.x,T.y+1.4,T.z); if(!T.blkT||T.blkT<performance.now()-120){ T.blkT=performance.now(); Sound.sfx('block'); } return false; }
  if(ALI()&&src==='beam'){ if(T.aliCd>0) return false; T.aliCd=.3; d*=.32; }
  if(ALI()&&src==='melee') d*=.8;
  const m=(T.stun>0?1.6:1)*(F.dmgMul||1)*(T.dmgMul||1); d=Math.round(d*m*10)/10; T.hp=Math.max(0,T.hp-d); T.flash=.1; T.pop=.14; if(d>=4){ FX.hitstop=Math.max(FX.hitstop,.06); shake(.25); } else if(d>=2) shake(.1);
  FX.burst(T.x,T.y+1.4,T.z,8,T.who==='omar'?0x8a3aff:0xfff0f8,3,.22); Game.dmgNums.push({x:T.x,y:T.y+3.3*T.scale,z:T.z,n:d,t:0,big:m>1,col:m>1?'#ffd45a':null});
  if(F.onHurt) F.onHurt(T,d); return true; }
function twNear(x,z,r,pad){ let best=null,bd=r; for(const T of TW.foes){ if(T.hp<=0||T.gone||T.hide) continue; const d=Math.hypot(T.x-x,T.z-z)-(pad||0)*T.scale; if(d<bd){ bd=d; best=T; } } return best; }

// melee, beams, deflected bolts, specials all route into the twins
(function(){
  const mh=meleeHits; meleeHits=function(x,z,y,rad,ang,arc,dmg,set){ let any=mh(x,z,y,rad,ang,arc,dmg,set);
    for(const T of TW.foes){ if(T.hp<=0||T.gone||T.hide||set.has(T)) continue; const d=Math.hypot(T.x-x,T.z-z), er=.9*T.scale; if(d<rad+er&&(d<er+.4||angDiff(Math.atan2(T.z-z,T.x-x),ang)<arc)){ set.add(T); if(twHurt(T,dmg,'melee')){ any=true; Sound.sfx('hit'); FX.hitstop=Math.max(FX.hitstop,.05); addSP(1); } } }
    if(TW.giant&&TW.giant.hp>0&&!set.has(TW.giant)){ const G=TW.giant; if(Math.hypot(G.x-x,G.z-z)<rad+2.4){ set.add(G); if(hzgHurt(dmg,'melee')){ any=true; Sound.sfx('hit'); addSP(1); } } }
    return any; };
  const ub=updateBeams; updateBeams=function(dt){ for(const b of BEAMS){ const rad=b.big?1.6:1.15;
      for(const T of TW.foes){ if(T.hp<=0||T.gone||T.hide||b.hit.has(T)) continue; if(Math.hypot(T.x-b.x,T.z-b.z)<rad+.8*T.scale){ b.hit.add(T); if(twHurt(T,b.big?7:4,'beam')) Sound.sfx('hit'); } }
      const G=TW.giant; if(G&&G.hp>0&&!b.hit.has(G)&&Math.hypot(G.x-b.x,G.z-b.z)<rad+2.4){ b.hit.add(G); hzgHurt(b.big?7:4,'beam'); } }
    return ub(dt); };
  const ubo=updateBolts; updateBolts=function(dt){ for(const b of BOLTS){ if(b.dead||!b.friendly) continue;
      for(const T of TW.foes){ if(T.hp<=0||T.gone||T.hide) continue; if(Math.hypot(T.x-b.x,T.z-b.z)<1.1*T.scale&&Math.abs(T.y+1.3*T.scale-b.y)<1.8*T.scale){ b.dead=1; twHurt(T,b.dmg*1.15,'bolt'); Sound.sfx('hit'); shake(.15); break; } }
      const G=TW.giant; if(!b.dead&&G&&G.hp>0&&Math.hypot(G.x-b.x,G.z-b.z)<2.4){ b.dead=1; hzgHurt(b.dmg,'bolt'); } }
    return ubo(dt); };
  const nf=nearestFoe; nearestFoe=function(r){ let best=nf(r); const P=Player; let bd=best?Math.hypot(best.x-P.x,best.z-P.z):r;
    for(const T of TW.foes){ if(T.hp<=0||T.gone||T.hide||T.inv) continue; const d=Math.hypot(T.x-P.x,T.z-P.z)-.8; if(d<bd){ bd=d; best=T; } }
    const G=TW.giant; if(G&&G.hp>0&&!G.inv){ const d=Math.hypot(G.x-P.x,G.z-P.z)-2; if(d<bd){ bd=d; best=G; } } return best; };
  const sa=specialAttack; specialAttack=function*(){ const P=Player, tg=nearestFoe(24); const isTw=tg&&TW.foes.includes(tg), isG=tg&&tg===TW.giant;
    yield* sa(); if(isTw&&tg.hp>0){ const was=tg.inv; tg.inv=false; twHurt(tg,16,'ult'); tg.inv=was; for(const T of TW.foes) if(T!==tg&&T.hp>0&&Math.hypot(T.x-tg.x,T.z-tg.z)<4.5){ const w2=T.inv; T.inv=false; twHurt(T,10,'ult'); T.inv=w2; } }
    if(isG) hzgHurt(16,'ult'); };
  const at=aliTargets; aliTargets=function(){ if(TW.fight){ const al=TW.foes.filter(T=>T.hp>0&&!T.gone&&!T.hide&&!T.inv); if(al.length) return al; }
    if(TW.giant&&TW.giant.hp>0&&!TW.giant.inv) return [TW.giant]; return at(); };
  const ah=aliHit; aliHit=function(T,d){ if(TW.foes.includes(T)){ twHurt(T,d*.5,'ali'); return; } if(T===TW.giant){ hzgHurt(d*.5,'ali'); return; } return ah(T,d); };
})();

// ---------- the update loop ----------
(function(){ const uw=updateWorld; updateWorld=function(dt){ uw(dt); if(!Game.mech&&!Game.zw) try{ twUpdate(dt); }catch(e){ console.error('twUpdate',e); } }; })();
function twUpdate(dt){ const play=twPlay(); TW.t+=dt; TW.barkT-=dt;
  for(let i=0;i<TW.hz.length;i++){ const h=TW.hz[i]; let keep=true; try{ keep=h.upd(dt,play); }catch(e){ console.error('hazard',e); keep=false; } if(!keep){ try{ h.kill&&h.kill(); }catch(e){} TW.hz.splice(i,1); i--; } }
  const F=TW.fight; if(F&&F.pre) F.pre(dt,play); if((F&&!F.noBar)||TW.giant) Game.bossBar=Game.bossBar||2; else if(Game.bossBar===2) Game.bossBar=0;
  for(const T of TW.foes.slice()) twUpdateFoe(T,dt,play);
  for(const A of TW.allies) twUpdateAlly(A,dt,play);
  if(TW.giant) hzgUpdate(dt,play);
  if(F&&play&&!Game.script&&F.pend){ const g=F.pend; F.pend=null; run(g); }
  if(F&&!Cam.cine&&F.frame!==false){ const P=Player, al=TW.foes.filter(T=>!T.gone&&!T.hide); let fx=P.x,fz=P.z;
    if(al.length){ let sx=0,sz=0; al.forEach(T=>{ sx+=T.x; sz+=T.z; }); sx/=al.length; sz/=al.length; fx=lerp(P.x,sx,.32); fz=lerp(P.z,sz,.28); }
    Cam.focus=Cam.focus||{x:fx,y:0,z:fz}; Cam.focus.x=lerp(Cam.focus.x,fx,Math.min(1,dt*4)); Cam.focus.z=lerp(Cam.focus.z,fz,Math.min(1,dt*4)); Cam.focus.y=Math.max(0,P.y*.6); }
}
function twUpdateFoe(T,dt,play){ const P=Player; T.t+=dt; T.flash=Math.max(0,T.flash-dt); T.fire=Math.max(0,T.fire-dt); T.cast=Math.max(0,T.cast-dt); T.push=Math.max(0,T.push-dt); T.glintT=Math.max(0,T.glintT-dt); T.aliCd-=dt;
  if(play&&T.stun>0){ T.stun-=dt; if(Math.random()<.3) FX.spawn(T.x+rnd(-.5,.5),T.y+2.6*T.scale,T.z,0,1,0,.5,0xffe066,.25,0,true); }
  if(T.mv&&play){ const m=T.mv; m.t+=dt; const u=Math.min(1,m.t/m.dur), e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2; T.x=lerp(m.sx,m.x,e); T.z=lerp(m.sz,m.z,e); if(u>=1) T.mv=null; }
  const gy=groundY(T.x,T.z), want=T.down?gy+.25:gy+T.hy+Math.sin(T.t*1.7+(T.who==='omar'?1.5:0))*.3; T.y=lerp(T.y,want,Math.min(1,dt*(T.down?2.5:4)));
  if(!T.lockF) T.f=P.x<T.x?-1:1;
  if(!T.down&&!T.hide&&Math.random()<.5) FX.spawn(T.x+rnd(-.7,.7)*T.scale,T.y+rnd(.2,2.6)*T.scale,T.z+rnd(-.3,.3),0,rnd(.5,1.5),0,.6,T.who==='caotan'?(T.phase>=2?0xff9ad8:0xfff6e8):(T.phase>=3?0x2a0a4a:0x7a2acc),.3,0,T.who==='caotan');
  const F=TW.fight; if(!F||!play||T.down||T.hp<=0&&!T.gen) return;
  if(T.gen){ T.wait-=dt; let g=0; while(T.gen&&T.wait<=0&&g++<50){ const cur=T.gen; let r; try{ r=cur.next(); }catch(e){ console.error('twin pattern',e); r={done:true}; }
      if(T.gen!==cur) continue;
      if(r.done){ T.gen=null; T.state=T.stun>0?'stun':'idle'; T.cd=F.cd?F.cd(T):[0,.95,.75,.55][T.phase]||.7; T.rest=.75; } else T.wait+=(r.value||0); } return; }
  if(T.stun>0) return;
  // idle: drift around the player at a comfortable distance
  if(T.rest>0){ T.rest-=dt; if(Math.random()<.2) FX.spawn(T.x,T.y+2.4,T.z,0,1,0,.4,0xfff0a0,.18,0,true); }
  else if(!T.mv){ T.orb+=dt*(T.who==='omar'?.55:.38)*(T.dir||1); const tx=P.x+Math.cos(T.orb)*T.dist, tz=P.z+Math.sin(T.orb)*T.dist*.75, p=twClampXZ(tx,tz,1.2), sp=3.2*twSp(T);
    const dx=p.x-T.x, dz=p.z-T.z, d=Math.hypot(dx,dz); if(d>.05){ const k=Math.min(d,sp*dt)/d; T.x+=dx*k; T.z+=dz*k; } }
  if(F.noAttack||T.noAttack) return;
  T.cd-=dt; if(T.cd<=0){ const k=twPick(T); if(k){ const gen=TWK[T.who][k]; if(gen){ T.state='atk'; T.last=k; T.gen=gen(T,T.phase); T.wait=0; } } }
}
function twPick(T){ const F=TW.fight; const pool=F.pool?F.pool(T):TWPOOL[T.who][T.phase]; if(!pool||!pool.length) return null;
  if(!T.bag.length||T.bagPh!==T.phase){ T.bag=pool.slice().sort(()=>Math.random()-.5); T.bagPh=T.phase; if(T.bag[0]===T.last&&T.bag.length>1) T.bag.push(T.bag.shift()); } return T.bag.shift(); }

// ---------- drawing ----------
function drawCaotanBoss(c,cx,by,f,s){ drawCaotanHD(c,cx,by,f,s); const p=SH(c,cx,by,f), t=s.t, dn=s.down, y=(dn?0:Math.round(Math.sin(t*3)*2))+(dn?8:0), fl=s.flash>0;
  // the "shades" were prescription glasses the whole time
  const fr=fl?'#fff':'#14141e', ln=s.glintT>0?'#ffffff':(s.form>=2?'#ffc8ec':'#bfe4ff');
  const sk=fl?'#fff':'#c98a5e';
  if(s.noGlasses){ // glasses off: actual eyes, glasses dangling from his hand
    p(-7,-66+y,15,5,sk); for(const ex of [-6,2]){ p(ex-1,-67+y,6,1,'#14141e'); p(ex,-66+y,4,3,'#14141e'); p(ex+1,-65+y,2,2,'#ff8ac8'); p(ex+1,-66+y,1,1,'#ffffff'); }
    p(9,-58+y,4,6,sk); p(8,-56+y,7,3,fr); p(9,-55+y,2,1,ln); p(12,-55+y,2,1,ln);
    if(s.glintT>0){ const k=Math.round(s.glintT*10); for(const ex of [-5,3]){ p(ex-k,-65+y,2+2*k,1,'#ffffff'); p(ex,-69+y-k,1,7+2*k,'#ffffff'); } } }
  else { const g=y-(s.push>0?2:0); // pushing the glasses up the nose before a glint
    p(-8,-68+g,7,6,fr); p(1,-68+g,7,6,fr); p(-7,-67+g,5,4,ln); p(2,-67+g,5,4,ln); p(-1,-66+g,2,1,fr); p(-6,-67+g,2,1,'#ffffff'); p(3,-67+g,2,1,'#ffffff');
    if(s.cracked){ p(3,-67+g,1,4,'#14141e'); p(4,-65+g,2,1,'#14141e'); }
    if(s.push>0){ p(-1,-65+g,2,4,sk); p(-2,-61+y,4,4,sk); p(-1,-57+y,4,6,sk); }
    if(s.glintT>0){ const k=Math.round(s.glintT*10); p(4-k,-66+g,8+2*k,1,'#ffffff'); p(4,-70+g-k,1,9+2*k,'#ffffff'); } }
  if(s.form>=2){ p(-10,-80+y,4,3,'#ff6ab0'); p(7,-80+y,4,3,'#ff6ab0'); p(-12,-79+y,2,2,'#ff6ab0'); p(11,-79+y,2,2,'#ff6ab0'); }
  if(s.form>=3){ for(let i=0;i<3;i++){ const a=t*3+i*2.1; p(Math.round(Math.cos(a)*16)-2,-74+Math.round(Math.sin(a)*6)+y,4,4,'#ff4aa0'); } }
  if(s.maid){ p(-8,-76+y,17,3,'#ffffff'); p(-6,-78+y,3,2,'#ffffff'); p(1,-78+y,3,2,'#ffffff'); p(-10,-46+y,20,14,'#ffffff'); p(-10,-46+y,20,2,'#ff8ac8'); p(-3,-50+y,6,4,'#ff3a7a'); }
  if(s.heartEyes){ p(-7,-67+y,5,4,'#ff3a7a'); p(2,-67+y,5,4,'#ff3a7a'); }
  if(s.nose){ p(-1,-62+y,2,6+Math.round(Math.sin(t*20)*2),'#d0102a'); } }
function drawOmarBoss(c,cx,by,f,s){ drawOmarHD(c,cx,by,f,s); const p=SH(c,cx,by,f), t=s.t, dn=s.down, y=(dn?0:Math.round(Math.sin(t*2.6+1)*2))+(dn?8:0);
  if(s.form>=2){ const wf=Math.round(Math.sin(t*6)*3); for(let i=0;i<5;i++){ p(-30-i*5,-74+y+i*3-wf,5,24-i*3,'#0a0610'); p(24+i*5,-74+y+i*3-wf,5,24-i*3,'#0a0610'); p(-30-i*5,-74+y+i*3-wf,1,24-i*3,'#7a2ac0'); } }
  if(s.form>=3){ p(-6,-70+y,12,11,'#000000'); p(-5,-67+y,4,2,'#ffffff'); p(2,-67+y,4,2,'#ffffff'); for(let i=0;i<4;i++){ const a=t*2+i*1.57; p(Math.round(Math.cos(a)*20),-60+Math.round(Math.sin(a)*20)+y,3,3,'#b06aff'); } }
  if(s.scythe){ const sw=s.swing||0; blade(c,cx+f*14,by-48+y,-1.9+sw*3.4,30,f,['#0c0812','#b06aff','#ffffff']); } }
function twDrawFoes(){ const t=performance.now()/1000;
  for(const T of TW.foes){ if(T.gone) continue; const S=twSprOf(T); S.show(!T.hide); if(T.hide) continue;
    S.draw((c,cx,by)=>T.who==='caotan'?drawCaotanBoss(c,cx,by,T.f,T):T.who==='omar'?drawOmarBoss(c,cx,by,T.f,T):drawCaomar(c,cx,by,T.f,T));
    const pp=Math.max(0,T.pop||0); T.pop=pp-1/60; S.mesh.scale.set(T.scale*(1+pp*.9),T.scale*(1-pp*.7),T.scale); S.place(T.x,T.y,T.z,groundY(T.x,T.z)); S.shadow.scale.multiplyScalar(T.scale);
    const col=T.tint||0xffffff; S.mesh.material.color.setHex(col);
    S.glow(T.flash>0?.8:T.stun>0?.25+.2*Math.sin(t*20):T.inv?.35:T.phase>=3?.18:0); }
  for(const A of TW.allies){ if(A.gone) continue; const S=twSprOf(A); const vis=!A.hidden&&Game.state!=='title'&&!Game.mech; S.show(vis); if(!vis) continue;
    S.draw((c,cx,by)=>A.who==='caotan'?drawCaotanBoss(c,cx,by,A.f,A):A.who==='omar'?drawOmarBoss(c,cx,by,A.f,A):drawAliHD(c,cx,by,A.f,{t:A.t,anim:A.anim||'idle',flash:A.flash}));
    S.mesh.scale.setScalar(1);
    S.place(A.x,A.y,A.z,groundY(A.x,A.z)); S.glow(A.flash>0?.7:.08); S.mesh.material.color.setHex(0xffffff); }
}
(function(){ const ds=drawSprites; drawSprites=function(){ ds(); if(!Game.mech) try{ twDrawFoes(); if(TW.giant) hzgDraw(); }catch(e){ console.error('twDraw',e); } }; })();

// ---------- barks and anime cut-ins ----------
function twBark(who,text,force){ if(!force&&TW.barkT>0) return; if(!force&&Voice.speaking) return; TW.barkT=2.4; Game.subtitle={who,text,t:0}; if(Game.state==='play'||force) Voice.play(who,text); }
function twCutin(who,title,sub,col,dur){ TW.cutin={who,title,sub,col:col||'#ff6ab0',t:0,dur:dur||1.8}; Sound.sfx('slam'); Game.slowT=Math.max(Game.slowT,.5); }
NAMES.caomar='CAOMAR'; NAMES.hamzagiant='Hamza, Big Back Edition'; NAMES.alihelp='Ali';

// (AI allies live in 07_allies.js)
// ---------- resets ----------
function twEndFight(keepFoes){ TW.fight=null; twClearHz(); if(!keepFoes) twClearFoes(); TW.dark=null; TW.vn=null; TW.cutin=null; TW.big=null; TW.spot=null; TW.sentence=null; TW.hg=null; Cam.focus=null; Cam.zoom=1;
  BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); grade.uniforms.red.value=0; if(L&&L.look) applyLook(L.look); }
(function(){ const ll=loadLevel; loadLevel=function(k,o){ twClearHz(); TW.dark=null; TW.vn=null; TW.spot=null; return ll(k,o); };
  const nt=toTitle; toTitle=function(){ twEndFight(); twClearAllies(); TW.giant=null; return nt(); };
  const ng=newGame; newGame=function(){ twEndFight(); twClearAllies(); TW.giant=null; return ng(); };
  const rs=respawn; respawn=function(){ if(TW.fight&&TW.fight.respawn){ Game.state='play'; TW.fight.respawn(); return; } if(TW.giant&&TW.giantRespawn){ Game.state='play'; TW.giantRespawn(); return; } return rs(); };
  const us=unstuck; unstuck=function(){ if((TW.fight&&TW.fight.respawn)||(TW.giant&&TW.giantRespawn)){ Voice.stop(); releaseTouchKeys(); for(const k in held) held[k]=false; clearHits();
      Object.assign(Game,{script:null,wait:null,dlg:null,timeScale:1,slowT:0,letterTo:0,evaCard:null,caption:null,chant:null,impSeq:null,card:null,banner:null,subtitle:null});
      Game.fxUpd=[]; scene.children.filter(o=>o.userData&&o.userData.temp).forEach(o=>scene.remove(o)); Cam.cine=null; Object.assign(Player,{cineFly:false,cineAnim:null,hidden:false,scripted:null,atk:null,charge:0,dash:0,hurt:0,vx:0,vy:0,vz:0});
      if(TW.fight) TW.fight.respawn(); else TW.giantRespawn(); Game.state='play'; Game.banner={name:'Unstuck',sub:'Restarting this phase',t:0,small:1}; return; }
    return us(); };
})();
// ---------- cutscene framing: medium shots, never cramped ----------
function twCamT(T,dist,side){ dist=dist||7.5; side=side==null?1.2:side; const y=T.y!=null?T.y:groundY(T.x,T.z); cineSet(T.x+side,y+2.2,T.z+dist,T.x,y+1.6,T.z); }
function twCamP(dist,side){ const P=Player; dist=dist||6.2; side=side==null?1:side; cineSet(P.x+side,P.y+1.8,P.z+dist,P.x,P.y+1.05,P.z); }
function twCam2(a,b,dist,side){ dist=dist||10.5; side=side||0; const mx=(a.x+b.x)/2, mz=(a.z+b.z)/2, my=((a.y!=null?a.y:0)+(b.y!=null?b.y:0))/2; cineSet(mx+side,my+2.4,mz+dist,mx,my+1.4,mz); }
