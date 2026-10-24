// ---------- cleanup: nothing from a cutscene may outlive its scene ----------
(function(){ const dc=darkCrescent; darkCrescent=function(...a){ const c=dc(...a); if(c&&c.g) c.g.userData.temp=1; return c; };
  const td=makeTrueDrill; makeTrueDrill=function(){ const d=td(); if(d&&d.g) d.g.userData.temp=1; return d; };
  const mdr=makeDrill; makeDrill=function(){ const d=mdr(); if(d&&d.g) d.g.userData.temp=1; return d; }; })();
let TW_BASE=scene.children.slice();
function twSweep(full){ scene.children.filter(o=>o.userData&&(o.userData.temp||o.userData.tw)).forEach(o=>scene.remove(o));
  Game.chant=null; Game.skyLight=0; Game.impSeq=null; JC.lines=[]; fxLights.forEach(l=>l.intensity=0);
  if(full&&TW_BASE){ const keep=new Set(TW_BASE); if(L&&L.root) keep.add(L.root); for(const s of SPRITES){ keep.add(s.mesh); keep.add(s.shadow); } for(const b of BOLTS) keep.add(b.m); if(typeof SHIELD!=='undefined'&&SHIELD) keep.add(SHIELD);
    scene.children.filter(o=>!keep.has(o)&&!(o.isLight)&&!(o.isPoints)).forEach(o=>scene.remove(o)); } }
(function(){ const ng=newGame; newGame=function(){ Game.fxUpd=[]; twSweep(true); return ng(); };
  const tt=toTitle; toTitle=function(){ Game.fxUpd=[]; const r=tt(); twSweep(true); if(!TW_BASE) TW_BASE=scene.children.slice(); return r; };
  const rs=respawn; respawn=function(){ Game.fxUpd=[]; twSweep(false); Object.assign(Player,{cineFly:false,cineAnim:null,charge:0}); return rs(); };
  const ll=loadLevel; loadLevel=function(k,o){ twSweep(false); return ll(k,o); }; })();
