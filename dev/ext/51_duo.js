// =====================================================================
// THE DOUBLE FIGHT: Shayan + AI Ali vs Caotan AND Omar
// =====================================================================
const DUO_HP=[0,115,135,155];
const DUO_POOL={
  1:[{both:{caotan:'goo',omar:'scythes'}},{both:{caotan:'glint1',omar:'hands'}},{both:{caotan:'letters',omar:'orbs'}},{duo:'glintDeath'},{duo:'spiral'}],
  2:[{both:{caotan:'goo',omar:'scythes'}},{both:{caotan:'glint1',omar:'hands'}},{both:{caotan:'letters',omar:'orbs'}},{duo:'glintDeath'},{duo:'spiral'},{duo:'valentine'},{duo:'rivalry'}],
  3:[{both:{caotan:'goo',omar:'scythes'}},{both:{caotan:'glint1',omar:'hands'}},{both:{caotan:'letters',omar:'orbs'}},{duo:'glintDeath'},{duo:'spiral'},{duo:'valentine'},{duo:'rivalry'},{duo:'pillowFort'},{duo:'doubleSentence'}]};
function drawCaomar(c,cx,by,f,s){ drawOmarBoss(c,cx,by,f,Object.assign({},s,{form:2,scythe:1})); const p=SH(c,cx,by,f), y=Math.round(Math.sin(s.t*2.6+1)*2);
  p(-11,-52+y,22,5,'#f6f3ec'); p(-3,-50+y,6,4,'#ff3a7a'); p(-8,-68+y,7,6,'#14141e'); p(1,-68+y,7,6,'#14141e'); p(-7,-67+y,5,4,s.glintT>0?'#ffffff':'#ffc8ec'); p(2,-67+y,5,4,s.glintT>0?'#ffffff':'#ffc8ec'); p(-1,-66+y,2,1,'#14141e');
  p(-8,-80+y,17,4,'#22160f'); p(-9,-78+y,17,2,'#ffffff'); if(s.glintT>0){ const k=Math.round(s.glintT*10); p(4-k,-66+y,8+2*k,1,'#ffffff'); p(4,-70+y-k,1,9+2*k,'#ffffff'); } }
function twWaitFor(M){ return function*(){ while(M.gen) yield .1; }; }
function twDuoStart(cx,cz,ox,oz){ const c=L.zone?{x:L.zone.x,z:L.zone.z}:{x:Player.x,z:Player.z}, lock=twArenaAround(c.x,c.z); twClearFoes();
  const mk=(who,x,z)=>{ const T=twMake(who,x,z,{hp:DUO_HP[1],maxHp:DUO_HP[1],phases:3,form:1,title:who==='caotan'?'Caotan Cummaster':'Omar the Edge',sub:''}); return T; };
  const C=mk('caotan',cx,cz), O=mk('omar',ox,oz); O.dir=-1;
  const F=TW.fight={kind:'duo',lock,center:c,phase:1,allyFoes:true,noAttack:true,dcd:1.4,bag:[],lcDone:{},
    pre(dt,play){ if(!play||!F.director||F.lc) return; if(F.busy){ if(!C.gen&&!O.gen) F.busy=0; else return; } if(C.stun>0||O.stun>0) return;
      F.dcd-=dt; if(F.dcd>0) return; const al=[C,O].filter(T=>!T.down&&T.hp>0); if(!al.length) return;
      if(!F.bag.length||F.bagPh!==F.phase){ F.bag=DUO_POOL[F.phase].slice().sort(()=>Math.random()-.5); F.bagPh=F.phase; }
      let e=F.bag.shift(); if(e.duo&&al.length<2){ const T=al[0]; T.gen=TWK[T.who][twPick(T)||(T.who==='caotan'?'goo':'scythes')](T,F.phase); T.wait=0; }
      else if(e.duo){ C.gen=DUO[e.duo](C,O,F.phase); C.wait=0; C.state='duo'; O.gen=twWaitFor(C)(); O.wait=0; }
      else for(const T of al){ const k=e.both[T.who]; T.gen=TWK[T.who][k](T,F.phase); T.wait=0; T.state='atk'; }
      F.busy=1; F.dcd=[0,1.1,.85,.65][F.phase]*(TW.coop?.72:1); },
    onHurt(T){ if(T.hp<=0&&!T.down&&!F.lc){ T.down=1; T.inv=true; T.gen=null; twBark(T.who,T.who==='caotan'?"I'm down! Omar, avenge my glasses!":"I have fallen. Caotan. Do something useful. For once.",true); const o=T===C?O:C; if(o.gen&&o.state==='duo'){} }
      const sum=C.hp+O.hp, mx=C.maxHp+O.maxHp;
      if(F.phase>=2&&!F.lcDone[F.phase]&&!F.lc&&sum<=mx/2){ F.lc=1; F.busy=1; twLCPrep(C); twLCPrep(O); C.down=O.down=0; C.gen=(F.phase===2?DUO.waltz:DUO.fusion)(C,O); C.wait=0; O.gen=twWaitFor(C)(); O.wait=0; return; }
      if(C.hp<=0&&O.hp<=0&&!F.pend){ F.director=0; C.gen=O.gen=null; C.inv=O.inv=true; twClearHz(); BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); F.pend=()=>twDuoPhaseCine(F,C,O); } },
    respawn(){ twDuoRestart(F,C,O); }};
  F.C=C; F.O=O; Game.arena={lock}; Cam.zoom=1.3; return F; }
function twDuoRestart(F,C,O){ twClearHz(); BOLTS.forEach(b=>{ if(!b.friendly) b.dead=1; }); TW.dark=TW.vn=TW.hg=TW.sentence=TW.spot=null; Game.subtitle=null; if(F.X){ twRemoveFoe(F.X); F.X=null; }
  for(const T of [C,O]) Object.assign(T,{hp:T.maxHp,gen:null,stun:0,inv:false,state:'idle',cd:1.6,hide:0,scale:1,hy:1.3,down:0,mv:null,glintN:0,nose:0,heartEyes:0,lockF:0,cracked:0,scythe:0});
  C.x=F.center.x-3; C.z=F.center.z-4; O.x=F.center.x+3; O.z=F.center.z-4; F.lc=0; F.lcDone[F.phase]=0; F.busy=0; F.dcd=1.6; F.director=1; F.pend=null;
  resetPlayer({x:F.center.x,z:F.center.z+4.5},true); Player.hp=Player.maxHp; const A=TW.allies.find(a=>a.who==='ali'); if(A){ A.x=Player.x+1.5; A.z=Player.z+.5; }
  Game.arena={lock:F.lock}; Cam.cine=null; Cam.focus=null; Cam.zoom=1.3; Game.letterTo=0; Game.fade=1; Game.fadeTo=0; applyLook(L.look); Sound.play(['','boss','diva','seraph'][F.phase]); Game.banner={name:'Phase '+['','I','II','III'][F.phase],sub:'The Gatekeeper Twins',t:0,small:1}; }

const DUO={
  *glintDeath(C,O,ph){ const sp=twSp(C); twBark('caotan',"Glint of Death! Omar, NOW!",true);
    for(let r=0;r<(ph>=2?4:3);r++){ yield* twGlint(C,1,.12); const P=Player, a=Math.atan2(P.z-C.z,P.x-C.x), w=twRayWall(C.x,C.z,Math.cos(a),Math.sin(a));
      twBeam({x:C.x,z:C.z,ang:a,len:w.t,w:1.05,warn:.5/sp,dur:.2,dmg:3,col:0x9fd8ff});
      if(ph>=2){ const hx=C.x+Math.cos(a)*w.t, hz=C.z+Math.sin(a)*w.t, ra=w.ax==='x'?Math.atan2(Math.sin(a),-Math.cos(a)):Math.atan2(-Math.sin(a),Math.cos(a)); twBeam({x:hx,z:hz,ang:ra,len:twRayWall(hx,hz,Math.cos(ra),Math.sin(ra)).t,w:1.05,warn:.62/sp,dur:.2,dmg:3,col:0xffb0e0}); }
      yield .55/sp; const P2=Player, pa=(P2.ang||0)+Math.PI, p=twClampXZ(P2.x+Math.cos(pa)*2,P2.z+Math.sin(pa)*2,.6); FX.marker(p.x,p.z,1,0x8a3aff,.35/sp); yield .35/sp;
      twBlink(O,p.x,p.z); O.scythe=1; const aa=Math.atan2(Player.z-O.z,Player.x-O.x); FX.line(O.x,O.z,aa,2.8,2.6,0xb06aff,.2/sp); yield .2/sp; Sound.sfx('swing'); FX.arc(O.x,groundY(O.x,O.z),O.z,aa,0,true); twReapHit(O.x,O.z,aa,2.8,O); O.swing=1; yield .3/sp; O.scythe=0; }
    yield .4; },
  *spiral(C,O,ph){ const sp=twSp(C); twBark('omar',"Twin Spiral. Brother, stay on your side of the circle.",true); const dur=ph>=2?5:4.4; let a=rnd(0,6.28), tt=0, fc=0, fo=0, swapped=false;
    while(tt<dur){ const dt=.05; tt+=dt; a+=.75*sp*dt; const P=Player; const pc=twClampXZ(P.x+Math.cos(a)*6,P.z+Math.sin(a)*5,1), po=twClampXZ(P.x-Math.cos(a)*6,P.z-Math.sin(a)*5,1);
      if(!C.mv) { C.x=lerp(C.x,pc.x,.15); C.z=lerp(C.z,pc.z,.15); } if(!O.mv){ O.x=lerp(O.x,po.x,.15); O.z=lerp(O.z,po.z,.15); }
      fc-=dt; fo-=dt; if(fc<=0){ fc=.3/sp; C.fire=.2; twAimBolt(C,'goo',C.x,C.y+.95,C.z,8.5*sp,0,{col:0xffffff}); }
      if(fo<=0){ fo=.36/sp; O.cast=.2; twAimBolt(O,'dagger',O.x,O.y+1.4,O.z,9*sp,rnd(-.1,.1),{col:0xb06aff}); }
      if(ph>=2&&!swapped&&tt>dur/2){ swapped=true; twBark('caotan',"SWITCH!",true); const cx2=O.x, cz2=O.z, ox2=C.x, oz2=C.z;
        FX.line(C.x,C.z,Math.atan2(cz2-C.z,cx2-C.x),Math.hypot(cx2-C.x,cz2-C.z),1.6,0xff6ab0,.5); FX.line(O.x,O.z,Math.atan2(oz2-O.z,ox2-O.x),Math.hypot(ox2-O.x,oz2-O.z),1.6,0xa04aff,.5); yield .5; tt+=.5;
        Sound.sfx('dash'); twMoveTo(C,cx2,cz2,.35); twMoveTo(O,ox2,oz2,.35); const s={t:0,hit:false}; twHz({upd(dt2,play){ if(!play) return true; s.t+=dt2; const P2=Player;
          for(const T of [C,O]) if(!s.hit&&Math.hypot(P2.x-T.x,P2.z-T.z)<1.15){ if(twHitP(2,T.x,T.z,{heavy:true,melee:true,onParry:()=>{ T.stun=Math.max(T.stun,1.2); }})!=='none') s.hit=true; } return s.t<.4; }}); a+=Math.PI; }
      yield dt; } yield .3; },
  *valentine(C,O,ph){ const sp=twSp(C); twBark('caotan',"Valentine's Funeral! I write the letters, he digs the graves!",true); const P=Player;
    for(let i=0;i<(ph>=3?8:6);i++){ const a=rnd(0,6.28), r=i===0?0:rnd(1.5,4), p=twClampXZ(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r,1), m=twBB(texLetter(),.9,.6); C.fire=.15;
      twThrow({x:C.x,y:C.y+1.5,z:C.z,tx:p.x,tz:p.z,dur:.9/sp,h:3,mesh:m,spin:10,r:.9,col:0xff3a7a,trail:0xff8ac8,onLand(x,z,play){ Sound.sfx('kyun'); twHeartBurst(x,z,10); if(play&&twInR(x,z,.9,1.8)) twHitP(2,x,z,{ub:true});
        for(let k=0;k<5;k++){ const b=k*6.283/5+rnd(0,.5), hx=x+Math.cos(b)*1.6, hz=z+Math.sin(b)*1.6; twBlast(hx,hz,.85,.65/sp,{col:0x9a5aff,burst:0xd8c8f0,dmg:2,quiet:k>0,sfx:'crash',shake:.05,onBoom(x2,z2){ twHandRise(x2,z2); }}); } }}); yield .22/sp; }
    O.cast=1; twBark('omar',"Return to sender. In a coffin.",true); yield 1.6; },
  *rivalry(C,O,ph){ const sp=twSp(C); const lines=[["caotan","You always take the good scythe!"],["omar","You always take the good glasses!"],["caotan","We have ONE pair of glasses!"],["omar","EXACTLY."]];
    for(let r=0;r<4;r++){ const P=Player, a=rnd(0,6.28), pc=twClampXZ(P.x+Math.cos(a)*6.5,P.z+Math.sin(a)*5,.8), po=twClampXZ(P.x-Math.cos(a)*6.5,P.z-Math.sin(a)*5,.8);
      twMoveTo(C,pc.x,pc.z,.4/sp); twMoveTo(O,po.x,po.z,.4/sp); twBark(lines[r][0],lines[r][1],true); yield .45/sp;
      const ang=Math.atan2(O.z-C.z,O.x-C.x), len=Math.hypot(O.x-C.x,O.z-C.z); C.push=.3; C.glintT=.4; O.cast=.6; Sound.sfx('ting');
      let hitMe=false; const chk=()=>{ const P2=Player, ux=Math.cos(ang), uz=Math.sin(ang), px=P2.x-C.x, pz=P2.z-C.z, al=px*ux+pz*uz, pe=Math.abs(px*uz-pz*ux); hitMe=al>-.3&&al<len&&pe<.85; };
      twBeam({x:C.x,z:C.z,ang,len,w:1.2,warn:.75/sp,dur:.3,dmg:3,col:0xff9ad8,onFire:chk}); twBeam({x:O.x,z:O.z,ang:ang+Math.PI,len,w:.9,warn:.75/sp,dur:.3,dmg:3,col:0xa04aff,y:1.4});
      yield .8/sp; if(!hitMe){ twHurt(C,ph>=3?3:2.5,'ff'); twHurt(O,ph>=3?3:2.5,'ff'); twBark(r%2?'omar':'caotan',r%2?"You hit my GOOD side!":"OW! That was my FACE, Omar!",true); Game.dmgNums.push({x:(C.x+O.x)/2,y:3,z:(C.z+O.z)/2,n:'FRIENDLY FIRE',t:0,big:true,col:'#ffd45a'}); }
      yield .4/sp; } },
  *pillowFort(C,O,ph){ const sp=twSp(C), A=twLock(), P=Player, zc=clamp(P.z,A.z0+2.5,A.z1-2.5); twBark('caotan',"Pillow Fort Execution! It's cozy AND lethal!",true);
    const ms=[]; for(let x=A.x0+.6;x<=A.x1-.6;x+=1.35) for(const s of [-1,1]){ const m=twBB(texPillow(),.9,2.4); m.position.set(x,groundY(x,zc+s*2.1)+1.2,zc+s*2.1); ms.push(m); }
    Sound.sfx('crash'); twHz({upd(dt){ this.t+=dt; return this.t<5.2/sp; }, kill(){ ms.forEach(m=>scene.remove(m)); }});
    for(const s of [-1,1]) twBeam({x:A.x0,z:zc+s*2.1,ang:0,len:A.x1-A.x0,w:.9,warn:.3,dur:4.6/sp,dmg:2,col:0xffb0e0,core:0xffd0ec,y:.6,sfx:'crash'});
    twMoveTo(O,A.x0+1,zc,.4); twMoveTo(C,A.x1-1,zc,.4); yield .6;
    for(let k=0;k<2;k++){ O.scythe=1; twBig('JUMP!',{size:70,col:'#ff4a5a',y:UH*.3,dur:.9}); twBeam({x:A.x0,z:zc,ang:0,len:A.x1-A.x0,w:3.2,warn:.85/sp,dur:.35,dmg:3,col:0xd0a0ff,core:0x2a0a3a,y:.4,jump:true,sfx:'swing'});
      for(let v=0;v<3;v++){ C.fire=.2; twAimBolt(C,'goo',C.x,C.y+.95,C.z,9*sp,rnd(-.08,.08),{col:0xffffff}); yield .38/sp; } yield .25/sp; }
    O.scythe=0; yield .5; },
  *doubleSentence(C,O,ph){ const sp=twSp(C); twBark('omar',"Death Sentence.",true); twBark('caotan',"With GLINTS!",true); const S=TW.sentence={n:3,pulse:1}; Sound.sfx('gong');
    for(let n=3;n>=1;n--){ S.n=n; S.pulse=1; Sound.sfx('tick'); C.push=.3; C.glintN=4-n; C.glintT=.6; Sound.sfx('ting'); yield .95/sp; }
    S.n=0; Sound.sfx('gong'); for(let k=0;k<2;k++){ const P=Player, x=P.x, z=P.z; twBigScythe(x,z,.5); twBlast(x,z,1.7,.5,{col:0xff1a3a,dmg:4,dark:1,shake:.5,sfx:'crossboom'});
      for(const b of [Math.PI/4,-Math.PI/4]) twBeam({x:x-Math.cos(b)*15,z:z-Math.sin(b)*15,ang:b,len:30,w:1.1,warn:.85/sp,dur:.3,dmg:3,col:0xffa0d8}); yield 1.2/sp; }
    TW.sentence=null; yield .4; },
  // ---------- LIMIT CUT I: Requiem Waltz ----------
  *waltz(C,O){ const F=TW.fight, P=Player; Game.letterTo=.35; twCutin('caotan','REQUIEM WALTZ','Limit Break  ·  Shall we dance, senpai?','#a04aff',2.2); Sound.sfx('gong'); Sound.play('romance');
    twBark('omar',"Brother. Our song.",true); yield 1; twBark('caotan',"Stay in the SPOTLIGHT, senpai. The dark is for... the other guy.",true);
    const S=TW.spot={k:0,list:[{x:P.x,z:P.z,r:2.7}]}; twHz({upd(dt){ if(!TW.spot) return false; TW.spot.k=Math.min(1,TW.spot.k+dt*1.5); return true; }});
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.5,2.7,48),new THREE.MeshBasicMaterial({color:0xfff0d0,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.userData.tw=1; scene.add(ring);
    let outT=0; const h=twHz({upd(dt,play){ const s=S.list[0]; ring.position.set(s.x,groundY(s.x,s.z)+.08,s.z); if(!play) return true; const P2=Player;
      const inside=S.list.some(o=>!o.fake&&Math.hypot(P2.x-o.x,P2.z-o.z)<o.r), inFake=S.list.some(o=>o.fake&&o.red&&Math.hypot(P2.x-o.x,P2.z-o.z)<o.r);
      outT-=dt; if((!inside||inFake)&&outT<=0&&S.k>.8){ outT=.7; twHitP(inFake?3:1,P2.x,P2.z,{ub:true}); Game.dmgNums.push({x:P2.x,y:P2.y+2.4,z:P2.z,n:inFake?'WRONG PARTNER':'OUT OF THE SPOTLIGHT',t:0,col:'#ff8ab0'}); } return true; }, kill(){ scene.remove(ring); }});
    yield 1; let beat=0, a=rnd(0,6.28);
    for(let verse=0;verse<3;verse++){ twBig(['ONE','TWO','THREE'][verse],{size:80,col:'#fff0d0',y:UH*.24,dur:.8});
      for(let b=0;b<4;b++){ const s=S.list[0], A=twLock(); a+=rnd(1.2,2.4); const nx=clamp(s.x+Math.cos(a)*3.6,A.x0+3,A.x1-3), nz=clamp(s.z+Math.sin(a)*3,A.z0+3,A.z1-3);
        FX.marker(nx,nz,2.7,0xfff0d0,.6); yield .6; const st={x:s.x,z:s.z}; Sound.sfx('swing'); twHz({upd(dt){ this.t+=dt; const u=Math.min(1,this.t/.45); s.x=lerp(st.x,nx,u*(2-u)); s.z=lerp(st.z,nz,u*(2-u)); return u<1; }});
        // the twins waltz around the edge and throw love and death into the light
        const ca=a+Math.PI/2; twMoveTo(C,nx+Math.cos(ca)*5,nz+Math.sin(ca)*4,.5); twMoveTo(O,nx-Math.cos(ca)*5,nz-Math.sin(ca)*4,.5); yield .5; beat++;
        for(let k=0;k<(verse+2);k++){ const r=rnd(.4,2.1), b2=rnd(0,6.28), x=nx+Math.cos(b2)*r, z=nz+Math.sin(b2)*r; twBlast(x,z,.8,.7,{col:k%2?0xff6ab0:0x8a3aff,dmg:2,quiet:k>0,sfx:'kyun',shake:.05}); }
        O.cast=.3; twAimBolt(O,'scythe',O.x,O.y+2,O.z,0,0,{delay:.35,spd:11,col:0x8a3aff}); C.fire=.2; twAimBolt(C,'orb',C.x,C.y+1.2,C.z,6,0,{col:0xff6ab0}); yield .55; }
      if(verse===1){ twBark('omar',"The final verse. Choose your partner wisely.",true); } }
    // the spotlight splits. one of them is lying.
    const s0=S.list[0], A=twLock(), side=rnd(0,6.28), s1={x:clamp(s0.x+Math.cos(side)*4,A.x0+3,A.x1-3),z:clamp(s0.z+Math.sin(side)*3.5,A.z0+3,A.z1-3),r:2.7}, s2={x:clamp(s0.x-Math.cos(side)*4,A.x0+3,A.x1-3),z:clamp(s0.z-Math.sin(side)*3.5,A.z0+3,A.z1-3),r:2.7};
    const fake=Math.random()<.5?s1:s2; fake.fake=1; S.list=[s1,s2]; twBig('PICK A PARTNER',{size:56,col:'#fff0d0',y:UH*.24,dur:1.4}); yield 1.5; fake.red=1; Sound.sfx('wrong');
    const fr=FX.marker(fake.x,fake.z,2.7,0xff1a3a,2.4); for(let k=0;k<10;k++){ twBlast(fake.x+rnd(-2,2),fake.z+rnd(-2,2),.9,.5+k*.15,{col:0xff1a3a,dmg:3,quiet:k>0}); } yield 2.4;
    TW.spot=null; scene.remove(ring); h.t=99; h.upd=()=>false; twBig('BRAVO',{size:70,col:'#ffd45a',sub:'They bow. They are wide open.'}); twBark('caotan',"Thank you, thank you! We'll be here all week!",true); twBark('omar',"We will not be here all week.");
    applyLook(L.look); Sound.play('diva'); Game.letterTo=0; F.lc=0; F.lcDone[2]=1; F.busy=0; for(const T of [C,O]){ T.inv=false; T.stun=4.5; T.state='stun'; if(T.hp<=0){ T.hp=.1; } } yield 4.5; },
  // ---------- LIMIT CUT II: FUSION ----------
  *fusion(C,O){ const F=TW.fight, c=twCenter(); Game.letterTo=.4; twBark('caotan',"Omar... it's time.",true); yield .9; twBark('omar',"...No.",true); yield .7; twBark('caotan',"It's TIME.",true); yield .7; twBark('omar',"...Fine.",true);
    twMoveTo(C,c.x-2.4,c.z-2,.6); twMoveTo(O,c.x+2.4,c.z-2,.6); yield .7; Game.timeScale=.5;
    for(const [i,w] of ['FU...','SION...','HA!'].entries()){ C.push=.4; O.cast=.4; C.lockF=O.lockF=1; C.f=1; O.f=-1; twBig(w,{size:90+i*20,col:i===2?'#ffd45a':'#ffffff',y:UH*.3,dur:.6}); Sound.sfx(i===2?'crossboom':'slam'); shake(.3+i*.3);
      if(i<2){ twMoveTo(C,c.x-2.4+(i?1:0),c.z-2,.25); twMoveTo(O,c.x+2.4-(i?1:0),c.z-2,.25); } yield .6; }
    Game.timeScale=1; Sound.sfx('fuse'); FX.flash=1; grade.uniforms.flashCol.value.set(1,.9,1); impactFrame([[1,3],[2,2],[3,3],[1,2]]); C.hide=O.hide=1; C.lockF=O.lockF=0;
    const X=F.X=twMake('caomar',c.x,c.z-2,{hp:1,maxHp:1,inv:true,noBar:true,scale:1.55,hy:1.6,phase:3,form:3}); X.state='lc'; for(let i=0;i<4;i++) FX.ring(X.x,groundY(X.x,X.z)+.1,X.z,i%2?'#ff6ab0':'#8a3aff',6+i*3,.6);
    twCutin('omar','CAOMAR','Limit Break  ·  The Fusion Nobody Asked For','#c04aff',2.2); yield 1.4;
    twBark('caomar',"We are CAOMAR. Our glasses... have a SCYTHE.",true); const H=TW.hg={left:24,total:24,label:'FUSION TIME'}; twHz({upd(dt,play){ if(!TW.hg) return false; if(play) TW.hg.left=Math.max(0,TW.hg.left-dt); return true; }}); yield 1;
    // a) glint reaper
    for(let r=0;r<5&&H.left>0;r++){ X.push=.3; X.glintN=r+1; X.glintT=.5; Sound.sfx('ting'); const P=Player, pa=rnd(0,6.28), p=twClampXZ(P.x+Math.cos(pa)*2.4,P.z+Math.sin(pa)*2.4,.8); FX.marker(p.x,p.z,1.2,0xc04aff,.4); yield .4;
      twBlink(X,p.x,p.z); const aa=Math.atan2(Player.z-X.z,Player.x-X.x); FX.line(X.x,X.z,aa,3.4,3,0xc04aff,.2); yield .2; Sound.sfx('swing'); FX.arc(X.x,groundY(X.x,X.z),X.z,aa,0,true); twReapHit(X.x,X.z,aa,3.3,null);
      const b=Math.atan2(Player.z-X.z,Player.x-X.x); twBeam({x:X.x,z:X.z,ang:b,len:twRayWall(X.x,X.z,Math.cos(b),Math.sin(b)).t,w:1.1,warn:.45,dur:.2,dmg:3,col:0xffa0d8}); yield .7; }
    // b) ten-glint void
    twBark('caomar',"TEN GLINTS. EACH ONE... A TINY BLACK HOLE. ♡",true); twMoveTo(X,c.x,c.z-1,.5); yield .6; const orbs=[];
    for(let i=1;i<=10&&H.left>0;i++){ X.push=.2; X.glintN=i; X.glintT=.3; X.showN=i<10?1:0; Sound.sfx('ting'); const a=i*.63; orbs.push(twBolt(X,{kind:'orb',col:0x6a1aff,x:X.x+Math.cos(a)*2,y:X.y+1.5,z:X.z+Math.sin(a)*2,vx:Math.cos(a)*2.4,vz:Math.sin(a)*2.4,homing:.9,life:7,dmg:2})); yield .17; }
    twPull(X.x,X.z,3.2,3,{r:20}); Sound.sfx('void'); twWave(X.x,X.z,{col:0xc04aff,sp:7,max:12,delay:1}); twWave(X.x,X.z,{col:0xff6ab0,sp:7,max:12,delay:2}); yield 3;
    // c) the fusion ha-ha beam
    twBark('caomar',"FUSION... HA-HA... BEAM!",true); while(H.left>0){ const dir=Math.random()<.5?1:-1, b0=rnd(0,6.28); for(let k=0;k<4;k++){ const B=t=>b0+k*Math.PI/2+Math.max(0,t-.8)*.8*dir; twBeam({x:X.x,z:X.z,ang:B,len:18,w:1,warn:.8,dur:2.2,dmg:3,col:k%2?0xff6ab0:0xa04aff}); }
      twWave(X.x,X.z,{col:0xffd0ec,sp:6,max:12,delay:1}); yield 3.2; }
    TW.hg=null; twBark('caomar',"Why does it only last thirty seconds?!",true); yield .8; Sound.sfx('shatter'); FX.flash=.8; impactFrame([[2,2],[1,2]]);
    C.x=X.x-1.5; C.z=X.z; O.x=X.x+1.5; O.z=X.z; C.hide=O.hide=0; twRemoveFoe(X); F.X=null; twBark('omar',"Because we hate each other, Caotan.",true);
    twBig('DEFUSED',{size:72,col:'#ffd45a',sub:'Both twins are dizzy. Go!'}); Game.letterTo=0; F.lc=0; F.lcDone[3]=1; F.busy=0; for(const T of [C,O]){ T.inv=false; T.stun=5; T.state='stun'; if(T.hp<=0) T.hp=.1; } yield 5; }
};
function* twDuoPhaseCine(F,C,O){ const P=Player, A=TW.allies.find(a=>a.who==='ali'); Sound.stop(); Game.letterTo=1; P.inv=99; C.down=O.down=1; FX.flash=.7; impactFrame([[2,2],[1,1]]); Sound.sfx('crash'); shake(.7);
  const mx=(C.x+O.x)/2, mz=(C.z+O.z)/2; yield cineTo([mx,3.6,mz+10],[mx,1.4,mz],.9,t=>t*(2-t)); yield wait(.3);
  if(F.phase===1){
    yield say('caotan',"Omar... it's time."); yield say('omar',"...For what?"); yield say('caotan',"The SYNC.",'angry'); yield say('omar',"No.");
    C.down=O.down=0; yield say('caotan',"Omar. It's TIME.",'angry'); yield say('omar',"...Fine.");
    twMoveTo(C,mx-1,mz,.4); twMoveTo(O,mx+1,mz,.4); yield wait(.5); Sound.sfx('whoosh'); yield wait(.3); Sound.sfx('block');
    yield say('',"They went for a high five. They missed. By a lot.");
    yield say('caotan',"...We don't high five."); yield say('omar',"We DON'T high five.");
    if(A) yield say('ali',"Are you done?"); yield say('shayan',"Let them have this, man.");
    Sound.sfx('slam'); FX.flash=1; grade.uniforms.flashCol.value.set(1,.8,1); impactFrame([[1,2],[3,2]]); shake(.8); yield say('',"The second high five connected. Somewhere, a thunderclap happened for no reason.");
    evaCard(['SYNC RATIO','400%'],1.8,1); yield wait(1.8); C.form=O.form=2; C.tint=0xffe8f4;
  } else if(F.phase===2){
    yield* twCaotanDomain(F,C,O); C.down=O.down=1;
    yield say('caotan',"You wanna know why we look nothing alike?"); yield say('shayan',"Honestly? Yes. It's been bugging me all night.");
    yield say('omar',"We are not twins."); yield say('shayan',"...What?");
    yield say('caotan',"He was born on a Tuesday. I was born on a Tuesday.");
    if(A) yield say('ali',"That's just two people born on Tuesdays.");
    yield say('omar',"EXACTLY. Bound by fate."); yield say('caotan',"Different Tuesdays. Different years. Different hospitals. Different moms.");
    yield say('shayan',"That's not— that's literally just strangers!");
    yield say('omar',"Strangers... bound by FATE.",'angry'); C.down=O.down=0; Sound.sfx('void'); Sound.sfx('sparkle'); yield tween(C,{hy:2.6},.8);
    evaCard(["PHASE III","TUESDAY'S CHILDREN"],1.8,1); impactFrame([[3,2],[1,2],[2,2]]); shake(1); yield wait(1.8); C.form=O.form=3; C.tint=0xffd8f0; C.hy=1.3;
  } else { yield* twDuoEnding(F,C,O); return; }
  F.phase++; const ph=F.phase; for(const T of [C,O]) Object.assign(T,{phase:ph,hp:DUO_HP[ph],maxHp:DUO_HP[ph],down:0,inv:false,stun:0,gen:null,state:'idle',bag:[]}); F.bag=[]; F.busy=0; F.dcd=1.4; F.director=1; F.lcDone[ph]=0; if(F.bonusStun){ for(const T of F.bonusStun.who){ T.stun=F.bonusStun.t; T.state='stun'; } F.bonusStun=null; }
  card('Phase '+['','I','II','III'][ph],ph===2?'Sibling Sync':"Tuesday's Children"); Sound.play(['','boss','diva','seraph'][ph]);
  yield cineTo([P.x,P.y+8.2,P.z+15],[P.x,P.y,P.z],.7); Cam.cine=null; Game.letterTo=0; P.inv=1; }
function* twDuoEnding(F,C,O){ const P=Player, A=TW.allies.find(a=>a.who==='ali'), mi=Game.mira;
  yield say('caotan',"We... lost?"); yield say('omar',"Together. For once. We did something... together.");
  yield say('caotan',"...That's kind of nice, actually.",'happy'); yield say('omar',"Do not ruin it.");
  if(A){ twCamP(6.5,.4); yield say('ali',"Blacksmith. Together. On three."); yield say('shayan',"On three? Okay. One, tw—"); yield say('ali',"Three."); }
  P.ang=Math.atan2(((C.z+O.z)/2)-P.z,((C.x+O.x)/2)-P.x); P.f=Math.cos(P.ang)>0?1:-1; P.charge=2; cineSet(P.x-P.f*2.4,1.3,P.z+3.4,P.x+P.f*1.2,1.5,P.z); yield wait(.3);
  yield say('shayan',"GETSUGA...",'angry'); if(A) yield say('ali',"...TENSHOU.");
  cineSet((C.x+O.x)/2,2,(C.z+O.z)/2+10,(C.x+O.x)/2,2.4,(C.z+O.z)/2); Game.timeScale=.3; fireBeam(true,true); if(A) fireBeam(true,true,{ali:true}); P.charge=0; yield wait(.4); Game.timeScale=1;
  FX.flash=1; impactFrame([[1,3],[2,2],[3,3]]); Sound.sfx('crossboom'); Sound.sfx('gore'); shake(1.6);
  for(const T of [C,O]){ const w=T.who==='caotan'; for(let i=0;i<3;i++) FX.burst(T.x,T.y+1.4,T.z,60,w?0xffffff:0x1a0820,7+i*2,.5,w); if(w) twHeartBurst(T.x,T.z,40); } twRemoveFoe(C); twRemoveFoe(O); yield wait(1.6);
  yield say('',"The Gatekeeper Twins went out the way they came in: loudly, together, and arguing about whose fault it was.");
  twEndFight(); Game.arena=null;
  if(A){ cineSet(A.x+.6,A.y+1.7,A.z+5.6,A.x,A.y+1.1,A.z); yield say('ali',"Not bad, blacksmith. Next time, it's you and me."); yield say('shayan',"Who ARE you?!"); yield say('ali',"Ali."); Sound.sfx('dash'); aliGhost(A.x,A.y,A.z); twClearAllies(); yield wait(.6); yield say('shayan',"...That's it? Just 'Ali'?"); }
  if(mi){ mi.vis=true; mi.x=P.x+1.2; mi.z=P.z+.3; mi.y=P.y; mi.f=-1; mi.anim='idle'; twCamP(6,.6); Sound.play('ending');
    yield say('mira',"Shayan. Your pig is gone, your ex-enemies are gone, a mysterious rival just vanished, and I've been in a cage for most of the night.",'happy');
    yield say('mira',"...Best date ever?",'blush'); const c=yield choose([{t:"Best date ever.",aff:2},{t:"Can the next one have fewer twins?",aff:1}]);
    yield say('mira',c===0?"Then it's settled. Same time next eclipse.":"Fewer twins. More honey buns. Deal.",'happy'); }
  Game.ending=5; yield cineTo([P.x,6,P.z+16],[P.x,6,P.z-20],3); yield wait(.4);
  evaCard(['THE GATEKEEPER TWINS ROUTE','THE OTHER WAY'],3.2,1); yield wait(3.4); evaCard(['GG.'],2,3); yield wait(2.2); yield fadeOut(); Game.state='end'; Game.endT=0; Game.script=null; }
