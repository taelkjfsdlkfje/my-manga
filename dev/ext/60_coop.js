// =====================================================================
// ONLINE CO-OP (duo fight): a friend plays Ali from a link or a code.
// The host (Shayan) runs the game and streams the screen; the guest sends inputs.
// Works peer to peer over WebRTC (PeerJS public broker); the guest needs no save or account.
// =====================================================================
const MP={on:false,role:null,peer:null,conn:null,call:null,code:'',comp:null,cctx:null,stream:null,in:{h:{},ax:.5,ay:.5},pq:[],readyH:false,readyG:false,bothDown:false,ui:null,stT:0};
const MP_PREFIX='msbell-coop-';
// while a panel is open, game keys don't leak through (typing a code or key shouldn't make you jump)
addEventListener('keydown',e=>{ if(MP.ui&&document.body.contains(MP.ui)&&!MP.ui.contains(e.target)){ e.stopImmediatePropagation(); } },true);
function mpLoadPeer(){ if(window.Peer) return Promise.resolve(); const urls=['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js','https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js','https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
  return new Promise((res,rej)=>{ let i=0; const next=()=>{ if(i>=urls.length){ rej(new Error('Could not load the co-op library')); return; } const s=document.createElement('script'); s.src=urls[i++]; s.onload=()=>window.Peer?res():next(); s.onerror=next; document.head.appendChild(s); }; next(); }); }
function mpCode(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<5;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
function mpLink(code){ return location.origin+location.pathname+'?join='+code; }
function mpSend(o){ try{ if(MP.conn&&MP.conn.open) MP.conn.send(o); }catch(e){} }

// ---------- small DOM panel used by both host and guest ----------
function mpPanel(html){ mpClosePanel(); const d=document.createElement('div'); d.id='mpPanel';
  d.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:50;background:rgba(6,4,10,.82);font-family:Georgia,serif;color:#f3dfae;padding:16px;box-sizing:border-box';
  d.innerHTML='<div style="background:#1a1218;border:3px solid #8a6a3a;outline:1px solid rgba(216,180,106,.4);outline-offset:-8px;max-width:560px;width:100%;padding:26px 24px;box-sizing:border-box;text-align:center">'+html+'</div>';
  for(const ev of ['keydown','keyup','pointerdown','pointerup','mousedown','contextmenu']) d.addEventListener(ev,e=>e.stopPropagation()); document.body.appendChild(d); MP.ui=d; return d; }
function mpClosePanel(){ const d=document.getElementById('mpPanel'); if(d) d.remove(); MP.ui=null; }
const MP_BTN='display:inline-block;margin:8px 6px 0;padding:10px 18px;font:700 16px Georgia,serif;color:#ffe6b0;background:#3c2814;border:2px solid #e8c070;cursor:pointer;border-radius:2px';
const MP_BTN2='display:inline-block;margin:8px 6px 0;padding:10px 18px;font:700 16px Georgia,serif;color:#cdb48a;background:#1e1610;border:2px solid #8a6a3a;cursor:pointer;border-radius:2px';

// ---------- HOST: the lobby (a cutscene wait) ----------
function twLobby(){ const w={type:'mplobby'}; mpHostOpen(); return w; }
function mpResolve(v){ mpClosePanel(); if(Game.wait&&Game.wait.type==='mplobby'){ Game.wait=null; Game.sv=v; step(); } }
function mpHostOpen(){ const d=mpPanel('<div style="font:700 26px Georgia,serif;margin-bottom:6px">Play with a friend</div><div style="color:#a8906a;font-size:14px;margin-bottom:14px">Your friend plays Ali. They just open the link (no account, no save needed).</div><div id="mpBody" style="font-size:16px">Connecting to the matchmaking server…</div><div style="margin-top:16px"><button id="mpBack" style="'+MP_BTN2+'">Back</button></div>');
  d.querySelector('#mpBack').onclick=()=>{ mpShutdown(); mpResolve('back'); };
  mpLoadPeer().then(()=>mpHostPeer(0)).catch(err=>mpHostError(err)); }
function mpHostError(err){ const b=document.getElementById('mpBody'); if(b) b.innerHTML='<div style="color:#ff9a9a">Couldn\'t start co-op: '+String(err&&err.type||err&&err.message||err)+'</div><div style="color:#a8906a;font-size:14px;margin-top:6px">Check your connection, or go Back and pick "I don\'t have any friends".</div>'; }
function mpHostPeer(tries){ const code=mpCode(); MP.code=code; let peer; try{ peer=new Peer(MP_PREFIX+code); }catch(e){ mpHostError(e); return; } MP.peer=peer; MP.role='host';
  peer.on('open',()=>{ const b=document.getElementById('mpBody'); if(!b) return; const link=mpLink(code);
    b.innerHTML='<div style="color:#a8906a;font-size:13px">ROOM CODE</div><div style="font:900 44px monospace;letter-spacing:8px;color:#ffe6b0;margin:2px 0 10px">'+code+'</div>'+
      '<div style="text-align:left;font-size:13px;color:#cdb48a;margin-top:4px">Low-latency link (recommended): your friend runs the game in their browser</div><input id="mpLinkBox" readonly value="'+link+'" style="width:100%;box-sizing:border-box;padding:8px;font:13px monospace;background:#0e0a0c;color:#e8d8b8;border:1px solid #8a6a3a"><button id="mpCopy" style="'+MP_BTN+'">Copy low-latency link</button>'+
      '<div style="text-align:left;font-size:13px;color:#a8906a;margin-top:10px">Video link (fallback): they watch your screen and send inputs</div><input id="mpLinkBox2" readonly value="'+link+'&mode=video" style="width:100%;box-sizing:border-box;padding:8px;font:13px monospace;background:#0e0a0c;color:#c8b898;border:1px solid #6a5a3a"><button id="mpCopy2" style="'+MP_BTN2+'">Copy video link</button>'+
      '<div id="mpStat" style="margin-top:12px;color:#cdb48a">Waiting for your friend to join…<br><span style="font-size:13px;color:#a8906a">They can also open the game with ?join and type the code.</span></div>';
    const cp=(btn,box,txt)=>{ btn.onclick=()=>{ box.select(); try{ navigator.clipboard.writeText(txt).then(()=>btn.textContent='Copied!',()=>{ document.execCommand('copy'); btn.textContent='Copied!'; }); }catch(e){ document.execCommand('copy'); btn.textContent='Copied!'; } }; };
    cp(b.querySelector('#mpCopy'),b.querySelector('#mpLinkBox'),link); cp(b.querySelector('#mpCopy2'),b.querySelector('#mpLinkBox2'),link+'&mode=video'); });
  peer.on('error',e=>{ if(e&&e.type==='unavailable-id'&&tries<4){ try{ peer.destroy(); }catch(_){} mpHostPeer(tries+1); return; } if(!MP.on) mpHostError(e); else console.warn('peer',e); });
  peer.on('connection',conn=>{ if(MP.conn&&MP.conn.open){ conn.on('open',()=>{ conn.send({t:'full'}); setTimeout(()=>conn.close(),300); }); return; }
    const inLobby=Game.wait&&Game.wait.type==='mplobby', inDuo=TW.fight&&TW.fight.kind==='duo'&&TW.allies.some(a=>a.who==='ali');
    if(!inLobby&&!inDuo){ conn.on('open',()=>{ conn.send({t:'full'}); setTimeout(()=>conn.close(),300); }); return; }
    MP.conn=conn; conn.on('open',()=>{ const s=document.getElementById('mpStat'); if(s) s.innerHTML='<span style="color:#7affb0">Your friend joined!</span>'; MP.guestId=conn.peer; MP.gotHello=0; mpSend({t:'hello',v:2}); MP.on=true;
        setTimeout(()=>{ if(!MP.gotHello&&MP.conn===conn){ MP.gotHello=1; mpHostStream(conn.peer); } },2500);
        if(inLobby) setTimeout(()=>{ if(Game.wait&&Game.wait.type==='mplobby') mpResolve('joined'); },900);
        else { mpStartCoop(); twBig('YOUR FRIEND REJOINED',{size:44,col:'#7affb0',y:UH*.3,dur:2}); } });
    conn.on('data',mpHostData); conn.on('close',()=>mpGuestGone()); conn.on('error',()=>mpGuestGone()); }); }
function mpHostStream(guestId){ if(!MP.comp){ const [cv,cx]=mkCanvas(960,540); MP.comp=cv; MP.cctx=cx; }
  try{ const st=MP.comp.captureStream(30); try{ if(Sound.ctx&&Sound.master){ const dest=Sound.ctx.createMediaStreamDestination(); Sound.master.connect(dest); MP.audDest=dest; dest.stream.getAudioTracks().forEach(t=>st.addTrack(t)); } }catch(e){}
    MP.stream=st; MP.call=MP.peer.call(guestId,st); }catch(e){ console.warn('stream',e); } }
function mpHostData(m){ if(!m||!m.t) return; if(nsHostMsg(m)) return;
  if(m.t==='hello'){ MP.gotHello=1; if(m.mode==='sync') nsHostStart(); else mpHostStream(MP.guestId); return; }
  if(m.t==='in'){ MP.in.h=m.h||{}; if(m.ax!=null){ MP.in.ax=m.ax; MP.in.ay=m.ay; } }
  else if(m.t==='p'){ MP.pq.push(m.a); if(m.a==='attack'&&TW.mash) TW.mash.n++; }
  else if(m.t==='ready'){ MP.readyG=true; }
  else if(m.t==='leave'){ mpGuestGone(true); } }
function mpGuestGone(left){ if(!MP.conn&&!MP.on) return; const wasOn=MP.on; MP.on=false; TW.coop=false; try{ MP.conn&&MP.conn.close(); }catch(e){} MP.conn=null; mpStopStream();
  if(Game.wait&&Game.wait.type==='mplobby'){ const s=document.getElementById('mpStat'); if(s) s.innerHTML='Your friend left. Waiting for someone else…'; return; }
  const A=TW.allies.find(a=>a.who==='ali'); if(A){ A.remote=false; A.coopDown=0; if(A.down>0||A.hp<=0){ A.down=2; } } if(Player.mpDown) mpReviveHost(true); mpHideReady();
  nsHostStop(); nsClearMirrors();
  if(wasOn){ twBig('YOUR FRIEND LEFT',{size:46,col:'#ffd0a0',y:UH*.3,dur:2.2,sub:'AI Ali takes over. They can rejoin with the same link.'}); }
  if(TW.fight&&TW.fight.kind==='duo'){ TW.coop=false; mpRestoreDuoHP(); } else mpShutdown(true); }
function mpStopStream(){ try{ MP.call&&MP.call.close(); }catch(e){} MP.call=null; try{ if(MP.audDest) Sound.master.disconnect(MP.audDest); }catch(e){} MP.audDest=null; if(MP.stream) MP.stream.getTracks().forEach(t=>t.stop()); MP.stream=null; }
function mpShutdown(keepAI){ mpStopStream(); try{ MP.conn&&MP.conn.close(); }catch(e){} try{ MP.peer&&MP.peer.destroy(); }catch(e){} Object.assign(MP,{on:false,peer:null,conn:null,role:MP.role==='guest'?'guest':null}); TW.coop=false; mpRestoreDuoHP(); }
// composite the 3D canvas and the HUD into the stream canvas every frame
(function(){ const du=drawUI; drawUI=function(){ du(); if(MP.role==='host'&&MP.stream&&MP.cctx){ try{ MP.cctx.drawImage(glc,0,0,960,540); MP.cctx.drawImage(ui,0,0,960,540); }catch(e){} } }; })();

// ---------- HOST: the choice when Ali shows up ----------
function* twCoopChoice(){ if(MP.role==='guest') return;
  while(true){ yield say('',"Do you want to play with a friend?");
    const c=yield choose([{t:"Yes"},{t:"I don't have any friends."}]); if(c===1) return;
    const r=yield twLobby(); if(r==='joined'){ mpStartCoop(); yield say('ali',"...Someone else is holding my sword now. Interesting."); return; } } }
let MP_DUO_BASE=null;
function mpStartCoop(){ TW.coop=true; MP.on=true; const A=TW.allies.find(a=>a.who==='ali'); if(A){ A.remote=true; A.hp=A.maxHp=18; A.down=0; A.ult=0; A.jy=0; A.vy=0; A.parryT=1e9; }
  if(!MP_DUO_BASE) MP_DUO_BASE=DUO_HP.slice(); for(const k of [1,2,3]) DUO_HP[k]=Math.round(MP_DUO_BASE[k]*1.45);
  const F=TW.fight; if(F&&F.kind==='duo'){ for(const T of [F.C,F.O]){ const f=T.hp/T.maxHp; T.maxHp=DUO_HP[F.phase]; T.hp=T.maxHp*f; } }
  Game.banner={name:'Co-op',sub:'Twins are tougher and faster with two humans. Hit a downed partner 10 times to revive them.',t:0,small:1}; }
function mpRestoreDuoHP(){ if(MP_DUO_BASE){ for(const k of [1,2,3]) DUO_HP[k]=MP_DUO_BASE[k]; MP_DUO_BASE=null; } }
// harder twins in co-op: faster patterns, shorter gaps
(function(){ const sp=twSp; twSp=function(T){ return sp(T)+(TW.coop?.12:0); }; })();

// ---------- HOST: the remote-controlled Ali ----------
function mpAimWorld(ax,ay,A){ const v=new THREE.Vector3(ax*2-1,-(ay*2-1),.5).unproject(camera); v.sub(camera.position).normalize(); if(Math.abs(v.y)<1e-4) return null; const t=((A.y+1)-camera.position.y)/v.y; if(!(t>0)) return null; return {x:camera.position.x+v.x*t,z:camera.position.z+v.z*t}; }
function mpRemoteShot(A,ang){ const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshBasicMaterial({map:CRESC,color:0xff2a3a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); mesh.rotation.x=TILT; mesh.userData.tw=1; scene.add(mesh);
  const s={x:A.x+Math.cos(ang)*.6,y:A.y+1.2,z:A.z+Math.sin(ang)*.6,d:0}, vx=Math.cos(ang)*19, vz=Math.sin(ang)*19; Sound.sfx('beam');
  twHz({upd(dt,play){ if(!play) return true; s.x+=vx*dt; s.z+=vz*dt; s.d+=19*dt; mesh.position.set(s.x,s.y,s.z); mesh.rotation.z+=dt*16; if(Math.random()<.6) FX.spawn(s.x,s.y,s.z,0,0,0,.22,0xff2a3a,.25,0,true);
    for(const T of TW.foes){ if(T.hp<=0||T.gone||T.hide||T.down) continue; if(Math.hypot(T.x-s.x,T.z-s.z)<1.2*(T.scale||1)){ TW._ally=1; try{ if(twHurt(T,1.5,'ally')) A.ult=Math.min(1,(A.ult||0)+.035); }finally{ TW._ally=0; } FX.burst(s.x,s.y,s.z,10,0xff2a3a,3,.25); return false; } }
    return s.d<15; }, kill(){ scene.remove(mesh); }}); }
function mpUpdateRemoteAli(A,dt,play){ if(MP.sync) return nsRemoteAli(A,dt,play); const P=Player, I=MP.in, h=I.h||{}; A.t+=dt; A.flash=Math.max(0,A.flash-dt); A.inv=Math.max(0,A.inv-dt); A.cdA=(A.cdA||0)-dt; A.cdD=(A.cdD||0)-dt;
  const gy=groundY(A.x,A.z), base=gy>-50?gy:P.y; A.vy=(A.vy||0)-G_ACC*dt; A.jy=Math.max(0,(A.jy||0)+A.vy*dt); if(A.jy<=0) A.vy=0; A.y=base+A.jy;
  const q=MP.pq; MP.pq=[];
  if(A.coopDown){ A.anim='hurt'; A.y=base+.1; return; }
  if(!play){ A.anim='idle'; return; }
  let mx=(h.right?1:0)-(h.left?1:0), mz=(h.down?1:0)-(h.up?1:0); const ml=Math.hypot(mx,mz); if(ml>0){ mx/=ml; mz/=ml; }
  A.block=!!h.block; const spd=A.block?2.4:6; A.x+=mx*spd*dt; A.z+=mz*spd*dt; const c=twClampXZ(A.x,A.z,.6); A.x=c.x; A.z=c.z; A.anim=ml>0?'run':'idle'; if(A.block&&Math.random()<.4) FX.spawn(A.x+rnd(-.5,.5),A.y+rnd(.4,1.8),A.z,0,.3,0,.3,0xff4a5a,.2,0,true);
  const aim=mpAimWorld(I.ax,I.ay,A); const ang=aim?Math.atan2(aim.z-A.z,aim.x-A.x):(ml>0?Math.atan2(mz,mx):(A.f>0?0:Math.PI)); A.f=Math.cos(ang)>=0?1:-1;
  for(const a of q){
    if(a==='attack'){ if(P.mpDown&&Math.hypot(P.x-A.x,P.z-A.z)<3.6){ mpReviveTick(); continue; } }
    if(a==='jump'&&A.jy<=0){ A.vy=11; Sound.sfx('jump'); }
    if(a==='dash'&&A.cdD<=0){ A.cdD=.55; aliGhost(A.x,A.y,A.z); const da=ml>0?Math.atan2(mz,mx):ang, p=twClampXZ(A.x+Math.cos(da)*3.4,A.z+Math.sin(da)*3.4,.6); A.x=p.x; A.z=p.z; A.inv=Math.max(A.inv,.3); FX.burst(A.x,A.y+1,A.z,18,0x0c0814,4,.3,false); Sound.sfx('dash'); }
    if(a==='special'&&(A.ult||0)>=1){ const tg=twAllyTarget(); if(tg){ A.ult=0; twAllyJC(A,tg); } } }
  if(h.attack&&!A.block&&A.cdA<=0&&!(P.mpDown&&Math.hypot(P.x-A.x,P.z-A.z)<3.6)){ A.cdA=.22; A.flash=.08; mpRemoteShot(A,ang); }
  if(!A.hy&&Math.random()<.25) FX.spawn(A.x,A.y+.2,A.z,0,.5,0,.4,0xb0182a,.2,0,true);
  twAllyThreats(A); }
(function(){ const ua=twUpdateAlly; twUpdateAlly=function(A,dt,play){ if(A.remote) return mpUpdateRemoteAli(A,dt,play); return ua(A,dt,play); };
  // ground AoEs and beams can't be blocked; projectiles and melee can (Ali's guard parries those for free)
  const pw=f=>function(){ TW._pierce=1; try{ return f.apply(this,arguments); }finally{ TW._pierce=0; } }; twAllyAoE=pw(twAllyAoE); twAllyLine=pw(twAllyLine); twAllyRing=pw(twAllyRing);
  const ah=twAllyHurt; twAllyHurt=function(A,dmg){ if(A&&A.remote){ if(A.coopDown||A.inv>0) return; if(A.block&&!TW._pierce){ Sound.sfx('parry'); FX.spark(A.x,A.y+1.2,A.z); Game.dmgNums.push({x:A.x,y:A.y+2.4,z:A.z,n:'TOO SLOW',t:0,col:'#ff8a9a'}); A.inv=.25; if(MP.sync) mpSend({t:'parry'}); return; }
      A.hp-=dmg; A.inv=.8; A.flash=.25; if(MP.sync) mpSend({t:'hurt',n:dmg,hp:Math.max(0,A.hp)}); FX.burst(A.x,A.y+1.2,A.z,14,0xff5a6a,4,.25); Sound.sfx('hurt'); Game.dmgNums.push({x:A.x,y:A.y+2.6,z:A.z,n:dmg,t:0,col:'#ff9a9a'});
      if(A.hp<=0){ A.hp=0; A.coopDown=1; A.down=1; A.rev=0; Sound.sfx('crash'); twBig('ALI IS DOWN',{size:44,col:'#ff8a9a',y:UH*.24,dur:1.6,sub:'Shayan: hit him 10 times to revive'}); mpCheckBothDown(); } return; }
    return ah(A,dmg); }; })();

// ---------- revives, both down, ready up ----------
(function(){ const od=Game.onDeath; Game.onDeath=function(){ const F=TW.fight; if(MP.on&&MP.role==='host'&&F&&F.kind==='duo'&&!TW.god){ const P=Player; P.hp=0; P.mpDown=1; P.revN=0; P.inv=99; Sound.sfx('crash');
      twBig('YOU ARE DOWN',{size:46,col:'#ff8a9a',y:UH*.24,dur:1.8,sub:'Ali must hit you 10 times to revive you'}); mpCheckBothDown(); return; } return od.call(Game); }; })();
(function(){ const up=updatePlayer; updatePlayer=function(dt){ const P=Player; if(P.mpDown){ for(const k of ['attack','dash','jump','block','special']) hit[k]=false; P.hurt=Math.max(P.hurt,.2); P.inv=99; P.vx*=.85; P.vz*=.85;
      const A=TW.allies.find(a=>a.remote); if(A&&!A.coopDown) Cam.focus={x:A.x,y:0,z:A.z}; } return up(dt); }; })();
function mpReviveTick(){ const P=Player; P.revN=(P.revN||0)+1; FX.burst(P.x,P.y+1,P.z,14,0x9fffb0,4,.3); Sound.sfx('heart'); Game.dmgNums.push({x:P.x,y:P.y+2.6,z:P.z,n:'REVIVE '+P.revN+'/10',t:0,col:'#9fffb0'}); if(P.revN>=10) mpReviveHost(); }
function mpReviveHost(quiet){ const P=Player; P.mpDown=0; P.revN=0; P.hp=Math.ceil(P.maxHp*.5); P.inv=1.5; P.hurt=0; Cam.focus=null; if(!quiet){ FX.burst(P.x,P.y+1,P.z,40,0x9fffb0,6,.4); twBark('ali',"Get up, blacksmith. I'm not carrying you.",true); } }
function mpReviveAli(A){ A.coopDown=0; A.down=0; A.rev=0; A.hp=Math.ceil(A.maxHp*.5); A.inv=1.5; FX.burst(A.x,A.y+1,A.z,40,0x9fffb0,6,.4); Sound.sfx('heart'); twBark('shayan',"Up you get. You owe me one.",true); }
(function(){ const op=twOnPress; twOnPress=function(a){ op(a); if(!MP.on||MP.role!=='host'||a!=='attack'||Game.state!=='play'||Player.mpDown) return; const A=TW.allies.find(x=>x.remote&&x.coopDown);
  if(A&&Math.hypot(A.x-Player.x,A.z-Player.z)<3){ A.rev=(A.rev||0)+1; FX.burst(A.x,A.y+1,A.z,14,0x9fffb0,4,.3); Sound.sfx('heart'); Game.dmgNums.push({x:A.x,y:A.y+2.6,z:A.z,n:'REVIVE '+A.rev+'/10',t:0,col:'#9fffb0'}); if(A.rev>=10) mpReviveAli(A); } }; })();
function mpCheckBothDown(){ const A=TW.allies.find(a=>a.remote); if(Player.mpDown&&A&&A.coopDown&&!MP.bothDown){ MP.bothDown=true; MP.readyH=MP.readyG=false; mpShowReady(); } }
function mpShowReady(){ const d=mpPanel('<div style="font:700 28px Georgia,serif;color:#ff9a9a">Both of you went down.</div><div style="color:#a8906a;margin:6px 0 14px">The twins are doing a victory dance. It is not good. Ready up to restart this phase.</div>'+
    '<div id="mpReadySt" style="margin-bottom:6px">You: <b>not ready</b> · Friend: <b>not ready</b></div><button id="mpReadyBtn" style="'+MP_BTN+'">Ready</button>');
  d.querySelector('#mpReadyBtn').onclick=()=>{ MP.readyH=true; }; }
function mpHideReady(){ if(MP.ui&&MP.ui.querySelector('#mpReadyBtn')) mpClosePanel(); MP.bothDown=false; }
function mpCoopTick(dt){ if(!MP.on||MP.role!=='host') return; MP.stT-=dt; const A=TW.allies.find(a=>a.remote);
  if(MP.bothDown){ const s=document.getElementById('mpReadySt'); if(s) s.innerHTML='You: <b>'+(MP.readyH?'ready':'not ready')+'</b> · Friend: <b>'+(MP.readyG?'ready':'not ready')+'</b>';
    if(MP.readyH&&MP.readyG){ mpHideReady(); const F=TW.fight; Player.mpDown=0; Player.revN=0; Cam.focus=null; if(A){ A.coopDown=0; A.down=0; A.hp=A.maxHp; } if(F&&F.respawn) F.respawn(); Game.state='play'; } }
  if(MP.stT<=0){ MP.stT=.25; mpSend({t:'st',aliDown:!!(A&&A.coopDown),revA:A?A.rev||0:0,hostDown:!!Player.mpDown,revP:Player.revN||0,bothDown:MP.bothDown,readyH:MP.readyH,readyG:MP.readyG,ult:A?A.ult||0:0,hp:A?A.hp:0,mhp:A?A.maxHp:0}); } }
(function(){ const uw=updateWorld; updateWorld=function(dt){ uw(dt); try{ mpCoopTick(dt); }catch(e){ console.error('coop',e); } }; })();
// the session ends with the fight
(function(){ const de=twDuoEnding; twDuoEnding=function*(F,C,O){ if(MP.on){ mpSend({t:'end'}); const A=TW.allies.find(a=>a.remote); if(A){ A.remote=false; A.coopDown=0; } } yield* de(F,C,O); setTimeout(()=>{ if(MP.role==='host') mpShutdown(); },1500); }; })();
// the duo HUD in co-op: who is down
(function(){ const dh=drawHUD; drawHUD=function(){ dh(); if(!MP.on||Game.state!=='play') return; const P=Player, A=TW.allies.find(a=>a.remote); D.save(); D.textAlign='center'; D.font=`900 18px ${FB}`;
  for(const [o,txt] of [[P,P.mpDown?'DOWN · Ali: hit me '+(10-(P.revN||0))+'x':''],[A,A&&A.coopDown?'DOWN · hit me '+(10-(A.rev||0))+'x':'']]){ if(!o||!txt) continue; const [x,y,z]=toScreen(o.x,o.y+2.9,o.z); if(z>1) continue; D.lineWidth=5; D.strokeStyle='#1a0e14'; D.strokeText(txt,x,y); D.fillStyle='#9fffb0'; D.fillText(txt,x,y); }
  if(A){ D.font=`700 13px ${FB}`; D.fillStyle='#ffd0d0'; D.fillText('Friend (Ali) · Judgement Cut '+Math.round((A.ult||0)*100)+'%',UW/2,UH-70-Game.letter*70); } D.restore(); }; })();

// =====================================================================
// GUEST: open the game with ?join=CODE (or ?join and type it). Shows the host's screen and sends inputs.
// =====================================================================
const MP_JOIN=(function(){ try{ return new URLSearchParams(location.search).get('join'); }catch(e){ return null; } })();
const MP_MODE=(function(){ try{ return new URLSearchParams(location.search).get('mode')==='video'?'video':'sync'; }catch(e){ return 'sync'; } })();
if(MP_JOIN!==null){ MP.role='guest'; const jc=(MP_JOIN||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(MP_MODE==='video'){ try{ loop=function(){}; }catch(e){} try{ Sound.muted=true; }catch(e){} mpGuestBoot(jc); } else setTimeout(()=>nsGuestBoot(jc),0); }
function mpGuestBoot(code){ glc.style.display='none'; ui.style.display='none'; const T=document.getElementById('touch'); if(T) T.style.display='none';
  const wrap=document.createElement('div'); wrap.style.cssText='position:fixed;inset:0;background:#000;z-index:40'; const v=document.createElement('video'); v.autoplay=true; v.playsInline=true; v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000';
  wrap.appendChild(v); document.body.appendChild(wrap); MP.video=v;
  const hud=document.createElement('div'); hud.style.cssText='position:fixed;left:12px;top:12px;z-index:45;display:flex;gap:8px;align-items:center;font:600 14px Georgia,serif;color:#f3dfae';
  hud.innerHTML='<button id="mpLeave" style="'+MP_BTN2+';margin:0">Leave</button><span id="mpGStat" style="background:rgba(0,0,0,.6);padding:6px 10px">Connecting…</span>'; document.body.appendChild(hud);
  hud.querySelector('#mpLeave').onclick=()=>{ mpSend({t:'leave'}); setTimeout(()=>{ try{ MP.peer&&MP.peer.destroy(); }catch(e){} },200); mpGuestScreen('You left the session.','Rejoin',()=>location.reload()); };
  const ask=()=>{ const d=mpPanel('<div style="font:700 26px Georgia,serif">Join a friend</div><div style="color:#a8906a;font-size:14px;margin:6px 0 14px">You\'ll play as <b>Ali</b>. WASD move · mouse aims · left click Getsuga (hold to keep firing) · right click guard (parries projectiles and melee) · Shift blink · Space jump · Q Judgement Cut when charged.</div>'+
      '<input id="mpCodeIn" maxlength="5" placeholder="CODE" value="'+(code||'')+'" style="font:900 34px monospace;letter-spacing:8px;width:220px;text-align:center;background:#0e0a0c;color:#ffe6b0;border:2px solid #8a6a3a;padding:6px"><br><button id="mpGo" style="'+MP_BTN+'">Join</button>');
    const go=()=>{ const c=d.querySelector('#mpCodeIn').value.toUpperCase().replace(/[^A-Z0-9]/g,''); if(c.length<4) return; mpClosePanel(); mpGuestConnect(c); };
    d.querySelector('#mpGo').onclick=go; d.querySelector('#mpCodeIn').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); };
  ask(); }
function mpGuestScreen(msg,btn,fn){ const d=mpPanel('<div style="font:700 22px Georgia,serif;margin-bottom:12px">'+msg+'</div>'+(btn?'<button id="mpGB" style="'+MP_BTN+'">'+btn+'</button>':'')); if(btn) d.querySelector('#mpGB').onclick=fn; }
function mpGuestConnect(code){ const st=document.getElementById('mpGStat'); const say2=t=>{ if(st) st.textContent=t; }; say2('Loading co-op…');
  mpLoadPeer().then(()=>{ const peer=new Peer(); MP.peer=peer;
    peer.on('open',()=>{ say2('Connecting to '+code+'…'); MP.code=code; const conn=peer.connect(MP_PREFIX+code,{reliable:true}); MP.conn=conn;
      conn.on('open',()=>{ say2('Connected. Waiting for the host…'); MP.on=true; mpSend({t:'hello',mode:MP_MODE}); if(MP_MODE==='video') mpGuestInputs(); });
      conn.on('data',m=>mpGuestData(m)); conn.on('close',()=>{ if(MP.on){ MP.on=false; mpGuestScreen('The host ended the session.','Back to the game',()=>location.href=location.pathname); } }); });
    peer.on('call',call=>{ call.answer(); call.on('stream',s=>{ MP.video.srcObject=s; MP.video.muted=false; MP.video.play().catch(()=>{ MP.video.muted=true; MP.video.play(); }); say2('Playing as Ali'); }); });
    peer.on('error',e=>{ const t=e&&e.type; if(t==='peer-unavailable') mpGuestScreen('No game found with code '+code+'.<br><span style="font-size:14px;color:#a8906a">Check the code. The host has to be on the "Play with a friend" screen.</span>','Try again',()=>{ mpClosePanel(); mpGuestBoot(''); });
      else mpGuestScreen('Connection problem: '+(t||e)+'.','Try again',()=>location.reload()); }); })
  .catch(err=>mpGuestScreen('Couldn\'t load co-op: '+err.message,'Retry',()=>location.reload())); }
function mpGuestData(m){ if(!m||!m.t) return; if(typeof nsGuestMsg==='function'&&nsGuestMsg(m)) return; const st=document.getElementById('mpGStat');
  if(m.t==='full') mpGuestScreen('That game already has a second player.','Back',()=>location.href=location.pathname);
  if(m.t==='end'){ if(st) st.textContent='Fight over. Thanks for playing!'; }
  if(m.t==='st'){ if(st) st.textContent=m.aliDown?'You are DOWN · Shayan must hit you '+(10-m.revA)+' more times':m.hostDown?'Shayan is down! Stand next to him and attack '+(10-m.revP)+' times':'Playing as Ali · HP '+Math.ceil(m.hp)+'/'+m.mhp+' · Judgement Cut '+Math.round(m.ult*100)+'%';
    if(m.bothDown&&!m.readyG&&!document.getElementById('mpRdy')){ const d=mpPanel('<div style="font:700 26px Georgia,serif;color:#ff9a9a">You both went down.</div><div style="color:#a8906a;margin:8px 0 12px">Ready up to restart the phase.</div><button id="mpRdy" style="'+MP_BTN+'">Ready</button>');
      d.querySelector('#mpRdy').onclick=()=>{ mpSend({t:'ready'}); d.querySelector('#mpRdy').textContent='Waiting for Shayan…'; }; }
    if(!m.bothDown&&document.getElementById('mpRdy')) mpClosePanel(); } }
function mpGuestInputs(){ const held2={}; let ax=.5, ay=.5; const v=MP.video;
  const act=e=>KEYMAP[e.code]; addEventListener('keydown',e=>{ if(MP.ui) return; const a=act(e); if(!a) return; e.preventDefault(); if(!held2[a]) mpSend({t:'p',a}); held2[a]=true; });
  addEventListener('keyup',e=>{ const a=act(e); if(a) held2[a]=false; });
  const rel=e=>{ const r=v.getBoundingClientRect(), ar=16/9; let w=r.width, h=r.height, ox=r.left, oy=r.top; if(w/h>ar){ const nw=h*ar; ox+=(w-nw)/2; w=nw; } else { const nh=w/ar; oy+=(h-nh)/2; h=nh; } ax=clamp((e.clientX-ox)/w,0,1); ay=clamp((e.clientY-oy)/h,0,1); };
  addEventListener('mousemove',rel); addEventListener('contextmenu',e=>e.preventDefault());
  addEventListener('pointerdown',e=>{ if(MP.ui||e.target.closest&&e.target.closest('button')) return; rel(e); const a=e.button===2?'block':'attack'; if(!held2[a]) mpSend({t:'p',a}); held2[a]=true; });
  addEventListener('pointerup',e=>{ held2[e.button===2?'block':'attack']=false; });
  setInterval(()=>mpSend({t:'in',h:held2,ax,ay}),33); }

// guest boot for the low-latency mode: the game stays running in this browser
function nsGuestBoot(code){ Game.state='cut'; Game.letterTo=0; try{ const T=document.getElementById('touch'); if(T) T.style.display='none'; }catch(e){}
  const hud=document.createElement('div'); hud.style.cssText='position:fixed;left:12px;top:12px;z-index:45;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font:600 14px Georgia,serif;color:#f3dfae';
  hud.innerHTML='<button id="mpLeave" style="'+MP_BTN2+';margin:0">Leave</button><button id="mpVid" style="'+MP_BTN2+';margin:0">Laggy? Video mode</button><span id="mpGStat" style="background:rgba(0,0,0,.6);padding:6px 10px">Connecting…</span>'; document.body.appendChild(hud);
  for(const ev of ['pointerdown','mousedown','keydown']) hud.addEventListener(ev,e=>e.stopPropagation());
  hud.querySelector('#mpLeave').onclick=()=>{ mpSend({t:'leave'}); setTimeout(()=>{ try{ MP.peer&&MP.peer.destroy(); }catch(e){} },200); NS.on=false; mpGuestScreen('You left the session.','Rejoin',()=>location.reload()); };
  hud.querySelector('#mpVid').onclick=()=>nsSwitchVideo();
  const d=mpPanel('<div style="font:700 26px Georgia,serif">Join a friend</div><div style="color:#a8906a;font-size:14px;margin:6px 0 14px">You\'ll play as <b>Ali</b>, running in your own browser. WASD move · mouse aims · left click Getsuga · right click guard (parries projectiles and melee) · Shift blink · Space jump · Q Judgement Cut End when your meter is full. If Shayan goes down, stand next to him and attack 10 times.</div>'+
    '<input id="mpCodeIn" maxlength="5" placeholder="CODE" value="'+(code||'')+'" style="font:900 34px monospace;letter-spacing:8px;width:220px;text-align:center;background:#0e0a0c;color:#ffe6b0;border:2px solid #8a6a3a;padding:6px"><br><button id="mpGo" style="'+MP_BTN+'">Join</button>');
  const go=()=>{ const c=d.querySelector('#mpCodeIn').value.toUpperCase().replace(/[^A-Z0-9]/g,''); if(c.length<4) return; mpClosePanel(); try{ Sound.unlock(); }catch(e){} mpGuestConnect(c); };
  d.querySelector('#mpGo').onclick=go; d.querySelector('#mpCodeIn').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); }
