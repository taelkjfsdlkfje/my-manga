const B=require('./bot2.js'); const R=B.R, H=B.H;
R("Game.state='cut'; newGame();"); H.frames(20); R("Game.script=null; Game.dlg=null; TWS.all=true;");
R(`run(function*(){ yield* twWarp('sh_duo'); })`); for(let i=0;i<800;i++){ R("if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=(Game.dlg.opts.some(o=>/friends/.test(o.t))?1:0); hit.confirm=true; }"); H.frames(10); if(R("Game.state==='play'&&!Game.script&&TW.fight&&TW.fight.kind==='duo'")) break; }
const f=()=>R("JSON.stringify({st:Game.state,hp:Player.hp,down:Player.mpDown||0,A:(function(){ const A=TW.allies.find(a=>a.who==='ali'); return A?{x:+A.x.toFixed(1),hp:A.hp,cd:A.coopDown||0,rem:!!A.remote}:null; })(),twins:TW.fight?Math.round(TW.fight.C.hp)+'/'+TW.fight.C.maxHp:'-',both:MP.bothDown})");
R("mpStartCoop(); MP.role='host';"); console.log('coop on',f());
const x0=R("TW.allies.find(a=>a.who==='ali').x"); R("MP.in.h={right:true,attack:true}; MP.in.ax=.7; MP.in.ay=.5;"); H.frames(90); R("MP.in.h={};"); console.log('moved', (R("TW.allies.find(a=>a.who==='ali').x")-x0).toFixed(2), f());
R("MP.pq.push('dash','jump','special');"); H.frames(30); console.log('after dash/jump',f());
// Ali down, host revives with 10 attack presses
R("(function(){ const A=TW.allies.find(a=>a.who==='ali'); A.inv=0; twAllyHurt(A,999); Player.x=A.x+1; Player.z=A.z; })()"); console.log('ali down',f());
for(let i=0;i<10;i++){ R("twOnPress('attack')"); H.frames(2); } console.log('after 10 host hits',f());
// host down, Ali revives
R("Player.inv=0; Player.hp=1; hurtPlayer(5,Player.x,Player.z);"); H.frames(5); console.log('host down',f());
R("(function(){ const A=TW.allies.find(a=>a.who==='ali'); A.x=Player.x+1; A.z=Player.z; })()"); for(let i=0;i<10;i++){ R("MP.pq.push('attack')"); H.frames(2); } console.log('after 10 ali hits',f());
// both down, ready
R("Player.inv=0; Player.hp=1; hurtPlayer(5,Player.x,Player.z); (function(){ const A=TW.allies.find(a=>a.who==='ali'); A.inv=0; twAllyHurt(A,999); })()"); H.frames(5); console.log('both down',f());
R("MP.readyH=true;"); H.frames(10); console.log('host ready only',f()); R("mpHostData({t:'ready'})"); H.frames(30); console.log('both ready',f());
// guest leaves mid fight
R("MP.conn={open:true,close(){},send(){}}; mpHostData({t:'leave'})"); H.frames(60); console.log('guest left',f(),'coop',R("TW.coop"),R("MP.on"));
H.frames(600); console.log('later',f());
console.log('errors',B.errs.length,[...new Set(B.errs)].slice(0,5));
