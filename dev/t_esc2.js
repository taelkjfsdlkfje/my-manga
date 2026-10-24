const B=require('./bot2.js'); const R=B.R, H=B.H;
R("Game.state='cut'; newGame();"); H.frames(20); R("Game.script=null; Game.dlg=null; Game.state='play'; TWS.done={}; TWS.all=true; TWS.paulDone=0; run(SCR.paul)");
for(let i=0;i<30&&!R("TLM.open");i++){ R("if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=1; hit.confirm=true; }"); H.frames(30); }
console.log('menu',R("TLM.open"),R("TLM.tab"),R("TLM.sel"),R("L.key"));
R("twTimelineClose('paul')"); for(let i=0;i<400&&!R("!!PF&&!!PF.started");i++){ R("if(Game.dlg&&Game.dlg.t>.35){ hit.confirm=true; }"); H.frames(30); }
console.log('paul started',R("!!PF&&!!PF.started"),R("L.key"),R("Game.state"));
console.log('errors',B.errs.length,[...new Set(B.errs)].slice(0,5));
