// bot driver for headless playthroughs
const H=require(process.env.REAL?'./harness_real.js':'./harness.js'); const R=H.run, C=H.ctx;
const errs=[]; C.console={log:(...a)=>console.log(...a),warn:()=>{},error:(...a)=>{ errs.push(a.map(x=>x&&x.stack?x.stack.split('\n').slice(0,3).join(' | '):String(x)).join(' ')); }};
R("console=globalThis.console");
let choices=[]; let god=true, dmgBoost=0, seen=new Set(), log=[];
function step(n){ for(let i=0;i<n;i++){
    R(`(function(){ const d=Game.dlg; if(d){ if(d.type==='choice'){ d.sel=(d.opts.some(o=>/friends/.test(o.t))?1:${'__CH'}); } } if(TW.vn&&TW.vn.opts&&TW.vn.opts.length){ const o=TW.vn.opts.find(o=>o.right); if(o&&o.glint){ Player.x=o.x; Player.z=o.z; } } if(d){ if(d.t>.35){ hit.confirm=true; } }
      if(Game.state==='dead'&&Game.deadT>1.3) hit.confirm=true;
      if(Game.state==='play'&&!Game.dlg){ const P=Player; ${'__GOD'}
        const k=Math.floor(Game.time*1.3)%4; held.left=k===0; held.right=k===1; held.up=k===2; held.down=k===3;
        if(Math.random()<.3) hit.attack=true; held.attack=Math.random()<.4; if(Math.random()<.02) hit.dash=true; if(Math.random()<.03) hit.jump=true; if(Math.random()<.01) hit.block=true;
        if((P.sp||0)>=20&&Math.random()<.01) hit.special=true;
        ${'__DMG'} } })()`.replace('__CH',String(choices.length?choices[0]:0)).replace('__GOD',god?'P.hp=P.maxHp; if(NAT) NAT.ap=NAT.maxAp;':'').replace('__DMG',dmgBoost?`for(const T of TW.foes) if(Math.random()<.05) twHurt(T,${dmgBoost},'test'); if(TW.giant&&Math.random()<.05) hzgHurt(${dmgBoost},'test'); if(Game.boss&&Math.random()<.05) damageBoss(${dmgBoost}); if(typeof NB!=='undefined'&&NB&&NB.alive&&Math.random()<.05) nbDamage(${dmgBoost*6}); if(Game.mech&&Game.mech.boss&&Math.random()<.05) mechDamage(${dmgBoost},0,0,0);`:''));
    // consume a queued choice once it is answered
    const ch=R("Game.dlg&&Game.dlg.type==='choice'?1:0"); if(ch&&choices.length&&!R("Game.dlg.opts.some(o=>/friends/.test(o.t))")) { R("Game.dlg.sel="+choices[0]+"; Game.dlg.t=1; hit.confirm=true;"); H.frames(1); choices.shift(); continue; }
    H.frames(1);
    const s=R("JSON.stringify([Game.state,L&&L.key,TW.fight&&TW.fight.kind,TW.foes.map(T=>T.who+':'+T.phase+(T.state==='lc'?'(LC)':'')+(T.stun>0?'(stun)':'')).join(','),Game.mech?('mech'+(Game.mech.phase)+(Game.mech.d3?'3D':'')):'',Game.boss?('grim'+Game.boss.phase):'',typeof NB!=='undefined'&&NB&&NB.alive?'NB'+NB.phase:'',TW.giant?'giant'+TW.giant.phase:'',TW.allies.map(a=>a.who).join('+')])");
    if(!seen.has(s)){ seen.add(s); log.push(R('Math.round(Game.time)')+'s '+s); }
  } }
module.exports={H,R,C,step,errs,log,setChoices:a=>{choices=a;},setGod:g=>{god=g;},setDmg:d=>{dmgBoost=d;},dump(){ console.log(log.join('\n')); console.log('ERRORS',errs.length); [...new Set(errs)].slice(0,15).forEach(e=>console.log(' !',e)); }};
