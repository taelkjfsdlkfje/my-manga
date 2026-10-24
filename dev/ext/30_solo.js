// =====================================================================
// SOLO FIGHT: the twin you spared betrays you among the white flowers
// =====================================================================
const TW_HP={shayan:[0,150,175,200],ali:[0,120,150,175]};
const TW_MUSIC={caotan:['','battle','boss','diva'],omar:['','boss','requiem','seraph']};
const TW_TITLE={caotan:['Caotan Cummaster','The Thirsty Gatekeeper','Magical Senpai Mode ☆','Senpai Unchained'],omar:['Omar the Edge','Reaper of Lanternbrook','Darkness Form','The Void Has a Name']};
function twHPFor(ph){ return TW_HP[ALI()?'ali':'shayan'][ph]; }
function twArenaAround(cx,cz){ return {x0:3,x1:L.w-3,z0:3,z1:L.d-3}; }
function twMeta(T){ T.title=TW_TITLE[T.who][0]; T.sub=TW_TITLE[T.who][T.phase]; }
function twStartSolo(who,o){ o=o||{}; const c=L.zone?{x:L.zone.x,z:L.zone.z}:{x:Player.x,z:Player.z}, lock=twArenaAround(c.x,c.z);
  twClearFoes(); const T=twMake(who,c.x,c.z-4.5,{hp:twHPFor(1),maxHp:twHPFor(1),phases:3,form:1}); twMeta(T);
  const F=TW.fight={kind:'solo',who,lock,center:c,cd:T=>[0,1.05,.8,.62][T.phase]*(ALI()?.85:1),
    onHurt(T,d){ if(T.phase>=2&&!T.lcDone[T.phase]&&T.state!=='lc'&&T.hp<=T.maxHp/2){ T.hp=T.maxHp/2; T.state='lc'; T.gen=TWK[who]['lc'+(T.phase-1)](T); T.wait=0; }
      if(T.hp<=0&&!F.pend&&!T.dying){ T.dying=1; T.inv=true; T.gen=null; T.stun=0; twClearHz(); BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); F.pend=()=>twPhaseCine(F,T); } },
    respawn(){ twSoloRestart(F,T); }};
  Game.arena={lock}; Game.bossPhaseStart=1; Sound.play(TW_MUSIC[who][1]); Cam.zoom=1.22; Cam.cine=null; Game.letterTo=0; Game.state='play'; T.cd=1.2; return T; }
function twSoloRestart(F,T){ twClearHz(); BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); TW.dark=TW.vn=TW.hg=TW.sentence=TW.spot=null; Game.subtitle=null;
  Object.assign(T,{noAttack:0,hp:T.maxHp,gen:null,stun:0,inv:false,state:'idle',cd:1.6,hide:0,scale:1,hy:1.3,dying:0,mv:null,glintN:0,nose:0,heartEyes:0,lockF:0,cracked:0,scythe:0});
  T.lcDone[T.phase]=0; T.x=F.center.x; T.z=F.center.z-4.5; resetPlayer({x:F.center.x,z:F.center.z+4.5},true); Player.hp=Player.maxHp; Player.f=1;
  Game.arena={lock:F.lock}; Cam.cine=null; Cam.focus=null; Cam.zoom=1.22; Game.letterTo=0; Game.fade=1; Game.fadeTo=0; grade.uniforms.red.value=0; applyLook(L.look); twFormLook(T);
  Sound.play(TW_MUSIC[T.who][T.phase]); Game.banner={name:'Phase '+['','I','II','III'][T.phase],sub:T.sub,t:0,small:1}; }
function twFormLook(T){ if(T.phase<2) return; const u=grade.uniforms; if(T.who==='caotan'){ u.tint.value.set(1.1,.95,1.08); u.sat.value=1.2; } else { u.tint.value.set(.82,.78,1.05); u.sat.value=.8; if(T.phase>=3){ u.tint.value.set(.75,.62,1.1); u.red.value=.06; } } }
// camera helpers: a slow orbit around someone
function twOrbit(o,r,h,a0,a1,dur,ly){ const s={u:0}; Game.fxUpd.push(dt=>{ if(s.dead) return false; s.u=Math.min(1,s.u+dt/dur); const a=lerp(a0,a1,s.u*(2-s.u)); cineSet(o.x+Math.sin(a)*r,(o.y||0)+h,o.z+Math.cos(a)*r,o.x,(o.y||0)+(ly||1.6),o.z); return s.u<1; }); return s; }
function* twFrame(T,P){ const mx=(T.x+P.x)/2, mz=(T.z+P.z)/2; yield cineTo([mx,4.2,mz+11],[mx,1.4,mz],.9,t=>t*(2-t)); }

function* twPhaseCine(F,T){ const P=Player, who=T.who, H=HERO(), hz=!!Game.hamza&&Game.hamza.mode!=='hidden', mira=Game.actors.find(a=>a.kind==='cage'&&!a.open);
  Sound.stop(); Game.letterTo=1; P.inv=99; T.inv=true; T.gen=null; T.mv=null; T.hide=0; T.scale=1; T.hy=1.3; TW.dark=TW.vn=TW.hg=TW.sentence=TW.spot=null; Game.subtitle=null;
  if(T.phase>=3){ yield* twSoloDefeat(F,T); return; }
  T.down=1; Game.slowT=.8; FX.flash=.6; grade.uniforms.flashCol.value.set(1,1,1); impactFrame([[2,2],[1,1]]); Sound.sfx('crash'); shake(.6);
  yield* twFrame(T,P); yield wait(.4);
  if(who==='caotan'&&T.phase===1){
    yield say('caotan',"Haa... haa... you're stronger than I thought, senpai.");
    yield say(H,ALI()?"Get up. You're wasting my time.":"Can we stop calling me senpai? I'm a blacksmith. I make horseshoes.");
    yield say('caotan',"Fine. You leave me no choice. I'll have to go...");
    twCamT(T,7.5,0); yield wait(.3); T.down=0;
    yield say('caotan',"...MAGICAL.");
    Sound.sfx('sparkle'); Sound.sfx('choir'); const orb=twOrbit(T,8.5,2.6,-.9,.9,3.4,1.8);
    const rib={on:1}; Game.fxUpd.push(()=>{ if(!rib.on) return false; for(let i=0;i<6;i++){ const a=performance.now()/200+i*1.05, r=1.2+Math.sin(performance.now()/300+i)*.3; FX.spawn(T.x+Math.cos(a)*r,T.y+rnd(0,3.4),T.z+Math.sin(a)*r,0,2.2,0,.6,i%2?0xff6ab0:0xffd0ec,.35,0,true); } return true; });
    yield wait(1.2); evaCard(['MAGICAL SENPAI','CAOTAN ☆ TRANSFORMATION'],1.8,1); Sound.sfx('slam'); impactFrame([[1,2],[3,2],[2,2]]); yield wait(1.6);
    T.form=2; T.tint=0xffe8f4; for(let i=0;i<3;i++){ yield* twGlint(T,1,.18,1); } grade.uniforms.tint.value.set(1.1,.95,1.08); grade.uniforms.sat.value=1.2; rib.on=0; orb.dead=1;
    twHeartBurst(T.x,T.z,60); FX.ring(T.x,groundY(T.x,T.z),T.z,'#ff6ab0',10,.8); Sound.sfx('kyun');
    yield say('caotan',"Kira kira~! Magical Senpai Caotan, here to punish you in the name of the MOON! ...And also me.",'happy');
    twCamP(6.5,1.4);
    yield say(H,ALI()?"...I'm going to pretend I didn't see that.":"Did he just... get a TRANSFORMATION SEQUENCE? Do I get one?! Hamza, do I get one?!");
    if(hz&&!ALI()) yield say('hamza',"Bismillah. No. Just swing the sword.",'happy');
    if(mira) yield say('mira',ALI()?"Ali, he has sparkles. Why does he have sparkles.":"Shayan! He's got sparkles now! Don't let the sparkles win!",'worried');
  } else if(who==='caotan'){
    yield say('caotan',"You keep rejecting me... but you keep coming BACK. That's called a situationship, senpai.");
    yield say(H,ALI()?"It's called me killing you slowly.":"It's called you STANDING BETWEEN ME AND MIRA.");
    T.down=0; cineSet(T.x,.8,T.z+10,T.x,4,T.z); Sound.sfx('drone');
    yield say('caotan',"I've been holding back. This whole time. My true power... my FINAL FORM...");
    const heart=twBB(texHeart('#ff3a8a'),14,14,{add:true,op:.0}); heart.position.set(T.x,T.y+9,T.z-8); const hk={k:0}; Game.fxUpd.push(dt=>{ if(hk.dead) return false; hk.k=Math.min(1,hk.k+dt*.6); heart.material.opacity=hk.k*.55*(1+.15*Math.sin(performance.now()/120)); heart.scale.setScalar(1+.05*Math.sin(performance.now()/120)); return true; });
    Sound.sfx('doki'); yield tween(T,{hy:2.8},1.4,t=>t*(2-t)); yield* twGlint(T,3,.12,1); T.form=3; T.tint=0xffd8f0;
    evaCard(['CAOTAN-SAMA','SENPAI UNCHAINED'],1.8,1); Sound.sfx('slam'); impactFrame([[3,2],[1,2],[2,2],[1,1]]); shake(1); grade.uniforms.tint.value.set(1.18,.9,1.1); yield wait(1.8);
    twCutin('caotan','SENPAI UNCHAINED','Phase III  ·  He is no longer pretending to be normal','#ff3a8a',2); yield wait(1.4);
    yield say('caotan',"No more holding back. No more 'just friends'. Senpai... I am going to love you TO DEATH. Literally. With lasers.",'angry');
    hk.dead=1; scene.remove(heart); T.hy=1.3;
    if(mira) yield say('mira',ALI()?"Ali. Please. End this. I can't watch any more anime.":"Shayan, Mira is watching this. MIRA IS WATCHING THIS.",'worried');
    if(!ALI()&&mira) yield say('shayan',"Why are you talking about yourself in third person?!");
  } else if(who==='omar'&&T.phase===1){
    yield say('omar',"You... have awoken... the darkness.");
    yield say(H,ALI()?"It was awake. You've been saying it's awake for an hour.":"It was awake! You said it was awake! Like four times!");
    yield say('omar',"It was napping. Now it is awake. And CRANKY.");
    T.down=0; cineSet(T.x,1,T.z+10,T.x,3.2,T.z); Sound.sfx('void'); Sound.sfx('howl'); const orb=twOrbit(T,9,2,.8,-.8,3.2,2);
    const dk={k:0}; Game.fxUpd.push(dt=>{ if(dk.dead) return false; dk.k=Math.min(1,dk.k+dt*.5); grade.uniforms.tint.value.set(1-dk.k*.18,1-dk.k*.22,1+dk.k*.05); grade.uniforms.sat.value=1.1-dk.k*.3;
      for(let i=0;i<5;i++) FX.spawn(T.x+rnd(-8,8),groundY(T.x,T.z)+.1,T.z+rnd(-6,6),0,rnd(1,3),0,1,0x0a0410,.35,-.5,false); return dk.k<1; });
    yield wait(1.4); T.form=2; FX.burst(T.x,T.y+2,T.z,80,0x140a1a,8,.5,false); FX.burst(T.x,T.y+2,T.z,40,0x8a3aff,6,.35); Sound.sfx('crossboom'); shake(.8);
    evaCard(['DARKNESS FORM','OMAR THE EDGE, UNSHEATHED'],1.8,1); impactFrame([[2,2],[3,2],[1,2]]); yield wait(1.8); orb.dead=1;
    yield say('omar',"Behold. My wings. I made them myself. From my old coats. And my feelings.");
    twCamP(6.5,1.4);
    yield say(H,ALI()?"They look like wet umbrellas.":"The flowers went BLACK. You killed the FLOWERS, man!");
    yield say('omar',"The flowers were too happy. I fixed them.");
    if(mira) yield say('mira',"Is he... is he crying? Under the hood? I think he's crying.",'worried');
  } else {
    yield say('omar',"Do you know what's beyond darkness?");
    yield say(H,ALI()?"Me.":"More darkness? Slightly darker darkness?");
    yield say('omar',"...The VOID. It's like darkness, but it has a podcast.");
    T.down=0; cineSet(T.x,.6,T.z+9,T.x,6,T.z-6); Sound.sfx('void'); yield tween(T,{hy:3.2},1.3,t=>t*(2-t));
    yield say('omar',"I will eat the moon. Watch.");
    const sky={k:0}; Game.fxUpd.push(dt=>{ if(sky.dead) return false; sky.k=Math.min(1,sky.k+dt*.7); grade.uniforms.tint.value.set(.82-sky.k*.08,.78-sky.k*.16,1.05+sky.k*.05); grade.uniforms.red.value=sky.k*.06; for(let i=0;i<8;i++){ const a=rnd(0,6.28); FX.spawn(T.x+Math.cos(a)*14,T.y+rnd(4,14),T.z-6+Math.sin(a)*4,-Math.cos(a)*10,rnd(-2,2),-Math.sin(a)*4,1,i%2?0x6a1aff:0x050208,.5,0,i%2===0); } return sky.k<1; });
    Sound.sfx('suck'); yield wait(1.6); Sound.sfx('chomp'); shake(1.2); impactFrame([[3,3],[1,2],[2,2]]); T.form=3;
    evaCard(['THE VOID','HAS A NAME. IT IS OMAR.'],2,1); yield wait(2);
    twCutin('omar','VOID FORM','Phase III  ·  He ate the moon. It was cold.','#2a0a4a',2); yield wait(1.3); T.hy=1.3;
    yield say('omar',"The moon tasted... like nothing. Like my birthday parties.",'angry');
    if(mira&&ALI()) yield say('mira',"He ATE the MOON. Ali, please, the MOON.",'worried'); else if(mira) yield say('mira',"He ATE the MOON. Shayan, please, the MOON.",'worried');
    if(ALI()) yield say('ali',"I cut the moon once. It's fine. It grows back.");
  }
  // next phase
  const ph=T.phase+1; T.phase=ph; T.hp=T.maxHp=twHPFor(ph); T.down=0; T.dying=0; T.inv=false; T.stun=0; T.cd=1.2; T.bag=[]; T.sub=TW_TITLE[who][ph]; T.lcDone[ph]=0; T.state='idle'; T.cracked=0; T.glintN=0;
  card('Phase '+['','I','II','III'][ph],T.sub); Sound.play(TW_MUSIC[who][ph]); Game.bossPhaseStart=ph;
  yield cineTo([P.x,P.y+8.2,P.z+15],[P.x,P.y,P.z],.7); Cam.cine=null; Game.letterTo=0; P.inv=1; }

function* twSoloDefeat(F,T){ const P=Player, who=T.who, H=HERO(), mira=Game.actors.find(a=>a.kind==='cage'&&!a.open);
  Game.slowT=1.2; FX.flash=1; grade.uniforms.flashCol.value.set(1,1,1); impactFrame([[1,3],[2,2],[3,2]]); Sound.sfx('crossboom'); shake(1); T.down=1; yield wait(.6);
  yield* twFrame(T,P); grade.uniforms.red.value=0;
  if(who==='caotan'){ T.cracked=1;
    yield say('caotan',"I... I just wanted... someone to notice me...");
    yield say('caotan',"Do you know what it's like... to push up your glasses... and NOBODY sees the glint?");
    const c=yield choose(ALI()?[{t:"I noticed. It was annoying."},{t:"Nothing personal."}]:[{t:"I noticed you, Caotan. You're... a lot."},{t:"Getsuga Tenshou."}]);
    if(c===0){ yield say('caotan',ALI()?"You... noticed... *glint*":"Senpai... noticed me... *glint*",'happy'); }
    else if(!ALI()) yield say('caotan',"Wait, that's not an answer, that's an attack name!",'surprised');
  } else {
    yield say('omar',"So this... is how the Edge ends. Not with a bang. With a... slightly bigger bang.");
    yield say('omar',"Tell the darkness... I said hi. It won't answer. It never does.");
    const c=yield choose(ALI()?[{t:"You were never the edge. You were the handle."},{t:"Nothing personal."}]:[{t:"You could've just been normal, man."},{t:"Getsuga Tenshou."}]);
    if(c===0) yield say('omar',ALI()?"The handle... is the most important part of the blade. ...Thank you.":"Normal? Me? ...Maybe in another route.");
    else if(!ALI()) yield say('omar',"Fair.");
  }
  // finisher
  if(ALI()){ twCamT(T,8,3); zwStart(); Sound.sfx('dash'); aliGhost(P.x,P.y,P.z); P.x=T.x+(T.x>P.x?1.6:-1.6); P.z=T.z+.3; P.f=P.x<T.x?-1:1; P.cineFly=true; P.cineAnim='idle'; yield wait(.5);
    yield say('ali',who==='caotan'?"Your glasses were never the problem. You were.":"Nothing personal, edge.");
    Sound.sfx('secret'); zwEnd(); JC.lines=[]; for(let i=0;i<40;i++){ const a=rnd(0,Math.PI), mx=UW/2+rnd(-200,200), my=UH/2+rnd(-140,140); JC.lines.push({x0:mx-Math.cos(a)*400,y0:my-Math.sin(a)*400,x1:mx+Math.cos(a)*400,y1:my+Math.sin(a)*400,t:1}); }
    JC.flash=1; impactFrame([[3,3],[1,2],[2,3]]); Sound.sfx('crossboom'); Sound.sfx('gore'); shake(1.5); P.cineFly=false; P.cineAnim=null; }
  else { P.ang=Math.atan2(T.z-P.z,T.x-P.x); P.f=T.x>P.x?1:-1; cineSet(P.x-P.f*2.4,1.3,P.z+3.4,P.x+P.f*1.2,1.5,P.z); P.charge=2; yield wait(.35);
    yield say('shayan',"Getsuga... TENSHOU!",'angry'); twCamT(T,9.5,0); Game.timeScale=.3; fireBeam(true,true); P.charge=0; yield wait(.35); Game.timeScale=1; FX.flash=1; grade.uniforms.flashCol.value.set(1,.9,.95); shake(1.2); Sound.sfx('slam'); }
  const w=who==='caotan'; for(let i=0;i<3;i++) FX.burst(T.x,T.y+1.4,T.z,70,w?0xffffff:0x1a0820,7+i*2,.5,w); FX.burst(T.x,T.y+1.4,T.z,40,w?0xff6ab0:0x8a3aff,10,.35); FX.ring(T.x,groundY(T.x,T.z)+.1,T.z,w?'#ff6ab0':'#8a3aff',5,.6);
  if(w) twHeartBurst(T.x,T.z,60); Sound.sfx('gore'); Sound.sfx('kill'); const tx=T.x,tz=T.z; twRemoveFoe(T); yield wait(1.4);
  yield say('',w?"Caotan burst into a cloud of hearts, glitter and one cracked pair of glasses. Somewhere, a body pillow wept.":"Omar dissolved into the dark he loved so much. The dark, for its part, did not seem to notice.");
  if(mira) yield say('mira',w?"Is it over? Please tell me it's over. I've seen things.":"Is he gone? ...Good. He kept looking at me like I was a sad poem.",'worried');
  Game.flags.twinBetrayDone=1; twEndFight(); Game.arena=null; Cam.cine=null; P.inv=0;
  yield* SCR.victory2(); }

// ---------- the betrayal ----------
function twBetrayalPending(){ return !!Game.flags.twinAlly&&!Game.flags.twinPact&&!Game.flags.twinBetrayDone&&TW.allies.some(A=>A.who===Game.flags.twinAlly); }
function* twBetrayal(){ const P=Player, who=Game.flags.twinAlly, H=HERO(), A=TW.allies.find(a=>a.who===who), mira=Game.actors.find(a=>a.kind==='cage'&&!a.open);
  Sound.stop(); Game.letterTo=1; Cam.focus=null; const c=L.zone?{x:L.zone.x,z:L.zone.z}:{x:P.x,z:P.z};
  // the ally drifts out in front of you
  if(A){ A.hidden=false; } cineSet(P.x+2,1.5,P.z+6,P.x,1.4,P.z); yield wait(.5);
  const ax=A?A.x:P.x+2, az=A?A.z:P.z;
  if(who==='caotan'){
    yield say('caotan',"Senpai... the Dog Lord is dead. You know what that means?");
    yield say(H,ALI()?"It means you can leave.":"We can all go home? Mira's free? I can finally eat?");
    yield say('caotan',"It means the gate... is MINE. And so are you.");
  } else {
    yield say('omar',"The Dog Lord falls. My brother is dead. And the Edge... has no master.");
    yield say(H,ALI()?"You never had a master. You had a bedtime.":"Cool, so... you're free! Go live your life! Maybe try a color!");
    yield say('omar',"You spared me. That was your mistake. The darkness... needs a new Dog Lord.");
  }
  twClearAllies(); const T=twStartSolo(who); T.x=ax; T.z=az; T.inv=true; T.noAttack=1; Game.state='cut'; Game.arena={lock:TW.fight.lock}; Sound.stop();
  twCamT(T,7.5,1.8); yield wait(.3);
  if(who==='caotan'){
    yield say('caotan',"You thought these were shades? Haha. No. They were PRESCRIPTION.");
    yield* twGlint(T,1,.22,1); yield say('caotan',"I needed them... to see the TRUTH. And the truth is: you're my senpai, and senpai has to DIE so I can finally move on.");
    yield say(H,ALI()?"That's not how closure works.":"That is NOT how emotions work, man!");
    yield say('caotan',"Shh. Let's end this route. Together. Violently. ♡",'happy');
  } else {
    T.scythe=1; yield say('omar',"I did not shed a tear for my brother. The dark does not cry. It... mists.");
    yield say('omar',"Kneel before Omar the Edge. Last of the Gatekeepers. First of the... next Gatekeepers.");
    yield say(H,ALI()?"Kneel? I don't even sit.":"Bro, we literally just fought a dog together. We had a moment!");
    yield say('omar',"Moments are for the weak. I live in eternity. And sometimes... in my mom's basement.");
  }
  if(mira) yield say('mira',ALI()?"Ali, I'm still in the cage. Just so everyone remembers.":"Shayan! I'm still in the cage! Is everyone just going to keep fighting?!",'angry');
  T.scythe=0; evaCard(ALI()?['ALI THE WANDERER','VS '+TW_TITLE[who][0].toUpperCase()]:['SHAYAN SAQIB','VS '+TW_TITLE[who][0].toUpperCase()],2.4,1); Sound.sfx('slam'); yield wait(2.4);
  card(TW_TITLE[who][0],TW_TITLE[who][1]); Sound.play(TW_MUSIC[who][1]); yield wait(1.2);
  yield cineTo([P.x,P.y+8.2,P.z+15],[P.x,P.y,P.z],.7); T.inv=false; T.noAttack=0; Cam.cine=null; Game.letterTo=0; Game.state='play'; P.inv=1; }
