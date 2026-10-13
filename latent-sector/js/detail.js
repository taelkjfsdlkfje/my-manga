"use strict";
/* ============ detail: cars, storefronts, facade clutter, cables, holo-ads, street props ============
   Built from rng() after the core city, so every client gets the same street. */
const ADS=[],VENTS=[];
const PAINTS=[0x0e1218,0x1a0f1e,0x2a2f3a,0x6a0f18,0xd8d8dc,0x0f2a3a,0x3a3a40,0x101010];
function makeCar(o={}){
  const g=new T.Group();
  const prof=new T.Shape();
  [[-2.2,.32],[-2.28,.62],[-2.18,.86],[-1.75,.98],[-.72,1.04],[-.3,1.44],[.95,1.48],[1.62,1.08],[2.18,.98],[2.27,.62],[2.18,.32]].forEach((p,i)=>i?prof.lineTo(p[0],p[1]):prof.moveTo(p[0],p[1]));
  prof.closePath();
  const ext=(sh,depth,bev)=>{const geo=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:4,curveSegments:8});geo.translate(0,0,-depth/2);geo.rotateY(Math.PI/2);return geo;};
  const paint=o.police?0x0b0f18:(o.paint??PAINTS[Math.floor(rng()*PAINTS.length)]);
  const body=new T.Mesh(ext(prof,1.62,.1),new T.MeshPhysicalMaterial({color:paint,metalness:.6,roughness:.32,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.3}));g.add(body);
  const gl=new T.Shape();[[-.62,1.05],[-.24,1.41],[.9,1.44],[1.52,1.08]].forEach((p,i)=>i?gl.lineTo(p[0],p[1]):gl.moveTo(p[0],p[1]));gl.closePath();
  const glass=new T.Mesh(ext(gl,1.7,.06),new T.MeshPhysicalMaterial({color:0x05070c,metalness:.9,roughness:.04,clearcoat:1,envMapIntensity:1.6}));g.add(glass);
  const tire=new T.MeshStandardMaterial({color:0x0a0a0c,roughness:.9}),rim=new T.MeshStandardMaterial({color:0x9aa0aa,metalness:1,roughness:.25});
  for(const [x,z] of [[-.86,1.42],[.86,1.42],[-.86,-1.42],[.86,-1.42]]){
    const w=new T.Mesh(new T.CylinderGeometry(.34,.34,.26,24).rotateZ(Math.PI/2),tire);w.position.set(x,.34,z);g.add(w);
    const r=new T.Mesh(new T.CylinderGeometry(.2,.2,.27,16).rotateZ(Math.PI/2),rim);r.position.set(x,.34,z);g.add(r);}
  const head=new T.Mesh(new T.RoundedBoxGeometry(1.5,.07,.08,2,.03),new T.MeshBasicMaterial({color:0xeaf4ff,toneMapped:false}));head.position.set(0,.84,2.3);g.add(head);
  const tail=new T.Mesh(new T.RoundedBoxGeometry(1.6,.06,.08,2,.025),new T.MeshBasicMaterial({color:new T.Color(0xff1030).multiplyScalar(1.6),toneMapped:false}));tail.position.set(0,.9,-2.3);g.add(tail);
  const under=NEON[Math.floor(rng()*NEON.length)];
  const thr=new T.Mesh(new T.PlaneGeometry(1.7,4.1).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:o.police?0x39f0ff:under,transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));thr.position.y=.03;g.add(thr);
  let red=null,blue=null;
  if(o.police){
    red=new T.MeshBasicMaterial({color:0xff2040,toneMapped:false});blue=new T.MeshBasicMaterial({color:0x2060ff,toneMapped:false});
    const bar=new T.Mesh(new T.RoundedBoxGeometry(1.1,.1,.26,2,.04),new T.MeshStandardMaterial({color:0x111111,metalness:.8,roughness:.3}));bar.position.set(0,1.56,.3);g.add(bar);
    const lr=new T.Mesh(new T.RoundedBoxGeometry(.5,.1,.22,2,.04),red);lr.position.set(-.28,1.62,.3);g.add(lr);
    const lb=new T.Mesh(new T.RoundedBoxGeometry(.5,.1,.22,2,.04),blue);lb.position.set(.28,1.62,.3);g.add(lb);
    for(const s of [-1,1]){const st=new T.Mesh(new T.BoxGeometry(.02,.05,4.2),neonMat(0x39f0ff));st.position.set(s*.92,.66,0);g.add(st);}
    const dc=document.createElement('canvas');dc.width=512;dc.height=64;const gx=dc.getContext('2d');gx.fillStyle='#d6f6ff';gx.font=`700 40px ${HUDF}`;gx.textAlign='center';gx.textBaseline='middle';gx.fillText('PUBLIC SAFETY · 公安局',256,34);
    for(const s of [-1,1]){const p=new T.Mesh(new T.PlaneGeometry(2.4,.3),new T.MeshBasicMaterial({map:canvasTex(dc),transparent:true,depthWrite:false}));p.position.set(s*.925,.82,0);p.rotation.y=s*Math.PI/2;g.add(p);}
  }
  return {g,red,blue,thr};
}

function shopTex(kind){
  const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  const bg=[['#2a1408','#ff9a3a'],['#06202a','#39f0ff'],['#1a0820','#ff4fd8'],['#0a1a10','#2bff9a'],['#201a08','#f2e600'],['#140a20','#b18cff']][kind];
  const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,bg[1]);gr.addColorStop(.25,bg[0]);gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,256,128);
  g.globalAlpha=.85;
  for(let s=0;s<3;s++){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(8,40+s*28,240,3);for(let k=0;k<14;k++){g.fillStyle=`hsla(${(Math.random()*360)|0},70%,${50+Math.random()*30}%,.8)`;g.fillRect(10+k*17,22+s*28,12,17);}}
  if(kind===0){g.fillStyle='rgba(255,220,180,.9)';g.fillRect(0,96,256,6);}
  g.globalAlpha=1;g.fillStyle='rgba(0,0,0,.55)';for(let x=0;x<256;x+=64)g.fillRect(x,0,3,128); // window frames
  for(let y=0;y<128;y+=4){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y,256,1);}
  return canvasTex(c);
}
function grilleTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#4a4e58';g.fillRect(0,0,64,64);g.fillStyle='#1a1c22';g.beginPath();g.arc(32,32,24,0,TAU);g.fill();g.strokeStyle='#5a5e68';for(let r=6;r<24;r+=4){g.beginPath();g.arc(32,32,r,0,TAU);g.stroke();}return canvasTex(c);}

function buildDetail(){
  const STREETS=[-60,-20,20,60];
  const facades=[];
  for(const b of BUILDINGS){
    const ring=Math.abs(b.cx)>70||Math.abs(b.cz)>70;
    for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const fx=b.cx+nx*b.w/2,fz=b.cz+nz*b.d/2;
      // keep faces that look onto a street (the next thing out from the face is road, not another building)
      const ox=fx+nx*3,oz=fz+nz*3;let blocked=false;for(const q of BUILDINGS){if(q===b)continue;if(Math.abs(ox-q.cx)<q.w/2&&Math.abs(oz-q.cz)<q.d/2){blocked=true;break;}}
      if(blocked)continue;if(ring&&(nx*fx+nz*fz)>0)continue;
      facades.push({b,nx,nz,fx,fz,span:nx!==0?b.d:b.w});
    }
  }
  const M=new T.Matrix4(),Q=new T.Quaternion(),P=new V3(),Sc=new V3(),C=new T.Color();
  const inst=(geo,mat,n)=>{const m=new T.InstancedMesh(geo,mat,n);m.count=0;m.frustumCulled=false;scene.add(m);return m;};
  const put=(im,x,y,z,sx,sy,sz,ry,col)=>{if(im.count>=im.instanceMatrix.count)return;Q.setFromAxisAngle(new V3(0,1,0),ry||0);P.set(x,y,z);Sc.set(sx,sy,sz);M.compose(P,Q,Sc);im.setMatrixAt(im.count,M);if(col!=null){C.setHex(col);im.setColorAt(im.count,C);}im.count++;};
  const metal=new T.MeshStandardMaterial({color:0x2a2c34,metalness:.7,roughness:.45,envMapIntensity:1});
  const LEDGE=inst(new T.BoxGeometry(1,1,1),metal,1600);
  const AC=inst(new T.RoundedBoxGeometry(1,1,1,2,.08),new T.MeshStandardMaterial({color:0x8a8e98,metalness:.4,roughness:.55,map:grilleTex()}),500);
  const STRIP=inst(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),400);
  const TANK=inst(new T.CylinderGeometry(.5,.5,1,18),new T.MeshStandardMaterial({color:0x3a3e46,metalness:.6,roughness:.5}),200);
  const AWN=inst(new T.RoundedBoxGeometry(1,1,1,2,.04),new T.MeshStandardMaterial({color:0xffffff,roughness:.7,metalness:.1}),220);
  const PIPE=inst(new T.CylinderGeometry(.08,.08,1,8),metal,300);
  const shopMats=[0,1,2,3,4,5].map(k=>new T.MeshBasicMaterial({map:shopTex(k),toneMapped:false,color:new T.Color(1,1,1).multiplyScalar(.95)}));
  const shopGeo=new T.PlaneGeometry(1,1);

  for(const b of BUILDINGS){
    // floor ledges on some towers
    if(rng()<.45){const step=rng()<.5?3:6;for(let y=6;y<Math.min(b.h-1,70);y+=step)put(LEDGE,b.cx,y,b.cz,b.w+.32,.12,b.d+.32);}
    // corner light strips
    if(rng()<.35){const col=NEON[Math.floor(rng()*NEON.length)];for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]])put(STRIP,b.cx+sx*(b.w/2+.04),4+(b.h-4)/2,b.cz+sz*(b.d/2+.04),.1,b.h-4,.1,0,col);}
    // roof: tanks, plant, parapet
    const nt=Math.floor(rng()*3);for(let i=0;i<nt;i++){const r=R(.8,1.5),hh=R(1.5,3);put(TANK,b.cx+R(-b.w/3,b.w/3),b.h+hh/2,b.cz+R(-b.d/3,b.d/3),r*2,hh,r*2);}
    for(let i=0;i<3;i++)put(LEDGE,b.cx+R(-b.w/3,b.w/3),b.h+.5,b.cz+R(-b.d/3,b.d/3),R(1,3),1,R(1,2.5));
    put(LEDGE,b.cx,b.h+.35,b.cz,b.w+.1,.7,b.d+.1);
  }
  for(const f of facades){
    const {b,nx,nz,fx,fz,span}=f,ry=Math.atan2(nx,nz),tx=nz,tz=-nx; // tangent along the face
    // storefront at street level
    const sw=Math.min(span-1.2,R(5,9)),off=R(-(span-sw)/2+.6,(span-sw)/2-.6);
    const cx=fx+tx*off+nx*.06,cz=fz+tz*off+nz*.06;
    const shop=new T.Mesh(shopGeo,shopMats[Math.floor(rng()*shopMats.length)]);shop.scale.set(sw,2.6,1);shop.position.set(cx,1.55,cz);shop.rotation.y=ry;scene.add(shop);
    if(rng()<.65){const col=[0x3a0a14,0x0a2a3a,0x2a0a3a,0x1a1a1a,0x3a2a0a][Math.floor(rng()*5)];
      Q.setFromAxisAngle(new V3(0,1,0),ry);const tilt=new T.Quaternion().setFromAxisAngle(new V3(1,0,0),-.32);Q.multiply(tilt);
      P.set(cx+nx*.75,3.25,cz+nz*.75);Sc.set(sw+.4,.08,1.6);M.compose(P,Q,Sc);if(AWN.count<AWN.instanceMatrix.count){AWN.setMatrixAt(AWN.count,M);C.setHex(col);AWN.setColorAt(AWN.count,C);AWN.count++;}
      put(STRIP,cx+nx*1.52,3.0,cz+nz*1.52,nz!==0?sw+.4:.05,.05,nx!==0?sw+.4:.05,0,NEON[Math.floor(rng()*NEON.length)]);}
    // AC units and pipes up the wall
    const na=Math.floor(R(0,6));for(let i=0;i<na;i++){const o2=R(-span/2+1,span/2-1),y=4.6+Math.floor(R(0,6))*3+.4;put(AC,fx+tx*o2+nx*.3,y,fz+tz*o2+nz*.3,nz!==0?.9:.55,.6,nx!==0?.9:.55,ry);}
    if(rng()<.4){const o2=R(-span/2+.5,span/2-.5);put(PIPE,fx+tx*o2+nx*.12,Math.min(b.h,30)/2,fz+tz*o2+nz*.12,1,Math.min(b.h,30),1);}
  }
  [LEDGE,AC,STRIP,TANK,AWN,PIPE].forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;});

  // parked cars along the curbs, away from crosswalks and the patrol car
  for(const L of STREETS)for(const side of [-1,1])for(let t=-56;t<=56;t+=R(9,16)){
    if(Math.abs(t)<9||Math.abs(Math.abs(t)-20)<7||Math.abs(Math.abs(t)-60)<7)continue;if(rng()<.45)continue;
    const alongZ=rng()<.5;const car=makeCar();
    const x=alongZ?L+side*4.1:t,z=alongZ?t:L+side*4.1;
    if(Math.abs(x)<6&&Math.abs(z-34)<6)continue;
    car.g.position.set(x,0,z);car.g.rotation.y=alongZ?(side>0?0:Math.PI):(side>0?Math.PI/2:-Math.PI/2);scene.add(car.g);
    addBox(x,z,alongZ?2:4.7,alongZ?4.7:2,true);
  }

  // vending machines and steam vents
  const vm=new T.RoundedBoxGeometry(1,1.95,.8,2,.06);
  const vmTex=(()=>{const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');g.fillStyle='#0a1830';g.fillRect(0,0,128,256);
    for(let r=0;r<5;r++)for(let k=0;k<5;k++){g.fillStyle=`hsl(${(Math.random()*360)|0},80%,60%)`;g.fillRect(10+k*22,16+r*30,14,22);}
    g.fillStyle='#39f0ff';g.fillRect(0,0,128,8);g.fillStyle='#fff';g.font=`700 22px ${JPF}`;g.fillText('飲料',40,200);return canvasTex(c);})();
  const vmMat=[new T.MeshStandardMaterial({color:0xd0d4dc,metalness:.5,roughness:.4}),new T.MeshStandardMaterial({color:0xd0d4dc,metalness:.5,roughness:.4}),new T.MeshStandardMaterial({color:0xd0d4dc,metalness:.5,roughness:.4}),new T.MeshStandardMaterial({color:0xd0d4dc,metalness:.5,roughness:.4}),
    new T.MeshStandardMaterial({color:0x222222,emissive:0xffffff,emissiveMap:vmTex,emissiveIntensity:1.4,map:vmTex}),new T.MeshStandardMaterial({color:0xd0d4dc,metalness:.5,roughness:.4})];
  for(let i=0;i<22;i++){const f=facades[Math.floor(rng()*facades.length)];if(!f)break;const o2=R(-f.span/2+1,f.span/2-1);
    const x=f.fx+f.nz*o2+f.nx*.45,z=f.fz-f.nx*o2+f.nz*.45;if(Math.hypot(x,z)<14)continue;
    const m=new T.Mesh(vm,vmMat);m.position.set(x,.98+.14,z);m.rotation.y=Math.atan2(f.nx,f.nz);scene.add(m);addBox(x,z,1,1,true);}
  for(const L of STREETS)for(let i=0;i<2;i++){const t=R(-50,50);const alongZ=rng()<.5;const x=alongZ?L+R(-1.5,1.5):t,z=alongZ?t:L+R(-1.5,1.5);
    const mh=new T.Mesh(new T.CylinderGeometry(.45,.45,.02,20),new T.MeshStandardMaterial({color:0x1a1a1e,metalness:.9,roughness:.5}));mh.position.set(x,.02,z);scene.add(mh);VENTS.push({x,z});}

  // overhead cables and lantern strings across the streets
  {const pts=[],lan=[];
    for(const L of STREETS)for(let t=-58;t<=58;t+=R(5,11)){
      if(rng()<.3)continue;const alongZ=rng()<.5;
      const y1=R(7,16),y2=y1+R(-2,2),sag=R(.8,2.4),n=14;
      const a=alongZ?new V3(L-9,y1,t):new V3(t,y1,L-9),b=alongZ?new V3(L+9,y2,t+R(-3,3)):new V3(t+R(-3,3),y2,L+9);
      let prev=null;for(let i=0;i<=n;i++){const u=i/n;const p=a.clone().lerp(b,u);p.y-=Math.sin(u*Math.PI)*sag;if(prev)pts.push(prev.x,prev.y,prev.z,p.x,p.y,p.z);prev=p;
        if(rng()<.18&&i>0&&i<n)lan.push(p.clone());}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));
    scene.add(new T.LineSegments(g,new T.LineBasicMaterial({color:0x07070a})));
    const lm=inst(new T.SphereGeometry(.22,12,8),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),lan.length||1);
    lan.forEach(p=>put(lm,p.x,p.y-.3,p.z,1,1.3,1,0,rng()<.6?0xff3a2a:0xffb040));lm.instanceMatrix.needsUpdate=true;if(lm.instanceColor)lm.instanceColor.needsUpdate=true;}

  // giant animated holo-ads on the towers around the plaza
  const adSpots=[];
  for(const f of facades){const b=f.b;if(b.h<40)continue;const d=Math.hypot(f.fx,f.fz);if(d>48)continue;adSpots.push(f);}
  adSpots.sort((a,b)=>Math.hypot(a.fx,a.fz)-Math.hypot(b.fx,b.fz));
  const kinds=['care','koi','sync','index','kanji'];
  adSpots.slice(0,5).forEach((f,i)=>{
    const vert=kinds[i]!=='index';const w=vert?7:14,h=vert?13:7;
    const c=document.createElement('canvas');c.width=vert?256:512;c.height=vert?512:256;const tex=canvasTex(c);
    const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,color:new T.Color(1.25,1.25,1.25)}));
    const y=Math.min(f.b.h-h/2-2,R(16,26));m.position.set(f.fx+f.nx*.5,y,f.fz+f.nz*.5);m.rotation.y=Math.atan2(f.nx,f.nz);scene.add(m);
    const frame=new T.Mesh(new T.RoundedBoxGeometry(w+.5,h+.5,.3,2,.1),new T.MeshStandardMaterial({color:0x101014,metalness:.8,roughness:.3}));frame.position.copy(m.position).add(new V3(-f.nx*.25,0,-f.nz*.25));frame.rotation.y=m.rotation.y;scene.add(frame);
    ADS.push({kind:kinds[i],c,g:c.getContext('2d'),tex,t:0,ph:rng()*10});
  });
}

/* ad animation, drawn into canvases a few times a second */
function drawAd(a,t){
  const g=a.g,W=a.c.width,H=a.c.height;g.clearRect(0,0,W,H);
  g.fillStyle='rgba(4,6,14,.55)';g.fillRect(0,0,W,H);
  if(a.kind==='care'){
    const gr=g.createRadialGradient(W/2,H*.38,10,W/2,H*.38,W*.55);gr.addColorStop(0,'rgba(43,255,154,.9)');gr.addColorStop(.5,'rgba(43,200,255,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    for(let i=0;i<5;i++){g.strokeStyle=`rgba(200,255,230,${.5-i*.08})`;g.lineWidth=2;g.beginPath();g.arc(W/2,H*.38,40+i*22+Math.sin(t*2+i)*6,0,TAU);g.stroke();}
    g.fillStyle='#e8fff4';g.font=`700 64px ${JPF}`;g.textAlign='center';g.fillText('心理ケア',W/2,H*.75);
    g.font=`700 26px ${HUDF}`;g.fillText('KEEP YOUR COLORS CLEAR',W/2,H*.83);
    g.font=`600 18px ${MONOF}`;g.fillStyle='#2bff9a';g.fillText(`HUE CARE · ${(t*7%100).toFixed(1)}% CLEAR`,W/2,H*.9);
  }else if(a.kind==='koi'){
    g.fillStyle='rgba(10,30,80,.6)';g.fillRect(0,0,W,H);
    for(let r=0;r<4;r++){g.strokeStyle='rgba(120,200,255,.25)';g.beginPath();g.ellipse(W/2,H/2,((t*40+r*60)%240),((t*40+r*60)%240)*.4,0,0,TAU);g.stroke();}
    for(let k=0;k<3;k++){const ang=t*.7+k*2.1,x=W/2+Math.cos(ang)*W*.3,y=H/2+Math.sin(ang*1.3)*H*.3,dir=ang+Math.PI/2;
      g.save();g.translate(x,y);g.rotate(dir);g.fillStyle=k===1?'#ffffff':'#ff6a2b';g.beginPath();g.ellipse(0,0,14,38,0,0,TAU);g.fill();
      g.fillStyle='#ff2d55';g.beginPath();g.ellipse(0,-8,8,12,0,0,TAU);g.fill();g.fillStyle=k===1?'#ffd0b0':'#ffb080';g.beginPath();g.moveTo(0,34);g.lineTo(-14+Math.sin(t*8+k)*6,58);g.lineTo(14+Math.sin(t*8+k)*6,58);g.fill();g.restore();}
    g.fillStyle='#d6f6ff';g.font=`700 44px ${JPF}`;g.textAlign='center';g.fillText('陽炎',W/2,H-60);g.font=`600 18px ${HUDF}`;g.fillText('KAGERO AQUARIUM · 24H',W/2,H-30);
  }else if(a.kind==='sync'){
    for(let i=0;i<6;i++){g.save();g.translate(W/2,H*.4);g.rotate(t*(i%2?.6:-.4)+i);g.strokeStyle=['#ff2d78','#39f0ff','#b18cff'][i%3];g.lineWidth=3;g.beginPath();const n=3+i;for(let k=0;k<=n;k++){const an=k/n*TAU,r=30+i*16;k?g.lineTo(Math.cos(an)*r,Math.sin(an)*r):g.moveTo(Math.cos(an)*r,Math.sin(an)*r);}g.stroke();g.restore();}
    g.textAlign='center';g.font=`700 52px ${HUDF}`;g.fillStyle='#ff2d78';g.fillText('NEURO',W/2-3,H*.74);g.fillStyle='#39f0ff';g.fillText('NEURO',W/2+3,H*.74);g.fillStyle='#fff';g.fillText('NEURO',W/2,H*.74);
    g.font=`700 40px ${HUDF}`;g.fillStyle='#d6f6ff';g.fillText('//SYNC',W/2,H*.82);g.font=`600 16px ${MONOF}`;g.fillStyle='#b18cff';g.fillText('DREAM IN HIGHER RESOLUTION',W/2,H*.9);
  }else if(a.kind==='index'){
    g.fillStyle='#f2e600';g.font=`700 30px ${HUDF}`;g.textAlign='left';g.fillText('WARD 7 · HUE INDEX',24,44);
    g.font=`700 30px ${JPF}`;g.textAlign='right';g.fillText('色相指数',W-24,44);
    for(let i=0;i<24;i++){const v=.35+.3*Math.sin(t*1.3+i*.6)+.15*Math.sin(t*3.1+i*1.7);const bh=v*140;g.fillStyle=v>.7?'#ff2d55':v>.5?'#f2e600':'#39f0ff';g.fillRect(24+i*19.5,200-bh,13,bh);}
    g.font=`600 20px ${MONOF}`;g.fillStyle='#d6f6ff';g.textAlign='left';const msg='  KAGERO 41.2 ▲   SHINJI 38.0 ▼   MINATO 27.9 ▼   ASAHI 52.4 ▲   HUE CARE: FREE COUNSELING 24H   ';g.fillText(msg+msg,-(t*60%(msg.length*12)),236);
  }else{
    const sweep=(t*.5%1.4)-.2;const gr=g.createLinearGradient(0,H*sweep-60,0,H*sweep+60);gr.addColorStop(0,'rgba(255,45,120,0)');gr.addColorStop(.5,'rgba(255,45,120,.5)');gr.addColorStop(1,'rgba(255,45,120,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.font=`700 150px ${JPF}`;g.textAlign='center';g.fillStyle='#ff4fd8';g.fillText('潜',W/2,H*.32);g.fillText('在',W/2,H*.62);g.fillStyle='#ffd0f0';g.font=`700 30px ${HUDF}`;g.fillText('LATENT · CLUB',W/2,H*.78);
    g.font=`600 18px ${MONOF}`;g.fillStyle='#f2e600';g.fillText('B2F · OPEN UNTIL DAWN',W/2,H*.86);
  }
  for(let y=0;y<H;y+=3){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,y,W,1);}
  if(Math.random()<.04){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,Math.random()*H,W,R(4,20));}
  a.tex.needsUpdate=true;
}
let adT=0,adI=0;
function updateDetail(dt,t){
  adT-=dt;if(adT<=0&&ADS.length){adT=.06;drawAd(ADS[adI%ADS.length],t+ADS[adI%ADS.length].ph);adI++;}
  for(const v of VENTS)if(Math.random()<dt*10)emit(v.x+MR(-.3,.3),.1,v.z+MR(-.3,.3),MR(-.15,.15),MR(.6,1.2),MR(-.15,.15),0x605c70,MR(2,3.4),-.05);
  // rain splashes around the viewer
  const n=Math.floor(dt*(QUALITY.high?90:40));for(let i=0;i<n;i++){const x=camera.position.x+MR(-14,14),z=camera.position.z+MR(-14,14);emit(x,.05,z,MR(-.4,.4),MR(.6,1.2),MR(-.4,.4),0x8fa8d8,.16,.6);}
}
