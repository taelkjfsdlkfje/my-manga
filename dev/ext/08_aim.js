// ---------- mouse aim: swings, beams and fireballs go toward the cursor ----------
// Active while the mouse was moved in the last 4s or the attack came from a click; otherwise the old auto-aim applies.
const AIM={x:.5,y:.5,t:-1e9,click:-1e9,on:false};
function twAimPt(e){ const r=ui.getBoundingClientRect(); AIM.x=(e.clientX-r.left)/r.width; AIM.y=(e.clientY-r.top)/r.height; AIM.on=true; }
ui.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; twAimPt(e); AIM.t=performance.now(); });
ui.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse') return; twAimPt(e); AIM.t=AIM.click=performance.now(); },true);
try{ ui.style.cursor='crosshair'; }catch(_){}
function twAimAng(){ if(!AIM.on||Game.mech||Game.paulLock||Game.state!=='play') return null; const now=performance.now(); if(now-AIM.t>4000&&now-AIM.click>400) return null;
  const P=Player, v=new THREE.Vector3(AIM.x*2-1,-(AIM.y*2-1),.5).unproject(camera); v.sub(camera.position).normalize(); if(Math.abs(v.y)<1e-4) return null;
  const t=((P.y+1)-camera.position.y)/v.y; if(!(t>0)) return null; const gx=camera.position.x+v.x*t, gz=camera.position.z+v.z*t; if(Math.hypot(gx-P.x,gz-P.z)<.3) return null; return Math.atan2(gz-P.z,gx-P.x); }
function twAimed(fn,snapR){ return function(){ const a0=twAimAng(); if(a0==null) return fn.apply(this,arguments); const P=Player, nf=nearestFoe; let a=a0;
    const tg=nf(snapR); if(tg){ const ta=Math.atan2(tg.z-P.z,tg.x-P.x); if(angDiff(ta,a0)<.55) a=ta; } // small aim assist toward a foe near the cursor
    P.ang=a; P.f=Math.cos(a)>=0?1:-1; nearestFoe=function(){ return null; }; try{ return fn.apply(this,arguments); } finally{ nearestFoe=nf; } }; }
(function(){ startAtk=twAimed(startAtk,3.2); fireBeam=twAimed(fireBeam,14); twFireball=twAimed(twFireball,18); aliGetsuga=twAimed(aliGetsuga,14); })();
