"use strict";
/* ============ net: two-player co-op over WebRTC (PeerJS), host-authoritative ============
   ?net=local swaps in a BroadcastChannel transport so two tabs in one browser can test co-op. */
const NET={role:'solo',code:null,peer:null,tr:null,onMsg:null,onClose:null,lastRx:0};
const ROOM_PREFIX='latentsector-v2-';
const LOCAL_NET=new URLSearchParams(location.search).get('net')==='local';
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.floor(Math.random()*A.length)];return s;}
function netSend(o){if(NET.tr)try{NET.tr.send(o);}catch(e){}}
function attachTransport(tr){NET.tr=tr;NET.lastRx=performance.now();}
function dropTransport(){const had=!!NET.tr;NET.tr=null;if(had&&NET.onClose)NET.onClose();}

/* local (same-browser) transport for testing */
function localChannel(code,role){
  const bc=new BroadcastChannel('lsnet-'+code);const me=Math.random().toString(36).slice(2);
  const tr={send:o=>bc.postMessage({from:me,d:o}),close:()=>{try{bc.postMessage({from:me,d:{t:'__bye'}});}catch(e){}bc.close();}};
  bc.onmessage=ev=>{const m=ev.data;if(m.from===me)return;const d=m.d;NET.lastRx=performance.now();
    if(d.t==='__hello'&&role==='host'){if(NET.tr)return;attachTransport(tr);tr.send({t:'__ack'});NET.onConnect&&NET.onConnect();return;}
    if(d.t==='__ack'&&role==='guest'){if(NET.tr)return;attachTransport(tr);NET.onConnect&&NET.onConnect();return;}
    if(d.t==='__bye'){dropTransport();return;}
    if(NET.tr&&NET.onMsg)NET.onMsg(d);};
  addEventListener('pagehide',()=>tr.close());
  return {bc,tr};
}

function hostRoom(cb){
  NET.role='host';
  const tryOpen=()=>{
    const code=genCode();NET.code=code;
    if(LOCAL_NET){localChannel(code,'host');setTimeout(()=>cb.ready(code),50);return;}
    if(typeof Peer==='undefined'){cb.error('The co-op library failed to load. Reload the page to try again.');return;}
    const peer=new Peer(ROOM_PREFIX+code,{debug:1});NET.peer=peer;
    peer.on('open',()=>cb.ready(code));
    peer.on('connection',conn=>{
      if(NET.tr){conn.on('open',()=>{conn.send({t:'full'});setTimeout(()=>conn.close(),400);});return;}
      conn.on('open',()=>{attachTransport({send:o=>conn.open&&conn.send(o),close:()=>conn.close()});NET.onConnect&&NET.onConnect();});
      conn.on('data',d=>{NET.lastRx=performance.now();NET.onMsg&&NET.onMsg(d);});
      conn.on('close',()=>{if(NET.tr)dropTransport();});
      conn.on('error',()=>{});
    });
    peer.on('error',err=>{if(err.type==='unavailable-id'){peer.destroy();tryOpen();return;}
      if(err.type==='network'||err.type==='server-error'||err.type==='socket-error')cb.error('Lost contact with the matchmaking server. Your partner may not be able to join.');});
    peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  };
  tryOpen();
}
function joinRoom(code,cb){
  NET.role='guest';NET.code=code;
  if(LOCAL_NET){const {tr}=localChannel(code,'guest');NET.onConnect=cb.connected;tr.send({t:'__hello'});
    const iv=setInterval(()=>{if(NET.tr){clearInterval(iv);return;}tr.send({t:'__hello'});},500);
    setTimeout(()=>{if(!NET.tr){clearInterval(iv);cb.error('No host answered in room '+code+'.');}},8000);return;}
  if(typeof Peer==='undefined'){cb.error('The co-op library failed to load. Reload the page to try again.');return;}
  const peer=new Peer({debug:1});NET.peer=peer;let done=false;
  const to=setTimeout(()=>{if(!done)cb.error('Could not reach room '+code+'. Check the code, or ask your partner to host again.');},15000);
  peer.on('open',()=>{
    const conn=peer.connect(ROOM_PREFIX+code,{reliable:true,serialization:'json'});
    conn.on('open',()=>{done=true;clearTimeout(to);attachTransport({send:o=>conn.open&&conn.send(o),close:()=>conn.close()});cb.connected();});
    conn.on('data',d=>{NET.lastRx=performance.now();if(d&&d.t==='full'){cb.error('That room already has two inspectors.');return;}NET.onMsg&&NET.onMsg(d);});
    conn.on('close',()=>{if(NET.tr)dropTransport();});
  });
  peer.on('error',err=>{if(err.type==='peer-unavailable'){done=true;clearTimeout(to);cb.error('Room '+code+' was not found. It may have closed.');}
    else if(!done&&(err.type==='network'||err.type==='server-error'||err.type==='socket-error'||err.type==='browser-incompatible')){done=true;clearTimeout(to);cb.error('Could not reach the matchmaking server ('+err.type+').');}});
}
function inviteLink(code){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('join',code);if(LOCAL_NET)u.searchParams.set('net','local');return u.toString();}
