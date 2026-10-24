const B=require('./bot2.js'); const R=B.R, H=B.H; const PARRY=process.env.PARRY==='1';
R("Game.state='cut'; newGame();"); H.frames(20); R("Game.script=null; Game.dlg=null; TWS.all=true;");
function warp(id){ R(`run(function*(){ yield* twWarp('${id}'); })`); for(let i=0;i<400;i++){ R("if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=(Game.dlg.opts.some(o=>/friends/.test(o.t))?1:0); hit.confirm=true; }"); H.frames(15); if(R("Game.state==='play'&&!Game.script")) break; } }
function drive(sec){ for(let i=0;i<sec*60;i++){ R(`(function(){ const P=Player; if(P.hp<3) P.hp=P.maxHp; ${PARRY?"P.atkPressT=Game.time; P.hurt=0; if(P.inv>0&&P.inv<.3) P.inv=0;":""} if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=0; hit.confirm=true; } })()`); H.frames(1); } }
const out=[];
// twin solo fights
for(const [id,who,list] of [['sh_cao_f','caotan',['glint1','glint2','tsun','letters','lc2']],['sh_omar_f','omar',['blinkcut','reap']]]){
  warp(id); for(const k of list){ R(`(function(){ const T=TW.foes.find(t=>t.who==='${who}'); if(!T) return; T.stun=0; T.hp=Math.max(T.hp,T.maxHp*.8); T.inv=false; T.gen=TWK.${who}.${k}(T,Math.max(2,T.phase)); T.wait=0; T.state='atk'; globalThis.__st=0; })()`);
    let stunned=0; for(let s=0;s<14&&R(`!!(TW.foes.find(t=>t.who==='${who}')||{}).gen`);s++){ drive(.5); if(R(`(TW.foes.find(t=>t.who==='${who}')||{}).stun>2`)) stunned=1; }
    out.push(`${who}.${k}: stunned=${stunned} ${R("Game.state")}`); drive(1.5); } }
// duo tag team
warp('sh_duo'); for(let s=0;s<30&&R("!(TW.fight&&TW.fight.kind==='duo'&&Game.state==='play')");s++) drive(1);
R("(function(){ const F=TW.fight; F.busy=1; F.C.gen=DUO.tagTeam(F.C,F.O,1); F.C.wait=0; F.O.gen=twWaitFor(F.C)(); F.O.wait=0; })()"); let st=0; for(let s=0;s<14;s++){ drive(.5); if(R("TW.fight&&TW.fight.C.stun>2")) st=1; } out.push('duo.tagTeam stunned='+st+' shared hp '+R("TW.fight?[TW.fight.C.hp,TW.fight.O.hp].join('/'):'-'"));
R("(function(){ const F=TW.fight; twHurt(F.C,5,'test'); })()"); out.push('after hitting Caotan for 5: '+R("TW.fight?[TW.fight.C.hp,TW.fight.O.hp].join('/'):'-'"));
// grimmaw rush
warp('sh_cao_g'); for(let s=0;s<20&&!R("!!Game.boss&&Game.state==='play'");s++) drive(1);
R("(function(){ const b=Game.boss; if(!b) return; b.state='twcombo'; b.st=0; b.twg=grimRush(b); b.tww=0; })()"); st=0; for(let s=0;s<12;s++){ drive(.5); if(R("Game.boss&&Game.boss.state==='stagger'&&Game.boss.stagT>3")) st=1; } out.push('grimmaw.rush stagger='+st);
// nathan
warp('sh_nathan'); for(let s=0;s<30&&!R("typeof NB!=='undefined'&&NB&&NB.alive&&!NB.inv&&Game.state==='play'");s++) drive(1);
R("NB.gen=nbSaberCombo(); NB.wait=0;"); st=0; for(let s=0;s<12;s++){ drive(.5); if(R("NB&&NB.stunned")) st=1; } out.push('nathan.saberCombo stunned='+st);
R("NB.gen=nbQuickdraw(); NB.wait=0;"); st=0; for(let s=0;s<8;s++){ drive(.5); if(R("NB&&NB.stunned")) st=1; } out.push('nathan.quickdraw stunned='+st);
// giant hamza
warp('sh_both_f'); for(let s=0;s<40&&!R("!!TW.giant&&Game.state==='play'&&!Game.script");s++) drive(1);
R("(function(){ const G=TW.giant; if(!G) return; G.gen=HZG.combo(G,1); G.wait=0; })()"); st=0; for(let s=0;s<12;s++){ drive(.5); if(R("TW.giant&&TW.giant.stun>2")) st=1; } out.push('hamza.combo stunned='+st);
console.log(out.join('\n')); console.log('errors',B.errs.length,[...new Set(B.errs)].slice(0,6));
