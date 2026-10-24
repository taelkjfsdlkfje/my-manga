// perfect-ish human bot for the rewritten Paul fight: moves with input keys at normal speed
const B=require('./bot2.js'); const R=B.R, H=B.H; const IDLE=process.env.IDLE==='1', GOD=process.env.GOD==='1';
R("Game.state='cut'; newGame();"); H.frames(20);
if(process.env.ROUTE==='ali') R("Game.flags.ali=1; Object.assign(SCR,SCRA);");
R(`Game.script=null; Game.dlg=null; TW.god=${GOD}; globalThis.__k=[]; const pk=pfKill; pfKill=function(w,wipe){ if(__k.length<40&&!PF.pDown&&!PF.dead) __k.push(Math.round(PF.t)+'s '+(wipe?'[WIPE] ':'')+w); return pk(w,wipe); }; run(twPaulIntro);`);
const BOT=`(function(){ const d=Game.dlg; if(d&&d.t>.35) hit.confirm=true; for(const k of ['left','right','up','down']) held[k]=false;
  if(${IDLE}||Game.state!=='play'||!PF||!PF.started||PF.pDown) return; const P=Player, Pa=PF.paul, me=pfP(); let T=null, punch=null;
  const near=l=>l.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0];
  if(PF.doom&&PF.doom.c) T=PF.doom.c;
  else if(PF.members.find(m=>m.mark==='stack')){ const st=PF.members.find(m=>m.mark==='stack'); T={x:st.x,z:st.z}; }
  else if(me.mark==='spread'){ const ai=pfAI(); const cx=ai.reduce((s,m)=>s+m.x,0)/ai.length, cz=ai.reduce((s,m)=>s+m.z,0)/ai.length, a=Math.atan2(PF_C.z-cz,PF_C.x-cx); T={x:PF_C.x+Math.cos(a)*9,z:PF_C.z+Math.sin(a)*9}; }
  else if(PF.passage){ const p=PF.passage; T={x:p.gx+Math.cos(p.back)*3.5,z:p.gz+Math.sin(p.back)*3.5}; }
  else if(PF.towers){ T=PF.towers[0]; }
  else { const ws=(PF.walls||[]).filter(w=>w.hp>0); if(ws.length&&!ws[0].armed){ const w=near(ws), a=Math.atan2(w.z-Pa.z,w.x-Pa.x), r=Math.hypot(w.x-Pa.x,w.z-Pa.z)+1.9; T={x:Pa.x+Math.cos(a)*r,z:Pa.z+Math.sin(a)*r}; }
    else { const tg=(PF.bugs||[]).filter(b=>b.hp>0).concat(ws.filter(w=>w.armed)); if(tg.length){ punch=near(tg); const a=Math.atan2(P.z-punch.z,P.x-punch.x); T={x:punch.x+Math.cos(a)*1.3,z:punch.z+Math.sin(a)*1.3}; }
      else if(PF.inout==='out'){ const a=Math.atan2(P.z-Pa.z,P.x-Pa.x)||0; T={x:Pa.x+Math.cos(a)*10,z:Pa.z+Math.sin(a)*10}; }
      else if(PF.inout==='in'){ T={x:Pa.x+.9,z:Pa.z+.3}; } } }
  me.isPlayer=false; me.force=T; const s=pfSolve(me); me.force=null; me.isPlayer=true; const dx=s.x-P.x, dz=s.z-P.z;
  if(Math.abs(dx)>.2) held[dx>0?'right':'left']=true; if(Math.abs(dz)>.2) held[dz>0?'down':'up']=true;
  if(pfInHaz(P.x,P.z,0)&&Math.hypot(dx,dz)>1.5&&Math.random()<.08) hit.dash=true;
  if(punch&&Math.hypot(punch.x-P.x,punch.z-P.z)<2.1&&Math.random()<.5) hit.attack=true;
  if(PF.cast&&/Force Push/.test(PF.cast.name)&&PF.cast.t>PF.cast.dur-1.2&&!(P.armsT>0)) hit.block=true;
  if(PF.gazeOn) P.ang=Math.atan2(P.z-Pa.z,P.x-Pa.x); })()`;
let lastPi=-1;
for(let i=0;i<60*600;i++){ R(BOT); H.frames(1);
  if(i%300===0){ const st=R("Game.state"); const pi=R("PF?PF.pi:-1"); if(pi!==lastPi){ lastPi=pi; console.log('t',R("PF?Math.round(PF.t):0"),'phase',pi,'hp',R("PF?PF.hp.toFixed(1):0"),'raises',R("PF?PF.raises:0")); } if(st==='end') break; }
  if(R("Game.state")==='dead'){ console.log('DEAD restart at',R("PF?Math.round(PF.t):0"),R("PF&&PF.why")); R("hit.confirm=true; Game.deadT=5;"); } }
console.log('state',R("Game.state"),'deaths',R("Game.deaths"),'raises',R("PF?PF.raises:'-'"),'\n',R("JSON.stringify(__k,null,1)"),'\nerrors',B.errs.length,[...new Set(B.errs)].slice(0,5));
