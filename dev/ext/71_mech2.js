// Hamza mech fight: half HP everywhere, no "goes 3D" title card (the controls hint stays)
(function(){ for(const k in HZ_HP) HZ_HP[k]=Math.round(HZ_HP[k]/2);
  const me=m3Enter; m3Enter=function(cine){ me(false); const G=Game.mech; if(cine&&G&&G.d3){ G.d3.cd=2; Game.banner={name:'Dimension Break',sub:'Fly through the gaps. Slash what reaches you. Dash through lasers.',t:0,small:1}; } }; })();
