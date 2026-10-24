const B=require('./bot2.js'); const R=B.R, H=B.H;
R("Game.state='cut'; newGame();"); H.frames(10); R("SHA.ok=true; SHA.pok=true; SHA.img={width:576}; SHA.pimg={width:168};");
const anims=['idle','run','jump','fall','glide','dash','attack','charge','beam','block','hurt','dead','pray',undefined];
R(`globalThis.__c=0; const [cv,c]=mkCanvas(64,64); for(const a of ${JSON.stringify(anims)}) for(const f of [1,-1]) for(let ap=0;ap<=1;ap+=.25){ SHA.drawn=false; drawShayanHD(c,32,62,f,{t:ap*3,anim:a,ap}); if(SHA.drawn) __c++; }
  Player.t=1; for(let k=0;k<16;k++){ Player.ang=k*Math.PI/8; Player.anim='run'; drawShayanHD(c,32,62,1,{t:Player.t,anim:'run'}); }`);
console.log('frames drawn',R("__c"),'portraits',R("[portrait('shayan','normal').width,portrait('shayan','angry').width,portrait('shayan','blush').width,portrait('shayan','happy')===portrait('shayan','normal')].join(',')"));
console.log('dirs',R("[0,1,2,3,4,5,6,7].map(k=>shDirIdx(k*Math.PI/4)).join(',')"));
H.frames(120); console.log('pSprite scale',R("pSprite&&pSprite.mesh.scale.x"),'errors',B.errs.length,B.errs.slice(0,3));
