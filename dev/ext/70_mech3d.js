// =====================================================================
// NATHAN vs COSMIC HAMZA, phases II and III: DIMENSION BREAK
// The camera swings behind the mech. Hamza is ahead, in depth. Bullets
// come AT you: tunnels, walls, helixes, lunges. Logic lives in (u,v,d):
// u = lateral (screen right), v = up, d = depth from Nathan's plane.
// World position = (X0 + d, v, u). The camera looks down +x.
// =====================================================================
const M3={X0:0,HD:46,UL:10.5,VL:6};
function m3W(u,v,d){ return [M3.X0+d,v,u]; }
function m3On(){ return !!(Game.mech&&Game.mech.d3); }
function m3Enter(cine){ const G=Game.mech, v=L.vd; if(!G||!v) return; const N=NAT;
  G.d3={t:0,eb:[],pb:[],big:[],las:[],mn:[],roll:0,rollTo:0,swing:cine?0:1,hzd:M3.HD,lunge:0,gen:null,wait:0,cd:cine?2.4:1.2,last:'',pull:0};
  N.x=0; N.y=0; N.vx=N.vy=0; N.qb=0; N.pull=0; MB.eb=[]; MB.pb=[]; MB.big.forEach(b=>scene.remove(b.m)); MB.big=[]; MB.las.forEach(l=>{ scene.remove(l.mw); scene.remove(l.mb); scene.remove(l.mc); }); MB.las=[]; MB.mn.forEach(m=>scene.remove(m.mesh)); MB.mn=[];
  v.hz.rotation.set(0,-Math.PI/2,0); v.hz.position.set(M3.X0+M3.HD,1.5,0);
  if(cine){ G.busy=1; Game.letterTo=.5; evaCard(['DIMENSION BREAK','THE FIGHT GOES 3D'],2,1); Sound.sfx('skyopen'); Sound.sfx('quickboost'); FX.flash=.6; grade.uniforms.flashCol.value.set(.7,.95,1);
    setTimeout(()=>{ if(Game.mech&&Game.mech.d3){ Game.mech.busy=0; Game.letterTo=0; Game.banner={name:'Dimension Break',sub:'Fly through the gaps. Slash what reaches you. Dash through lasers.',t:0,small:1}; } },2300); } }
function m3Exit(){ const G=Game.mech; if(!G||!G.d3) return; const D3=G.d3, v=L.vd;
  D3.big.forEach(b=>scene.remove(b.m)); D3.las.forEach(l=>l.ms.forEach(m=>scene.remove(m))); D3.mn.forEach(m=>scene.remove(m.mesh)); G.d3=null;
  if(v){ v.hz.rotation.set(0,0,0); v.hz.position.set(14,1,-14); v.hz.scale.setScalar(1); } camera.up.set(0,1,0);
  if(NAT){ NAT.x=-14; NAT.y=0; NAT.vx=NAT.vy=0; NAT.mesh.rotation.set(0,0,0); } if(MB.layE){ MB.layE.write([]); MB.layP.write([]); } }
(function(){
  const smp=startMechPhase; startMechPhase=function(ph){ const G=Game.mech; const had=!!(G&&G.d3); if(had) m3Exit(); smp(ph); if(ph>=2) m3Enter(!had&&!G._resp); if(G) G._resp=0; };
  const mr=mechRespawn; mechRespawn=function(){ const G=Game.mech; if(G){ G._resp=1; if(G.d3) m3Exit(); } return mr(); };
  const mpe=mechPhaseEnd; mechPhaseEnd=function*(ph){ m3Exit(); yield* mpe(ph); };
  const em=exitMech; exitMech=function(q){ if(Game.mech&&Game.mech.d3) m3Exit(); return em(q); };
  const um=updateMech; updateMech=function(dt){ const G=Game.mech; if(G&&G.d3&&L.vd){ for(const f of L.anim) f(dt); m3Update(dt); return; } return um(dt); };
  const mc=mechCam; mechCam=function(dt){ if(m3On()) return m3Cam(dt); return mc(dt); };
  const nd=natDrill; natDrill=function*(){ if(m3On()){ yield* m3Drill(); return; } yield* nd(); };
  const dh=drawMechHUD; drawMechHUD=function(){ const N=NAT; if(!m3On()||!N) return dh(); const c=N.charge, s=N.shot; N.charge=0; N.shot=0; dh(); N.charge=c; N.shot=s;
    const [wx,wy,wz]=m3W(N.x,N.y+2.4,0), [sx,sy]=toScreen(wx,wy,wz); const ring=(k,col,r)=>{ D.lineWidth=5; D.strokeStyle='rgba(10,8,20,.6)'; D.beginPath(); D.arc(sx,sy,r,0,7); D.stroke(); D.strokeStyle=col; D.beginPath(); D.arc(sx,sy,r,-Math.PI/2,-Math.PI/2+k*Math.PI*2); D.stroke(); };
    if(c>.25) ring(clamp((c-.25)/1.25,0,1),c>=1.5?'#ffffff':c>=.75?'#3ff4ff':'#9fd0ff',20); if(s>0) ring(clamp(s/1.4,0,1),s>=1.4?'#ffffff':s>=.7?'#7affd8':'#4a9a8a',13);
    const D3=Game.mech.d3; if(D3&&D3.chomp){ const [cx,cy,cz]=m3W(D3.chomp.u,D3.chomp.v,0), [qx,qy]=toScreen(cx,cy,cz), [ex]=toScreen(cx,cy,cz+D3.chomp.r); const r=Math.abs(ex-qx);
      D.strokeStyle=Math.floor(performance.now()/80)%2?'#ff2a4a':'#ffd0d8'; D.lineWidth=4; D.beginPath(); D.arc(qx,qy,r,0,7); D.stroke(); D.font=`900 22px ${FB}`; D.fillStyle='#ff4a5a'; D.textAlign='center'; D.fillText('GET OUT!',qx,qy-r-10); D.textAlign='left'; } };
})();
function m3Cam(dt){ const N=NAT, G=Game.mech, D3=G.d3; D3.swing=Math.min(1,D3.swing+dt/1.8); const s=D3.swing, e=s*s*(3-2*s);
  D3.roll=lerp(D3.roll,D3.rollTo,Math.min(1,dt*2.2)); const sh=FX.shake, j=sh?rnd(-sh,sh)*.6:0, k=sh?rnd(-sh,sh)*.6:0;
  const u=N?N.x:0, v=N?N.y:0; const [px,py,pz]=m3W(u*.38+j,v*.3+1.6+k,-15), [lx,ly,lz]=m3W(u*.12,v*.12+.6,30);
  // the swing: from the old side-on camera to over-the-shoulder
  const ox=-3, oy=0, oz=24; camera.position.set(lerp(ox,px,e),lerp(oy,py,e),lerp(oz,pz,e)); camera.up.set(0,Math.cos(D3.roll),Math.sin(D3.roll)); camera.lookAt(lerp(-3,lx,e),lerp(0,ly,e),lerp(0,lz,e)); }
// ---------- player ----------
function m3Hurt(){ const N=NAT; if(!N||N.inv>0||Game.state!=='play') return; N.ap=Math.max(0,N.ap-260); N.inv=1.1; N.flash=.25; N.hurtT=.3; shake(.45); Sound.sfx('hurt'); Sound.sfx('crash');
  const [x,y,z]=m3W(N.x,N.y,0); FX.burst(x,y,z,26,0xff5a5a,7,.3); FX.flash=.3; grade.uniforms.flashCol.value.set(1,.2,.25);
  if(N.ap<=0){ FX.burst(x,y,z,90,0x3ff4ff,12,.5); FX.burst(x,y,z,60,0xffffff,9,.4); Sound.sfx('crossboom'); shake(1.2); N.show=0; Game.onDeath(); } else if(Math.random()<.35) Voice.bark(Math.random()<.5?'nhurt1':'nhurt2'); }
function m3Slash(n){ const N=NAT, D3=Game.mech.d3; N.atk={t:0,n,hit:new Set(),defl:0}; N.combo=n; Sound.sfx('swing'); if(n===2) Sound.sfx('beam');
  const R=n===2?4.2:3.4, m=new THREE.Mesh(new THREE.RingGeometry(R*.45,R,28,1,-1.4,2.8),new THREE.MeshBasicMaterial({color:n===2?0xbff8ff:0x3ff4ff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  const [x,y,z]=m3W(N.x,N.y,1.4); m.position.set(x,y,z); m.rotation.set(0,Math.PI/2,(n===1?.6:n===2?0:-.6)); scene.add(m); const k={t:0}; Game.fxUpd.push(dt=>{ k.t+=dt; m.material.opacity=Math.max(0,.95-k.t*5); m.scale.setScalar(1+k.t*1.4); if(k.t>.2){ scene.remove(m); return false; } return true; }); }
function m3SlashHits(A){ const N=NAT, D3=Game.mech.d3, R=A.n===2?3.6:3;
  for(const b of D3.eb){ if(b.dead||b.d>4.5||b.d<-1.5) continue; if(Math.hypot(b.u-N.x,b.v-N.y)<R){ b.dead=1; A.defl++; D3.pb.push({u:b.u,v:b.v,d:b.d,vu:0,vv:0,vd:40,dmg:1.3,r:.45,col:0x9fe0ff,hom:5,t:0}); const [x,y,z]=m3W(b.u,b.v,b.d); FX.spark(x,y,z); } }
  if(A.defl&&!A.sfx){ A.sfx=1; Sound.sfx('deflect'); natSP(1); const [x,y,z]=m3W(N.x,N.y+2,1); Game.dmgNums.push({x,y,z,n:'DEFLECT',t:0,col:'#9fe0ff'}); }
  for(const m of D3.mn){ if(m.hp<=0||A.hit.has(m)||m.d>5) continue; if(Math.hypot(m.u-N.x,m.v-N.y)<R+.6){ A.hit.add(m); m3HitMinion(m,A.n===2?3:2); natSP(1); Sound.sfx('hit'); } } }
function m3Shoot(){ const N=NAT, D3=Game.mech.d3; Sound.sfx('mechshot'); for(const o of [-.4,.4]) D3.pb.push({u:N.x+o,v:N.y+.2,d:1,vu:0,vv:0,vd:46,dmg:.5,r:.32,col:0x3ff4ff,hom:3,t:0}); }
function m3BigShot(kind,full){ const N=NAT, D3=Game.mech.d3; let m;
  if(kind==='getsuga'){ m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:CRESC,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:full?0xbff8ff:0x3ff4ff,side:THREE.DoubleSide})); m.rotation.y=Math.PI/2; const sc=full?6:4; m.scale.set(sc,sc,1); Voice.bark('ngetsuga'); natSP(full?3:2); }
  else { m=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:full?0xdfffff:0x5ff8ff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); m.scale.setScalar(full?4:2.6); natSP(full?2:1); }
  scene.add(m); Sound.sfx('beam'); shake(full?.4:.2); D3.big.push({m,u:N.x,v:N.y+.3,d:1.5,dmg:kind==='getsuga'?(full?9:5):(full?7:3.5),r:full?2.4:1.6,kind,t:0,hitM:new Set()}); }
function m3HitMinion(m,d){ m.hp-=d; m.flash=.12; const [x,y,z]=m3W(m.u,m.v,m.d); FX.burst(x,y,z,8,0xff8aa8,4,.25); if(m.hp<=0){ FX.burst(x,y,z,24,0xff5a8a,6,.35); Sound.sfx('gore'); scene.remove(m.mesh); } }
function m3Nat(dt){ const N=NAT, G=Game.mech, D3=G.d3, ctl=Game.state==='play'&&!Game.dlg&&!G.busy; N.t+=dt; N.inv=Math.max(0,N.inv-dt); N.flash=Math.max(0,N.flash-dt); N.hurtT=Math.max(0,N.hurtT-dt);
  let [ix,iz]=ctl?inputVec():[0,0]; const iy=-iz;
  N.boostCd-=dt; if(N.boostN<3){ N.boostT+=dt; if(N.boostT>1.05){ N.boostN++; N.boostT=0; } }
  if(ctl&&consume('dash')&&N.boostN>0&&N.boostCd<=0){ let dx=ix,dy=iy; if(Math.abs(dx)<.2&&Math.abs(dy)<.2){ dx=1; dy=0; } const m=Math.hypot(dx,dy); N.qbx=dx/m; N.qby=dy/m; N.qb=.15; N.inv=Math.max(N.inv,.28); N.boostN--; N.boostCd=.16; Sound.sfx('quickboost'); shake(.14); }
  if(N.qb>0){ N.qb-=dt; N.vx=N.qbx*34; N.vy=N.qby*34; const [x,y,z]=m3W(N.x,N.y,0); for(let i=0;i<3;i++) FX.spawn(x-1,y,z,-rnd(4,8),rnd(-1,1),-N.qbx*rnd(6,12),.25,i%2?0x3ff4ff:0xffffff,.35,0,true); }
  else { const sp=12.5; N.vx=lerp(N.vx,ix*sp,Math.min(1,dt*11)); N.vy=lerp(N.vy,iy*sp,Math.min(1,dt*11)); }
  if(D3.pull>0){ const d=Math.hypot(N.x,N.y)||1; N.x-=N.x/d*D3.pull*dt; N.y-=N.y/d*D3.pull*dt; }
  N.x=clamp(N.x+N.vx*dt,-M3.UL,M3.UL); N.y=clamp(N.y+N.vy*dt,-M3.VL,M3.VL); N.tilt=lerp(N.tilt,N.vx*.03,Math.min(1,dt*8));
  N.comboT-=dt; if(ctl&&consume('attack')){ if(!N.atk) m3Slash(N.comboT>0?(N.combo+1)%3:0); else if(N.atk.t>.08) N.atk.q=1; }
  if(N.atk){ const A=N.atk; A.t+=dt; if(A.t>.03&&A.t<.17) m3SlashHits(A); if(A.t>.22){ const q=A.q; N.atk=null; N.comboT=.38; if(q&&ctl) m3Slash((N.combo+1)%3); } }
  if(ctl&&held.attack&&!N.atk){ const b=N.charge; N.charge+=dt; if(b<.25&&N.charge>=.25) Sound.sfx('charge'); if(b<.75&&N.charge>=.75) Sound.sfx('ready'); if(b<1.5&&N.charge>=1.5) Sound.sfx('ready'); }
  else if(N.charge>0){ if(N.charge>=.75&&ctl) m3BigShot('getsuga',N.charge>=1.5); N.charge=0; }
  if(ctl&&consume('block')){ m3Shoot(); N.shotHeld=0; }
  if(ctl&&held.block){ N.shotHeld+=dt; if(N.shotHeld>.28){ const b=N.shot; N.shot+=dt; if(b<.7&&N.shot>=.7) Sound.sfx('ready'); if(b<1.4&&N.shot>=1.4) Sound.sfx('ready'); } }
  else { if(N.shot>=.7&&ctl) m3BigShot('shot',N.shot>=1.4); N.shot=0; N.shotHeld=0; }
  if(ctl&&consume('special')){ if(N.sp>=20) run(natDrill); else { Sound.sfx('block'); const [x,y,z]=m3W(N.x,N.y+3,0); Game.dmgNums.push({x,y,z,n:Math.floor(N.sp)+' / 20',t:0,col:'#8fc8ff'}); } }
  // engine trail streaming back toward the camera
  const [x,y,z]=m3W(N.x,N.y,0); if(Math.random()<.9) FX.spawn(x-1.4,y+rnd(-.3,.5),z+rnd(-.3,.3),-rnd(10,16),rnd(-1,1),rnd(-1,1),.25,Math.random()<.5?0x3ff4ff:0xbff8ff,rnd(.2,.4),0,true); }
function m3Place(){ const N=NAT; if(!N) return; if(MECHTEX&&!N.mat.map){ N.mat.map=MECHTEX; N.mat.needsUpdate=true; } const blink=N.inv>0&&N.inv<1.1&&N.qb<=0&&Math.floor(N.inv*20)%2===0;
  const [x,y,z]=m3W(N.x,N.y-.5+Math.sin(N.t*2.2)*.12,0); N.mesh.visible=!!N.show&&!blink&&!!MECHTEX; N.mesh.position.set(x-.2,y,z-.4); N.mesh.rotation.set(0,-Math.PI/2+.55,-N.tilt*.6);
  N.mat.color.setRGB(1,N.flash>0?.45:1,N.flash>0?.5:1); N.thr.visible=!!N.show; N.thr.position.set(x-1.6,y+.6,z-1.2); const th=1.4+Math.sin(N.t*30)*.3+(N.qb>0?2:0); N.thr.scale.set(th,th,1);
  const cv=!!N.show&&Game.mech.st==='fight'; N.coreMk.visible=N.coreRing.visible=cv; const [cx,cy,cz]=m3W(N.x,N.y,0); N.coreMk.position.set(cx-.1,cy,cz); N.coreRing.position.set(cx-.1,cy,cz); N.coreMk.scale.set(.9,.9,1); const ph=(N.t*1.6)%1, rs=.9+ph; N.coreRing.scale.set(rs,rs,1); N.coreRing.material.opacity=(1-ph)*.85; }
// ---------- hazards ----------
function m3Shot(u,v,d,vu,vv,vd,col,r,o){ Game.mech.d3.eb.push(Object.assign({u,v,d,vu,vv,vd,col:col||0xff5a8a,r:r||.5,t:0},o||{})); }
function m3Aim(u,v,d,sp,col,r,lead){ const N=NAT, T=d/sp, tu=N.x+(lead?N.vx*T*.5:0), tv=N.y+(lead?N.vy*T*.5:0); m3Shot(u,v,d,(tu-u)/T,(tv-v)/T,-sp,col,r); }
function m3Eye(i){ const D3=Game.mech.d3; return {u:(i||0)*4.2,v:4.4,d:D3.hzd-1}; }
function m3Mouth(){ const D3=Game.mech.d3; return {u:0,v:-4.5,d:D3.hzd-1}; }
function m3Laser(o){ const l=Object.assign({t:0,warn:.85,dur:.5,w:1.4},o); l.ms=[beamMesh(0xff3a6a,.04),beamMesh(0xff2a5a,.5),beamMesh(0xffffff,.18)]; l.ms[1].visible=l.ms[2].visible=false; Game.mech.d3.las.push(l); Sound.sfx('charge'); return l; }
function m3Seg(l){ if(l.ang!=null){ const a=typeof l.ang==='function'?l.ang(l.t):l.ang, cu=typeof l.cu==='function'?l.cu(l.t):l.cu, cv=typeof l.cv==='function'?l.cv(l.t):l.cv; return [cu-Math.cos(a)*l.len,cv-Math.sin(a)*l.len,cu+Math.cos(a)*l.len,cv+Math.sin(a)*l.len]; } return [l.u0,l.v0,l.u1,l.v1]; }
function m3Update(dt){ const G=Game.mech, D3=G.d3, N=NAT, v=L.vd, B=G.boss, play=Game.state==='play'; D3.t+=dt;
  if(N){ m3Nat(dt); m3Place(); }
  // Hamza looms ahead; lunges shove him toward you
  if(B){ B.t+=dt; B.flash=Math.max(0,B.flash-dt); } const hz=v.hz; hz.position.set(M3.X0+D3.hzd,1.5+Math.sin(D3.t*.7)*1.2,Math.sin(D3.t*.45)*1.6); hz.scale.setScalar(1+Math.max(0,(M3.HD-D3.hzd))/M3.HD*.15);
  for(const h of v.halves) h.material.color.setRGB(1,B&&B.flash>0?.55:1,B&&B.flash>0?.6:1);
  if(B&&G.st==='fight'&&!G.busy&&play){ if(D3.gen){ D3.wait-=dt; let k=0; while(D3.gen&&D3.wait<=0&&k++<60){ let r; try{ r=D3.gen.next(); }catch(e){ console.error('m3',e); r={done:true}; } if(r.done){ D3.gen=null; D3.cd=B.phase>=3?.55:.85; } else D3.wait+=(r.value||0); } }
    else { D3.cd-=dt; if(D3.cd<=0){ const pool=M3_POOL[B.phase]||M3_POOL[2]; let k=pool[Math.floor(Math.random()*pool.length)]; if(k===D3.last) k=pool[Math.floor(Math.random()*pool.length)]; D3.last=k; D3.gen=M3P[k](B.phase); D3.wait=0; }
      else if(Math.random()<dt*1.1){ const e=m3Eye(Math.random()<.5?-1:1); m3Aim(e.u,e.v,e.d,24,0xff3a5a,.45,true); } }
    G.barkT-=dt; if(G.barkT<=0){ G.barkT=rnd(11,16); Voice.bark('hz'+(1+Math.floor(Math.random()*4))); } }
  // enemy bullets
  for(const b of D3.eb){ b.t+=dt; if(b.spin){ const a=Math.atan2(b.vv,b.vu)+b.spin*dt, s=Math.hypot(b.vu,b.vv); b.vu=Math.cos(a)*s; b.vv=Math.sin(a)*s; } if(b.burst&&b.d<b.burst&&!b.popped){ b.popped=1; b.dead=1; for(let k=0;k<10;k++){ const a=k*.628; m3Shot(b.u,b.v,b.d,Math.cos(a)*4,Math.sin(a)*4,b.vd*.85,0xffb06a,.45); } Sound.sfx('slam'); continue; }
    const d0=b.d; b.u+=b.vu*dt; b.v+=b.vv*dt; b.d+=b.vd*dt; if(b.d<-6||Math.abs(b.u)>40||Math.abs(b.v)>30||b.t>12){ b.dead=1; continue; }
    if(N&&N.show&&play&&d0>=-.4&&b.d<=.6&&Math.hypot(b.u-N.x,b.v-N.y)<b.r*.8+.34&&N.inv<=0){ b.dead=1; m3Hurt(); } }
  D3.eb=D3.eb.filter(b=>!b.dead);
  // player bullets home toward Hamza's face
  const hu=0, hv=1.5;
  for(const p of D3.pb){ p.t+=dt; if(p.hom){ const tu=hu-p.u, tv=hv-p.v, td=D3.hzd-p.d, dd=Math.hypot(tu,tv,td)||1, s=Math.max(30,Math.hypot(p.vu,p.vv,p.vd)), k=Math.min(1,p.hom*dt); p.vu=lerp(p.vu,tu/dd*s,k); p.vv=lerp(p.vv,tv/dd*s,k); p.vd=lerp(p.vd,td/dd*s,k); }
    p.u+=p.vu*dt; p.v+=p.vv*dt; p.d+=p.vd*dt;
    for(const m of D3.mn){ if(m.hp>0&&Math.abs(m.d-p.d)<1.4&&Math.hypot(m.u-p.u,m.v-p.v)<1.3){ m3HitMinion(m,p.dmg*2); p.dead=1; break; } }
    if(!p.dead&&p.d>=D3.hzd-3){ p.dead=1; const [x,y,z]=m3W(p.u,p.v,D3.hzd-3); mechDamage(p.dmg,x,y,z); natSP(.22); } if(p.t>3) p.dead=1; }
  D3.pb=D3.pb.filter(p=>!p.dead);
  for(const b of D3.big){ b.t+=dt; const tu=hu-b.u, tv=hv-b.v; b.u+=tu*dt*1.2; b.v+=tv*dt*1.2; b.d+=30*dt; const [x,y,z]=m3W(b.u,b.v,b.d); b.m.position.set(x,y,z); if(b.kind==='getsuga') b.m.rotation.z+=dt*2;
    for(let i=0;i<3;i++) FX.spawn(x+rnd(-.4,.4),y+rnd(-.6,.6),z+rnd(-.6,.6),-6,0,0,.3,i%2?0x3ff4ff:0xffffff,.35,0,true);
    for(const e of D3.eb){ if(Math.abs(e.d-b.d)<2&&Math.hypot(e.u-b.u,e.v-b.v)<b.r){ e.dead=1; const [ex,ey,ez]=m3W(e.u,e.v,e.d); FX.spark(ex,ey,ez); } }
    for(const m of D3.mn){ if(m.hp>0&&!b.hitM.has(m)&&Math.abs(m.d-b.d)<2&&Math.hypot(m.u-b.u,m.v-b.v)<b.r+.6){ b.hitM.add(m); m3HitMinion(m,b.dmg); } }
    if(b.d>=D3.hzd-3){ b.dead=1; scene.remove(b.m); mechDamage(b.dmg,x,y,z,true); FX.burst(x,y,z,40,0x3ff4ff,9,.4); shake(.35); Sound.sfx('slam'); } if(b.t>4&&!b.dead){ b.dead=1; scene.remove(b.m); } }
  D3.big=D3.big.filter(b=>!b.dead);
  // in-plane lasers
  for(const l of D3.las){ l.t+=dt; const [u0,v0,u1,v1]=m3Seg(l), act=l.t>l.warn&&l.t<l.warn+l.dur, a=m3W(u0,v0,.2), c=m3W(u1,v1,.2), len=Math.hypot(u1-u0,v1-v0);
    l.ms.forEach((m,i)=>{ m.position.set(a[0],a[1],a[2]); m.lookAt(c[0],c[1],c[2]); const k=i===0?(l.t<l.warn?(1+(Math.floor(l.t*14)%2)):0):act?Math.min(1,(l.t-l.warn)/.06)*Math.min(1,(l.warn+l.dur-l.t)/.12)*l.w:0; m.scale.set(Math.max(.001,k),Math.max(.001,k),len); m.visible=k>0; });
    if(act&&!l.fired){ l.fired=1; Sound.sfx('beam'); shake(.25); }
    if(act&&N&&N.show&&play){ const px=N.x-u0, py=N.y-v0, ux=(u1-u0)/(len||1), uy=(v1-v0)/(len||1), al=px*ux+py*uy, pe=Math.abs(px*uy-py*ux); if(al>-.4&&al<len+.4&&pe<l.w*.45+.3) m3Hurt(); }
    if(l.t>l.warn+l.dur){ l.dead=1; l.ms.forEach(m=>scene.remove(m)); } }
  D3.las=D3.las.filter(l=>!l.dead);
  // eye-piglets diving out of the dark
  const T2=pigletTex();
  for(const m of D3.mn){ if(m.hp<=0){ m.dead=1; continue; } m.t+=dt; m.flash=Math.max(0,m.flash-dt); m.d-=m.sp*dt; m.u=m.bu+Math.sin(m.t*2)*m.amp; m.v=m.bv+Math.cos(m.t*1.6)*m.amp*.6;
    const [x,y,z]=m3W(m.u,m.v,m.d); m.mesh.position.set(x,y,z); m.mesh.material.map=T2[Math.floor(m.t*10)%2]; m.mesh.material.color.setRGB(1,m.flash>0?.4:1,m.flash>0?.4:1);
    m.fire-=dt; if(m.fire<=0&&m.d>8&&play){ m.fire=rnd(1.3,2); m3Aim(m.u,m.v,m.d,16,0xffb0c8,.4); }
    if(N&&N.show&&play&&m.d<.8&&m.d>-.8&&Math.hypot(m.u-N.x,m.v-N.y)<1.3) m3Hurt(); if(m.d<-4){ m.dead=1; scene.remove(m.mesh); } }
  D3.mn=D3.mn.filter(m=>!m.dead);
  if(MB.layE){ for(const b of D3.eb){ b.x=M3.X0+b.d; b.y=b.v; b.z=b.u; } for(const p of D3.pb){ p.x=M3.X0+p.d; p.y=p.v; p.z=p.u; } MB.layE.write(D3.eb); MB.layP.write(D3.pb); }
  G.memShow=lerp(G.memShow,G.mem,Math.min(1,dt*3)); }
function m3Piglet(u,v){ const T=pigletTex(), m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:T[0],transparent:true,alphaTest:.5,depthWrite:false})); m.rotation.y=-Math.PI/2; scene.add(m);
  const D3=Game.mech.d3; D3.mn.push({u,v,bu:u,bv:v,d:D3.hzd-2,hp:3,t:rnd(0,3),flash:0,fire:rnd(.6,1.4),mesh:m,sp:rnd(9,12),amp:rnd(1,3)}); }
// ---------- patterns (generators yield seconds) ----------
const M3_POOL={2:['tunnel','wall','helix','gaze','piglets','meteor','tunnel','helix'],3:['tunnel2','wall','helix2','chomp','cross','blackstar','gridlaser','barrel','piglets']};
const M3P={
  *tunnel(ph,fast){ const N=NAT; let gap=rnd(0,6.28), cu=N.x, cv=N.y; Sound.sfx('drone'); for(let w=0;w<(fast?7:5);w++){ const n=18, R=7.5; for(let i=0;i<n;i++){ const a=i*6.283/n; if(angDiff(a,gap)<.55) continue; const e=m3Mouth(); m3Shot(cu+Math.cos(a)*R,cv+Math.sin(a)*R,Game.mech.d3.hzd-2,0,0,-(fast?27:22),w%2?0xb06aff:0xff5a8a,.6); }
      gap+=rnd(-1.1,1.1); if(fast){ cu=clamp(cu+rnd(-2.5,2.5),-6,6); cv=clamp(cv+rnd(-1.6,1.6),-4,4); } yield fast?.42:.55; } yield 1.4; },
  *tunnel2(ph){ yield* M3P.tunnel(ph,true); },
  *wall(ph){ for(let w=0;w<(ph>=3?4:3);w++){ const N=NAT, hu=clamp(N.x+rnd(-3,3),-8,8), hv=clamp(N.y+rnd(-2,2),-4.5,4.5); Sound.sfx('chomp');
      for(let u=-11;u<=11;u+=1.5) for(let v=-6.5;v<=6.5;v+=1.5){ if(Math.abs(u-hu)<1.9&&Math.abs(v-hv)<1.9) continue; m3Shot(u,v,Game.mech.d3.hzd-2,0,0,-19,0xfff0f0,.55); } yield 1.05; } yield .8; },
  *helix(ph,arms){ arms=arms||3; Sound.sfx('howl'); let a=rnd(0,6.28); for(let t=0;t<3.6;t+=.09){ const e=m3Mouth(); for(let k=0;k<arms;k++){ const q=a+k*6.283/arms; m3Shot(e.u,e.v,e.d,Math.cos(q)*3.2,Math.sin(q)*3.2+1.2,-17,k%2?0xb06aff:0xff5a8a,.5,{spin:.9}); } a+=.32; yield .09; } yield .6; },
  *helix2(ph){ yield* M3P.helix(ph,4); },
  *gaze(ph){ Game.mech&&(L.vd.o.look=1); for(let c=0;c<3;c++){ const N=NAT; if(c%2===0){ for(const v of [N.y,clamp(N.y+rnd(2.4,3.6)*(Math.random()<.5?1:-1),-5.5,5.5)]) m3Laser({u0:-14,v0:v,u1:14,v1:v,warn:.85,dur:.5,w:1.6}); }
      else { for(const u of [N.x,clamp(N.x+rnd(3,5)*(Math.random()<.5?1:-1),-9,9)]) m3Laser({u0:u,v0:-9,u1:u,v1:9,warn:.85,dur:.5,w:1.6}); } yield 1.2; } L.vd.o.look=.5; yield .3; },
  *piglets(ph){ Sound.sfx('pigroar'); for(let i=0;i<(ph>=3?9:7);i++){ m3Piglet(rnd(-8,8),rnd(-4.5,4.5)); yield .35; } yield 1.5; },
  *meteor(ph){ for(let i=0;i<4;i++){ const N=NAT; m3Shot(clamp(N.x+rnd(-2,2),-9,9),clamp(N.y+rnd(-1.5,1.5),-5,5),Game.mech.d3.hzd-2,0,0,-13,0xffb06a,1.5,{burst:9}); Sound.sfx('drone'); yield .9; } yield 1.4; },
  *chomp(ph){ const D3=Game.mech.d3; for(let i=0;i<2;i++){ const N=NAT; D3.chomp={u:N.x,v:N.y,r:4.6}; Sound.sfx('pigrumble'); L.vd.o.jaw=.6;
      const st={t:0}; while(st.t<1.1){ st.t+=.05; D3.hzd=lerp(M3.HD,18,st.t/1.1*st.t/1.1); yield .05; }
      L.vd.o.jaw=1; Game.mech.boss.lunge=1; Sound.sfx('chomp'); Sound.sfx('slam'); shake(.8); impactFrame([[3,2],[1,1]]); const c=D3.chomp; if(NAT&&Math.hypot(NAT.x-c.u,NAT.y-c.v)<c.r) m3Hurt();
      for(let k=0;k<12;k++){ const a=k*.5236; m3Shot(c.u,c.v,2,Math.cos(a)*7,Math.sin(a)*7,-6,0xff3a5a,.45); } D3.chomp=null; yield .35;
      for(let s=0;s<10;s++){ D3.hzd=lerp(18,M3.HD,(s+1)/10); yield .05; } L.vd.o.jaw=.1; yield .4; } D3.hzd=M3.HD; },
  *cross(ph){ const N=NAT, cu=N.x, cv=N.y, dir=Math.random()<.5?1:-1, b0=rnd(0,1.5); L.vd.o.look=1; for(let k=0;k<2;k++) m3Laser({cu,cv,len:20,ang:t=>b0+k*Math.PI/2+Math.max(0,t-.9)*1.1*dir,warn:.9,dur:2.6,w:1.3}); yield 2; const e=m3Eye(0); for(let i=0;i<6;i++){ m3Aim(e.u,e.v,e.d,22,0xff3a5a,.45,true); yield .25; } yield .5; L.vd.o.look=.5; },
  *blackstar(ph){ const D3=Game.mech.d3; D3.pull=4.2; Sound.sfx('suck'); L.vd.o.jaw=.8; let a=0; for(let t=0;t<4;t+=.12){ for(let k=0;k<5;k++){ const q=a+k*1.2566; m3Shot(Math.cos(q)*11,Math.sin(q)*7,Game.mech.d3.hzd-6,-Math.cos(q)*2,-Math.sin(q)*1.4,-16,0xb06aff,.5,{spin:-.6}); } a+=.31; yield .12; } D3.pull=0; L.vd.o.jaw=.1; yield .6; },
  *gridlaser(ph){ for(let r=0;r<3;r++){ const vs=[-4.5,-1.5,1.5,4.5].sort(()=>Math.random()-.5).slice(0,2), us=[-8,-4,0,4,8].sort(()=>Math.random()-.5).slice(0,2);
      for(const v of vs) m3Laser({u0:-14,v0:v+rnd(-.5,.5),u1:14,v1:v,warn:1,dur:.5,w:1.3}); for(const u of us) m3Laser({u0:u+rnd(-.5,.5),v0:-9,u1:u,v1:9,warn:1,dur:.5,w:1.3}); yield 1.7; } },
  *barrel(ph){ const D3=Game.mech.d3; Game.banner={name:'BARREL ROLL',sub:'The universe is upside down. Keep flying.',t:0,small:1}; Sound.sfx('quickboost'); const g=M3P.helix(ph,3);
    for(let t=0;t<4;t+=.09){ const u=Math.min(1,Math.max(0,(t-.6)/2.2)); D3.roll=D3.rollTo=u*u*(3-2*u)*Math.PI*2; const r=g.next(); if(r.done) break; yield .09; } D3.roll=D3.rollTo=0; yield .9; }
};
// ---------- the True Drill, aimed down the depth axis ----------
function* m3Drill(){ const N=NAT, G=Game.mech, B=G.boss, D3=G.d3; N.sp=0; G.busy=1; Game.banner=null; N.inv=99; N.charge=N.shot=0; N.atk=null; D3.eb.forEach(b=>{ const [x,y,z]=m3W(b.u,b.v,b.d); FX.spark(x,y,z); }); D3.eb=[]; D3.las.forEach(l=>l.t=Math.max(l.t,l.warn+l.dur)); D3.pull=0;
  const [nx,ny,nz]=m3W(N.x,N.y,0); const d=makeTrueDrill(); d.x=nx+1; d.y=ny+3.6; d.z=nz; d.s=.2; d.spin=10; d.dir.set(0,-1,0);
  Voice.stop(); if(Voice.on) Voice.play('nathan',MCHANT); Game.chant={t:0,idx:-1,streams:[],who:'NATHAN THE NASTY',blue:1,rows:Array.from({length:9},(_,i)=>({y:i,off:Math.random()*2000,dir:i%2?1:-1}))};
  yield wait(.18); const T=Math.max(5.4,(Voice.cur&&Voice.cur.buffer)?Voice.cur.buffer.duration-.15:6.6), lens=MPHRASES.map(s=>s.length), tot=lens.reduce((a,b)=>a+b,0);
  for(let i=0;i<4;i++){ Game.chant.idx=i; Game.chant.pt=0; Game.chant.streams.push({text:MPHRASES[i],x:1.1,y:.16+(i%2)*.62+Math.random()*.08,sp:.22+Math.random()*.1,size:38+i*6},{text:MPHRASES[i],x:1.4,y:.34+Math.random()*.3,sp:.32,size:24});
    impactFrame(i===3?[[3,3],[2,2],[1,2],[3,2]]:[[i%2?2:1,2],[3,2]]); shake(.3+i*.1); Sound.sfx('slam'); d.spin=10+i*12; d.fire=.6+i*.3;
    yield tween(d,{s:.4+(i+1)*.6,y:ny+4+(i+1)*.8,x:nx+1+(i+1)*1.2},T*lens[i]/tot,t=>t); }
  let w=0; while(Voice.speaking&&w<1.2){ yield wait(.1); w+=.1; } Game.chant.fin=1; yield wait(.2); Game.chant=null;
  const fx=M3.X0+D3.hzd-3, fy=1.5, fz=0; d.spin=70; d.fire=2.6; d.dir.set(fx-d.x,fy-d.y,fz-d.z); Sound.sfx('skyopen'); FX.flash=.4; grade.uniforms.flashCol.value.set(.6,.85,1); yield wait(.25);
  const sx=d.x, sy=d.y, sz=d.z, fl={u:0}; Sound.sfx('beam'); Game.fxUpd.push(()=>{ if(fl.done) return false; d.x=lerp(sx,fx,fl.u); d.y=lerp(sy,fy,fl.u)+Math.sin(fl.u*Math.PI)*2; d.z=lerp(sz,fz,fl.u); return true; });
  yield tween(fl,{u:1},.5,t=>t*t); fl.done=1;
  impactFrame([[1,2],[3,2],[2,1],[3,3],[1,1],[2,2],[3,1],[1,2],[2,1],[3,2],[1,1],[3,3],[2,2],[1,1],[3,2]]); FX.hitstop=.18; Sound.sfx('slam'); Sound.sfx('crossboom'); Sound.sfx('gore'); if(B){ B.flash=1.2; } L.vd.o.jaw=1;
  for(let k=0;k<6;k++) FX.ring(fx,fy,fz,k%2?'#3ff4ff':'#ff3a4a',5+k*3,.4+k*.12); FX.burst(fx,fy,fz,160,0x3ff4ff,16,.5); FX.burst(fx,fy,fz,90,0xff2a3a,13,.45);
  for(let k=0;k<10;k++){ shake(1.6-k*.12); FX.flash=k%2?.9:.2; d.spin=120; yield wait(.07); }
  d.dead=1; L.vd.o.jaw=.1; if(B){ const was=B.vuln; B.vuln=true; mechDamage(24,fx,fy,fz,true); if(!was) B.vuln=false; } N.inv=1; if(Game.mech&&Game.mech.boss&&Game.mech.boss.vuln) G.busy=0; }
