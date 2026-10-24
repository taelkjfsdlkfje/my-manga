// =====================================================================
// SHAYAN + PACT: Hamza turns, the twins save you, then turn on you too
// =====================================================================
const HZG_HP=[0,130,160];
function hzgHurt(d,src){ d=hzgHurtGod(d,src); const G=TW.giant; if(!G||G.hp<=0) return false; if(G.inv){ FX.spark(G.x,G.y+2,G.z); return false; }
  d=Math.round(d*(G.stun>0?1.5:1)*10)/10; G.hp=Math.max(0,G.hp-d); G.flash=.1; FX.burst(G.x,G.y+2,G.z,8,0xffb0c8,3,.25); Game.dmgNums.push({x:G.x,y:G.y+4.6,z:G.z,n:d,t:0,col:'#ffc8da'});
  if(G.hp<=0&&!G.pend){ G.inv=true; G.gen=null; twClearHz(); BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); G.pend=G.phase<2?hzgPhase2:hzgFinale; } return true; }
function hzgBar(){ const G=TW.giant; if(!G||G.noBar) return; const T={who:'hamzagiant',title:'Hamza, Big Back Edition',sub:G.phase<2?'The Swine Who Would Eat Lanternbrook':'Second Breakfast',hp:G.hp,maxHp:G.maxHp,phase:G.phase,phases:2,lcDone:{2:1},inv:G.inv,stun:G.stun,shown:G.shown};
  twBarFor(T,(UW-620)/2,UH-52-Game.letter*70,620,true); G.shown=T.shown; }
function hzgDraw(){ const G=TW.giant, H=Game.hamza; if(!G||!H) return; H.mode='giant'; H.x=G.x; H.y=G.y; H.z=G.z; H.mouth=G.mouth; H.f=Player.x>G.x?1:-1; H.gs=G.gs; H.front=0; if(gpSprite) gpSprite.glow(G.flash>0?.9:G.stun>0?.5:.42); }
function hzgStart(){ const c=L.zone?{x:L.zone.x,z:L.zone.z}:{x:Player.x,z:Player.z}, lock=twArenaAround(c.x,c.z);
  TW.giant={x:c.x,z:c.z-5,y:groundY(c.x,c.z-5),hp:HZG_HP[1],maxHp:HZG_HP[1],phase:1,inv:false,gen:null,wait:0,cd:1.6,t:0,flash:0,mouth:0,gs:.55,stun:0,bag:[],lock,center:c};
  TW.fight={kind:'giant',lock,allyFoes:false,frame:false}; TW.foes=[]; Game.arena={lock}; Cam.zoom=1.32; Sound.play('boss');
  TW.giantRespawn=()=>{ const G=TW.giant; twClearHz(); BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); Object.assign(G,{hp:G.maxHp,gen:null,inv:false,stun:0,cd:1.6,pend:null,x:c.x,z:c.z-5,mouth:0}); resetPlayer({x:c.x,z:c.z+5},true); Player.hp=Player.maxHp;
    Game.arena={lock}; Cam.cine=null; Cam.focus=null; Game.letterTo=0; Game.fade=1; Game.fadeTo=0; Sound.play('boss'); Game.banner={name:'Phase '+['','I','II'][G.phase],sub:'Hamza, Big Back Edition',t:0,small:1}; }; }
const HZG_POOL={1:['flop','snot','piglets','pee','chomp'],2:['flop','snot','piglets','pee','chomp','inhale','oink']};
function hzgUpdate(dt,play){ const G=TW.giant; G.t+=dt; G.flash=Math.max(0,G.flash-dt); G.y=lerp(G.y,groundY(G.x,G.z)+(G.air||0),Math.min(1,dt*10));
  if(G.mv&&play){ const m=G.mv; m.t+=dt; const u=Math.min(1,m.t/m.dur); G.x=lerp(m.sx,m.x,u); G.z=lerp(m.sz,m.z,u); if(u>=1) G.mv=null; }
  if(!Cam.cine&&TW.fight&&TW.fight.kind==='giant'){ const P=Player, fx=lerp(P.x,G.x,.3), fz=lerp(P.z,G.z,.3); Cam.focus=Cam.focus||{x:fx,y:0,z:fz}; Cam.focus.x=lerp(Cam.focus.x,fx,Math.min(1,dt*4)); Cam.focus.z=lerp(Cam.focus.z,fz,Math.min(1,dt*4)); }
  if(!play) return; if(G.stun>0) G.stun-=dt;
  if(G.pend&&!Game.script){ const g=G.pend; G.pend=null; run(g); return; }
  if(G.gen){ G.wait-=dt; let n=0; while(G.gen&&G.wait<=0&&n++<50){ let r; try{ r=G.gen.next(); }catch(e){ console.error('hamza',e); r={done:true}; } if(r.done){ G.gen=null; G.cd=G.phase>=2?.75:1.05; G.mouth=0; } else G.wait+=(r.value||0); } return; }
  if(G.hp<=0||G.inv||G.noAttack) return;
  const P=Player, dx=P.x-G.x, dz=P.z-G.z, d=Math.hypot(dx,dz); if(d>6){ G.x+=dx/d*2.2*dt; G.z+=dz/d*2.2*dt; } const c=twClampXZ(G.x,G.z,2); G.x=c.x; G.z=c.z;
  if(d<2.6&&!G.touchT){ G.touchT=1; twHitP(2,G.x,G.z,{heavy:true,melee:true}); setTimeout(()=>{ if(TW.giant) TW.giant.touchT=0; },900); }
  G.cd-=dt; if(G.cd<=0){ if(!G.bag.length||G.bagPh!==G.phase){ G.bag=HZG_POOL[G.phase].slice().sort(()=>Math.random()-.5); G.bagPh=G.phase; } const k=G.bag.shift(); G.gen=HZG[k](G,G.phase); G.wait=0; } }
function texPiglet(){ return twTex('piglet',32,32,(c)=>drawEyePiglet(c,16,30,0,0)); }
const HZG={
  *flop(G,ph){ twBark('hamza',ph>=2?"DOUBLE FLOP. Bismillah.":"Belly flop! Oink!",true); for(let k=0;k<(ph>=2?2:1);k++){ const P=Player, p=twClampXZ(P.x+P.vx*.4,P.z+P.vz*.4,2.2); FX.marker(p.x,p.z,3,0xff6a9a,1.05); Sound.sfx('pigroar');
      G.mouth=.6; G.mv={sx:G.x,sz:G.z,x:p.x,z:p.z,t:0,dur:.9}; const up={t:0}; twHz({upd(dt){ up.t+=dt; G.air=Math.sin(Math.min(1,up.t/.9)*Math.PI)*6; return up.t<.9; }, kill(){ G.air=0; }}); yield .95;
      Sound.sfx('slam'); Sound.sfx('crash'); shake(1); FX.burst(G.x,groundY(G.x,G.z)+.4,G.z,50,0xd8c0c8,8,.45,false); FX.ring(G.x,groundY(G.x,G.z),G.z,'#ffb0c8',5,.5);
      if(twInR(G.x,G.z,3,1.5)) twHitP(3,G.x,G.z,{ub:true}); twWave(G.x,G.z,{col:0xffb0c8,sp:8,max:12}); if(ph>=2) twWave(G.x,G.z,{col:0xffb0c8,sp:8,max:12,delay:.45}); yield .7; } G.mouth=0; },
  *snot(G,ph){ twBark('hamza',"Snot rockets. Sorry. Allergies.",true); for(let v=0;v<(ph>=2?3:2);v++){ G.mouth=.3; const n=ph>=2?7:5; for(let k=0;k<n;k++) twAimBolt(G,'goo',G.x,G.y+2.4,G.z,8,(k-(n-1)/2)*.17,{col:0x8aff6a,homing:ph>=2?.5:0}); Sound.sfx('squelch'); yield .55; } G.mouth=0; yield .4; },
  *piglets(G,ph){ twBark('hamza',"Go, my children! My beautiful eyeball children!",true); const A=G.lock||twLock(), P=Player;
    for(let w=0;w<(ph>=2?2:1);w++){ const lanes=[P.z,P.z+rnd(2.2,3.2)*(Math.random()<.5?1:-1),P.z+rnd(-5,5)]; for(const [i,lz] of lanes.entries()){ const z=clamp(lz,A.z0+1,A.z1-1), dir=(w+i)%2?-1:1, x0=dir>0?A.x0-1:A.x1+1;
        FX.line(dir>0?A.x0:A.x1,z,dir>0?0:Math.PI,A.x1-A.x0,1.3,0xff6a9a,1);
        for(let k=0;k<4;k++){ const m=twBB(texPiglet(),1.4,1.4), s={x:x0-dir*k*1.6,t:-1-k*.06,hit:false};
          twHz({upd(dt,play){ if(play) s.t+=dt; if(s.t<0){ m.visible=false; return true; } m.visible=true; s.x+=dir*11*dt; const gy=groundY(s.x,z); m.position.set(s.x,gy+.7+Math.abs(Math.sin(s.t*14))*.3,z); m.scale.x=dir;
            const P2=Player; if(!s.hit&&Math.abs(P2.x-s.x)<.7&&Math.abs(P2.z-z)<.7&&P2.y<gy+.8){ if(twHitP(2,s.x,z,{})!=='none') s.hit=true; } return s.x>A.x0-3&&s.x<A.x1+3; }, kill(){ scene.remove(m); }}); } }
      Sound.sfx('oink'); yield 2; } },
  *pee(G,ph){ twBark('hamza',"Bismillah, I gotta go. Don't look.",true); Sound.sfx('pee'); const P=Player;
    for(let i=0;i<(ph>=2?9:6);i++){ const a=rnd(0,6.28), r=i===0?0:rnd(1,4), p=twClampXZ(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r,.8), m=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0xffe040})); m.userData.tw=1; scene.add(m);
      twThrow({x:G.x,y:G.y+1.6,z:G.z,tx:p.x,tz:p.z,dur:.8,h:3,mesh:m,r:1.2,col:0xffe040,trail:0xffe040,onLand(x,z){ Sound.sfx('pee'); twZone(x,z,1.25,4.5,{dmg:1,every:.6,slow:.35,col:0xffe040,op:.55,fx:.1,fxCol:0xffe040}); }}); yield .14; } yield .8; },
  *chomp(G,ph){ for(let k=0;k<(ph>=2?3:1);k++){ const P=Player, a=Math.atan2(P.z-G.z,P.x-G.x), d=Math.min(16,Math.hypot(P.x-G.x,P.z-G.z)+3); FX.line(G.x,G.z,a,d,3,0xff3a5a,.7); G.mouth=1; Sound.sfx('pigrumble'); twBark('hamza',k?"CHOMP!":"Itadakimasu.",true); yield .7;
      Sound.sfx('chomp'); Sound.sfx('dash'); const s={t:0,hit:false,dur:d/18}; twHz({upd(dt,play){ if(!play) return true; s.t+=dt; G.x+=Math.cos(a)*18*dt; G.z+=Math.sin(a)*18*dt; const c=twClampXZ(G.x,G.z,2); G.x=c.x; G.z=c.z;
        const P2=Player; if(!s.hit&&Math.hypot(P2.x-G.x,P2.z-G.z)<2.3){ if(twHitP(3,G.x,G.z,{heavy:true,melee:true,onParry:()=>{ G.stun=Math.max(G.stun,1.6); Game.dmgNums.push({x:G.x,y:G.y+4,z:G.z,n:'STAGGERED',t:0,col:'#ffd45a'}); }})!=='none') s.hit=true; } FX.spawn(G.x,G.y+.3,G.z,rnd(-2,2),rnd(1,3),rnd(-2,2),.5,0xd8c0c8,.4,8,false); return s.t<s.dur; }});
      yield s.dur+.2; G.mouth=0; shake(.4); yield .25; } },
  *inhale(G,ph){ twBark('hamza',"Hunger... ETERNAL HUNGER. Also I skipped breakfast.",true); G.mouth=1; Sound.sfx('suck'); twPull(G.x,G.z,4.4,3.2,{flat:true,r:40,col:0xffb0c8}); twZone(G.x,G.z,2.6,3.2,{dmg:3,every:.5,col:0x3a0010,op:.7});
    for(let i=0;i<10;i++){ const P=Player, a=rnd(0,6.28), x=P.x+Math.cos(a)*7, z=P.z+Math.sin(a)*6, d=Math.hypot(G.x-x,G.z-z)||1; twBolt(G,{kind:'bone',x,y:groundY(x,z)+1,z,vx:(G.x-x)/d*7,vz:(G.z-z)/d*7,dmg:2,life:2}); yield .3; } G.mouth=0; yield .5; },
  *oink(G,ph){ for(let k=0;k<3;k++){ G.mouth=1; twBig('OINK.',{size:70+k*16,col:'#ffb0c8',y:UH*.3,dur:.7}); Sound.sfx('pigroar'); shake(.6); twWave(G.x,G.z,{col:0xffb0c8,sp:9,max:13}); yield .75; G.mouth=0; yield .15; } yield .4; }
};
function* twPactHamza(){ const P=Player, mi=Game.mira, H=Game.hamza; if(!H){ yield* twTwinsTurn(); return; } Sound.stop(); Game.eclipse=0; Game.letterTo=1;
  H.mode='cine'; H.x=P.x-1.2; H.z=P.z+.4; H.y=P.y+1.6; Cam.focus=null; cineSet(P.x+.3,1.6,P.z+6.5,P.x,1.4,P.z); yield wait(.6);
  yield say('hamza',"Oink oink."); yield say('shayan',"Hamza? What's wrong, buddy?");
  Sound.sfx('pigrumble'); shake(.3); for(let i=0;i<8;i++){ H.flash=i%2; yield wait(.12); }
  H.mode='giant'; H.gs=.25; H.mouth=0; H.x=P.x-4.4; H.z=P.z-1; H.y=groundY(H.x,H.z); H.f=1; Sound.sfx('slam'); shake(.8); FX.flash=.6; grade.uniforms.flashCol.value.set(1,.6,.8); FX.burst(H.x,H.y+2,H.z,60,0xffb0c8,8,.4);
  cineSet(P.x-1,1.8,P.z+10,P.x-1.6,2.6,P.z); yield tween(H,{gs:.55},.9,t=>1-Math.pow(1-t,3)); Sound.sfx('pigroar'); if(mi) yield say('mira',"W-what is that?!",'surprised');
  yield tween(H,{mouth:1},.35); Sound.sfx('dash'); yield tween(H,{x:P.x-2.4},.18,t=>t*t);
  // freeze frame: the twins step in
  Game.timeScale=.08; FX.flash=.5; grade.uniforms.flashCol.value.set(.8,.6,1); impactFrame([[2,2],[1,1]]); Sound.sfx('secret');
  const C=TW.allies.find(a=>a.who==='caotan'), O=TW.allies.find(a=>a.who==='omar');
  if(O){ O.x=H.x+.6; O.z=H.z+.6; O.cast=3; } if(C){ C.x=P.x+1; C.z=P.z+.8; C.fire=3; }
  cineSet(P.x-1,P.y+2,P.z+7.5,P.x-1.6,P.y+1.6,P.z); yield wait(.1);
  if(O) yield say('omar',"Not today, bacon. My scythe is in your jaw. Sorry. Not sorry. Mostly not sorry.");
  if(C) yield say('caotan',"And I glued your feet to the floor! Don't ask with what!",'happy');
  Game.timeScale=1; yield tween(H,{x:P.x-4.5,mouth:.3},.4,t=>1-Math.pow(1-t,3)); Sound.sfx('crash'); shake(.6);
  twCamP(6.5,1.4);
  yield say('shayan',"HAMZA?! You were gonna EAT me?!",'surprised');
  yield say('hamza',"Bismillah. I was gonna eat everyone. You were just the appetizer.");
  yield say('hamza',"Then the world. Then dessert. Probably also the world again. Seconds.");
  yield say('shayan',"We've been through EVERYTHING together! You peed on my DRILL!");
  yield say('hamza',"...That was a love language, Shayan.");
  if(C) yield say('caotan',"Senpai! We've got your back! Squad, assemble!",'happy'); if(O) yield say('omar',"I don't 'assemble'. I... emerge.");
  evaCard(['HAMZA','BIG BACK EDITION'],2.2,1); Sound.sfx('slam'); yield wait(2.2);
  if(mi){ mi.follow=false; mi.x=P.x+4; mi.z=P.z+5; mi.y=groundY(mi.x,mi.z); }
  hzgStart(); const G=TW.giant; G.x=H.x; G.z=H.z; card('Hamza, Big Back Edition','The Swine Who Would Eat Lanternbrook');
  yield cineTo([P.x,P.y+8.2,P.z+15],[P.x,P.y,P.z],.7); Cam.cine=null; Game.letterTo=0; P.inv=1; }
function* hzgPhase2(){ const G=TW.giant, P=Player; Sound.stop(); Game.letterTo=1; P.inv=99; G.inv=true; G.mouth=1;
  cineSet(G.x+2,2,G.z+9,G.x,3,G.z); yield say('hamza',"You think THIS is my final form? I haven't even had LUNCH.");
  Sound.sfx('chomp'); for(let i=0;i<40;i++) FX.spawn(G.x+rnd(-8,8),groundY(G.x,G.z)+.2,G.z+rnd(-6,6),(G.x-P.x)*.0,rnd(1,3),0,1,i%2?0xffffff:0x306040,.3,0,false);
  yield say('',"Hamza inhaled every flower in the field. The field was, briefly, just a field.");
  yield tween(G,{gs:.72},1.2,t=>1-Math.pow(1-t,3)); Sound.sfx('pigroar'); shake(1); impactFrame([[3,2],[1,2]]);
  evaCard(['PHASE II','SECOND BREAKFAST'],1.8,1); yield wait(1.8);
  if(TW.allies.some(a=>a.who==='caotan')) yield say('caotan',"He got BIGGER?! That's not fair, I've been bulking for YEARS!",'angry');
  G.phase=2; G.hp=G.maxHp=HZG_HP[2]; G.inv=false; G.pend=null; G.bag=[]; G.cd=1.2; G.mouth=0; Sound.play('diva');
  yield cineTo([P.x,P.y+8.2,P.z+15],[P.x,P.y,P.z],.7); Cam.cine=null; Game.letterTo=0; P.inv=1; }
function* hzgFinale(){ const G=TW.giant, P=Player, H=Game.hamza, C=TW.allies.find(a=>a.who==='caotan'), O=TW.allies.find(a=>a.who==='omar'); Sound.stop(); Game.letterTo=1; P.inv=99; G.inv=true; G.noBar=1; G.mouth=.4;
  FX.flash=.8; impactFrame([[1,2],[2,2]]); Sound.sfx('crash'); shake(1); cineSet(G.x+3,1.6,G.z+9,G.x,2.8,G.z); yield wait(.6);
  yield say('hamza',"Oink... oink... I'm so... hungry...");
  yield say('shayan',"Hamza... I'll do it. I'll finish it myself. You were my best fr—");
  if(C&&O){ C.x=G.x-4; C.z=G.z+2; O.x=G.x+4; O.z=G.z+2; }
  cineSet(G.x,1,G.z+12,G.x,4,G.z); yield say('caotan',"Stand back, senpai! This calls for our FORBIDDEN TWIN ART!",'angry'); yield say('omar',"We swore never to use it. Mostly because it is embarrassing.");
  twCutin('caotan','FORBIDDEN TWIN ART','BACON BITS','#ff6ab0',1.8); yield wait(1.2);
  if(C){ C.push=.6; C.glintT=.8; Sound.sfx('ting'); twAllyRay(C.x,C.y+1.9,C.z,G.x,G.y+3,G.z,0xbfe4ff); } yield wait(.3);
  if(O){ FX.burst(O.x,O.y+1.4,O.z,30,0x140a1a,4,.4,false); O.x=G.x; O.z=G.z+1.4; Sound.sfx('swing'); FX.arc(G.x,G.y,G.z,0,0,true); FX.cut(G.x,G.y+3,G.z+.5); }
  impactFrame([[3,3],[1,2],[2,2],[3,2]]); Sound.sfx('crossboom'); Sound.sfx('gore'); shake(1.6); FX.hitstop=.12;
  if(gpSprite){ gpSprite.draw((c,cx,by)=>drawGiantPig(c,cx,by,H.f,{t:H.t,mouth:.4,front:0,drip:0,flash:0})); gibsFromSprite(gpSprite,{cols:8,rows:6,n:40}); gpSprite.show(false); }
  for(let i=0;i<160;i++) FX.spawn(G.x+rnd(-1,1),G.y+rnd(.5,5),G.z,rnd(-9,9),rnd(-1,9),rnd(-4,4),rnd(.6,1.4),[0x7a000c,0xb0101a,0xffb0c8][i%3],rnd(.3,.6),12,false);
  TW.giant=null; TW.giantRespawn=null; H.mode='hidden'; Game.hamza=null; TW.fight=null; yield wait(1.6);
  twCamP(6.2,1.4); yield say('',"Hamza came apart into a fine pink mist. Somewhere, a breakfast menu lost its favorite customer.");
  yield say('shayan',"...GG, Hamza.");
  yield* twTwinsTurn(); }
function* twTwinsTurn(){ const P=Player, mi=Game.mira; Sound.stop(); Game.letterTo=1; P.inv=99; const C=TW.allies.find(a=>a.who==='caotan'), O=TW.allies.find(a=>a.who==='omar');
  const cx=C?C.x:P.x-2, cz=C?C.z:P.z-2, ox=O?O.x:P.x+2, oz=O?O.z:P.z-2; cineSet((cx+ox)/2,P.y+3,(cz+oz)/2+10.5,(cx+ox)/2,P.y+2,(cz+oz)/2); yield wait(.6);
  yield say('caotan',"So... the pig's dead.");
  yield say('omar',"The Dog Lord is dead.");
  yield say('caotan',"And the main character is... tired. Low HP. Very vulnerable.");
  yield say('omar',"Shayan Saqib. The last thing standing between us... and the throne of Kennel Keep.");
  twCamP(6.2,1.2);
  yield say('shayan',"I KNEW IT. I KNEW having two of you was too good to be true!",'angry');
  yield say('caotan',"Sorry, senpai. It's not personal. It's... a plot twist! ♡",'happy');
  yield say('omar',"Every story needs a betrayal. Ours just needed... two.");
  twClearAllies(); twDuoStart(cx,cz,ox,oz); const D=TW.fight; D.noAttack=true; Game.state='cut';
  for(const T of TW.foes){ T.inv=true; } yield wait(.3); Sound.sfx('charge'); Sound.sfx('drone');
  cineSet(P.x-2,1.4,P.z+6,P.x,1.6,P.z); TW.foes.forEach(T=>{ T.cast=2; T.fire=2; }); yield wait(.7);
  // time stops. someone walks in.
  zwStart(); Sound.sfx('secret'); yield wait(.5); twAddAlly('ali'); const A=TW.allies[TW.allies.length-1]; A.x=P.x+1.6; A.z=P.z+.8; A.y=groundY(A.x,A.z);
  FX.burst(A.x,A.y+1,A.z,40,0xb0182a,5,.35); cineSet(A.x+.8,A.y+1.7,A.z+5.6,A.x,A.y+1.1,A.z); yield wait(.4);
  yield say('ali',"Two on one? Hm.");
  yield say('ali',"Now it's two on two.");
  zwEnd(); twCamP(6.5,.5);
  yield say('shayan',"Who... who ARE you?!",'surprised');
  yield say('ali',"Your rival. You just don't know it yet. Also, I was in the area. I'm always in the area.");
  yield say('caotan',"Is that... the guy who CUT THE MOON?!",'surprised'); yield say('omar',"...Brother. I believe we should have stayed at the gate.");
  if(mi) yield say('mira',"Okay, I don't know who that is, but he has a cool hat. Go get them, boys!",'happy');
  yield* twCoopChoice();
  evaCard(['SHAYAN & ALI','VS THE GATEKEEPER TWINS'],2.4,1); Sound.sfx('slam'); yield wait(2.4); card('Caotan & Omar','Tuesday\'s Children');
  yield cineTo([P.x,P.y+8.2,P.z+15],[P.x,P.y,P.z],.7); TW.foes.forEach(T=>{ T.inv=false; }); D.noAttack=true; D.director=1; Cam.cine=null; Game.letterTo=0; P.inv=1; Game.state='play'; Sound.play('boss'); }
