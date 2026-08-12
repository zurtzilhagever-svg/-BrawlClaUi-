const socket = io();
const canvas = document.querySelector("#arena"), ctx = canvas.getContext("2d");
const codeEl = document.querySelector("#room-code"), list = document.querySelector("#player-list"), count = document.querySelector("#player-count"), toast = document.querySelector("#toast");
let players = [], roomCode = "";
const characterImages = Object.fromEntries(["blaze", "tank", "spark", "medic"].map(id => { const image = new Image(); image.src = `/characters/${id}.png`; return [id, image]; }));
const motionState = new Map();
function message(text) { toast.textContent = text; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1800); }
function renderLobby() { count.textContent = `${players.length} / 8`; list.innerHTML = players.map(p => `<li class="player" style="opacity:${p.connected ? 1 : .45}"><i class="dot" style="background:${p.color}"></i>${p.name}${p.connected ? "" : " (reconnecting)"}</li>`).join(""); }
socket.on("connect", () => socket.emit("host:create", response => { if (!response.ok) return message("Could not create room"); roomCode = response.code; codeEl.textContent = roomCode; const url = `${location.origin}/mobile/?room=${roomCode}`; QRGenerator.setImage(document.querySelector("#qr"), url); }));
socket.on("game:state", next => { const previous = players.length; players = next; renderLobby(); if (next.length > previous) message("Player joined!"); });
socket.on("room:closed", () => message("Host room closed"));

function motionFor(p){const previous=motionState.get(p.id)||{x:p.x,y:p.y,phase:0},distance=Math.hypot(p.x-previous.x,p.y-previous.y),moving=p.alive&&distance>.18,phase=moving?previous.phase+distance*.42:previous.phase;motionState.set(p.id,{x:p.x,y:p.y,phase});return{moving,bob:moving?Math.sin(phase*2)*1.7:0,leg:moving?Math.sin(phase):0};}
function drawBoomerLegs(motion){const swing=motion.leg*8;ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#2b2f31";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-7,9);ctx.lineTo(-10-swing*.35,21);ctx.lineTo(-12-swing,34);ctx.moveTo(7,9);ctx.lineTo(10+swing*.35,21);ctx.lineTo(12+swing,34);ctx.stroke();ctx.strokeStyle="#6f5132";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,9);ctx.lineTo(-10-swing*.35,21);ctx.lineTo(-12-swing,34);ctx.moveTo(7,9);ctx.lineTo(10+swing*.35,21);ctx.lineTo(12+swing,34);ctx.stroke();ctx.fillStyle="#171717";ctx.beginPath();ctx.ellipse(-13-swing,36,8,3,0,0,Math.PI*2);ctx.ellipse(13+swing,36,8,3,0,0,Math.PI*2);ctx.fill();ctx.restore();}

function drawCharacter(p,motion) {
  const image = characterImages[p.character];
  if (image?.complete && image.naturalWidth) { ctx.save();ctx.translate(0,p.character==="blaze"?-12+motion.bob:0);if(p.character==="blaze"){ctx.drawImage(image,-24,-38,48,72);if(motion.moving)drawBoomerLegs(motion);}else{ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.clip();ctx.drawImage(image,-24,-24,48,48);}ctx.restore();return true; }
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

function draw() {
  const g = ctx.createLinearGradient(0, 0, 800, 600); g.addColorStop(0,"#4d837b");g.addColorStop(1,"#2e504c");ctx.fillStyle=g;ctx.fillRect(0,0,800,600);
  ctx.strokeStyle="#ffffff16";ctx.lineWidth=3;for(let x=0;x<800;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke()}for(let y=0;y<600;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke()}
  ctx.fillStyle="#223b38";ctx.fillRect(360,260,80,80);
  for(const p of players){const motion=motionFor(p);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(4,18,24,8,0,0,Math.PI*2);ctx.fill();const imageCharacter=drawCharacter(p,motion);if(!imageCharacter){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-7,-3,4,0,Math.PI*2);ctx.arc(7,-3,4,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#182038";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText(p.name,0,-31);ctx.restore()}
  requestAnimationFrame(draw);
} draw();
