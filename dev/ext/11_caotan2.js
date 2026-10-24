// =====================================================================
// CAOTAN, REWORKED: glints you react to, phones you swat back, a 3-rush you parry
// =====================================================================
// ✦ one glint: he blinks in and slashes almost instantly. Attack (parry) or dash right after the glint.
TWK.caotan.glint1=function*(T,ph){ const reps=ph>=3?2:1;
  for(let r=0;r<reps;r++){ yield* twGlint(T,1,.01); yield ph>=3?.27:ph>=2?.3:.33;
    twBlinkTo(T,'front',1.25,0xffb0e0); FX.burst(T.x,T.y+1.4,T.z,16,0xff8ac8,4,.3); T.parried=0;
    twBark('caotan',r?"Again! Senpai Snipe!":ph>=2?"Senpai Snipe: no-scope!":"Senpai Snipe!");
    twSlash(T,3,2.7,{n:2,onParry:()=>{ T.parried=1; }});
    if(T.parried){ T.stun=Math.max(T.stun,1.4); T.swing=0; T.lockF=0; twBark('caotan',["Y-you saw that coming?!","My fastest move... parried... by HIM?"][r%2],true); return; }
    yield .55; T.swing=0; T.lockF=0; }
  yield .35; };

// ✦✦ two glints: two lasers. The first gives you a blink of warning; the second lands just past where your dodge ends.
TWK.caotan.glint2=function*(T,ph){ const rounds=ph>=3?2:1; twBark('caotan',ph>=2?"Double Take! Dodge THIS. And... THIS.":"Double Take!");
  for(let r=0;r<rounds;r++){ yield* twGlint(T,2,.13);
    const P=Player, a=Math.atan2(P.z-T.z,P.x-T.x), ux=Math.cos(a), uz=Math.sin(a), nx=-uz, nz=ux, w1=ph>=3?.26:.3, back=6;
    const x0=T.x-ux*back, z0=T.z-uz*back, len=back+Math.max(8,twRayWall(T.x,T.z,ux,uz).t+2);
    T.push=.3; Sound.sfx('ting'); twBeam({x:x0,z:z0,ang:a,len,w:1.2,warn:w1,dur:.16,dmg:3,col:0x9fd8ff});
    yield w1+.03;
    const P2=Player, side=Math.sign((P2.x-T.x)*nx+(P2.z-T.z)*nz)||(Math.random()<.5?1:-1), off=side*3.1;
    T.push=.3; Sound.sfx('ting'); twBeam({x:x0+nx*off,z:z0+nz*off,ang:a,len,w:1.2,warn:ph>=3?.34:.4,dur:.16,dmg:3,col:0xffb0e0});
    yield .75; }
  yield .3; };

// Tsundere Triple Rush: parry all three to stun him
TWK.caotan.tsun=function*(T,ph){ const sp=twSp(T); T.heartEyes=1; twBark('caotan',"I-it's not like I WANTED to hit you! B-baka!!",true); Sound.sfx('doki'); twComboStart(T,3);
  for(let i=0;i<3;i++){ const P=Player, a=Math.atan2(P.z-T.z,P.x-T.x), d=Math.min(15,Math.hypot(P.x-T.x,P.z-T.z)+3.5), tell=(i?.45:.6)/sp;
    FX.line(T.x,T.z,a,d,1.5,0xff6ab0,tell); T.lockF=1; T.f=Math.cos(a)>0?1:-1; yield tell;
    const s={t:0,hit:false,dur:d/17}; Sound.sfx('dash'); T.parried=0;
    twHz({upd(dt,play){ if(!play) return true; s.t+=dt; T.x+=Math.cos(a)*17*dt; T.z+=Math.sin(a)*17*dt; const c=twClampXZ(T.x,T.z,.5); T.x=c.x; T.z=c.z; FX.spawn(T.x,T.y+1.4,T.z,0,0,0,.35,0xff8ac8,.6,0,true);
      const P2=Player; if(!s.hit&&Math.hypot(P2.x-T.x,P2.z-T.z)<1.15&&Math.abs(P2.y-groundY(T.x,T.z))<2){ const r=twComboHit(T,2,T.x,T.z,{onParry:()=>{ T.parried=1; }}); if(r!=='none') s.hit=true; }
      return s.t<s.dur&&!T.parried; }}); yield s.dur+.1;
    if(T.parried&&i<2) twBark('caotan',["Hmph! Lucky!","AGAIN?! Stop deflecting my feelings!"][i],true); }
  T.lockF=0;
  if(twComboEnd(T,3.6)){ twBark('caotan',"Three parries... my heart... it's going doki doki for the wrong reasons...",true); T.heartEyes=0; return; }
  twBark('caotan',"*SLAP*",true); twBlast(T.x,T.z,2.4,.35,{col:0xff3a7a,dmg:3,shake:.5}); twWave(T.x,T.z,{sp:8,max:9,col:0xff6ab0,delay:.35}); yield .9; T.heartEyes=0; };

// Waifu phones: swat them back. He catches it, and returns it at point-blank speed. Parry that too.
TWK.caotan.letters=function*(T,ph){ const sp=twSp(T); twBark('caotan',ph>=2?"Calling you! Calling you! CALLING YOU!":"Pick up, senpai! It's your waifu calling!"); T.cast=.6;
  const st={caught:false,busy:false}, n=ph>=3?10:ph>=2?8:6;
  for(let i=0;i<n;i++){ const P=Player, a=rnd(0,6.28), r=i===0?0:rnd(1,3.6), p=twClampXZ(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r,.6);
    T.fire=.15; Sound.sfx('swing'); twPhone(T,p.x,p.z,.95/sp,st,ph); yield .16/sp; }
  yield 1.1; let w=0; while(st.busy&&w<40){ w++; yield .1; } yield .3; };
function twPhone(T,tx,tz,dur,st,ph){ const sx=T.x, sy=T.y+1.5, sz=T.z, gy=groundY(tx,tz), mk=FX.marker(tx,tz,.95,0xff3a7a,dur+.05), m=twBB(texLetter(),1.1,.75), q={t:0,mode:'arc',x:sx,y:sy,z:sz};
  return twHz({upd(dt,play){ if(play) q.t+=dt; const P=Player;
    if(q.mode==='arc'){ const u=Math.min(1,q.t/dur); q.x=lerp(sx,tx,u); q.z=lerp(sz,tz,u); q.y=lerp(sy,gy+.4,u)+Math.sin(u*Math.PI)*3;
      const swat=Game.time-twParryClock()<.3||(ALI()&&P.block);
      if(play&&u>.3&&swat&&Math.hypot(P.x-q.x,P.z-q.z)<2.1&&Math.abs(q.y-(P.y+1))<2.4){ q.mode='back'; q.t=0; q.sx=q.x; q.sy=q.y; q.sz=q.z; if(mk){ scene.remove(mk.m); }
        Sound.sfx('deflect'); FX.spark(q.x,q.y,q.z); Game.dmgNums.push({x:q.x,y:q.y+.8,z:q.z,n:'DECLINED',t:0,col:'#ff9ad8'}); }
      else if(u>=1){ Sound.sfx('kyun'); twHeartBurst(tx,tz,12); FX.ring(tx,gy,tz,'#ff6ab0',1.6,.35); if(play&&twInR(tx,tz,.95,1.8)) twHitP(2,tx,tz,{ub:true}); if(ph>=2) twWave(tx,tz,{sp:6,max:4.2,col:0xff6ab0}); return false; } }
    else { const u=Math.min(1,q.t/.35); q.x=lerp(q.sx,T.x,u); q.z=lerp(q.sz,T.z,u); q.y=lerp(q.sy,T.y+1.4,u);
      if(u>=1){ if(!st.caught&&!T.down&&T.hp>0&&T.state!=='lc'){ st.caught=true; st.busy=true; twPhoneCatch(T,st); } else { twHurt(T,2,'bolt'); T.flash=.2; FX.burst(T.x,T.y+1.4,T.z,10,0xff6ab0,3,.25); Sound.sfx('hit'); } return false; } }
    m.position.set(q.x,q.y,q.z); m.rotation.z+=dt*(q.mode==='arc'?10:22); if(Math.random()<.6) FX.spawn(q.x,q.y,q.z,0,0,0,.3,0xff8ac8,.22,0,true); return true; },
    kill(){ scene.remove(m); if(mk) scene.remove(mk.m); }}); }
function twPhoneCatch(T,st){ const c={t:0,stage:0}, m=twBB(texLetter(),1.2,.8); m.visible=false; T.lockF=1; T.cast=.6; Sound.sfx('ting'); T.push=.4; T.glintT=.4;
  twBark('caotan',["Oh? You want my number? HERE'S MY NUMBER!","You hung up on me?! Nobody hangs up on me!","Return to sender? Return to SENDER?!"][Math.floor(Math.random()*3)],true);
  twHz({upd(dt,play){ if(!play) return true; c.t+=dt; const P=Player;
    if(c.stage===0){ if(c.t>.55){ c.stage=1; c.t=0; c.x=T.x; c.y=T.y+1.4; c.z=T.z; const a=Math.atan2(P.z-T.z,P.x-T.x); c.vx=Math.cos(a)*30; c.vz=Math.sin(a)*30; m.visible=true; Sound.sfx('whoosh'); T.fire=.3; } return true; }
    if(c.stage===1){ c.x+=c.vx*dt; c.z+=c.vz*dt; c.y=lerp(c.y,P.y+1,Math.min(1,dt*8)); m.position.set(c.x,c.y,c.z); m.rotation.z+=dt*30; FX.spawn(c.x,c.y,c.z,0,0,0,.25,0xffffff,.3,0,true);
      if(Math.hypot(P.x-c.x,P.z-c.z)<1.2&&!c.tried){ c.tried=1; const r=twHitP(3,c.x,c.z,{melee:true,heavy:true,onParry:()=>{ c.stage=2; c.t=0; c.sx=c.x; c.sz=c.z; Game.dmgNums.push({x:P.x,y:P.y+2.8,z:P.z,n:'CALL DECLINED',t:0,big:true,col:'#ffd45a'}); }});
        if(r==='hit'){ twPhoneBoom(c.x,c.z,false); c.done=1; } }
      if(c.t>.6&&!c.done){ twPhoneBoom(c.x,c.z,true); c.done=1; } return !c.done; }
    // stage 2: parried straight back into his face
    const u=Math.min(1,c.t/.18); c.x=lerp(c.sx,T.x,u); c.z=lerp(c.sz,T.z,u); m.position.set(c.x,T.y+1.4,c.z); m.rotation.z+=dt*40;
    if(u>=1){ twPhoneBoom(T.x,T.z,false,true); twHurt(T,6,'bolt'); T.stun=Math.max(T.stun,1.8); T.flash=.5; twBark('caotan',"MY PHONE! My SAVE FILES! Hikari-chan's VOICE MESSAGES!",true); return false; } return true; },
    kill(){ scene.remove(m); T.lockF=0; st.busy=false; }}); }
function twPhoneBoom(x,z,quiet,onHim){ const gy=groundY(x,z); Sound.sfx('crossboom'); shake(onHim?.6:.4); FX.burst(x,gy+1,z,34,0xff6ab0,6,.35); FX.burst(x,gy+1,z,18,0xffffff,4,.3); FX.ring(x,gy+.1,z,'#ff9ad8',3,.35); twHeartBurst(x,z,20);
  if(!onHim&&!quiet){ /* the hit already landed */ } else if(!onHim&&twInR(x,z,1.6,2.2)) twHitP(2,x,z,{ub:true}); }

// the dating sim is now lethal: stand on the right answer or die
function twQuizDeath(){ const P=Player; if(TW.god){ Game.dmgNums.push({x:P.x,y:P.y+2.4,z:P.z,n:'GOD MODE',t:0,col:'#7affb0'}); return; }
  FX.burst(P.x,P.y+1,P.z,60,0xff2a5a,8,.5); twHeartBurst(P.x,P.z,40); P.inv=0; hurtPlayer(999,P.x,P.z); }
