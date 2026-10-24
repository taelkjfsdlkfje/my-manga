const B=require('./bot2.js'); const R=B.R, H=B.H;
R("Game.state='cut'; newGame();"); H.frames(10);
console.log(R("TWS.done={}; TWS.paulDone=0; twSaveKey()"));
R("twMark('sh_twins'); twMark('al_nathan'); TWS.paulDone=1;"); const k=R("twSaveKey()"); console.log(k, R("skBits().toString(2)"));
R("TWS.done={}; TWS.paulDone=0;"); console.log('read',R(`twReadKey('${k}')`),'bad',R(`twReadKey('${k.slice(0,-1)}Z')`), R(`twReadKey('garbage')`));
console.log('applied',R(`twApplyKey(twReadKey('${k.toLowerCase()}'))`), R("JSON.stringify(Object.keys(TWS.done))"), R("TWS.paulDone"));
console.log('errors',B.errs.length,B.errs.slice(0,3));
