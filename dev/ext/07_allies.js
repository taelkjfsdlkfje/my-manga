// =====================================================================
// AI ALLIES: they move on their own, use their own moves, and get hit
// Caotan: ranged kiter, one move (Senpai Snipe). Omar: skirmisher, one move (Reap).
// Ali: teleports, Getsuga bursts, auto-parries, ults, can be downed. Damage is kept low
// so the player still has to carry the fight.
// =====================================================================
const ALLY_BARK={caotan:["I got you, senpai!","Reload! I never run dry!","Pew pew! That's the sound of loyalty!","My aim is legendary! Mostly!","Push up glasses... FIRE!"],
  omar:["The darkness fights beside you. Today.","My scythe thirsts. For that guy, specifically.","Do not thank me. Thanks are for the light.","Reaping. Still reaping.","Edge assist."],
  ali:["Too slow.","I'm only here because it's interesting.","Nothing personal.","Hm.","Don't die. It would be embarrassing for me."]};
const ALLY_HURT={caotan:["Ow! My glasses!","That one went straight to my heart. Wrong way.","I'm fine! I'm fine! I'm leaking!"],omar:["Pain... is an old friend.","My coat! I just ironed it. In the dark.","Hm. That stung my soul."],ali:["...Hm.","Interesting.","You got one. Don't get used to it."]};
function twAddAlly(who){ if(TW.allies.find(A=>A.who===who)) return; const P=Player, mhp=who==='ali'?16:12;
  TW.allies.push({who,x:P.x-1.5,z:P.z+.5,y:P.y+1.3,hy:who==='ali'?0:1.3,t:rnd(0,3),f:1,cd:rnd(1.5,2.6),flash:0,glintT:0,push:0,cast:0,fire:0,form:1,n:0,barkT:rnd(6,10),spr:null,hidden:false,
    hp:mhp,maxHp:mhp,down:0,inv:0,orb:rnd(0,6.28),blinkT:rnd(1,2),ultT:rnd(28,36),parryT:0,tx:P.x,tz:P.z}); }
function twClearAllies(){ TW.allies.forEach(A=>{ if(A.spr) A.spr.dispose(); }); TW.allies=[]; }
function twAllyTarget(){ if(typeof NB!=='undefined'&&NB&&NB.alive&&!NB.inv) return {o:NB,hit:d=>nbDamage(d*.9),r:1.4,y:2};
  const b=Game.boss; if(b&&b.hp>0&&!b.inv&&!b.vanish&&!BLOCK_ST.includes(b.state)&&b.state!=='dome') return {o:b,hit:d=>damageBoss(d),r:1,y:2};
  if(TW.giant&&TW.giant.hp>0&&!TW.giant.inv) return {o:TW.giant,hit:d=>hzgHurt(d,'ally'),r:2.4,y:2.4};
  if(TW.fight&&TW.fight.allyFoes){ const al=TW.foes.filter(T=>T.hp>0&&!T.hide&&!T.inv&&!T.gone&&!T.down); if(al.length){ const T=al[Math.floor(TW.t/5)%al.length]; return {o:T,hit:d=>twHurt(T,d,'ally'),r:1,y:1.4}; } }
  return null; }
function twAllyDeal(tg,d){ const pair=TW.allies.filter(a=>a.who!=='ali'&&!a.down).length>1; TW._ally=1; try{ tg.hit(d*(pair?.65:1)); }finally{ TW._ally=0; } }
// ---------- getting hit ----------
function twAllyHurt(A,dmg){ if(!A||A.down>0||A.inv>0||A.hidden) return; A.hp-=dmg; A.inv=.7; A.flash=.25; FX.burst(A.x,A.y+1.2,A.z,14,0xff5a6a,4,.25); Sound.sfx('hit');
  Game.dmgNums.push({x:A.x,y:A.y+2.6,z:A.z,n:dmg,t:0,col:'#ff9a9a'});
  if(A.hp<=0){ A.hp=0; A.down=A.who==='ali'?8:7; Sound.sfx('crash'); twBark(A.who,A.who==='caotan'?"I'm down! Revive me with the power of friendship! Or just wait seven seconds!":A.who==='omar'?"I have fallen. Briefly. Like the sun.":"...I'll allow it. Once.",true); }
  else if(Math.random()<.3){ const L2=ALLY_HURT[A.who]; twBark(A.who,L2[Math.floor(Math.random()*L2.length)]); } }
function twAllyAoE(x,z,r,dmg){ for(const A of TW.allies) if(!A.down&&Math.hypot(A.x-x,A.z-z)<r+.3) twAllyHurt(A,dmg); }
function twAllyLine(x,z,ux,uz,len,hw,dmg){ for(const A of TW.allies){ if(A.down) continue; const px=A.x-x, pz=A.z-z, al=px*ux+pz*uz, pe=Math.abs(px*uz-pz*ux); if(al>-.3&&al<len&&pe<hw) twAllyHurt(A,dmg); } }
function twAllyRing(x,z,r,dmg){ for(const A of TW.allies){ if(A.down||A.hy>0) continue; if(Math.abs(Math.hypot(A.x-x,A.z-z)-r)<.45) twAllyHurt(A,dmg); } }
function twAllyThreats(A){ for(const b of BOLTS){ if(b.dead||b.friendly||b.delay>0) continue; if(Math.hypot(b.x-A.x,b.z-A.z)<.85&&Math.abs(b.y-(A.y+1))<1.5){
      if(A.who==='ali'&&A.parryT<=0&&Math.random()<.6){ A.parryT=.5; reflectProj(b,'deflect'); Game.dmgNums.push({x:A.x,y:A.y+2.4,z:A.z,n:'TOO SLOW',t:0,col:'#ff8a9a'}); continue; }
      b.dead=1; twAllyHurt(A,b.dmg||2); } }
  const B=Game.boss; if(B&&B.hp>0){ const d=Math.hypot(B.x-A.x,B.z-A.z);
    if(d<1.7&&['slash','charge','frenzy'].includes(B.state)) twAllyHurt(A,2);
    for(const w of B.waves) if(w.cx!=null&&Math.abs(Math.hypot(A.x-w.cx,A.z-w.cz)-w.r)<.5) twAllyHurt(A,2);
    for(const o of B.orbs) if(o.mesh&&o.y<groundY(o.x,o.z)+1&&Math.hypot(A.x-o.x,A.z-o.z)<1.4) twAllyHurt(A,2); }
  const G=TW.giant; if(G&&G.hp>0&&Math.hypot(G.x-A.x,G.z-A.z)<2.4) twAllyHurt(A,2); }
// ---------- the brain ----------
function twUpdateAlly(A,dt,play){ const P=Player; A.t+=dt; A.flash=Math.max(0,A.flash-dt); A.glintT=Math.max(0,A.glintT-dt); A.push=Math.max(0,A.push-dt); A.cast=Math.max(0,A.cast-dt); A.fire=Math.max(0,A.fire-dt); A.inv=Math.max(0,A.inv-dt); A.parryT-=dt;
  const gy0=groundY(A.x,A.z), baseY=gy0>-50?gy0:P.y;
  if(A.down>0){ if(play) A.down-=dt; A.y=lerp(A.y,baseY+.1,Math.min(1,dt*6)); A.anim='hurt'; if(A.down<=0){ A.hp=A.maxHp; A.inv=1.2; FX.burst(A.x,A.y+1.2,A.z,30,0x9fffb0,5,.3); Sound.sfx('heart'); twBark(A.who,A.who==='caotan'?"I'm back, baby! Reserves: ENDLESS!":A.who==='omar'?"I have returned. As foretold. By me.":"...Again.",true); } return; }
  const tg=play?twAllyTarget():null;
  // where do I want to be?
  let tx,tz; if(tg){ const o=tg.o, da=Math.atan2(A.z-o.z,A.x-o.x);
    if(A.who==='caotan'){ A.orb+=dt*.35; tx=o.x+Math.cos(A.orb)*7; tz=o.z+Math.sin(A.orb)*5.5; }
    else if(A.who==='omar'){ const close=A.cd<1; A.orb-=dt*.5; const r=close?2.6:5.2; tx=o.x+Math.cos(A.orb)*r; tz=o.z+Math.sin(A.orb)*r*.8; }
    else { tx=o.x+Math.cos(da)*4.5; tz=o.z+Math.sin(da)*3.5; }
    // don't crowd the player
    const pd=Math.hypot(tx-P.x,tz-P.z); if(pd<2.2){ tx+=(tx-P.x)/(pd||1)*2; tz+=(tz-P.z)/(pd||1)*2; } }
  else { const side=A.who==='caotan'?-1:A.who==='omar'?1:0; tx=P.x-Math.cos(P.ang||0)*3+side*1.6; tz=P.z+1.4+side*.4; }
  // dodge incoming projectiles by side-stepping
  if(play&&A.who!=='ali') for(const b of BOLTS){ if(b.dead||b.friendly) continue; const d=Math.hypot(b.x-A.x,b.z-A.z); if(d<2.6){ const sx=-b.vz, sz=b.vx, sl=Math.hypot(sx,sz)||1; tx=A.x+sx/sl*2.4; tz=A.z+sz/sl*2.4; break; } }
  const c=twClampXZ(tx,tz,.8); tx=c.x; tz=c.z; const dx=tx-A.x, dz=tz-A.z, d=Math.hypot(dx,dz), spd=A.who==='ali'?5.4:A.who==='omar'?4.6:3.8;
  if(d>24){ A.x=tx; A.z=tz; } else if(d>.05){ const k=Math.min(d,spd*dt)/d; A.x+=dx*k; A.z+=dz*k; }
  const gy=groundY(A.x,A.z); A.y=lerp(A.y,(gy>-50?gy:P.y)+A.hy+(A.hy?Math.sin(A.t*1.8)*.25:0),Math.min(1,dt*5)); A.f=(tg?tg.o.x:tx)>A.x?1:-1; A.anim=d>.3?'run':'idle';
  if(!A.hy&&Math.random()<.25) FX.spawn(A.x,A.y+.2,A.z,0,.5,0,.4,0xb0182a,.2,0,true);
  if(!play||Player.hidden) return; twAllyThreats(A); if(!tg) return;
  A.barkT-=dt; if(A.barkT<=0){ A.barkT=rnd(10,16); const L2=ALLY_BARK[A.who]; twBark(A.who,L2[Math.floor(Math.random()*L2.length)]); }
  const o=tg.o;
  if(A.who==='ali'){ // teleport around, burst Getsugas, ult on a long timer
    A.blinkT-=dt; if(A.blinkT<=0){ A.blinkT=rnd(2.2,3.4); aliGhost(A.x,A.y,A.z); const a=rnd(0,6.28), p=twClampXZ(o.x+Math.cos(a)*4.6,o.z+Math.sin(a)*3.6,.8); A.x=p.x; A.z=p.z; FX.burst(A.x,A.y+1,A.z,20,0x0c0814,4,.3,false); Sound.sfx('dash'); }
    A.ultT-=dt; if(A.ultT<=0){ A.ultT=rnd(36,44); twAllyJC(A,tg); return; }
    A.cd-=dt; if(A.cd<=0){ A.cd=rnd(1.6,2.1); A.flash=.15; Sound.sfx('beam'); for(let i=0;i<3;i++) twAllyShot(A,o,tg,0xff2a3a,.5,'crescent',i*.13); } return; }
  A.cd-=dt; if(A.cd>0) return;
  if(A.who==='caotan'){ A.cd=rnd(3.3,3.9); A.push=.5; A.glintT=.5; A.glintN=1; Sound.sfx('ting'); const ang=Math.atan2(o.z-A.z,o.x-A.x); FX.line(A.x,A.z,ang,Math.hypot(o.x-A.x,o.z-A.z),.6,0xffb0e0,.3);
    const hold={t:0}; twHz({upd(dt2,pl){ if(pl) hold.t+=dt2; if(hold.t<.3) return true; if(A.down>0) return false; twAllyRay(A.x,A.y+1.9,A.z,o.x,(o.y||0)+tg.y,o.z,0xffb0e0); twAllyDeal(tg,2.2); return false; }}); }
  else { A.cd=rnd(4,4.6); A.cast=.4; const p=twClampXZ(o.x-Math.cos(TW.t)*1.8,o.z+.7,.6); FX.burst(A.x,A.y+1.4,A.z,22,0x140a1a,4,.4,false); A.x=p.x; A.z=p.z; FX.burst(A.x,A.y+1.4,A.z,22,0x140a1a,4,.4,false);
    FX.arc(o.x,(o.y||0),o.z,Math.atan2(o.z-A.z,o.x-A.x),0,true); FX.cut(o.x,(o.y||0)+1.6,o.z+.4); Sound.sfx('swing'); Sound.sfx('dash'); twAllyDeal(tg,2.5); } }
function twAllyJC(A,tg){ const o=tg.o; twBark('ali',"Nothing personal.",true); Sound.sfx('secret'); let t=0,n=0; JC.flash=.5;
  Game.fxUpd.push(dt=>{ t+=dt; while(n<5&&t>.1+n*.08){ n++; const s=toScreen(o.x,(o.y||0)+1.4,o.z), a=rnd(0,Math.PI); JC.lines.push({x0:s[0]-Math.cos(a)*260,y0:s[1]-Math.sin(a)*260,x1:s[0]+Math.cos(a)*260,y1:s[1]+Math.sin(a)*260,t:1});
      FX.cut(o.x,(o.y||0)+1.4,o.z); Sound.sfx('hit'); twAllyDeal(tg,1.1); } if(n>=5){ Sound.sfx('crossboom'); shake(.4); return false; } return true; }); }
function twAllyShot(A,o,tg,col,dmg,kind,delay){ let mesh;
  if(kind==='crescent'){ mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.MeshBasicMaterial({map:CRESC,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); mesh.rotation.x=TILT; }
  else { mesh=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:col})); }
  mesh.userData.tw=1; scene.add(mesh); const s={x:A.x,y:A.y+1.2,z:A.z}, dly=delay||0;
  twHz({upd(dt,play){ if(!play) return true; this.t+=dt; if(this.t<dly){ mesh.visible=false; return true; } mesh.visible=true; const tx=o.x, ty=(o.y||0)+tg.y, tz=o.z, dx=tx-s.x, dy=ty-s.y, dz=tz-s.z, d=Math.hypot(dx,dy,dz)||1, sp=16;
    s.x+=dx/d*sp*dt; s.y+=dy/d*sp*dt; s.z+=dz/d*sp*dt; mesh.position.set(s.x,s.y,s.z); mesh.rotation.z+=dt*14; if(Math.random()<.7) FX.spawn(s.x,s.y,s.z,0,0,0,.25,col,.25,0,true);
    if(d<tg.r+.3){ twAllyDeal(tg,dmg); FX.burst(s.x,s.y,s.z,10,col,3,.25); return false; } return this.t<3; }, kill(){ scene.remove(mesh); }}); }
function twAllyRay(x0,y0,z0,x1,y1,z1,col){ const m=[beamMesh(col,.22),beamMesh(0xffffff,.08)]; m.forEach(o=>{ o.userData.tw=1; o.position.set(x0,y0,z0); o.lookAt(x1,y1,z1); o.scale.set(1,1,Math.hypot(x1-x0,y1-y0,z1-z0)); });
  Sound.sfx('beam'); FX.burst(x1,y1,z1,16,col,4,.3); twHz({upd(dt){ this.t+=dt; const k=Math.max(0,1-this.t/.3); m.forEach(o=>{ o.scale.x=o.scale.y=Math.max(.01,k); }); return this.t<.3; }, kill(){ m.forEach(o=>scene.remove(o)); }}); }
// little HP bars over the allies' heads
function twDrawAllyBars(){ if(Game.state!=='play') return; for(const A of TW.allies){ if(A.hidden) continue; const [x,y,z]=toScreen(A.x,A.y+(A.who==='ali'?2.4:3.2),A.z); if(z>1) continue;
  D.fillStyle='rgba(10,6,12,.75)'; D.fillRect(x-30,y,60,7); D.fillStyle=A.down>0?'#6a6a7a':'#5ae08a'; D.fillRect(x-30,y,60*(A.down>0?1-A.down/8:A.hp/A.maxHp),7); D.strokeStyle='rgba(216,180,106,.7)'; D.lineWidth=1; D.strokeRect(x-30,y,60,7);
  D.font=`700 11px ${FB}`; D.fillStyle='#e8f0e0'; D.textAlign='center'; D.fillText(A.down>0?'DOWN '+Math.ceil(A.down):(A.who==='ali'?'Ali':A.who==='omar'?'Omar':'Caotan'),x,y-3); D.textAlign='left'; } }
(function(){ const dh=drawHUD; drawHUD=function(){ dh(); try{ twDrawAllyBars(); }catch(e){} }; })();
