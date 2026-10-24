// =====================================================================
// SHAYAN'S NEW SPRITE: 8-direction pixel animations + portrait (from shayan.rar)
// Falls back to the old hand-drawn Shayan until the images have loaded, so he is never invisible.
// =====================================================================
const SHA={ok:false,pok:false,img:null,pimg:null,meta:__META__,scale:.8,drawn:false};
(function(){ try{ const im=new Image(); im.onload=()=>{ SHA.ok=im.width>0; }; im.onerror=()=>{ SHA.ok=false; }; im.src='data:image/png;base64,__ATLAS__'; SHA.img=im;
    const pm=new Image(); pm.onload=()=>{ SHA.pok=pm.width>0; }; pm.src='data:image/png;base64,__PORTS__'; SHA.pimg=pm; }catch(e){} })();
const SH_OLD_DRAW=drawShayanHD;
function shDirIdx(a){ const k=((Math.round(a/(Math.PI/4))%8)+8)%8; return [2,1,0,7,6,5,4,3][k]; }
function shFrame(name,dir,i){ const M=SHA.meta, base=M[name]; if(base==null) return null; const perDir=['run','jump','punch','swing'].includes(name); const row=perDir?base+dir:base, col=perDir?i:dir; return {row,col}; }
drawShayanHD=function(c,cx,by,f,s){ s=s||{}; if(!SHA.ok||!SHA.img) return SH_OLD_DRAW(c,cx,by,f,s);
  try{ const P=Player, isP=!!P&&s.t===P.t&&s.anim===P.anim&&!ALI(), a=s.anim||'idle', t=s.t||0; let dir=f>0?2:6;
    if(isP&&Game.state==='play'&&!P.cineFly&&!P.scripted){ const ang=P.ang||0, cs=Math.cos(ang); if(!(Math.abs(cs)>.3&&Math.sign(cs)!==Math.sign(f||1))) dir=shDirIdx(ang); }
    let fr;
    if(isP&&Game.state==='dead') fr=shFrame('dead',dir,0);
    else if(isP&&Game.paulLock&&(P.punchT||0)>0) fr=shFrame('punch',dir,Math.min(5,Math.floor((.28-P.punchT)/.28*6)));
    else if(isP&&(P.fbPose||0)>0) fr=shFrame('punch',dir,Math.min(5,2+Math.floor((.22-P.fbPose)/.22*4)));
    else if(a==='run') fr=shFrame('run',dir,Math.floor(t*10)%4);
    else if(a==='jump') fr=shFrame('jump',dir,4);
    else if(a==='fall'||a==='glide') fr=shFrame('jump',dir,5);
    else if(a==='dash') fr=shFrame('run',dir,2);
    else if(a==='attack') fr=shFrame('swing',dir,2+Math.min(4,Math.floor((s.ap||0)*5)));
    else if(a==='charge') fr=shFrame('swing',dir,1);
    else if(a==='beam') fr=Game.paulLock?shFrame('punch',dir,4):shFrame('swing',dir,5);
    else if(a==='block') fr=shFrame('swing',dir,0);
    else if(a==='hurt') fr=shFrame('hurt',dir,0);
    else if(a==='dead') fr=shFrame('dead',dir,0);
    else fr=shFrame('rot',dir,0);
    if(!fr) return SH_OLD_DRAW(c,cx,by,f,s);
    const bt=(SHA.meta.bottom[fr.row]||[])[fr.col]; const bottom=bt!=null?bt:61, bob=(a==='idle'&&Math.sin(t*2.6)>.6)?1:0;
    c.drawImage(SHA.img,fr.col*64,fr.row*64,64,64,Math.round(cx-32),Math.round(by-1-bottom+bob),64,64);
    if(a==='glide'){ const w=Math.round(Math.sin(t*6)), y0=Math.max(6,by-60); ell(c,cx,y0+w,16,5,'#3f8a36'); ell(c,cx,y0-1+w,15,4,'#5fae4a'); ell(c,cx-3,y0-2+w,9,2,'#86cf6a'); pline(c,cx-14,y0+w,cx+14,y0+w,'#2a5e26'); R(c,cx,y0+4+w,1,8,'#7a4a2a'); }
    SHA.drawn=true; }
  catch(e){ return SH_OLD_DRAW(c,cx,by,f,s); } };
// world sprites showing the new Shayan are scaled to match the rest of the cast
(function(){ const d0=Sprite3D.prototype.draw; Sprite3D.prototype.draw=function(fn,o){ SHA.drawn=false; d0.call(this,fn,o);
    if(SHA.drawn){ if(this._shS!==SHA.scale){ this._shS=SHA.scale; this.mesh.scale.set(SHA.scale,SHA.scale,1); } }
    else if(this._shS){ this._shS=0; this.mesh.scale.set(1,1,1); } SHA.drawn=false; }; })();
// the throw pose when Shayan launches a fireball
(function(){ const tf=twFireball; twFireball=function(big){ Player.fbPose=.22; return tf(big); };
  const up=updatePlayer; updatePlayer=function(dt){ const P=Player; if(P.fbPose>0) P.fbPose-=dt; return up(dt); }; })();
// portrait
(function(){ const po=portrait; const cache={}; portrait=function(who,ex){ if(who!=='shayan'||!SHA.pok) return po(who,ex);
    const k=ex==='angry'?1:ex==='blush'?2:0; if(cache[k]) return cache[k]; const [cv,cc]=mkCanvas(56,56); cc.drawImage(SHA.pimg,k*56,0,56,56,0,0,56,56); cache[k]=cv; return cv; }; })();
