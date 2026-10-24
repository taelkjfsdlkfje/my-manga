// ---------- small glue ----------
function twClampPlayer(){ const F=TW.fight; if(!F||!F.lock) return; const P=Player, A=F.lock; P.x=clamp(P.x,A.x0+.6,A.x1-.6); P.z=clamp(P.z,A.z0+.6,A.z1-.6); P.y=groundY(P.x,P.z); }
(function(){ const a=twStartSolo; twStartSolo=function(w,o){ const T=a(w,o); twClampPlayer(); return T; };
  const b=hzgStart; hzgStart=function(){ b(); twClampPlayer(); };
  const c=twDuoStart; twDuoStart=function(...x){ const F=c(...x); twClampPlayer(); return F; }; })();
// a secret ending card for the "other way" route
(function(){ const de=drawEnd; drawEnd=function(){ if(Game.ending!==5) return de();
  Game.endT+=1/60; const a=Math.min(1,Game.endT/2); D.fillStyle='#05050c'; D.fillRect(0,0,UW,UH);
  for(const [x,y,b] of STARS2){ D.fillStyle=`rgba(255,220,240,${(.3+.6*b)*a})`; D.fillRect(x,y,2,2); } D.fillStyle=`rgba(255,200,230,${a})`; D.beginPath(); D.arc(UW/2,150,46,0,7); D.fill();
  D.globalAlpha=a; const mins=Math.floor(Game.time/60), secs=Math.floor(Game.time%60);
  cText([['Secret Ending',`italic 500 22px ${FB}`,'#b8a888',260],['The Other Way',`900 50px ${FD}`,'#ffd0ec',318],["Twins befriended  2   ·   Twins betrayed by  2   ·   Pigs that tried to eat you  1",`700 21px ${FB}`,'#ff9ab0',380],
    [`Time  ${mins}:${String(secs).padStart(2,'0')}    ·    Falls  ${Game.deaths}`,`500 20px ${FB}`,'#cfc6b0',414],['Thank you for playing The Moonsinger\'s Bell.',`italic 500 22px ${FB}`,'#e9e2cf',480]]);
  if(Game.endT>3){ D.globalAlpha=.6+.4*Math.sin(performance.now()/300); cText([[IS_TOUCH()?'Tap to return to the title':'Click or press E to return to the title',`700 22px ${FB}`,'#fff4d6',560]]); } D.globalAlpha=1; }; })();
