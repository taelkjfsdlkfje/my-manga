// =====================================================================
// SAVE KEYS: progress as a short code you can carry to any browser.
// The key always reflects what you've cleared, so it updates after every fight.
// =====================================================================
const SK_MASK=0x2A5F3C1;
function skBits(){ let v=0; TL_CHECKS.forEach((id,i)=>{ if(TWS.done[id]) v|=(1<<i); }); if(TWS.paulDone) v|=(1<<TL_CHECKS.length); return v>>>0; }
function skSum(v){ return (Math.imul(v^0x5bd1e995,2654435761)>>>0)%1296; }
function twSaveKey(){ const v=skBits(), e=(v^SK_MASK)>>>0; return 'MSB-'+e.toString(36).toUpperCase().padStart(6,'0')+'-'+skSum(v).toString(36).toUpperCase().padStart(2,'0'); }
function twReadKey(k){ const m=String(k||'').toUpperCase().replace(/\s+/g,'').match(/^MSB-([0-9A-Z]{1,7})-([0-9A-Z]{2})$/); if(!m) return null; const e=parseInt(m[1],36); if(!isFinite(e)) return null;
  const v=(e^SK_MASK)>>>0; if(skSum(v).toString(36).toUpperCase().padStart(2,'0')!==m[2]) return null; if(v>=Math.pow(2,TL_CHECKS.length+1)) return null; return v; }
function twApplyKey(v){ let n=0; TL_CHECKS.forEach((id,i)=>{ if(v&(1<<i)){ if(!TWS.done[id]) n++; TWS.done[id]=TWS.done[id]||Date.now(); } }); if(v&(1<<TL_CHECKS.length)) TWS.paulDone=1; twSave(); return n; }

// the key on the Esc timeline, top right, with a copy button
(function(){ const dt=twDrawTimeline; twDrawTimeline=function(){ dt(); if(!TLM.open) return; const key=twSaveKey(), x1=UW-30, y=82;
    D.save(); D.fillStyle='rgba(20,14,10,.92)'; D.fillRect(x1-330,y-4,330,44); D.strokeStyle='#8a6a3a'; D.lineWidth=2; D.strokeRect(x1-330,y-4,330,44);
    D.textAlign='left'; D.font=`700 11px ${FB}`; D.fillStyle='#a8906a'; D.fillText('SAVE KEY  (paste it into a fresh game)',x1-320,y+10);
    D.font=`700 17px monospace`; D.fillStyle=TLM.keyCopied>0?'#7affb0':'#ffe6b0'; D.fillText(key,x1-320,y+31); D.restore();
    if(TLM.keyCopied>0) TLM.keyCopied-=1/60; tlBtn(x1-92,y+2,84,32,TLM.keyCopied>0?'Copied':'Copy',false,'copykey'); };
  const ta=tlActivate; tlActivate=function(id){ if(id==='copykey'){ const k=twSaveKey(); try{ navigator.clipboard.writeText(k); }catch(e){} TLM.keyCopied=1.6; Sound.sfx('select'); return; } return ta(id); };
  // the banner after each cleared checkpoint mentions the new key
  const mk=twMark; twMark=function(id){ const had=!!TWS.done[id]; mk(id); if(!had&&TWS.done[id]&&Game.banner&&!TWS.all) Game.banner.sub=(Game.banner.sub||'')+'   ·   Save key: '+twSaveKey(); }; })();

// "Do you have a save key?" at the start of a fresh game (once per visit)
let SK_ASKED=false;
(function(){ const ng=newGame; newGame=function(){ const r=ng.apply(this,arguments); if(!SK_ASKED&&MP.role!=='guest'){ SK_ASKED=true; setTimeout(skAsk,60); } return r; }; })();
function skAsk(){ const d=mpPanel('<div style="font:700 26px Georgia,serif;margin-bottom:8px">Do you have a save key?</div><div style="color:#a8906a;font-size:14px;margin-bottom:14px">Keys look like <b>MSB-XXXXXX-XX</b>. You can find yours on Paul\'s timeline (press Esc in game).</div><div id="skBody"><button id="skYes" style="'+MP_BTN+'">Yes</button><button id="skNo" style="'+MP_BTN2+'">No</button></div>');
  d.querySelector('#skNo').onclick=()=>mpClosePanel();
  d.querySelector('#skYes').onclick=()=>{ const b=d.querySelector('#skBody'); b.innerHTML='<input id="skIn" placeholder="MSB-XXXXXX-XX" style="font:700 22px monospace;width:100%;box-sizing:border-box;text-align:center;background:#0e0a0c;color:#ffe6b0;border:2px solid #8a6a3a;padding:8px"><div id="skMsg" style="min-height:20px;margin-top:8px;font-size:14px;color:#a8906a"></div><button id="skApply" style="'+MP_BTN+'">Load key</button><button id="skCancel" style="'+MP_BTN2+'">Never mind</button>';
    const inp=b.querySelector('#skIn'); inp.focus();
    const apply=()=>{ const v=twReadKey(inp.value); const msg=b.querySelector('#skMsg'); if(v==null){ msg.style.color='#ff9a9a'; msg.textContent="That key doesn't look right. Check for typos."; return; }
      const n=twApplyKey(v); msg.style.color='#7affb0'; msg.textContent=n?('Unlocked '+n+' checkpoint'+(n>1?'s':'')+'. Press Esc in game to warp.'):'Loaded. Nothing new to unlock.'; Sound.sfx('secret'); setTimeout(mpClosePanel,1400); };
    b.querySelector('#skApply').onclick=apply; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') apply(); }); b.querySelector('#skCancel').onclick=()=>mpClosePanel(); }; }
