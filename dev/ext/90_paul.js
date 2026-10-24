// =====================================================================
// THE NAVEL (PAUL EXTREME): a Titan Extreme recreation with Paul as the boss.
// Seven AI party members do every mechanic perfectly; the player only has to
// survive. One mistake is death, and death restarts the whole fight.
// =====================================================================
LOOKS.paul={hemi:[0x6a5aa8,0x100818,.7],sun:[0xc8b8ff,.85,[-6,16,-8]],fog:[0x06030e,60,260],exp:1.12,bloom:[1.1,.6,.6],tint:[.98,.96,1.1],sat:1.05,sky:['#000000','#0a0420','#1a0a3a'],sunDir:[0,.4,-1],sunCol:'#a08aff',sunSize:2000};
const PF_C={x:40,z:40}, PF_R0=17;
function pfCodeTex(){ return twTex('pfcode',256,256,c=>{ c.fillStyle='#16141e'; c.fillRect(0,0,256,256); for(let r=0;r<128;r+=8){ c.strokeStyle=`rgba(90,255,150,${.06+(r%32===0?.1:0)})`; c.beginPath(); c.arc(128,128,r,0,7); c.stroke(); }
  for(let i=0;i<24;i++){ const a=i/24*6.283; c.strokeStyle='rgba(90,255,150,.08)'; c.beginPath(); c.moveTo(128,128); c.lineTo(128+Math.cos(a)*128,128+Math.sin(a)*128); c.stroke(); }
  c.font='8px monospace'; for(let i=0;i<220;i++){ c.fillStyle=`rgba(${hash(i,4)>.8?'255,80,120':'90,255,150'},${.12+hash(i,6)*.25})`; c.fillText(['0','1','{','}','=>','if','NaN','//','Paul','TODO'][Math.floor(hash(i,2)*10)],hash(i,1)*256,hash(1,i)*256); } },false); }
LEVELDEF.paul=function(){ const G=newGrid(80,80,'flowers'); G.tx=makeTileTextures('flowers'); Object.assign(G,{key:'paul',look:'paul',music:null,name:'',sub:'',spawn:[PF_C.x,PF_C.z+8],bottom:-60});
  for(let z=0;z<80;z++) for(let x=0;x<80;x++) G.H[z][x]=Math.hypot(x+.5-PF_C.x,z+.5-PF_C.z)<=PF_R0?0:-99;
  G.root.add(skyDome(LOOKS.paul.sky,LOOKS.paul.sunDir,LOOKS.paul.sunCol,LOOKS.paul.sunSize)); stars(G,2200,0xb0a0ff,1.4); stars(G,400,0x7affb0,2.2);
  const tx=pfCodeTex(); tx.magFilter=THREE.LinearFilter;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(PF_R0,PF_R0-1.2,2.4,72),[new THREE.MeshLambertMaterial({color:0x2a2440,emissive:0x0a0818}),new THREE.MeshLambertMaterial({map:tx,emissive:0x101018,emissiveMap:tx}),new THREE.MeshLambertMaterial({color:0x14101e})]);
  disc.position.set(PF_C.x,-1.2,PF_C.z); disc.receiveShadow=true; G.root.add(disc);
  const edge=new THREE.Mesh(new THREE.RingGeometry(PF_R0-.25,PF_R0,96),new THREE.MeshBasicMaterial({color:0x7affb0,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); edge.rotation.x=-Math.PI/2; edge.position.set(PF_C.x,.03,PF_C.z); G.root.add(edge);
  // the void underneath: a falling ring of broken code
  for(let i=0;i<40;i++){ const a=hash(i,3)*6.283, r=PF_R0+4+hash(3,i)*30, s=.6+hash(i,7)*2, m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),new THREE.MeshBasicMaterial({color:hash(i,9)>.7?0xff3a6a:0x3a2a6a,transparent:true,opacity:.7})); m.position.set(PF_C.x+Math.cos(a)*r,-4-hash(i,5)*20,PF_C.z+Math.sin(a)*r); m.rotation.set(hash(i,1)*3,hash(i,2)*3,0); G.root.add(m); }
  G.disc=disc; G.edge=edge; G.R=PF_R0; G.spots={paul:{x:PF_C.x,z:PF_C.z-2}};
  G.anim.push(dt=>{ if(Math.random()<.7) FX.spawn(PF_C.x+rnd(-30,30),rnd(6,16),PF_C.z+rnd(-30,10),0,-rnd(3,6),0,rnd(1.5,3),Math.random()<.85?0x5aff9a:0xff3a6a,rnd(.15,.3),0,true); edge.material.opacity=.6+.3*Math.sin(performance.now()/300); });
  return G; };
function pfSetRadius(R){ const G=L; G.R=R; for(let z=0;z<80;z++) for(let x=0;x<80;x++) G.H[z][x]=Math.hypot(x+.5-PF_C.x,z+.5-PF_C.z)<=R?0:-99;
  const s=R/PF_R0; G.disc.scale.set(s,1,s); G.edge.scale.set(s,s,1); }

// ---------- the party ----------
const PF_ROLE={grimmaw:'tank',nathan:'tank',mira:'healer',hamza:'healer',shayan:'dps',ali:'dps',caotan:'dps',omar:'dps'};
const PF_NAME={grimmaw:'Grimmaw',nathan:'Nathan',mira:'Mira',hamza:'Hamza',shayan:'Shayan',ali:'Ali',caotan:'Caotan',omar:'Omar'};
const PF_JOB={grimmaw:'PLD',nathan:'GNB',mira:'WHM',hamza:'AST',shayan:'MNK',ali:'SAM',caotan:'DNC',omar:'RPR'};
let PF=null;
function pfMember(id){ const isP=id===HERO(), m={id,role:PF_ROLE[id],name:PF_NAME[id],x:PF_C.x,z:PF_C.z+6,y:0,vx:0,vz:0,hp:1,maxHp:1,shown:1,f:1,t:rnd(0,3),isPlayer:isP,spr:null,gaol:0,mark:0,hitT:rnd(0,1),anim:'idle',tx:PF_C.x,tz:PF_C.z+6,vuln:0};
  m.maxHp=m.role==='tank'?118000:m.role==='healer'?78000:84000; m.hp=m.maxHp; return m; }
function pfP(){ return PF&&PF.members.find(m=>m.isPlayer); }
function pfMembers(){ return PF?PF.members:[]; }
function pfTank(){ return PF.members.find(m=>m.id===PF.mt); }
function pfOT(){ return PF.members.find(m=>m.role==='tank'&&m.id!==PF.mt); }
// ---------- hazards: FF14-style ground telegraphs ----------
const PF_ORANGE=0xff7a1a;
function pfMesh(geo,col,op){ const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; m.userData.tw=1; scene.add(m); return m; }
function pfCircle(x,z,r,warn,name,o){ o=o||{}; const fill=pfMesh(new THREE.CircleGeometry(r,48),o.col||PF_ORANGE,.22), edge=pfMesh(new THREE.RingGeometry(r*.94,r,64),0xffc070,.9), grow=pfMesh(new THREE.CircleGeometry(r,48),o.col||PF_ORANGE,.25);
  const h={kind:'circle',x,z,r,warn,t:0,name,live:true}; fill.position.set(x,.06,z); edge.position.set(x,.07,z); grow.position.set(x,.065,z); PF.haz.push(h);
  h.upd=(dt)=>{ h.t+=dt; const u=Math.min(1,h.t/warn); grow.scale.setScalar(Math.max(.01,u)); edge.material.opacity=.6+.4*Math.sin(h.t*12);
    if(h.t>=warn&&!h.done){ h.done=1; pfResolve(h,m=>Math.hypot(m.x-x,m.z-z)<r); if(o.onBoom) o.onBoom(); FX.burst(x,.3,z,o.n||30,o.burst||0xffa050,6,.35); FX.ring(x,.1,z,'#ffc070',r*1.2,.4); if(!o.quiet){ Sound.sfx(o.sfx||'slam'); shake(.25); } }
    if(h.t>warn+.15){ h.live=false; [fill,edge,grow].forEach(q=>scene.remove(q)); } };
  h.kill=()=>[fill,edge,grow].forEach(q=>scene.remove(q)); return h; }
function pfLine(x,z,ang,len,w,warn,name,o){ o=o||{}; const geo=new THREE.PlaneGeometry(len,w); geo.translate(len/2,0,0); const fill=pfMesh(geo,PF_ORANGE,.24); const g2=new THREE.PlaneGeometry(len,w); g2.translate(len/2,0,0); const grow=pfMesh(g2,PF_ORANGE,.28);
  for(const q of [fill,grow]){ q.position.set(x,.06,z); q.rotation.z=-ang; } const h={kind:'line',x,z,ang,len,w,warn,t:0,name,live:true}; PF.haz.push(h);
  h.upd=(dt)=>{ h.t+=dt; const u=Math.min(1,h.t/warn); grow.scale.set(Math.max(.01,u),1,1);
    if(h.t>=warn&&!h.done){ h.done=1; const ux=Math.cos(ang), uz=Math.sin(ang); pfResolve(h,m=>{ const px=m.x-x, pz=m.z-z, al=px*ux+pz*uz, pe=Math.abs(px*uz-pz*ux); return al>-.5&&al<len&&pe<w/2; },o.kb?{ang}:null);
      for(let i=0;i<20;i++){ const d=rnd(0,len); FX.burst(x+ux*d,.3,z+uz*d,3,0xd8b880,5,.35,false); } Sound.sfx('crash'); shake(.5); }
    if(h.t>warn+.15){ h.live=false; scene.remove(fill); scene.remove(grow); } };
  h.kill=()=>{ scene.remove(fill); scene.remove(grow); }; return h; }
function pfInHaz(x,z,margin){ margin=margin||0; for(const h of PF.haz){ if(!h.live||h.done) continue;
    if(h.kind==='circle'&&Math.hypot(x-h.x,z-h.z)<h.r+margin) return true;
    if(h.kind==='line'){ const ux=Math.cos(h.ang), uz=Math.sin(h.ang), px=x-h.x, pz=z-h.z, al=px*ux+pz*uz, pe=Math.abs(px*uz-pz*ux); if(al>-.5-margin&&al<h.len+margin&&pe<h.w/2+margin) return true; }
    if(h.kind==='edge'&&Math.hypot(x-PF_C.x,z-PF_C.z)>h.r-margin) return true; }
  return false; }
// who got hit: the player dies, AI members (who never get hit unless something is very wrong) just take damage
function pfResolve(h,test){ for(const m of PF.members){ if(!test(m)) continue; if(m.isPlayer){ if(Player.inv>0&&Player.dash>0) continue; pfKill('You were hit by '+h.name+'.'); } else pfDmg(m,m.maxHp*.5,true); } }
function pfKill(why){ if(!PF||PF.dead) return; if(TW.god){ Game.dmgNums.push({x:Player.x,y:Player.y+2.4,z:Player.z,n:'GOD MODE',t:0,col:'#7affb0'}); return; }
  PF.dead=1; PF.why=why; Player.hp=0; Sound.sfx('shatter'); FX.burst(Player.x,Player.y+1,Player.z,40,0xff4a5a,7,.35); Game.onDeath(); }
function pfDmg(m,d,show){ m.hp=Math.max(1,m.hp-d); if(show) Game.dmgNums.push({x:m.x,y:m.y+2.4,z:m.z,n:Math.round(d),t:0,col:'#ff8a6a'}); }
function pfHealAll(f){ for(const m of PF.members) m.hp=Math.min(m.maxHp,m.hp+m.maxHp*f); }
function pfLog(s){ PF.log.push({s,t:0}); if(PF.log.length>6) PF.log.shift(); }
function pfGlitch(s){ const g='#@$%&*!?01'; return s.split('').map(ch=>Math.random()<.04&&ch!==' '?g[Math.floor(Math.random()*g.length)]:ch).join(''); }
function* pfCast(name,dur){ PF.cast={name,t:0,dur}; pfLog('Paul readies '+name+'.'); grade.uniforms.ab.value=.6; while(PF.cast&&PF.cast.t<dur) yield .05; PF.cast=null; impactFrame([[2,1]]); }

// ---------- starting the fight ----------
function pfStart(){ twEndFight(); twClearAllies(); TW.giant=null; Game.boss=null; Game.bossBar=0; if(Game.zw) zwEnd();
  const aff=Game.aff, fl=Game.flags; loadLevel('paul',{keepHP:1}); Game.aff=aff; Game.flags=fl; Game.hamza=null; Game.mira=null; if(hSprite) hSprite.show(false); if(mSprite) mSprite.show(false);
  const ids=['grimmaw','nathan','mira','hamza','shayan','ali','caotan','omar']; PF={members:ids.map(pfMember),haz:[],log:[],t:0,hp:100,floor:100,rate:0,mt:'grimmaw',paul:{x:PF_C.x,z:PF_C.z-1,y:0,ang:Math.PI/2,away:0,spr:null,ghosts:null,f:1,t:0,hy:0},
    cast:null,gen:null,wait:0,gaols:[],bombs:[],heart:null,kb:null,dead:0,started:0,lb:0,enrage:0};
  const ring=ids.length; PF.members.forEach((m,i)=>{ const a=Math.PI/2+(i-ring/2)*.38; m.x=PF_C.x+Math.cos(a)*7; m.z=PF_C.z+Math.sin(a)*7; m.tx=m.x; m.tz=m.z; });
  const me=pfP(); resetPlayer({x:me.x,z:me.z},true); Player.maxHp=12; Player.hp=12; Player.sp=0; Player.counter=0; Game.paulLock=true; Game.arena=null; Cam.zoom=1.25; Cam.focus=null; TW.paulFight=PF; }
function pfRestart(){ Game.fxUpd=[]; twSweep(false); pfStart(); Game.state='play'; Game.fade=1; Game.fadeTo=0; Game.letterTo=0; Cam.cine=null; Sound.play('seraph'); PF.started=1; PF.gen=pfTimeline(); PF.wait=2.5;
  Game.banner={name:'The Navel (Paul Extreme)',sub:'Restarted from the top. No checkpoints. Paul is laughing.',t:0,small:1}; }
(function(){ const rs=respawn; respawn=function(){ if(TW.paulFight&&L&&L.key==='paul'&&!TW.paulWon){ Game.state='play'; pfRestart(); return; } return rs(); };
  const us=unstuck; unstuck=function(){ if(TW.paulFight&&L&&L.key==='paul'&&!TW.paulWon){ Voice.stop(); Object.assign(Game,{script:null,wait:null,dlg:null,timeScale:1,slowT:0,evaCard:null,card:null,banner:null}); pfRestart(); return; } return us(); }; })();

// ---------- player: move, jump, dash, and a sad little punch ----------
(function(){ const up=updatePlayer; updatePlayer=function(dt){ if(Game.paulLock) return pfPlayer(dt); return up(dt); }; })();
function pfPlayer(dt){ const P=Player, ctl=Game.state==='play'&&!Game.dlg; P.t+=dt; if(P.hidden){ P.vx=P.vy=P.vz=0; return; } P.inv=Math.max(0,P.inv-dt); P.dashCd-=dt; P.punchT=Math.max(0,(P.punchT||0)-dt);
  let [mx,mz]=ctl&&!P.gaoled?inputVec():[0,0]; if(P.scripted){ mx=P.scripted.x/4.8; mz=P.scripted.z/4.8; }
  if(PF&&PF.kb&&PF.kb.t>0){ PF.kb.t-=dt; P.vx=PF.kb.vx; P.vz=PF.kb.vz; if(PF.kb.t<=0){ PF.kb=null; P.vx=P.vz=0; } }
  else if(ctl&&!P.gaoled&&consume('dash')&&P.dashCd<=0){ if(mx||mz) P.ang=Math.atan2(mz,mx); P.dash=.18; P.dashCd=.5; Sound.sfx('dash'); }
  if(P.dash>0&&!(PF&&PF.kb&&PF.kb.t>0)){ P.dash-=dt; P.vx=Math.cos(P.ang)*14; P.vz=Math.sin(P.ang)*14; FX.spawn(P.x,P.y+.8,P.z,0,0,0,.25,0x8fd3ff,.3,0,true); }
  else if(!(PF&&PF.kb&&PF.kb.t>0)){ const sp=P.gaoled?0:4.8, acc=P.onGround?36:20; P.vx+=clamp(mx*sp-P.vx,-acc*dt,acc*dt); P.vz+=clamp(mz*sp-P.vz,-acc*dt,acc*dt); if(mx||mz) P.ang=Math.atan2(mz,mx);
    if(ctl&&!P.gaoled&&consume('jump')){ if(P.onGround){ P.vy=8.2; P.onGround=false; P.jumps=1; Sound.sfx('jump'); } else if(P.jumps>0){ P.vy=7.4; P.jumps=0; Sound.sfx('djump'); } } }
  P.vy-=G_ACC*dt; P.vy=Math.max(P.vy,-22);
  if(ctl&&!P.gaoled&&consume('attack')&&P.punchT<=0){ P.punchT=.28; pfPunch(); }
  consume('block'); consume('special');
  moveBody(P,dt,.42); if(P.onGround) P.jumps=1;
  if(Math.cos(P.ang)>.2) P.f=1; else if(Math.cos(P.ang)<-.2) P.f=-1;
  P.anim=P.dash>0?'dash':!P.onGround?(P.vy>0?'jump':'fall'):Math.hypot(P.vx,P.vz)>.6?'run':'idle';
  if(PF&&!PF.dead&&Game.state==='play'&&P.y<-2.5){ if(TW.god){ P.x=PF_C.x; P.z=PF_C.z+3; P.y=0; P.vy=0; P.vx=P.vz=0; } else pfKill('You fell off the platform. Gravity is still enabled.'); } }
function pfPunch(){ const P=Player; Sound.sfx('punch'); const fx=P.x+Math.cos(P.ang)*.9, fz=P.z+Math.sin(P.ang)*.9; FX.burst(fx,P.y+1.1,fz,6,0xfff0d0,2.5,.18); P.beamPose=.1;
  const tg=pfPunchTarget(); if(!tg) return; tg.hit(1); FX.spark(tg.x,1.2,tg.z); Game.dmgNums.push({x:tg.x,y:2.6,z:tg.z,n:1,t:0,col:'#fff4c0'}); if(TW.otk&&(tg.paul||tg.heart)) pfSkipPhase(); }
function pfPunchTarget(){ const P=Player, near=(o,r)=>Math.hypot(o.x-P.x,o.z-P.z)<r;
  for(const g of PF.gaols) if(g.hp>0&&!g.m.isPlayer&&near(g.m,1.8)) return {x:g.m.x,z:g.m.z,hit:d=>pfHitGaol(g,d)};
  if(PF.heart&&PF.heart.hp>0&&near(PF.heart,2.4)) return {x:PF.heart.x,z:PF.heart.z,heart:1,hit:d=>{ PF.heart.hp-=d; }};
  const Pa=PF.paul; if(!Pa.away&&near(Pa,2.6)) return {x:Pa.x,z:Pa.z,paul:1,hit:d=>{ PF.hp=Math.max(PF.floor,PF.hp-d*.06); }}; return null; }
function pfHitGaol(g,d){ g.hp-=d; FX.burst(g.m.x,1.2,g.m.z,6,0xa08060,3,.25,false); if(g.hp<=0){ g.m.gaol=0; if(g.m.isPlayer) Player.gaoled=false; scene.remove(g.mesh); FX.burst(g.m.x,1,g.m.z,30,0xb09070,6,.4,false); Sound.sfx('crash'); pfLog(g.m.name+' is freed from Granite Gaol.'); } }

// ---------- AI: a solver that always finds the safe spot ----------
function pfHome(m){ const Pa=PF.paul, T=pfTank(), fa=T?Math.atan2(T.z-Pa.z,T.x-Pa.x):Math.PI/2, R=L.R-1.6;
  let x,z; if(m.id===PF.mt){ x=Pa.x+Math.cos(fa)*2.6; z=Pa.z+Math.sin(fa)*2.6; }
  else if(m.role==='tank'){ x=Pa.x+Math.cos(fa+1.3)*3.4; z=Pa.z+Math.sin(fa+1.3)*3.4; }
  else if(m.role==='dps'){ const k=['shayan','ali','caotan','omar'].indexOf(m.id), a=fa+Math.PI+(k-1.5)*.42; x=Pa.x+Math.cos(a)*2.4; z=Pa.z+Math.sin(a)*2.4; }
  else { const a=fa+Math.PI+(m.id==='mira'?-.55:.55); x=Pa.x+Math.cos(a)*7.5; z=Pa.z+Math.sin(a)*7.5; }
  if(PF.heart&&PF.heart.hp>0&&m.role==='dps'){ const H2=PF.heart, k=['shayan','ali','caotan','omar'].indexOf(m.id), a=k*1.57+.6; x=H2.x+Math.cos(a)*2; z=H2.z+Math.sin(a)*2; }
  const reach=q=>Math.hypot(q.m.x-PF_C.x,q.m.z-PF_C.z)<L.R-.5; const g=PF.gaols.find(q=>q.hp>0&&q.on&&!q.m.isPlayer&&m.role==='dps'&&q.m!==m&&reach(q))||PF.gaols.find(q=>q.hp>0&&q.on&&q.m.isPlayer&&m.role==='dps'&&reach(q)); if(g){ const a=Math.atan2(m.z-g.m.z,m.x-g.m.x); x=g.m.x+Math.cos(a)*1.3; z=g.m.z+Math.sin(a)*1.3; }
  if(PF.stack){ const a=(PF.members.indexOf(m)/8)*6.283; x=Pa.x+Math.cos(a)*1.6; z=Pa.z+Math.sin(a)*1.6; }
  const d=Math.hypot(x-PF_C.x,z-PF_C.z); if(d>R){ x=PF_C.x+(x-PF_C.x)/d*R; z=PF_C.z+(z-PF_C.z)/d*R; } return {x,z}; }
function pfSolve(m){ const h=pfHome(m); if(!pfInHaz(h.x,h.z,1.4)) return h; let best=null, bd=1e9; const R=L.R-1.4;
  if(m.safe&&!pfInHaz(m.safe.x,m.safe.z,1.4)&&Math.hypot(m.safe.x-h.x,m.safe.z-h.z)<12) return m.safe;
  for(const cx of [h,m]) for(let ring=1;ring<=10;ring++) for(let k=0;k<20;k++){ const a=k/20*6.283, x=cx.x+Math.cos(a)*ring*1.2, z=cx.z+Math.sin(a)*ring*1.2; if(Math.hypot(x-PF_C.x,z-PF_C.z)>R) continue; if(pfInHaz(x,z,1.4)) continue; const d=Math.hypot(x-m.x,z-m.z)*1.6+Math.hypot(x-h.x,z-h.z)*.4; if(d<bd){ bd=d; best={x,z}; } }
  m.safe=best; return best||h; }
function pfUpdateAI(m,dt){ m.t+=dt; if(m.gaol){ m.anim='idle'; return; } const s=pfSolve(m), dx=s.x-m.x, dz=s.z-m.z, d=Math.hypot(dx,dz), danger=pfInHaz(m.x,m.z,.2), sp=danger?12:6.5; if(danger&&Math.random()<.5) FX.spawn(m.x,.6,m.z,0,0,0,.25,0x8fd3ff,.3,0,true);
  if(d>.08){ const k=Math.min(d,sp*dt)/d; m.x+=dx*k; m.z+=dz*k; m.anim='run'; m.f=dx>0?1:-1; } else { m.anim='idle'; m.f=PF.paul.x>m.x?1:-1; }
  // attacks: DPS punch whatever matters most, healers heal, tanks hit the boss
  m.hitT-=dt; if(m.hitT<=0&&Game.state==='play'){ m.hitT=m.role==='healer'?1.4:rnd(.8,1.1);
    if(m.role==='healer'){ const low=PF.members.slice().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]; if(low.hp<low.maxHp*.98){ const h=Math.round(low.maxHp*rnd(.12,.2)); low.hp=Math.min(low.maxHp,low.hp+h); Game.dmgNums.push({x:low.x,y:low.y+2.6,z:low.z,n:'+'+h,t:0,col:'#7affb0'}); FX.burst(low.x,1.4,low.z,8,0x7affb0,2,.25); } }
    else { const g=PF.gaols.find(q=>q.hp>0&&q.on&&Math.hypot(q.m.x-m.x,q.m.z-m.z)<2.2&&q.m!==m); if(g&&m.role==='dps'){ pfHitGaol(g,1); FX.spark(g.m.x,1.2,g.m.z); }
      else if(PF.heart&&PF.heart.hp>0&&m.role==='dps'&&Math.hypot(PF.heart.x-m.x,PF.heart.z-m.z)<3){ PF.heart.hp-=1.25; FX.spark(PF.heart.x+rnd(-.5,.5),1.6,PF.heart.z); if(Math.random()<.4) Game.dmgNums.push({x:PF.heart.x,y:3,z:PF.heart.z,n:Math.round(rnd(9000,14000)),t:0,col:'#ffe08a'}); }
      else if(!PF.paul.away&&Math.hypot(PF.paul.x-m.x,PF.paul.z-m.z)<3.4){ FX.spark(PF.paul.x+rnd(-.6,.6),1.6+rnd(0,1.2),PF.paul.z); if(Math.random()<.35) Game.dmgNums.push({x:PF.paul.x+rnd(-1,1),y:3.6,z:PF.paul.z,n:Math.round(rnd(14000,32000)),t:0,col:'#ffe08a'}); if(Math.random()<.2) Sound.sfx('punch'); } } } }

// ---------- mechanics ----------
function pfTargets(n,includePlayer){ const pool=PF.members.filter(m=>!m.isPlayer).sort(()=>Math.random()-.5); const out=pool.slice(0,includePlayer?n-1:n); if(includePlayer) out.push(pfP()); return out; }
function* pfWeight(waves,withPlayer){ for(let w=0;w<waves;w++){ const tg=pfTargets(w===waves-1?8:3,withPlayer||w%2===0); for(const m of tg) pfCircle(m.x,m.z,3.2,2.75,'Weight_of_the_Land.json',{quiet:m!==tg[0],onBoom(){ for(let i=0;i<6;i++) FX.spawn(m.x+rnd(-2,2),.2,m.z+rnd(-2,2),0,rnd(5,9),0,.6,0xb09070,.4,12,false); }}); yield 1.45; } yield 1.8; }
function* pfLandslide(extraSide){ const Pa=PF.paul, T=pfTank(), a=Math.atan2(T.z-Pa.z,T.x-Pa.x); for(const k of [0,Math.PI/4,-Math.PI/4,...(extraSide?[Math.PI/2,-Math.PI/2]:[])]) pfLine(Pa.x,Pa.z,a+k,34,4.2,2.6,'Landslide();',{kb:1}); yield* pfCast('Landslide();',2.6); yield .5; }
function* pfBuster(){ const T=pfTank(); T.mark='buster'; yield* pfCast('Mountain Buster (unhandled exception)',2.2); T.mark=0; pfDmg(T,T.maxHp*.72,true); FX.burst(T.x,1.4,T.z,40,0xff6a3a,7,.35); Sound.sfx('crossboom'); shake(.6); T.vuln++;
  pfLog(T.name+' takes '+Math.round(T.maxHp*.72)+' damage. Vulnerability Up.'); yield .8; const O=pfOT(); PF.mt=O.id; Game.dmgNums.push({x:O.x,y:O.y+2.8,z:O.z,n:'PROVOKE',t:0,big:true,col:'#7ab0ff'}); pfLog(O.name+' uses Provoke. Tank swap.'); Sound.sfx('slam'); yield .6; }
function* pfTumult(n){ yield* pfCast('Tumult (infinite loop)',1.6); for(let i=0;i<n;i++){ for(const m of PF.members) pfDmg(m,m.maxHp*.08,i===0); Sound.sfx('slam'); shake(.25); FX.flash=.15; yield .55; } pfHealAll(.25); pfLog('Mira casts Medica II. Hamza oinks supportively.'); yield .5; }
function* pfGeocrush(newR){ const Pa=PF.paul; yield* pfCast('Geocrush --no-verify',1.2); Pa.away=1; Pa.hy=0; const up={t:0}; while(up.t<.6){ up.t+=.05; Pa.hy=up.t*30; yield .05; }
  Pa.x=PF_C.x; Pa.z=PF_C.z; const h=pfCircle(PF_C.x,PF_C.z,L.R*.55,3.2,'Geocrush --no-verify',{burst:0xff8a3a,n:80}); pfLog('Get away from the center!'); yield 2.6; while(Pa.hy>0){ Pa.hy=Math.max(0,Pa.hy-3); yield .03; } Pa.away=0; yield .8; impactFrame([[3,2],[1,1]]); shake(1); for(const m of PF.members) pfDmg(m,m.maxHp*.25,false);
  // the edge crumbles: get back in
  const er={kind:'edge',r:newR,live:true,t:0,upd(){},kill(){}}; PF.haz.push(er); const warn=pfMesh(new THREE.RingGeometry(newR,L.R,96),0xff2a3a,.35); warn.position.set(PF_C.x,.07,PF_C.z); twBig('THE EDGE IS FALLING',{size:46,col:'#ff8a5a',y:UH*.22,dur:1.6}); pfLog('The platform edge destabilizes.');
  yield 3; scene.remove(warn); er.live=false; for(const m of PF.members) if(Math.hypot(m.x-PF_C.x,m.z-PF_C.z)>newR-.3){ if(m.isPlayer) pfKill('You stood on the falling edge.'); }
  pfSetRadius(newR); Sound.sfx('crossboom'); for(let i=0;i<120;i++){ const a=rnd(0,6.28); FX.spawn(PF_C.x+Math.cos(a)*(newR+1),.2,PF_C.z+Math.sin(a)*(newR+1),0,-rnd(2,8),0,1.5,0x6a5a8a,.6,12,false); } shake(.8); yield 1; }
function pfBombs(pattern){ const R=L.R, pts=[]; if(pattern==='plus'){ for(const d of [0,6,11]) for(const a of [0,1,2,3]) if(!(d===0&&a)) pts.push([PF_C.x+Math.cos(a*Math.PI/2)*d,PF_C.z+Math.sin(a*Math.PI/2)*d]); }
  else if(pattern==='ring'){ for(let i=0;i<10;i++){ const a=i/10*6.283; pts.push([PF_C.x+Math.cos(a)*8,PF_C.z+Math.sin(a)*8]); } }
  else if(pattern==='rows'){ for(const zz of [-9,0,9]) for(let x=-12;x<=12;x+=4) pts.push([PF_C.x+x,PF_C.z+zz,3]); }
  else { const side=Math.random()<.5?1:-1; for(let x=1;x<=13;x+=3.5) for(let z=-12;z<=12;z+=3.5) pts.push([PF_C.x+x*side,PF_C.z+z]); }
  const list=pts.filter(([x,z])=>Math.hypot(x-PF_C.x,z-PF_C.z)<R-.5);
  for(const [x,z,br] of list){ const b=new THREE.Mesh(new THREE.DodecahedronGeometry(.9,0),new THREE.MeshLambertMaterial({color:0x6a5a4a,emissive:0x3a0a00,flatShading:true})); b.position.set(x,.8,z); b.userData.tw=1; scene.add(b);
    const h=pfCircle(x,z,br||3.6,5,'Bomb Boulder (memory leak)',{quiet:true,onBoom(){ scene.remove(b); Sound.sfx('crossboom'); FX.burst(x,1,z,30,0xff6a2a,8,.4); }}); const kb=h.kill; h.kill=()=>{ kb(); scene.remove(b); };
    const s={t:0}; twHz({upd(dt){ s.t+=dt; b.scale.setScalar(1+s.t*.12+Math.sin(s.t*12)*.04*s.t); b.material.emissive.setRGB(Math.min(1,s.t/5),.1,0); return s.t<5.1; }, kill(){ scene.remove(b); }}); } }
function* pfGaol(n,withPlayer,delay){ const tg=pfTargets(n,withPlayer).filter(m=>m.role!=='tank'); for(const m of tg) m.mark='gaol'; pfLog('Granite Gaol: undefined targets '+tg.map(m=>m.name).join(', ')+'.'); yield* pfCast('Granite Gaol: undefined',delay||3.4);
  for(const m of tg){ m.mark=0; m.gaol=1; const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.1,2.6,7),new THREE.MeshLambertMaterial({color:0x7a6a5a,flatShading:true})); mesh.position.set(m.x,1.3,m.z); mesh.userData.tw=1; scene.add(mesh);
    PF.gaols.push({m,hp:m.isPlayer?7:6,mesh,on:1,life:9}); if(m.isPlayer){ Player.gaoled=true; Player.vx=Player.vz=0; } Sound.sfx('crash'); } }
function* pfUpheaval(){ PF.stack=1; const Pa=PF.paul; const ring=pfMesh(new THREE.RingGeometry(2.6,2.9,48),0x7affb0,.9); ring.position.set(Pa.x,.08,Pa.z); twBig('STACK ON PAUL',{size:44,col:'#7affb0',y:UH*.22,dur:2}); pfLog('Upheaval: knockback incoming. Stand close to Paul.');
  yield* pfCast('Upheaval --force',4); scene.remove(ring); Sound.sfx('crossboom'); shake(1); FX.ring(Pa.x,.1,Pa.z,'#ffd070',18,.6);
  const P=Player, a=Math.atan2(P.z-Pa.z,P.x-Pa.x)||0; if(!TW.god&&!P.gaoled) { const kd=(L.R-3.1)/.5; PF.kb={vx:Math.cos(a)*kd,vz:Math.sin(a)*kd,t:.5}; } for(const m of PF.members) if(!m.isPlayer){ const b=Math.atan2(m.z-Pa.z,m.x-Pa.x); m.x+=Math.cos(b)*4; m.z+=Math.sin(b)*4; }
  yield 1; PF.stack=0; }
function pfHeart(){ const x=PF_C.x, z=PF_C.z+5; const lap=twBB(twTex('laptop',32,24,c=>{ R(c,2,2,28,16,'#2a2a3a'); R(c,4,4,24,12,'#1a6a3a'); c.font='6px monospace'; c.fillStyle='#7affb0'; c.fillText('git',6,10); c.fillText('push',6,15); R(c,0,18,32,4,'#4a4a5a'); }),2.4,1.8); lap.position.set(x,1.4,z);
  PF.heart={x,z,hp:110,maxHp:110,mesh:lap,t:0}; pfLog("Paul's Laptop (Titan's Heart) appears. DESTROY IT."); twBig("DESTROY PAUL'S LAPTOP",{size:44,col:'#ffd45a',y:UH*.22,dur:2}); }

// ---------- the timeline (generator; yields seconds) ----------
function pfRate(r,floor){ PF.rate=r; PF.floor=floor; }
function* pfWaitHP(limit){ let t=0; while(PF.hp>PF.floor+.01&&t<limit){ yield .1; t+=.1; } PF.hp=Math.min(PF.hp,PF.floor); }
function pfSkipPhase(){ if(!PF||PF.pi>=4||PF.skipT>0) return; PF.skipT=1.2; for(const h of PF.haz) h.kill&&h.kill(); PF.haz=[]; PF.cast=null; PF.stack=0; PF.side=null;
  for(const g of PF.gaols){ scene.remove(g.mesh); g.m.gaol=0; } PF.gaols=[]; Player.gaoled=false; for(const m of PF.members) m.mark=0;
  if(PF.heart){ scene.remove(PF.heart.mesh); PF.heart=null; } const Pa=PF.paul; Pa.away=0; Pa.hy=0; Pa.x=PF_C.x; Pa.z=PF_C.z;
  const floors=[76,74,45,9]; PF.hp=Math.min(PF.hp,floors[PF.pi]); if(PF.pi===0) pfSetRadius(14.5); if(PF.pi===2) pfSetRadius(11.5);
  PF.pi++; PF.gen=pfTimeline(); PF.wait=.5; twBig('PHASE SKIPPED',{size:40,col:'#7affb0',y:UH*.24,dur:1}); }
function* pfP1(){ const Pa=PF.paul; pfLog('Duty Commenced.'); yield 1.5;
  PF.phase=1; pfRate(.42,76); yield* pfCast('Rock Buster.exe',1.2); pfDmg(pfTank(),30000,true); yield 1;
  yield* pfTumult(3); yield 1; yield* pfWeight(3,true); yield* pfLandslide(false); yield* pfBuster(); yield 1;
  yield* pfWeight(2,true); yield* pfLandslide(false); yield* pfCast('Rock Buster.exe',1); pfDmg(pfTank(),30000,true); yield 1; yield* pfTumult(2);
  yield* pfWaitHP(25);
  yield* pfGeocrush(14.5); }
function* pfP2(){ const Pa=PF.paul;
  PF.phase=2; Pa.away=1; Pa.hy=3; pfRate(0,PF.hp); pfHeart(); twBark('paul',"I'm going AFK. Don't touch my laptop. There's unsaved work on there.",true);
  let ht=0; const heartLimit=48, bombsA={done:0}, gaolA={done:0}, bombsB={done:0};
  while(PF.heart.hp>0&&ht<heartLimit){ ht+=.1; if(ht>5&&!bombsA.done){ bombsA.done=1; pfBombs('plus'); pfLog('Bomb Boulders surface. Find the gaps.'); }
    if(ht>6&&!gaolA.done){ gaolA.done=1; const g=pfGaol(2,true,3); PF.side=g; }
    if(PF.side){ const r=PF.side.next(); if(r.done) PF.side=null; }
    if(ht>20&&!bombsB.done){ bombsB.done=1; pfBombs('ring'); pfLog('More boulders. Stack inside the ring.'); }
    yield .1; }
  PF.side=null; if(PF.heart.hp>0){ yield* pfCast('Earthen Fury (you were too slow)',2); for(const m of PF.members) if(m.isPlayer) pfKill("The laptop wasn't destroyed in time. Paul pushed to production."); if(!TW.god){ PF.halt=1; return; } PF.heart.hp=0; }
  scene.remove(PF.heart.mesh); FX.burst(PF.heart.x,1.4,PF.heart.z,80,0x7affb0,9,.4); Sound.sfx('shatter'); impactFrame([[2,2],[1,1]]); PF.heart=null; twBark('paul',"MY LAPTOP! I hadn't committed in THREE WEEKS!",true);
  Pa.away=0; Pa.hy=0; Pa.x=PF_C.x; Pa.z=PF_C.z; yield* pfCast('Earthen Fury_FINAL_v3',2.4); for(const m of PF.members) pfDmg(m,m.maxHp*.55,true); FX.flash=.7; grade.uniforms.flashCol.value.set(1,.8,.6); shake(1.2); Sound.sfx('crossboom'); yield 1; pfHealAll(.45); yield 1;
}
function* pfP3(){ const Pa=PF.paul;
  PF.phase=3; pfRate(.6,45); PF.hp=Math.min(PF.hp,74);
  yield* pfUpheaval(); yield 1; yield* pfWeight(3,true); yield* pfBuster(); yield* pfLandslide(true); yield 1;
  pfBombs('rows'); pfLog('Boulders in rows. Stand between them.'); yield 1; yield* pfGaol(2,false,2.5); yield 2.4; yield* pfTumult(3); yield 1;
  yield* pfWeight(2,true); yield* pfUpheaval(); yield* pfLandslide(false);
  yield* pfWaitHP(20); }
function* pfP4(){ const Pa=PF.paul;
  PF.phase=4; pfRate(.85,9); twBark('paul',"FINE. Let's make the arena SMALLER. Like my patience.",true);
  yield* pfGeocrush(11.5); yield* pfWeight(3,true); yield* pfLandslide(true); yield* pfBuster();
  pfBombs('half'); pfLog('Half the arena is about to explode. Pick the other half.'); yield* pfGaol(2,true,3); yield 2.4; yield* pfTumult(3);
  yield* pfUpheaval(); yield* pfWeight(2,true); yield* pfLandslide(false);
  yield* pfWaitHP(30); }
function* pfP5(){
  PF.enrage=1; PF.cast={name:'Earthen Fury (hardcoded)',t:0,dur:14}; pfLog('Paul begins casting Earthen Fury (hardcoded). Enrage.'); yield 2.5;
  twBig('LIMIT BREAK',{size:80,col:'#7ab0ff',y:UH*.3,dur:1.6}); PF.lb=1; pfLog((HERO()==='ali'?'Shayan':'Ali')+' uses Final Heaven. (It is a punch.)'); Sound.sfx('skyopen'); impactFrame([[1,2],[3,2],[2,2]]); shake(1.2);
  pfRate(4,0); while(PF.hp>0) yield .1; PF.cast=null; yield .3;
  TW.paulWon=1; run(twPaulFinale); }
const PF_PHASES=[pfP1,pfP2,pfP3,pfP4,pfP5];
function* pfTimeline(){ for(PF.pi=PF.pi||0;PF.pi<PF_PHASES.length;PF.pi++){ PF.cur=PF_PHASES[PF.pi](); yield* PF.cur; if(PF.halt) return; } }
function pfUpdate(dt){ if(!PF||L.key!=='paul') return; const play=Game.state==='play'; PF.t+=dt; PF.paul.t+=dt;
  for(const h of PF.haz) if(h.live) h.upd(dt); PF.haz=PF.haz.filter(h=>h.live||(h.kind==='edge'&&h.live));
  for(const l of PF.log) l.t+=dt; if(PF.cast) PF.cast.t+=dt; grade.uniforms.ab.value=Math.max(0,(grade.uniforms.ab.value||0)-dt*.8);
  for(const m of PF.members){ m.shown=lerp(m.shown,m.hp/m.maxHp,Math.min(1,dt*6)); if(!m.isPlayer){ if(play) pfUpdateAI(m,dt); } else { m.x=Player.x; m.z=Player.z; m.y=Player.y; } }
  for(const g of PF.gaols){ if(play) g.life-=dt; if(g.life<=0&&g.hp>0) pfHitGaol(g,99); } PF.gaols=PF.gaols.filter(g=>g.hp>0); if(!PF.gaols.some(g=>g.m.isPlayer)) Player.gaoled=false;
  if(PF.heart){ PF.heart.t+=dt; PF.heart.mesh.position.y=1.4+Math.sin(PF.heart.t*3)*.15; if(Math.random()<.3) FX.spawn(PF.heart.x+rnd(-1,1),1.4,PF.heart.z,0,1,0,.5,0x7affb0,.2,0,true); }
  if(play&&!PF.paul.away&&PF.rate>0&&PF.hp>PF.floor) PF.hp=Math.max(PF.floor,PF.hp-PF.rate*dt);
  // a small auto attack on the main tank keeps the healers busy
  PF.aa=(PF.aa||0)-dt; if(play&&PF.aa<=0&&!PF.paul.away){ PF.aa=2.6; const T=pfTank(); pfDmg(T,T.maxHp*.08,false); }
  // Paul faces the main tank
  const T=pfTank(); if(T) PF.paul.ang=Math.atan2(T.z-PF.paul.z,T.x-PF.paul.x); PF.paul.f=Math.cos(PF.paul.ang)>0?1:-1;
  if(play&&PF.gen&&!PF.dead){ PF.wait-=dt; let k=0; while(PF.gen&&PF.wait<=0&&k++<80){ let r; try{ r=PF.gen.next(); }catch(e){ console.error('paul timeline',e); r={done:true}; } if(r.done) PF.gen=null; else PF.wait+=(r.value||0); } }
  PF.skipT=Math.max(0,(PF.skipT||0)-dt); }
(function(){ const uw=updateWorld; updateWorld=function(dt){ uw(dt); if(PF&&L&&L.key==='paul') try{ pfUpdate(dt); }catch(e){ console.error('pf',e); } }; })();

// ---------- drawing the party, Paul, and his glitches ----------
function pfDrawFn(m){ const t=m.t, a=m.anim; return {grimmaw:(c,cx,by)=>drawGrimmawHD(c,cx,by,m.f,{t,anim:a==='run'?'run':'idle',flash:0}),nathan:(c,cx,by)=>drawNathanPilot(c,cx,by,m.f,{t}),mira:(c,cx,by)=>drawMiraHD(c,cx,by,m.f,{t,anim:a}),hamza:(c,cx,by)=>drawHamzaFairy(c,cx,by,m.f,t,0),
  shayan:(c,cx,by)=>drawShayanHD(c,cx,by,m.f,{t,anim:a,ap:0,combo:0}),ali:(c,cx,by)=>drawAliHD(c,cx,by,m.f,{t,anim:a}),caotan:(c,cx,by)=>drawCaotanBoss(c,cx,by,m.f,{t,down:0}),omar:(c,cx,by)=>drawOmarBoss(c,cx,by,m.f,{t,down:0})}[m.id]; }
function pfDraw(){ if(!PF||L.key!=='paul') return; const t=performance.now()/1000;
  for(const m of PF.members){ if(m.isPlayer) continue; if(!m.spr||SPRITES.indexOf(m.spr)<0) m.spr=['grimmaw','caotan','omar'].includes(m.id)?new Sprite3D(128,128,28):m.id==='hamza'?new Sprite3D(40,40,30):new Sprite3D(64,64);
    m.spr.show(true); m.spr.draw(pfDrawFn(m)); const yo=['caotan','omar'].includes(m.id)?-.15:0; m.spr.place(m.x,(m.y||0)+yo,m.z,0); m.spr.glow(m.mark?.4+.3*Math.sin(t*10):0); }
  const Pa=PF.paul; if(!Pa.spr||SPRITES.indexOf(Pa.spr)<0){ Pa.spr=new Sprite3D(64,64); Pa.ghosts=[new Sprite3D(64,64),new Sprite3D(64,64)]; Pa.ghosts[0].mesh.material.color.setHex(0xff2a5a); Pa.ghosts[1].mesh.material.color.setHex(0x2affd0); }
  const fn=(c,cx,by)=>drawVillagerHD(c,cx,by,Pa.f,{t:Pa.t,moving:false},PAUL_LOOK); Pa.spr.draw(fn); Pa.spr.mesh.scale.setScalar(2.4); Pa.spr.place(Pa.x,Pa.hy,Pa.z,0); Pa.spr.show(Pa.hy<20); Pa.spr.glow(.15+(Math.random()<.05?.8:0));
  Pa.ghosts.forEach((g,i)=>{ g.draw(fn); g.mesh.scale.setScalar(2.4); const j=Math.random()<.15?rnd(-.5,.5):0; g.place(Pa.x+(i?.12:-.12)+j,Pa.hy+(Math.random()<.1?rnd(-.3,.3):0),Pa.z-.05,0); g.show(Pa.hy<20&&Math.random()<.7); g.mesh.material.opacity=.5; g.mesh.material.transparent=true; g.glow(.6); });
  if(Math.random()<.4) FX.spawn(Pa.x+rnd(-1.5,1.5),Pa.hy+rnd(.5,5),Pa.z,0,rnd(.5,2),0,.6,Math.random()<.5?0x5aff9a:0xff3a6a,.2,0,true); }
(function(){ const ds=drawSprites; drawSprites=function(){ ds(); try{ pfDraw(); }catch(e){ console.error('pfDraw',e); } }; })();

// ---------- FF14-style UI: party list, target bar, cast bar, chat log, head markers ----------
function pfRoleIcon(x,y,role){ D.save(); D.translate(x,y); D.fillStyle=role==='tank'?'#2a4a9a':role==='healer'?'#2a7a3a':'#8a2a2a'; D.beginPath(); D.arc(0,0,12,0,7); D.fill(); D.strokeStyle='#e8d8b0'; D.lineWidth=1.5; D.stroke(); D.fillStyle='#fff';
  if(role==='tank'){ D.beginPath(); D.moveTo(0,-7); D.lineTo(6,-4); D.lineTo(5,3); D.lineTo(0,7); D.lineTo(-5,3); D.lineTo(-6,-4); D.closePath(); D.fill(); }
  else if(role==='healer'){ D.fillRect(-2,-7,4,14); D.fillRect(-7,-2,14,4); } else { D.save(); D.rotate(-Math.PI/4); D.fillRect(-1.5,-8,3,12); D.fillRect(-4,3,8,2); D.restore(); } D.restore(); }
function pfDrawUI(){ if(!PF||L.key!=='paul') return; const t=performance.now()/1000;
  // party list
  const x0=16, y0=96; D.fillStyle='rgba(10,10,18,.55)'; D.fillRect(x0-6,y0-26,246,8*46+34); D.font=`700 12px ${FB}`; D.fillStyle='#d8d0b8'; D.fillText('PARTY  ·  The Navel (Paul Extreme)',x0,y0-10);
  PF.members.forEach((m,i)=>{ const y=y0+i*46; if(m.isPlayer){ D.strokeStyle='#ffd45a'; D.lineWidth=2; D.strokeRect(x0-4,y-4,240,42); }
    pfRoleIcon(x0+12,y+14,m.role); D.font=`700 14px ${FB}`; D.fillStyle='#f0ece0'; D.fillText((i+1)+'  '+m.name,x0+30,y+10); D.font=`600 10px ${FB}`; D.fillStyle='#a8a090'; D.fillText('Lv90 '+PF_JOB[m.id],x0+168,y+10);
    D.fillStyle='rgba(0,0,0,.6)'; D.fillRect(x0+30,y+16,180,8); const k=m.shown; D.fillStyle=k<.3?'#e04a4a':k<.6?'#e0c04a':'#7ad06a'; D.fillRect(x0+30,y+16,180*k,8);
    D.font=`700 11px ${FB}`; D.fillStyle='#fff'; D.textAlign='right'; D.fillText(Math.round(m.hp).toLocaleString(),x0+210,y+36); D.textAlign='left';
    D.fillStyle='rgba(0,0,0,.6)'; D.fillRect(x0+30,y+27,90,4); D.fillStyle='#6aa8ff'; D.fillRect(x0+30,y+27,90*(.6+.4*Math.sin(t*.3+i)),4);
    let sx=x0+124; if(m.vuln){ D.fillStyle='#c03030'; D.fillRect(sx,y+25,14,10); D.font='700 8px sans-serif'; D.fillStyle='#fff'; D.fillText('V'+m.vuln,sx+2,y+33); sx+=16; } if(m.gaol){ D.fillStyle='#8a6a4a'; D.fillRect(sx,y+25,14,10); sx+=16; } if(m.mark){ D.fillStyle='#ff8a2a'; D.fillRect(sx,y+25,14,10); } });
  // target bar + cast bar
  const bw=520, bx=UW/2-bw/2, by=30; D.font=`700 16px ${FB}`; D.fillStyle='#ffd8e0'; D.textAlign='center'; D.fillText(pfGlitch('Paul (Game Developer)  ·  Lv ??'),UW/2,by-6); D.textAlign='left';
  D.fillStyle='rgba(0,0,0,.65)'; D.fillRect(bx,by,bw,12); D.fillStyle=PF.paul.away?'#6a6a7a':'#d8404a'; D.fillRect(bx,by,bw*PF.hp/100,12); D.strokeStyle='#e8d0a0'; D.lineWidth=1.5; D.strokeRect(bx,by,bw,12);
  D.font=`700 12px ${FB}`; D.fillStyle='#fff'; D.textAlign='right'; D.fillText(PF.hp.toFixed(1)+'%',bx+bw,by+26); D.textAlign='left'; if(PF.paul.away){ D.fillStyle='#a8a0b8'; D.fillText('UNTARGETABLE (AFK)',bx,by+26); }
  if(PF.cast){ const c=PF.cast, cw=300, cx=UW/2-cw/2, cy=by+36, k=clamp(c.t/c.dur,0,1); D.fillStyle='rgba(0,0,0,.7)'; D.fillRect(cx,cy,cw,10); D.fillStyle='#ffb04a'; D.fillRect(cx,cy,cw*k,10); D.strokeStyle='#e8d0a0'; D.strokeRect(cx,cy,cw,10);
    D.font=`700 14px ${FB}`; D.fillStyle='#ffe8c0'; D.textAlign='center'; D.fillText(pfGlitch(c.name),UW/2,cy+28); D.textAlign='left'; }
  if(PF.heart){ const hw=300, hx=UW/2-hw/2, hy=92; D.font=`700 13px ${FB}`; D.fillStyle='#bfffd0'; D.textAlign='center'; D.fillText("Paul's Laptop",UW/2,hy-4); D.textAlign='left'; D.fillStyle='rgba(0,0,0,.65)'; D.fillRect(hx,hy,hw,9); D.fillStyle='#5ad08a'; D.fillRect(hx,hy,hw*Math.max(0,PF.heart.hp)/PF.heart.maxHp,9); }
  // chat log
  const lx=16, ly=UH-150; D.fillStyle='rgba(10,10,18,.5)'; D.fillRect(lx-6,ly-16,380,118); D.font=`500 12px ${FB}`; PF.log.forEach((l,i)=>{ D.fillStyle=l.s.includes('Paul')?'#ffb0b0':'#d8e8ff'; D.fillText(l.s,lx,ly+i*17); });
  // head markers
  for(const m of PF.members){ if(!m.mark) continue; const [sx,sy,z]=toScreen(m.x,(m.y||0)+3.4,m.z); if(z>1) continue; D.save(); D.translate(sx,sy+Math.sin(t*6)*3);
    if(m.mark==='buster'){ D.fillStyle='#ff3a2a'; D.beginPath(); D.arc(0,0,16,0,7); D.fill(); D.fillStyle='#fff'; D.font='900 18px sans-serif'; D.textAlign='center'; D.fillText('!',0,7); }
    else { D.rotate(t*2); D.strokeStyle='#ffb03a'; D.lineWidth=4; D.strokeRect(-12,-12,24,24); D.rotate(-t*2); D.fillStyle='#ffd070'; D.font='900 14px sans-serif'; D.textAlign='center'; D.fillText('GAOL',0,5); } D.restore(); }
  for(const d of Game.dmgNums){ const [sx,sy,z]=toScreen(d.x,d.y+d.t*1.2,d.z); if(z>1) continue; D.globalAlpha=1-d.t/.8; D.font=`900 ${typeof d.n==='string'?17:d.big?26:18}px ${FB}`; D.lineWidth=4; D.strokeStyle='#1a0e14'; D.textAlign='center'; D.strokeText(d.n,sx,sy); D.fillStyle=d.col||'#fff4e0'; D.fillText(d.n,sx,sy); D.textAlign='left'; D.globalAlpha=1; }
  if(Player.gaoled){ D.font=`900 22px ${FB}`; D.fillStyle='#ffd070'; D.textAlign='center'; D.fillText('TRAPPED IN GRANITE GAOL · your party is breaking you out',UW/2,UH-80); D.textAlign='left'; }
  if(Math.random()<.02){ D.fillStyle='rgba(255,40,90,.12)'; D.fillRect(0,rnd(0,UH),UW,rnd(4,30)); } }
(function(){ const dh=drawHUD; drawHUD=function(){ if(PF&&L&&L.key==='paul'&&!TW.paulWon){ try{ pfDrawUI(); }catch(e){ console.error('pfUI',e); } return; } dh(); };
  const dd=drawDead; drawDead=function(){ dd(); if(PF&&PF.why&&L&&L.key==='paul'){ D.font=`700 20px ${FB}`; D.fillStyle='#ffd0d8'; D.textAlign='center'; D.fillText(PF.why,UW/2,UH*.62); D.fillText('No checkpoints. The whole fight restarts.',UW/2,UH*.62+28); D.textAlign='left'; } }; })();
