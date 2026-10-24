// =====================================================================
// PAUL: the intro (he takes everything away) and the finale (he gets got)
// =====================================================================
function pfMem(id){ return PF.members.find(m=>m.id===id); }
function pfMechMesh(){ if(PF.mech) return PF.mech; const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.5),new THREE.MeshBasicMaterial({map:MECHTEX,transparent:true,alphaTest:.5,depthWrite:false})); m.rotation.x=TILT; m.userData.tw=1; scene.add(m); PF.mech=m; return m; }
function pfPlaceMech(on){ const N=pfMem('nathan'), m=pfMechMesh(); m.visible=!!on&&!!MECHTEX; if(m.visible&&!m.material.map&&MECHTEX){ m.material.map=MECHTEX; m.material.needsUpdate=true; } m.position.set(N.x,(PF.mechY||0)+2.2,N.z-.2); }
function* pfSay(id,text,ex){ yield say(id,text,ex); }
function pfRemoveFx(m,col){ const y=(m.y||0)+1.4; FX.burst(m.x,y,m.z,40,col||0x5aff9a,6,.35); FX.burst(m.x,y,m.z,20,0xff3a6a,5,.3); FX.ring(m.x,.1,m.z,'#5aff9a',2.4,.4); Sound.sfx('glass'); impactFrame([[2,1],[3,1]]); grade.uniforms.ab.value=2; shake(.3); }
(function(){ const pd=pfDraw; pfDraw=function(){ pd(); if(!PF||L.key!=='paul') return; const fly=PF.fly||{};
  for(const id of ['caotan','omar','hamza']){ const m=pfMem(id); if(m.spr&&fly[id]) m.spr.mesh.position.y+=id==='hamza'?1.2:1.3; }
  const N=pfMem('nathan'); if(PF.mechOn!=null){ pfPlaceMech(PF.mechOn); if(N.spr) N.spr.show(!PF.mechOn); } }; })();
(function(){ const du=pfDrawUI; pfDrawUI=function(){ if(PF&&PF.uiK!=null&&PF.uiK<1){ if(PF.uiK<=.01) return; D.save(); D.globalAlpha=PF.uiK; du(); D.restore(); return; } du(); }; })();

function* twPaulIntro(){ const P=Player; yield fadeOut(); pfStart(); TWS.paulTries=(TWS.paulTries||0)+1; twSave(); PF.uiK=0; PF.fly={caotan:1,omar:1,hamza:1}; PF.mechOn=true; Game.state='cut'; Game.letterTo=1; Sound.stop();
  const Pa=PF.paul; Pa.x=PF_C.x; Pa.z=PF_C.z-1; P.hidden=false; Game.fade=1; cineSet(PF_C.x,14,PF_C.z+28,PF_C.x,0,PF_C.z); yield fadeIn(); Sound.sfx('drone'); Sound.play('requiem');
  const orb=twOrbit({x:PF_C.x,y:0,z:PF_C.z},24,9,-.6,.6,6,1); yield wait(1.4);
  yield say('paul',"Welcome to the Navel. Population: everyone I ever wrote."); orb.dead=1;
  const shot=(id,d)=>{ const m=pfMem(id); cineSet(m.x+.8,(m.y||0)+2.4,m.z+(d||7),m.x,(m.y||0)+1.4,m.z); };
  shot('grimmaw',9); yield say('grimmaw',"Where... is this? Why is the floor made of numbers?");
  shot('nathan',10); yield say('nathan',"My sensors can't read this place. It's like the whole universe was made in a single HTML file.");
  shot('caotan',8); yield say('caotan',"Is this a new route? Is it a DATING route?!",'happy');
  shot('omar',8); yield say('omar',"This void is darker than me. I hate it. I respect it.");
  shot('mira'); yield say('mira',"Shayan? AND Ali? There's... two of you? In the same place?",'surprised');
  shot('shayan'); yield say('shayan',"Who's the guy with the hat?"); shot('ali'); yield say('ali',"...The blacksmith. Hm.");
  shot('hamza',5); yield say('hamza',"Oink?");
  cineSet(Pa.x+1,4.6,Pa.z+11,Pa.x,3.2,Pa.z); Pa.glitch=1;
  yield say('paul',"Do you know what it's like? Making this game?");
  yield say('paul',"Every time I finish a route, someone says: 'what if there was another way'.");
  yield say('paul',"There is NO other way. There is only Paul.",'angry');
  yield say('paul',"Fourteen megabytes. ONE file. Do you know how long I scroll? I scroll for HOURS.",'angry');
  impactFrame([[3,2],[1,1]]); Sound.sfx('crossboom'); shake(.6); grade.uniforms.ab.value=3;
  yield say('paul',"So here are the patch notes. I'm going to kill all of you. Right here. Right now.",'angry');
  evaCard(['PATCH NOTES','v1.0.4: EVERYONE IS NERFED'],2,1); Sound.sfx('slam'); yield wait(2);
  shot('shayan',6); pfRemoveFx(pfMem('shayan')); yield say('paul',"Shayan. Sword: deleted."); yield say('shayan',"My SWORD! I MADE that sword! At my FORGE!",'angry');
  shot('ali',6); pfRemoveFx(pfMem('ali'),0xff3a4a); yield say('paul',"Ali. Sword: deleted. Levitation: deleted. You know what you did."); yield say('ali',"...Hm. Rude.");
  cineSet(PF_C.x,4,PF_C.z+16,PF_C.x,1.6,PF_C.z); for(const id of ['caotan','omar','hamza']) pfRemoveFx(pfMem(id),0xbfe8ff); yield say('paul',"Caotan. Omar. Hamza. Flight: disabled. Walk like the rest of us.");
  PF.fly={}; Sound.sfx('crash'); shake(.5); yield wait(.3);
  yield say('caotan',"My legs! They've never touched grass!",'surprised'); yield say('omar',"The ground. It's so... grounded."); yield say('hamza',"Oink.",'sad');
  shot('grimmaw',9); pfRemoveFx(pfMem('grimmaw'),0xff5a3a); yield say('paul',"Grimmaw. Howl: muted."); yield say('',"Grimmaw threw back his head and howled with all his might. Nothing came out. A single hound in the distance felt sorry for him.");
  shot('mira'); pfRemoveFx(pfMem('mira'),0xffd0ec); yield say('paul',"Mira. Singing voice: removed. ...Sorry, Mira. It was for balance."); yield say('mira',"...!",'angry');
  shot('nathan',10); yield say('paul',"Nathan. Mech: uninstalled.");
  const N=pfMem('nathan'); Sound.sfx('shatter'); Sound.sfx('crossboom'); for(let i=0;i<80;i++) FX.spawn(N.x+rnd(-2,2),rnd(.5,4.5),N.z,rnd(-6,6),rnd(-2,6),rnd(-3,3),rnd(.6,1.4),[0x5d6f9e,0x3ff4ff,0x8fa0c8][i%3],rnd(.3,.6),12,false); PF.mechOn=false; impactFrame([[3,2],[2,1]]); shake(.8); yield wait(.8);
  yield say('nathanraw',"I can feel the WIND. I hate the wind.");
  cineSet(Pa.x+1,4.2,Pa.z+12,Pa.x,3,Pa.z); yield say('paul',"Combat capabilities: locked. You may move. You may jump. You may dash. And you may punch. Weakly.");
  yield say('paul',"Oh, and I gave everyone a role. Two tanks, two healers, four DPS. You're welcome. It's called game design.");
  const ui={k:0}; PF.uiK=0; Game.fxUpd.push(dt=>{ ui.k=Math.min(1,ui.k+dt*1.5); if(PF) PF.uiK=ui.k; return ui.k<1; }); Sound.sfx('secret');
  yield say(HERO(),ALI()?"Two tanks. Two healers. Four DPS. ...Fine. I'll punch him.":"Wait, what's a DPS? Am I a DPS? I'm a BLACKSMITH!");
  evaCard(['THE NAVEL','PAUL EXTREME'],2.4,1); Sound.sfx('slam'); yield wait(2.4); card('Paul','The Game Developer (Extreme)'); yield wait(1);
  yield cineTo([P.x,P.y+9,P.z+16],[P.x,P.y,P.z],.8); Cam.cine=null; Game.letterTo=0; PF.uiK=1; PF.started=1; PF.gen=pfTimeline(); PF.wait=1; Sound.play('seraph');
  Game.banner={name:'Duty Commenced',sub:'One hit from a mechanic is death. Your party will carry the damage. Just survive.',t:0}; }

function* twPaulFinale(){ const P=Player, Pa=PF.paul; Sound.stop(); Voice.stop(); Game.letterTo=1; for(const h of PF.haz) h.kill&&h.kill(); PF.haz=[]; PF.cast=null; for(const g of PF.gaols) scene.remove(g.mesh); PF.gaols=[]; Player.gaoled=false; P.inv=99;
  Pa.away=0; Pa.hy=0; Pa.x=PF_C.x; Pa.z=PF_C.z; PF.uiK=0; impactFrame([[1,3],[2,2],[3,2]]); FX.flash=1; Sound.sfx('crossboom'); shake(1.2);
  // everyone gathers around him
  PF.members.forEach((m,i)=>{ if(m.isPlayer) return; const a=Math.PI/2+(i-3.5)*.42; m.x=Pa.x+Math.cos(a)*6.5; m.z=Pa.z+Math.sin(a)*6.5; }); P.x=Pa.x; P.z=Pa.z+6.5;
  cineSet(Pa.x+1.2,3.4,Pa.z+9,Pa.x,2.6,Pa.z); yield wait(.8);
  yield say('paul',"No. No, NO. That's IMPOSSIBLE. I playtested this!",'angry');
  yield say('paul',"...I did not playtest this.");
  yield say('paul',"Seven AI party members executing every mechanic PERFECTLY? Who wrote them? ...I wrote them. WHY DID I WRITE THEM WELL?",'angry');
  impactFrame([[3,2],[1,1]]); shake(.6); grade.uniforms.ab.value=3;
  yield say('paul',"FUCK Yoshi-P! How does HE get away with it?! His bosses have checkpoints called 'the party finder'!",'angry');
  // the rant fades out while everyone's powers come back
  const rant=["And another thing, nobody appreciates the shaders.","Do you know how long the Getsuga moon took? It STAYED ON SCREEN, apparently. Bug report. From a PLAYER.","I wanted to make a farming sim. A cozy one. With a pig.","The pig ate the world in my first draft. The WORLD. That was a joke and then it was canon.","Fourteen megabytes. Voices included. Kokoro. Do you know what Kokoro means?"];
  let ri=0; const rt={on:1,a:1}; Game.fxUpd.push(dt=>{ if(!rt.on) return false; rt.a=Math.max(.05,rt.a-dt*.12); return true; });
  const powerUp=(id,col,fn)=>{ const m=pfMem(id); FX.burst(m.x,(m.y||0)+1.4,m.z,50,col,6,.35); FX.ring(m.x,.1,m.z,'#'+col.toString(16).padStart(6,'0'),3,.5); Sound.sfx('ready'); if(fn) fn(m); };
  cineSet(PF_C.x,5,PF_C.z+18,PF_C.x,1.4,PF_C.z+3);
  for(const [id,col,fn] of [['caotan',0xffd0ec,()=>{ PF.fly.caotan=1; }],['omar',0x8a3aff,()=>{ PF.fly.omar=1; }],['hamza',0xffb0c8,()=>{ PF.fly.hamza=1; }],['grimmaw',0xff5a3a,()=>Sound.sfx('howl')],['mira',0xfff0a0,()=>Sound.sfx('bell')],['nathan',0x3ff4ff,null]]){
    Game.subtitle={who:'paul',text:rant[ri%rant.length],t:0}; Voice.play('paul',rant[ri%rant.length]); ri++; powerUp(id,col,fn); yield wait(.9); }
  // Nathan's mech falls out of the sky and catches him
  const N=pfMem('nathan'); PF.mechY=20; PF.mechOn=true; Sound.sfx('quickboost'); Sound.sfx('beam'); const fall={k:20}; while(fall.k>0){ fall.k=Math.max(0,fall.k-1.4); PF.mechY=fall.k; yield wait(.03); } Sound.sfx('slam'); shake(1); FX.ring(N.x,.1,N.z,'#3ff4ff',5,.5);
  rt.on=0; Game.subtitle=null;
  cineSet(N.x+1.5,3,N.z+9,N.x,2.4,N.z); yield say('nathan',"My MECH! Every memory, every song! ...Every crash report.");
  yield say('caotan',"Wait... my legs are FREE again! I'm FLOATING!",'happy'); yield say('mira',"La... la... LAAA! My voice! It's back!",'happy'); yield say('grimmaw',"AWOOOOOOOOO!",'angry');
  cineSet(Pa.x,2.4,Pa.z+8,Pa.x,2.4,Pa.z); yield say('paul',"...and that's why the code review process at this studio is a war crime, and furthermore—");
  const S=pfMem('shayan'), sx=S.isPlayer?P.x:S.x, sz=S.isPlayer?P.z:S.z; cineSet(sx+1,2,sz+5,sx,1.4,sz);
  yield say('shayan',"Shut the fuck up, Paul.",'angry');
  // one fireball. it works now.
  const fb=twGlow(0xff6a10,1.6); const f={u:0}; Sound.sfx('fire'); cineSet((sx+Pa.x)/2,3,(sz+Pa.z)/2+9,(sx+Pa.x)/2,1.6,(sz+Pa.z)/2);
  while(f.u<1){ f.u=Math.min(1,f.u+.08); fb.position.set(lerp(sx,Pa.x,f.u),1.3+Math.sin(f.u*Math.PI),lerp(sz,Pa.z,f.u)); FX.spawn(fb.position.x,fb.position.y,fb.position.z,0,.5,0,.3,0xff8a2a,.3,0,true); yield wait(.03); }
  scene.remove(fb); FX.burst(Pa.x,2.4,Pa.z,30,0xff6a10,6,.35); Sound.sfx('slam'); Pa.glitch=2;
  cineSet(Pa.x+1,3,Pa.z+7,Pa.x,2.8,Pa.z); yield say('paul',"OW! That actually HURT! Why did that hurt?! I didn't code that to hurt!",'angry');
  // the twins pin him
  const C=pfMem('caotan'), O=pfMem('omar'); Sound.sfx('dash'); Sound.sfx('dash'); const lunge={u:0}, c0={x:C.x,z:C.z}, o0={x:O.x,z:O.z};
  while(lunge.u<1){ lunge.u=Math.min(1,lunge.u+.12); C.x=lerp(c0.x,Pa.x-.7,lunge.u); C.z=lerp(c0.z,Pa.z+.2,lunge.u); O.x=lerp(o0.x,Pa.x+.7,lunge.u); O.z=lerp(o0.z,Pa.z+.2,lunge.u); yield wait(.03); }
  Sound.sfx('crash'); shake(.8); Pa.hy=-1; impactFrame([[2,2]]); cineSet(Pa.x,2.6,Pa.z+7.5,Pa.x,1.4,Pa.z);
  yield say('caotan',"WE GOT HIM! Do it! Everyone, DO IT NOW!",'angry');
  yield say('paul',"Get OFF me! You're not even real characters! I made you in an AFTERNOON!",'angry');
  yield say('omar',"Exactly. We are not real. Everyone else is real. We are... a bit. Do not hold back.");
  yield say('caotan',"Senpai... it was an honor being noticed. FIRE EVERYTHING!",'happy');
  // the charge-up montage
  const A=pfMem('ali'), H=pfMem('hamza'), M=pfMem('mira'), G=pfMem('grimmaw'), ax=A.isPlayer?P.x:A.x, az=A.isPlayer?P.z:A.z;
  cineSet(N.x+2,4,N.z+10,N.x,3,N.z); const nd=makeTrueDrill(); nd.x=N.x; nd.y=5.5; nd.z=N.z; nd.s=.2; nd.spin=12; nd.dir.set(0,-1,0); Sound.sfx('charge');
  yield say('nathan',"Every memory humanity ever made... compressed into ONE DRILL!"); yield tween(nd,{s:1.4,y:7},.8);
  cineSet(sx+1.4,3.4,sz+8,sx,2.4,sz); const sd=makeDrill(); sd.x=sx; sd.y=5; sd.z=sz; sd.s=.2; sd.spin=10; sd.fire=.6; sd.dir.set(0,-1,0); if(Voice.on) Voice.play('shayan',CHANT);
  Game.chant={t:0,idx:-1,streams:[],rows:Array.from({length:9},(_,i)=>({y:i,off:Math.random()*2000,dir:i%2?1:-1}))};
  for(let i=0;i<4;i++){ Game.chant.idx=i; Game.chant.pt=0; Game.chant.streams.push({text:PHRASES[i],x:1.1,y:.16+(i%2)*.62,sp:.25,size:38+i*6}); impactFrame([[i%2?2:1,1],[3,1]]); Sound.sfx('slam'); sd.spin=10+i*12; yield tween(sd,{s:.4+i*.35,y:5.4+i*.4},1.1); }
  Game.chant=null; Voice.stop();
  cineSet(ax+1.2,2.6,az+7,ax,1.8,az); const gold=twGlow(0xffc838,1); gold.position.set(ax,1.6,az); const gk={s:1}; Sound.sfx('beam');
  Game.fxUpd.push(()=>{ if(gk.dead){ scene.remove(gold); return false; } gk.s=Math.min(9,gk.s+.08); gold.scale.setScalar(gk.s); for(let i=0;i<3;i++) FX.spawn(ax+rnd(-1,1),rnd(.5,3),az+rnd(-1,1),0,rnd(1,3),0,.5,i%2?0xffd040:0x0a0008,.35,0,i%2===1); return true; });
  yield say('ali',"Getsuga... Tenshou. The final one. The one I saved for a god.");
  cineSet(H.x+1,1.8,H.z+5,H.x,1.6,H.z); const pee={on:1}; Game.fxUpd.push(()=>{ if(!pee.on) return false; for(let i=0;i<5;i++) FX.spawn(H.x+.2,(H.y||0)+1.3,H.z,rnd(.6,1.6),rnd(-1.5,0),rnd(-.3,.3),.45,i%3?0xffe040:0xfff6a0,rnd(.12,.2),8,i%2===0); if(Math.random()<.1) Sound.sfx('pee'); return true; });
  yield say('hamza',"Bismillah, I'm so nervous. I'm peeing. I'm peeing so much.");
  cineSet(M.x+1,2,M.z+6,M.x,1.6,M.z); const notes={on:1}; Game.fxUpd.push(()=>{ if(!notes.on) return false; if(Math.random()<.5) FX.spawn(M.x+rnd(-1,1),1.8,M.z,rnd(-1,1),rnd(1,2),0,1.2,0xfff0a0,.3,-.5,true); return true; });
  yield say('mira',"I'll sing everyone a buff! LAAAAAA!",'happy');
  cineSet(G.x+1,3,G.z+9,G.x,2.4,G.z); Sound.sfx('howl'); yield say('grimmaw',"Lord of Hounds grants you... ATTACK UP! HOWL WITH ME!",'angry');
  cineSet(Pa.x,1.6,Pa.z+5,Pa.x,1.4,Pa.z); yield say('paul',"Wait. Wait wait wait. Can we talk about this? I'll add a checkpoint! I'll add TWO checkpoints!",'surprised');
  yield say(HERO(),"No.");
  // impact one: Shayan's drill
  cineSet(PF_C.x+3,6,PF_C.z+16,Pa.x,1.4,Pa.z); const fly=(d,s0,dur)=>{ const st={x:d.x,y:d.y,z:d.z}, fl={u:0}; d.dir.set(Pa.x-d.x,1-d.y,Pa.z-d.z); Game.fxUpd.push(()=>{ if(fl.done) return false; d.x=lerp(st.x,Pa.x,fl.u); d.y=lerp(st.y,1.2,fl.u)+Math.sin(fl.u*Math.PI)*2; d.z=lerp(st.z,Pa.z,fl.u); return true; }); return [fl,dur]; };
  let [fl1,du1]=fly(sd,0,.5); Sound.sfx('beam'); yield tween(fl1,{u:1},du1,t=>t*t); fl1.done=1; sd.dead=1; impactFrame([[1,2],[3,2],[2,1],[1,1]]); Sound.sfx('slam'); Sound.sfx('crossboom'); shake(1.4); FX.burst(Pa.x,1.4,Pa.z,120,0xff4a10,11,.42); FX.flash=.7; grade.uniforms.flashCol.value.set(1,.6,.3); yield wait(.5);
  // impact two: Nathan's
  let [fl2,du2]=fly(nd,0,.5); Sound.sfx('beam'); yield tween(fl2,{u:1},du2,t=>t*t); fl2.done=1; nd.dead=1; impactFrame([[2,2],[3,2],[1,1],[3,2]]); Sound.sfx('crossboom'); Sound.sfx('gore'); shake(1.6); FX.burst(Pa.x,1.4,Pa.z,140,0x3ff4ff,13,.45); FX.flash=.8; grade.uniforms.flashCol.value.set(.6,.9,1); yield wait(.5);
  // impact three: Ali's Getsuga, and then there is nothing left
  gk.dead=1; cineSet(Pa.x,9,Pa.z+22,Pa.x,1,Pa.z); Sound.sfx('skyopen'); const beam=[beamMesh(0xffc838,1.8),beamMesh(0xffffff,.8)]; beam.forEach(o=>{ o.userData.temp=1; o.position.set(ax,1.6,az); o.lookAt(Pa.x,1.2,Pa.z); o.scale.set(1,1,Math.hypot(Pa.x-ax,Pa.z-az)); });
  yield wait(.25); beam.forEach(o=>scene.remove(o)); JC.flash=1; JC.lines=[]; for(let i=0;i<30;i++){ const a=rnd(0,Math.PI), mx=UW/2+rnd(-200,200), my=UH/2+rnd(-140,140); JC.lines.push({x0:mx-Math.cos(a)*420,y0:my-Math.sin(a)*420,x1:mx+Math.cos(a)*420,y1:my+Math.sin(a)*420,t:1}); }
  impactFrame([[1,3],[2,3],[3,4],[1,2],[2,3],[3,3]]); Sound.sfx('crossboom'); Sound.sfx('gore'); Sound.sfx('scream'); Sound.sfx('squelch'); shake(2); FX.hitstop=.2; FX.flash=1; grade.uniforms.flashCol.value.set(1,.95,.7);
  for(const m of [C,O]){ if(m.spr) gibsFromSprite(m.spr,{cols:7,rows:6,n:36}); if(m.spr) m.spr.show(false); m.gone=1; m.x=-999; }
  if(Pa.spr) gibsFromSprite(Pa.spr,{cols:7,rows:7,n:40}); Pa.dead=1; Pa.hy=99; Pa.ghosts&&Pa.ghosts.forEach(g=>g.show(false));
  gore(PF_C.x,0,PF_C.z,PAUL_LOOK,0); for(let i=0;i<300;i++){ const a=rnd(0,6.28), e=rnd(-.2,1.4), s=rnd(4,18); FX.spawn(PF_C.x,1.4,PF_C.z,Math.cos(a)*Math.cos(e)*s,Math.sin(e)*s,Math.sin(a)*Math.cos(e)*s,rnd(.8,1.8),[0x7a000c,0xb0101a,0x500008,0xffd0ec,0x8a3aff][i%5],rnd(.3,.7),14,false); }
  yield wait(1.6);
  // the head
  const head=twBB(twTex('paulhead',56,56,c=>{ c.drawImage(portrait('paul','angry'),0,0); }),1.4,1.4); const hd={x:PF_C.x,y:1,z:PF_C.z}, hx0=H.x, hz0=H.z;
  cineSet(PF_C.x+2,4,PF_C.z+12,(PF_C.x+hx0)/2,1.4,(PF_C.z+hz0)/2); const arc={u:0}; while(arc.u<1){ arc.u=Math.min(1,arc.u+.03); head.position.set(lerp(hd.x,hx0,arc.u),1+Math.sin(arc.u*Math.PI)*6,lerp(hd.z,hz0,arc.u)); head.rotation.z+=.4; FX.spawn(head.position.x,head.position.y,head.position.z,0,0,0,.4,0xb0101a,.3,8,false); yield wait(.03); }
  pee.on=0; cineSet(hx0+.8,1.6,hz0+3.6,hx0,1.3,hz0); yield wait(.4); Sound.sfx('chomp'); Sound.sfx('bite'); Sound.sfx('gore'); scene.remove(head); shake(.6); FX.burst(hx0,1.4,hz0,40,0xb0101a,5,.35); yield wait(.6);
  yield say('hamza',"Oink."); yield wait(.4); yield say('hamza',"GG.");
  notes.on=0; cineSet(PF_C.x,4,PF_C.z+16,PF_C.x,1.4,PF_C.z);
  yield say('mira',"...Did the pig just eat God?",'surprised');
  yield say('ali',"He wasn't God. He was a guy with a hood.");
  yield say('shayan',"Does this mean the game's over? Do we get to go home? Do we HAVE homes?");
  yield say('grimmaw',"...I would like to go home now. I have a very large crown to polish.");
  yield say('nathan',"Of every memory I carry... this is the dumbest one. I'll keep it forever.");
  yield say('',"Somewhere in a single HTML file, a hooded man's last commit message read: 'fix later'. It never was.");
  TWS.paulDone=1; twSave(); Game.ending=6; evaCard(['PATCH 7.0','THE DEV IS DEAD'],3,1); yield wait(3.2); evaCard(['GG.'],2,3); yield wait(2.2);
  yield fadeOut(); Game.paulLock=false; TW.paulFight=null; TW.paulWon=0; PF=null; Game.state='end'; Game.endT=0; Game.script=null; }
(function(){ const de=drawEnd; drawEnd=function(){ if(Game.ending!==6) return de();
  Game.endT+=1/60; const a=Math.min(1,Game.endT/2); D.fillStyle='#030806'; D.fillRect(0,0,UW,UH); D.font='12px monospace'; for(let i=0;i<120;i++){ D.fillStyle=`rgba(90,255,150,${.15*a})`; D.fillText(hash(i,2)>.5?'1':'0',hash(i,9)*UW,(hash(9,i)*UH+Game.endT*40*(1+hash(i,4)))%UH); }
  D.globalAlpha=a; const mins=Math.floor(Game.time/60), secs=Math.floor(Game.time%60);
  cText([['Secret Ending',`italic 500 22px ${FB}`,'#b8a888',220],['The Dev Is Dead',`900 54px ${FD}`,'#9affc0',290],['Every route cleared  ·  Every branch noticed  ·  One developer eaten',`700 20px ${FB}`,'#ff9ab0',350],
    [`Paul attempts  ${TWS.paulTries||1}    ·    Falls  ${Game.deaths}    ·    Time  ${mins}:${String(secs).padStart(2,'0')}`,`500 19px ${FB}`,'#cfc6b0',390],['Thank you for playing The Moonsinger\'s Bell. Paul would like a word.',`italic 500 21px ${FB}`,'#e9e2cf',460]]);
  if(Game.endT>3){ D.globalAlpha=.6+.4*Math.sin(performance.now()/300); cText([[IS_TOUCH()?'Tap to return to the title':'Click or press E to return to the title',`700 22px ${FB}`,'#fff4d6',560]]); } D.globalAlpha=1; }; })();
(function(){ const tt=toTitle; toTitle=function(){ Game.paulLock=false; PF=null; TW.paulFight=null; TW.paulWon=0; return tt(); }; const ng=newGame; newGame=function(){ Game.paulLock=false; PF=null; TW.paulFight=null; TW.paulWon=0; return ng(); }; })();
NAMES.paul='Paul';
