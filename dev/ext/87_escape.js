// ---------- Esc opens Paul's timeline from anywhere in play (P still pauses) ----------
function twEscOk(){ return !TLM.open&&(Game.state==='play'||Game.state==='cut')&&!Game.clash&&!Game.zw&&!(Game.dlg&&Game.dlg.type==='choice')&&!(Game.wait&&Game.wait.type==='tlmenu'); }
function twEscOpen(){ TLM.esc={prev:Game.state}; Game.state='paused'; Game.prev=TLM.esc.prev; Voice.stop(); twTimelineMenu(); }
function twLeavePaulFight(){ if(!TW.paulFight&&!PF) return; if(PF){ for(const m of PF.members) if(m.spr) m.spr.show(false); const Pa=PF.paul; if(Pa&&Pa.spr){ Pa.spr.show(false); (Pa.ghosts||[]).forEach(g=>g.show(false)); } }
  PF=null; TW.paulFight=null; TW.paulWon=0; Game.paulLock=false; }
(function(){ const tc=twTimelineClose; twTimelineClose=function(id){ const esc=TLM.esc; if(!esc||!TLM.open) return tc(id); TLM.esc=null; TLM.open=false; Sound.sfx(id?'select':'blip');
    Game.state=esc.prev==='cut'&&!Game.script?'play':esc.prev;
    if(id){ Object.assign(Game,{wait:null,dlg:null,timeScale:1,slowT:0,banner:null,card:null,evaCard:null}); Voice.stop(); twLeavePaulFight(); Cam.cine=null; Game.letterTo=0; run(function*(){ yield* twWarp(id); }); } };
  const wr=twWarpReset; twWarpReset=function(ali){ twLeavePaulFight(); return wr(ali); }; })();
addEventListener('keydown',e=>{ if(e.code!=='Escape'||e.repeat||TLM.open) return; if(!twEscOk()) return; e.preventDefault(); e.stopImmediatePropagation(); twEscOpen(); },true);
addEventListener('keydown',e=>{ if(TLM.open&&TLM.esc){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
