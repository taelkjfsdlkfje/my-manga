const B=require('./bot2.js'); const R=B.R, H=B.H;
R("Game.state='cut'; newGame();"); H.frames(30); R("Game.script=null; Game.dlg=null; Game.state='play'; MOBS.length=0;"); H.frames(30);
for(const [dx,dz] of [[3,0],[0,3],[-3,0],[0,-3],[2,2]]){
  R(`{ const P=Player; camera.updateMatrixWorld(); const v=new THREE.Vector3(P.x+${dx},P.y+1,P.z+${dz}).project(camera); AIM.x=v.x*.5+.5; AIM.y=-v.y*.5+.5; AIM.on=true; AIM.t=performance.now(); P.atk=null; startAtk(0); }`);
  console.log('want',(Math.atan2(dz,dx)).toFixed(2),'got',R("Player.ang.toFixed(2)"),'f',R("Player.f"));
}
R("AIM.t=-1e9; AIM.click=-1e9; Player.ang=1.0; Player.atk=null; startAtk(0)"); console.log('stale mouse keeps old aim', R("Player.ang"));
console.log('errors',B.errs.length,[...new Set(B.errs)].slice(0,3));
