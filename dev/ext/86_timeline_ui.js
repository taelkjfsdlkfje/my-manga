// ---------- the timeline menu (drawn on the UI canvas, mouse + keyboard + touch) ----------
const TL_TABS=["Shayan's Road","Ali's Road","Oddities & Paul"];
const TLM={open:false,tab:0,sel:null,hover:null,t:0,rects:[]};
function twTimelineMenu(){ const w={type:'tlmenu'}; TLM.open=true; TLM.t=0; TLM.tab=(twAllDone()&&!TWS.paulDone)?2:ALI()?1:0; const first=TL.filter(n=>n.tab===TLM.tab&&twNodeOpen(n)&&!n.root).pop(); TLM.sel=first?first.id:TL.find(n=>n.tab===TLM.tab).id; Sound.sfx('secret'); return w; }
function twTimelineClose(id){ if(!TLM.open) return; TLM.open=false; Sound.sfx(id?'select':'blip'); if(Game.wait&&Game.wait.type==='tlmenu'){ Game.wait=null; Game.sv=id||null; step(); } }
function tlCardPos(n){ const x0=338, span=(1170-338-108)/6, y=110+n.row*150; return {x:x0+n.col*span,y,w:108,h:82}; }
let TL_PAPER=null;
function tlPaper(){ if(TL_PAPER) return TL_PAPER; const [cv,c]=mkCanvas(860,488); const g=c.createLinearGradient(0,0,860,488); g.addColorStop(0,'#cdb488'); g.addColorStop(.5,'#c4a878'); g.addColorStop(1,'#b8996a'); c.fillStyle=g; c.fillRect(0,0,860,488);
  for(let i=0;i<4000;i++){ c.fillStyle=`rgba(${hash(i,1)>.5?'90,60,30':'255,240,210'},${hash(i,2)*.08})`; c.fillRect(hash(i,3)*860,hash(3,i)*488,2,2); }
  c.strokeStyle='rgba(90,60,30,.12)'; c.lineWidth=1; for(let k=0;k<14;k++){ c.beginPath(); let x=hash(k,5)*860, y=hash(5,k)*488; c.moveTo(x,y); for(let j=0;j<8;j++){ x+=rnd(-40,40); y+=rnd(-20,20); c.lineTo(x,y); } c.stroke(); }
  // a faint compass and mountains, like an old campaign map
  c.strokeStyle='rgba(70,45,20,.35)'; c.lineWidth=1.5; c.beginPath(); c.arc(800,58,26,0,7); c.stroke(); for(let a=0;a<8;a++){ const r=a%2?14:30; c.beginPath(); c.moveTo(800,58); c.lineTo(800+Math.cos(a*Math.PI/4-Math.PI/2)*r,58+Math.sin(a*Math.PI/4-Math.PI/2)*r); c.stroke(); }
  c.fillStyle='rgba(70,45,20,.4)'; c.font='bold 12px serif'; c.fillText('N',796,24);
  for(let m=0;m<10;m++){ const x=hash(m,8)*860, y=380+hash(8,m)*90; c.beginPath(); c.moveTo(x,y); c.lineTo(x+20,y-26); c.lineTo(x+40,y); c.stroke(); }
  TL_PAPER=cv; return cv; }
function tlBtn(x,y,w,h,label,on,id){ D.fillStyle=on?'rgba(60,40,20,.95)':'rgba(30,22,16,.9)'; D.fillRect(x,y,w,h); D.strokeStyle=on?'#e8c070':'#8a6a3a'; D.lineWidth=2; D.strokeRect(x+2,y+2,w-4,h-4);
  D.font=`700 17px ${FD}`; D.fillStyle=on?'#ffe6b0':'#cdb48a'; D.textAlign='center'; D.fillText(label,x+w/2,y+h/2+6); D.textAlign='left'; TLM.rects.push({x,y,w,h,id}); }
function tlWrap(text,x,y,maxW,lh,font,col){ D.font=font; D.fillStyle=col; const lines=wrap(text,maxW); lines.forEach((l,i)=>D.fillText(l,x,y+i*lh)); return lines.length; }
function twDrawTimeline(){ if(!TLM.open) return; TLM.t+=1/60; TLM.rects=[]; const t=TLM.t, a=Math.min(1,t*5);
  D.save(); D.globalAlpha=a; D.fillStyle='rgba(8,6,10,.94)'; D.fillRect(0,0,UW,UH);
  // frame
  D.strokeStyle='#8a6a3a'; D.lineWidth=3; D.strokeRect(10,10,UW-20,UH-20); D.strokeStyle='rgba(216,180,106,.4)'; D.lineWidth=1; D.strokeRect(16,16,UW-32,UH-32);
  // tabs
  const tw=210, tx0=UW/2-tw*1.5; TL_TABS.forEach((nm,i)=>{ const x=tx0+i*tw, on=i===TLM.tab; if(on){ D.fillStyle='rgba(70,48,24,.95)'; D.fillRect(x+6,20,tw-12,40); D.strokeStyle='#e8c070'; D.lineWidth=2; D.strokeRect(x+8,22,tw-16,36);
      D.fillStyle='#e8c070'; for(const dx of [x+8,x+tw-8]){ D.save(); D.translate(dx,40); D.rotate(Math.PI/4); D.fillRect(-5,-5,10,10); D.restore(); } }
    D.font=`700 19px ${FD}`; D.fillStyle=on?'#ffe6b0':'#a8906a'; D.textAlign='center'; D.fillText(nm,x+tw/2,47); D.textAlign='left'; TLM.rects.push({x,y:20,w:tw,h:40,id:'tab'+i}); });
  tlBtn(UW-150,22,124,36,'Close  ✕',false,'close');
  // left panel: the selected checkpoint
  const n=TL_BY[TLM.sel]||TL[0], open=twNodeOpen(n); D.fillStyle='rgba(20,16,22,.92)'; D.fillRect(24,72,282,580); D.strokeStyle='#8a6a3a'; D.lineWidth=2; D.strokeRect(28,76,274,572);
  D.font=`700 13px ${FB}`; D.fillStyle='#a8906a'; D.fillText(n.root?'START OF THE ROAD':n.final?'???':open?'CHECKPOINT CLEARED':'CHECKPOINT LOCKED',44,104);
  tlWrap(open?n.name:'???',44,132,250,26,`700 21px ${FD}`,'#f3dfae');
  const art=open?twArt(n.id):twArtLocked(); D.imageSmoothingEnabled=false; D.drawImage(art,40,196,250,141); D.strokeStyle='#c9a24a'; D.lineWidth=2; D.strokeRect(40,196,250,141);
  tlWrap(open?n.desc:(n.final?"Clear every checkpoint on every road. Then talk to Paul.":"Reach this point in the story and Paul will remember it."),44,366,250,21,`500 15px ${FB}`,'#d8d0c0');
  const tot=TL_CHECKS.length, done=TL_CHECKS.filter(twDone).length; D.font=`700 14px ${FB}`; D.fillStyle='#c9a24a'; D.fillText('Checkpoints cleared  '+done+' / '+tot,44,560);
  D.fillStyle='rgba(10,8,12,.8)'; D.fillRect(44,570,246,8); D.fillStyle='#c9a24a'; D.fillRect(44,570,246*done/tot,8);
  if(open&&!n.root) tlBtn(44,592,246,44,n.final?'Face Paul':'Warp here',true,'warp'); else { D.font=`italic 500 14px ${FB}`; D.fillStyle='#8a7a6a'; D.fillText(n.root?'Every road starts here.':'Locked',44,620); }
  // the map
  D.drawImage(tlPaper(),316,72,860,488); D.strokeStyle='#5a3a1a'; D.lineWidth=3; D.strokeRect(316,72,860,488); D.font=`700 26px ${FD}`; D.fillStyle='#3a2410'; D.fillText('Timeline',340,108);
  const nodes=TL.filter(m=>m.tab===TLM.tab);
  for(const m of nodes) for(const pid of (m.par||[])){ const p=TL_BY[pid]; if(!p||p.tab!==TLM.tab) continue; const A=tlCardPos(p), B=tlCardPos(m), x0=A.x+A.w, y0=A.y+A.h/2, x1=B.x, y1=B.y+B.h/2, both=twNodeOpen(p)&&twNodeOpen(m), half=twNodeOpen(p);
    D.save(); D.lineWidth=both?4:3; D.strokeStyle=both?'#c9922a':half?'#5a6e98':'rgba(70,60,50,.6)'; if(!half) D.setLineDash([7,6]); D.beginPath(); D.moveTo(x0,y0); D.bezierCurveTo(x0+40,y0,x1-40,y1,x1,y1); D.stroke(); D.restore();
    D.save(); D.translate(x1-2,y1); D.rotate(Math.PI/4); D.fillStyle=both?'#e8c070':'#6a7a98'; D.fillRect(-5,-5,10,10); D.strokeStyle='#2a1a0a'; D.lineWidth=1.5; D.strokeRect(-5,-5,10,10); D.restore(); }
  for(const m of nodes){ const R2=tlCardPos(m), op=twNodeOpen(m), sel=m.id===TLM.sel, hov=m.id===TLM.hover;
    if(sel){ D.fillStyle=`rgba(255,220,140,${.35+.2*Math.sin(t*6)})`; D.fillRect(R2.x-6,R2.y-6,R2.w+12,R2.h+12); }
    D.fillStyle='#1a120c'; D.fillRect(R2.x-3,R2.y-3,R2.w+6,R2.h+6); const im=op?twArt(m.id):twArtLocked(); D.imageSmoothingEnabled=false; D.drawImage(im,R2.x,R2.y,R2.w,R2.h-22);
    if(m.final&&op){ D.fillStyle=`rgba(255,0,60,${.15+.15*Math.random()})`; D.fillRect(R2.x+rnd(-3,3),R2.y,R2.w,R2.h-22); }
    D.fillStyle=op?'#ead2a0':'#6a5a4a'; D.fillRect(R2.x-2,R2.y+R2.h-22,R2.w+4,22); D.strokeStyle=sel?'#ffffff':hov?'#ffe0a0':op?'#c9a24a':'#5a4a3a'; D.lineWidth=sel?3:2; D.strokeRect(R2.x-3,R2.y-3,R2.w+6,R2.h+6);
    D.font=`700 11px ${FB}`; D.fillStyle='#2a1808'; D.textAlign='center'; const nm=op?m.name:'???'; const ls=wrap(nm,R2.w-4); D.fillText(ls[0]+(ls.length>1?'…':''),R2.x+R2.w/2,R2.y+R2.h-7); D.textAlign='left';
    if(op&&!m.root&&(!m.final||TWS.paulDone)){ D.fillStyle='#2a8a4a'; D.beginPath(); D.arc(R2.x+R2.w-4,R2.y+4,10,0,7); D.fill(); D.strokeStyle='#e8ffe0'; D.lineWidth=2.5; D.beginPath(); D.moveTo(R2.x+R2.w-9,R2.y+4); D.lineTo(R2.x+R2.w-5,R2.y+8); D.lineTo(R2.x+R2.w+2,R2.y-1); D.stroke(); }
    TLM.rects.push({x:R2.x-3,y:R2.y-3,w:R2.w+6,h:R2.h+6,id:'node:'+m.id}); }
  // legend + controls
  D.fillStyle='rgba(20,16,22,.92)'; D.fillRect(316,572,860,80); D.strokeStyle='#8a6a3a'; D.lineWidth=2; D.strokeRect(320,576,852,72);
  const lg=[['#c9922a','Cleared path',false],['#5a6e98','Next up',false],['rgba(140,120,100,.8)','Locked / unknown',true]]; lg.forEach(([c2,l2,dash],i)=>{ const y=598+i*18; D.save(); D.strokeStyle=c2; D.lineWidth=3; if(dash) D.setLineDash([6,5]); D.beginPath(); D.moveTo(340,y-4); D.lineTo(378,y-4); D.stroke(); D.restore(); D.font=`600 13px ${FB}`; D.fillStyle='#d8c8a8'; D.fillText(l2,388,y); });
  D.font=`600 14px ${FB}`; D.fillStyle='#d8c8a8'; D.fillText(IS_TOUCH()?'Tap a checkpoint to select it, tap again (or Warp here) to go.':'Arrows select · E / Enter warps · Q switches tab · Esc closes · click works too',560,604);
  D.font=`italic 500 13px ${FB}`; D.fillStyle='#a8906a'; D.fillText('Warping replays a checkpoint from its start. Your progress is saved on this device.',560,628);
  D.restore(); }
function tlMove(dx,dy){ const nodes=TL.filter(m=>m.tab===TLM.tab), cur=TL_BY[TLM.sel]; if(!cur||cur.tab!==TLM.tab){ TLM.sel=nodes[0].id; return; } const c=tlCardPos(cur); let best=null,bd=1e9;
  for(const m of nodes){ if(m===cur) continue; const p=tlCardPos(m), vx=p.x-c.x, vy=p.y-c.y, along=vx*dx+vy*dy; if(along<=4) continue; const d=along+Math.abs(vx*dy-vy*dx)*2.2; if(d<bd){ bd=d; best=m; } } if(best){ TLM.sel=best.id; Sound.sfx('blip'); } }
function tlTab(i){ TLM.tab=(i+3)%3; const ns=TL.filter(m=>m.tab===TLM.tab); const o=ns.filter(m=>twNodeOpen(m)&&!m.root).pop()||ns[0]; TLM.sel=o.id; Sound.sfx('blip'); }
function tlActivate(id){ if(!id) return; if(id==='close'){ twTimelineClose(null); return; } if(id.startsWith('tab')){ tlTab(+id.slice(3)); return; }
  if(id==='warp'){ const n=TL_BY[TLM.sel]; if(n&&twNodeOpen(n)&&!n.root) twTimelineClose(n.id); else Sound.sfx('block'); return; }
  if(id.startsWith('node:')){ const nid=id.slice(5); if(TLM.sel===nid){ const n=TL_BY[nid]; if(twNodeOpen(n)&&!n.root) twTimelineClose(nid); else Sound.sfx('block'); } else { TLM.sel=nid; Sound.sfx('blip'); } } }
addEventListener('keydown',e=>{ if(!TLM.open) return; const k=e.code; let used=true;
  if(k==='Escape'||k==='Backspace') twTimelineClose(null);
  else if(k==='ArrowLeft'||k==='KeyA') tlMove(-1,0); else if(k==='ArrowRight'||k==='KeyD') tlMove(1,0); else if(k==='ArrowUp'||k==='KeyW') tlMove(0,-1); else if(k==='ArrowDown'||k==='KeyS') tlMove(0,1);
  else if(k==='KeyQ'||k==='Tab') tlTab(TLM.tab+(e.shiftKey?-1:1)); else if(k==='KeyE'||k==='Enter'||k==='Space') tlActivate('warp'); else used=false;
  if(used){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
function tlPt(e){ const r=ui.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*UW,(e.clientY-r.top)/r.height*UH]; }
function tlHit(x,y){ for(let i=TLM.rects.length-1;i>=0;i--){ const q=TLM.rects[i]; if(x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h) return q.id; } return null; }
ui.addEventListener('pointerdown',e=>{ if(!TLM.open) return; e.preventDefault(); e.stopImmediatePropagation(); const [x,y]=tlPt(e); tlActivate(tlHit(x,y)); },true);
ui.addEventListener('pointermove',e=>{ if(!TLM.open) return; const [x,y]=tlPt(e), h=tlHit(x,y); TLM.hover=h&&h.startsWith('node:')?h.slice(5):null; },true);
(function(){ const du=drawUI; drawUI=function(){ du(); if(TLM.open) try{ twDrawTimeline(); }catch(e){ console.error('timeline',e); } }; })();

// ---------- Paul, rewritten: the man with the timeline ----------
function* paulTalk2(){ const all=twAllDone();
  if(all&&!TWS.paulDone){ yield say('paul',"...Huh.");
    yield say('paul',"You did it. All of it. Every road. Every branch. Every twin. Every pig. Both protagonists.");
    yield say('paul',"Do you know how long it took to make all of that? Do you have ANY idea how many times I had to rewrite Caotan's glasses?");
    yield say('paul',"There is nothing left. You have done everything in this game.");
    yield say('paul',"...Except one last thing.");
    const c=yield choose([{t:"What last thing?"},{t:"Just show me the timeline."},{t:"I'm good, thanks."}]);
    if(c===1){ yield say('paul',"Fine. It's on the last tab when you're ready. I'll be waiting. Menacingly."); const id=yield twTimelineMenu(); if(id) yield* twWarp(id); return; }
    if(c===2){ yield say('paul',"No you're not. Come back when you're ready. I'll be here. Forever. Unfortunately."); return; }
    yield say('paul',"Hold still. This will only hurt everyone.");
    yield* twPaulIntro(); return; }
  yield say('paul',"Psst. Over here. Don't mind the hood.");
  if(!TWS.met){ TWS.met=1; twSave(); yield say('paul',"I keep a timeline of every road you walk. Every branch, every dumb decision. Clear a checkpoint once, and I can drop you right back at it.");
    yield say('paul',"Everything you haven't seen yet is a question mark. Go make them not question marks."); }
  else if(TWS.paulDone) yield say('paul',"Oh. It's you. The one who beat me. I'm fine. I'm totally fine. Here's your stupid timeline.");
  else yield say('paul',"Back for the timeline? Of course you are.");
  const id=yield twTimelineMenu();
  if(!id){ yield say('paul',"Suit yourself. I'll be around. Probably."); return; }
  const n=TL_BY[id]; if(id==='paul'){ yield* twWarp('paul'); return; }
  if(n.name==='THE DECISION') yield say('paul',"The big decision. Choose wisely. Or don't. I have all of them saved.");
  else if(id.startsWith('al_')) yield say('paul',"Ali's road. Try not to cut the moon on the way.");
  else yield say('paul',"Shayan's road. Mind the forge sparks.");
  yield* twWarp(id); }
SCR.paul=paulTalk2; SCR_BASE.paul=paulTalk2; SCRA.paul=paulTalk2;
