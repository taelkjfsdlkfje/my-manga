// Headless harness: runs the game logic in Node with a fake THREE/DOM so we can
// fast-forward cutscenes and fights and catch runtime errors. No rendering.
const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=__dirname;
let SHARED=null;
function mock(name){ const store={}; const f=function(){};
  const h={ get(t,p){ if(p==='then') return undefined; if(p===Symbol.toPrimitive) return ()=>0; if(p==='valueOf') return ()=>0; if(p==='toString') return ()=>'[mock '+name+']';
      if(p===Symbol.iterator) return function*(){}; if(p in store) return store[p]; if(p==='length') return 0; if(typeof p==='symbol') return undefined;
      const m=mock(name+'.'+String(p)); store[p]=m; return m; },
    set(t,p,v){ store[p]=v; return true; }, has(t,p){ return true; },
    apply(){ return SHARED||(SHARED=mock('ret')); }, construct(){ return mock('new '+name); } };
  return new Proxy(f,h); }
let now=0; const rafs=[];
const ctx2d=()=>mock('ctx2d');
const ctxObj={ console, Math, JSON, Date, Array, Object, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Int32Array, Map, Set, WeakMap, Promise, Symbol, Number, String, Boolean, RegExp, Error, TypeError, parseFloat, parseInt, isNaN, isFinite, Proxy, Reflect, Infinity, NaN,
  atob:s=>Buffer.from(s,'base64').toString('binary'),
  setTimeout:(f)=>{ return 0; }, clearTimeout(){}, setInterval:()=>0, clearInterval(){},
  performance:{ now:()=>now },
  requestAnimationFrame:(f)=>{ rafs.push(f); return 1; },
  localStorage:{ getItem:()=>null, setItem(){} },
  matchMedia:()=>({matches:false, addEventListener(){}}),
  addEventListener(){}, removeEventListener(){}, dispatchEvent(){},
  innerWidth:1280, innerHeight:720, devicePixelRatio:1,
  navigator:{ userAgent:'node' },
  Event:function(){}, Image:function(){ return mock('img'); }, AudioContext:undefined, webkitAudioContext:undefined,
};
const doc=mock('document');
const realDoc={ getElementById:(id)=>mock('#'+id), createElement:(t)=>{ const m=mock('el:'+t); if(t==='canvas'){ m.getContext=()=>ctx2d(); m.width=64; m.height=64; } return m; },
  querySelectorAll:()=>[], querySelector:()=>mock('qs'), addEventListener(){}, body:mock('body'), head:mock('head'), documentElement:mock('docEl'), fullscreenElement:null };
ctxObj.document=realDoc;
{ const real=require('./node_modules/three/build/three.cjs'); const T=Object.assign({},real); for(const k of ['WebGLRenderer','EffectComposer','RenderPass','UnrealBloomPass','ShaderPass','Reflector','CopyShader','LuminosityHighPassShader','Pass','MaskPass']) T[k]=mock(k); ctxObj.THREE=T; }
ctxObj.window=ctxObj; ctxObj.self=ctxObj; ctxObj.globalThis=ctxObj;
vm.createContext(ctxObj);
const files=process.argv.slice(2).filter(a=>a.endsWith('.js'));
const src=fs.readFileSync(path.join(DIR,'game.js'),'utf8');
vm.runInContext(src,ctxObj,{filename:'game.js'}); vm.runInContext('outlinePass=function(){}; removeOrphans=function(){}; pixelizeCanvas=function(){};',ctxObj);
for(const f of files) vm.runInContext(fs.readFileSync(f,'utf8'),ctxObj,{filename:path.basename(f)});
// drive frames
function frames(n,dt){ dt=dt||1/60; for(let i=0;i<n;i++){ now+=dt*1000; const f=rafs.shift(); if(!f) throw new Error('loop stopped'); f(now); } }
ctxObj.__frames=frames; ctxObj.__setNow=v=>{now=v;};
module.exports={ctx:ctxObj,frames,run:(code)=>vm.runInContext(code,ctxObj)};
if(require.main===module){ frames(10); console.log('state',vm.runInContext('Game.state',ctxObj)); }
