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
  if (image?.complete && image.naturalWidth) { ctx.save();ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.clip();ctx.drawImage(image,-24,-24,48,48);ctx.restore();return true; }
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
function drawBush(bush,now){const sway=Math.sin(now/900+bush.x*.017+bush.y*.011)*2,leafCount=Math.max(8,Math.floor((bush.w+bush.h)/22));ctx.save();ctx.translate(0,sway);ctx.fillStyle="#00000024";roundRect(bush.x+6,bush.y+9,bush.w,bush.h,18);ctx.fill();const body=ctx.createLinearGradient(bush.x,bush.y,bush.x,bush.y+bush.h);body.addColorStop(0,"#3fad56");body.addColorStop(.58,"#287849");body.addColorStop(1,"#1b5538");ctx.fillStyle=body;roundRect(bush.x,bush.y,bush.w,bush.h,20);ctx.fill();for(let i=0;i<leafCount;i++){const t=(i+.5)/leafCount,x=bush.x+12+(bush.w-24)*((Math.sin(i*2.37+bush.x*.03)+1)/2),y=bush.y+10+(bush.h-20)*t,rx=14+Math.sin(i*1.7+bush.y)*4,ry=8+Math.cos(i*1.3+bush.x)*3;ctx.fillStyle=i%3===0?"#5ed36eaa":i%3===1?"#2f9657bb":"#76df7f88";ctx.beginPath();ctx.ellipse(x,y,rx,ry,Math.sin(i)*.55,0,Math.PI*2);ctx.fill()}ctx.strokeStyle="#153a2a88";ctx.lineWidth=3;roundRect(bush.x+2,bush.y+2,bush.w-4,bush.h-4,18);ctx.stroke();ctx.strokeStyle="#9bf58a55";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bush.x+18,bush.y+14);ctx.quadraticCurveTo(bush.x+bush.w*.45,bush.y+4,bush.x+bush.w-18,bush.y+18);ctx.stroke();ctx.restore();}
function drawArena(now){
  const arena=gameMeta.arena||{width:1200,height:900,zoneRadius:95,obstacles:[],bushes:[]};
  if(canvas.width!==arena.width||canvas.height!==arena.height){canvas.width=arena.width;canvas.height=arena.height}
  const centerX=arena.width/2,centerY=arena.height/2;
  const g=ctx.createLinearGradient(0,0,arena.width,arena.height);g.addColorStop(0,"#5f986f");g.addColorStop(.56,"#47765e");g.addColorStop(1,"#315b54");ctx.fillStyle=g;ctx.fillRect(0,0,arena.width,arena.height);
  ctx.fillStyle="#45685b";ctx.fillRect(0,centerY-54,arena.width,108);ctx.fillRect(centerX-54,0,108,arena.height);
  ctx.strokeStyle="#ffffff13";ctx.lineWidth=2;for(let x=40;x<arena.width;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,arena.height);ctx.stroke()}for(let y=40;y<arena.height;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(arena.width,y);ctx.stroke()}
  for(const bush of arena.bushes||[])drawBush(bush,now);
  for(const block of arena.obstacles||[]){ctx.fillStyle="#00000024";roundRect(block.x+5,block.y+8,block.w,block.h,8);ctx.fill();const bg=ctx.createLinearGradient(block.x,block.y,block.x,block.y+block.h);bg.addColorStop(0,block.kind==="crate"?"#bd8751":"#9aa3a0");bg.addColorStop(1,block.kind==="crate"?"#7b5131":"#59615f");ctx.fillStyle=bg;roundRect(block.x,block.y,block.w,block.h,8);ctx.fill();ctx.strokeStyle="#ffffff35";ctx.lineWidth=2;roundRect(block.x+3,block.y+3,block.w-6,block.h-6,6);ctx.stroke()}
  if(gameMeta.mode==="zone"||gameMeta.mode==="soloZone"){ctx.fillStyle="#75d8ff22";ctx.strokeStyle="#75d8ffcc";ctx.lineWidth=5;ctx.beginPath();ctx.arc(centerX,centerY,arena.zoneRadius||95,0,Math.PI*2);ctx.fill();ctx.stroke()}
  if(gameMeta.mode==="showdown"){ctx.strokeStyle="#ff6978cc";ctx.lineWidth=8;ctx.beginPath();ctx.arc(centerX,centerY,gameMeta.safeRadius||Math.min(arena.width,arena.height)*.58,0,Math.PI*2);ctx.stroke()}
}

function drawProjectile(projectile,now){const angle=Math.atan2(projectile.vy,projectile.vx);ctx.save();ctx.translate(projectile.x,projectile.y);ctx.rotate(angle);ctx.fillStyle="#00000035";ctx.beginPath();ctx.ellipse(-3,9,14,4,0,0,Math.PI*2);ctx.fill();if(projectile.type==="boomerang"){ctx.rotate(now/95);ctx.strokeStyle=projectile.returning?"#8ff0ff":"#ffd15c";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.arc(0,0,16,-2.35,-.25);ctx.stroke();ctx.beginPath();ctx.arc(0,0,16,.75,2.85);ctx.stroke();ctx.fillStyle="#ffffffcc";ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill()}else if(projectile.type==="rocket"){const flicker=Math.sin(now/55+projectile.x)*2;ctx.fillStyle="#ff7b35";ctx.beginPath();ctx.moveTo(-18-flicker,0);ctx.lineTo(-30-flicker,-7);ctx.lineTo(-26-flicker,0);ctx.lineTo(-30-flicker,7);ctx.closePath();ctx.fill();ctx.fillStyle="#f4f0df";roundRect(-18,-7,28,14,6);ctx.fill();ctx.fillStyle=projectile.color||"#ff5964";ctx.beginPath();ctx.moveTo(10,-7);ctx.lineTo(24,0);ctx.lineTo(10,7);ctx.closePath();ctx.fill();ctx.fillStyle="#314057";ctx.fillRect(-7,-10,7,20)}else{ctx.fillStyle=projectile.color||"#ffd761";ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffffffaa";ctx.lineWidth=2;ctx.stroke()}ctx.restore();}

function draw() {
  const now=performance.now();drawArena(now);
  for(const projectile of gameMeta.projectiles||[])drawProjectile(projectile,now);
  for(const p of players){const motion=motionFor(p);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(4,18,24,8,0,0,Math.PI*2);ctx.fill();const imageCharacter=drawCharacter(p,motion);if(!imageCharacter){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-7,-3,4,0,Math.PI*2);ctx.arc(7,-3,4,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#182038";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText(p.name,0,-31);ctx.restore()}
  requestAnimationFrame(draw);
} draw();
