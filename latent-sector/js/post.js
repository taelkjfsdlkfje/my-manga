"use strict";
/* ============ post: bloom, grade, lens; neon environment lighting; mirror-wet streets ============ */
const POST={comp:null,bloom:null,grade:null,dmg:0};
const GradeShader={
  uniforms:{tDiffuse:{value:null},uTime:{value:0},uRes:{value:new T.Vector2(1,1)},uAberr:{value:.0035},uVig:{value:1.15},uGrain:{value:.045},uHurt:{value:0},uTint:{value:new T.Color(1,1,1)},uTintAmt:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uAberr,uVig,uGrain,uHurt,uTintAmt;uniform vec2 uRes;uniform vec3 uTint;varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec2 c=vUv-.5;float r2=dot(c,c);vec2 off=c*(uAberr+uHurt*.012)*(.4+r2*4.);
    vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);
    vec3 s=linearToOutputTexel(vec4(col,1.)).rgb;
    float l=dot(s,vec3(.299,.587,.114));
    s=mix(s,s*vec3(.86,1.0,1.12),smoothstep(.45,0.,l)*.55);     // teal shadows
    s=mix(s,s*vec3(1.08,.96,1.04),smoothstep(.35,1.,l)*.35);    // warm-magenta highlights
    s=(s-.5)*1.08+.5;
    s=mix(s,s*uTint,uTintAmt);
    s=mix(s,vec3(l)*vec3(1.4,.2,.25),uHurt*.35*smoothstep(.0,.5,r2*2.));
    s*=1.-r2*uVig;
    s+=(h(vUv*uRes+fract(uTime*7.13))-.5)*uGrain;
    gl_FragColor=vec4(max(s,0.),1.);
  }`
};
function initPost(){
  const pr=renderer.getPixelRatio(),w=innerWidth,h=innerHeight;
  const gl2=renderer.capabilities.isWebGL2;
  const opts={type:T.HalfFloatType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter};
  let rt;if(gl2&&QUALITY.high){rt=new T.WebGLMultisampleRenderTarget(w*pr,h*pr,opts);rt.samples=4;}else rt=new T.WebGLRenderTarget(w*pr,h*pr,opts);
  const comp=new T.EffectComposer(renderer,rt);
  comp.addPass(new T.RenderPass(scene,camera));
  const bloom=new T.UnrealBloomPass(new T.Vector2(w,h),QUALITY.high?.95:.8,.62,.72);comp.addPass(bloom);
  const grade=new T.ShaderPass(GradeShader);comp.addPass(grade);
  POST.comp=comp;POST.bloom=bloom;POST.grade=grade;
  const resize=()=>{comp.setPixelRatio(renderer.getPixelRatio());comp.setSize(innerWidth,innerHeight);grade.uniforms.uRes.value.set(innerWidth,innerHeight);};
  resize();addEventListener('resize',resize);
}
function renderFrame(dt){
  if(!POST.comp){renderer.render(scene,camera);return;}
  const u=POST.grade.uniforms;u.uTime.value=S.t;
  POST.dmg=Math.max(0,POST.dmg-(dt||.016)*1.6);u.uHurt.value=POST.dmg;
  POST.comp.render(dt);
}

/* neon-city environment for reflections on metal, glass, skin and wet surfaces */
function initEnvironment(){
  const pm=new T.PMREMGenerator(renderer);
  const es=new T.Scene();
  es.add(new T.Mesh(new T.SphereGeometry(80,32,16),new T.ShaderMaterial({side:T.BackSide,
    vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vP;void main(){float h=vP.y;vec3 c=mix(vec3(.12,.04,.16),vec3(.02,.015,.05),smoothstep(-.1,.6,h));c+=vec3(.25,.06,.14)*exp(-abs(h)*9.);c*=mix(.35,1.,smoothstep(-.3,0.,h));gl_FragColor=linearToOutputTexel(vec4(c,1.));}`})));
  const r=mulberry32(4242);
  for(let i=0;i<34;i++){
    const a=r()*TAU,y=-6+r()*34,d=40+r()*20,w=1.5+r()*7,hh=r()<.5?.6+r()*2:4+r()*10;
    const col=new T.Color(NEON[Math.floor(r()*NEON.length)]).multiplyScalar(2+r()*5);
    const m=new T.Mesh(new T.PlaneGeometry(w,hh),new T.MeshBasicMaterial({color:col,side:T.DoubleSide}));
    m.position.set(Math.cos(a)*d,y,Math.sin(a)*d);m.lookAt(0,y,0);es.add(m);
  }
  for(let i=0;i<10;i++){const m=new T.Mesh(new T.PlaneGeometry(14,1.2),new T.MeshBasicMaterial({color:new T.Color(0xffe0c0).multiplyScalar(3),side:T.DoubleSide}));
    const a=i/10*TAU;m.position.set(Math.cos(a)*45,28,Math.sin(a)*45);m.lookAt(0,10,0);es.add(m);}
  const env=pm.fromScene(es,.035).texture;scene.environment=env;pm.dispose();
}

/* the street as a rain-rippled mirror under a partly see-through asphalt layer */
const MirrorShader={
  uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uTime:{value:0}},
  vertexShader:`uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform vec3 color;uniform sampler2D tDiffuse;uniform float uTime;varying vec4 vUv;varying vec3 vW;
  void main(){
    vec2 p=vW.xz;
    vec2 d=vec2(sin(p.x*2.7+uTime*1.9)+sin(p.y*3.9-uTime*1.4)+sin((p.x+p.y)*9.1+uTime*3.1)*.5,
                cos(p.y*3.1+uTime*2.2)+sin(p.x*2.3+uTime*.9)+cos((p.x-p.y)*8.3-uTime*2.7)*.5)*.0011;
    vec4 uv=vUv;uv.xy+=d*uv.w;uv.y+=.004*uv.w;
    vec3 c=texture2DProj(tDiffuse,uv).rgb;
    // vertical streaking, the way neon smears in wet asphalt
    vec4 uv2=uv;uv2.y-=.006*uv.w;vec4 uv3=uv;uv3.y-=.013*uv.w;c=c*.5+texture2DProj(tDiffuse,uv2).rgb*.3+texture2DProj(tDiffuse,uv3).rgb*.2;
    gl_FragColor=vec4(c*color,1.);
  }`
};
let MIRROR=null;
function initMirror(){
  if(!QUALITY.high||typeof T.Reflector==='undefined')return;
  const pr=renderer.getPixelRatio();
  MIRROR=new T.Reflector(new T.PlaneGeometry(260,260),{textureWidth:Math.round(innerWidth*pr*.5),textureHeight:Math.round(innerHeight*pr*.5),color:0x9a9aa8,clipBias:.003,shader:MirrorShader});
  MIRROR.material.uniforms.uTime=U_TIME;
  MIRROR.rotation.x=-Math.PI/2;MIRROR.position.y=.004;scene.add(MIRROR);
  if(GROUND){GROUND.material.transparent=true;GROUND.material.alphaMap=GROUND.userData.alpha;GROUND.material.needsUpdate=true;GROUND.renderOrder=-1;}
}

/* if the high preset can't hold ~30 fps in the first seconds of play, step down once */
const PERF={n:0,t:0,checked:false};
function perfWatch(dt){
  if(PERF.checked||!S.inGame||S.cut||!QUALITY.high||HOLD)return;
  PERF.n++;PERF.t+=dt;
  if(PERF.t>=5){PERF.checked=true;const fps=PERF.n/PERF.t;
    if(fps<30){setQuality(false);try{localStorage.removeItem('ls-quality');}catch(e){}$('#qualTog').checked=false;toast('GRAPHICS ADJUSTED','Reflections off for smoother play','cy',3);}}
}
function setQuality(high){
  QUALITY.high=high;try{localStorage.setItem('ls-quality',high?'high':'low');}catch(e){}
  if(high&&!MIRROR)initMirror();
  if(MIRROR)MIRROR.visible=high;
  if(GROUND){GROUND.material.transparent=high&&!!MIRROR;GROUND.material.alphaMap=high&&MIRROR?GROUND.userData.alpha:null;GROUND.material.needsUpdate=true;}
  if(POST.bloom)POST.bloom.strength=high?.95:.8;
}
