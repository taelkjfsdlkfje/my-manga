// =====================================================================
// OMAR THE EDGE: reaper, darkness, void, death (and a lot of monologue)
// =====================================================================
const OM_BARK=["Feel the edge.","Darkness consumes all.","My scythes hunger.","I was born in the dark. Then they turned the lights on. Rude.","Death is just... a long nap. With scythes.","Even my shadow has a shadow."];
function twHandRise(x,z){ const gy=groundY(x,z), m=twBB(texHand(),.9,1.35); const s={t:0}; FX.burst(x,gy+.2,z,10,0x2a1a3a,3,.35,false);
  twHz({upd(dt){ s.t+=dt; const u=s.t<.15?s.t/.15:s.t<.5?1:Math.max(0,1-(s.t-.5)/.3); m.position.set(x,gy-.6+u*1.25,z); m.scale.y=Math.max(.01,u); return s.t<.8; }, kill(){ scene.remove(m); }}); }
function twBigScythe(x,z,dur){ const gy=groundY(x,z), g=new THREE.Group(); const bl=new THREE.Mesh(new THREE.TorusGeometry(1.5,.18,4,24,Math.PI*.9),new THREE.MeshBasicMaterial({color:0x0c0812})); const ed=new THREE.Mesh(new THREE.TorusGeometry(1.62,.06,4,24,Math.PI*.9),new THREE.MeshBasicMaterial({color:0xd0a0ff}));
  const pole=new THREE.Mesh(new THREE.BoxGeometry(.14,3.2,.14),new THREE.MeshBasicMaterial({color:0x2a1a30})); pole.position.set(1.5,1.4,0); g.add(bl,ed,pole); g.userData.tw=1; scene.add(g); const s={t:0};
  twHz({upd(dt){ s.t+=dt; const u=Math.min(1,s.t/dur); g.position.set(x,gy+.6+(1-u*u)*10,z); g.rotation.z=-u*2.4; if(u>=1&&s.t>dur+.25) return false; return true; }, kill(){ scene.remove(g); }}); }

TWK.omar.scythes=function*(T,ph){ const sp=twSp(T); if(Math.random()<.5) twBark('omar',ph>=2?"They always come back. Like my sadness.":"Rise, my scythes."); T.cast=.8; T.scythe=0;
  const n=ph>=3?6:ph>=2?5:4; for(let i=0;i<n;i++){ const a=rnd(0,6.28), hx=T.x+Math.cos(a)*1.6, hy=T.y+rnd(1.6,3.1), hz=T.z+Math.sin(a)*.8;
    twBolt(T,{kind:'scythe',x:hx,y:hy,z:hz,vx:0,vz:0,delay:(.55+i*.17)/sp,spd:11.5*sp,col:0x8a3aff,dmg:2,life:4,ret:ph>=2?1:0,curl:ph>=2?(i%2?1.3:-1.3):0}); FX.burst(hx,hy,hz,10,0x7a2acc,2.5,.25); }
  Sound.sfx('charge'); yield (.6+n*.17)/sp+.5; };
TWK.omar.reap=function*(T,ph){ const sp=twSp(T); const n=ph>=2?3:2; twBark('omar',ph>=2?"Reap. Reap. And... REAP.":"Behind you. Always behind you.");
  let last=null;
  for(let i=0;i<n;i++){ const P=Player, a=(P.ang||0)+Math.PI+rnd(-.6,.6), p=twClampXZ(P.x+Math.cos(a)*2.1,P.z+Math.sin(a)*2.1,.6); const mk=FX.marker(p.x,p.z,1,0x8a3aff,.45/sp);
    FX.burst(T.x,T.y+1.4,T.z,22,0x140a1a,4,.45,false); T.hide=1; Sound.sfx('dash'); yield .4/sp; T.x=p.x; T.z=p.z; T.y=groundY(p.x,p.z)+T.hy; T.hide=0; FX.burst(T.x,T.y+1.4,T.z,22,0x140a1a,4,.45,false);
    T.scythe=1; T.swing=0; const P2=Player, aa=Math.atan2(P2.z-T.z,P2.x-T.x); T.lockF=1; T.f=Math.cos(aa)>0?1:-1; T.parried=0; FX.line(T.x,T.z,aa,2.8,2.6,0xb06aff,.22/sp); yield .24/sp;
    T.swing=1; Sound.sfx('swing'); FX.arc(T.x,groundY(T.x,T.z),T.z,aa,0,true); twReapHit(T.x,T.z,aa,2.8,T); last={x:T.x,z:T.z,a:aa}; yield .32/sp; T.lockF=0; T.scythe=0; if(T.parried){ return; } }
  if(ph>=2&&last){ const S=new Sprite3D(128,128,28); S.mesh.material.color.setHex(0x7a4aff); S.glow(.5); const g={t:0}; twBark('omar',"My afterimage... is also edgy.");
    twHz({upd(dt,play){ if(play) g.t+=dt; S.draw((c,cx,by)=>drawOmarBoss(c,cx,by,Math.cos(last.a)>0?1:-1,{t:g.t,scythe:1,swing:g.t>.6?1:0,flash:0,cast:0})); S.place(last.x,groundY(last.x,last.z)+1.2,last.z,groundY(last.x,last.z));
      if(g.t>.6&&!g.done){ g.done=1; Sound.sfx('swing'); FX.arc(last.x,groundY(last.x,last.z),last.z,last.a,0,true); twReapHit(last.x,last.z,last.a,2.8,null); } return g.t<1; }, kill(){ S.dispose(); }}); }
  yield .5; };
function twReapHit(x,z,a,r,T){ const P=Player, d=Math.hypot(P.x-x,P.z-z); if(d<r&&(d<.8||angDiff(Math.atan2(P.z-z,P.x-x),a)<1.15)&&Math.abs(P.y-groundY(x,z))<2.2)
  twHitP(2,x,z,{heavy:true,melee:true,onParry:T?()=>{ T.parried=1; T.stun=Math.max(T.stun,1.5); T.flash=.3; twBark('omar',"You... parried the edge?!",true); }:null}); }
TWK.omar.hands=function*(T,ph){ const sp=twSp(T); twBark('omar',ph>=2?"The graveyard has a firm handshake.":"The dead rise... for ME."); T.cast=.6;
  if(ph<2){ for(let i=0;i<7;i++){ const P=Player, p=twClampXZ(P.x+P.vx*.25,P.z+P.vz*.25,.4); twBlast(p.x,p.z,.95,.55/sp,{col:0x9a5aff,burst:0xd8c8f0,ring:'#c08aff',dmg:2,sfx:'crash',shake:.1,onBoom(x,z){ twHandRise(x,z); }}); yield .27/sp; } yield .5; return; }
  const a0=rnd(0,6.28), arms=ph>=3?4:3; const ox=T.x, oz=T.z;
  for(let k=0;k<11;k++){ for(let m=0;m<arms;m++){ const a=a0+m*6.283/arms+k*.33, r=1.2+k*1.05, p={x:ox+Math.cos(a)*r,z:oz+Math.sin(a)*r}; const A=twLock(); if(p.x<A.x0||p.x>A.x1||p.z<A.z0||p.z>A.z1) continue;
      twBlast(p.x,p.z,.95,.55/sp,{col:0x9a5aff,burst:0xd8c8f0,ring:'#c08aff',dmg:2,sfx:k%2?'crash':'hit',shake:.06,quiet:m>0,onBoom(x,z){ twHandRise(x,z); },onHit(){ const P=Player; P.hurt=Math.max(P.hurt,.75); P.vx=P.vz=0; Game.dmgNums.push({x:P.x,y:P.y+2.4,z:P.z,n:'GRABBED',t:0,col:'#c08aff'}); }}); }
    yield .12/sp; }
  yield .7; };
TWK.omar.orbs=function*(T,ph){ const sp=twSp(T); T.cast=.8;
  if(ph<2){ twBark('omar',"Gaze into the void. It is gazing back. Awkwardly."); const bs=[];
    for(let i=0;i<3;i++){ const a=(i-1)*.7; bs.push(twAimBolt(T,'orb',T.x,T.y+1.6,T.z,3.6*sp,a,{col:0x6a1aff,homing:1.15,life:6.5})); Sound.sfx('drone'); yield .3; }
    twHz({upd(dt,play){ if(!play) return true; this.t+=dt; const P=Player; for(const b of bs){ if(b.dead||b.friendly) continue; const dx=b.x-P.x, dz=b.z-P.z, d=Math.hypot(dx,dz); if(d<5&&d>.3&&P.dash<=0){ P.x+=dx/d*1.7*dt; P.z+=dz/d*1.7*dt; }
      if(Math.random()<.4) FX.spawn(b.x+rnd(-1,1),b.y+rnd(-1,1),b.z+rnd(-1,1),0,0,0,.4,0x2a0a4a,.4,0,false); } return this.t<6.5&&bs.some(b=>!b.dead); }}); yield 1.6; return; }
  twBark('omar',"Collapse.",true); const P=Player, c=twClampXZ(P.x+P.vx*.4,P.z+P.vz*.4,2), gy=groundY(c.x,c.z), core=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:0x000000})); core.userData.tw=1; core.scale.setScalar(.01); scene.add(core);
  const halo=twGlow(0x8a2aff,1); const mk=FX.marker(c.x,c.z,1.3,0x8a2aff,2.9);
  for(let i=0;i<3;i++){ const m=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshBasicMaterial({color:0x6a1aff})); m.userData.tw=1; scene.add(m); twThrow({x:T.x,y:T.y+1.6,z:T.z,tx:c.x+rnd(-.5,.5),tz:c.z+rnd(-.5,.5),dur:.6,h:2,mesh:m,mark:false,trail:0x8a2aff}); yield .1; }
  yield .5; Sound.sfx('void'); twPull(c.x,c.z,ph>=3?4.6:3.9,2.3,{r:15}); twZone(c.x,c.z,1.2,2.3,{dmg:2,every:.5,col:0x000000,op:.9});
  const bh={t:0}; twHz({upd(dt){ bh.t+=dt; const k=Math.min(1,bh.t*2)*(bh.t>2.2?Math.max(0,1-(bh.t-2.2)*4):1); core.scale.setScalar(Math.max(.01,1.3*k)); core.position.set(c.x,gy+1.3,c.z); halo.position.copy(core.position); halo.scale.setScalar(5*k+Math.sin(bh.t*20)*.3);
      for(let i=0;i<4;i++){ const a=rnd(0,6.28), r=rnd(2,5); FX.spawn(c.x+Math.cos(a)*r,gy+1.3+rnd(-1,1),c.z+Math.sin(a)*r,-Math.cos(a)*r*1.6,0,-Math.sin(a)*r*1.6,.5,i%2?0x8a2aff:0x1a0a2a,.3,0,i%2===0); } return bh.t<2.5; }, kill(){ scene.remove(core); scene.remove(halo); }});
  yield 2.3; Sound.sfx('crossboom'); shake(.6); FX.flash=.4; grade.uniforms.flashCol.value.set(.6,.2,1);
  for(let k=0;k<14;k++){ const a=k*6.283/14; twBolt(T,{kind:'dagger',x:c.x,y:gy+1.1,z:c.z,vx:Math.cos(a)*9*sp,vz:Math.sin(a)*9*sp,dmg:2,life:2.4,col:0xb06aff}); }
  twWave(c.x,c.z,{col:0x8a2aff,sp:8,max:12}); yield 1; };
TWK.omar.sentence=function*(T,ph){ const sp=twSp(T); twBark('omar',ph>=2?"Double jeopardy. You will be executed... twice. It is legal. I checked.":"Your sentence... is death. In three.",true); Sound.sfx('gong');
  const S=TW.sentence={n:3,pulse:1}; const hist=[];
  for(let n=3;n>=1;n--){ S.n=n; S.pulse=1; Sound.sfx('tick'); for(let k=0;k<10;k++){ hist.push({x:Player.x,z:Player.z}); if(k===4&&n===2) for(let i=0;i<2;i++) twAimBolt(T,'scythe',T.x,T.y+2,T.z,0,0,{delay:.4+i*.2,spd:11,col:0x8a3aff}); yield .095/sp; } }
  S.n=0; Sound.sfx('gong'); const drop=(x,z,d)=>{ twBigScythe(x,z,.45+d); twBlast(x,z,1.7,.45+d,{col:0xff1a3a,burst:0x2a0010,ring:'#ff2a3a',dmg:4,dark:1,shake:.5,sfx:'crossboom'}); };
  const P=Player; drop(P.x,P.z,0);
  if(ph>=2){ const old=hist[Math.max(0,hist.length-10)]; drop(old.x,old.z,.25); yield .9; drop(Player.x,Player.z,0); twBark('omar',"Objection overruled.",true); }
  yield .8; TW.sentence=null; };
TWK.omar.clones=function*(T,ph){ const sp=twSp(T); twBark('omar',"Shadow Requiem. My clones are also emotionally unavailable.",true); T.cast=1; Sound.sfx('howl');
  const P=Player, n=ph>=3?5:4, a0=rnd(0,6.28), cl=[];
  for(let i=0;i<n;i++){ const a=a0+i*6.283/n, p=twClampXZ(P.x+Math.cos(a)*6.5,P.z+Math.sin(a)*5.2,.8), S=new Sprite3D(128,128,28); S.mesh.material.color.setHex(0x6a3aa8); S.glow(.35);
    cl.push({x:p.x,z:p.z,S,t:-.3-i*.42/sp,st:'wait',hit:false,d0:0,a:0}); FX.burst(p.x,groundY(p.x,p.z)+1.6,p.z,18,0x1a0a24,3,.4,false); }
  twHz({upd(dt,play){ let alive=false; for(const c of cl){ if(c.gone) continue; alive=true; if(play) c.t+=dt; const gy=groundY(c.x,c.z), P2=Player;
      if(c.st==='wait'&&c.t>=0){ c.st='tell'; c.a=Math.atan2(P2.z-c.z,P2.x-c.x); FX.line(c.x,c.z,c.a,15,1.2,0xa04aff,.55/sp); Sound.sfx('charge'); }
      else if(c.st==='tell'&&c.t>.55/sp){ c.st='dash'; Sound.sfx('dash'); }
      else if(c.st==='dash'&&play){ const s=18*sp; c.x+=Math.cos(c.a)*s*dt; c.z+=Math.sin(c.a)*s*dt; c.d0+=s*dt; if(Math.random()<.9) FX.spawn(c.x,gy+rnd(.4,3),c.z,0,0,0,.35,0x2a0a3a,.8,0,false);
        if(!c.hit&&Math.hypot(P2.x-c.x,P2.z-c.z)<1.15&&Math.abs(P2.y-gy)<1.8){ const r=twHitP(2,c.x,c.z,{heavy:true,melee:true,onParry:()=>{ c.d0=99; Game.dmgNums.push({x:c.x,y:gy+3,z:c.z,n:'SHATTER',t:0,col:'#d0a0ff'}); }}); if(r!=='none') c.hit=true; }
        if(c.d0>15){ FX.burst(c.x,gy+1.6,c.z,22,0x2a0a3a,4,.45,false); c.S.dispose(); c.gone=1; continue; } }
      c.S.draw((cv,cx,by)=>drawOmarBoss(cv,cx,by,Math.cos(c.a)>0?1:-1,{t:c.t+3,scythe:1,swing:c.st==='dash'?1:0,cast:c.st==='tell'?1:0,flash:0,form:2})); c.S.place(c.x,gy+1.1,c.z,gy); }
    return alive; }, kill(){ cl.forEach(c=>{ if(!c.gone) c.S.dispose(); }); }});
  yield (n*.42+1.6)/sp; };
TWK.omar.monologue=function*(T,ph){ const sp=twSp(T); const lines=["When I was seven... I stared into the darkness.","And the darkness... looked away. Because it was scared. Of me.","Since that day, I have worn only black. Even my socks.","Especially my socks."];
  T.hy=2.6; T.cast=4; twBig('*EDGE INTENSIFIES*',{size:44,col:'#c08aff',y:UH*.24,dur:1.6}); const ox=T.x, oz=T.z;
  for(let w=0;w<(ph>=3?2:2);w++){ twBark('omar',lines[w*2],true);
    for(let k=0;k<5;k++){ const R=2.2+k*2.2, N=Math.round(R*2.6), gap1=rnd(0,6.28), gap2=gap1+Math.PI+rnd(-.5,.5);
      for(let i=0;i<N;i++){ const a=i*6.283/N; if(angDiff(a,gap1)<.42||angDiff(a,gap2)<.42) continue; const x=ox+Math.cos(a)*R, z=oz+Math.sin(a)*R; const A=twLock(); if(x<A.x0||x>A.x1||z<A.z0||z>A.z1) continue;
        twBlast(x,z,.8,.55/sp,{col:0x8a2aff,burst:0x1a0a2a,ring:'#a04aff',dmg:2,quiet:i>0,sfx:'slam',shake:.08}); }
      yield .42/sp; }
    if(w===0){ twBark('omar',lines[1],true); yield .6; } }
  twBark('omar',lines[2],true); yield .8; twBark('omar',lines[3],true); T.hy=1.3; yield .4; };
TWK.omar.tear=function*(T,ph){ const sp=twSp(T); twBark('omar',"I will tear this world... along the dotted line.",true); Sound.sfx('tear'); const c=twCenter(), P=Player;
  for(let i=0;i<3;i++){ const a=rnd(0,Math.PI)+i*1.05, px=i===0?P.x:c.x+rnd(-4,4), pz=i===0?P.z:c.z+rnd(-3,3); twBeam({x:px-Math.cos(a)*16,z:pz-Math.sin(a)*16,ang:a,len:32,w:1.5,warn:1.05,dur:4.6,dmg:2,col:0x6a1aff,core:0x2a0a4a,y:.25,sfx:'tear'}); yield .25; }
  yield 1.1; for(let v=0;v<2;v++){ T.cast=.5; for(const k of [-1,0,1]) twAimBolt(T,'scythe',T.x,T.y+2,T.z,0,0,{delay:.35+(k+1)*.12,spd:12*sp,col:0x8a3aff}); yield 1.3; } yield .6; };
TWK.omar.harvest=function*(T,ph){ const sp=twSp(T); twBark('omar',"Lanternbrook's souls... they taste like bread.",true); Sound.sfx('choir'); const P=Player, bs=[];
  for(let i=0;i<12;i++){ const a=i*6.283/12, x=P.x+Math.cos(a)*6, z=P.z+Math.sin(a)*4.6, p=twClampXZ(x,z,.5); const b=twBolt(T,{kind:'orb',col:0x8ac8ff,x:p.x,y:groundY(p.x,p.z)+.6,z:p.z,vx:0,vz:0,vy:2.4,homing:1.5,life:7,dmg:2});
    b.vx=-Math.cos(a)*1.2*sp; b.vz=-Math.sin(a)*1.2*sp; const m=twBB(texSoul(),.9,1.1); bs.push({b,m}); yield .07; }
  twHz({upd(dt){ this.t+=dt; let any=false; for(const o of bs){ if(o.b.dead){ o.m.visible=false; continue; } any=true; o.m.position.set(o.b.x,o.b.y+.1,o.b.z); o.m.material.color.setHex(o.b.friendly?0xffffff:0xbfe8ff); if(o.b.vy>0) o.b.vy-=dt*2.5; const s=Math.hypot(o.b.vx,o.b.vz); if(s<3.4*sp&&!o.b.friendly){ o.b.vx*=1+dt; o.b.vz*=1+dt; } } return any&&this.t<8; }, kill(){ bs.forEach(o=>scene.remove(o.m)); }});
  yield 2.6; };

// ---------- LIMIT CUT I: Lights Out (eclipse of the edge) ----------
TWK.omar.lc1=function*(T){ twLCPrep(T); Game.letterTo=.35; twCutin('omar','LIGHTS OUT','Limit Break  ·  Eclipse of the Edge','#5a1a9a',2.2); twBark('omar',"You fear the dark? Good. The dark... is my whole personality.",true); Sound.sfx('gong'); yield 1.4;
  FX.burst(T.x,T.y+1.4,T.z,40,0x140a1a,6,.5,false); T.hide=1; const K=TW.dark={k:0,r:170,eyes:[],lantern:'✦ your lantern is the only light left ✦'}; Sound.sfx('void');
  twHz({upd(dt){ if(!TW.dark) return false; TW.dark.k=Math.min(1,TW.dark.k+dt*1.2); return true; }}); yield 1;
  const P=Player, ring=n=>{ K.eyes=[]; const a0=rnd(0,6.28); for(let i=0;i<n;i++){ const a=a0+i*6.283/n, p=twClampXZ(P.x+Math.cos(a)*7.2,P.z+Math.sin(a)*5.6,.6); K.eyes.push({x:p.x,y:groundY(p.x,p.z)+2,z:p.z,ph:rnd(0,6),s:1}); } };
  for(let w=0;w<3;w++){ ring(5+w); twBark('omar',["Where am I? Everywhere. Like depression.","Left. No, right. No... behind.","The dark has many eyes. All of them are mine."][w],true); yield .6;
    const pick=K.eyes.slice().sort(()=>Math.random()-.5).slice(0,3+w);
    for(const e of pick){ e.s=1.6; Sound.sfx('charge'); twBolt(T,{kind:'scythe',x:e.x,y:e.y,z:e.z,vx:0,vz:0,delay:.55,spd:11.5*twSp(T),col:0x8a3aff,dmg:2,life:4}); yield .32; e.s=1; }
    if(w>=1){ for(let i=0;i<5;i++){ const p=twClampXZ(P.x+P.vx*.25,P.z+P.vz*.25,.4); twBlast(p.x,p.z,.95,.6,{col:0x9a5aff,dmg:2,sfx:'crash',shake:.08,onBoom(x,z){ twHandRise(x,z); }}); yield .28; } }
    yield 1; }
  // which pair of eyes is the real one? only the real Omar wears eyeliner
  ring(6); const real=K.eyes[Math.floor(Math.random()*K.eyes.length)]; real.real=true; twBig('FIND THE REAL ONE',{size:54,col:'#ff4a5a',y:UH*.24,dur:1.8,sub:'Strike the true eyes. Only the real Omar wears eyeliner.'}); twBark('omar',"Which one is me? Hint: the one with eyeliner. Oh no. I said that out loud.",true);
  let found=false, tt=0, tellT=0, flicker=0;
  while(tt<8.5&&!found){ const dt=.05; tt+=dt; tellT+=dt; flicker-=dt; K.tell=(tellT%1.6)<.18; for(const e of K.eyes){ e.x+=Math.sin(tt*1.3+e.ph)*.02; }
    const P2=Player; for(const e of K.eyes){ if(e.dead) continue; let struck=P2.atk&&P2.atk.t<.2&&Math.hypot(P2.x-e.x,P2.z-e.z)<2.4;
      if(!struck) for(const b of BEAMS){ if(Math.hypot(b.x-e.x,b.z-e.z)<1.6) struck=true; } if(!struck) for(const b of BOLTS){ if(b.friendly&&!b.dead&&Math.hypot(b.x-e.x,b.z-e.z)<1.4) struck=true; }
      if(struck){ if(e.real){ found=true; break; } e.dead=1; Sound.sfx('wrong'); FX.burst(e.x,e.y,e.z,24,0xff2a3a,5,.3); Game.dmgNums.push({x:e.x,y:e.y+1,z:e.z,n:'FAKE EDGE',t:0,col:'#ff6a7a'}); twBolt(T,{kind:'scythe',x:e.x,y:e.y,z:e.z,vx:0,vz:0,delay:.3,spd:13,col:0x8a3aff,dmg:2,life:3}); } }
    yield dt; }
  if(found){ Sound.sfx('crossboom'); impactFrame([[1,2],[2,2]]); FX.flash=.6; grade.uniforms.flashCol.value.set(1,1,1); T.x=real.x; T.z=real.z; T.hide=0; FX.burst(T.x,T.y+1.4,T.z,50,0xff2a3a,7,.4); twBark('omar',"My eyeliner... SMUDGED! How did you KNOW?!",true); twBig('FOUND YOU',{size:60,col:'#ffd45a',sub:'Omar is exposed'}); }
  else { twBark('omar',"Too slow. The darkness wins. As always. *sigh*",true); twBig('JUMP!',{size:80,col:'#ff4a5a'}); const P3=Player; twWave(P3.x,P3.z,{sp:10,max:12,col:0xb06aff,dmg:3}); twWave(P3.x,P3.z,{sp:10,max:12,col:0xb06aff,dmg:3,delay:.7}); yield 1.4; T.hide=0; }
  K.eyes=[]; twHz({upd(dt){ if(!TW.dark) return false; TW.dark.k-=dt*1.5; if(TW.dark.k<=0){ TW.dark=null; return false; } return true; }});
  Game.letterTo=0; T.inv=false; T.stun=found?5:1.2; T.state='stun'; T.lcDone[2]=1; yield T.stun; };

// ---------- LIMIT CUT II: Death's Door (final judgement) ----------
TWK.omar.lc2=function*(T){ twLCPrep(T); const A=twLock(), c=twCenter(); Game.letterTo=.35; twCutin('omar',"DEATH'S DOOR",'Limit Break  ·  Final Judgement','#3a0010',2.2); Sound.sfx('gong'); twBark('omar',"I am no longer the Edge. I am... the WHOLE BLADE.",true);
  yield twMoveTo(T,c.x,A.z0+1.2,.8); const sc={k:0}; twHz({upd(dt){ sc.k=Math.min(1,sc.k+dt*.9); T.scale=1+sc.k*1.3; T.hy=1.3+sc.k*1.2; return sc.k<1; }}); grade.uniforms.red.value=.18; grade.uniforms.tint.value.set(.9,.8,1.1); Sound.sfx('void'); shake(.6); yield 1.2;
  const H=TW.hg={left:26,total:26,label:'SURVIVE THE JUDGEMENT'}; twHz({upd(dt,play){ if(!TW.hg) return false; if(play) TW.hg.left=Math.max(0,TW.hg.left-dt); return true; }});
  // a) the scythe of judgement: low sweeps, jump them
  twBark('omar',"Kneel... or jump. Mostly jump.",true);
  for(let s=0;s<2;s++){ const from=s?Math.PI-.15:.15, to=s?.15:Math.PI-.15, w=1.1; twBig('JUMP!',{size:72,col:'#ff4a5a',y:UH*.3,dur:1}); T.scythe=1; T.swing=0;
    twBeam({x:T.x,z:T.z,ang:t=>t<w?from:lerp(from,to,Math.min(1,(t-w)/1.25)),len:26,w:1.3,warn:w,dur:1.3,dmg:3,col:0xd0a0ff,core:0x2a0a3a,y:.4,jump:true,sfx:'swing'}); yield w+1.4; T.swing=1; }
  // b) the void opens: most of the floor falls away
  twBark('omar',"The floor? Gone. Like my father. He's fine, he just moved to Qatar.",true);
  for(let r=0;r<2;r++){ const cw=(A.x1-A.x0)/3, ch=(A.z1-A.z0)/3, safe=new Set(); while(safe.size<3) safe.add(Math.floor(Math.random()*9));
    for(let i=0;i<9;i++){ if(safe.has(i)) continue; const cx=A.x0+cw*(i%3+.5), cz=A.z0+ch*(Math.floor(i/3)+.5); twVoidCell(cx,cz,cw*.96,ch*.96,1.5,1.7); }
    Sound.sfx('tear'); yield 3.5; }
  // c) your soul is mine: the reaper drags you in
  twBark('omar',"Your soul... is MINE. Come here. COME HERE.",true); twBig('RUN!',{size:72,col:'#ff4a5a',y:UH*.3}); Sound.sfx('suck');
  twPull(T.x,T.z,5.2,4,{flat:true,r:60,col:0xff2a4a}); twZone(T.x,T.z+1.5,3,4,{dmg:3,every:.5,col:0x2a0010,op:.8});
  for(let i=0;i<5;i++){ for(const k of [-1,1]) twAimBolt(T,'scythe',T.x+k*2.5,T.y+3,T.z+1,0,0,{delay:.3,spd:12,col:0x8a3aff}); yield .8; }
  while(H.left>0){ const P=Player; twBlast(P.x,P.z,1.1,.6,{col:0xff1a3a,dmg:2,dark:1}); yield .6; }
  TW.hg=null; Sound.sfx('shatter'); impactFrame([[2,2],[1,2]]); twBig('JUDGEMENT SURVIVED',{size:56,col:'#ffd45a',sub:'The hourglass shatters'}); twBark('omar',"Impossible... I ran out of... edge...",true);
  const sc2={k:1}; twHz({upd(dt){ sc2.k=Math.max(0,sc2.k-dt*1.5); T.scale=1+sc2.k*1.3; T.hy=1.3+sc2.k*1.2; return sc2.k>0; }}); grade.uniforms.red.value=0; applyLook(L.look); T.scythe=0;
  yield .8; Game.letterTo=0; T.inv=false; T.stun=5.5; T.state='stun'; T.lcDone[3]=1; yield T.stun; };
function twVoidCell(x,z,w,h,warn,dur){ const gy=groundY(x,z), m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xff1a3a,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.rotation.x=-Math.PI/2; m.position.set(x,gy+.06,z); m.userData.tw=1; scene.add(m); let tick=0, on=false;
  return twHz({upd(dt,play){ if(play) this.t+=dt; if(this.t<warn){ m.material.opacity=.15+.3*(Math.floor(this.t*10)%2); return true; }
    if(!on){ on=true; m.material.blending=THREE.NormalBlending; m.material.color.setHex(0x000000); m.material.opacity=.92; m.material.needsUpdate=true; Sound.sfx('crash'); FX.burst(x,gy+.2,z,20,0x1a0a20,5,.4,false); }
    tick-=dt; const P=Player; if(play&&Math.abs(P.x-x)<w/2&&Math.abs(P.z-z)<h/2&&P.y<gy+.5&&tick<=0){ tick=.5; twHitP(3,x,z,{ub:true}); }
    if(Math.random()<.5) FX.spawn(x+rnd(-w/2,w/2),gy+.1,z+rnd(-h/2,h/2),0,-1,0,.6,0x6a1aff,.3,0,true); return this.t<warn+dur; }, kill(){ scene.remove(m); }}); }
