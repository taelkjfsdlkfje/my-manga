const B=require('./bot2.js'); const R=B.R, H=B.H;
const ids=JSON.parse(R("JSON.stringify(TL.filter(n=>!n.root).map(n=>n.id))"));
R("Game.state='cut'; newGame();"); H.frames(20); B.setDmg(0);
for(const id of ids){ const e0=B.errs.length; R(`Game.script=null; Game.dlg=null; Game.wait=null; TWS.all=true; run(function*(){ yield* twWarp('${id}'); })`);
  let got=''; for(let i=0;i<60;i++){ B.step(60); const s=R("JSON.stringify([Game.state,L.key,TW.fight&&TW.fight.kind,TW.foes.map(T=>T.who).join('+'),Game.boss?'grim':'',typeof NB!=='undefined'&&NB&&NB.alive?'NB':'',Game.mech?'mech':'',TW.giant?'giant':'',PF&&PF.started?'PAUL':'',TW.allies.map(a=>a.who).join('+')])"); got=s; if(R("Game.state==='play'&&(!!TW.fight||!!Game.boss||(typeof NB!=='undefined'&&NB&&NB.alive)||(Game.mech&&Game.mech.st==='fight')||!!TW.giant||(PF&&PF.started))")) break; }
  console.log(id.padEnd(16),got,'errs',B.errs.length-e0); }
console.log('total errors',B.errs.length,[...new Set(B.errs)].slice(0,5));
