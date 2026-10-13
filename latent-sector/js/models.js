"use strict";
/* ============ models: rigged glTF people with one shared, retargeted animation set ============ */
const MODEL_FILES={xbot:'models/Xbot.glb',soldier:'models/Soldier.glb',michelle:'models/Michelle.glb',rpm:'models/readyplayer.me.glb'};
const MODELS={};
const canon=n=>n.replace(/^mixamorig:?/,'');
const _q1=new T.Quaternion(),_q2=new T.Quaternion(),_q3=new T.Quaternion(),_m4=new T.Matrix4(),_p1=new V3(),_p2=new V3(),_s1=new V3();

function loadGLB(url,onProg){return new Promise((res,rej)=>new T.GLTFLoader().load(url,res,e=>onProg&&e.total&&onProg(e.loaded/e.total),rej));}
async function loadModels(onProgress){
  const keys=Object.keys(MODEL_FILES),prog={};
  const report=()=>onProgress&&onProgress(keys.reduce((a,k)=>a+(prog[k]||0),0)/keys.length);
  const gl={};
  await Promise.all(keys.map(async k=>{gl[k]=await loadGLB(MODEL_FILES[k],p=>{prog[k]=p;report();});prog[k]=1;report();}));
  for(const k of keys)MODELS[k]=prepModel(k,gl[k]);
  // the shared animation set comes from the mannequin; everyone else gets a baked retarget
  const src=MODELS.xbot,want=['idle','walk','run','headShake','agree','sad_pose'];
  for(const k of keys){const m=MODELS[k];m.clips={};
    for(const name of want){const c=src.raw.find(a=>a.name===name);if(!c)continue;
      m.clips[name]=k==='xbot'?stripPos(c):bakeRetarget(src,m,c);}}
  // soldiers keep their own walk cycle, which reads heavier
  {const s=MODELS.soldier;for(const [a,b] of [['Walk','walk'],['Run','run'],['Idle','idle']]){const c=s.raw.find(x=>x.name===a);if(c)s.clips[b]=stripPos(c);}}
}
function stripPos(clip){const c=clip.clone();c.tracks=c.tracks.filter(t=>!t.name.endsWith('.position')&&!t.name.endsWith('.scale'));return c;}
function prepModel(key,gltf){
  const inner=gltf.scene;const root=new T.Group();root.add(inner);
  inner.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;}});
  // which way is the model facing? its left hand should sit at +x when facing +z
  root.updateMatrixWorld(true);
  const bones={};inner.traverse(o=>{if(o.isBone)bones[canon(o.name)]=o;});
  const lh=bones.LeftHand.getWorldPosition(new V3()),rh=bones.RightHand.getWorldPosition(new V3());
  if(lh.x<rh.x)inner.rotation.y+=Math.PI;
  root.updateMatrixWorld(true);
  // measure from the skeleton: skinned-mesh bounding boxes ignore the armature's scale
  const hy=()=>bones.Head.getWorldPosition(new V3()).y;
  const fy=()=>{let m=1e9;for(const n of ['LeftToeBase','RightToeBase','LeftFoot','RightFoot','LeftToe_End','RightToe_End']){if(bones[n])m=Math.min(m,bones[n].getWorldPosition(new V3()).y);}return m;};
  const target={xbot:1.78,soldier:1.8,michelle:1.68,rpm:1.8}[key];
  const s=(target*.9)/(hy()-fy());inner.scale.multiplyScalar(s);root.updateMatrixWorld(true);
  inner.position.y-=fy()-.03;root.updateMatrixWorld(true);
  // the rest pose for retargeting: a T-pose clip if the model has one, otherwise its bind pose
  const raw=gltf.animations||[];const tp=raw.find(a=>/tpose/i.test(a.name));
  if(tp){const mx=new T.AnimationMixer(inner);mx.clipAction(tp).play();mx.update(0);root.updateMatrixWorld(true);}
  const rest={};for(const k in bones){rest[k]={w:bones[k].getWorldQuaternion(new T.Quaternion()),l:bones[k].quaternion.clone()};}
  return {key,root,inner,bones,rest,raw,clips:{}};
}
/* world-space delta retarget, baked to a new clip for the target skeleton */
function bakeRetarget(S,Tm,clip){
  const sRoot=T.SkeletonUtils.clone(S.root),tRoot=T.SkeletonUtils.clone(Tm.root);
  const sb={},tb={};sRoot.traverse(o=>{if(o.isBone)sb[canon(o.name)]=o;});tRoot.traverse(o=>{if(o.isBone)tb[canon(o.name)]=o;});
  for(const k in tb)if(Tm.rest[k])tb[k].quaternion.copy(Tm.rest[k].l);
  const order=[];tRoot.traverse(o=>{if(o.isBone&&sb[canon(o.name)]&&S.rest[canon(o.name)])order.push(canon(o.name));});
  tRoot.updateMatrixWorld(true);
  const mx=new T.AnimationMixer(sRoot.children[0]);const act=mx.clipAction(clip);act.play();
  const fps=30,n=Math.max(2,Math.round(clip.duration*fps)+1),times=new Float32Array(n);
  const vals={};for(const k of order)vals[k]=new Float32Array(n*4);
  const animW={};
  for(let f=0;f<n;f++){
    const t=Math.min(clip.duration,f/fps);times[f]=t;mx.setTime(t);sRoot.updateMatrixWorld(true);
    for(const k of order){
      const tbone=tb[k];
      sb[k].getWorldQuaternion(_q1);_q2.copy(S.rest[k].w).invert();_q1.multiply(_q2);      // delta = srcAnimW * srcRestW^-1
      const wantW=_q1.clone().multiply(Tm.rest[k].w);                                     // tgtAnimW = delta * tgtRestW
      const par=tbone.parent;let parW;
      if(par&&par.isBone&&animW[canon(par.name)])parW=animW[canon(par.name)];else{parW=new T.Quaternion();par.getWorldQuaternion(parW);}
      const loc=parW.clone().invert().multiply(wantW);animW[k]=wantW;
      vals[k].set([loc.x,loc.y,loc.z,loc.w],f*4);
    }
  }
  const tracks=order.map(k=>new T.QuaternionKeyframeTrack(`${tb[k].name}.quaternion`,times,vals[k]));
  return new T.AnimationClip(clip.name,clip.duration,tracks);
}

/* ---------- people ---------- */
const SHADOW_GEO=new T.PlaneGeometry(1.1,1.1);
const SHADOW_MAT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false});})();
const PRESET_LOOK={
  civ:{models:[['michelle',.36],['rpm',.36],['soldier',.16],['xbot',.12]]},
  stall:{models:[['michelle',.5],['rpm',.5]],umbrella:false},
  victim:{models:[['michelle',1]],umbrella:false,visor:false},
  mibu:{models:[['rpm',1]],tint:0x6a1822,umbrella:false,visor:false},
  kuze:{models:[['soldier',1]],tint:0x5a5a3a,umbrella:false,visor:true,visorC:0xff6a2b,weapon:'pipe',scale:1.08},
  thug:{models:[['soldier',1]],tint:0x26222e,umbrella:false,visor:true,visorC:0xff4fd8,weapon:'knife'},
  rioter:{models:[['rpm',.5],['michelle',.5]],umbrella:false,visor:true,visorC:0xff2d55},
  armed:{models:[['soldier',1]],tint:0x5a1414,umbrella:false,visor:true,visorC:0xff2d55,weapon:'knife'},
  amane:{models:[['rpm',1]],tint:0xf2f0f6,tintStrength:.85,umbrella:false,visor:false},
  inspector:{models:[['rpm',1]],tint:0x1a2440,tintStrength:.8,umbrella:false,visor:false}
};
const TINTS=[0x2a2f45,0x4a2a3a,0x3a4a5a,0x6a4a2a,0x2a4a3a,0x5a2a5a,0x8a8a92,0x1a1a22,0x7a3a2a,0x2a5a6a];
function attachRest(bone,obj,posRoot,quatRoot,root){
  // place obj on a bone so that, in the bind pose, it sits at posRoot/quatRoot in the character's frame
  root.updateMatrixWorld(true);bone.updateMatrixWorld(true);
  const want=new T.Matrix4().compose(posRoot.clone().applyMatrix4(root.matrixWorld),root.getWorldQuaternion(new T.Quaternion()).multiply(quatRoot||new T.Quaternion()),new V3(1,1,1));
  const inv=bone.matrixWorld.clone().invert();want.premultiply(inv);
  want.decompose(obj.position,obj.quaternion,obj.scale);bone.add(obj);
}
const UMB_MATS=NEON.map(c=>new T.MeshPhysicalMaterial({color:c,transparent:true,opacity:.32,roughness:.15,metalness:0,transmission:0,side:T.DoubleSide,depthWrite:false,emissive:c,emissiveIntensity:.25}));
const UMB_GEO={canopy:new T.SphereGeometry(.62,20,8,0,TAU,0,Math.PI*.38),stick:new T.CylinderGeometry(.009,.009,.95,6),rim:new T.TorusGeometry(.565,.012,6,40),ribs:null};
function makeUmbrella(ci){
  const g=new T.Group();const st=new T.Mesh(UMB_GEO.stick,new T.MeshStandardMaterial({color:0x111111,metalness:.8,roughness:.3}));st.position.y=.47;g.add(st);
  const cp=new T.Mesh(UMB_GEO.canopy,UMB_MATS[ci]);cp.position.y=.62;cp.scale.y=.75;g.add(cp);
  const rm=new T.Mesh(UMB_GEO.rim,neonMat(NEON[ci]));rm.rotation.x=Math.PI/2;rm.position.y=.79;g.add(rm);
  return g;
}
function makeCharacter(seed,preset){
  const r=mulberry32(seed),L=PRESET_LOOK[preset]||PRESET_LOOK.civ;
  let x=r(),key=L.models[0][0];for(const [k,p] of L.models){if(x<p){key=k;break;}x-=p;}
  const M=MODELS[key];
  const g=new T.Group();g.rotation.order='YXZ';
  const root=T.SkeletonUtils.clone(M.root);g.add(root);
  const sc=(L.scale||1)*(.94+r()*.12);root.scale.setScalar(sc);
  const bones={};root.traverse(o=>{if(o.isBone)bones[canon(o.name)]=o;});
  // own materials: tint clothing, keep skin, and give the gore pass something to darken
  const tint=new T.Color(L.tint??TINTS[Math.floor(r()*TINTS.length)]),ts=L.tintStrength??(L.tint?.6:.35);
  let coatHex=tint.getHex(),skinHex=0xc89f86;const mats=[];
  root.traverse(o=>{if(!o.isMesh)return;
    if(key==='rpm'&&/Headwear|^Mesh$/.test(o.name)){o.visible=false;return;}
    o.material=o.material.clone();const m=o.material,n=(m.name||'')+'|'+o.name;mats.push(m);
    m.envMapIntensity=.9;
    const isSkin=/Skin|Head|Eye|Teeth|Body$|Wolf3D_Body/.test(n)&&!/Outfit/.test(n);
    if(key==='rpm'){if(/Outfit_Top|Outfit_Bottom/.test(n))m.color.lerp(tint,ts);if(/Outfit_Footwear/.test(n))m.color.lerp(new T.Color(0x111111),.5);}
    else if(key==='xbot'){if(/Joints/.test(n))m.color.set(NEON_CSS[Math.floor(r()*NEON.length)]).multiplyScalar(.6);else m.color.copy(tint).lerp(new T.Color(0xc8ccd8),.55);m.metalness=.55;m.roughness=.3;}
    else if(!isSkin){m.color.lerp(tint,ts);}
    if(m.map)m.map.anisotropy=4;
  });
  if(key==='xbot')skinHex=0xc8ccd8;
  // accessories placed in the bind pose
  root.updateMatrixWorld(true);
  const headPos=bones.Head.getWorldPosition(new V3());g.updateMatrixWorld(true);const hp=g.worldToLocal(headPos.clone());
  let visor=null,umb=null,weapon=null;
  if(key==='rpm'&&preset!=='amane'||preset==='amane'){ // the avatar ships bald under its hat: give it hair
    const hc=preset==='amane'?0xe8e8f0:[0x0c0a0a,0x2a1a10,0x1a1a2a,0x5a2a7a,0x8a8a92,0x6a1a2a,0x0a2a3a][Math.floor(r()*7)];
    const hair=new T.Mesh(new T.SphereGeometry(.112,20,14,0,TAU,0,Math.PI*.6),new T.MeshStandardMaterial({color:hc,roughness:.55,metalness:.1}));
    hair.scale.set(1,1.05,1.12);attachRest(bones.Head,hair,new V3(0,hp.y+.085*sc,-.012*sc),null,g);
    const back=new T.Mesh(new T.SphereGeometry(.1,16,10),hair.material);back.scale.set(1.05,.9,.75);attachRest(bones.Head,back,new V3(0,hp.y+.04*sc,-.05*sc),null,g);}
  if(L.visor??r()<.25){visor=new T.Mesh(new T.RoundedBoxGeometry(.2,.045,.06,2,.02),neonMat(L.visorC??NEON[Math.floor(r()*NEON.length)]));
    attachRest(bones.Head,visor,new V3(0,hp.y+.075*sc,.085*sc),null,g);}
  const wantUmb=L.umbrella??r()<.4;
  if(wantUmb){umb=makeUmbrella(Math.floor(r()*NEON.length));g.add(umb);}
  if(L.weapon){const rh=g.worldToLocal(bones.RightHand.getWorldPosition(new V3()));
    if(L.weapon==='pipe'){weapon=new T.Mesh(new T.CylinderGeometry(.025,.03,.95,8),new T.MeshStandardMaterial({color:0x8a8a90,metalness:.9,roughness:.35}));weapon.geometry.translate(0,.3,0);
      attachRest(bones.RightHand,weapon,rh.add(new V3(-.08,0,0)),new T.Quaternion().setFromEuler(new T.Euler(0,0,Math.PI/2)),g);}
    else{weapon=new T.Group();const blade=new T.Mesh(new T.BoxGeometry(.012,.04,.28).translate(0,0,.16),new T.MeshStandardMaterial({color:0xdde4ee,metalness:1,roughness:.12,emissive:0xff2d55,emissiveIntensity:.25}));
      const hilt=new T.Mesh(new T.BoxGeometry(.03,.035,.1),new T.MeshStandardMaterial({color:0x111111,roughness:.6}));weapon.add(blade,hilt);
      attachRest(bones.RightHand,weapon,rh.add(new V3(-.08,0,0)),new T.Quaternion().setFromEuler(new T.Euler(0,-Math.PI/2,0)),g);}}
  // animation
  const mixer=new T.AnimationMixer(root);const acts={};
  for(const k of ['idle','walk','run','headShake']){const c=M.clips[k];if(!c)continue;const a=mixer.clipAction(c);a.play();a.setEffectiveWeight(k==='idle'?1:0);acts[k]=a;}
  for(const k in acts)acts[k].time=r()*acts[k].getClip().duration;
  const w={idle:1,walk:0,run:0,headShake:0};
  const shadow=new T.Mesh(SHADOW_GEO,SHADOW_MAT);shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;shadow.renderOrder=1;g.add(shadow);
  scene.add(g);
  return {shadow,g,root,bones,mixer,acts,w,mats,ownMats:true,coatHex,skinHex,model:key,umbMesh:umb,visor,weapon,sc,phase:r()*TAU,speedR:r(),mixT:0,head:bones.Head};
}
/* point a limb bone (and so the chain under it) along a world direction */
const _bw=new V3(),_cw=new V3(),_dir=new V3(),_qa=new T.Quaternion(),_qb=new T.Quaternion();
function pointBone(bone,child,dir,amount=1){
  bone.updateMatrixWorld(true);bone.getWorldPosition(_bw);child.getWorldPosition(_cw);
  _dir.subVectors(_cw,_bw).normalize();_qa.setFromUnitVectors(_dir,dir);
  if(amount<1)_qa.slerp(_qb.identity(),1-amount);
  bone.getWorldQuaternion(_qb);_qa.multiply(_qb);
  bone.parent.getWorldQuaternion(_qb);_qb.invert();bone.quaternion.copy(_qb.multiply(_qa));bone.updateMatrixWorld(true);
}
