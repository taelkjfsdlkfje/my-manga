// =====================================================================
// PARRY COMBOS for every other boss: Grimmaw, Nathan, Giant Hamza, the duo
// Each has one or two easy single parries already (Grimmaw slash/charge, Hamza chomp, Caotan glint),
// plus at least one string that stuns when you parry every hit.
// =====================================================================
function twComboBroken(x,z,who,line){ Sound.sfx('counter'); Sound.sfx('glass'); shake(.6); FX.hitstop=Math.max(FX.hitstop,.12); impactFrame([[2,1],[1,1]]);
  FX.ring(x,groundY(x,z)+.1,z,'#ffd45a',3.6,.5); twBig('COMBO BROKEN!',{size:54,col:'#ffd45a',y:UH*.3,dur:1.3,sub:'Perfect parry. Punish!'}); if(line) twBark(who,line,true); }
function twComboTick(C,x,z){ C.par++; Game.dmgNums.push({x:Player.x,y:Player.y+3,z:Player.z,n:C.par+' / '+C.n,t:0,big:true,col:C.par>=C.n?'#ffd45a':'#ffffff'}); }

// ---------- Grimmaw: Kennel Rush (3 hits from three sides) ----------
function* grimRush(b){ const sp=b.phase===3?1.25:b.phase===2?1.12:1, C={n:3,par:0};
  twBark('grimmaw',["Kennel Rush! Heel... and DIE!","Sit. Stay. PERISH.","Three bites. Count them, pup."][Math.floor(Math.random()*3)],true);
  for(let i=0;i<3;i++){ const P=Player; bossSmoke(b); b.vanish=1; b.spr.show(false); Sound.sfx('dash'); yield .2/sp;
    const P1=Player, a=i===0?Math.atan2(b.z-P1.z,b.x-P1.x):i===1?(P1.ang||0)+Math.PI:Math.atan2(b.z-P1.z,b.x-P1.x)+Math.PI/2*(Math.random()<.5?1:-1);
    const p=safeNear(P1.x+Math.cos(a)*2.1,P1.z+Math.sin(a)*2.1); b.x=p.x; b.z=p.z; b.y=groundY(b.x,b.z); b.vy=0; b.vanish=0; b.spr.show(true); bossSmoke(b);
    b.ang=Math.atan2(P1.z-b.z,P1.x-b.x); b.anim='windup'; const tell=(i?.36:.5)/sp; FX.line(b.x,b.z,b.ang,3.6,2.6,0xff3050,tell); FX.spawn(b.x,b.y+3.6,b.z,0,0,0,.3,0xffffff,.8,0,true); yield tell;
    const P2=Player, dx=P2.x-b.x, dz=P2.z-b.z, d=Math.hypot(dx,dz); b.anim='slash'; Sound.sfx('swing'); FX.arc(b.x,b.y,b.z,b.ang,i,true); let par=false;
    if(d<3.7&&angDiff(Math.atan2(dz,dx),b.ang)<1.35&&Math.abs(P2.y-b.y)<2.4){ playerHit(3,b.x,b.z,{heavy:true,melee:true,onParry:()=>{ par=true; }}); if(par) twComboTick(C); }
    yield .42; }
  if(C.par>=3){ stagger(b,3.4); twComboBroken(b.x,b.z); twBark('grimmaw',"The Dog Lord... has been... TRAINED?!",true); return; }
  b.anim='idle'; yield .25; }
(function(){ const ub=updateBoss; updateBoss=function(dt){ const b=Game.boss, play=Game.state==='play';
  if(b&&play&&b.state==='idle'&&!b.twg&&b.cd-dt<=0&&b.hp>0&&!b.inv&&!b.vanish&&Math.random()<.3){ b.state='twcombo'; b.st=0; b.twg=grimRush(b); b.tww=0; b.vx=b.vz=0; }
  if(b&&b.state==='twcombo'&&b.twg){ b.vx=b.vz=0; if(play){ b.tww-=dt; let n=0; while(b.twg&&b.tww<=0&&n++<30){ let r; try{ r=b.twg.next(); }catch(e){ console.error('grimRush',e); r={done:true}; }
        if(r.done){ b.twg=null; if(b.state==='twcombo'){ b.state='recover'; b.st=0; } } else b.tww+=r.value||0; } } }
  else if(b&&b.twg&&b.state!=='twcombo'){ b.twg=null; if(b.vanish){ b.vanish=0; b.spr.show(true); } }
  return ub(dt); }; })();

// ---------- Nathan: Quickdraw (easy) and Boost Saber Combo (3 hits) ----------
function* nbStunned(t){ NB.stunned=1; NB.flash=.4; for(let k=0;k<t;k+=.1){ if(Math.random()<.5) FX.spawn(NB.x+rnd(-.6,.6),NB.y+4.2,NB.z,0,1,0,.5,0xffe066,.3,0,true); yield .1; } NB.stunned=0; }
function nbStrike(C){ const P=Player, sa=Math.atan2(P.z-NB.z,P.x-NB.x); FX.arc(NB.x,NB.y,NB.z,sa,1,true); FX.arc(NB.x,NB.y,NB.z,sa+.5,2,true); Sound.sfx('swing'); Sound.sfx('slam'); shake(.3); let par=false;
  if(Math.hypot(P.x-NB.x,P.z-NB.z)<3.3&&Math.abs(P.y-NB.y)<3) playerHit(3,NB.x,NB.z,{melee:true,heavy:true,onParry:()=>{ par=true; }}); if(par&&C) twComboTick(C); return par; }
function* nbQuickdraw(){ const P=Player, a=rnd(0,6.28); nbBoost(P.x+Math.cos(a)*2.2,P.z+Math.sin(a)*2.2); yield .25;
  FX.spawn(NB.x,NB.y+3.6,NB.z,0,0,0,.25,0xffffff,1,0,true); Sound.sfx('ting'); yield NB.phase>=3?.24:.3;
  if(nbStrike(null)){ Game.dmgNums.push({x:NB.x,y:NB.y+4.5,z:NB.z,n:'STAGGERED',t:0,col:'#ffd45a'}); yield* nbStunned(1.8); } else yield .35; }
function* nbSaberCombo(){ const C={n:3,par:0}; Voice.bark('nbTaunt'+(1+Math.floor(Math.random()*3)));
  for(let i=0;i<3;i++){ const P=Player, a=i===0?Math.atan2(NB.z-P.z,NB.x-P.x):i===1?Math.atan2(NB.z-P.z,NB.x-P.x)+Math.PI/2:(P.ang||0)+Math.PI;
    nbBoost(P.x+Math.cos(a)*2.3,P.z+Math.sin(a)*2.3); yield .16; const sa=Math.atan2(Player.z-NB.z,Player.x-NB.x), tell=[.48,.36,.32][i]/(NB.phase>=3?1.15:1);
    FX.line(NB.x,NB.z,sa,3.4,2.4,0x3ff4ff,tell); Sound.sfx('charge'); yield tell; nbStrike(C); yield .38; }
  if(C.par>=3){ twComboBroken(NB.x,NB.z); twBark('nathan',"Three for three?! What is your FRAME DATA?!",true); yield* nbStunned(3.4); } else yield .3; }
(function(){ const np=nbPattern; nbPattern=function(k){ if(k==='quickdraw') return nbQuickdraw(); if(k==='saberCombo') return nbSaberCombo(); return np(k); };
  for(const k of [1,2,3,4]) if(NB_POOL[k]) NB_POOL[k].push('quickdraw','saberCombo');
  const nd=nbDamage; nbDamage=function(d,u){ if(NB&&NB.stunned) d*=1.5; return nd(d,u); }; })();

// ---------- Giant Hamza: Snout Combo (headbutt, chomp, tusk spin) ----------
HZG.combo=function*(G,ph){ const C={n:3,par:0}; twBark('hamza',ph>=2?"Big Back Combo! Bismillah... bismillah... BISMILLAH!":"Snout... combo... OINK!",true);
  for(let i=0;i<3;i++){ const P=Player, a=Math.atan2(G.z-P.z,G.x-P.x)+(i===1?.9:i===2?-.9:0), p=twClampXZ(P.x+Math.cos(a)*2.6,P.z+Math.sin(a)*2.6,2);
    G.mv={sx:G.x,sz:G.z,x:p.x,z:p.z,t:0,dur:.28}; Sound.sfx('dash'); yield .3; const tell=[.55,.42,.36][i]/(ph>=2?1.12:1), aa=Math.atan2(Player.z-G.z,Player.x-G.x);
    G.mouth=i===1?1:.4; FX.line(G.x,G.z,aa,3.2,3,0xff3a5a,tell); Sound.sfx(i===1?'pigrumble':'oink'); yield tell;
    Sound.sfx(i===1?'chomp':'slam'); shake(.4); FX.burst(G.x,G.y+1,G.z,20,0xffb0c8,5,.3); let par=false; const P2=Player;
    if(Math.hypot(P2.x-G.x,P2.z-G.z)<3.4&&Math.abs(P2.y-G.y)<2.6){ twHitP(3,G.x,G.z,{heavy:true,melee:true,onParry:()=>{ par=true; }}); if(par) twComboTick(C); }
    G.mouth=0; yield .4; }
  if(C.par>=3){ G.stun=Math.max(G.stun,3.6); twComboBroken(G.x,G.z); twBark('hamza',"...Hamza is sleepy now. Hamza takes a nap. Do not touch Hamza.",true); } else yield .3; };
HZG_POOL[1].push('combo'); HZG_POOL[2].push('combo','combo');

// ---------- the duo: Tag-Team Execution (4 hits alternating twins) ----------
DUO.tagTeam=function*(C,O,ph){ const sp=twSp(C); twBark('caotan',"Tag-team! You take the front, I take the BACK!",true); twBark('omar',"...Please never phrase it like that again.");
  const K={n:4,par:0}; const hitWith=(T,col)=>{ let par=false; const r=twSlash(T,3,2.9,{col,onParry:()=>{ par=true; }}); if(par) twComboTick(K); return r; };
  for(let i=0;i<4;i++){ const T=i%2?C:O, side=['front','opp','back','front'][i], tell=[.5,.42,.36,.34][i]/sp;
    FX.burst(T.x,T.y+1.4,T.z,20,T===O?0x140a1a:0xffb0e0,4,.4,T===C); T.hide=1; Sound.sfx('dash'); yield .16;
    twBlinkTo(T,side,1.6,T===O?0x140a1a:0xffb0e0); T.hide=0; if(T===O) T.scythe=1; const P=Player, a=Math.atan2(P.z-T.z,P.x-T.x);
    FX.line(T.x,T.z,a,2.9,2.6,T===O?0xb06aff:0xff6ab0,tell); if(T===C){ T.push=.3; T.glintT=.3; Sound.sfx('ting'); } yield tell; hitWith(T,T===O?'#b06aff':'#ff9ad8'); yield .4; T.swing=0; T.lockF=0; }
  O.scythe=0; if(K.par>=4){ for(const T of [C,O]){ T.stun=Math.max(T.stun,3.6); T.state='stun'; T.flash=.5; } twComboBroken((C.x+O.x)/2,(C.z+O.z)/2); twBark('omar',"We... practiced that for WEEKS.",true); return; }
  yield .4; };
for(const k of [1,2,3]) DUO_POOL[k].push({duo:'tagTeam'});

// ---------- the duo: one shared health bar ----------
const DUO_SHARED_HP=[0,200,230,260];
(function(){ for(const k of [1,2,3]) DUO_HP[k]=DUO_SHARED_HP[k];
  const ds=twDuoStart; twDuoStart=function(cx,cz,ox,oz){ const F=ds(cx,cz,ox,oz), C=F.C, O=F.O, oh=F.onHurt; F.shared=1;
    F.onHurt=function(T,d){ if(F.shared&&(T===C||T===O)){ const o=T===C?O:C; o.hp=T.hp; if(T.hp<=0&&!o.down){ o.down=1; o.inv=true; o.gen=null; } } return oh.call(F,T,d); };
    return F; };
  const db=twDrawBars; twDrawBars=function(){ const F=TW.fight; if(F&&F.kind==='duo'&&F.shared&&!F.noBar&&F.C&&!F.C.gone){ const C=F.C;
      const T=Object.assign({},C,{title:'Caotan & Omar',sub:['','The Gatekeeper Twins','Sibling Sync',"Tuesday's Children"][F.phase]||'',hp:Math.max(C.hp,F.O.hp)});
      twBarFor(T,(UW-620)/2,UH-52-Game.letter*70,620,true); C.shown=T.shown; return; } return db(); }; })();
