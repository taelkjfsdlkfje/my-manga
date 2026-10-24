// =====================================================================
// PAUL EXTREME, REWRITTEN: an original savage-style raid built from classic FF14 mechanics.
// In/out (Chariot/Dynamo), stack & spread markers, Passage of Arms, line-of-sight rocks,
// gaze, towers, player-only adds, Doom + Esuna, knockback + Arm's Length, exaflares,
// tank swaps, scripted party memes (Shirk, floortanking) and healer raises.
// The party does their jobs on their own. You do yours, or you die.
// Mira raises you up to 3 times; after that, the whole fight restarts.
// =====================================================================
const PF_TXT={out:'Iron Chariot.exe',in:'Lunar Dynamo.exe'};
// ---------- extra telegraph shapes ----------
function pfDonut(x,z,rIn,rOut,warn,name){ const fill=pfMesh(new THREE.RingGeometry(rIn,rOut,64),PF_ORANGE,.24), grow=pfMesh(new THREE.RingGeometry(rIn,rOut,64),PF_ORANGE,.25); fill.position.set(x,.06,z); grow.position.set(x,.065,z);
  const h={kind:'donut',x,z,rIn,rOut,warn,t:0,name,live:true}; PF.haz.push(h);
  h.upd=dt=>{ h.t+=dt; grow.material.opacity=.25*Math.min(1,h.t/warn)+.1*Math.sin(h.t*14); if(h.t>=warn&&!h.done){ h.done=1; pfResolve(h,m=>{ const d=Math.hypot(m.x-x,m.z-z); return d>rIn&&d<rOut; }); Sound.sfx('slam'); shake(.4); FX.ring(x,.1,z,'#ffc070',rOut,.4); }
    if(h.t>warn+.15){ h.live=false; scene.remove(fill); scene.remove(grow); } }; h.kill=()=>{ scene.remove(fill); scene.remove(grow); }; return h; }
function pfConeMesh(x,z,ang,half,len,col,op){ const m=pfMesh(new THREE.CircleGeometry(len,40,-(ang+half),half*2),col,op); m.position.set(x,.075,z); return m; }
function pfInCone(px,pz,x,z,ang,half,len){ const d=Math.hypot(px-x,pz-z); return d<len&&(d<.6||angDiff(Math.atan2(pz-z,px-x),ang)<half); }
// run several mechanics at once (each yields seconds)
function* pfPar(...gs){ const st=gs.map(g=>({g,w:0,done:false})); while(st.some(q=>!q.done)){ for(const q of st){ let n=0; while(!q.done&&q.w<=1e-6&&n++<200){ const r=q.g.next(); if(r.done) q.done=true; else q.w+=r.value||0; } }
    const live=st.filter(q=>!q.done); if(!live.length) break; const m=Math.min(...live.map(q=>q.w)); yield m; for(const q of live) q.w-=m; if(PF.dead) return; } }
// casts keep their own clock so two mechanics can overlap
pfCast=function*(name,dur){ const c={name,t:0,dur}; PF.cast=c; pfLog('Paul readies '+name+'.'); grade.uniforms.ab.value=.6; let t=0; while(t<dur){ yield .05; t+=.05; } if(PF.cast===c) PF.cast=null; impactFrame([[2,1]]); };
function pfLater(delay,fn){ const h={kind:'timer',t:0,live:true,upd(dt){ h.t+=dt; if(h.t>=delay){ h.live=false; fn(); } },kill(){}}; PF.haz.push(h); return h; }
(function(){ const ih=pfInHaz; pfInHaz=function(x,z,margin){ if(ih(x,z,margin)) return true; margin=margin||0;
    for(const h of PF.haz){ if(!h.live||h.done) continue; if(h.kind==='donut'){ const d=Math.hypot(x-h.x,z-h.z); if(d>h.rIn-margin&&d<h.rOut+margin) return true; } } return false; }; })();
function pfPrompt(text,col,dur,sub){ PF.prompt={text,col:col||'#ffd45a',t:0,dur:dur||3,sub:sub||''}; Sound.sfx('ting'); }
function pfCall(who,text){ pfLog(PF_NAME[who]+': '+text); }
function pfAI(){ return PF.members.filter(m=>!m.isPlayer); }
function pfById(id){ return PF.members.find(m=>m.id===id); }
function pfOtherHero(){ return pfById(HERO()==='ali'?'shayan':'ali'); }
function pfPlace(m,x,z){ const d=Math.hypot(x-PF_C.x,z-PF_C.z), R=L.R-1.2; if(d>R){ x=PF_C.x+(x-PF_C.x)/d*R; z=PF_C.z+(z-PF_C.z)/d*R; } m.force={x,z}; }
function pfFreeAll(){ for(const m of PF.members) m.force=null; }
function pfDie(m,why,scripted){ if(m.isPlayer){ pfKill(why); return; } m.dead=1; m.hp=0; m.mark=0; m.force=null; Sound.sfx('crash'); FX.burst(m.x,1,m.z,30,0xff4a5a,6,.35); pfLog(m.name+' was defeated.'+(why?' ('+why+')':''));
  if(!scripted) pfLater(2.5,()=>{ if(!m.dead) return; const H=pfById(m.id==='mira'?'hamza':'mira'); if(H&&!H.dead) pfPlace(H,m.x+1.2,m.z+.4); pfLater(1.2,()=>{ if(!m.dead) return; m.dead=0; m.hp=m.maxHp*.5; FX.burst(m.x,1.2,m.z,40,0xfff0a0,6,.4); Sound.sfx('heart'); pfLog((H?H.name:'Someone')+' casts Raise on '+m.name+'.'); if(H) H.force=null; }); }); }
function* pfRaiseAI(m,healer){ const H=pfById(healer); if(!H||!m.dead) return; pfPlace(H,m.x+1.2,m.z+.4); yield 1.1; PF.cast2={who:H.name,name:'Swiftcast → Raise',t:0,dur:.6}; yield .6; PF.cast2=null;
  m.dead=0; m.hp=m.maxHp*.5; m.weak=1; FX.burst(m.x,1.2,m.z,40,0xfff0a0,6,.4); Sound.sfx('heart'); pfLog(H.name+' casts Raise on '+m.name+'.'); H.force=null; }

// ---------- you can be raised (three times) ----------
let PF_KILL_BASE=null;
(function(){ PF_KILL_BASE=pfKill; pfKill=function(why,wipe){ if(!PF||PF.dead||PF.pDown) return; if(TW.god){ Game.dmgNums.push({x:Player.x,y:Player.y+2.4,z:Player.z,n:'GOD MODE',t:0,col:'#7affb0'}); return; }
    if(!wipe&&(PF.raises||0)<3){ PF.raises=(PF.raises||0)+1; PF.pDown=1; PF.pWhy=why; const P=Player; P.inv=99; P.vx=P.vz=0; Player.gaoled=false; Sound.sfx('shatter'); FX.burst(P.x,P.y+1,P.z,40,0xff4a5a,7,.35); pfLog('You were defeated. '+why);
      const healer=PF.raises===2?'hamza':'mira', H=pfById(healer); PF.raiseT=2.4; PF.raiser=healer; if(H){ pfPlace(H,P.x+1.2,P.z+.4); }
      if(healer==='hamza') twBark('hamza',"Hamza draws a card... it's Ascend! Close enough. RAISE!",true); else if(PF.raises===1) twBark('mira',"Swiftcast. Raise. You're welcome.",true); else twBark('mira',"Again?! I'm out of Swiftcast! Slowcast RAISE!",true); return; }
    PF_KILL_BASE(wipe?('WIPE: '+why):why); }; })();
function pfUpdateRaise(dt){ if(!PF.pDown) return; PF.raiseT-=dt; const P=Player; P.vx=P.vz=0; if(PF.raiseT<=0){ PF.pDown=0; P.inv=1.6; P.hp=P.maxHp; PF.kb=null; if(P.y<-.5||Math.hypot(P.x-PF_C.x,P.z-PF_C.z)>L.R-1){ const H0=pfById(PF.raiser)||{x:PF_C.x,z:PF_C.z+3}; P.x=H0.x-1; P.z=H0.z; P.y=0; P.vy=0; } const H=pfById(PF.raiser); if(H) H.force=null;
    FX.burst(P.x,P.y+1.2,P.z,50,0xfff0a0,7,.45); FX.ring(P.x,.1,P.z,'#fff0a0',3,.4); Sound.sfx('heart'); Game.dmgNums.push({x:P.x,y:P.y+2.8,z:P.z,n:'RAISED · '+(3-PF.raises)+' left',t:0,big:true,col:'#fff0a0'}); } }

// ---------- player: Arm's Length on right click, a white punch indicator, stuck while dead ----------
(function(){ const pp=pfPlayer; pfPlayer=function(dt){ const P=Player; PF&&(PF.armsCd=Math.max(0,(PF.armsCd||0)-dt)); P.armsT=Math.max(0,(P.armsT||0)-dt);
    if(PF&&PF.pDown){ for(const k of ['attack','dash','jump','block']) hit[k]=false; P.vx=P.vz=0; P.anim='hurt'; P.t+=dt; return; }
    if(PF&&Game.state==='play'&&hit.block&&PF.armsCd<=0){ PF.armsCd=20; P.armsT=6; Sound.sfx('secret'); FX.ring(P.x,.1,P.z,'#9fe0ff',2.2,.4); pfLog("You use Arm's Length."); Game.dmgNums.push({x:P.x,y:P.y+2.6,z:P.z,n:"ARM'S LENGTH",t:0,col:'#9fe0ff'}); }
    return pp(dt); }; })();
let PF_RING=null;
function pfPunchRing(){ if(!PF_RING||!PF_RING.parent){ PF_RING=pfMesh(new THREE.RingGeometry(2.05,2.25,48),0xffffff,.55); PF_RING.userData.tw=1; }
  const P=Player, show=PF&&L.key==='paul'&&Game.state==='play'&&!PF.pDown; PF_RING.visible=show; if(show){ PF_RING.position.set(P.x,.09,P.z); const tg=pfPunchTarget(); PF_RING.material.color.setHex(tg?0xffffff:0x9a9aa8); PF_RING.material.opacity=tg?.85:.35; } }
(function(){ const pu=pfPunch; pfPunch=function(){ pu(); const P=Player, fx=P.x+Math.cos(P.ang)*1.2, fz=P.z+Math.sin(P.ang)*1.2; FX.ring(fx,.12,fz,'#ffffff',1.4,.18); FX.ring(P.x,.1,P.z,'#ffffff',2.3,.15); }; })();
// bugs and firewalls only take damage from you
(function(){ const pt=pfPunchTarget; pfPunchTarget=function(){ const P=Player, near=(o,r)=>Math.hypot(o.x-P.x,o.z-P.z)<r;
    for(const b of PF.bugs||[]) if(b.hp>0&&near(b,2.3)) return {x:b.x,z:b.z,add:1,hit:d=>pfHitAdd(b,d)};
    for(const w of PF.walls||[]) if(w.hp>0&&w.armed&&near(w,2.5)) return {x:w.x,z:w.z,add:1,hit:d=>pfHitAdd(w,d)};
    return pt(); }; })();
function pfHitAdd(a,d){ a.hp-=d; a.flash=.15; FX.burst(a.x,1,a.z,8,a.col||0xffe08a,3,.25); Sound.sfx('hit'); if(a.hp<=0){ FX.burst(a.x,1,a.z,40,a.col||0xffe08a,7,.4); Sound.sfx('crash'); if(a.mesh) scene.remove(a.mesh); pfLog(a.name+' destroyed.'); } }

// ---------- AI: forced spots, in/out, zero damage on your adds, lying down when dead ----------
(function(){ const ph=pfHome; pfHome=function(m){ if(m.force) return m.force; const Pa=PF.paul, i=PF.members.indexOf(m);
    if(PF.inout==='out'){ const a=i/8*6.283+.3; return {x:Pa.x+Math.cos(a)*10,z:Pa.z+Math.sin(a)*10}; }
    if(PF.inout==='in'){ const a=i/8*6.283+.3; return {x:Pa.x+Math.cos(a)*1.4,z:Pa.z+Math.sin(a)*1.4}; }
    if(m.role==='dps'){ const t=(PF.bugs||[]).find(b=>b.hp>0)||(PF.walls||[]).find(w=>w.hp>0&&w.armed); if(t){ const a=i*1.3; return {x:t.x+Math.cos(a)*1.4,z:t.z+Math.sin(a)*1.4}; } }
    return ph(m); };
  const ua=pfUpdateAI; pfUpdateAI=function(m,dt){ if(m.dead){ m.anim='idle'; return; } if(PF.gazeOn&&!m.force){ /* looking away */ }
    ua(m,dt); if(PF.gazeOn) m.f=PF.paul.x>m.x?-1:1;
    if(m.role==='dps'&&Game.state==='play'){ m.addT=(m.addT||0)-dt; const t=(PF.bugs||[]).find(b=>b.hp>0&&Math.hypot(b.x-m.x,b.z-m.z)<2.4)||(PF.walls||[]).find(w=>w.hp>0&&w.armed&&Math.hypot(w.x-m.x,w.z-m.z)<2.6);
      if(t&&m.addT<=0){ m.addT=rnd(.7,1.1); FX.spark(t.x,1,t.z); Game.dmgNums.push({x:t.x+rnd(-.4,.4),y:2.2,z:t.z,n:Math.random()<.5?'0':'IMMUNE',t:0,col:'#9a9aa8'}); } } }; })();
(function(){ const pd=pfDraw; pfDraw=function(){ pd(); if(!PF||L.key!=='paul'){ if(PF_RING) PF_RING.visible=false; return; } for(const m of PF.members){ if(m.isPlayer||!m.spr) continue; m.spr.mesh.rotation.z=m.dead?Math.PI/2*(m.f||1):0; if(m.dead) m.spr.place(m.x,-.3,m.z,0); }
    pfPunchRing(); const t=performance.now()/1000;
    for(const b of PF.bugs||[]){ if(b.hp<=0||!b.mesh) continue; b.mesh.position.set(b.x,.6+Math.abs(Math.sin(t*12+b.ph))*.15,b.z); b.mesh.material.color.setHex(b.flash>0?0xffffff:0xffe0e0); }
    for(const w of PF.walls||[]){ if(w.hp<=0||!w.mesh) continue; w.mesh.material.emissive.setRGB(w.armed?.4+.3*Math.sin(t*8):.05,w.armed?.1:.05,w.armed?.5:.1); } }; })();

// ---------- mechanics ----------
function* pfRaidwide(name,f){ yield* pfCast(name,2.2); FX.flash=.35; grade.uniforms.flashCol.value.set(.6,1,.7); shake(.5); Sound.sfx('crossboom'); for(const m of PF.members) if(!m.dead) pfDmg(m,m.maxHp*(f||.4),m===PF.members[0]);
  yield .7; pfHealAll(.35); pfLog('Mira casts Medica II. Hamza casts Helios. (It is an oink.)'); }
// in/out: read the cast bar. The ground only lights up at the very end.
function* pfInOut(seq,castT){ const Pa=PF.paul;
  for(let i=0;i<seq.length;i++){ const k=seq[i], ct=i===0?castT:1.25; PF.cast={name:PF_TXT[k]+(i===0&&seq.length>1?'  →  '+PF_TXT[seq[1]]:''),t:0,dur:ct}; PF.inout=k; if(i===0) pfCall(['caotan','omar','shayan','ali'].filter(id=>id!==HERO())[Math.floor(Math.random()*3)],seq.map(s=>s.toUpperCase()).join(' then ')+'!');
    yield Math.max(.1,ct-.75); if(k==='out') pfCircle(Pa.x,Pa.z,7.5,.75,PF_TXT[k],{quiet:true}); else pfDonut(Pa.x,Pa.z,3.2,26,.75,PF_TXT[k]); yield .75; PF.cast=null; }
  yield .4; PF.inout=null; }
// stack with a named party member
function* pfStackWith(id,castT,inside){ const tg=pfById(id); if(!tg) return; tg.mark='stack'; const mates=pfAI().filter(m=>m!==tg&&!m.dead);
  pfPrompt('STACK WITH '+tg.name.toUpperCase(),'#7affb0',castT,'Stand right next to them when the cast finishes'); if(id==='hamza') twBark('hamza',"Stack on the pig. The pig is load-bearing.",true); else if(id==='mira') twBark('mira',"Stack on me! STACK ON ME!",true);
  mates.forEach((m,i)=>{ m.force=null; m.stackOn=tg; });
  if(!inside) pfPlace(tg,PF_C.x+rnd(-5,5),PF_C.z+rnd(-5,5));
  yield* pfCast('Pull Request (stack)',castT);
  for(const m of mates) m.stackOn=null; tg.mark=0; FX.ring(tg.x,.1,tg.z,'#7affb0',3,.4); Sound.sfx('slam'); shake(.4);
  if(!PF.pDown&&Math.hypot(Player.x-tg.x,Player.z-tg.z)>2.6){ pfDie(tg,'took a Pull Request alone'); pfKill("You didn't stack with "+tg.name+". The Pull Request was too big for one person."); }
  if(!inside) tg.force=null; yield .3; }
(function(){ const ph=pfHome; pfHome=function(m){ if(m.stackOn&&!m.force){ const s=m.stackOn, a=PF.members.indexOf(m)*.9; return {x:s.x+Math.cos(a)*1.1,z:s.z+Math.sin(a)*1.1}; } return ph(m); }; })();
// spread marker on you: everyone else bunches up across the arena
function* pfSpreadOnMe(castT){ const P=pfP(); P.mark='spread'; const Pa=PF.paul, a=Math.atan2(PF_C.z-Player.z,PF_C.x-Player.x)||0, gx=PF_C.x+Math.cos(a)*6, gz=PF_C.z+Math.sin(a)*6;
  pfPrompt('SPREAD! (purple marker on you)','#c08aff',castT,'Get away from everyone'); pfAI().forEach((m,i)=>pfPlace(m,gx+Math.cos(i)*1.2,gz+Math.sin(i)*1.2));
  const ring=pfMesh(new THREE.RingGeometry(3.3,3.5,48),0xc08aff,.9); const h={kind:'timer',t:0,live:true,upd(dt){ h.t+=dt; ring.position.set(Player.x,.08,Player.z); if(h.t>castT+.2){ h.live=false; scene.remove(ring); } },kill(){ scene.remove(ring); }}; PF.haz.push(h);
  yield* pfCast('Fork Bomb (spread)',castT); P.mark=0; FX.ring(Player.x,.1,Player.z,'#c08aff',3.4,.4); Sound.sfx('crossboom');
  const hitM=PF.members.find(m=>!m.isPlayer&&!m.dead&&Math.hypot(m.x-Player.x,m.z-Player.z)<3.4); if(hitM&&!PF.pDown){ pfDie(hitM,'clipped by your spread'); pfKill('Your spread marker hit '+hitM.name+'.'); } pfFreeAll(); yield .3; }
// tankbuster with tank swap
function* pfBuster(swap){ const T=pfTank(); T.mark='buster'; yield* pfCast('git push --force (tankbuster)',2.4); T.mark=0; pfDmg(T,T.maxHp*.7,true); FX.burst(T.x,1.4,T.z,40,0xff6a3a,7,.35); Sound.sfx('crossboom'); shake(.6);
  if(swap){ const O=pfOT(); PF.mt=O.id; Game.dmgNums.push({x:O.x,y:O.y+2.8,z:O.z,n:'PROVOKE',t:0,big:true,col:'#7ab0ff'}); pfLog(O.name+' uses Provoke. Tank swap.'); } yield .5; }
// MEME: Grimmaw shirks the tankbuster onto a DPS
function* pfShirkMeme(){ const G=pfById('grimmaw'); PF.mt='grimmaw'; G.mark='buster'; PF.cast={name:'git push --force (tankbuster)',t:0,dur:2.8}; yield 1;
  twBark('grimmaw',"Tankbuster? Watch this. I'll press my big defensive.",true); yield 1.1; pfLog('Grimmaw uses Shirk.'); Game.dmgNums.push({x:G.x,y:3,z:G.z,n:'SHIRK',t:0,big:true,col:'#ffb0b0'});
  const C=pfById('caotan'); G.mark=0; C.mark='buster'; yield .7; PF.cast=null; C.mark=0; FX.burst(C.x,1.4,C.z,50,0xff6a3a,8,.4); Sound.sfx('crossboom'); shake(.6); pfDie(C,'took a tankbuster',1);
  twBark('caotan',"WHO SHIRKED?! I'm a DANCER! I'm made of SILK!",true); yield 1.6; twBark('grimmaw',"...The buttons are next to each other.",true);
  yield* pfRaiseAI(C,'mira'); twBark('mira',"Swiftcast, Raise. Grimmaw, I'm writing you up.",true); yield .5; }
// MEME: the off-tank dies and floortanks for a bit
function* pfFloortankMeme(){ const N=pfById('nathan'); PF.mt='nathan'; N.mark='buster'; PF.cast={name:'rm -rf ./tanks (tankbuster)',t:0,dur:2.6}; twBark('nathan',"Superbolide. I'll be at one HP. On purpose.",true); yield 2.6; PF.cast=null; N.mark=0;
  FX.burst(N.x,1.4,N.z,50,0xff6a3a,8,.4); Sound.sfx('crossboom'); pfDie(N,'Superbolide was on cooldown',1); pfLog('Nathan is floortanking. Paul seems confused.'); twBark('paul',"Is he... tanking me from the FLOOR?",true);
  yield 1.5; twBark('grimmaw',"Provoke. The dog is back on duty.",true); PF.mt='grimmaw'; yield 1.2; yield* pfRaiseAI(N,'hamza'); twBark('hamza',"Ascend! It's a pig card. It works the same.",true); }
// Passage of Arms: everyone gets behind Grimmaw's shield
function* pfPassage(){ const Pa=PF.paul, G=pfById('grimmaw'), a=rnd(0,6.28); PF.mt='grimmaw'; const px=PF_C.x+Math.cos(a)*11, pz=PF_C.z+Math.sin(a)*11;
  pfLog('Paul jumps to the edge.'); Pa.away=1; yield .25; Pa.x=px; Pa.z=pz; Pa.away=0; FX.burst(px,1,pz,40,0x7affb0,6,.4); Sound.sfx('slam');
  const gx=PF_C.x+Math.cos(a)*3, gz=PF_C.z+Math.sin(a)*3, back=a+Math.PI, half=.62, len=11; pfPlace(G,gx,gz); PF.passage={gx,gz,back,half,len};
  twBark('grimmaw',"PASSAGE OF ARMS! Behind me. My shield is bigger than my self-esteem.",true); pfPrompt('GET BEHIND GRIMMAW','#9fe0ff',5.4,'Stand inside his shield cone (Passage of Arms)');
  const cone=pfConeMesh(gx,gz,back,half,len,0x7ab0ff,.28); const cone2=pfConeMesh(gx,gz,back,half,len,0xffffff,.05);
  pfAI().filter(m=>m!==G&&!m.dead).forEach((m,i)=>{ const b=back+(i-3)*.14, r=3+(i%3)*1.6; pfPlace(m,gx+Math.cos(b)*r,gz+Math.sin(b)*r); });
  yield* pfCast('Merge Conflict (the whole arena)',5.4); scene.remove(cone); scene.remove(cone2);
  FX.flash=.7; grade.uniforms.flashCol.value.set(1,.6,.3); shake(1); Sound.sfx('crossboom'); for(let i=0;i<60;i++){ const r=rnd(0,16), b=rnd(0,6.28); FX.burst(PF_C.x+Math.cos(b)*r,.3,PF_C.z+Math.sin(b)*r,2,0xff8a3a,6,.35); }
  if(!PF.pDown&&!pfInCone(Player.x,Player.z,gx,gz,back,half,len)) pfKill('Merge Conflict. You were not behind Grimmaw.');
  PF.passage=null; pfFreeAll(); Pa.x=PF_C.x; Pa.z=PF_C.z; yield .6; }
// Hard Reset: hide behind a firewall. Then the firewalls start compiling: break them yourself.
function* pfFirewalls(){ const Pa=PF.paul; Pa.x=PF_C.x; Pa.z=PF_C.z; const a0=rnd(0,6.28); PF.walls=[];
  for(let i=0;i<4;i++){ const a=a0+i*Math.PI/2, x=PF_C.x+Math.cos(a)*7, z=PF_C.z+Math.sin(a)*7; const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.6,1.8),new THREE.MeshLambertMaterial({color:0x4a3a6a,emissive:0x101020,flatShading:true})); mesh.position.set(x,1.3,z); mesh.rotation.y=-a; mesh.userData.tw=1; scene.add(mesh);
    PF.walls.push({x,z,a,hp:4,maxHp:4,mesh,armed:0,name:'Firewall',col:0xa08aff}); FX.burst(x,1,z,30,0xa08aff,5,.4); }
  Sound.sfx('crash'); pfPrompt('HIDE BEHIND A FIREWALL','#c0b0ff',4.6,'Put a firewall between you and Paul'); pfLog('Paul begins casting Hard Reset (line of sight).');
  pfAI().filter(m=>!m.dead).forEach((m,i)=>{ const w=PF.walls[i%4], r=8.8+(i>3?1:0); pfPlace(m,PF_C.x+Math.cos(w.a+(i>3?.08:-.08))*r,PF_C.z+Math.sin(w.a+(i>3?.08:-.08))*r); });
  yield* pfCast('Hard Reset (line of sight)',4.6); FX.flash=.8; grade.uniforms.flashCol.value.set(.7,.6,1); Sound.sfx('crossboom'); shake(1);
  const hidden=PF.walls.some(w=>{ const dw=Math.hypot(w.x-Pa.x,w.z-Pa.z), dp=Math.hypot(Player.x-Pa.x,Player.z-Pa.z); return dp>dw+.4&&dp<dw+6&&angDiff(Math.atan2(Player.z-Pa.z,Player.x-Pa.x),Math.atan2(w.z-Pa.z,w.x-Pa.x))<Math.atan2(1.1,dw); });
  if(!PF.pDown&&!hidden) pfKill('Hard Reset. Nothing was between you and Paul.'); pfFreeAll(); yield .5;
  for(const w of PF.walls) w.armed=1; pfPrompt('DESTROY THE FIREWALLS','#ffd45a',3,'Only YOU can damage them. Punch!'); twBark('paul',"Firewalls compiling. Your party can't touch them. Only YOU can. It's called accountability.",true);
  pfLog('The firewalls begin compiling. Only you can damage them.'); PF.wallT=17;
  while(PF.wallT>0&&PF.walls.some(w=>w.hp>0)){ PF.wallT-=.1; if(Math.random()<.02){ const r=Math.random(); if(r<.33) twBark('caotan',"Why can't I hit these?!"); else if(r<.66) twBark('omar',"My scythe goes right through. Emotionally."); else twBark('caotan',"This is YOUR firewall, main character!"); } yield .1; }
  if(PF.walls.some(w=>w.hp>0)){ for(const w of PF.walls) if(w.hp>0){ FX.burst(w.x,1,w.z,60,0xa08aff,9,.5); } Sound.sfx('crossboom'); pfKill('A firewall finished compiling. The whole party was deleted.',true); }
  for(const w of PF.walls) if(w.mesh) scene.remove(w.mesh); PF.walls=[]; PF.wallT=0; yield .5; }
// the Blue Screen of Death: look away
function* pfGaze(castT){ const Pa=PF.paul; PF.gazeOn=1; pfPrompt('LOOK AWAY FROM PAUL','#5aa8ff',castT,'Face away from him when the screen turns blue');
  twBark('paul',"Behold. My true face. The Blue Screen of Death.",true); yield* pfCast('Blue Screen of Death (gaze)',castT);
  FX.flash=.8; grade.uniforms.flashCol.value.set(.2,.4,1); Sound.sfx('shatter'); const P=Player, toP=Math.atan2(Pa.z-P.z,Pa.x-P.x);
  if(!PF.pDown&&angDiff(P.ang||0,toP)<Math.PI/2) pfKill('You looked at the Blue Screen of Death.'); PF.gazeOn=0; yield .4; }
// towers: each needs one soaker. Yours glows white.
function* pfTowers(castT){ const a0=rnd(0,6.28), list=[]; const ai=pfAI().filter(m=>!m.dead&&m.role!=='tank');
  for(let i=0;i<4;i++){ const a=a0+i*Math.PI/2, x=PF_C.x+Math.cos(a)*9, z=PF_C.z+Math.sin(a)*9; const mine=i===0, col=mine?0xffffff:0x8a7aff;
    const ring=pfMesh(new THREE.RingGeometry(1.5,1.75,40),col,.95), fill=pfMesh(new THREE.CircleGeometry(1.5,32),col,mine?.25:.15); ring.position.set(x,.08,z); fill.position.set(x,.075,z);
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,6,24,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); pillar.position.set(x,3,z); pillar.userData.tw=1; scene.add(pillar);
    list.push({x,z,mine,ring,fill,pillar,who:mine?null:ai[i-1]}); if(!mine&&ai[i-1]) pfPlace(ai[i-1],x,z); }
  PF.towers=list; pfPrompt('SOAK THE WHITE TOWER','#ffffff',castT,'One tower is yours. Empty tower = everyone dies'); pfLog('Merge Request towers appear.');
  yield* pfCast('Merge Request (towers)',castT); Sound.sfx('crossboom'); shake(.7);
  for(const T of list){ FX.burst(T.x,1,T.z,40,T.mine?0xffffff:0x8a7aff,7,.45); scene.remove(T.ring); scene.remove(T.fill); scene.remove(T.pillar); }
  PF.towers=null; const mine=list[0]; if(!PF.pDown&&Math.hypot(Player.x-mine.x,Player.z-mine.z)>1.75) pfKill('Nobody soaked your tower. The merge request exploded on everyone.',true);
  pfFreeAll(); yield .4; }
// bugs: adds that crawl toward Paul. Only you can squash them.
function texBug(){ return twTex('pfbug',20,16,c=>{ R(c,5,4,10,9,'#3a1a1a'); R(c,6,5,8,7,'#c03a3a'); R(c,9,5,1,7,'#3a1a1a'); for(const y of [6,9,12]){ R(c,2,y,3,1,'#2a1010'); R(c,15,y,3,1,'#2a1010'); } R(c,7,2,2,2,'#2a1010'); R(c,11,2,2,2,'#2a1010'); R(c,7,7,2,2,'#fff'); R(c,11,7,2,2,'#fff'); }); }
function* pfBugs(n,timeLimit){ const Pa=PF.paul; PF.bugs=[]; const a0=rnd(0,6.28);
  for(let i=0;i<n;i++){ const a=a0+i*6.283/n, x=PF_C.x+Math.cos(a)*14, z=PF_C.z+Math.sin(a)*14, mesh=twBB(texBug(),1.5,1.2); PF.bugs.push({x,z,hp:4,maxHp:4,mesh,name:'Bug',col:0xff5a5a,ph:i,sp:13/timeLimit}); FX.burst(x,1,z,20,0xff5a5a,4,.3); }
  pfPrompt('SQUASH THE BUGS','#ff8a8a',3,'Only YOU can damage them. If one reaches Paul, it ships to production'); twBark('paul',"These are YOUR bugs. Only YOU can fix them. That's how it works at my job too.",true);
  let t=0; while(PF.bugs.some(b=>b.hp>0)&&t<timeLimit+4){ t+=.1;
    for(const b of PF.bugs){ if(b.hp<=0) continue; const dx=Pa.x-b.x, dz=Pa.z-b.z, d=Math.hypot(dx,dz); if(d>1.4){ b.x+=dx/d*b.sp*.1; b.z+=dz/d*b.sp*.1; } else { FX.burst(Pa.x,1.4,Pa.z,60,0xff3a3a,8,.5); Sound.sfx('crossboom'); pfKill('A bug reached production. Everyone was paged at 3am. Everyone died.',true); PF.bugs.forEach(q=>{ if(q.mesh) scene.remove(q.mesh); }); PF.bugs=[]; return; } }
    if(Math.random()<.015) twBark('omar',"I struck it with the edge. It did not care. Relatable."); yield .1; }
  PF.bugs.forEach(q=>{ if(q.mesh) scene.remove(q.mesh); }); PF.bugs=[]; pfLog('All bugs squashed. Paul looks betrayed.'); yield .4; }
// Doom: get to Mira's Esuna circle before it ticks down
function* pfDoomStart(dur){ PF.doom={t:dur,max:dur,c:null}; pfPrompt('DOOM! GET ESUNA FROM MIRA','#ff5a7a',3,'Stand in the green circle she drops'); pfLog('You are afflicted with Doom.'); Sound.sfx('gong');
  const M=pfById('mira'); yield 1.6; if(!PF.doom) return; const a=rnd(0,6.28), x=PF_C.x+Math.cos(a)*rnd(5,10), z=PF_C.z+Math.sin(a)*rnd(5,10); pfPlace(M,x+1.4,z);
  const c=pfMesh(new THREE.CircleGeometry(1.5,32),0x7affb0,.35), r=pfMesh(new THREE.RingGeometry(1.4,1.6,40),0x7affb0,.9); c.position.set(x,.08,z); r.position.set(x,.085,z); PF.doom.c={x,z,meshes:[c,r]}; twBark('mira',"Esuna circle! Get in here!",true); }
function pfUpdateDoom(dt){ const Dm=PF.doom; if(!Dm) return; Dm.t-=dt; if(Dm.c&&!PF.pDown&&Math.hypot(Player.x-Dm.c.x,Player.z-Dm.c.z)<1.6){ Dm.c.meshes.forEach(m=>scene.remove(m)); PF.doom=null; FX.burst(Player.x,1.2,Player.z,30,0x7affb0,5,.35); Sound.sfx('heart'); Game.dmgNums.push({x:Player.x,y:Player.y+2.6,z:Player.z,n:'ESUNA',t:0,big:true,col:'#7affb0'}); const M=pfById('mira'); if(M) M.force=null; return; }
  if(Dm.t<=0){ if(Dm.c) Dm.c.meshes.forEach(m=>scene.remove(m)); PF.doom=null; const M=pfById('mira'); if(M) M.force=null; pfKill("Doom. You never made it to Mira's Esuna."); } }
// knockback from Paul: use Arm's Length or fly off the platform
function* pfForcePush(withDynamo){ const Pa=PF.paul; Pa.x=PF_C.x; Pa.z=PF_C.z; pfPrompt("KNOCKBACK! RIGHT CLICK: ARM'S LENGTH",'#9fe0ff',4,"Or you'll be pushed off the platform");
  if(withDynamo){ PF.inout='in'; } yield* pfCast('Force Push'+(withDynamo?' + Lunar Dynamo.exe':''),4); if(withDynamo) pfDonut(Pa.x,Pa.z,3.2,26,.01,'Lunar Dynamo.exe');
  for(const m of pfAI()) if(!m.dead) Game.dmgNums.push({x:m.x,y:2.8,z:m.z,n:'ARM\'S LENGTH',t:0,col:'#9fe0ff'});
  Sound.sfx('crossboom'); shake(1); FX.ring(Pa.x,.1,Pa.z,'#9fe0ff',20,.6); const P=Player;
  if(!PF.pDown&&!TW.god){ if(P.armsT>0){ Game.dmgNums.push({x:P.x,y:P.y+2.6,z:P.z,n:'STOOD FIRM',t:0,big:true,col:'#9fe0ff'}); } else { const a=Math.atan2(P.z-Pa.z,P.x-Pa.x)||rnd(0,6.28); const kd=21/.55; PF.kb={vx:Math.cos(a)*kd,vz:Math.sin(a)*kd,t:.55}; pfLog('You were knocked back.'); } }
  yield .9; PF.inout=null; }
// exaflares: chains of explosions marching across the arena
function pfExaflare(sx,sz,ang,steps,stepT){ for(let k=0;k<steps;k++){ pfLater(k*stepT,()=>{ const x=sx+Math.cos(ang)*k*3.4, z=sz+Math.sin(ang)*k*3.4; if(Math.hypot(x-PF_C.x,z-PF_C.z)<L.R+1) pfCircle(x,z,2.9,k===0?1.4:stepT,'Infinite Loop (exaflare)',{quiet:k%2===1,n:20}); }); } }
function* pfExaflares(n,stepT){ const a0=rnd(0,6.28); for(let i=0;i<n;i++){ const a=a0+i*6.283/n, sx=PF_C.x+Math.cos(a)*13, sz=PF_C.z+Math.sin(a)*13; pfExaflare(sx,sz,a+Math.PI+rnd(-.25,.25),9,stepT); }
  pfLog('Paul casts Infinite Loop. Exaflares.'); pfPrompt('EXAFLARES','#ffb04a',1.8,'Walk into the spots that just exploded'); yield 1.4+9*stepT; }

// ---------- phases ----------
function* pfQ1(){ const Pa=PF.paul; Pa.x=PF_C.x; Pa.z=PF_C.z; pfLog('Duty Commenced. (The Navel: Paul Extreme)'); PF.raises=PF.raises||0;
  twBark('paul',"Welcome to my raid. I wrote every mechanic myself. In one night. None of it is tested.",true); yield 2.5;
  PF.phase=1; pfRate(.36,70);
  yield* pfRaidwide('Patch Notes (raidwide)',.35); yield .6;
  yield* pfInOut(['out','in'],2.6); yield .5;
  yield* pfStackWith('mira',3.4); yield .4;
  yield* pfShirkMeme(); yield .4;
  yield* pfInOut(['in','out'],2.2);
  yield* pfSpreadOnMe(3.2); yield .4;
  yield* pfGaze(3.4); yield .4;
  yield* pfBuster(true); yield* pfInOut(['out','in'],1.9);
  yield* pfWaitHP(20); }
function* pfQ2(){ const Pa=PF.paul; PF.phase=2; pfRate(0,PF.hp); twCutin('paul','PHASE II: CODE REVIEW','Your code has been reviewed. REJECTED.','#7affb0',2.2); Sound.sfx('skyopen'); impactFrame([[2,2],[1,2]]); yield 2.4;
  pfRate(.34,40);
  yield* pfPassage(); yield .4;
  yield* pfFirewalls(); yield .4;
  yield* pfFloortankMeme(); yield .3;
  // towers while the arena does in/out around them
  yield* pfPar(pfTowers(5),(function*(){ yield 2.6; pfCircle(PF.paul.x,PF.paul.z,6,1.6,PF_TXT.out,{quiet:true}); })()); yield .4;
  // bugs with Doom on top
  yield* pfPar(pfDoomStart(11),pfBugs(3,17)); while(PF.doom&&!PF.dead) yield .1;
  yield* pfRaidwide('Code Freeze (raidwide)',.45); yield* pfGaze(2.6);
  yield* pfWaitHP(18); }
function* pfQ3(){ const Pa=PF.paul; PF.phase=3; pfRate(0,PF.hp); twCutin('paul','PHASE III: PRODUCTION DEPLOY','Friday, 4:59 PM. No rollback.','#ff5a7a',2.2); Sound.sfx('skyopen'); impactFrame([[3,2],[1,2]]); yield 2.4;
  pfRate(.42,10); twBark('nathan',"He's deploying on a FRIDAY. This man is a monster.",true);
  yield* pfForcePush(true); yield .5;
  yield* pfPar(pfExaflares(3,.75),pfStackWith('hamza',4.2));
  yield* pfBuster(true); yield* pfInOut(['in','out'],1.7);
  yield* pfPar(pfPassage(),(function*(){ yield 2.4; yield* pfGaze(2.9); })());
  yield .4; yield* pfPar(pfTowers(4.4),pfExaflares(2,.7));
  yield* pfForcePush(false); yield* pfInOut(['out','in'],1.5); yield* pfRaidwide('Hotfix (raidwide)',.5);
  yield* pfWaitHP(20); }
function* pfQ4(){ PF.enrage=1; PF.cast={name:'rm -rf / --no-preserve-root (ENRAGE)',t:0,dur:16}; pfLog('Paul begins casting rm -rf /. Enrage.'); twBark('paul',"rm dash rf slash. No preserve root. Goodbye, everyone.",true); yield 2.2;
  twBark('mira',"Everyone, LIMIT BREAK! Whoever has the bar, PRESS IT!",true); yield 1.6;
  twBig('LIMIT BREAK',{size:80,col:'#7ab0ff',y:UH*.3,dur:1.6}); PF.lb=1; pfLog('The party uses Limit Break: Final Heaven. (It is a punch.)'); Sound.sfx('skyopen'); impactFrame([[1,2],[3,2],[2,2]]); shake(1.2);
  pfRate(4,0); while(PF.hp>0) yield .1; PF.cast=null; yield .3; TW.paulWon=1; run(twPaulFinale); }
PF_PHASES.length=0; PF_PHASES.push(pfQ1,pfQ2,pfQ3,pfQ4);
pfSkipPhase=function(){ if(!PF||PF.pi>=3||PF.skipT>0) return; PF.skipT=1.2; for(const h of PF.haz) h.kill&&h.kill(); PF.haz=[]; PF.cast=null; PF.inout=null; PF.gazeOn=0; PF.prompt=null;
  for(const b of PF.bugs||[]) if(b.mesh) scene.remove(b.mesh); PF.bugs=[]; for(const w of PF.walls||[]) if(w.mesh) scene.remove(w.mesh); PF.walls=[]; if(PF.doom&&PF.doom.c) PF.doom.c.meshes.forEach(m=>scene.remove(m)); PF.doom=null;
  for(const m of PF.members){ m.mark=0; m.force=null; m.stackOn=null; if(m.dead){ m.dead=0; m.hp=m.maxHp*.5; } } const Pa=PF.paul; Pa.away=0; Pa.hy=0; Pa.x=PF_C.x; Pa.z=PF_C.z;
  PF.hp=Math.min(PF.hp,[70,40,10][PF.pi]); PF.pi++; PF.gen=pfTimeline(); PF.wait=.5; twBig('PHASE SKIPPED',{size:40,col:'#7affb0',y:UH*.24,dur:1}); };

// ---------- per-frame extras ----------
(function(){ const pu=pfUpdate; pfUpdate=function(dt){ pu(dt); if(!PF||L.key!=='paul') return; const play=Game.state==='play';
    if(PF.prompt){ PF.prompt.t+=dt; if(PF.prompt.t>PF.prompt.dur+.4) PF.prompt=null; } if(PF.cast2) PF.cast2.t+=dt;
    if(play){ pfUpdateRaise(dt); pfUpdateDoom(dt); for(const b of PF.bugs||[]) b.flash=Math.max(0,(b.flash||0)-dt); }
    for(const m of PF.members) if(m.dead) m.hp=0; }; })();
// tanks never die to auto attacks; the AI only dies when the script says so
(function(){ const dm=pfDmg; pfDmg=function(m,d,show){ if(m.dead) return; return dm(m,d,show); }; const ha=pfHealAll; pfHealAll=function(f){ for(const m of PF.members) if(!m.dead) m.hp=Math.min(m.maxHp,m.hp+m.maxHp*f); }; })();
// restart resets the raise counter and leftovers
(function(){ const ps=pfStart; pfStart=function(){ ps(); PF.raises=0; PF.pDown=0; PF.bugs=[]; PF.walls=[]; PF.doom=null; PF.prompt=null; PF.armsCd=0; Player.armsT=0; }; })();

// ---------- UI extras: prompts, raises, Arm's Length, head markers, add HP ----------
(function(){ const du=pfDrawUI; pfDrawUI=function(){ du(); if(!PF||L.key!=='paul') return; const t=performance.now()/1000;
    D.save(); D.font=`700 13px ${FB}`; D.fillStyle='#fff0a0'; D.fillText('Raises left: '+(3-(PF.raises||0))+'  (Mira, Hamza)',16,96+8*46+6);
    // Arm's Length
    const ax=UW/2-130, ay=UH-64, rd=PF.armsCd>0; D.fillStyle='rgba(10,10,18,.7)'; D.fillRect(ax,ay,260,40); D.strokeStyle=rd?'#5a5a6a':'#9fe0ff'; D.lineWidth=2; D.strokeRect(ax,ay,260,40);
    D.fillStyle=rd?'#8a8a9a':'#bfefff'; D.font=`700 15px ${FB}`; D.textAlign='center'; D.fillText("Arm's Length  ·  Right click"+(rd?'  ('+Math.ceil(PF.armsCd)+'s)':'  READY'),UW/2,ay+18); D.font=`600 11px ${FB}`; D.fillStyle='#a8a8b8'; D.fillText('Left click punch (white ring = in range)',UW/2,ay+34);
    if(Player.armsT>0){ D.fillStyle='#9fe0ff'; D.fillText("Knockback immunity "+Player.armsT.toFixed(1)+'s',UW/2,ay-6); }
    // big prompt
    if(PF.prompt){ const p=PF.prompt, k=Math.min(1,p.t*6)*Math.min(1,(p.dur+.4-p.t)*3); D.globalAlpha=Math.max(0,k); D.fillStyle='rgba(6,6,12,.6)'; D.fillRect(UW/2-330,UH*.28-36,660,p.sub?70:48);
      D.font=`900 ${32+Math.sin(t*8)*1.5}px ${FB}`; D.lineWidth=6; D.strokeStyle='#100810'; D.strokeText(p.text,UW/2,UH*.28); D.fillStyle=p.col; D.fillText(p.text,UW/2,UH*.28);
      if(p.sub){ D.font=`600 15px ${FB}`; D.fillStyle='#e8e0d0'; D.fillText(p.sub,UW/2,UH*.28+24); } D.globalAlpha=1; }
    // Doom debuff
    if(PF.doom){ D.font=`900 20px ${FB}`; D.fillStyle='#ff5a7a'; D.fillText('☠ DOOM '+Math.max(0,PF.doom.t).toFixed(1)+'s',UW/2,UH*.4); }
    // raise overlay
    if(PF.pDown){ D.fillStyle='rgba(40,0,10,.35)'; D.fillRect(0,0,UW,UH); D.font=`900 34px ${FB}`; D.fillStyle='#ffd0d8'; D.fillText('YOU DIED',UW/2,UH*.45); D.font=`600 16px ${FB}`; D.fillText(PF.pWhy||'',UW/2,UH*.45+28); D.fillStyle='#fff0a0'; D.fillText(PF.raiser==='hamza'?'Hamza is drawing a card...':'Mira is casting Raise...',UW/2,UH*.45+52); }
    if(PF.cast2){ D.font=`700 13px ${FB}`; D.fillStyle='#bfffd0'; D.fillText(PF.cast2.who+' casting '+PF.cast2.name,UW/2,104+(PF.heart?30:0)); }
    D.textAlign='left';
    // head markers: stack / spread / dead
    for(const m of PF.members){ const [sx,sy,z]=toScreen(m.x,(m.y||0)+3.4,m.z); if(z>1) continue;
      if(m.mark==='stack'){ D.save(); D.translate(sx,sy); D.strokeStyle='#7affb0'; D.lineWidth=4; for(let i=0;i<4;i++){ D.rotate(Math.PI/2); D.beginPath(); D.moveTo(-8,-22+Math.sin(t*8)*3); D.lineTo(0,-12+Math.sin(t*8)*3); D.lineTo(8,-22+Math.sin(t*8)*3); D.stroke(); } D.restore(); }
      if(m.mark==='spread'){ D.save(); D.strokeStyle='#c08aff'; D.lineWidth=4; D.beginPath(); D.arc(sx,sy,14+Math.sin(t*10)*2,0,7); D.stroke(); D.restore(); }
      if(m.dead&&!m.isPlayer){ D.font=`700 12px ${FB}`; D.fillStyle='#ff9a9a'; D.textAlign='center'; D.fillText('KO',sx,sy+20); D.textAlign='left'; } }
    // Paul's blue screen during the gaze
    if(PF.gazeOn){ const Pa=PF.paul, [sx,sy,z]=toScreen(Pa.x,Pa.hy+5.4,Pa.z); if(z<1){ D.fillStyle='#1a4aff'; D.fillRect(sx-30,sy-20,60,40); D.fillStyle='#fff'; D.font='700 22px monospace'; D.textAlign='center'; D.fillText(':(',sx,sy+8); D.textAlign='left'; } }
    // add HP
    for(const a of (PF.bugs||[]).concat((PF.walls||[]).filter(w=>w.armed))){ if(a.hp<=0) continue; const [sx,sy,z]=toScreen(a.x,2.6,a.z); if(z>1) continue; D.fillStyle='rgba(0,0,0,.7)'; D.fillRect(sx-24,sy,48,6); D.fillStyle='#ffd45a'; D.fillRect(sx-24,sy,48*a.hp/a.maxHp,6); }
    if(PF.wallT>0){ D.font=`900 18px ${FB}`; D.fillStyle='#ffd45a'; D.textAlign='center'; D.fillText('Firewalls compile in '+PF.wallT.toFixed(1)+'s',UW/2,UH*.36); D.textAlign='left'; }
    D.restore(); }; })();
