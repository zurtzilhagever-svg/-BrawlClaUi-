const socket = io();
const canvas = document.querySelector("#arena"), ctx = canvas.getContext("2d");
const codeEl = document.querySelector("#room-code"), list = document.querySelector("#player-list"), count = document.querySelector("#player-count"), toast = document.querySelector("#toast");
let players = [], roomCode = "";
let gameMeta = { arena: { obstacles: [], bushes: [] } };
const characterImages = Object.fromEntries(["blaze", "tank", "spark", "medic"].map(id => { const image = new Image(); image.src = `/characters/${id}.png`; return [id, image]; }));
const motionState = new Map();
function message(text) { toast.textContent = text; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1800); }
function renderLobby() { count.textContent = `${players.length} / 8`; list.innerHTML = players.map(p => `<li class="player" style="opacity:${p.connected ? 1 : .45}"><i class="dot" style="background:${p.color}"></i>${p.name}${p.connected ? "" : " (reconnecting)"}</li>`).join(""); }
socket.on("connect", () => socket.emit("host:create", response => { if (!response.ok) return message("Could not create room"); roomCode = response.code; gameMeta=response.meta||gameMeta; codeEl.textContent = roomCode; const url = `${location.origin}/mobile/?room=${roomCode}`; QRGenerator.setImage(document.querySelector("#qr"), url); }));
socket.on("game:state", next => { const previous = players.length; players = next; renderLobby(); if (next.length > previous) message("Player joined!"); });
socket.on("game:meta", next => { gameMeta = next || gameMeta; });
socket.on("room:closed", () => message("Host room closed"));

function motionFor(p){const previous=motionState.get(p.id)||{x:p.x,y:p.y,phase:0},distance=Math.hypot(p.x-previous.x,p.y-previous.y),moving=p.alive&&distance>.18,phase=moving?previous.phase+distance*.42:previous.phase;motionState.set(p.id,{x:p.x,y:p.y,phase});return{moving,bob:moving?Math.sin(phase*2)*1.7:0,leg:moving?Math.sin(phase):0};}

function drawCharacter(p,motion) {
  const image = characterImages[p.character];
  if (image?.complete && image.naturalWidth) { ctx.save();ctx.translate(0,p.character==="blaze"?-14+motion.bob*.35:0);if(p.character==="blaze"){ctx.drawImage(image,-25,-40,50,76);}else{ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.clip();ctx.drawImage(image,-24,-24,48,48);}ctx.restore();return true; }
  ctx.fillStyle = p.ghost ? "#b8d9ff" : p.color; ctx.beginPath();
  if (p.character === "tank") ctx.rect(-23,-22,46,42);
  else if (p.character === "spark") { ctx.moveTo(0,-27);ctx.lineTo(24,0);ctx.lineTo(0,27);ctx.lineTo(-24,0);ctx.closePath(); }
  else if (p.character === "medic") ctx.arc(0,0,22,0,Math.PI*2);
  else if (p.character === "grunt") ctx.arc(0,0,17,0,Math.PI*2);
  else { ctx.moveTo(0,-28);ctx.bezierCurveTo(28,-4,18,25,0,25);ctx.bezierCurveTo(-18,25,-28,-4,0,-28); }
  ctx.fill();
  if (p.character === "tank") { ctx.fillStyle="#dce7f2";ctx.fillRect(-12,-7,24,8); }
  else if (p.character === "spark") { ctx.strokeStyle="#fff176";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-4,-14);ctx.lineTo(7,-2);ctx.lineTo(-2,0);ctx.lineTo(8,15);ctx.stroke(); }
  else if (p.character === "medic") { ctx.fillStyle="#fff";ctx.fillRect(-4,-14,8,28);ctx.fillRect(-14,-4,28,8); }
  return false;
}

function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function drawArena(now){
  const arena=gameMeta.arena||{obstacles:[],bushes:[]};
  const g=ctx.createLinearGradient(0,0,800,600);g.addColorStop(0,"#5f986f");g.addColorStop(.56,"#47765e");g.addColorStop(1,"#315b54");ctx.fillStyle=g;ctx.fillRect(0,0,800,600);
  ctx.fillStyle="#45685b";ctx.fillRect(0,258,800,84);ctx.fillRect(358,0,84,600);
  ctx.strokeStyle="#ffffff13";ctx.lineWidth=2;for(let x=40;x<800;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke()}for(let y=40;y<600;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke()}
  for(const bush of arena.bushes||[]){ctx.fillStyle="#286f46cc";roundRect(bush.x,bush.y+Math.sin(now/650+bush.x*.01)*2,bush.w,bush.h,18);ctx.fill();ctx.fillStyle="#55b86c88";for(let x=bush.x+14;x<bush.x+bush.w-8;x+=24){ctx.beginPath();ctx.arc(x,bush.y+bush.h/2+Math.sin(now/500+x)*4,16,0,Math.PI*2);ctx.fill()}}
  for(const block of arena.obstacles||[]){ctx.fillStyle="#00000024";roundRect(block.x+5,block.y+8,block.w,block.h,8);ctx.fill();const bg=ctx.createLinearGradient(block.x,block.y,block.x,block.y+block.h);bg.addColorStop(0,block.kind==="crate"?"#bd8751":"#9aa3a0");bg.addColorStop(1,block.kind==="crate"?"#7b5131":"#59615f");ctx.fillStyle=bg;roundRect(block.x,block.y,block.w,block.h,8);ctx.fill();ctx.strokeStyle="#ffffff35";ctx.lineWidth=2;roundRect(block.x+3,block.y+3,block.w-6,block.h-6,6);ctx.stroke()}
  if(gameMeta.mode==="zone"||gameMeta.mode==="soloZone"){ctx.fillStyle="#75d8ff22";ctx.strokeStyle="#75d8ffcc";ctx.lineWidth=5;ctx.beginPath();ctx.arc(400,300,70,0,Math.PI*2);ctx.fill();ctx.stroke()}
  if(gameMeta.mode==="showdown"){ctx.strokeStyle="#ff6978cc";ctx.lineWidth=8;ctx.beginPath();ctx.arc(400,300,gameMeta.safeRadius||350,0,Math.PI*2);ctx.stroke()}
}

function draw() {
  const now=performance.now();drawArena(now);
  for(const p of players){const motion=motionFor(p);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(4,18,24,8,0,0,Math.PI*2);ctx.fill();const imageCharacter=drawCharacter(p,motion);if(!imageCharacter){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-7,-3,4,0,Math.PI*2);ctx.arc(7,-3,4,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#182038";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText(p.name,0,-31);ctx.restore()}
  requestAnimationFrame(draw);
} draw();
