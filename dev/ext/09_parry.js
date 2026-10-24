// =====================================================================
// PARRY COMBOS: shared helpers for melee strings that stun when fully parried
// =====================================================================
// Pressing attack mid-swing only queues the next swing, so the parry window also counts the raw button press.
(function(){ const up=updatePlayer; updatePlayer=function(dt){ if(hit.attack&&Game.state==='play') Player.atkPressT=Game.time; return up(dt); }; })();
function twParryClock(){ const P=Player; return Math.max(P.swingT!=null?P.swingT:-9,P.atkPressT!=null?P.atkPressT:-9); }

// start a combo on foe T: n strikes, parry all n to stun
function twComboStart(T,n,name){ T.combo={n,par:0,hit:0,name:name||''}; return T.combo; }
function twComboHit(T,dmg,x,z,o){ o=o||{}; const C=T.combo;
  const r=twHitP(dmg,x,z,{melee:true,heavy:o.heavy!==false,onParry:()=>{ if(C){ C.par++; Game.dmgNums.push({x:Player.x,y:Player.y+3,z:Player.z,n:C.par+' / '+C.n,t:0,big:true,col:C.par>=C.n?'#ffd45a':'#ffffff'}); }
    T.flash=.25; const a=Math.atan2(T.z-Player.z,T.x-Player.x); T.x+=Math.cos(a)*.6; T.z+=Math.sin(a)*.6; if(o.onParry) o.onParry(); }});
  if(C&&r==='hit') C.hit++; return r; }
// returns true if every strike was parried (and stuns T)
function twComboEnd(T,stun,line){ const C=T.combo; T.combo=null; if(!C||C.par<C.n) return false;
  T.stun=Math.max(T.stun,stun||3); T.state='stun'; T.flash=.5; T.lockF=0; Sound.sfx('counter'); Sound.sfx('glass'); shake(.6); FX.hitstop=Math.max(FX.hitstop,.12); impactFrame([[2,1],[1,1]]);
  FX.ring(T.x,groundY(T.x,T.z)+.1,T.z,'#ffd45a',3.6,.5); twBig('COMBO BROKEN!',{size:54,col:'#ffd45a',y:UH*.3,dur:1.3,sub:'Perfect parry. Punish!'}); if(line) twBark(T.who,line,true); return true; }

// a melee swing from T toward the player: arc fx + reach check
function twSlash(T,dmg,reach,o){ o=o||{}; const P=Player, a=Math.atan2(P.z-T.z,P.x-T.x), gy=groundY(T.x,T.z); T.lockF=1; T.f=Math.cos(a)>0?1:-1; T.swing=1;
  Sound.sfx('swing'); FX.arc(T.x,gy,T.z,a,o.n||0,true); if(o.col) FX.ring(T.x,gy+.1,T.z,o.col,reach*.8,.2);
  const d=Math.hypot(P.x-T.x,P.z-T.z); if(d<reach&&Math.abs(P.y-gy)<2.4){ if(T.combo) return twComboHit(T,dmg,T.x,T.z,o); return twHitP(dmg,T.x,T.z,{melee:true,heavy:true,onParry:o.onParry}); }
  return 'miss'; }
// blink next to the player (front = between you and where they came from, back = behind your facing)
function twBlinkTo(T,side,dist,col){ const P=Player; let a;
  if(side==='front') a=Math.atan2(T.z-P.z,T.x-P.x); else if(side==='back') a=(P.ang||0)+Math.PI; else if(side==='opp') a=Math.atan2(T.z-P.z,T.x-P.x)+Math.PI; else a=rnd(0,6.28);
  FX.burst(T.x,T.y+1.4,T.z,20,col||0x140a1a,4,.4,false); const p=twClampXZ(P.x+Math.cos(a)*(dist||1.4),P.z+Math.sin(a)*(dist||1.4),.6); T.x=p.x; T.z=p.z; T.y=groundY(p.x,p.z)+T.hy; T.mv=null;
  FX.burst(T.x,T.y+1.4,T.z,24,col||0x140a1a,5,.4,false); Sound.sfx('dash'); }

// glint counters only show for the ×10 attacks
twDrawGlints=function(){ for(const T of TW.foes.concat(TW.allies)){ if(T.gone||T.hide||!T.showN||!(T.glintT>0)||!T.glintN) continue; const [x,y,z]=toScreen(T.x,T.y+3*(T.scale||1),T.z); if(z>1) continue;
    D.save(); D.textAlign='center'; D.font=`900 ${24+T.glintT*20}px ${FB}`; D.lineWidth=5; D.strokeStyle='#1a0e24'; const s='✦×'+T.glintN; D.strokeText(s,x,y); D.fillStyle='#ffffff'; D.fillText(s,x,y); D.restore(); } };
