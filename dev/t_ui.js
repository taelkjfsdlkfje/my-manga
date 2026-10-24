const B=require('./bot2.js'); const R=B.R, H=B.H;
R("Game.state='cut'; newGame();"); H.frames(20);
R("Game.script=null; Game.dlg=null; TWS.done={sh_twins:1,sh_dec:1}; run(SCR.paul)");
for(let i=0;i<20;i++){ R("if(Game.dlg&&Game.dlg.t>.35) hit.confirm=true"); H.frames(20); if(R("TLM.open")) break; }
console.log('menu open',R("TLM.open"),'tab',R("TLM.tab"),'sel',R("TLM.sel"));
R("for(const n of TL) twArt(n.id); tlMove(1,0); tlMove(0,1); tlTab(1); tlTab(2); tlTab(0);"); H.frames(30);
console.log('locked node activation:'); R("tlActivate('node:sh_omar'); tlActivate('node:sh_omar');"); console.log(' still open',R("TLM.open"));
R("tlActivate('node:sh_dec'); tlActivate('node:sh_dec');"); console.log(' after warp click open=',R("TLM.open"));
for(let i=0;i<40;i++){ R("if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=2; hit.confirm=true; }"); H.frames(30); }
console.log('state',R("JSON.stringify([Game.state,L.key,Game.flags.twinAlly,TW.allies.map(a=>a.who)])"));
console.log('allDone',R("twAllDone()"),'toggle',R("twToggleAll()"),R("twAllDone()"));
console.log('errors',B.errs.length,[...new Set(B.errs)].slice(0,5));
