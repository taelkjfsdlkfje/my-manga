// ---------- HUD: boss bars, glint counters, cut-ins, darkness, dating sim, timers ----------
let TW_OFF=null;
function twDrawDark(){ const K=TW.dark; if(!K||K.k<=0.01) return; if(!TW_OFF){ TW_OFF=document.createElement('canvas'); TW_OFF.width=UW; TW_OFF.height=UH; }
  const c=TW_OFF.getContext('2d'); c.globalCompositeOperation='source-over'; c.clearRect(0,0,UW,UH); c.fillStyle=`rgba(2,0,6,${.97*K.k})`; c.fillRect(0,0,UW,UH);
  c.globalCompositeOperation='destination-out'; const P=Player, hole=(x,y,r,a)=>{ const g=c.createRadialGradient(x,y,r*.2,x,y,r); g.addColorStop(0,`rgba(0,0,0,${a})`); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); };
  const [px,py]=toScreen(P.x,P.y+1,P.z); hole(px,py,(K.r||170)*(1+.04*Math.sin(performance.now()/180)),1);
  for(const b of BOLTS) if(!b.dead){ const [bx,by,bz]=toScreen(b.x,b.y,b.z); if(bz<1) hole(bx,by,b.friendly?70:58,.95); }
  for(const h of TW.hz) if(h.light){ const [hx,hy,hz]=toScreen(h.light.x,h.light.y,h.light.z); if(hz<1) hole(hx,hy,h.light.r||80,.9); }
  c.globalCompositeOperation='source-over'; D.drawImage(TW_OFF,0,0);
  // eyes in the dark
  const t=performance.now()/1000; for(const e of (K.eyes||[])){ if(e.dead) continue; const [ex,ey,ez]=toScreen(e.x,e.y,e.z); if(ez>1) continue; const bl=(Math.sin(t*1.7+e.ph)>.93)?.15:1, s=e.s||1;
    D.save(); D.globalAlpha=K.k*bl*(e.a==null?1:e.a); D.shadowColor='#ff1a2a'; D.shadowBlur=26; D.fillStyle=e.real&&K.tell?'#ffffff':'#ff2a3a';
    D.beginPath(); D.ellipse(ex-16*s,ey,9*s,5*s,-.2,0,7); D.fill(); D.beginPath(); D.ellipse(ex+16*s,ey,9*s,5*s,.2,0,7); D.fill(); D.restore(); }
  if(K.lantern){ D.save(); D.globalAlpha=.75*K.k; D.font=`700 16px ${FB}`; D.fillStyle='#ffd27a'; D.textAlign='center'; D.fillText(K.lantern,px,py-110); D.restore(); } }
function twBarFor(T,x,y,w,big){ const t=performance.now()/1000, cao=T.who==='caotan', om=T.who==='omar';
  const name=T.title||NAMES[T.who]||T.who, colA=cao?(T.phase>=2?'#ff6ab0':'#e8e0d0'):om?'#7a2ac0':'#c86aff', colB=cao?(T.phase>=2?'#ffd0ec':'#ffffff'):om?'#d0a0ff':'#ffd0ff';
  D.font=`700 ${big?21:18}px ${FD}`; D.fillStyle=cao?'#ffe0f0':'#e0c8ff'; D.textAlign='center'; D.fillText(name,x+w/2,y-12);
  if(T.sub&&big){ D.font=`italic 600 13px ${FB}`; D.fillStyle='#b8a8c8'; D.fillText(T.sub,x+w/2,y+32); }
  D.textAlign='left'; D.fillStyle='rgba(10,6,12,.82)'; D.fillRect(x,y,w,15); const k=clamp(T.hp/T.maxHp,0,1); T.shown=T.shown==null?k:lerp(T.shown,k,.08);
  D.fillStyle='rgba(255,240,200,.55)'; D.fillRect(x,y,w*T.shown,15); D.fillStyle=colA; D.fillRect(x,y,w*k,15); D.fillStyle=colB; D.fillRect(x,y,w*k,5);
  if(T.inv){ D.fillStyle=`rgba(255,255,255,${.12+.1*Math.sin(t*8)})`; D.fillRect(x,y,w,15); }
  if(T.phase>=2&&!T.lcDone[T.phase]&&!TW.fight?.noLC){ D.fillStyle='#ffd45a'; D.fillRect(x+w/2-1,y-4,2,23); D.font=`900 10px ${FB}`; D.fillStyle='#ffd45a'; D.textAlign='center'; D.fillText('LIMIT',x+w/2,y-6); D.textAlign='left'; }
  D.strokeStyle='#d8b46a'; D.lineWidth=2; D.strokeRect(x,y,w,15);
  if(T.stun>0){ D.font=`900 14px ${FB}`; D.fillStyle=`hsl(${45+Math.sin(t*12)*10},100%,62%)`; D.textAlign='center'; D.fillText('STUNNED  ×1.6',x+w/2,y+(big&&T.sub?50:32)); D.textAlign='left'; }
  const nph=T.phases||3; for(let i=0;i<nph;i++){ D.fillStyle=i<nph-T.phase?'#d8b46a':'rgba(216,180,106,.25)'; D.beginPath(); D.arc(x+w+16+i*14,y+8,5,0,7); D.fill(); } }
function twDrawBars(){ const F=TW.fight; if(!F||F.noBar) return; const list=TW.foes.filter(T=>!T.gone&&!T.noBar), by=UH-52-Game.letter*70;
  if(list.length===1) twBarFor(list[0],(UW-620)/2,by,620,true);
  else if(list.length>=2){ const bw=330, gap=70; list.slice(0,2).forEach((T,i)=>twBarFor(T,UW/2-bw-gap/2+i*(bw+gap),by,bw,false)); } }
function twDrawGlints(){ for(const T of TW.foes.concat(TW.allies)){ if(T.gone||T.hide||!(T.glintT>0)||!T.glintN) continue; const [x,y,z]=toScreen(T.x,T.y+3*(T.scale||1),T.z); if(z>1) continue;
    D.save(); D.textAlign='center'; D.font=`900 ${24+T.glintT*20}px ${FB}`; D.lineWidth=5; D.strokeStyle='#1a0e24'; const s='✦×'+T.glintN; D.strokeText(s,x,y); D.fillStyle='#ffffff'; D.fillText(s,x,y); D.restore(); } }
function twDrawCutin(){ const C=TW.cutin; if(!C) return; C.t+=1/60; const u=C.t/C.dur; if(u>=1){ TW.cutin=null; return; }
  const inK=Math.min(1,C.t/.18), outK=Math.min(1,(C.dur-C.t)/.2), k=Math.min(inK,outK), h=150, y=UH*.36;
  D.save(); D.globalAlpha=k; D.translate(0,y); D.transform(1,-.08,0,1,0,0);
  D.fillStyle='rgba(0,0,0,.75)'; D.fillRect(0,-h/2-8,UW,h+16); const g=D.createLinearGradient(0,0,UW,0); g.addColorStop(0,C.col); g.addColorStop(.6,'rgba(20,0,30,.9)'); g.addColorStop(1,C.col); D.fillStyle=g; D.fillRect(0,-h/2,UW,h);
  for(let i=0;i<14;i++){ D.fillStyle='rgba(255,255,255,.12)'; D.fillRect(((i*137+C.t*1600)%(UW+200))-100,-h/2+((i*53)%h),180,2); }
  const px=lerp(-200,60,Math.min(1,C.t/.2)); try{ const pc=portrait(C.who,'angry'); D.imageSmoothingEnabled=false; D.drawImage(pc,0,0,56,56,px,-h/2-20,h+40,h+40); }catch(e){}
  D.font=`900 52px ${FD}`; D.fillStyle='#ffffff'; D.strokeStyle='#14001a'; D.lineWidth=6; const tx=lerp(UW+100,300,Math.min(1,C.t/.25)); D.strokeText(C.title,tx,8); D.fillText(C.title,tx,8);
  if(C.sub){ D.font=`italic 700 22px ${FB}`; D.fillStyle='#ffe0f0'; D.fillText(C.sub,tx+6,44); } D.restore(); }
function twDrawVN(){ const V=TW.vn; if(!V) return; const t=performance.now()/1000;
  // floating labels over the choice circles
  for(const o of (V.opts||[])){ const [x,y,z]=toScreen(o.x,1.8,o.z); if(z>1) continue; const w=Math.max(170,D.measureText(o.text).width+40);
    D.save(); D.font=`700 18px ${FB}`; const ww=D.measureText(o.text).width+34; D.fillStyle=o.res==='right'?'rgba(80,220,140,.92)':o.res==='wrong'?'rgba(220,40,80,.92)':'rgba(30,10,40,.88)';
    D.fillRect(x-ww/2,y-20,ww,32); D.strokeStyle=o.glint?'#ffffff':'#ff8ac8'; D.lineWidth=o.glint?3:2; D.strokeRect(x-ww/2,y-20,ww,32); D.fillStyle='#fff'; D.textAlign='center'; D.fillText(o.text,x,y+2);
    if(o.glint){ D.font=`900 26px ${FB}`; D.fillStyle='#ffffff'; D.fillText('✦',x+ww/2+12,y-12+Math.sin(t*10)*3); } D.restore(); }
  // the dating-sim text box
  if(V.q){ const bx=UW/2-430, by=UH-200; D.save(); D.fillStyle='rgba(255,236,246,.93)'; D.fillRect(bx,by,860,92); D.strokeStyle='#ff6ab0'; D.lineWidth=4; D.strokeRect(bx,by,860,92);
    D.fillStyle='#ff6ab0'; D.fillRect(bx+18,by-22,200,30); D.font=`900 18px ${FB}`; D.fillStyle='#fff'; D.fillText(V.speaker||'Caotan-senpai ♡',bx+30,by);
    D.font=`700 22px ${FB}`; D.fillStyle='#4a1030'; const n=Math.min(V.q.length,Math.floor((V.qt||0)*50)); D.fillText(V.q.slice(0,n),bx+30,by+40);
    if(V.timer!=null){ D.fillStyle='#ffd0e4'; D.fillRect(bx+30,by+62,800,10); D.fillStyle='#ff3a8a'; D.fillRect(bx+30,by+62,800*clamp(V.timer,0,1),10); }
    D.font=`700 13px ${FB}`; D.fillStyle='#a04070'; D.textAlign='right'; D.fillText('♡ AFFECTION '+(V.aff||0)+' / 3',bx+840,by+20); D.restore(); }
  if(V.flashT>0){ V.flashT-=1/60; D.save(); D.globalAlpha=Math.min(1,V.flashT*2); D.font=`900 64px ${FD}`; D.textAlign='center'; D.lineWidth=8; D.strokeStyle='#2a0018'; D.fillStyle=V.flashCol||'#ff6ab0'; D.strokeText(V.flash,UW/2,UH*.3); D.fillText(V.flash,UW/2,UH*.3); D.restore(); } }
function twDrawSentence(){ const S=TW.sentence; if(!S) return; const P=Player, [x,y,z]=toScreen(P.x,P.y+2.9,P.z); if(z>1) return; const t=performance.now()/1000;
  D.save(); D.textAlign='center'; D.font=`900 ${46+Math.max(0,S.pulse||0)*40}px ${FD}`; D.lineWidth=7; D.strokeStyle='#14001a'; D.fillStyle=S.n<=1?'#ff2a3a':'#c08aff';
  D.strokeText(S.n>0?String(S.n):'☠',x,y); D.fillText(S.n>0?String(S.n):'☠',x,y); D.font=`700 13px ${FB}`; D.fillStyle='#e0c8ff'; D.fillText('DEATH SENTENCE',x,y+18); D.restore(); S.pulse=Math.max(0,(S.pulse||0)-1/60*3); }
function twDrawHourglass(){ const H=TW.hg; if(!H) return; const k=clamp(H.left/H.total,0,1), x=UW/2, y=96; D.save(); D.translate(x,y);
  D.fillStyle='rgba(10,0,20,.75)'; D.fillRect(-150,-44,300,92); D.strokeStyle='#c9a24a'; D.lineWidth=3; D.strokeRect(-150,-44,300,92);
  D.fillStyle='#c9a24a'; D.fillRect(-26,-36,52,5); D.fillRect(-26,30,52,5); D.fillStyle='#bfe0ff'; D.beginPath(); D.moveTo(-22,-31); D.lineTo(22,-31); D.lineTo(0,0); D.lineTo(22,30); D.lineTo(-22,30); D.lineTo(0,0); D.closePath(); D.globalAlpha=.35; D.fill(); D.globalAlpha=1;
  D.fillStyle='#ffd27a'; D.beginPath(); D.moveTo(-22*k,-31+31*(1-k)); D.lineTo(22*k,-31+31*(1-k)); D.lineTo(0,0); D.closePath(); D.fill(); D.beginPath(); D.moveTo(-22*(1-k),30-30*(1-k)); D.lineTo(22*(1-k),30-30*(1-k)); D.lineTo(22,30); D.lineTo(-22,30); D.closePath(); D.fill();
  D.font=`900 15px ${FB}`; D.fillStyle='#ffd27a'; D.textAlign='left'; D.fillText(H.label||'SURVIVE',40,-8); D.font=`900 26px ${FB}`; D.fillStyle='#fff'; D.fillText(Math.ceil(H.left)+'s',40,22); D.restore(); }
function twDrawSpot(){ const S=TW.spot; if(!S||!(S.k>0)) return; if(!TW_OFF){ TW_OFF=document.createElement('canvas'); TW_OFF.width=UW; TW_OFF.height=UH; } const c=TW_OFF.getContext('2d');
  c.globalCompositeOperation='source-over'; c.clearRect(0,0,UW,UH); c.fillStyle=`rgba(8,0,14,${.82*S.k})`; c.fillRect(0,0,UW,UH); c.globalCompositeOperation='destination-out';
  for(const s of S.list){ const [x,y,z]=toScreen(s.x,0,s.z), [x2,y2]=toScreen(s.x+s.r,0,s.z), r=Math.abs(x2-x); if(z>1) continue; const g=c.createRadialGradient(x,y,r*.6,x,y,r*1.15); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.ellipse(x,y,r*1.15,r*.75,0,0,7); c.fill(); }
  c.globalCompositeOperation='source-over'; D.drawImage(TW_OFF,0,0); }
function twDrawBig(){ const B=TW.big; if(!B) return; B.t=(B.t||0)+1/60; const a=Math.min(1,B.t*4)*Math.min(1,((B.dur||1.2)-B.t)*4); if(a<=0){ TW.big=null; return; }
  D.save(); D.globalAlpha=a; D.textAlign='center'; D.font=`900 ${B.size||84}px ${FD}`; D.lineWidth=10; D.strokeStyle=B.stroke||'#14001a'; D.fillStyle=B.col||'#ffffff'; const s=1+Math.max(0,.15-B.t)*3;
  D.translate(UW/2,B.y||UH*.42); D.scale(s,s); D.strokeText(B.text,0,0); D.fillText(B.text,0,0); if(B.sub){ D.font=`italic 700 22px ${FB}`; D.lineWidth=5; D.strokeText(B.sub,0,40); D.fillStyle='#ffe0f0'; D.fillText(B.sub,0,40); } D.restore(); }
function twBig(text,o){ TW.big=Object.assign({text,t:0,dur:1.3},o||{}); }
(function(){ const dh=drawHUD; drawHUD=function(){ try{ twDrawSpot(); twDrawDark(); }catch(e){} dh(); try{ twDrawBars(); twDrawGlints(); twDrawSentence(); twDrawHourglass(); if(TW.giant) hzgBar(); }catch(e){ console.error('twHUD',e); } };
  const du=drawUI; drawUI=function(){ du(); if(Game.state==='title'||Game.state==='end'){ try{ twDrawBig(); }catch(e){} return; } try{ twDrawVN(); twDrawBig(); twDrawCutin(); }catch(e){ console.error('twUI',e); } }; })();
