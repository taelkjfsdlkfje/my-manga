"use strict";
/* ============ gore: lethal enforcement swells and bursts the target ============
   Everything here is local visuals driven by entity state changes, so host and guest both see it.
   A title-screen toggle turns it off (falls back to the stylized light burst). */
const GORE={on:true};
try{if(localStorage.getItem('ls-gore')==='0')GORE.on=false;}catch(e){}

/* --- blood droplets: normal-blended points so they read as liquid, not light --- */
const BMAX=3000;
const bPos=new Float32Array(BMAX*3),bCol=new Float32Array(BMAX*3),bVel=new Float32Array(BMAX*3),bLife=new Float32Array(BMAX);let bHead=0;
for(let i=0;i<BMAX;i++)bPos[i*3+1]=-999;
const bGeo=new T.BufferGeometry();bGeo.setAttribute('position',new T.BufferAttribute(bPos,3));bGeo.setAttribute('color',new T.BufferAttribute(bCol,3));
const BLOOD_PTS=new T.Points(bGeo,new T.PointsMaterial({size:.085,map:DOT,vertexColors:true,transparent:true,alphaTest:.35,depthWrite:true}));
BLOOD_PTS.frustumCulled=false;scene.add(BLOOD_PTS);
const BLOOD_COLS=[0x5a0008,0x7a000c,0x8f0a12,0x4a0006,0xa0101a];
const _bc=new T.Color();
function bloodDrop(x,y,z,vx,vy,vz,col){const i=bHead;bHead=(bHead+1)%BMAX;const j=i*3;bPos[j]=x;bPos[j+1]=y;bPos[j+2]=z;bVel[j]=vx;bVel[j+1]=vy;bVel[j+2]=vz;_bc.setHex(col||BLOOD_COLS[(Math.random()*BLOOD_COLS.length)|0]);bCol[j]=_bc.r;bCol[j+1]=_bc.g;bCol[j+2]=_bc.b;bLife[i]=MR(1.4,3.2);}
function bloodSpray(p,n,spd,up,dir,spread=1){
  for(let k=0;k<n;k++){const th=Math.random()*TAU,ph=Math.acos(MR(-1,1)),s=spd*Math.pow(Math.random(),.6);
    let vx=Math.sin(ph)*Math.cos(th)*s*spread,vy=Math.cos(ph)*s*spread+up*MR(.4,1.2),vz=Math.sin(ph)*Math.sin(th)*s*spread;
    if(dir){vx+=dir.x*spd*MR(.3,1);vy+=dir.y*spd*MR(.2,.8);vz+=dir.z*spd*MR(.3,1);}
    bloodDrop(p.x+MR(-.1,.1),p.y+MR(-.15,.15),p.z+MR(-.1,.1),vx,vy,vz);}
}
function updBlood(dt){
  for(let i=0;i<BMAX;i++){if(bLife[i]<=0)continue;bLife[i]-=dt;const j=i*3;
    if(bLife[i]<=0){bPos[j+1]=-999;continue;}
    if(bVel[j]===0&&bVel[j+1]===0&&bVel[j+2]===0)continue;
    bVel[j+1]-=9.8*dt;const dr=Math.exp(-.8*dt);bVel[j]*=dr;bVel[j+2]*=dr;
    bPos[j]+=bVel[j]*dt;bPos[j+1]+=bVel[j+1]*dt;bPos[j+2]+=bVel[j+2]*dt;
    if(bPos[j+1]<.03){bPos[j+1]=.03;bVel[j]=bVel[j+1]=bVel[j+2]=0;bLife[i]=Math.min(bLife[i],.5);
      if(Math.random()<.16)addDecal(bPos[j],bPos[j+2],MR(.12,.42),BLOOD_COLS[(Math.random()*4)|0],0);}}
  bGeo.attributes.position.needsUpdate=true;bGeo.attributes.color.needsUpdate=true;
}

/* --- ground decals: one instanced mesh of irregular splats that stay on the wet street --- */
const SPLAT_TEX=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  const blob=(x,y,r,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(.7,`rgba(255,255,255,${a*.9})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();};
  blob(64,64,38,1);for(let i=0;i<22;i++){const a=Math.random()*TAU,d=MR(18,50);blob(64+Math.cos(a)*d,64+Math.sin(a)*d,MR(4,14),.95);}
  const t=new T.CanvasTexture(c);return t;})();
const DMAX=900;
const DECALS=new T.InstancedMesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),new T.MeshStandardMaterial({map:SPLAT_TEX,transparent:true,depthWrite:false,roughness:.08,metalness:.2,color:0x7a7a7a,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),DMAX);
DECALS.instanceMatrix.setUsage(T.DynamicDrawUsage);DECALS.frustumCulled=false;DECALS.renderOrder=1;
{const m=new T.Matrix4().makeScale(0,0,0);const c=new T.Color(0x5a0008);for(let i=0;i<DMAX;i++){DECALS.setMatrixAt(i,m);DECALS.setColorAt(i,c);}}
scene.add(DECALS);
let dHead=0;const GROW=[];const _dm=new T.Matrix4(),_dq=new T.Quaternion(),_dp=new V3(),_ds=new V3(),_up=new V3(0,1,0);
function setDecal(i,x,z,s,rot,y){_dq.setFromAxisAngle(_up,rot);_dp.set(x,y,z);_ds.set(s,1,s);_dm.compose(_dp,_dq,_ds);DECALS.setMatrixAt(i,_dm);DECALS.instanceMatrix.needsUpdate=true;}
function addDecal(x,z,size,col,grow){
  const i=dHead;dHead=(dHead+1)%DMAX;const rot=Math.random()*TAU,y=.02+(i%60)*.0004;
  _bc.setHex(col);DECALS.setColorAt(i,_bc);DECALS.instanceColor.needsUpdate=true;
  if(grow){GROW.push({i,x,z,size,rot,y,t:0,dur:grow});setDecal(i,x,z,size*.15,rot,y);}else setDecal(i,x,z,size,rot,y);
}
function updDecals(dt){for(let k=GROW.length-1;k>=0;k--){const g=GROW[k];g.t+=dt;const f=Math.min(1,g.t/g.dur);setDecal(g.i,g.x,g.z,g.size*(.15+.85*(1-Math.pow(1-f,3))),g.rot,g.y);if(f>=1)GROW.splice(k,1);}}

/* --- gibs: instanced chunks with simple physics; they settle and stay --- */
const GMAX=360;
const GIBS=new T.InstancedMesh(new T.DodecahedronGeometry(.62,0),new T.MeshStandardMaterial({roughness:.3,metalness:.05,color:0x9a9a9a}),GMAX);
GIBS.instanceMatrix.setUsage(T.DynamicDrawUsage);GIBS.frustumCulled=false;
{const m=new T.Matrix4().makeScale(0,0,0);const c=new T.Color(0x5a0008);for(let i=0;i<GMAX;i++){GIBS.setMatrixAt(i,m);GIBS.setColorAt(i,c);}}
scene.add(GIBS);
const GIB=[];let gHead=0;
function addGib(p,v,size,col){
  const i=gHead;gHead=(gHead+1)%GMAX;
  GIB[i]={p:p.clone(),v:v.clone(),q:new T.Quaternion().setFromEuler(new T.Euler(Math.random()*TAU,Math.random()*TAU,0)),w:new V3(MR(-12,12),MR(-12,12),MR(-12,12)),s:size.clone(),rest:false,bounces:0,trail:Math.random()<.7};
  _bc.setHex(col);GIBS.setColorAt(i,_bc);GIBS.instanceColor.needsUpdate=true;
}
const _gq=new T.Quaternion(),_ge=new T.Euler();
function updGibs(dt){
  let any=false;
  for(let i=0;i<GIB.length;i++){const g=GIB[i];if(!g||g.rest)continue;any=true;
    g.v.y-=9.8*dt;g.p.addScaledVector(g.v,dt);
    _ge.set(g.w.x*dt,g.w.y*dt,g.w.z*dt);_gq.setFromEuler(_ge);g.q.multiply(_gq);
    const half=g.s.y*.5;
    if(g.p.y<half){g.p.y=half;
      if(g.bounces===0)addDecal(g.p.x,g.p.z,MR(.35,.8),BLOOD_COLS[(Math.random()*4)|0],0);
      g.bounces++;g.v.y=Math.abs(g.v.y)*.25;g.v.x*=.55;g.v.z*=.55;g.w.multiplyScalar(.5);
      if(Math.hypot(g.v.x,g.v.z)<.25&&g.v.y<.6){g.rest=true;g.v.set(0,0,0);}}
    if(g.trail&&Math.random()<.5)bloodDrop(g.p.x,g.p.y,g.p.z,MR(-.3,.3),MR(-.2,.2),MR(-.3,.3));
    resolveCircle(g.p,.05);
    _dm.compose(g.p,g.q,g.s);GIBS.setMatrixAt(i,_dm);}
  if(any)GIBS.instanceMatrix.needsUpdate=true;
}

/* --- screen splatter when you're close to a burst or get hit --- */
const SCR={cv:null,g:null,drips:[],alpha:0};
function initScreenGore(){
  const cv=document.createElement('canvas');cv.id='goreScreen';cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0';
  const fx=document.getElementById('fx');fx.parentNode.insertBefore(cv,fx);SCR.cv=cv;SCR.g=cv.getContext('2d');
  const size=()=>{cv.width=Math.round(innerWidth/2);cv.height=Math.round(innerHeight/2);};size();addEventListener('resize',size);
}
function screenSplat(intensity){
  if(!GORE.on||!SCR.g)return;const g=SCR.g,W=SCR.cv.width,H=SCR.cv.height;
  const n=Math.round(2+intensity*6);
  for(let k=0;k<n;k++){
    const edge=Math.random()<.75;let x=Math.random()*W,y=Math.random()*H;
    if(edge){if(Math.random()<.5)x=Math.random()<.5?MR(0,W*.22):MR(W*.78,W);else y=Math.random()<.5?MR(0,H*.25):MR(H*.7,H);}
    const r=MR(5,18)*(.6+intensity)*(W/640);
    const rr=(70+Math.random()*40)|0;g.fillStyle=`rgba(${rr},0,${(4+Math.random()*8)|0},${MR(.55,.8)})`;
    // an irregular blob made of a wobbly polygon plus satellites, darker toward the middle
    g.beginPath();const pts=14;for(let q=0;q<=pts;q++){const a=q/pts*TAU,rad=r*MR(.55,1.15);const px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad*MR(.8,1.1);q?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();
    g.save();g.globalAlpha=.5;g.fillStyle=`rgb(${(rr*.55)|0},0,4)`;g.beginPath();g.arc(x+MR(-r*.2,r*.2),y+MR(-r*.2,r*.2),r*MR(.3,.5),0,TAU);g.fill();g.restore();
    for(let s=0;s<10;s++){const a=Math.random()*TAU,d=r*MR(1.1,2.6);g.beginPath();g.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,r*MR(.04,.16),0,TAU);g.fill();}
    if(Math.random()<.7)SCR.drips.push({x:x+MR(-r*.5,r*.5),y:y+r*.6,w:r*MR(.15,.3),v:MR(8,26)*(W/640),len:MR(20,90)*(W/640),col:g.fillStyle});
  }
  SCR.alpha=Math.min(1,SCR.alpha+.55+intensity*.4);
}
function updScreenGore(dt){
  if(!SCR.g)return;
  if(SCR.alpha<=0){if(SCR.dirty){SCR.g.clearRect(0,0,SCR.cv.width,SCR.cv.height);SCR.dirty=false;SCR.drips.length=0;}SCR.cv.style.opacity=0;return;}
  SCR.dirty=true;const g=SCR.g;
  for(let k=SCR.drips.length-1;k>=0;k--){const d=SCR.drips[k];const step=d.v*dt;g.fillStyle=d.col;g.fillRect(d.x-d.w/2,d.y,d.w,step+1);g.beginPath();g.arc(d.x,d.y+step,d.w*.6,0,TAU);g.fill();d.y+=step;d.len-=step;d.v*=.995;if(d.len<=0)SCR.drips.splice(k,1);}
  SCR.alpha-=dt*.22;SCR.cv.style.opacity=Math.max(0,Math.min(1,SCR.alpha*1.4)).toFixed(3);
}

/* --- the lethal sequence --- */
function goreTint(e,k){
  // per-entity material copies so only this body flushes and darkens
  if(!e._gm){e._gm=[];e.g.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial){o.material=o.material.clone();e._gm.push({m:o.material,c0:o.material.color.clone()});}});}
  for(const x of e._gm){x.m.color.copy(x.c0).lerp(_bc.setHex(0x3a0006),k*.8);x.m.emissive.setHex(0x120000).multiplyScalar(k*(.6+.4*Math.sin(e.dieT*30)));}
}
function goreSwell(e,dt){
  // called every frame while dying: convulse, bloat unevenly, rupture
  e.dieT+=dt;const k=Math.min(1,e.dieT/.7);
  const wob=Math.sin(e.dieT*38)*.06*k,bulge=1+k*k*.75;
  e.g.scale.set(bulge+wob,1+k*.28-wob*.5,bulge-wob);
  e.g.position.y=k*.12;
  e.g.rotation.z=Math.sin(e.dieT*29)*.12*k;e.g.rotation.x=Math.sin(e.dieT*23)*.08*k;
  e.head.scale.setScalar(1+k*.6+Math.sin(e.dieT*41)*.08*k);
  e.armL.rotation.x=-1.2+Math.sin(e.dieT*31)*.9*k;e.armR.rotation.x=-1.4+Math.cos(e.dieT*27)*.9*k;e.armL.rotation.z=-.4*k;e.armR.rotation.z=.4*k;
  e.legL.rotation.x=Math.sin(e.dieT*25)*.4*k;e.legR.rotation.x=-Math.sin(e.dieT*25)*.4*k;
  goreTint(e,k);
  // ruptures: jets of blood from random points that intensify
  if(Math.random()<dt*(4+k*30)){const p=_dp.set(e.g.position.x+MR(-.25,.25),MR(.9,1.8),e.g.position.z+MR(-.25,.25));const dir=new V3(MR(-1,1),MR(.2,1),MR(-1,1)).normalize();
    for(let s=0;s<(6+k*18);s++)bloodDrop(p.x,p.y,p.z,dir.x*MR(1.5,4.5)+MR(-.4,.4),dir.y*MR(1,3.5),dir.z*MR(1.5,4.5)+MR(-.4,.4));}
  if(!e._swellSfx){e._swellSfx=true;SFX.swell&&SFX.swell();}
}
function goreBurst(e){
  const c=new V3(e.g.position.x,1.2,e.g.position.z);
  const orig=m=>{const x=e._gm&&e._gm.find(q=>q.m===m);return x?x.c0.getHex():m.color.getHex();};
  const coat=orig(e.armL.material),skin=orig(e.head.material);
  const dark=h=>_bc.setHex(h).lerp(new T.Color(0x3a0006),.45).getHex();
  SFX.gore&&SFX.gore();
  bloodSpray(c,900,7.5,2.6);bloodSpray(c,500,3,1.2,null,.7);
  bloodSpray(new V3(c.x,1.6,c.z),260,11,4,null,1.2);
  // chunks: flesh, fabric, a few big ones
  const n=26;
  for(let i=0;i<n;i++){
    const r=Math.random();const col=r<.6?BLOOD_COLS[(Math.random()*5)|0]:r<.78?dark(coat):r<.9?dark(skin):0x2a0306;
    const big=i<4;const s=big?new V3(MR(.18,.3),MR(.14,.26),MR(.16,.28)):new V3(MR(.05,.15),MR(.04,.12),MR(.05,.15));
    const a=Math.random()*TAU,sp=MR(2.5,big?5.5:9);
    addGib(new V3(c.x+MR(-.2,.2),MR(.6,1.8),c.z+MR(-.2,.2)),new V3(Math.cos(a)*sp,MR(2,7),Math.sin(a)*sp),s,col);
  }
  // the head goes too
  addGib(new V3(c.x,1.75,c.z),new V3(MR(-3,3),MR(5,8),MR(-3,3)),new V3(.22,.25,.23),dark(skin));
  // a growing pool and a ring of splatter
  addDecal(c.x,c.z,MR(3.2,4.2),0x4a0006,2.6);addDecal(c.x+MR(-.4,.4),c.z+MR(-.4,.4),MR(1.6,2.2),0x6a000a,1.6);
  for(let i=0;i<16;i++){const a=Math.random()*TAU,d=MR(.8,5.5);addDecal(c.x+Math.cos(a)*d,c.z+Math.sin(a)*d,MR(.3,1.3),BLOOD_COLS[(Math.random()*5)|0],MR(0,.6));}
  burst(c,40,[0xff2030,0xff6040],4,1,.5,.6);
  // splash the lens if you're close
  const d=camera.position.distanceTo(c);if(d<8)screenSplat(clamp(1-d/8,0,1)*1.2);
}
function goreImpact(to,from){
  // the beam lands: a spurt out the back of the target
  if(!GORE.on)return;const dir=to.clone().sub(from).normalize();bloodSpray(to,140,5,1,dir,.5);
}
function goreVictim(e){
  // the assault victim lies in a pool
  if(!GORE.on)return;const p=e.g.position;addDecal(p.x,p.z,2.6,0x4a0006,3);addDecal(p.x+.4,p.z-.3,1.2,0x6a000a,0);
  for(let i=0;i<7;i++)addDecal(p.x+MR(-2,2),p.z+MR(-2,2),MR(.2,.6),BLOOD_COLS[(Math.random()*4)|0],0);
}
function goreOil(e){
  if(!GORE.on)return;const p=e.g.position;
  for(let i=0;i<(e.kind==='mech'?14:5);i++)addDecal(p.x+MR(-2,2),p.z+MR(-2,2),MR(.4,e.kind==='mech'?2.4:1.1),0x050608,MR(0,1));
}
function updGore(dt){updBlood(dt);updDecals(dt);updGibs(dt);updScreenGore(dt);}
