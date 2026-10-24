// =====================================================================
// DUO CINEMATICS: the Getsuga clash (phase I -> II) and Caotan's Domain Expansion (phase II -> III)
// =====================================================================
TW.mash=null; TW.qte=null;
// count button presses for the clash mash and the domain dodge QTE
(function(){ const pr=press; press=function(a){ if(!held[a]) twOnPress(a); return pr(a); }; })();
function twOnPress(a){ if(TW.mash&&a==='attack') TW.mash.n++; if(TW.qte&&a==='dash') TW.qte.press(performance.now()/1000); }
ui.addEventListener('pointerdown',e=>{ if(TW.mash&&e.pointerType!=='mouse') TW.mash.n++; },true);
function twBeamTo(m,x0,y0,z0,x1,y1,z1,k){ const len=Math.hypot(x1-x0,y1-y0,z1-z0)||.01; m.position.set(x0,y0,z0); m.lookAt(x1,y1,z1); m.scale.set(k,k,len); }

function* twGetsugaClash(F,C,O){ const P=Player, A=TW.allies.find(a=>a.who==='ali'), c=F.center, gy=groundY(c.x,c.z);
  C.down=O.down=0; C.inv=O.inv=true; C.mv=O.mv=null; C.gen=O.gen=null;
  Object.assign(P,{x:c.x-5,z:c.z+.4,vx:0,vz:0,f:1,ang:0}); P.y=groundY(P.x,P.z);
  if(A){ A.x=c.x-5.4; A.z=c.z-1.3; A.f=1; A.hold=1; }
  Object.assign(O,{x:c.x+4.6,z:c.z,lockF:1,f:-1}); Object.assign(C,{x:c.x+6.8,z:c.z-1.7,lockF:1,f:-1});
  cineSet(c.x,2.4,c.z+12,c.x,1.4,c.z); yield wait(.4);
  yield say('shayan',"They're wide open! Ali, you thinking what I'm thinking?");
  yield say('ali',"I'm thinking you talk too much.");
  cineSet(P.x-2.4,1.3,P.z+3.8,P.x+1.6,1.6,P.z); P.charge=2; Sound.sfx('charge');
  yield say('shayan',"GETSUGA...",'angry'); yield say('ali',"...TENSHOU.");
  // twin crescents launch... and stop dead in the air
  const hb=[beamMesh(0x6ac8ff,.55),beamMesh(0xffffff,.22)], ab=[beamMesh(0xff2a3a,.5),beamMesh(0xffe0e0,.2)], ob=[beamMesh(0x1a0626,.75),beamMesh(0xb06aff,.3)];
  const all=hb.concat(ab,ob); all.forEach(m=>{ m.userData.tw=1; m.visible=false; scene.add(m); });
  const hx=P.x+.8, ax=A?A.x+.8:hx, by=gy+1.4; let cx=c.x+3.4, k=0; P.charge=0; Sound.sfx('crossboom'); FX.flash=.6; grade.uniforms.flashCol.value.set(.7,.85,1); shake(.6);
  hb.concat(ab).forEach(m=>m.visible=true);
  const draw=(px,ok)=>{ twBeamTo(hb[0],hx,by,P.z,px,by,c.z,k); twBeamTo(hb[1],hx,by,P.z,px,by,c.z,k); twBeamTo(ab[0],ax,by+.2,A?A.z:P.z,px,by,c.z,k*.9); twBeamTo(ab[1],ax,by+.2,A?A.z:P.z,px,by,c.z,k*.9);
    if(ok){ twBeamTo(ob[0],O.x-.6,by,O.z,px,by,c.z,k*1.1); twBeamTo(ob[1],O.x-.6,by,O.z,px,by,c.z,k*1.1); } };
  const anim={t:0}; Game.fxUpd.push(dt=>{ anim.t+=dt; if(anim.dead) return false; k=Math.min(1,k+dt*4)*(1+Math.sin(anim.t*50)*.06); draw(cx,anim.omar); if(anim.omar&&Math.random()<.8) FX.spawn(cx,by+rnd(-.6,.6),c.z+rnd(-.6,.6),rnd(-4,4),rnd(-2,4),rnd(-4,4),.4,[0xffffff,0x6ac8ff,0xb06aff,0xff2a3a][Math.floor(Math.random()*4)],.3,0,true); return true; });
  cineSet(c.x+1,2,c.z+9,c.x+2.5,1.5,c.z); yield wait(.5);
  // Omar walks into the beam's path like it's a light drizzle
  cineSet(O.x-2.6,1.6,O.z+3.4,O.x,2,O.z); yield wait(.3);
  yield say('omar',"Getsuga Tenshou?");
  yield say('omar',"You think you're the only ones who can use Getsuga Tenshou?",'angry');
  yield say('caotan',"Omar, NO! You don't even have the right sword for that!");
  yield say('omar',"I have a scythe. And a dark past. That is ninety percent of the technique.");
  O.scythe=1; O.cast=1; cineSet(O.x-1.8,1.2,O.z+2.6,O.x-.4,1.8,O.z); Sound.sfx('void'); FX.burst(O.x,O.y+1.5,O.z,40,0x1a0626,6,.5,false);
  yield say('omar',"GETSUGA... TENSHOU.",'angry');
  ob.forEach(m=>m.visible=true); anim.omar=1; Sound.sfx('crossboom'); Sound.sfx('beam'); FX.flash=.8; grade.uniforms.flashCol.value.set(.6,.3,1); impactFrame([[3,2],[1,2]]); shake(1);
  // ---------- the clash: mash attack ----------
  cineSet(c.x,2.6,c.z+10.5,c.x,1.5,c.z); const M=TW.mash={v:0,n:0,t:0,dur:4.6,shown:0}; hit.attack=false;
  while(M.t<M.dur){ const dt=1/30; yield wait(dt); M.t+=dt; const pushes=M.n; M.n=0; M.v=clamp(M.v+pushes*.075-dt*.55,-1,1); M.shown+=pushes;
    const lo=hx+1.5, hi=O.x-1.2; cx=lerp(cx,lerp(lo,hi,(M.v+1)/2),.25); if(pushes) { Sound.sfx('hit'); shake(.12); } if(Math.random()<.2) Sound.sfx('slam'); FX.flash=Math.max(FX.flash,.08); }
  const win=M.v>.15; TW.mash=null; hit.attack=false;
  // they blow up and cancel each other out
  anim.dead=1; all.forEach(m=>scene.remove(m)); FX.flash=1; grade.uniforms.flashCol.value.set(1,1,1); impactFrame([[1,3],[2,2],[3,3],[1,2]]); Sound.sfx('crossboom'); Sound.sfx('skyopen'); shake(1.6); FX.hitstop=.15;
  for(let i=0;i<5;i++) FX.ring(cx,gy+.3,c.z,i%2?'#b06aff':'#9fd8ff',4+i*3,.5+i*.12); FX.burst(cx,by,c.z,120,0xffffff,12,.6); FX.burst(cx,by,c.z,60,0x1a0626,10,.6,false);
  yield tween(P,{x:P.x-3.5},.35,t=>1-Math.pow(1-t,3)); if(A){ A.x-=3.5; } P.cineAnim='jump'; O.x+=1.2;
  cineSet(P.x-1.5,1.3,P.z+4,P.x+1,1.4,P.z); yield wait(.5); P.cineAnim=null;
  yield say('shayan',"He CAN do it?!",'surprised'); yield say('ali',"...He copied my homework.");
  cineSet(O.x-2.4,1.5,O.z+3.2,O.x,1.8,O.z); yield say('omar',win?"...My scythe is chipped. That was a rental.":"I watched one episode.");
  yield say('caotan',"He watched ALL the episodes. Twice. He cried at the Hollowfication.");
  yield say('omar',"...I did not cry.");
  if(win){ F.bonusStun={who:[O],t:3}; twBig('CLASH WON',{size:56,col:'#9fd8ff',sub:'Omar starts the next phase dazed',dur:1.6}); }
  if(A) A.hold=0; O.scythe=0; O.lockF=C.lockF=0; }

function* twCaotanDomain(F,C,O){ const P=Player, A=TW.allies.find(a=>a.who==='ali'), c=F.center, gy=groundY(c.x,c.z);
  C.down=O.down=0; C.inv=O.inv=true; C.mv=O.mv=null; Object.assign(C,{x:c.x,z:c.z-3,lockF:1,f:1}); Object.assign(O,{x:c.x+5,z:c.z-4.5});
  Object.assign(P,{x:c.x,z:c.z+3.6,vx:0,vz:0}); P.y=groundY(P.x,P.z); if(A){ A.x=c.x-1.8; A.z=c.z+3.9; }
  cineSet(C.x,1.9,C.z+4.2,C.x,2,C.z); yield wait(.3);
  yield say('caotan',"Omar got a cool moment."); yield say('caotan',"Omar NEVER gets a cool moment. Do you know what that means?");
  yield say('omar',"Please don't."); yield say('caotan',"It means it's MY turn.",'angry');
  Game.timeScale=.6; cineSet(C.x+.4,2.3,C.z+2.2,C.x,2.3,C.z); Sound.sfx('gong'); FX.flash=.5; grade.uniforms.flashCol.value.set(1,.6,.9);
  yield say('caotan',"Domain Expansion...");
  // the arena becomes a pink void full of floating glasses
  const g=new THREE.Group(); g.userData.tw=1; const dome=new THREE.Mesh(new THREE.SphereGeometry(30,32,16),new THREE.MeshBasicMaterial({color:0x2a0a24,side:THREE.BackSide,transparent:true,opacity:0,depthWrite:false})); g.add(dome);
  const lens=[]; for(let i=0;i<26;i++){ const r=new THREE.Mesh(new THREE.TorusGeometry(rnd(.6,1.6),.08,6,24),new THREE.MeshBasicMaterial({color:i%2?0xff9ad8:0xffffff,transparent:true,opacity:0})); const a=rnd(0,6.28), d=rnd(8,22);
    r.position.set(c.x+Math.cos(a)*d,gy+rnd(2,12),c.z+Math.sin(a)*d); r.userData.sp=rnd(.3,1.2); g.add(r); lens.push(r); }
  g.position.set(0,0,0); dome.position.set(c.x,gy,c.z); scene.add(g); const DM={t:0,k:0,out:0};
  Game.fxUpd.push(dt=>{ DM.t+=dt; DM.k=DM.out?Math.max(0,DM.k-dt*2):Math.min(1,DM.k+dt*.8); dome.material.opacity=.85*DM.k; lens.forEach(r=>{ r.material.opacity=DM.k; r.rotation.y+=dt*r.userData.sp; r.rotation.x+=dt*r.userData.sp*.5; r.position.y+=Math.sin(DM.t*2+r.userData.sp*9)*.01; });
    if(Math.random()<.4*DM.k) FX.spawn(c.x+rnd(-12,12),gy+rnd(0,8),c.z+rnd(-10,10),0,rnd(.2,1),0,1.2,Math.random()<.5?0xff9ad8:0xffffff,.2,0,true); if(DM.out&&DM.k<=0){ scene.remove(g); return false; } return true; });
  twCutin('caotan','INFINITE MEGANE VOID','Domain Expansion  ·  every glint is guaranteed to hit','#ff6ab0',2.4); Sound.sfx('skyopen'); grade.uniforms.tint.value.set(1.2,.85,1.1); Game.timeScale=1;
  yield say('caotan',"...INFINITE. MEGANE. VOID.",'angry');
  cineSet(C.x,2.1,C.z+2.6,C.x,2.1,C.z); C.noGlasses=1; Sound.sfx('sparkle'); for(let i=0;i<3;i++) FX.burst(C.x,C.y+2,C.z,30,i%2?0xff9ad8:0xffffff,4,.5);
  yield say('',"Caotan slowly removes his glasses. The wind picks up. Somewhere, roses bloom for no reason.");
  yield say('shayan',"...They're just eyes.");
  if(A) yield say('ali',"Normal eyes. Slightly tired.");
  yield say('caotan',"THEY'RE BEAUTIFUL AND YOU KNOW IT. Inside my domain, every glint is GUARANTEED to hit.");
  yield say('caotan',"Unless you dodge at the exact moment. Which is technically also guaranteed. SHUT UP.");
  // ---------- QTE: dash on each glint ----------
  cineSet(P.x,4.2,P.z+7.5,(P.x+C.x)/2,1.4,(P.z+C.z)/2); twBig('DASH ON THE GLINT',{size:50,col:'#ffd0ec',y:UH*.28,dur:1.8,sub:IS_TOUCH()?'Tap the dash button the instant his eyes flash':'Shift / K / C the instant his eyes flash'}); yield wait(1.6);
  let dodged=0; const N=5;
  for(let i=0;i<N;i++){ yield wait(rnd(.7,1.7)); const Q=TW.qte={g:0,ok:false,spam:-9,press(t){ if(!this.g){ this.spam=t; return; } if(!this.ok&&t-this.g<.42&&this.spam<this.g-.25) this.ok=true; }};
    const t0=performance.now()/1000; Q.g=t0; C.push=.4; C.glintT=.5; Sound.sfx('ting'); FX.flash=.35; grade.uniforms.flashCol.value.set(1,1,1); FX.burst(C.x,C.y+2.1,C.z,16,0xffffff,4,.25);
    while(performance.now()/1000-t0<.42&&!Q.ok) yield wait(1/60);
    const lz=P.z, lx=P.x, bm=[beamMesh(0xff9ad8,.5),beamMesh(0xffffff,.2)]; bm.forEach(m=>{ m.userData.tw=1; scene.add(m); twBeamTo(m,C.x,C.y+2,C.z,lx,gy+1.1,lz,1); });
    const fb={t:0}; Game.fxUpd.push(dt=>{ fb.t+=dt; const kk=Math.max(.01,1-fb.t/.25); bm.forEach(m=>{ m.scale.x=m.scale.y=kk; }); if(fb.t>.25){ bm.forEach(m=>scene.remove(m)); return false; } return true; });
    Sound.sfx('beam');
    if(Q.ok){ dodged++; const s=i%2?1:-1; FX.burst(P.x,P.y+1,P.z,14,0x8fd3ff,4,.25); P.x+=s*1.4; Sound.sfx('dash'); Game.dmgNums.push({x:P.x,y:P.y+2.6,z:P.z,n:'DODGED '+dodged+'/'+N,t:0,big:true,col:'#bfe8ff'}); }
    else { P.hp=Math.max(1,P.hp-2); FX.flash=.4; grade.uniforms.flashCol.value.set(.9,.1,.15); shake(.4); Sound.sfx('hurt'); Game.dmgNums.push({x:P.x,y:P.y+2.6,z:P.z,n:'GUARANTEED',t:0,big:true,col:'#ff8ab0'}); }
    TW.qte=null; }
  yield wait(.5);
  if(dodged>=N){ Sound.sfx('glass'); Sound.sfx('shatter'); FX.flash=1; impactFrame([[2,2],[1,2]]); shake(1); DM.out=1; F.bonusStun={who:[C],t:3.5};
    cineSet(C.x,1.9,C.z+3.6,C.x,2,C.z); yield say('caotan',"Five for five?! My domain... has a refund policy... I'm invoking it...",'surprised'); }
  else if(dodged>=3) yield say('caotan',"Not bad, senpai. Not GOOD. But not bad.");
  else yield say('caotan',"Guaranteed. Told you. It's in the name. The name is guaranteed.");
  DM.out=1; C.noGlasses=0; applyLook(L.look); C.lockF=0; }

// splice them into the phase transitions
(function(){ const pc=twDuoPhaseCine; twDuoPhaseCine=function*(F,C,O){ if(F.phase===1&&!F.clashDone){ F.clashDone=1; yield* twGetsugaClash(F,C,O); }
    yield* pc(F,C,O); }; })();
