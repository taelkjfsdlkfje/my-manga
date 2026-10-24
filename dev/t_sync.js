// two game instances (host + guest) connected by an in-memory pipe
process.env.REAL='1';
const hp=require.resolve('./harness_real.js');
function inst(){ delete require.cache[hp]; const H=require('./harness_real.js'); const errs=[]; H.ctx.console={log:()=>{},warn:()=>{},error:(...a)=>errs.push(a.map(x=>x&&x.stack?x.stack.split('\n').slice(0,3).join(' | '):String(x)).join(' '))}; H.run("console=globalThis.console"); return {H,R:H.run,errs}; }
const ext=process.argv[2]; const fs=require('fs');
const host=inst(); const guest=inst();
const toG=[], toH=[]; let bytesHG=0, nHG=0;
host.H.ctx.__out=s=>{ toG.push(s); bytesHG+=s.length; nHG++; }; guest.H.ctx.__out=s=>toH.push(s);
const pipe=`MP.conn={open:true,send:m=>__out(JSON.stringify(m)),close(){}};`;
const cnt={}; function pump(){ while(toG.length) guest.R('mpGuestData('+toG.shift()+')'); while(toH.length){ const m=toH.shift(); const t=(m.match(/"t":"(\w+)"/)||[])[1]; cnt[t]=(cnt[t]||0)+1; host.R('mpHostData('+m+')'); } }
// host: get into the duo fight with Ali present
const hR=host.R; hR("Game.state='cut'; newGame();"); host.H.frames(10); hR("Game.script=null; Game.dlg=null; TWS.all=true; run(function*(){ yield* twWarp('sh_duo'); });");
for(let i=0;i<900;i++){ hR("if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=(Game.dlg.opts.some(o=>/friends/.test(o.t))?1:0); hit.confirm=true; } Player.hp=Player.maxHp;"); host.H.frames(10); if(hR("Game.state==='play'&&!Game.script&&TW.fight&&TW.fight.kind==='duo'")) break; }
console.log('host in duo:',hR("TW.fight&&TW.fight.kind"),hR("TW.foes.length"));
// guest boots (title), then the handshake
guest.R("Game.state='cut'; MP.role='guest';"); guest.H.frames(5);
hR(pipe+"MP.role='host'; MP.on=true; mpStartCoop();"); guest.R(pipe+"MP.on=true;");
hR("mpHostData({t:'hello',mode:'sync'})"); pump(); guest.H.frames(2);
console.log('guest init:',guest.R("JSON.stringify([Game.state,L.key,NS.guest,ALI(),Player.hp,Player.maxHp])"));
const g=guest.R, s=()=>JSON.stringify({hState:hR("Game.state"),gState:g("Game.state"),hFoes:hR("TW.foes.filter(t=>!t.gone).map(t=>t.who+':'+Math.round(t.hp)+'@'+t.x.toFixed(1)).join(' ')"),gFoes:g("TW.foes.filter(t=>!t.gone).map(t=>t.who+':'+Math.round(t.hp)+'@'+t.x.toFixed(1)).join(' ')"),
  mirrors:g("NS.objs.size"),hAli:hR("(function(){const A=TW.allies.find(a=>a.who==='ali'); return A?A.x.toFixed(1)+','+A.z.toFixed(1)+' hp'+A.hp:null})()"),gAli:g("Player.x.toFixed(1)+','+Player.z.toFixed(1)+' hp'+Player.hp"),phase:hR("TW.fight&&TW.fight.phase")});
for(let sec=0;sec<(+process.env.SECS||240);sec++){
  for(let f=0;f<60;f+=2){ hR("if(Game.dlg&&Game.dlg.t>.35){ if(Game.dlg.type==='choice') Game.dlg.sel=0; hit.confirm=true; } Player.hp=Player.maxHp; if(Game.state==='play'&&Math.random()<"+(process.env.NOHOST?'0':'.05')+") for(const T of TW.foes) if(!T.gone&&!T.inv) twHurt(T,6,'test');");
    g(`held.right=${(sec%4)<2}; held.left=${(sec%4)>=2}; { const T=TW.foes.find(t=>!t.gone&&t.hp>0); if(T) Player.ang=Math.atan2(T.z-Player.z,T.x-Player.x); } if(Math.random()<.3){ hit.attack=true; press('attack'); release('attack'); }`);
    if(process.env.ULT&&f===0&&(sec===5||sec===25)){ const hp0=hR("TW.foes.filter(t=>!t.gone).map(t=>Math.round(t.hp)).join('/')"); g("Player.sp=20; hit.special=true;"); globalThis.__ult={sec,hp0}; }
    if(process.env.ULT&&globalThis.__ult&&f===30&&sec===globalThis.__ult.sec+0){ console.log('during ult: guest state',g("Game.state"),'guest script',g("!!Game.script"),'host frozen',hR("!!NS.hostUlt"),'ali inv',hR("(TW.allies.find(a=>a.remote)||{}).inv")); }
    if(process.env.ULT&&globalThis.__ult&&f===0&&sec===globalThis.__ult.sec+6){ console.log('ult done: twins',globalThis.__ult.hp0,'->',hR("TW.foes.filter(t=>!t.gone).map(t=>Math.round(t.hp)).join('/')"),'host frozen',hR("!!NS.hostUlt"),'guest state',g("Game.state"),'guest hp',g("Player.hp")); globalThis.__ult=null; }
    host.H.frames(2); guest.H.frames(2); pump(); }
  if(sec%20===0) console.log('t'+sec,s());
  if(g("NS.on===false&&TW.foes.length===0")||hR("Game.state==='end'")) { console.log('ended at',sec); break; } }
console.log('final',s()); console.log('guest->host msg types',JSON.stringify(cnt),'host mirrors of guest objects',hR('NS.objs.size')); console.log('host->guest msgs',nHG,'avg bytes',Math.round(bytesHG/Math.max(1,nHG)));
console.log('host errors',host.errs.length,[...new Set(host.errs)].slice(0,5)); console.log('guest errors',guest.errs.length,[...new Set(guest.errs)].slice(0,5));
