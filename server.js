"use strict";
const express = require("express"), http = require("http"), os = require("os"), path = require("path"), QRCode = require("qrcode");
const { Server } = require("socket.io");
const app = express(), server = http.createServer(app), io = new Server(server, { cors: { origin: "*" } });
const PORT = Number(process.env.PORT) || 3000, RECONNECT_MS = 30_000, MAX_PLAYERS = 8;
const rooms = new Map(), socketIndex = new Map();
const COLORS = ["#ff5964", "#36c8ff", "#ffd54a", "#a875ff", "#52e084", "#ff8e4f", "#fa73bd", "#80a7ff"];
const CHARACTERS = {
  blaze: { name: "Boomer", hp: 100, speed: 4, damage: 14, range: 145, rate: 420, special: "Jet dash" },
  tank: { name: "Tank", hp: 180, speed: 2.65, damage: 24, range: 92, rate: 650, special: "Iron shield" },
  spark: { name: "Spark", hp: 82, speed: 5.1, damage: 10, range: 165, rate: 300, special: "Lightning dash" },
  medic: { name: "Medic", hp: 115, speed: 3.45, damage: 9, range: 120, rate: 440, special: "Heal pulse" },
  grunt: { name: "Grunt", hp: 70, speed: 2.35, damage: 8, range: 44, rate: 760, special: "None" }
};
const PLAYABLE_CHARACTERS = new Set(["blaze", "tank", "spark", "medic"]);
const MODES = {
  survival: { name: "Survival", objective: "Survive bot waves as long as you can", target: 0 },
  brawl: { name: "Solo Brawl", objective: "Be the last brawler alive", target: 1 },
  gems: { name: "Gem Grab", objective: "Collect 10 gems to win", target: 10 },
  showdown: { name: "Showdown", objective: "Be the last brawler alive", target: 1 },
  coins: { name: "Coin Rush", objective: "Collect 15 coins to win", target: 15 },
  zone: { name: "Zone Control", objective: "Red or Blue: hold the center for 35 seconds", target: 35 },
  soloZone: { name: "Solo Zone Control", objective: "Hold the center for 15 seconds", target: 15 }
};
const GHOST_ITEMS = ["wall", "ink", "slow", "teleport", "shareHealth"];
const GHOST_ITEM_NAMES = { wall:"Spirit Wall", ink:"Ink Blast", slow:"Chill Curse", teleport:"Warp", shareHealth:"Life Siphon" };
app.use(express.static(path.join(__dirname, "public")));
app.get("/tv", (_q, r) => r.redirect("/tv/")); app.get("/mobile", (_q, r) => r.redirect("/mobile/"));
function networkOrigins(req) {
  const host = req.get("host") || `localhost:${PORT}`;
  const port = host.includes(":") ? host.split(":").pop() : String(PORT);
  const requestOrigin = `${req.protocol}://${host}`;
  const candidates = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === "IPv4" && !item.internal).map(item => `http://${item.address}:${port}`);
  const isLocalHost = /^localhost(?::\d+)?$|^127\./.test(host);
  return { origin: isLocalHost ? candidates[0] || requestOrigin : requestOrigin, candidates };
}
app.get("/api/network", (req, res) => {
  const { origin, candidates } = networkOrigins(req);
  res.json({ origin, mobileUrl: `${origin}/mobile/`, candidates });
});
app.get("/api/qr", async (req, res) => { try { const value = String(req.query.value || "").slice(0, 2048); if (!value) throw Error(); res.type("image/svg+xml").send(await QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" })); } catch { res.status(400).json({ error: "Missing or invalid value" }); } });
function code() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let result; do result = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); while (rooms.has(result)); return result; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function randomSpot() { return { x: 90 + Math.random() * 620, y: 90 + Math.random() * 420 }; }
function makeItems(amount, type) { return Array.from({ length: amount }, () => ({ ...randomSpot(), type })); }
function gameFor(mode) { return { startedAt: Date.now(), winner: null, winnerTeam: null, items: mode === "gems" ? makeItems(12, "gem") : mode === "coins" ? makeItems(18, "coin") : [], zoneScore: { red: 0, blue: 0 }, safeRadius: 350, nextItemAt: 0, nextBotAt: 0, botSerial: 0, wave: 0 }; }
function publicPlayer(p) { return { id:p.id, name:p.name, color:p.color, team:p.team, character:p.character, characterName:CHARACTERS[p.character]?.name || p.character, bot:p.bot, x:p.x, y:p.y, health:Math.ceil(p.health), maxHealth:p.maxHealth, alive:p.alive, ghost:p.ghost, ghostItem:p.ghostItem, ghostItemName:p.ghostItem && GHOST_ITEM_NAMES[p.ghostItem], ghostPing:Date.now() < (p.pingUntil || 0), haunted:Date.now() < (p.hauntedUntil || 0), walled:Date.now() < (p.wallUntil || 0), inked:Date.now() < (p.inkUntil || 0), hit:Date.now() < (p.hitUntil || 0), score:p.score, gems:p.gems, coins:p.coins, connected:p.connected, shield:Date.now() < p.shieldUntil }; }
function players(room) { return [...room.players.values()].map(publicPlayer); }
function humanPlayers(room) { return [...room.players.values()].filter(player => !player.bot); }
function meta(room) { const mode = MODES[room.mode], survivalTime = room.mode === "survival" ? Math.floor(((room.game.endedAt || Date.now()) - room.game.startedAt) / 1000) : 0, winner = room.players.has(room.game.winner) ? publicPlayer(room.players.get(room.game.winner)) : room.game.winner, botCount = [...room.players.values()].filter(p => p.bot).length; return { mode:room.mode, modeName:mode.name, objective:mode.objective, target:mode.target, winner, winnerTeam:room.game.winnerTeam, items:room.game.items, safeRadius:room.game.safeRadius, zoneScore:room.game.zoneScore, survivalTime, wave:room.game.wave, botCount }; }
function broadcast(room) { io.to(room.code).emit("game:state", players(room)); io.to(room.code).emit("game:meta", meta(room)); }
function removePlayer(room, id) { const p = room.players.get(id); if (!p) return; clearTimeout(p.removeTimer); room.players.delete(id); broadcast(room); if (!room.players.size && !room.hostSocketId) rooms.delete(room.code); }
function createRoom(hostSocketId, mode = "brawl") { const room = { code:code(), hostSocketId, mode:MODES[mode] ? mode : "brawl", players:new Map(), game:null }; room.game = gameFor(room.mode); rooms.set(room.code, room); return room; }
function findOpenRoom(mode) {
  return [...rooms.values()].find(room => room.mode === mode && !room.game.winner && !room.game.winnerTeam && humanPlayers(room).length < MAX_PLAYERS);
}
function detachSocket(socket, nextRoomCode) {
  const ref = socketIndex.get(socket.id);
  if (!ref || ref.code === nextRoomCode) return;
  const room = rooms.get(ref.code);
  if (!room) return socketIndex.delete(socket.id);
  socket.leave(ref.code);
  removePlayer(room, ref.playerId);
  socketIndex.delete(socket.id);
}
function joinPlayer(socket, roomCode, playerId, name, character, ack) {
  const room = rooms.get(roomCode), id = String(playerId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  if (!room) return ack({ ok:false, error:"Room not found" }); if (!id) return ack({ ok:false, error:"Invalid player" });
  detachSocket(socket, roomCode);
  let p = room.players.get(id);
  if (!p && humanPlayers(room).length >= MAX_PLAYERS) return ack({ ok:false, error:"Room is full" });
  if (p) {
    clearTimeout(p.removeTimer); socketIndex.delete(p.socketId); p.socketId = socket.id; p.connected = true;
    if (PLAYABLE_CHARACTERS.has(character) && p.character !== character) {
      const ratio = p.maxHealth ? p.health / p.maxHealth : 1, stats = CHARACTERS[character];
      p.character = character; p.maxHealth = stats.hp; p.health = Math.min(stats.hp, Math.max(1, Math.round(stats.hp * ratio)));
    }
  }
  else { const c = PLAYABLE_CHARACTERS.has(character) ? character : "blaze", stats = CHARACTERS[c], spot = randomSpot(), redCount=[...room.players.values()].filter(p=>p.team==="red").length, blueCount=[...room.players.values()].filter(p=>p.team==="blue").length, team=room.mode==="zone"?(redCount<=blueCount?"red":"blue"):null; p = { id, socketId:socket.id, name:String(name || "Player").trim().slice(0, 14) || "Player", character:c, color:COLORS[room.players.size % COLORS.length], team, x:spot.x, y:spot.y, maxHealth:stats.hp, health:stats.hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false}, lastAttack:0, lastSpecial:false, shieldUntil:0, connected:true }; room.players.set(id, p); }
  socketIndex.set(socket.id, { code:roomCode, playerId:id }); socket.join(roomCode); ack({ ok:true, code:roomCode, player:publicPlayer(p), players:players(room), meta:meta(room) }); broadcast(room);
}
function end(room, winner) { if (room.game.winner || !winner) return; room.game.winner = winner.id; broadcast(room); }
function endTeam(room, team) { if (room.game.winner || room.game.winnerTeam) return; room.game.winnerTeam = team; broadcast(room); }
function kill(room, victim, killer) {
  if (!victim.alive) return; victim.alive = false; victim.health = 0; victim.diedAt = Date.now();
  if (victim.bot) {
    if (killer && killer.id !== victim.id) {
      killer.score += 1;
      if (room.mode === "survival" && !killer.bot && killer.alive) killer.health = Math.min(killer.maxHealth, killer.health + 6);
    }
    room.players.delete(victim.id);
    return;
  }
  victim.ghost = room.mode === "brawl" || room.mode === "showdown";
  victim.ghostItem = false;
  victim.nextGhostItemAt = victim.ghost ? victim.diedAt + 30_000 : 0;
  if (killer && killer.id !== victim.id) killer.score += 1;
  if (room.mode === "gems" && victim.gems) { for (let i=0;i<victim.gems;i++) room.game.items.push({ x:clamp(victim.x+(Math.random()-.5)*45,25,775), y:clamp(victim.y+(Math.random()-.5)*45,25,575), type:"gem" }); victim.gems=0; }
  if (room.mode === "showdown" || room.mode === "brawl") { const alive = [...room.players.values()].filter(p => p.alive); if (alive.length === 1) end(room, alive[0]); }
  if (room.mode === "survival" && ![...room.players.values()].some(p => !p.bot && p.alive)) { room.game.winner = "survival-ended"; room.game.endedAt = Date.now(); }
}
function attack(room, attacker, now) {
  const stats = CHARACTERS[attacker.character]; if (now - attacker.lastAttack < stats.rate) return; attacker.lastAttack = now;
  let victim, distance = Infinity; for (const p of room.players.values()) { const d=Math.hypot(p.x-attacker.x,p.y-attacker.y); if (p.id!==attacker.id && p.alive && p.connected && !(room.mode==="zone" && p.team===attacker.team) && !(room.mode==="survival" && Boolean(p.bot)===Boolean(attacker.bot)) && d < distance) { victim=p; distance=d; } }
  if (!victim || distance > stats.range) return; const damage = stats.damage * (now < victim.shieldUntil ? .35 : 1); victim.health -= damage; victim.hitUntil = now + 150; if (victim.health <= 0) kill(room, victim, attacker);
}
function special(room, p, now) { if (p.lastSpecial || now - (p.lastSpecialAt || 0) < 6000) return; p.lastSpecialAt = now; const stats = CHARACTERS[p.character]; if (p.character === "tank") p.shieldUntil = now + 2600; else if (p.character === "medic") p.health = Math.min(stats.hp, p.health + 42); else { const len=Math.hypot(p.input.x,p.input.y)||1; p.x=clamp(p.x+p.input.x/len*105,28,772); p.y=clamp(p.y+p.input.y/len*105,28,572); } }
function spawnBot(room, now) {
  const count = [...room.players.values()].filter(p => p.bot).length;
  const cap = Math.min(9, 2 + Math.floor(room.game.wave / 2));
  if (count >= cap) return;
  const edge = Math.floor(Math.random() * 4), spot = edge === 0 ? { x: 30, y: 80 + Math.random() * 440 } : edge === 1 ? { x: 770, y: 80 + Math.random() * 440 } : edge === 2 ? { x: 90 + Math.random() * 620, y: 30 } : { x: 90 + Math.random() * 620, y: 570 };
  const hp = CHARACTERS.grunt.hp + Math.min(45, room.game.wave * 3), id = `bot-${room.code}-${room.game.botSerial++}`;
  room.players.set(id, { id, socketId:null, name:`Bot ${room.game.botSerial}`, character:"grunt", bot:true, color:"#f07167", team:null, x:spot.x, y:spot.y, maxHealth:hp, health:hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false}, lastAttack:0, lastSpecial:false, shieldUntil:0, connected:true });
  room.game.nextBotAt = now + Math.max(900, 2300 - room.game.wave * 95);
}
function updateSurvival(room, now) {
  room.game.wave = Math.floor((now - room.game.startedAt) / 15000) + 1;
  if (now >= room.game.nextBotAt) spawnBot(room, now);
  const humans = [...room.players.values()].filter(p => !p.bot && p.alive);
  for (const bot of [...room.players.values()].filter(p => p.bot && p.alive)) {
    let target = null, distance = Infinity;
    for (const human of humans) { const d = Math.hypot(human.x - bot.x, human.y - bot.y); if (d < distance) { target = human; distance = d; } }
    if (!target) { bot.input = { x:0, y:0, attack:false, special:false }; continue; }
    const len = Math.hypot(target.x - bot.x, target.y - bot.y) || 1;
    bot.input.x = (target.x - bot.x) / len;
    bot.input.y = (target.y - bot.y) / len;
    bot.input.attack = distance < CHARACTERS[bot.character].range;
  }
}
function updateRoom(room, now) {
  if (room.game.winner || room.game.winnerTeam) return;
  if (room.mode === "survival") updateSurvival(room, now);
  if (room.mode === "showdown") room.game.safeRadius = Math.max(80, 350 - (now-room.game.startedAt)/420);
  for (const p of room.players.values()) {
    if (!p.connected) continue;
    if (!p.alive && p.ghost) {
      // Dead players remain as non-combat ghosts. SPECIAL becomes a visible warning ping.
      const ghostSpeed = CHARACTERS[p.character].speed * .72;
      p.x=clamp(p.x+p.input.x*ghostSpeed,28,772); p.y=clamp(p.y+p.input.y*ghostSpeed,28,572);
      if (now >= p.nextGhostItemAt) { p.ghostItem = GHOST_ITEMS[Math.floor(Math.random()*GHOST_ITEMS.length)]; p.nextGhostItemAt = now + 30_000; }
      if (p.input.special && !p.lastSpecial) {
        const target = room.players.get(p.ghostTargetId);
        if (p.ghostItem && target?.alive) {
          const item = p.ghostItem; p.ghostItem = false;
          if (item === "wall") target.wallUntil = now + 3_000;
          if (item === "ink") target.inkUntil = now + 2_700;
          if (item === "slow") target.hauntedUntil = now + 4_000;
          if (item === "teleport") { const spot=randomSpot(); target.x=spot.x; target.y=spot.y; }
          if (item === "shareHealth") { const amount=Math.min(34,Math.max(0,target.health-1)); const others=[...room.players.values()].filter(other=>other.alive&&other.id!==target.id); target.health-=amount; for(const other of others) other.health=Math.min(other.maxHealth,other.health+amount/Math.max(1,others.length)); }
        }
        else p.pingUntil = now + 1200;
      }
      p.lastSpecial = p.input.special;
      continue;
    }
    if (!p.alive) { // Non-elimination modes keep their fast respawn behavior.
      if (now-p.diedAt > 2200) { const spot=randomSpot(), s=CHARACTERS[p.character]; Object.assign(p,{x:spot.x,y:spot.y,health:s.hp,alive:true,ghost:false}); }
      continue;
    }
    const stats=CHARACTERS[p.character], moveScale=now < (p.wallUntil||0) ? 0 : now < (p.hauntedUntil||0) ? .58 : 1;
    p.x=clamp(p.x+p.input.x*stats.speed*moveScale,28,772); p.y=clamp(p.y+p.input.y*stats.speed*moveScale,28,572);
    if (p.input.attack) attack(room,p,now); if (p.input.special) special(room,p,now); p.lastSpecial=p.input.special;
    if (room.mode === "showdown" && Math.hypot(p.x-400,p.y-300) > room.game.safeRadius) { p.health -= .55; if (p.health<=0) kill(room,p,null); }
    for (let i=room.game.items.length-1;i>=0;i--) { const item=room.game.items[i]; if (Math.hypot(item.x-p.x,item.y-p.y)<32) { room.game.items.splice(i,1); if(item.type==="gem")p.gems++; else p.coins++; } }
    if ((room.mode === "gems" && p.gems >= 10) || (room.mode === "coins" && p.coins >= 15)) end(room,p);
    if (room.mode === "soloZone" && Math.hypot(p.x-400,p.y-300)<70) { room.game.zoneScore[p.id]=(room.game.zoneScore[p.id]||0)+1/30; if(room.game.zoneScore[p.id]>=15) end(room,p); }
  }
  if (room.mode === "zone") {
    const inside = [...room.players.values()].filter(p=>p.alive&&Math.hypot(p.x-400,p.y-300)<70);
    const red = inside.some(p=>p.team==="red"), blue = inside.some(p=>p.team==="blue");
    if (red !== blue) room.game.zoneScore[red?"red":"blue"] += 1/30;
    if (room.game.zoneScore.red >= 35) endTeam(room,"red");
    if (room.game.zoneScore.blue >= 35) endTeam(room,"blue");
  }
  if ((room.mode==="gems"||room.mode==="coins") && room.game.items.length<10 && now>room.game.nextItemAt) { room.game.items.push({ ...randomSpot(), type:room.mode==="gems"?"gem":"coin" }); room.game.nextItemAt=now+700; }
  broadcast(room);
}
io.on("connection", socket => {
  socket.on("host:create", (data={}, ack=()=>{}) => { if (typeof data === "function") { ack=data; data={}; } const room=createRoom(socket.id,data.mode); socket.join(room.code); socket.data.hostRoom=room.code; ack({ok:true,code:room.code,players:[],meta:meta(room)}); });
  socket.on("player:create", ({playerId,name,character,mode}={}, ack=()=>{}) => { const room=createRoom(null,mode); joinPlayer(socket,room.code,playerId,name,character,ack); });
  socket.on("player:autoJoin", ({playerId,name,character,mode}={}, ack=()=>{}) => { const selectedMode=MODES[mode]?mode:"survival", room=findOpenRoom(selectedMode)||createRoom(null,selectedMode); joinPlayer(socket,room.code,playerId,name,character,ack); });
  socket.on("player:join", ({code:roomCode,playerId,name,character}={}, ack=()=>{}) => joinPlayer(socket,String(roomCode||"").trim().toUpperCase(),playerId,name,character,ack));
  socket.on("player:input", payload => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), p=room&&room.players.get(ref.playerId); if(!p||!Array.isArray(payload))return; p.input={x:clamp(Number(payload[0])||0,-1,1),y:clamp(Number(payload[1])||0,-1,1),attack:Boolean(payload[2]),special:Boolean(payload[3])}; });
  socket.on("ghost:target", ({ targetId } = {}) => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), ghost=room&&room.players.get(ref.playerId), target=room&&room.players.get(String(targetId||"")); if (!ghost?.ghost || !target?.alive || ghost.id===target.id) return; ghost.ghostTargetId=target.id; });
  socket.on("disconnect", () => { const host=socket.data.hostRoom; if(host&&rooms.get(host)?.hostSocketId===socket.id){io.to(host).emit("room:closed");rooms.delete(host);} const ref=socketIndex.get(socket.id);socketIndex.delete(socket.id);const room=ref&&rooms.get(ref.code),p=room&&room.players.get(ref.playerId);if(p&&p.socketId===socket.id){p.connected=false;p.input={x:0,y:0,attack:false,special:false};p.removeTimer=setTimeout(()=>removePlayer(room,ref.playerId),RECONNECT_MS);broadcast(room);} });
});
setInterval(()=>{const now=Date.now();for(const room of rooms.values())updateRoom(room,now);},1000/30);
server.listen(PORT,()=>console.log(`CouchBrawl running at http://localhost:${PORT}/play/`));
