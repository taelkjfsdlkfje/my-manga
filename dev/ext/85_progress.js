// =====================================================================
// PAUL'S TIMELINE: saved progress, a branching route map, and warps
// Every checkpoint shows ??? until you clear it in the story. Cleared ones
// show their art, a checkmark, and can be warped to. Saved in localStorage,
// so it survives endings and new games.
// =====================================================================
const PAUL_LOOK={cloth:'#3a3f4a',clothS:'#2a2e36',skin:'#d8a882',hair:'#1a1410',hood:'#4b5160',pants:'#26262c',pantsS:'#1c1c22'};
const TWS=(function(){ let d={done:{},all:false}; try{ const r=JSON.parse(localStorage.getItem('msTimeline')||'null'); if(r&&r.done) d=r; }catch(e){} return d; })();
function twSave(){ try{ localStorage.setItem('msTimeline',JSON.stringify(TWS)); }catch(e){} }
function twDone(id){ return !!(TWS.all||TWS.done[id]); }
function twMark(id){ if(!id||TWS.done[id]) return; TWS.done[id]=Date.now(); twSave(); const n=TL_BY[id]; if(n&&!TWS.all) Game.banner={name:'Timeline updated',sub:n.name+'  ✓',t:0,small:1}; }
function twToggleAll(){ TWS.all=!TWS.all; twSave(); return TWS.all; }
function twRP(){ return ALI()?'al':'sh'; }
function twAllyKey(){ const a=Game.flags.twinAlly; return a==='both'?'both':a==='omar'?'omar':a==='caotan'?'cao':null; }

// ---------- the map ----------
const TL=[
  // Shayan's road
  {id:'sh_root',tab:0,col:0,row:1,root:1,name:"Shayan's Road",desc:"A blacksmith, a pig fairy, and a girl in a cage. What could go wrong?"},
  {id:'sh_twins',tab:0,col:1,row:1,par:['sh_root'],name:'Twin Peaks of Cringe',desc:"Two gatekeepers who look nothing alike. They don't talk about it."},
  {id:'sh_dec',tab:0,col:2,row:1,par:['sh_twins'],name:'THE DECISION',desc:"They're on their knees, blaming each other. Somebody has to pick."},
  {id:'sh_omar',tab:0,col:3,row:0,par:['sh_dec'],name:'Omar Lives, Pillows Weep',desc:"Caotan eats a Getsuga. Omar joins you. Emotionally unavailable, but punctual."},
  {id:'sh_cao',tab:0,col:3,row:1,par:['sh_dec'],name:'Caotan Lives, The Dark Is Unemployed',desc:"Omar is gone. Caotan joins: ranged DPS and emotional support."},
  {id:'sh_both',tab:0,col:3,row:2,par:['sh_dec'],name:'The Group Chat Is Born',desc:"What if there was another way? Both twins join. Nobody is happy about it."},
  {id:'sh_omar_g',tab:0,col:4,row:0,par:['sh_omar'],name:'Dog Lord vs. Edge Lord',desc:"Grimmaw, with Omar reaping things beside you."},
  {id:'sh_cao_g',tab:0,col:4,row:1,par:['sh_cao'],name:'Senpai vs. The Dog Lord',desc:"Grimmaw, with Caotan sniping from the back row."},
  {id:'sh_both_g',tab:0,col:4,row:2,par:['sh_both'],name:'Four Idiots and a Kennel',desc:"Grimmaw versus the entire squad."},
  {id:'sh_omar_f',tab:0,col:5,row:0,par:['sh_omar_g'],name:'The Edge Betrays (As Foretold)',desc:"Omar turns on you among the white flowers. He ate the moon."},
  {id:'sh_cao_f',tab:0,col:5,row:1,par:['sh_cao_g'],name:'Senpai Noticed You (Violently)',desc:"Caotan turns on you. Ten glints. One body pillow. No mercy."},
  {id:'sh_both_f',tab:0,col:5,row:2,par:['sh_both_g'],name:'Big Back Hamza',desc:"Hamza tries to eat you. The twins say no. Then they say yes, to eating you, sort of."},
  {id:'sh_hamza',tab:0,col:6,row:0.5,par:['sh_omar_f','sh_cao_f'],name:'Eight Billion Lullabies',desc:"The pig ate the world. Nathan the Nasty does not accept this. Now in 3D."},
  {id:'sh_duo',tab:0,col:6,row:2,par:['sh_both_f'],name:"Tuesday's Children",desc:"Shayan and a mysterious samurai versus both twins at once. Fusion included."},
  // Ali's road
  {id:'al_root',tab:1,col:0,row:1,root:1,name:"Ali's Road",desc:"A wanderer who counts to ten. Slowly. On purpose."},
  {id:'al_twins',tab:1,col:1,row:1,par:['al_root'],name:'Butter Knives in Coats',desc:"The gatekeepers try very hard. Ali tries less."},
  {id:'al_dec',tab:1,col:2,row:1,par:['al_twins'],name:'THE DECISION',desc:"Two twins, one sword, zero patience."},
  {id:'al_omar',tab:1,col:3,row:0,par:['al_dec'],name:'One Slash, One Twin',desc:"Caotan is gone. Omar follows the samurai. He calls it 'research'."},
  {id:'al_cao',tab:1,col:3,row:1,par:['al_dec'],name:'Uwu Survives',desc:"Omar is gone. Caotan follows Ali around like a lost puppy with glasses."},
  {id:'al_both',tab:1,col:3,row:2,par:['al_dec'],name:'Ali Adopts Two Weaklings',desc:"Two weaklings are better than zero weaklings. Barely."},
  {id:'al_omar_g',tab:1,col:4,row:0,par:['al_omar'],name:'Dog Lord: Eleven Seconds',desc:"Grimmaw, with Omar. Ali counted."},
  {id:'al_cao_g',tab:1,col:4,row:1,par:['al_cao'],name:'Senpai and the Samurai',desc:"Grimmaw, with Caotan."},
  {id:'al_both_g',tab:1,col:4,row:2,par:['al_both'],name:'Kennel Club Field Trip',desc:"Grimmaw versus Ali and his two new emotional support twins."},
  {id:'al_omar_f',tab:1,col:5,row:0,par:['al_omar_g'],name:'Butter Knife Betrayal',desc:"Omar studied your moveset. He read the wiki."},
  {id:'al_cao_f',tab:1,col:5,row:1,par:['al_cao_g'],name:'Friendzoned by a Samurai',desc:"Caotan's dating sim, but the protagonist says 'Hm.' to everything."},
  {id:'al_nathan',tab:1,col:6,row:0.5,par:['al_omar_f','al_cao_f'],name:'Your Tragic Arc Was Mid',desc:"Nathan crosses timelines to fight the pig. Ali already cut the pig in half."},
  {id:'al_nathan_both',tab:1,col:5.5,row:2,par:['al_both_g'],name:'Nathan vs. The Group Chat',desc:"Nathan the Nasty versus Ali and two twins who will not stop talking."},
  // oddities
  {id:'sh_nathan',tab:2,col:1,row:1,root:0,par:[],name:'Wrong Protagonist',desc:"Shayan versus Nathan. This was never supposed to happen. Paul loves it."},
  {id:'paul',tab:2,col:4,row:1,par:[],final:1,name:'Paul Extreme: Code Review',desc:"Paul's own fight. Everyone loses their powers, nobody loses their dignity (they lose that later). Opens once every other checkpoint is cleared, or with the 9 key."}];
const TL_BY={}; TL.forEach(n=>TL_BY[n.id]=n);
const TL_CHECKS=TL.filter(n=>!n.root&&!n.final).map(n=>n.id);
function twAllDone(){ return TL_CHECKS.every(twDone); }
function twNodeOpen(n){ return n.root||(n.final?twAllDone():twDone(n.id)); }

// ---------- checkpoint hooks ----------
(function(){ const td=SCR_BASE.twinsDown; const wrapDown=function*(){ const r=twRP(); twMark(r+'_twins'); twMark(r+'_dec'); yield* td.call(this); };
  twSetScr('twinsDown',wrapDown);
  const ex=twExecute; twExecute=function*(V,S){ yield* ex(V,S); twMark(twRP()+'_'+(S.who==='omar'?'omar':'cao')); };
  const pt=twPactTalk; twPactTalk=function*(C,O){ yield* pt(C,O); twMark(twRP()+'_both'); };
  const sd=twSoloDefeat; twSoloDefeat=function*(F,T){ twMark(twRP()+'_'+(T.who==='omar'?'omar':'cao')+'_f'); yield* sd(F,T); };
  const hf=hzgFinale; hzgFinale=function*(){ twMark('sh_both_f'); yield* hf(); };
  const de=twDuoEnding; twDuoEnding=function*(F,C,O){ twMark('sh_duo'); yield* de(F,C,O); };
  const bh=blackHoleFinale; blackHoleFinale=function*(){ if(!ALI()) twMark('sh_hamza'); yield* bh(); };
  const nf=nbFinale; nbFinale=function*(){ if(ALI()) twMark(Game.flags.twinPact?'al_nathan_both':'al_nathan'); else twMark('sh_nathan'); yield* nf(); }; })();
function twMarkGrimmaw(){ const k=twAllyKey(); if(k) twMark(twRP()+'_'+k+'_g'); }

// ---------- warps ----------
function twWarpReset(ali){ const P=Player; Voice.stop(); if(Game.mech) exitMech(); nbRemove(); twEndFight(); twClearAllies(); TW.giant=null; TW.giantRespawn=null; clearGibs(); endClash();
  if(Game.boss&&Game.boss.spr) Game.boss.spr.dispose(); Game.boss=null; Game.bossBar=0; if(Game.zw) zwEnd(); JC.lines=[]; Game.arena=null; Game.fxUpd=[]; twSweep(false); clearTwins();
  const aff=Math.max(Game.aff||0,6); Game.flags={metMira:1,bellMemory:1,twinsDone:0}; if(ali){ Game.flags.ali=1; Game.flags.moonCut=1; Object.assign(SCR,SCRA); } else Object.assign(SCR,SCR_BASE);
  Game.aff=aff; Game.aliOld=0; Game.aliHintT=0; Game.mira=null; if(mSprite) mSprite.show(false); Object.assign(P,{sp:0,counter:0,cineFly:false,cineAnim:null,hidden:false,scripted:null,atk:null,charge:0}); P.maxHp=12; P.hp=P.maxHp;
  newHamza(); Game.hamza.mode='follow'; Game.paulLock=false; }
function* twWarpTwinsDown(){ yield fadeOut(); loadLevel('twins',{keepHP:1}); resetPlayer({x:9.5,z:9.2},true); twStartGate(); TW.fight.frame=false; TW.fight.noAttack=true;
  for(const T of TW.foes){ T.down=1; T.hp=0; T.inv=true; } Game.fade=1; yield fadeIn(); }
function* twWarpFlowers(o){ o=o||{}; yield fadeOut(); const fl=Game.flags, aff=Game.aff; loadLevel('flowers',{keepHP:1}); Game.flags=fl; Game.aff=aff; const P=Player, z=L.zone||{x:58,z:60};
  resetPlayer({x:z.x,z:z.z+3},true); P.hp=P.maxHp; if(o.cage){ const cg=L.spots.mira; addActor('cage',cg.x,cg.z,cg.y!=null?cg.y:groundY(cg.x,cg.z)); }
  if(o.mira){ Game.mira={x:P.x+1.4,y:P.y,z:P.z+.4,f:-1,anim:'idle',t:0,follow:false,vis:true}; makeMiraSprite(); if(mSprite) mSprite.show(true); }
  if(o.noHamza){ Game.hamza=null; if(hSprite) hSprite.show(false); } Game.fade=1; yield fadeIn(); }
function twSetParty(k){ Game.flags.twinsDone=1; if(k==='both'){ Game.flags.twinAlly='both'; Game.flags.twinPact=1; twAddAlly('caotan'); twAddAlly('omar'); } else { Game.flags.twinAlly=k==='cao'?'caotan':'omar'; Game.flags.twinPact=0; twAddAlly(Game.flags.twinAlly); } }
function* twWarp(id){ const n=TL_BY[id]; if(!n) return; const ali=id.startsWith('al_'); const parts=id.split('_'); twWarpReset(ali); const P=Player;
  if(id==='sh_nathan'){ yield* paulWarp(false,'nathan'); return; }
  if(id==='paul'){ yield* twPaulIntro(); return; }
  const step=parts[1], k=parts[1], tail=parts[2];
  if(step==='root'||step==='twins'){ yield* SCR.twinsGate(); return; }
  if(step==='dec'){ yield* twWarpTwinsDown(); yield* SCR.twinsDown(); return; }
  if(['omar','cao','both'].includes(k)&&!tail){ yield* twWarpTwinsDown(); const C=TW.foes.find(T=>T.who==='caotan'), O=TW.foes.find(T=>T.who==='omar'); twMark(twRP()+'_dec');
    if(k==='both') yield* twPactTalk(C,O); else yield* twExecute(k==='omar'?C:O,k==='omar'?O:C); Game.flags.twinsDone=1; twEndFight(); Game.arena=null; Cam.focus=null; yield* SCR.keepGate(); return; }
  if(tail==='g'){ twSetParty(k); yield* SCR.keepGate(); return; }
  if(tail==='f'&&k!=='both'){ twSetParty(k); yield* twWarpFlowers({cage:1}); Game.boss=null; yield* twBetrayal(); return; }
  if(id==='sh_both_f'){ twSetParty('both'); yield* twWarpFlowers({mira:1}); yield* twPactHamza(); return; }
  if(id==='sh_duo'){ twSetParty('both'); yield* twWarpFlowers({mira:1,noHamza:1}); yield* twTwinsTurn(); return; }
  if(id==='sh_hamza'){ yield fadeOut(); Game.mira=null; yield* nathanIntro(); return; }
  if(id==='al_nathan'||id==='al_nathan_both'){ if(id==='al_nathan_both') twSetParty('both'); yield* twWarpFlowers({mira:1,noHamza:1}); yield* nathanArrives(); return; } }

// ---------- card art: little painted scenes made from the game's own sprites ----------
const TL_ART={}; const ART_W=192, ART_H=108;
function artChar(c,fn,x,y,s,size){ size=size||128; const [cv,cc]=mkCanvas(size,size); try{ fn(cc,size/2,size-2); }catch(e){} outlinePass(cc,size,size,OUT); c.drawImage(cv,Math.round(x-size/2*s),Math.round(y-(size-2)*s),Math.round(size*s),Math.round(size*s)); }
function artBG(c,top,bot,ground){ const g=c.createLinearGradient(0,0,0,ART_H); g.addColorStop(0,top); g.addColorStop(1,bot); c.fillStyle=g; c.fillRect(0,0,ART_W,ART_H);
  for(let i=0;i<30;i++){ c.fillStyle=`rgba(255,255,255,${.2+hash(i,7)*.5})`; c.fillRect(hash(i,3)*ART_W|0,hash(3,i)*ART_H*.5|0,1,1); } c.fillStyle=ground; c.fillRect(0,ART_H-22,ART_W,22); }
const SH_=(c,x,y,s,f,anim)=>artChar(c,(cc,cx,by)=>drawShayanHD(cc,cx,by,f||1,{t:1,anim:anim||'idle',ap:1,combo:0}),x,y,s,64);
const AL_=(c,x,y,s,f,anim)=>artChar(c,(cc,cx,by)=>drawAliHD(cc,cx,by,f||1,{t:1,anim:anim||'idle'}),x,y,s,64);
const CA_=(c,x,y,s,f,o)=>artChar(c,(cc,cx,by)=>drawCaotanBoss(cc,cx,by,f||-1,Object.assign({t:1},o||{})),x,y,s);
const OM_=(c,x,y,s,f,o)=>artChar(c,(cc,cx,by)=>drawOmarBoss(cc,cx,by,f||-1,Object.assign({t:1},o||{})),x,y,s);
const GR_=(c,x,y,s,f,a)=>artChar(c,(cc,cx,by)=>drawGrimmawHD(cc,cx,by,f||-1,{t:1,anim:a||'howl'}),x,y,s);
const MI_=(c,x,y,s,f)=>artChar(c,(cc,cx,by)=>drawMiraHD(cc,cx,by,f||-1,{t:1,anim:'idle',blush:1}),x,y,s,64);
const HZ_=(c,x,y,s)=>artChar(c,(cc,cx,by)=>drawHamzaFairy(cc,cx,by,1,1,0),x,y,s,40);
const PIG_=(c,x,y,s,m)=>artChar(c,(cc,cx,by)=>drawGiantPig(cc,cx,by,1,{t:1,mouth:m||0,front:0}),x,y,s,160);
const NA_=(c,x,y,s,f)=>artChar(c,(cc,cx,by)=>drawNathanPilot(cc,cx,by,f||-1,{t:1}),x,y,s,64);
const PA_=(c,x,y,s,f)=>artChar(c,(cc,cx,by)=>drawVillagerHD(cc,cx,by,f||-1,{t:1},PAUL_LOOK),x,y,s,64);
function artText(c,txt,x,y,col){ c.font='bold 13px sans-serif'; c.lineWidth=3; c.strokeStyle='#14001a'; c.strokeText(txt,x,y); c.fillStyle=col||'#fff'; c.fillText(txt,x,y); }
function artHearts(c,n){ for(let i=0;i<n;i++){ const x=hash(i,11)*ART_W, y=hash(11,i)*ART_H*.7; c.fillStyle='#ff6ab0'; c.fillRect(x,y,3,2); c.fillRect(x+4,y,3,2); c.fillRect(x+1,y+2,5,2); c.fillRect(x+2,y+4,3,1); } }
function artBeam(c,x0,y0,x1,y1,col,w){ c.strokeStyle=col; c.lineWidth=w||4; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); c.strokeStyle='#fff'; c.lineWidth=(w||4)/3; c.stroke(); }
const ART={
  sh_root(c){ artBG(c,'#2a2d66','#c06a86','#3a4a2a'); SH_(c,60,96,1.2,1); HZ_(c,88,58,1.2); MI_(c,140,96,1.1,-1); artHearts(c,4); },
  al_root(c){ artBG(c,'#05060f','#3a1020','#2a2a30'); AL_(c,96,98,1.4,1); c.fillStyle='#d8d4cc'; c.beginPath(); c.arc(150,30,14,0,7); c.fill(); c.strokeStyle='#ff2a3a'; c.lineWidth=2; c.beginPath(); c.moveTo(130,48); c.lineTo(170,12); c.stroke(); },
  sh_twins(c){ artBG(c,'#010309','#0e1c44','#2a3550'); CA_(c,70,100,.55,1,{glintT:.5}); OM_(c,128,100,.55,-1,{scythe:1}); SH_(c,30,100,.9,1,'attack'); artText(c,'WE DON\'T TALK',100,18,'#bfe4ff'); artText(c,'ABOUT IT.',120,32,'#bfe4ff'); },
  al_twins(c){ artBG(c,'#010309','#0e1c44','#2a3550'); CA_(c,90,100,.5,1,{down:1}); OM_(c,140,100,.5,-1,{down:1}); AL_(c,40,100,.9,1); artText(c,'BUTTER KNIFE.',70,22,'#ff9aa8'); },
  sh_dec(c){ artBG(c,'#100818','#2a1030','#2a2030'); CA_(c,62,100,.5,1,{down:1,heartEyes:1}); OM_(c,130,100,.5,-1,{down:1}); artText(c,'KILL HIM!',8,20,'#ff9ad8'); artText(c,'NO, HIM.',118,20,'#c08aff'); },
  sh_omar(c){ artBG(c,'#100818','#3a1030','#2a2030'); OM_(c,130,100,.55,-1); SH_(c,48,100,.9,1,'beam'); artBeam(c,62,74,100,60,'#ff3a5a',5); artHearts(c,8); artText(c,'RIP CAOTAN',10,18,'#ffd0ec'); },
  sh_cao(c){ artBG(c,'#100818','#3a1030','#2a2030'); CA_(c,130,100,.55,-1,{glintT:.5}); SH_(c,48,100,.9,1,'beam'); artText(c,'RIP OMAR',10,18,'#c08aff'); artText(c,'(HE WROTE POEMS)',8,32,'#c08aff'); },
  sh_both(c){ artBG(c,'#20103a','#6a3a6a','#2a2030'); CA_(c,70,100,.5,1,{heartEyes:1}); OM_(c,122,100,.5,-1); SH_(c,170,100,.8,-1); artText(c,'SQUAAAD!!',60,20,'#ffd45a'); },
  sh_omar_g(c){ artBG(c,'#0a0306','#3a1018','#2a1418'); GR_(c,128,102,.6,-1); OM_(c,56,100,.45,1,{scythe:1}); SH_(c,26,100,.75,1,'attack'); },
  sh_cao_g(c){ artBG(c,'#0a0306','#3a1018','#2a1418'); GR_(c,128,102,.6,-1); CA_(c,56,100,.45,1,{glintT:.5}); SH_(c,26,100,.75,1,'attack'); artBeam(c,62,54,118,52,'#bfe4ff',3); },
  sh_both_g(c){ artBG(c,'#12030a','#8a1a22','#3a0a14'); GR_(c,140,102,.6,-1); CA_(c,46,100,.4,1); OM_(c,82,100,.4,1); SH_(c,18,100,.7,1,'attack'); },
  sh_omar_f(c){ artBG(c,'#03030c','#2a2050','#141a36'); c.fillStyle='#000'; c.beginPath(); c.arc(150,26,14,0,7); c.fill(); OM_(c,118,100,.6,-1,{form:3,scythe:1}); SH_(c,40,100,.9,1,'attack'); artText(c,'HE ATE THE MOON',6,18,'#c08aff'); },
  sh_cao_f(c){ artBG(c,'#03030c','#5a2050','#141a36'); artHearts(c,14); CA_(c,118,100,.6,-1,{form:3,glintT:.6}); SH_(c,40,100,.9,1); artText(c,'✦ ×10',8,22,'#ffffff'); },
  sh_both_f(c){ artBG(c,'#03030c','#2a2050','#141a36'); PIG_(c,120,102,.6,1); SH_(c,30,100,.8,1); CA_(c,62,90,.35,1); OM_(c,82,90,.35,1); artText(c,'ITADAKIMASU',90,18,'#ffb0c8'); },
  sh_hamza(c){ const g=c.createRadialGradient(140,40,4,140,40,90); g.addColorStop(0,'#3a1020'); g.addColorStop(1,'#000'); c.fillStyle=g; c.fillRect(0,0,ART_W,ART_H); for(let i=0;i<50;i++){ c.fillStyle='#fff'; c.fillRect(hash(i,1)*ART_W|0,hash(1,i)*ART_H|0,1,1); }
    if(MECHTEX&&MECHTEX.image){ try{ c.drawImage(MECHTEX.image,14,30,64,70); }catch(e){} } c.fillStyle='#f09ab6'; c.beginPath(); c.arc(146,52,30,0,7); c.fill(); c.fillStyle='#ff2a3a'; c.fillRect(132,44,7,5); c.fillRect(152,44,7,5); c.fillStyle='#3a0010'; c.fillRect(134,62,24,8); artText(c,'NOW IN 3D',96,100,'#3ff4ff'); },
  sh_duo(c){ artBG(c,'#03030c','#3a2060','#141a36'); CA_(c,104,100,.5,-1,{form:3}); OM_(c,150,100,.5,-1,{form:3}); SH_(c,30,100,.8,1,'attack'); AL_(c,60,100,.8,1); artText(c,'FU... SION... HA!',40,18,'#ffd45a'); },
  al_dec(c){ artBG(c,'#100818','#2a1030','#2a2030'); CA_(c,62,100,.5,1,{down:1}); OM_(c,130,100,.5,-1,{down:1}); AL_(c,170,100,.7,-1); artText(c,'...HM.',80,20,'#ff9aa8'); },
  al_omar(c){ artBG(c,'#100818','#3a1030','#2a2030'); OM_(c,134,100,.55,-1); AL_(c,50,100,.9,1); c.strokeStyle='#ff2a3a'; c.lineWidth=2; for(let i=0;i<4;i++){ c.beginPath(); c.moveTo(20+i*30,10); c.lineTo(60+i*30,90); c.stroke(); } },
  al_cao(c){ artBG(c,'#100818','#3a1030','#2a2030'); CA_(c,134,100,.55,-1,{heartEyes:1}); AL_(c,50,100,.9,1); artHearts(c,10); artText(c,'ALI-KUN ♡',100,20,'#ffd0ec'); },
  al_both(c){ artBG(c,'#20103a','#6a3a6a','#2a2030'); CA_(c,96,100,.45,-1,{heartEyes:1}); OM_(c,140,100,.45,-1); AL_(c,44,100,.9,1); artText(c,'WEAKLINGS (2)',60,20,'#ffd45a'); },
  al_omar_g(c){ artBG(c,'#0a0306','#3a1018','#2a1418'); GR_(c,128,102,.6,-1,'winded'); OM_(c,60,100,.42,1); AL_(c,26,100,.8,1); artText(c,'11 SECONDS',96,18,'#ff9aa8'); },
  al_cao_g(c){ artBG(c,'#0a0306','#3a1018','#2a1418'); GR_(c,128,102,.6,-1,'winded'); CA_(c,60,100,.42,1); AL_(c,26,100,.8,1); },
  al_both_g(c){ artBG(c,'#12030a','#8a1a22','#3a0a14'); GR_(c,140,102,.6,-1); CA_(c,52,100,.38,1); OM_(c,86,100,.38,1); AL_(c,20,100,.7,1); artText(c,'FIELD TRIP',70,18,'#ffd45a'); },
  al_omar_f(c){ artBG(c,'#03030c','#2a2050','#141a36'); OM_(c,118,100,.6,-1,{form:3,scythe:1}); AL_(c,40,100,.9,1); artText(c,'HE READ THE WIKI',6,18,'#c08aff'); },
  al_cao_f(c){ artBG(c,'#03030c','#5a2050','#141a36'); artHearts(c,12); CA_(c,118,100,.6,-1,{form:2,heartEyes:1}); AL_(c,40,100,.9,1); artText(c,'"Hm."',20,22,'#ffffff'); },
  al_nathan(c){ artBG(c,'#03030c','#141030','#1a2040'); if(MECHTEX&&MECHTEX.image){ try{ c.drawImage(MECHTEX.image,96,18,84,86); }catch(e){} } AL_(c,44,100,.9,1); artText(c,'ARC: MID',8,18,'#3ff4ff'); },
  al_nathan_both(c){ artBG(c,'#03030c','#141030','#1a2040'); if(MECHTEX&&MECHTEX.image){ try{ c.drawImage(MECHTEX.image,110,22,74,80); }catch(e){} } AL_(c,30,100,.8,1); CA_(c,64,96,.36,1); OM_(c,88,96,.36,1); },
  sh_nathan(c){ artBG(c,'#03030c','#141030','#1a2040'); if(MECHTEX&&MECHTEX.image){ try{ c.drawImage(MECHTEX.image,96,18,84,86); }catch(e){} } SH_(c,44,100,.9,1); artText(c,'WRONG GUY',8,18,'#3ff4ff'); },
  paul(c){ c.fillStyle='#000'; c.fillRect(0,0,ART_W,ART_H); c.font='10px monospace'; for(let i=0;i<60;i++){ c.fillStyle=`rgba(80,255,120,${hash(i,5)})`; c.fillText(hash(i,2)>.5?'1':'0',hash(i,9)*ART_W,hash(9,i)*ART_H); }
    PA_(c,96,100,1.4,-1); c.fillStyle='rgba(255,0,60,.35)'; c.fillRect(60,40,80,6); artText(c,'ERROR: TOO MANY BOSSES',20,20,'#ff4a6a'); }
};
function twArt(id){ if(TL_ART[id]) return TL_ART[id]; const [cv,c]=mkCanvas(ART_W,ART_H); c.imageSmoothingEnabled=false; try{ (ART[id]||ART.sh_root)(c); }catch(e){ console.error('art',id,e); } TL_ART[id]=cv; return cv; }
function twArtLocked(){ if(TL_ART.__lock) return TL_ART.__lock; const [cv,c]=mkCanvas(ART_W,ART_H); const g=c.createLinearGradient(0,0,0,ART_H); g.addColorStop(0,'#1a1620'); g.addColorStop(1,'#0a080e'); c.fillStyle=g; c.fillRect(0,0,ART_W,ART_H);
  c.font='bold 40px serif'; c.fillStyle='rgba(216,180,106,.35)'; c.textAlign='center'; c.fillText('???',ART_W/2,ART_H/2+14); TL_ART.__lock=cv; return cv; }
