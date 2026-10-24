const B=require('./bot2.js'); const R=B.R;
const route=process.env.ROUTE||'shayan', chs=(process.env.CH||'0').split(',').map(Number), maxS=+(process.env.MAXS||400);
if(process.env.SHA) R("SHA.ok=true; SHA.pok=true; SHA.img={width:576}; SHA.pimg={width:168};");
R("Game.state='cut'; newGame();"); B.H.frames(20);
if(route==='ali') R("Game.flags.ali=1; Object.assign(SCR,SCRA);");
R("Game.script=null; Game.dlg=null; run(SCR.twinsGate)");
B.setChoices(chs); B.setDmg(+(process.env.DMG||3));
for(let i=0;i<maxS&&R("Game.state")!=='end';i++) B.step(120);
B.dump(); console.log("final",R("JSON.stringify({st:Game.state,lv:L.key,flags:Game.flags})"),"timeline",R("Object.keys(TWS.done).join(\",\")"));
