"use strict";
/* ============ world: the district, deterministic from rng(77) on every client ============ */
const BOXES=[],BUILDINGS=[],BEACONS=[],FLICKER=[],FLYERS=[],MIST=[];
const PLAZA={};
const BOARD={};
let sky,rainGeo,rainPos,RN,PATROL;
const LATIN=["OKAMI RAMEN","HUE CARE","NEURO BAR","KAGERO ARCADE","PACHINKO 777","CAPSULE INN","SYNTH SAKE","MEMORY PARLOR","CLEAR MIND","NOODLE 24H","DATA DEN","IRIS TATTOO","KARAOKE 5F","LUCKY CAT"];

function addBox(cx,cz,w,d,low){BOXES.push({x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2,low:!!low});}
function segBlocked(ax,az,bx,bz){
  const dx=bx-ax,dz=bz-az;
  for(const b of BOXES){let t0=0,t1=1;
    if(b.low||((b.x1-b.x0)<1&&(b.z1-b.z0)<1))continue;
    if(Math.abs(dx)<1e-6){if(ax<b.x0||ax>b.x1)continue;}else{let a=(b.x0-ax)/dx,c=(b.x1-ax)/dx;if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)continue;}
    if(Math.abs(dz)<1e-6){if(az<b.z0||az>b.z1)continue;}else{let a=(b.z0-az)/dz,c=(b.z1-az)/dz;if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)continue;}
    if(t1>.02&&t0<.98)return true;}
  return false;
}
function resolveCircle(p,r){
  for(const b of BOXES){const cx=clamp(p.x,b.x0,b.x1),cz=clamp(p.z,b.z0,b.z1);const dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
    if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r;}else{const l=p.x-b.x0,rr=b.x1-p.x,t=p.z-b.z0,bb=b.z1-p.z,m=Math.min(l,rr,t,bb);if(m===l)p.x=b.x0-r;else if(m===rr)p.x=b.x1+r;else if(m===t)p.z=b.z0-r;else p.z=b.z1+r;}}}
  p.x=clamp(p.x,-67.5,67.5);p.z=clamp(p.z,-67.5,67.5);
}

function scaledBox(w,h,d){
  const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv;const ou=Math.floor(rng()*8)/8,ov=Math.floor(rng()*16)/16;
  for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;if(f===2||f===3){uv.setXY(i,.002,.002);continue;}const span=f<2?d:w;uv.setXY(i,uv.getX(i)*span/16+ou,uv.getY(i)*h/48+ov);}
  uv.needsUpdate=true;return g;
}
function makeWindowTex(i){
  const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');
  g.fillStyle='#000';g.fillRect(0,0,128,256);
  const pal=[['#ffcf8a','#ffb066','#ffe6b8'],['#7fd8ff','#a8c8ff','#d8f4ff'],['#ff7ac8','#b48cff','#7fd8ff'],['#ffd27a','#7fffd4','#ffffff'],['#ff9a6b','#ffcf8a','#8affff']][i%5];
  const litP=[.2,.28,.17,.24,.3][i%5];
  for(let r=0;r<16;r++){
    if(rng()<.07){g.globalAlpha=.9;g.fillStyle=pick(NEON_CSS);g.fillRect(0,r*16+7,128,2);continue;}
    for(let col=0;col<8;col++){
      if(rng()<litP){g.globalAlpha=R(.3,1);g.fillStyle=pick(pal);g.fillRect(col*16+3,r*16+4,10,8);}
      else if(rng()<.18){g.globalAlpha=.1;g.fillStyle='#8aa0ff';g.fillRect(col*16+3,r*16+4,10,8);}
    }
  }
  g.globalAlpha=1;const t=canvasTex(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t;
}
function streakTexture(){const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');let gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.35,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,256);g.globalCompositeOperation='destination-in';gr=g.createLinearGradient(0,0,64,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,256);return canvasTex(c);}
function addBeacon(x,y,z){const s=new T.Sprite(new T.SpriteMaterial({map:DOT,color:0xff2040,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,transparent:true}));s.position.set(x,y+.3,z);s.scale.set(2.2,2.2,1);scene.add(s);BEACONS.push(s);return s;}

function buildWorld(){
  const WIN=[0,1,2,3,4].map(makeWindowTex);
  const BMATS=WIN.map(t=>new T.MeshStandardMaterial({color:0x0b0a12,roughness:.5,metalness:.45,emissive:0xffffff,emissiveMap:t,emissiveIntensity:1.3}));
  const FARMATS=WIN.map(t=>new T.MeshBasicMaterial({map:t,color:0x77739e,fog:false}));
  const STREAK=streakTexture();

  sky=new T.Mesh(new T.SphereGeometry(520,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vP;void main(){float h=vP.y;vec3 hz=vec3(.2,.07,.24);vec3 mid=vec3(.07,.035,.12);vec3 top=vec3(.015,.012,.035);vec3 c=mix(hz,mid,smoothstep(0.,.16,h));c=mix(c,top,smoothstep(.16,.7,h));c+=vec3(.12,.03,.06)*exp(-abs(h)*22.);gl_FragColor=vec4(c,1.);}`}));
  scene.add(sky);

  // ground with puddles
  {const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
    g.fillStyle='rgb(150,150,150)';g.fillRect(0,0,256,256);
    for(let i=0;i<70;i++){const x=rng()*256,y=rng()*256,r=R(8,34);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(20,20,20,.95)');gr.addColorStop(1,'rgba(20,20,20,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
    for(let i=0;i<2500;i++){g.fillStyle=`rgba(${rng()<.5?220:60},${rng()<.5?220:60},${rng()<.5?220:60},.12)`;g.fillRect(rng()*256,rng()*256,1.5,1.5);}
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(60,60);
    const ground=new T.Mesh(new T.PlaneGeometry(520,520),new T.MeshStandardMaterial({color:0x0e0e16,roughness:1,roughnessMap:t,metalness:.75}));
    ground.rotation.x=-Math.PI/2;scene.add(ground);}
  const SLAB_MAT=new T.MeshStandardMaterial({color:0x1d1b26,roughness:.35,metalness:.55});
  const CURB_MAT=new T.MeshStandardMaterial({color:0x2c2a36,roughness:.6,metalness:.3});
  const slab=(cx,cz,half)=>{const m=new T.Mesh(new T.BoxGeometry(half*2,.14,half*2),SLAB_MAT);m.position.set(cx,.07,cz);scene.add(m);};
  // road markings
  {const m=new T.MeshBasicMaterial({color:0x6b5c20,toneMapped:false});const L=[-60,-20,20,60];
    L.forEach(l=>{for(let t=-66;t<66;t+=6){const a=new T.Mesh(new T.PlaneGeometry(.18,2.6),m);a.rotation.x=-Math.PI/2;a.position.set(l,.015,t);scene.add(a);const b=new T.Mesh(new T.PlaneGeometry(2.6,.18),m);b.rotation.x=-Math.PI/2;b.position.set(t,.015,l);scene.add(b);}});
    const w=new T.MeshBasicMaterial({color:0x3a3c48,toneMapped:false});
    [[20,0,'x'],[-20,0,'x'],[0,20,'z'],[0,-20,'z']].forEach(([x,z,ax])=>{for(let i=-3;i<=3;i++){const s=new T.Mesh(new T.PlaneGeometry(ax==='x'?7:.7,ax==='x'?.7:7),w);s.rotation.x=-Math.PI/2;s.position.set(ax==='x'?x:x+i*1.4,.016,ax==='x'?z+i*1.4:z);scene.add(s);}});}

  // signs
  function signTex(text,color,vertical){
    const c=document.createElement('canvas'),g=c.getContext('2d');
    if(vertical){const ch=[...text],cs=112;c.width=150;c.height=ch.length*cs+46;
      g.font=`700 90px ${JPF}`;g.textAlign='center';g.textBaseline='middle';
      g.shadowColor=color;g.shadowBlur=18;g.strokeStyle=color;g.lineWidth=5;g.strokeRect(12,12,126,c.height-24);
      ch.forEach((k,i)=>{const y=23+i*cs+cs/2;g.shadowBlur=28;g.fillStyle=color;g.fillText(k,75,y);g.shadowBlur=4;g.fillStyle='rgba(255,255,255,.82)';g.fillText(k,75,y);});
    }else{g.font=`700 78px ${HUDF}`;const w=Math.ceil(g.measureText(text).width)+90;c.width=w;c.height=150;
      g.font=`700 78px ${HUDF}`;g.textAlign='center';g.textBaseline='middle';
      g.shadowColor=color;g.shadowBlur=20;g.strokeStyle=color;g.lineWidth=4;g.strokeRect(10,10,w-20,130);
      g.shadowBlur=30;g.fillStyle=color;g.fillText(text,w/2,78);g.shadowBlur=4;g.fillStyle='rgba(255,255,255,.82)';g.fillText(text,w/2,78);}
    return {tex:canvasTex(c),aspect:c.height/c.width};
  }
  function placeSign(x,y,z,nx,nz,text,ci,vertical,size){
    const {tex,aspect}=signTex(text,NEON_CSS[ci],vertical);
    const w=vertical?size:size/aspect,h=vertical?size*aspect:size;
    const mat=new T.MeshBasicMaterial({map:tex,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
    const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);const th=Math.atan2(nx,nz);m.rotation.y=th;m.position.set(x+nx*.06,y+h/2,z+nz*.06);scene.add(m);
    if(rng()<.18)FLICKER.push({mat,seed:rng()*100});
    if(y<9){const hold=new T.Object3D();hold.rotation.y=th;hold.position.set(x+nx*3.6,.03,z+nz*3.6);
      const s=new T.Mesh(new T.PlaneGeometry(w*.9,7),new T.MeshBasicMaterial({map:STREAK,color:NEON[ci],transparent:true,opacity:.32,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
      s.rotation.x=-Math.PI/2;hold.add(s);scene.add(hold);}
    return m;
  }
  function decorate(b,ring){
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([nx,nz])=>{
      const fx=b.cx+nx*b.w/2,fz=b.cz+nz*b.d/2;
      if(ring&&(nx*fx+nz*fz)>0)return;if(rng()>.62)return;
      const span=nx!==0?b.d:b.w,off=R(-span/2+2,span/2-2);const x=fx+(nx===0?off:0),z=fz+(nz===0?off:0);
      const ci=Math.floor(rng()*NEON.length);
      if(rng()<.55)placeSign(x,R(3.8,8),z,nx,nz,pick(JP_V),ci,true,R(1.1,1.6));else placeSign(x,R(4.2,11),z,nx,nz,pick(LATIN),ci,false,R(1.1,1.9));
      if(rng()<.25&&b.h>40)placeSign(x,b.h-R(10,16),z,nx,nz,pick(JP_V),Math.floor(rng()*NEON.length),true,R(2.4,3.4));
    });
  }
  function building(cx,cz,w,d,h,ring){
    const m=new T.Mesh(scaledBox(w,h,d),pick(BMATS));m.position.set(cx,h/2,cz);scene.add(m);addBox(cx,cz,w,d);
    const band=new T.Mesh(new T.BoxGeometry(w+.3,.14,d+.3),neonMat(pick(NEON)));band.position.set(cx,3.5,cz);scene.add(band);
    if(rng()<.5){const hh=R(2,6);const r2m=new T.Mesh(new T.BoxGeometry(w*.6,hh,d*.6),new T.MeshStandardMaterial({color:0x14121c,roughness:.6,metalness:.5}));r2m.position.set(cx,h+hh/2,cz);scene.add(r2m);}
    if(rng()<.35){const ah=R(6,14);const a=new T.Mesh(new T.CylinderGeometry(.08,.12,ah,5),CURB_MAT);a.position.set(cx+R(-w/4,w/4),h+ah/2,cz+R(-d/4,d/4));scene.add(a);addBeacon(a.position.x,h+ah,a.position.z);}
    const b={cx,cz,w,d,h};BUILDINGS.push(b);decorate(b,ring);return b;
  }
  function fillBlock(cx,cz,tall){
    const r=rng(),H=()=>tall?R(45,120):(rng()<.15?R(85,130):R(16,70));
    if(r<.3)building(cx,cz,22,22,H(),tall);
    else if(r<.65){if(rng()<.5){building(cx-5.75,cz,10.5,22,H(),tall);building(cx+5.75,cz,10.5,22,H(),tall);}else{building(cx,cz-5.75,22,10.5,H(),tall);building(cx,cz+5.75,22,10.5,H(),tall);}}
    else[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>building(cx+a*5.75,cz+b*5.75,10.5,10.5,H(),tall));
  }
  for(let bx=-2;bx<=2;bx++)for(let bz=-2;bz<=2;bz++){
    const cx=bx*40,cz=bz*40,ring=Math.max(Math.abs(bx),Math.abs(bz))===2;
    slab(cx,cz,15);if(bx===0&&bz===0)continue;
    if(bx===0&&bz===-1){building(0,-40,22,22,64,false);continue;}
    fillBlock(cx,cz,ring);
  }
  for(let i=0;i<54;i++){const a=rng()*TAU,r=R(150,290),w=R(14,40),d=R(14,40),h=R(70,260);
    const m=new T.Mesh(scaledBox(w,h,d),pick(FARMATS));m.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);scene.add(m);if(rng()<.5)addBeacon(m.position.x,h,m.position.z);}
  [[-200,-240],[230,-150]].forEach(([x,z])=>{const m=new T.Mesh(scaledBox(70,340,70),FARMATS[1]);m.position.set(x,170,z);scene.add(m);
    for(let k=0;k<4;k++){const s=new T.Mesh(new T.BoxGeometry(1.2,320,1.2),new T.MeshBasicMaterial({color:k%2?0xff2d78:0x39f0ff,fog:false,toneMapped:false}));s.position.set(x+(k<2?-35.5:35.5),170,z+(k%2?-35.5:35.5));scene.add(s);}
    addBeacon(x,340,z);});

  // streetlights
  {const pole=new T.CylinderGeometry(.08,.1,6.4,6),arm=new T.BoxGeometry(1.2,.08,.08),head=new T.BoxGeometry(.7,.1,.22),cone=new T.ConeGeometry(2.3,6.2,18,1,true);
    const poleM=new T.MeshStandardMaterial({color:0x1b1d26,metalness:.8,roughness:.4});const cols=[0xbfe6ff,0xffd2a0,0xd4b8ff];
    const make=(x,z,dx,dz)=>{const c=pick(cols);const p=new T.Mesh(pole,poleM);p.position.set(x,3.2,z);scene.add(p);
      const a=new T.Mesh(arm,poleM);a.position.set(x+dx*.55,6.3,z+dz*.55);a.rotation.y=Math.atan2(dz,-dx)+Math.PI/2;scene.add(a);
      const h=new T.Mesh(head,new T.MeshBasicMaterial({color:c,toneMapped:false}));h.position.set(x+dx*1.05,6.22,z+dz*1.05);h.rotation.y=a.rotation.y;scene.add(h);
      const b=new T.Mesh(cone,new T.MeshBasicMaterial({color:c,transparent:true,opacity:.05,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false}));b.position.set(x+dx*1.05,3.1,z+dz*1.05);scene.add(b);addBox(x,z,.3,.3);};
    [-60,-20,20,60].forEach(l=>[-40,0,40].forEach(t=>{if(Math.abs(l)===20&&t===0)return;[-1,1].forEach(s=>{make(l+s*5.4,t+(s>0?4:-4),-s,0);make(t+(s>0?-4:4),l+s*5.4,0,-s);});}));}
  plight(0xff2d9a,2.6,32,20,5,20);plight(0x39f0ff,2.6,32,-20,5,-20);plight(0xf2b030,2.4,30,20,5,-20);plight(0x9a6bff,2.6,32,-20,5,20);
  plight(0x39f0ff,2.2,30,60,5,-60);plight(0xff2d78,2.2,30,-60,5,0);

  // plaza
  [6,9.5].forEach((r,i)=>{const m=new T.Mesh(new T.RingGeometry(r-.06,r,64),new T.MeshBasicMaterial({color:i?0xff2d78:0x39f0ff,toneMapped:false,transparent:true,opacity:.6}));m.rotation.x=-Math.PI/2;m.position.y=.15;scene.add(m);});
  {const ped=new T.Mesh(new T.CylinderGeometry(2.1,2.4,.9,24),new T.MeshStandardMaterial({color:0x1a1824,metalness:.8,roughness:.3}));ped.position.y=.55;scene.add(ped);addBox(0,0,4,4,true);
    const pr=new T.Mesh(new T.TorusGeometry(2.15,.05,6,40),neonMat(0x39f0ff));pr.rotation.x=Math.PI/2;pr.position.y=1.02;scene.add(pr);
    const beam=new T.Mesh(new T.CylinderGeometry(1.6,.6,12,24,1,true),holoMat(0x39f0ff,.35));beam.position.y=7;scene.add(beam);
    const J=new T.Group();J.position.set(0,15,0);scene.add(J);
    const bell=new T.Mesh(new T.SphereGeometry(5.2,40,20,0,TAU,0,Math.PI*.56),holoMat(0x5ef6ff,1));J.add(bell);
    const inner=new T.Mesh(new T.SphereGeometry(3.2,30,14,0,TAU,0,Math.PI*.5),holoMat(0xff7ad9,.7));inner.position.y=-.3;J.add(inner);
    const tents=[];const tm=new T.LineBasicMaterial({color:0x8ff9ff,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
    for(let i=0;i<16;i++){const a=i/16*TAU,r=i%2?4.3:2.2;const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(78),3));const l=new T.Line(g,tm);l.frustumCulled=false;J.add(l);tents.push({l,a,r,ph:rng()*TAU,len:i%2?9:13});}
    PLAZA.jelly={J,bell,inner,tents};plight(0x39f0ff,3.2,34,0,10,0);}
  {const st=new T.Group();st.position.set(8,0,-9);scene.add(st);
    const wood=new T.MeshStandardMaterial({color:0x4a2a1a,roughness:.7,metalness:.1});
    const counter=new T.Mesh(new T.BoxGeometry(4.2,1.05,1.3),wood);counter.position.set(0,.6,0);st.add(counter);
    const top=new T.Mesh(new T.BoxGeometry(4.4,.06,1.5),new T.MeshStandardMaterial({color:0x1a1210,roughness:.2,metalness:.6}));top.position.set(0,1.14,.05);st.add(top);
    [[-2,-.6],[2,-.6],[-2,.6],[2,.6]].forEach(([x,z])=>{const p=new T.Mesh(new T.BoxGeometry(.1,2.6,.1),wood);p.position.set(x,1.3,z);st.add(p);});
    const roof=new T.Mesh(new T.BoxGeometry(4.8,.12,2.2),new T.MeshStandardMaterial({color:0x6a1018,roughness:.6}));roof.position.set(0,2.65,.2);roof.rotation.x=-.12;st.add(roof);
    const curtain=new T.Mesh(new T.PlaneGeometry(4.2,.55),new T.MeshBasicMaterial({color:0x3a0a12,side:T.DoubleSide}));curtain.position.set(0,2.3,.75);st.add(curtain);
    for(let i=0;i<4;i++){const l=new T.Mesh(new T.SphereGeometry(.17,12,8),neonMat(0xff4020));l.scale.y=1.3;l.position.set(-1.6+i*1.05,2.15,1.05);st.add(l);}
    addBox(8,-9,4.4,1.5,true);plight(0xff7a3a,2.6,14,8,2.4,-7.4);
    placeSign(8,2.32,-8.22,0,1,"OKAMI RAMEN",0,false,.48);placeSign(10.35,.2,-9,1,0,"ラーメン",0,true,.55);
    PLAZA.steam={x:8,y:1.3,z:-9.1};
    for(let i=0;i<3;i++){const s=new T.Mesh(new T.CylinderGeometry(.2,.2,.65,10),new T.MeshStandardMaterial({color:0x2a2a30,metalness:.6,roughness:.4}));s.position.set(7+i*1.1,.33,-7.9);scene.add(s);}}
  PLAZA.scanners=[];
  [[-12,-12],[12,-12],[-12,12],[12,12]].forEach(([x,z])=>{
    const p=new T.Mesh(new T.BoxGeometry(.5,3.3,.5),new T.MeshStandardMaterial({color:0x161822,metalness:.8,roughness:.3}));p.position.set(x,1.65,z);scene.add(p);addBox(x,z,.6,.6);
    const strip=new T.Mesh(new T.BoxGeometry(.52,2.6,.06),neonMat(0x39f0ff));strip.position.set(x,1.7,z+(z<0?.24:-.24));scene.add(strip);
    const ring=new T.Mesh(new T.TorusGeometry(.75,.03,6,40),holoMat(0x39f0ff,1.2));ring.position.set(x,3.6,z);scene.add(ring);
    const sweep=new T.Mesh(new T.ConeGeometry(4,3.5,24,1,true),holoMat(0x39f0ff,.18));sweep.position.set(x,1.75,z);scene.add(sweep);
    PLAZA.scanners.push({ring,sweep});});
  {const k=new T.Mesh(new T.BoxGeometry(1.4,2.2,.8),new T.MeshStandardMaterial({color:0x14202a,metalness:.7,roughness:.3}));k.position.set(-9,1.1,-8);scene.add(k);addBox(-9,-8,1.4,.8,true);
    const ks=new T.Mesh(new T.PlaneGeometry(1.1,1.2),holoMat(0x2bff9a,1));ks.position.set(-9,1.35,-7.58);scene.add(ks);
    placeSign(-9,2.25,-7.62,0,1,"HUE CARE",5,false,.42);}
  [[-7,7,0],[7,7,0],[-11,0,1],[11,0,1]].forEach(([x,z,r])=>{const b=new T.Mesh(new T.BoxGeometry(2.4,.45,.6),CURB_MAT);b.position.set(x,.36,z);b.rotation.y=r*Math.PI/2;scene.add(b);addBox(x,z,r?.6:2.4,r?2.4:.6,true);});

  // live stress billboard + hue care holo ad
  BOARD.c=document.createElement('canvas');BOARD.c.width=1024;BOARD.c.height=512;BOARD.g=BOARD.c.getContext('2d');BOARD.tex=canvasTex(BOARD.c);
  {const m=new T.Mesh(new T.PlaneGeometry(18,9),new T.MeshBasicMaterial({map:BOARD.tex,toneMapped:false,transparent:true}));m.position.set(0,17,-28.85);scene.add(m);
    const fr=new T.Mesh(new T.BoxGeometry(18.6,9.6,.3),new T.MeshStandardMaterial({color:0x111018,metalness:.8,roughness:.3}));fr.position.set(0,17,-29.05);scene.add(fr);
    const c=document.createElement('canvas');c.width=512;c.height=768;const g=c.getContext('2d');
    g.strokeStyle='#2bff9a';g.lineWidth=6;g.shadowColor='#2bff9a';g.shadowBlur=20;g.strokeRect(16,16,480,736);
    g.fillStyle='#2bff9a';g.textAlign='center';g.font=`700 120px ${JPF}`;g.fillText('色相',256,220);g.fillText('診断',256,350);
    g.font=`700 52px ${HUDF}`;g.fillText('HUE CARE',256,470);g.shadowBlur=6;g.fillStyle='#d6fff0';g.font=`500 32px ${HUDF}`;
    g.fillText('Keep your colors clear.',256,560);g.fillText('Free counseling · 24h',256,610);g.font=`600 26px ${MONOF}`;g.fillText('WARD 7 · KIOSKS IN EVERY PLAZA',256,690);
    const ad=new T.Mesh(new T.PlaneGeometry(8,12),new T.MeshBasicMaterial({map:canvasTex(c),transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
    ad.position.set(-28.6,14,4);ad.rotation.y=Math.PI/2;scene.add(ad);}
  drawBoard(40);

  // flying traffic
  {const body=new T.BoxGeometry(3.2,.7,1.5),cab=new T.BoxGeometry(1.4,.5,1.2);
    const bm=new T.MeshStandardMaterial({color:0x1d1f2a,metalness:.9,roughness:.25});
    const head=new T.MeshBasicMaterial({color:0xeaf4ff,toneMapped:false}),tail=new T.MeshBasicMaterial({color:0xff2040,toneMapped:false});
    for(let i=0;i<18;i++){const g=new T.Group();g.add(new T.Mesh(body,bm));const c=new T.Mesh(cab,bm);c.position.set(-.2,.55,0);g.add(c);
      const h=new T.Mesh(new T.BoxGeometry(.08,.14,1.2),head);h.position.set(1.62,0,0);g.add(h);
      const t2=new T.Mesh(new T.BoxGeometry(.08,.14,1.3),tail);t2.position.set(-1.62,0,0);g.add(t2);
      const u=new T.Mesh(new T.BoxGeometry(2.8,.05,1.3),neonMat(pick(NEON)));u.position.y=-.38;g.add(u);scene.add(g);
      FLYERS.push({g,r:R(70,190),a:rng()*TAU,sp:R(.05,.13)*(rng()<.5?-1:1),y:R(34,95),cx:R(-30,30),cz:R(-30,30)});}}

  // patrol car (lands during the intro, then parks)
  {const g=new T.Group();const bm=new T.MeshStandardMaterial({color:0x10141f,metalness:.9,roughness:.25});
    const body=new T.Mesh(new T.BoxGeometry(1.9,.8,4.4),bm);body.position.y=.75;g.add(body);
    const cab=new T.Mesh(new T.BoxGeometry(1.6,.6,2),new T.MeshStandardMaterial({color:0x0a1a24,metalness:.9,roughness:.1}));cab.position.set(0,1.38,-.2);g.add(cab);
    const stripe=new T.Mesh(new T.BoxGeometry(1.95,.08,4.45),neonMat(0x39f0ff));stripe.position.y=.62;g.add(stripe);
    const red=new T.MeshBasicMaterial({color:0xff2040,toneMapped:false}),blue=new T.MeshBasicMaterial({color:0x2060ff,toneMapped:false});
    const lr=new T.Mesh(new T.BoxGeometry(.6,.12,.25),red);lr.position.set(-.35,1.75,-.2);g.add(lr);
    const lb=new T.Mesh(new T.BoxGeometry(.6,.12,.25),blue);lb.position.set(.35,1.75,-.2);g.add(lb);
    const hl=new T.Mesh(new T.BoxGeometry(1.5,.1,.06),new T.MeshBasicMaterial({color:0xeaf4ff,toneMapped:false}));hl.position.set(0,.8,-2.22);g.add(hl);
    const thr=new T.Mesh(new T.CylinderGeometry(.5,.7,.1,16),new T.MeshBasicMaterial({color:0x39f0ff,transparent:true,opacity:.5,blending:T.AdditiveBlending,toneMapped:false}));thr.position.y=.3;g.add(thr);
    const pl=new T.PointLight(0xff2040,0,14,2);pl.position.set(0,2.4,0);g.add(pl);
    g.position.set(0,0.0,34);scene.add(g);addBox(0,34,2,4.6,true);
    PATROL={g,red,blue,pl,thr,land:1};}

  // rain & mist
  RN=IS_TOUCH?1500:2800;rainPos=new Float32Array(RN*6);
  rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));
  {const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0x9fbfff,transparent:true,opacity:.33,toneMapped:false}));rain.frustumCulled=false;scene.add(rain);}
  for(let i=0;i<RN;i++)respawnDrop(i,0,0,false);
  {const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);const t=canvasTex(c);
    for(let i=0;i<26;i++){const s=new T.Sprite(new T.SpriteMaterial({map:t,color:pick([0x7a50c8,0x2a8aa8,0xa04080]),transparent:true,opacity:.09,depthWrite:false,blending:T.AdditiveBlending}));
      const L=pick([-60,-20,20,60]),along=R(-62,62),onX=rng()<.5;s.position.set(onX?L+R(-4,4):along,R(.8,2.6),onX?along:L+R(-4,4));s.scale.set(R(10,18),R(3,6),1);scene.add(s);MIST.push({s,v:R(.2,.6)});}}
}
function respawnDrop(i,cx,cz,top){const x=cx+MR(-26,26),z=cz+MR(-26,26),y=top?MR(14,26):MR(0,26);const j=i*6;rainPos[j]=x;rainPos[j+1]=y;rainPos[j+2]=z;rainPos[j+3]=x+.1;rainPos[j+4]=y-.62;rainPos[j+5]=z;}
function drawBoard(stress){
  const g=BOARD.g,W=1024,H=512;g.clearRect(0,0,W,H);g.fillStyle='rgba(6,8,18,.92)';g.fillRect(0,0,W,H);
  const col=stress>70?'#ff2d55':stress>45?'#f2e600':'#39f0ff';
  g.strokeStyle=col;g.lineWidth=6;g.strokeRect(10,10,W-20,H-20);
  g.fillStyle=col;g.font=`700 44px ${HUDF}`;g.textAlign='left';g.fillText('AREA STRESS LEVEL',50,90);
  g.font=`700 44px ${JPF}`;g.textAlign='right';g.fillText('区域ストレス',W-50,90);
  g.textAlign='left';g.font=`600 190px ${MONOF}`;g.fillText(String(Math.round(stress)).padStart(2,'0')+'%',44,290);
  g.fillStyle='rgba(255,255,255,.12)';g.fillRect(50,330,W-100,26);g.fillStyle=col;g.fillRect(50,330,(W-100)*stress/100,26);
  g.fillStyle='#d6f6ff';g.font=`500 36px ${HUDF}`;
  const msgs=['Please remain calm. Breathe with the light.','Clouded? Visit a Hue Care kiosk today.','Public Safety is watching over Ward 7.'];
  g.fillText(msgs[Math.floor(performance.now()/5000)%3],50,430);
  g.font=`600 26px ${MONOF}`;g.fillStyle='#7a8aa3';g.fillText('WARD 7 · KAGERO DISTRICT · LIVE',50,478);
  BOARD.tex.needsUpdate=true;
}
function updateWorld(dt,t){
  const J=PLAZA.jelly;J.J.rotation.y+=dt*.12;J.J.position.y=15+Math.sin(t*.6)*.8;const pul=Math.sin(t*1.4);J.bell.scale.set(1+pul*.06,.78-pul*.05,1+pul*.06);J.inner.scale.set(1-pul*.05,.7+pul*.04,1-pul*.05);
  for(const tn of J.tents){const a=tn.l.geometry.attributes.position.array;for(let i=0;i<26;i++){const u=i/25,r=tn.r*(1-u*.35),sw=Math.sin(t*1.6-u*5+tn.ph)*u*1.3;a[i*3]=Math.cos(tn.a)*r+Math.cos(tn.a+1.57)*sw;a[i*3+1]=-u*tn.len-.2;a[i*3+2]=Math.sin(tn.a)*r+Math.sin(tn.a+1.57)*sw;}tn.l.geometry.attributes.position.needsUpdate=true;}
  PLAZA.scanners.forEach((s,i)=>{s.ring.rotation.x=Math.PI/2+Math.sin(t+i)*.3;s.ring.rotation.y+=dt*2;s.sweep.rotation.y+=dt*.8;});
  if(Math.random()<dt*14)emit(PLAZA.steam.x+MR(-.8,.8),PLAZA.steam.y,PLAZA.steam.z+MR(-.3,.3),MR(-.1,.1),MR(.4,.9),MR(-.1,.1),0x55525e,2.2,-.04);
  for(const f of FLYERS){f.a+=f.sp*dt;f.g.position.set(f.cx+Math.cos(f.a)*f.r,f.y,f.cz+Math.sin(f.a)*f.r);const dx=-Math.sin(f.a)*Math.sign(f.sp),dz=Math.cos(f.a)*Math.sign(f.sp);f.g.rotation.y=Math.atan2(-dz,dx);}
  const blink=Math.sin(t*3)>.2;BEACONS.forEach((b,i)=>b.visible=(i%2?blink:!blink));
  for(const fl of FLICKER){const v=Math.sin(t*23+fl.seed)*Math.sin(t*7.3+fl.seed*2);fl.mat.opacity=v>.75?.15:1;}
  for(const m of MIST){m.s.position.x+=m.v*dt;if(m.s.position.x>70)m.s.position.x=-70;}
  // patrol car lights
  const ph=Math.sin(t*9)>0;PATROL.red.color.setHex(ph?0xff2040:0x300008);PATROL.blue.color.setHex(ph?0x100830:0x2060ff);PATROL.pl.color.setHex(ph?0xff2040:0x2060ff);PATROL.pl.intensity=2.2;
  PATROL.g.position.y=PATROL.land*0+Math.max(0,PATROL.g.position.y);PATROL.thr.material.opacity=.25+.25*Math.sin(t*20);
  // rain
  const cx=camera.position.x,cz=camera.position.z;
  for(let i=0;i<RN;i++){const j=i*6;rainPos[j+1]-=26*dt;rainPos[j+4]-=26*dt;rainPos[j]+=1.2*dt;rainPos[j+3]+=1.2*dt;
    if(rainPos[j+4]<0||Math.abs(rainPos[j]-cx)>27||Math.abs(rainPos[j+2]-cz)>27)respawnDrop(i,cx,cz,rainPos[j+4]<0);}
  rainGeo.attributes.position.needsUpdate=true;
  sky.position.copy(camera.position);
}
