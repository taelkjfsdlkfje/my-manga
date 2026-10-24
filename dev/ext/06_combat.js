// =====================================================================
// NEW COMBAT: Shayan's fireballs, melee parries, Full Counter, Ali's mini Judgement Cut
// plus the secret toggles (0 = god mode + one-hit phases, 9 = unlock every timeline branch)
// =====================================================================
TW.god=false; TW.otk=false; TW.fb=[]; TW._ally=0;
TW_SFX.fire=function(){ Sound.hiss(1800,.12,.12,'bandpass'); Sound.tone('sawtooth',320,120,.12,.07); };
TW_SFX.bigfire=function(){ Sound.hiss(600,.5,.22,'lowpass'); Sound.tone('sawtooth',160,50,.5,.16); Sound.hiss(2600,.3,.1,'bandpass',.05); };
TW_SFX.counter=function(){ Sound.tone('square',660,1320,.12,.12); Sound.tone('square',990,1980,.18,.1,.08); Sound.hiss(5000,.2,.12,'highpass'); };
TW_SFX.punch=function(){ Sound.tone('sine',160,60,.09,.22); Sound.hiss(1200,.06,.1,'bandpass'); };

// ---------- one-hit phases + god mode, and route every player hit through the parry check ----------
function twPlayerHitHook(dmg,sx,sz,opt){ const P=Player; if(TW.god) return 'none';
  if(opt&&opt.melee&&!Game.paulLock){ const since=Game.time-twParryClock(), ok=ALI()?(P.block||since<.26):(since<.26&&P.hurt<=0); if(ok){ twMeleeParry(sx,sz,opt); return 'parry'; } }
  return null; }
function twMeleeParry(sx,sz,opt){ const P=Player, mx=lerp(P.x,sx,.45), mz=lerp(P.z,sz,.45);
  FX.hitstop=Math.max(FX.hitstop,.14); Game.slowT=Math.max(Game.slowT,.28); P.inv=Math.max(P.inv,.4); P.noBlink=Game.time+.45; Sound.sfx('parry'); Sound.sfx('deflect'); shake(.45);
  for(let i=0;i<3;i++) FX.spark(mx,P.y+1.1,mz); FX.ring(mx,P.y+.1,mz,ALI()?'#ff3a4a':'#8fd8ff',2.4,.35); FX.flash=.32; grade.uniforms.flashCol.value.set(1,1,1); impactFrame([[2,1]]);
  P.counter=Math.min(5,(P.counter||0)+1); Game.dmgNums.push({x:P.x,y:P.y+2.4,z:P.z,n:'PARRY '+P.counter+'/5',t:0,big:true,col:ALI()?'#ff8a9a':'#bfe8ff'});
  if(P.counter>=5){ Sound.sfx('counter'); Sound.sfx('ready'); FX.ring(P.x,P.y+.1,P.z,'#3a8aff',3.4,.6); TW.cReadyT=0; }
  if(opt.onParry) opt.onParry(); }
// damage multipliers for the 0 toggle: huge damage, every system already clamps at its next checkpoint
(function(){ const th=twHurt; twHurt=function(T,d,src){ if(TW.otk&&!TW._ally&&!['ally','ff','test'].includes(src)) d=9999; return th(T,d,src); };
  const db=damageBoss; damageBoss=function(d,o){ if(TW.otk&&!TW._ally) d=9999; return db(d,o); };
  const nb=nbDamage; nbDamage=function(d,u){ if(TW.otk&&!TW._ally) d=9999; return nb(d,u); };
  const md=mechDamage; mechDamage=function(d,x,y,z,b){ if(TW.otk) d=9999; return md(d,x,y,z,b); };
  const nh=natHurt; natHurt=function(s){ if(TW.god) return; return nh(s); };
  const od=Game.onDeath; Game.onDeath=function(){ if(TW.god){ Player.hp=Player.maxHp; if(NAT){ NAT.ap=NAT.maxAp; NAT.show=1; } return; } return od.call(Game); }; })();
function hzgHurtGod(d,src){ return (TW.otk&&!TW._ally&&src!=='ally'&&src!=='test')?9999:d; }

// ---------- the swing clock (parry window) + Full Counter / mini Judgement Cut ----------
(function(){ const sa=startAtk; startAtk=function(n){ const P=Player; P.swingT=Game.time; if(!ALI()&&!Game.paulLock&&(P.counter||0)>=5){ twCounterSlash(); return; } return sa(n); };
  const ag=aliGetsuga; aliGetsuga=function(big){ const P=Player; P.swingT=Game.time; if(!big&&!Game.paulLock&&(P.counter||0)>=5){ twMiniJC(); return; } return ag(big); }; })();
function twCounterSlash(){ const P=Player; P.counter=0; const tg=nearestFoe(7); if(tg) P.ang=Math.atan2(tg.z-P.z,tg.x-P.x); P.f=Math.cos(P.ang)>=0?1:-1;
  P.atk={t:0,n:2,hit:new Set(),q:false,big:1}; P.combo=2; P.charge=0; Sound.sfx('swing'); Sound.sfx('beam'); Sound.sfx('counter'); shake(.5);
  // a huge blue crescent: three times the reach, twice the height
  const flat=new THREE.Mesh(new THREE.RingGeometry(1.2,5.7,48,1,-1.55,3.1),new THREE.MeshBasicMaterial({color:0x3a9aff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  flat.rotation.x=-Math.PI/2; flat.rotation.z=-P.ang; flat.position.set(P.x,P.y+.9,P.z); flat.userData.temp=1; scene.add(flat);
  const tall=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:CRESC,color:0x5ab4ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  tall.position.set(P.x+Math.cos(P.ang)*2.6,P.y+1.5,P.z+Math.sin(P.ang)*2.6); tall.rotation.set(TILT,0,P.f>0?.4:-.4); tall.scale.set(P.f*8,4.6,1); tall.userData.temp=1; scene.add(tall);
  const k={t:0}; Game.fxUpd.push(dt=>{ k.t+=dt; const a=Math.max(0,1-k.t/.32); flat.material.opacity=a; tall.material.opacity=a; flat.scale.setScalar(1+k.t*.6); if(k.t>.32){ scene.remove(flat); scene.remove(tall); return false; } return true; });
  for(let i=0;i<40;i++){ const a=P.ang+rnd(-1.5,1.5), r=rnd(1,5.7); FX.spawn(P.x+Math.cos(a)*r,P.y+rnd(.3,3),P.z+Math.sin(a)*r,Math.cos(a)*4,rnd(0,2),Math.sin(a)*4,.4,i%3?0x5ab4ff:0xffffff,.35,0,true); }
  if(typeof NB!=='undefined'&&NB&&NB.alive&&Math.hypot(NB.x-P.x,NB.z-P.z)<7) nbDamage(40,true); }
(function(){ const mh=meleeHits; meleeHits=function(x,z,y,rad,ang,arc,dmg,set){ const any=mh(x,z,y,rad,ang,arc,dmg,set); const A=Player.atk;
    if(any&&A&&A.big&&!A.boomed){ A.boomed=1; FX.hitstop=Math.max(FX.hitstop,.18); impactFrame([[2,1],[1,1],[3,1]]); shake(1.1); FX.flash=.55; grade.uniforms.flashCol.value.set(.55,.8,1); Sound.sfx('crossboom'); Sound.sfx('slam');
      Game.dmgNums.push({x:Player.x,y:Player.y+3,z:Player.z,n:'FULL COUNTER',t:0,big:true,col:'#7ac8ff'}); }
    return any; }; })();
function twMiniJC(){ const P=Player; P.counter=0; Sound.sfx('secret'); const sat=grade.uniforms.sat.value; grade.uniforms.sat.value=.15; Game.timeScale=.02; JC.flash=.6;
  const tg=aliTargets().filter(T=>Math.hypot(T.x-P.x,T.z-P.z)<11); let t=0, n=0;
  const hit=T=>{ if(TW.foes.includes(T)) twHurt(T,4,'counter'); else if(T===TW.giant) hzgHurt(4,'counter'); else if(T===Game.boss) damageBoss(3.5); else if(typeof NB!=='undefined'&&T===NB) nbDamage(10,true); else if(T.hp>0) damageMob(T,4,Math.atan2(T.z-P.z,T.x-P.x)); };
  Game.fxUpd.push(dt=>{ t+=dt; if(t>.13&&Game.timeScale<1){ Game.timeScale=1; grade.uniforms.sat.value=sat; }
    while(n<5&&t>.15+n*.075){ n++; const T=tg.length?tg[n%tg.length]:null; let sx=UW/2, sy=UH/2; if(T){ const s=toScreen(T.x,(T.y||0)+1.4,T.z); sx=s[0]; sy=s[1]; }
      const a=rnd(0,Math.PI); JC.lines.push({x0:sx-Math.cos(a)*320,y0:sy-Math.sin(a)*320,x1:sx+Math.cos(a)*320,y1:sy+Math.sin(a)*320,t:1}); JC.flash=.35; Sound.sfx('swing'); Sound.sfx('hit'); shake(.25);
      if(T){ FX.cut(T.x,(T.y||0)+1.4,T.z); FX.burst(T.x,(T.y||0)+1.4,T.z,18,0xff2a3a,6,.3); hit(T); } }
    if(n>=5&&t>.62){ impactFrame([[3,1],[1,1]]); Sound.sfx('crossboom'); shake(.6); Game.dmgNums.push({x:P.x,y:P.y+2.8,z:P.z,n:'JUDGEMENT CUT',t:0,big:true,col:'#ff6a7a'}); return false; } return true; }); }

// ---------- Shayan's fireballs (the old block button) ----------
function shFire(dt,ctl){ const P=Player; P.fbCd=(P.fbCd||0)-dt; if(Game.paulLock||Game.mech) return;
  if(ctl&&consume('block')){ P.fbHolding=true; P.fbHold=0; if(P.fbCd<=0&&P.hurt<=0){ twFireball(false); P.fbCd=1/3; } }
  if(P.fbHolding){ if(ctl&&held.block){ const b=P.fbHold; P.fbHold+=dt; if(b<.35&&P.fbHold>=.35) Sound.sfx('charge'); if(b<2&&P.fbHold>=2){ Sound.sfx('ready'); FX.ring(P.x,P.y+.1,P.z,'#ff8a2a',2,.4); }
      if(P.fbHold>.35&&Math.random()<.6){ const a=rnd(0,6.28); FX.spawn(P.x+Math.cos(a)*.9,P.y+rnd(.6,1.6),P.z+Math.sin(a)*.9,-Math.cos(a)*2,1,-Math.sin(a)*2,.3,P.fbHold>=2?0xffd040:0xff6a1a,.22,0,true); } }
    else { if(P.fbHold>=2&&ctl) twFireball(true); P.fbHolding=false; P.fbHold=0; } } }
function twFireball(big){ const P=Player, tg=nearestFoe(18); let a=P.ang; if(tg) a=Math.atan2(tg.z-P.z,tg.x-P.x); P.ang=a; P.f=Math.cos(a)>=0?1:-1;
  const g=new THREE.Group(), core=new THREE.Mesh(new THREE.SphereGeometry(big?.42:.15,10,8),new THREE.MeshBasicMaterial({color:big?0xfff0a0:0xffd060})), gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:big?0xff6a10:0xff7a20,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  gl.scale.setScalar(big?3.4:1.1); g.add(core,gl); g.userData.temp=1; scene.add(g); const sp=big?15:25, y0=P.y+1.1, ty=tg?((tg.y||0)+(tg===Game.boss?2:1.2)):y0, d=tg?Math.hypot(tg.x-P.x,tg.z-P.z):10;
  TW.fb.push({g,big,x:P.x+Math.cos(a)*.7,y:y0,z:P.z+Math.sin(a)*.7,vx:Math.cos(a)*sp,vz:Math.sin(a)*sp,vy:clamp((ty-y0)/Math.max(.3,d/sp),-6,6),life:big?1.7:.95,dmg:big?4:1,hit:new Set(),r:big?.75:.35});
  Sound.sfx(big?'bigfire':'fire'); if(big){ shake(.3); P.vx-=Math.cos(a)*3; P.vz-=Math.sin(a)*3; FX.burst(P.x,P.y+1.1,P.z,24,0xff8a2a,5,.3); } P.beamPose=.12; }
function twFireballHit(f,x,y,z){ FX.burst(x,y,z,f.big?40:8,0xff7a1a,f.big?8:3,f.big?.4:.22); if(f.big){ FX.ring(x,y-.6,z,'#ffb050',3,.4); shake(.35); Sound.sfx('slam'); } else Sound.sfx('hit'); }
function twUpdateFireballs(dt){ const P=Player, B=Game.boss;
  for(const f of TW.fb){ f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.z+=f.vz*dt; f.g.position.set(f.x,f.y,f.z); if(Math.random()<.9) FX.spawn(f.x,f.y,f.z,-f.vx*.05,rnd(0,.6),-f.vz*.05,.25,f.big?0xffb040:0xff7a20,f.big?.5:.2,0,true);
    let dead=f.life<=0||f.y<groundY(f.x,f.z)-.2||cellH(f.x,f.z)>f.y+.3;
    for(const b of BOLTS){ if(dead) break; if(b.dead||b.friendly) continue; if(Math.hypot(b.x-f.x,b.y-f.y,b.z-f.z)<f.r+.45){ if(f.big){ b.dead=1; FX.spark(b.x,b.y,b.z); } else { dead=true; FX.spark(f.x,f.y,f.z); } } }
    const tryHit=(o,r,fn)=>{ if(dead||f.hit.has(o)) return; if(Math.hypot(o.x-f.x,o.z-f.z)<r+f.r){ f.hit.add(o); fn(); twFireballHit(f,f.x,f.y,f.z); if(!f.big) dead=true; } };
    for(const m of MOBS) if(m.hp>0) tryHit(m,.6,()=>damageMob(m,f.dmg,Math.atan2(f.vz,f.vx)));
    if(B&&B.hp>0&&!B.vanish) tryHit(B,1.1,()=>damageBoss(f.dmg));
    for(const T of TW.foes) if(T.hp>0&&!T.hide&&!T.gone) tryHit(T,.9*T.scale,()=>twHurt(T,f.dmg,'fire'));
    if(TW.giant&&TW.giant.hp>0) tryHit(TW.giant,2.3,()=>hzgHurt(f.dmg,'fire'));
    if(typeof NB!=='undefined'&&NB&&NB.alive) tryHit(NB,1.4,()=>nbDamage(f.dmg*.35));
    for(const n of NPCS.slice()) tryHit(n,.5,()=>hitNPC(n,f.dmg,Math.atan2(f.vz,f.vx)));
    if(L.dummy) tryHit(L.dummy,.5,()=>{ L.dummy.hits++; L.dummy.flash=.3; });
    if(dead){ f.dead=1; scene.remove(f.g); } }
  TW.fb=TW.fb.filter(f=>!f.dead); }
(function(){ const uw=updateWorld; updateWorld=function(dt){ uw(dt); if(!Game.mech&&!Game.zw){ twUpdateFireballs(dt); if(TW.god){ Player.hp=Math.max(Player.hp,Player.maxHp); } } else if(TW.god&&NAT) NAT.ap=NAT.maxAp; }; })();

// ---------- HUD: fireball charge, parry pips, FULL COUNTER READY ----------
function twDrawCombatHUD(){ const P=Player, t=performance.now()/1000; if(Game.state!=='play'||P.hidden||Game.paulLock) return;
  if(!ALI()&&P.fbHolding&&P.fbHold>.35){ const [sx,sy]=toScreen(P.x,P.y+2.1,P.z), k=clamp((P.fbHold-.35)/1.65,0,1); D.lineWidth=5; D.strokeStyle='rgba(10,8,20,.6)'; D.beginPath(); D.arc(sx,sy,24,0,7); D.stroke();
    D.strokeStyle=k>=1?'#ffe080':'#ff7a2a'; D.beginPath(); D.arc(sx,sy,24,-Math.PI/2,-Math.PI/2+k*Math.PI*2); D.stroke(); if(k>=1){ D.font=`700 13px ${FB}`; D.fillStyle='#ffd8a0'; D.textAlign='center'; D.fillText('BIG FIREBALL',sx,sy-32); D.textAlign='left'; } }
  const n=P.counter||0, gx=24, gy=82; for(let i=0;i<5;i++){ D.save(); D.translate(gx+8+i*20,gy+8); D.rotate(Math.PI/4); D.fillStyle=i<n?(n>=5?`hsl(${205+Math.sin(t*8)*15},100%,65%)`:(ALI()?'#ff5a6a':'#7ac8ff')):'rgba(10,14,30,.7)'; D.fillRect(-6,-6,12,12); D.strokeStyle='rgba(216,180,106,.8)'; D.lineWidth=1.5; D.strokeRect(-6,-6,12,12); D.restore(); }
  D.font=`700 13px ${FB}`; D.fillStyle=n>=5?'#cfe8ff':'#9ab0d0'; D.fillText(n>=5?(ALI()?'JUDGEMENT CUT READY · attack':'FULL COUNTER READY · attack'):'MELEE PARRIES',gx+110,gy+13);
  if(n>=5){ const [sx,sy,z]=toScreen(P.x,P.y+2.9,P.z); if(z<1){ D.save(); D.textAlign='center'; D.font=`900 ${20+Math.sin(t*10)*2}px ${FB}`; D.lineWidth=5; D.strokeStyle='#081428'; D.strokeText(ALI()?'JUDGEMENT CUT READY':'FULL COUNTER READY',sx,sy); D.fillStyle=ALI()?'#ff8a9a':'#8fd8ff'; D.fillText(ALI()?'JUDGEMENT CUT READY':'FULL COUNTER READY',sx,sy); D.restore(); } } }
(function(){ const dh=drawHUD; drawHUD=function(){ dh(); try{ twDrawCombatHUD(); }catch(e){ console.error('combatHUD',e); } }; })();

// ---------- secret keys ----------
addEventListener('keydown',e=>{ if(e.repeat) return;
  if(e.code==='Digit0'||e.code==='Numpad0'){ TW.god=!TW.god; twBig('GOD MODE: '+(TW.god?'ON':'OFF'),{size:46,col:TW.god?'#7affb0':'#ff8a9a',y:UH*.2,dur:1.6}); Sound.sfx(TW.god?'secret':'block'); }
  if(e.code==='Minus'||e.code==='NumpadSubtract'){ TW.otk=!TW.otk; twBig('ONE-HIT KILL: '+(TW.otk?'ON':'OFF'),{size:46,col:TW.otk?'#ffb05a':'#ff8a9a',y:UH*.2,dur:1.6}); Sound.sfx(TW.otk?'secret':'block'); }
  if((e.code==='Digit9'||e.code==='Numpad9')&&typeof twToggleAll==='function'){ const on=twToggleAll(); twBig('ALL BOSSES UNLOCKED: '+(on?'ON':'OFF'),{size:46,col:on?'#ffd45a':'#ff8a9a',y:UH*.2,dur:1.6}); Sound.sfx(on?'secret':'block'); } });
