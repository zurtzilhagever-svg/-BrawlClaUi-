"use strict";
const express = require("express"), http = require("http"), os = require("os"), path = require("path"), QRCode = require("qrcode");
const { Server } = require("socket.io");
const app = express(), server = http.createServer(app), io = new Server(server, { cors: { origin: "*" } });
const PORT = Number(process.env.PORT) || 3000, RECONNECT_MS = 30_000, MAX_PLAYERS = 8, SPECIAL_HITS = 5, PROJECTILE_SPEED = 12;
const rooms = new Map(), socketIndex = new Map();
const survivalLeaders = [];
const COLORS = ["#ff5964", "#36c8ff", "#ffd54a", "#a875ff", "#52e084", "#ff8e4f", "#fa73bd", "#80a7ff"];
const CHARACTERS = {
  blaze: { name: "\u05d1\u05d5\u05d1", hp: 100, speed: 4, damage: 14, range: 145, rate: 420, special: "Cardboard blast" },
  boomer: { name: "\u05d1\u05d5\u05de\u05e8", hp: 100, speed: 4, damage: 14, range: 145, rate: 420, special: "Jet dash" },
  tank: { name: "\u05d0\u05d5\u05e8\u05e8\u05d4", hp: 180, speed: 2.65, damage: 24, range: 92, rate: 650, special: "Ice shield" },
  spark: { name: "Spark", hp: 82, speed: 5.1, damage: 10, range: 165, rate: 300, special: "Lightning dash" },
  medic: { name: "Medic", hp: 115, speed: 3.45, damage: 9, range: 120, rate: 440, special: "Heal pulse" },
  grunt: { name: "Grunt", hp: 70, speed: 2.35, damage: 8, range: 44, rate: 760, special: "None" }
};
const PLAYABLE_CHARACTERS = new Set(["blaze", "boomer", "tank", "spark", "medic"]);
const MODES = {
  survival: { name: "Survival", objective: "Survive bot waves as long as you can", target: 0 },
  brawl: { name: "Solo Brawl", objective: "Be the last brawler alive", target: 1 },
  gems: { name: "Gem Grab", objective: "Collect 10 gems to win", target: 10 },
  showdown: { name: "Showdown", objective: "Be the last brawler alive", target: 1 },
  coins: { name: "Coin Rush", objective: "Collect 15 coins to win", target: 15 },
  zone: { name: "Zone Control", objective: "Red or Blue: hold the center for 35 seconds", target: 35 },
  soloZone: { name: "Solo Zone Control", objective: "Hold the center for 15 seconds", target: 15 }
};
const ARENA = {
  width: 1200,
  height: 900,
  zoneRadius: 95,
  obstacles: [
    { x: 132, y: 146, w: 138, h: 58, kind: "stone" },
    { x: 930, y: 146, w: 138, h: 58, kind: "stone" },
    { x: 132, y: 696, w: 138, h: 58, kind: "stone" },
    { x: 930, y: 696, w: 138, h: 58, kind: "stone" },
    { x: 430, y: 106, w: 340, h: 40, kind: "stone" },
    { x: 430, y: 754, w: 340, h: 40, kind: "stone" },
    { x: 170, y: 386, w: 168, h: 46, kind: "stone" },
    { x: 862, y: 468, w: 168, h: 46, kind: "stone" },
    { x: 366, y: 342, w: 82, h: 154, kind: "crate" },
    { x: 752, y: 404, w: 82, h: 154, kind: "crate" },
    { x: 548, y: 270, w: 104, h: 54, kind: "crate" },
    { x: 548, y: 576, w: 104, h: 54, kind: "crate" }
  ],
  bushes: [
    { x: 318, y: 176, w: 160, h: 66 },
    { x: 722, y: 176, w: 160, h: 66 },
    { x: 318, y: 658, w: 160, h: 66 },
    { x: 722, y: 658, w: 160, h: 66 },
    { x: 128, y: 286, w: 134, h: 72 },
    { x: 938, y: 542, w: 134, h: 72 },
    { x: 536, y: 386, w: 128, h: 128 }
  ],
  spawnPoints: [
    { x: 92, y: 92 }, { x: 1108, y: 92 }, { x: 92, y: 808 }, { x: 1108, y: 808 },
    { x: 262, y: 450 }, { x: 938, y: 450 }, { x: 600, y: 205 }, { x: 600, y: 695 },
    { x: 410, y: 284 }, { x: 790, y: 616 }
  ]
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
function arenaCenter() { return { x:ARENA.width / 2, y:ARENA.height / 2 }; }
function arenaSafeRadius() { return Math.min(ARENA.width, ARENA.height) * .58; }
function intersectsRect(x, y, radius, rect) { const cx=clamp(x,rect.x,rect.x+rect.w), cy=clamp(y,rect.y,rect.y+rect.h); return Math.hypot(x-cx,y-cy) < radius; }
function blocked(x, y, radius = 24) { return ARENA.obstacles.some(rect => intersectsRect(x, y, radius, rect)); }
function randomSpot() {
  for (let i=0;i<70;i++) {
    const base = i < ARENA.spawnPoints.length ? ARENA.spawnPoints[Math.floor(Math.random()*ARENA.spawnPoints.length)] : { x:90+Math.random()*(ARENA.width-180), y:90+Math.random()*(ARENA.height-180) };
    const spot = { x:clamp(base.x+(Math.random()-.5)*64,35,ARENA.width-35), y:clamp(base.y+(Math.random()-.5)*64,35,ARENA.height-35) };
    if (!blocked(spot.x, spot.y, 28)) return spot;
  }
  return arenaCenter();
}
function makeItems(amount, type) { return Array.from({ length: amount }, () => ({ ...randomSpot(), type })); }
function gameFor(mode) { return { startedAt: Date.now(), winner: null, winnerTeam: null, items: mode === "gems" ? makeItems(12, "gem") : mode === "coins" ? makeItems(18, "coin") : [], projectiles: [], nextProjectileId: 0, zoneScore: { red: 0, blue: 0 }, safeRadius: arenaSafeRadius(), nextItemAt: 0, nextBotAt: 0, botSerial: 0, wave: 0 }; }
function playerRadius(p) { return p.character === "tank" ? 26 : p.character === "grunt" ? 18 : 23; }
function movePlayer(p, dx, dy) {
  const radius = playerRadius(p);
  const nextX = clamp(p.x + dx, 28, ARENA.width - 28);
  if (!blocked(nextX, p.y, radius)) p.x = nextX;
  const nextY = clamp(p.y + dy, 28, ARENA.height - 28);
  if (!blocked(p.x, nextY, radius)) p.y = nextY;
}
function dashPlayer(p, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 18));
  for (let i=0;i<steps;i++) movePlayer(p, dx / steps, dy / steps);
}
function lineBlocked(x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2-x1, y2-y1) / 12);
  for (let i=1;i<steps;i++) {
    const t = i / steps;
    if (blocked(x1+(x2-x1)*t, y1+(y2-y1)*t, 8)) return true;
  }
  return false;
}
function aimDirection(p) {
  const x = Number.isFinite(p.aimX) ? p.aimX : p.input.x;
  const y = Number.isFinite(p.aimY) ? p.aimY : p.input.y;
  const len = Math.hypot(x, y);
  return len > .01 ? { x:x/len, y:y/len } : { x:1, y:0 };
}
function publicPlayer(p) { return { id:p.id, name:p.name, color:p.color, team:p.team, character:p.character, characterName:CHARACTERS[p.character]?.name || p.character, bot:p.bot, x:p.x, y:p.y, health:Math.ceil(p.health), maxHealth:p.maxHealth, alive:p.alive, ghost:p.ghost, ghostItem:p.ghostItem, ghostItemName:p.ghostItem && GHOST_ITEM_NAMES[p.ghostItem], ghostPing:Date.now() < (p.pingUntil || 0), haunted:Date.now() < (p.hauntedUntil || 0), walled:Date.now() < (p.wallUntil || 0), inked:Date.now() < (p.inkUntil || 0), hit:Date.now() < (p.hitUntil || 0), score:p.score, gems:p.gems, coins:p.coins, connected:p.connected, shield:Date.now() < p.shieldUntil, specialCharge:p.specialCharge || 0, specialRequired:SPECIAL_HITS, specialReady:(p.specialCharge || 0) >= SPECIAL_HITS }; }
function players(room) { return [...room.players.values()].map(publicPlayer); }
function humanPlayers(room) { return [...room.players.values()].filter(player => !player.bot); }
function meta(room) { const mode = MODES[room.mode], survivalTime = room.mode === "survival" ? Math.floor(((room.game.endedAt || Date.now()) - room.game.startedAt) / 1000) : 0, winner = room.players.has(room.game.winner) ? publicPlayer(room.players.get(room.game.winner)) : room.game.winner, botCount = [...room.players.values()].filter(p => p.bot).length; return { mode:room.mode, modeName:mode.name, objective:mode.objective, target:mode.target, winner, winnerTeam:room.game.winnerTeam, items:room.game.items, projectiles:room.game.projectiles.map(({ id, x, y, vx, vy, type, color }) => ({ id, x, y, vx, vy, type, color })), safeRadius:room.game.safeRadius, zoneScore:room.game.zoneScore, survivalTime, wave:room.game.wave, botCount, arena:ARENA, survivalLeaders }; }
function broadcast(room) { io.to(room.code).emit("game:state", players(room)); io.to(room.code).emit("game:meta", meta(room)); }
function recordSurvivalLeaders(room) {
  const survived = Math.floor((room.game.endedAt - room.game.startedAt) / 1000);
  for (const player of humanPlayers(room)) {
    survivalLeaders.push({
      name: player.name,
      character: CHARACTERS[player.character]?.name || player.character,
      time: survived,
      score: player.score || 0,
      at: Date.now()
    });
  }
  survivalLeaders.sort((a, b) => b.time - a.time || b.score - a.score || a.at - b.at);
  survivalLeaders.splice(10);
}
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
  else { const c = PLAYABLE_CHARACTERS.has(character) ? character : "blaze", stats = CHARACTERS[c], spot = randomSpot(), redCount=[...room.players.values()].filter(p=>p.team==="red").length, blueCount=[...room.players.values()].filter(p=>p.team==="blue").length, team=room.mode==="zone"?(redCount<=blueCount?"red":"blue"):null, defaultName=`Player ${humanPlayers(room).length + 1}`, displayName=String(name || "").trim().slice(0, 14) || defaultName; p = { id, socketId:socket.id, name:displayName, character:c, color:COLORS[room.players.size % COLORS.length], team, x:spot.x, y:spot.y, aimX:1, aimY:0, maxHealth:stats.hp, health:stats.hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false}, lastAttack:0, lastSpecial:false, specialCharge:0, shieldUntil:0, connected:true }; room.players.set(id, p); }
  socketIndex.set(socket.id, { code:roomCode, playerId:id }); socket.join(roomCode); ack({ ok:true, code:roomCode, player:publicPlayer(p), players:players(room), meta:meta(room) }); broadcast(room);
}
function end(room, winner) { if (room.game.winner || !winner) return; room.game.winner = winner.id; broadcast(room); }
function endTeam(room, team) { if (room.game.winner || room.game.winnerTeam) return; room.game.winnerTeam = team; broadcast(room); }
function kill(room, victim, killer) {
  if (!victim.alive) return; victim.alive = false; victim.health = 0; victim.diedAt = Date.now();
  victim.specialCharge = 0;
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
  if (room.mode === "gems" && victim.gems) { for (let i=0;i<victim.gems;i++) room.game.items.push({ x:clamp(victim.x+(Math.random()-.5)*45,25,ARENA.width-25), y:clamp(victim.y+(Math.random()-.5)*45,25,ARENA.height-25), type:"gem" }); victim.gems=0; }
  if (room.mode === "showdown" || room.mode === "brawl") { const alive = [...room.players.values()].filter(p => p.alive); if (alive.length === 1) end(room, alive[0]); }
  if (room.mode === "survival" && ![...room.players.values()].some(p => !p.bot && p.alive) && !room.game.endedAt) {
    room.game.winner = "survival-ended";
    room.game.endedAt = Date.now();
    recordSurvivalLeaders(room);
  }
}
function attack(room, attacker, now) {
  const stats = CHARACTERS[attacker.character]; if (now - attacker.lastAttack < stats.rate) return; attacker.lastAttack = now;
  const aim = aimDirection(attacker), dx = aim.x, dy = aim.y;
  room.game.projectiles.push({ id:`${room.code}-${room.game.nextProjectileId++}`, ownerId:attacker.id, bot:Boolean(attacker.bot), team:attacker.team, character:attacker.character, type:attacker.character==="blaze"?"rocket":"shot", color:attacker.color, x:attacker.x+dx*26, y:attacker.y+dy*26, vx:dx*PROJECTILE_SPEED, vy:dy*PROJECTILE_SPEED, damage:stats.damage, remaining:stats.range, radius:attacker.character==="blaze"?10:7 });
}
function special(room, p, now) { if (p.lastSpecial || (p.specialCharge || 0) < SPECIAL_HITS) return; p.specialCharge = 0; p.lastSpecialAt = now; const stats = CHARACTERS[p.character]; if (p.character === "tank") p.shieldUntil = now + 2600; else if (p.character === "medic") p.health = Math.min(stats.hp, p.health + 42); else { const len=Math.hypot(p.input.x,p.input.y)||1; dashPlayer(p,p.input.x/len*105,p.input.y/len*105); } }
function projectileCanHit(room, projectile, target) {
  return target.id !== projectile.ownerId && target.alive && target.connected && !(room.mode === "zone" && target.team && target.team === projectile.team) && !(room.mode === "survival" && Boolean(target.bot) === projectile.bot);
}
function hitWithProjectile(room, projectile, victim) {
  const attacker = room.players.get(projectile.ownerId);
  const damage = projectile.damage * (Date.now() < victim.shieldUntil ? .35 : 1);
  victim.health -= damage;
  victim.hitUntil = Date.now() + 150;
  if (attacker && !attacker.bot && PLAYABLE_CHARACTERS.has(attacker.character)) attacker.specialCharge = Math.min(SPECIAL_HITS, (attacker.specialCharge || 0) + 1);
  if (victim.health <= 0) kill(room, victim, attacker || null);
}
function updateProjectiles(room) {
  for (let i=room.game.projectiles.length-1;i>=0;i--) {
    const projectile = room.game.projectiles[i], nextX = projectile.x + projectile.vx, nextY = projectile.y + projectile.vy;
    projectile.remaining -= Math.hypot(projectile.vx, projectile.vy);
    if (projectile.remaining <= 0 || nextX < 0 || nextX > ARENA.width || nextY < 0 || nextY > ARENA.height || lineBlocked(projectile.x, projectile.y, nextX, nextY)) {
      room.game.projectiles.splice(i, 1);
      continue;
    }
    projectile.x = nextX; projectile.y = nextY;
    const victim = [...room.players.values()].find(p => projectileCanHit(room, projectile, p) && Math.hypot(p.x-projectile.x,p.y-projectile.y) < playerRadius(p) + projectile.radius);
    if (victim) {
      hitWithProjectile(room, projectile, victim);
      room.game.projectiles.splice(i, 1);
    }
  }
}
function spawnBot(room, now) {
  const count = [...room.players.values()].filter(p => p.bot).length;
  const cap = Math.min(9, 2 + Math.floor(room.game.wave / 2));
  if (count >= cap) return;
  const edge = Math.floor(Math.random() * 4), spot = edge === 0 ? { x: 30, y: 80 + Math.random() * (ARENA.height-160) } : edge === 1 ? { x: ARENA.width-30, y: 80 + Math.random() * (ARENA.height-160) } : edge === 2 ? { x: 90 + Math.random() * (ARENA.width-180), y: 30 } : { x: 90 + Math.random() * (ARENA.width-180), y: ARENA.height-30 };
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
    bot.aimX = bot.input.x;
    bot.aimY = bot.input.y;
    bot.input.attack = distance < CHARACTERS[bot.character].range;
  }
}
function updateRoom(room, now) {
  if (room.game.winner || room.game.winnerTeam) return;
  if (room.mode === "survival") updateSurvival(room, now);
  const center = arenaCenter();
  if (room.mode === "showdown") room.game.safeRadius = Math.max(90, arenaSafeRadius() - (now-room.game.startedAt)/520);
  updateProjectiles(room);
  for (const p of room.players.values()) {
    if (!p.connected) continue;
    if (!p.alive && p.ghost) {
      // Dead players remain as non-combat ghosts. SPECIAL becomes a visible warning ping.
      const ghostSpeed = CHARACTERS[p.character].speed * .72;
      movePlayer(p, p.input.x*ghostSpeed, p.input.y*ghostSpeed);
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
    movePlayer(p, p.input.x*stats.speed*moveScale, p.input.y*stats.speed*moveScale);
    if (p.input.attack) attack(room,p,now); if (p.input.special) special(room,p,now); p.lastSpecial=p.input.special;
    if (room.mode === "showdown" && Math.hypot(p.x-center.x,p.y-center.y) > room.game.safeRadius) { p.health -= .55; if (p.health<=0) kill(room,p,null); }
    for (let i=room.game.items.length-1;i>=0;i--) { const item=room.game.items[i]; if (Math.hypot(item.x-p.x,item.y-p.y)<32) { room.game.items.splice(i,1); if(item.type==="gem")p.gems++; else p.coins++; } }
    if ((room.mode === "gems" && p.gems >= 10) || (room.mode === "coins" && p.coins >= 15)) end(room,p);
    if (room.mode === "soloZone" && Math.hypot(p.x-center.x,p.y-center.y)<ARENA.zoneRadius) { room.game.zoneScore[p.id]=(room.game.zoneScore[p.id]||0)+1/30; if(room.game.zoneScore[p.id]>=15) end(room,p); }
  }
  if (room.mode === "zone") {
    const inside = [...room.players.values()].filter(p=>p.alive&&Math.hypot(p.x-center.x,p.y-center.y)<ARENA.zoneRadius);
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
  socket.on("player:input", payload => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), p=room&&room.players.get(ref.playerId); if(!p||!Array.isArray(payload))return; const x=clamp(Number(payload[0])||0,-1,1), y=clamp(Number(payload[1])||0,-1,1); p.input={x,y,attack:Boolean(payload[2]),special:Boolean(payload[3])}; if(Math.hypot(x,y)>.12){p.aimX=x;p.aimY=y;} });
  socket.on("ghost:target", ({ targetId } = {}) => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), ghost=room&&room.players.get(ref.playerId), target=room&&room.players.get(String(targetId||"")); if (!ghost?.ghost || !target?.alive || ghost.id===target.id) return; ghost.ghostTargetId=target.id; });
  socket.on("disconnect", () => { const host=socket.data.hostRoom; if(host&&rooms.get(host)?.hostSocketId===socket.id){io.to(host).emit("room:closed");rooms.delete(host);} const ref=socketIndex.get(socket.id);socketIndex.delete(socket.id);const room=ref&&rooms.get(ref.code),p=room&&room.players.get(ref.playerId);if(p&&p.socketId===socket.id){p.connected=false;p.input={x:0,y:0,attack:false,special:false};p.removeTimer=setTimeout(()=>removePlayer(room,ref.playerId),RECONNECT_MS);broadcast(room);} });
});
setInterval(()=>{const now=Date.now();for(const room of rooms.values())updateRoom(room,now);},1000/30);
server.listen(PORT,()=>console.log(`CouchBrawl running at http://localhost:${PORT}/play/`));
