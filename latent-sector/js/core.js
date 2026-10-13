"use strict";
/* ============ core: utils, renderer, shared materials, particles, audio, voice ============ */
const $=s=>document.querySelector(s);
const T=THREE, V3=T.Vector3, TAU=Math.PI*2;
const IS_TOUCH=matchMedia('(pointer: coarse)').matches;
const QUALITY={high:!IS_TOUCH};try{const q=localStorage.getItem('ls-quality');if(q)QUALITY.high=q==='high';}catch(e){}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng=mulberry32(77); // world generation only: identical on every client
const R=(a,b)=>a+rng()*(b-a), pick=a=>a[Math.floor(rng()*a.length)];
const MR=(a,b)=>a+Math.random()*(b-a), mpick=a=>a[Math.floor(Math.random()*a.length)];
const pad3=n=>String(Math.max(0,Math.round(n))).padStart(3,'0');
const r2=n=>Math.round(n*100)/100;

/* fonts: Japanese subset built from the strings the game draws */
const JP_V=["ラーメン","薬局","診療所","居酒屋","カラオケ","色相診断","心理ケア","ホテル","電脳館","深夜食堂","質屋","整体","陽炎"];
const JP_ALL=JP_V.join('')+"潜在犯区域施錠麻痺致死分解色相犯罪係数ストレス第七区安全執行異常公安局";
const JPF='"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif', HUDF='"Chakra Petch","Bahnschrift",sans-serif', MONOF='"Azeret Mono",ui-monospace,monospace';
async function loadFonts(){
  const uniq=[...new Set(JP_ALL)].join('');
  const jl=document.createElement('link');jl.rel='stylesheet';
  jl.href='https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap&text='+encodeURIComponent(uniq);
  document.head.appendChild(jl);
  try{await Promise.race([Promise.all([document.fonts.load('700 48px "Noto Sans JP"',uniq),document.fonts.load('700 48px "Chakra Petch"'),document.fonts.load('600 48px "Azeret Mono"')]),new Promise(r=>setTimeout(r,3000))]);}catch(e){}
}

/* renderer */
const canvas=$('#view');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,IS_TOUCH?1.25:1.5));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();
scene.background=new T.Color(0.06,0.03,0.08);
scene.fog=new T.FogExp2(new T.Color(0.02,0.0045,0.032),0.0135);
const camera=new T.PerspectiveCamera(72,innerWidth/innerHeight,0.04,700);
camera.rotation.order='YXZ';scene.add(camera);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

/* shared materials & textures */
const NEON=[0xff2d78,0x39f0ff,0xf2e600,0xb18cff,0xff6a2b,0x2bff9a,0xff4fd8];
const NEON_CSS=['#ff2d78','#39f0ff','#f2e600','#b18cff','#ff6a2b','#2bff9a','#ff4fd8'];
const neonCache={};
const neonMat=c=>neonCache[c]||(neonCache[c]=new T.MeshBasicMaterial({color:c,toneMapped:false}));
const U_TIME={value:0};
const HV=`varying vec3 vN;varying vec3 vV;varying vec3 vW;void main(){vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xyz;vN=normalize(normalMatrix*normal);vec4 mv=viewMatrix*wp;vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const HF=`uniform vec3 uColor;uniform float uTime;uniform float uOpacity;varying vec3 vN;varying vec3 vV;varying vec3 vW;void main(){float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);float sc=.55+.45*sin(vW.y*16.-uTime*4.);float fl=.88+.12*sin(uTime*37.)*sin(uTime*13.);float a=(.1+fr*.95)*sc*fl*uOpacity;gl_FragColor=vec4(uColor*(.5+fr*1.6),a);}`;
function holoMat(c,op=1){return new T.ShaderMaterial({uniforms:{uTime:U_TIME,uColor:{value:new T.Color(c)},uOpacity:{value:op}},vertexShader:HV,fragmentShader:HF,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});}
function canvasTex(c){const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
const DOT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return canvasTex(c);})();

/* lights */
scene.add(new T.HemisphereLight(0x5a46c8,0x0a0a14,0.32));
{const moon=new T.DirectionalLight(0x7f90ff,0.22);moon.position.set(-30,80,20);scene.add(moon);}
function plight(c,i,d,x,y,z){const l=new T.PointLight(c,i,d,1.6);l.position.set(x,y,z);scene.add(l);return l;}

/* particles */
const PMAX=1600;
const pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),pVel=new Float32Array(PMAX*3),pBase=new Float32Array(PMAX*3),pLife=new Float32Array(PMAX),pMaxL=new Float32Array(PMAX),pGrav=new Float32Array(PMAX);let pHead=0;
for(let i=0;i<PMAX;i++)pPos[i*3+1]=-999;
const pGeo=new T.BufferGeometry();pGeo.setAttribute('position',new T.BufferAttribute(pPos,3));pGeo.setAttribute('color',new T.BufferAttribute(pCol,3));
{const PTS=new T.Points(pGeo,new T.PointsMaterial({size:.2,map:DOT,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));PTS.frustumCulled=false;scene.add(PTS);}
const _pc=new T.Color();
function emit(x,y,z,vx,vy,vz,color,life,grav){const i=pHead;pHead=(pHead+1)%PMAX;pPos[i*3]=x;pPos[i*3+1]=y;pPos[i*3+2]=z;pVel[i*3]=vx;pVel[i*3+1]=vy;pVel[i*3+2]=vz;_pc.set(color);pBase[i*3]=_pc.r;pBase[i*3+1]=_pc.g;pBase[i*3+2]=_pc.b;pLife[i]=pMaxL[i]=life;pGrav[i]=grav;}
function burst(p,n,colors,spd,up,life,grav){for(let k=0;k<n;k++){const th=Math.random()*TAU,ph=Math.acos(MR(-1,1)),s=spd*MR(.3,1);emit(p.x,p.y,p.z,Math.sin(ph)*Math.cos(th)*s,Math.cos(ph)*s+up,Math.sin(ph)*Math.sin(th)*s,colors[k%colors.length],life*MR(.6,1.2),grav);}}
function updParticles(dt){
  for(let i=0;i<PMAX;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;
    if(pLife[i]<=0){pPos[j+1]=-999;continue;}
    pVel[j+1]-=9.8*pGrav[i]*dt;const dr=Math.exp(-1.6*dt);pVel[j]*=dr;pVel[j+2]*=dr;
    pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;
    if(pPos[j+1]<.05){pPos[j+1]=.05;pVel[j+1]*=-.3;}
    const k=pLife[i]/pMaxL[i];pCol[j]=pBase[j]*k;pCol[j+1]=pBase[j+1]*k;pCol[j+2]=pBase[j+2]*k;}
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
}

/* hue model */
const HUE_STOPS=[[0,.52,.15,.92],[20,.47,.85,.7],[45,.56,.75,.68],[65,.4,.55,.55],[85,.17,.5,.45],[99,.1,.6,.38],[150,.06,.5,.27],[250,.98,.6,.22],[350,.78,.45,.1],[999,.78,.45,.08]];
function hueColor(cc,out){out=out||new T.Color();for(let i=1;i<HUE_STOPS.length;i++){const a=HUE_STOPS[i-1],b=HUE_STOPS[i];if(cc<=b[0]){const t=(cc-a[0])/(b[0]-a[0]);let h=a[1],h2=b[1];if(Math.abs(h2-h)>.5)h2+=h2<h?1:-1;return out.setHSL((lerp(h,h2,t)+1)%1,lerp(a[2],b[2],t),lerp(a[3],b[3],t));}}return out.setHSL(.78,.45,.08);}
function hueName(cc){if(cc<5)return'Crystal White';if(cc<30)return'Clear Aquamarine';if(cc<50)return'Pale Sky';if(cc<70)return'Soft Jade';if(cc<85)return'Dull Olive';if(cc<100)return'Murky Amber';if(cc<200)return'Clouded Umber';if(cc<300)return'Turbid Crimson';return'Blackened Violet';}
const hueCss=cc=>'#'+hueColor(cc).getHexString();

/* ============ audio ============ */
let AC=null,MASTER=null,SFXBUS=null,AMBBUS=null,VOBUS=null,NOISE=null,REVERB=null;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  MASTER=AC.createGain();MASTER.gain.value=.8;MASTER.connect(AC.destination);
  SFXBUS=AC.createGain();SFXBUS.gain.value=.85;SFXBUS.connect(MASTER);
  AMBBUS=AC.createGain();AMBBUS.gain.value=1;AMBBUS.connect(MASTER);
  VOBUS=AC.createGain();VOBUS.gain.value=1.15;VOBUS.connect(MASTER);
  NOISE=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  // small plate reverb from a generated impulse
  const len=AC.sampleRate*1.4,ir=AC.createBuffer(2,len,AC.sampleRate);
  for(let c=0;c<2;c++){const ch=ir.getChannelData(c);for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2);}
  REVERB=AC.createConvolver();REVERB.buffer=ir;const rg=AC.createGain();rg.gain.value=.22;REVERB.connect(rg);rg.connect(MASTER);
  // rain bed
  const rs=AC.createBufferSource();rs.buffer=NOISE;rs.loop=true;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=800;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6500;const rgn=AC.createGain();rgn.gain.value=.08;rs.connect(hp);hp.connect(lp);lp.connect(rgn);rgn.connect(AMBBUS);rs.start();
  // city drone
  const dlp=AC.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=170;const dg=AC.createGain();dg.gain.value=.05;dlp.connect(dg);dg.connect(AMBBUS);
  [44,44.6,66.2].forEach(f=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(dlp);o.start();});
  loadVO();
}
function tone({type='sine',f=440,f2=null,dur=.2,vol=.2,delay=0}){if(!AC)return;const t=AC.currentTime+delay;const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(SFXBUS);o.start(t);o.stop(t+dur+.05);}
function noise({dur=.2,vol=.2,type='lowpass',f=1000,f2=null,q=1,delay=0}){if(!AC)return;const t=AC.currentTime+delay;const s=AC.createBufferSource();s.buffer=NOISE;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(SFXBUS);s.start(t,Math.random());s.stop(t+dur+.05);}
const SFX={
  tick:p=>tone({f:520+p*900,dur:.05,vol:.05}),
  scanned:()=>{tone({f:880,dur:.12,vol:.09});tone({f:1320,dur:.18,vol:.08,delay:.08});},
  morph:m=>{noise({type:'highpass',f:2500,dur:.12,vol:.18});tone({type:'sawtooth',f:180,f2:m==='lethal'?70:m==='decon'?50:420,dur:.3,vol:.07});tone({type:'square',f:70,dur:.05,vol:.12,delay:.1});noise({type:'bandpass',f:900,dur:.06,vol:.2,delay:.22});},
  buzz:()=>{tone({type:'square',f:110,dur:.18,vol:.07});tone({type:'square',f:104,dur:.18,vol:.07});},
  para:()=>{tone({type:'square',f:1900,f2:240,dur:.18,vol:.1});noise({type:'bandpass',f:2400,dur:.12,vol:.25,q:3});},
  charge:d=>tone({type:'sawtooth',f:80,f2:760,dur:d,vol:.07}),
  boom:()=>{noise({type:'lowpass',f:1400,f2:80,dur:1,vol:.6});tone({f:80,f2:28,dur:.8,vol:.45});},
  decon:()=>{tone({f:320,f2:36,dur:1.3,vol:.32});noise({type:'bandpass',f:500,f2:120,dur:1.1,vol:.35,q:2});tone({type:'triangle',f:1200,f2:2600,dur:.45,vol:.06});},
  hurt:()=>{tone({f:130,f2:50,dur:.25,vol:.4});noise({type:'lowpass',f:500,dur:.15,vol:.3});},
  trace:()=>{[0,.16,.32].forEach((d,i)=>tone({f:1300,f2:180,dur:.9,vol:.11/(i+1),delay:d}));},
  pew:()=>tone({type:'square',f:900,f2:280,dur:.16,vol:.05}),
  care:()=>{[523,659,784,1047].forEach((f,i)=>tone({f,dur:.3,vol:.07,delay:i*.08}));},
  step:()=>noise({type:'highpass',f:1800,dur:.06,vol:.035}),
  alert:()=>{tone({type:'square',f:660,dur:.12,vol:.06});tone({type:'square',f:880,dur:.12,vol:.06,delay:.15});tone({type:'square',f:660,dur:.12,vol:.06,delay:.3});},
  thud:()=>tone({f:90,f2:40,dur:.2,vol:.3}),
  stomp:()=>{tone({f:60,f2:30,dur:.3,vol:.35});noise({type:'lowpass',f:300,dur:.2,vol:.25});},
  whoosh:()=>noise({type:'bandpass',f:400,f2:2400,dur:1.4,vol:.25,q:.8}),
  join:()=>{[392,523,659].forEach((f,i)=>tone({type:'triangle',f,dur:.25,vol:.07,delay:i*.09}));},
  gore:()=>{noise({type:'lowpass',f:900,f2:120,dur:.9,vol:.75});noise({type:'bandpass',f:420,f2:180,dur:.5,vol:.6,q:1.5});tone({f:70,f2:30,dur:.6,vol:.5});for(let i=0;i<10;i++)noise({type:'bandpass',f:MR(600,1600),dur:.05,vol:.12,q:4,delay:.35+i*MR(.05,.12)});},
  swell:()=>{tone({type:'sawtooth',f:60,f2:140,dur:.7,vol:.08});noise({type:'lowpass',f:200,f2:700,dur:.7,vol:.25});for(let i=0;i<5;i++)noise({type:'bandpass',f:MR(300,700),dur:.08,vol:.18,q:3,delay:i*.13});},
  glitch:()=>{for(let i=0;i<6;i++)tone({type:'square',f:MR(200,2400),dur:.05,vol:.05,delay:i*.06});noise({type:'bandpass',f:1200,dur:.4,vol:.2,q:6});}
};

/* ============ voice acting ============ */
const VO={buf:{},queue:[],cur:null,gun:null,enabled:true,subUntil:0};
const WHO_CLS={'ARBITER':'sys','DISPATCH':'','MIBU':'foe','KUZE':'foe','THUG':'foe','RIOTER':'foe','INTRUDER':'hack','SEIJI AMANE':'amane'};
async function loadVO(){
  if(typeof VO_LINES==='undefined'||!AC)return;
  await Promise.allSettled(Object.keys(VO_LINES).map(async id=>{
    const r=await fetch(`vo/${id}.mp3`);if(!r.ok)return;const ab=await r.arrayBuffer();
    VO.buf[id]=await new Promise((res,rej)=>AC.decodeAudioData(ab,res,rej));
  }));
}
function voChain(who){
  // returns the input node for a voice, shaped per character
  const out=AC.createGain();out.connect(VOBUS);
  if(who==='DISPATCH'||who==='INTRUDER'){
    const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=who==='INTRUDER'?420:320;
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=who==='INTRUDER'?2800:3600;
    const ws=AC.createWaveShaper();const k=who==='INTRUDER'?14:5,n=1024,cu=new Float32Array(n);for(let i=0;i<n;i++){const x=i*2/n-1;cu[i]=(1+k)*x/(1+k*Math.abs(x));}ws.curve=cu;
    const g=AC.createGain();g.gain.value=who==='INTRUDER'?.55:.8;
    hp.connect(lp);lp.connect(ws);ws.connect(g);g.connect(out);
    if(who==='INTRUDER'){const dl=AC.createDelay();dl.delayTime.value=.09;const fb=AC.createGain();fb.gain.value=.28;g.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(out);}
    return hp;
  }
  const g=AC.createGain();g.connect(out);if(REVERB&&who!=='ARBITER')g.connect(REVERB);
  if(who==='ARBITER'&&REVERB){const s=AC.createGain();s.gain.value=.5;g.connect(s);s.connect(REVERB);}
  return g;
}
function playBuf(id,who,rate=1){
  if(!AC||!VO.enabled||!VO.buf[id])return null;
  try{const s=AC.createBufferSource();s.buffer=VO.buf[id];s.playbackRate.value=rate;s.connect(voChain(who));s.start();
    if(AMBBUS){AMBBUS.gain.cancelScheduledValues(AC.currentTime);AMBBUS.gain.setTargetAtTime(.45,AC.currentTime,.1);AMBBUS.gain.setTargetAtTime(1,AC.currentTime+VO.buf[id].duration/rate,.4);}
    return s;}catch(e){return null;}
}
let subHook=null; // set by game: (who,text,dur,cls)=>void
function voInfo(id){return (typeof VO_LINES!=='undefined'&&VO_LINES[id])||{who:'DISPATCH',text:id,dur:3};}
/* gun channel: interrupts itself, local to this player */
function voGun(id){const L=voInfo(id);if(VO.gun){try{VO.gun.stop();}catch(e){}}VO.gun=playBuf(id,'ARBITER',1);subHook&&subHook(L.who,L.text,L.dur+.4,WHO_CLS[L.who]);}
/* radio / dialogue channel: queued, never overlaps itself */
function voRadio(id){VO.queue.push(id);}
function voNow(id){ // play immediately on the dialogue channel (used by cutscenes)
  const L=voInfo(id);if(VO.cur&&VO.cur.src){try{VO.cur.src.stop();}catch(e){}}
  const rate=L.who==='INTRUDER'?.94:1;
  VO.cur={id,src:playBuf(id,L.who,rate),end:performance.now()/1000+L.dur/rate+.35};
  subHook&&subHook(L.who,L.text,L.dur/rate+.4,WHO_CLS[L.who]);
}
function voTick(){
  const now=performance.now()/1000;
  if(VO.cur&&now>=VO.cur.end)VO.cur=null;
  if(!VO.cur&&VO.queue.length)voNow(VO.queue.shift());
}
function voClear(){VO.queue.length=0;if(VO.cur&&VO.cur.src){try{VO.cur.src.stop();}catch(e){}}VO.cur=null;}
