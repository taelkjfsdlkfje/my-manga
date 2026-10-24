// =====================================================================
// OMAR, REWORKED: Shadow Step Execution (front cut, back cut; parry both = stun)
// =====================================================================
TWK.omar.blinkcut=function*(T,ph){ const sp=twSp(T); twBark('omar',ph>=2?"Front. Back. Grave.":"I am in front of you. I am behind you. I am... everywhere you regret.",true);
  twComboStart(T,2); const tf=(ph>=3?.36:.44)/sp, tb=(ph>=3?.3:.36)/sp;
  FX.burst(T.x,T.y+1.4,T.z,22,0x140a1a,4,.45,false); T.hide=1; Sound.sfx('dash'); yield .22;
  twBlinkTo(T,'front',1.6,0x140a1a); T.hide=0; T.scythe=1; T.swing=0; let P=Player, a=Math.atan2(P.z-T.z,P.x-T.x); T.lockF=1; T.f=Math.cos(a)>0?1:-1;
  FX.line(T.x,T.z,a,2.9,2.6,0xb06aff,tf); Sound.sfx('charge'); yield tf; twSlash(T,3,2.9,{col:'#b06aff'}); yield .42;
  FX.burst(T.x,T.y+1.4,T.z,22,0x140a1a,4,.45,false); T.hide=1; T.swing=0; Sound.sfx('dash'); yield .16/sp;
  twBlinkTo(T,'back',1.6,0x140a1a); T.hide=0; P=Player; a=Math.atan2(P.z-T.z,P.x-T.x); T.f=Math.cos(a)>0?1:-1; twBark('omar',"Behind you.",true);
  FX.line(T.x,T.z,a,2.9,2.6,0xb06aff,tb); yield tb; twSlash(T,3,2.9,{col:'#b06aff'}); yield .35;
  T.scythe=0; T.swing=0; T.lockF=0;
  if(twComboEnd(T,3.4)){ twBark('omar',"Both...? You read me like... a sad poem.",true); return; }
  yield .45; };
for(const k of [1,2,3]) TWPOOL.omar[k].push('blinkcut');
