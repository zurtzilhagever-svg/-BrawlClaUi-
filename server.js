"use strict";
const express = require("express"), http = require("http"), os = require("os"), fs = require("fs"), path = require("path"), QRCode = require("qrcode");
const { Server } = require("socket.io");
const app = express(), server = http.createServer(app), io = new Server(server, { cors: { origin: "*" } });
const PORT = Number(process.env.PORT) || 3000, RECONNECT_MS = 30_000, MAX_PLAYERS = 8, SPECIAL_HITS = 5, PROJECTILE_SPEED = 12, BOB_UNLOCK_WAVE = 10;
const rooms = new Map(), socketIndex = new Map();
const survivalLeaders = [];
const COLORS = ["#ff5964", "#36c8ff", "#ffd54a", "#a875ff", "#52e084", "#ff8e4f", "#fa73bd", "#80a7ff"];
const OWNER_ADMIN_EMAIL = "zurtzilhagever@gmail.com";
const ADMIN_FILE = path.join(__dirname, "admins.json");
function loadAdminEmails() {
  const emails = new Set([OWNER_ADMIN_EMAIL]);
  try {
    const stored = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
    if (Array.isArray(stored)) for (const email of stored) if (isValidEmail(email)) emails.add(normalizeEmail(email));
  } catch {}
  return emails;
}
const ADMIN_EMAILS = loadAdminEmails();
const CHARACTERS = {
  blaze: { name: "\u05d1\u05d5\u05d1", hp: 100, speed: 4, damage: 8, range: 255, rate: 520, special: "Cardboard Fortress" },
  boomer: { name: "\u05d1\u05d5\u05de\u05e8", hp: 100, speed: 4, damage: 16, range: 270, rate: 240, special: "Jet dash" },
  fangli: { name: "\u05e4\u05d0\u05e0\u05d2\u05dc\u05d9", hp: 110, speed: 3.85, damage: 15, range: 430, rate: 760, special: "Pterodactyl Catch" },
  pixel: { name: "\u05e4\u05d9\u05e7\u05e1\u05dc", hp: 96, speed: 3.75, damage: 14, range: 520, rate: 520, special: "Game Over" },
  tank: { name: "\u05d0\u05d5\u05e8\u05e8\u05d4", hp: 150, speed: 3.2, damage: 7, range: 275, rate: 720, special: "Ice Field" },
  bazaar: { name: "\u05d1\u05d0\u05d6\u05d0\u05e8", hp: 108, speed: 3.55, damage: 6, range: 310, rate: 690, special: "Reality Box" },
  masterv: { name: "Master V", hp: 128, speed: 3.9, damage: 18, range: 470, rate: 620, special: "Ultimate Master" },
  grunt: { name: "Grunt", hp: 56, speed: 2.05, damage: 5, range: 38, rate: 980, special: "None" }
};
const PLAYABLE_CHARACTERS = new Set(["blaze", "boomer", "fangli", "pixel", "tank", "bazaar", "masterv"]);
const MODES = {
  survival: { name: "Survival", objective: "Survive bot waves as long as you can", target: 0 },
  brawl: { name: "Solo Brawl", objective: "Be the last brawler alive", target: 1 },
  gems: { name: "Gem Grab", objective: "Collect 10 gems to win", target: 10 },
  showdown: { name: "Showdown", objective: "Be the last brawler alive", target: 1 },
  coins: { name: "Coin Rush", objective: "Collect 15 coins to win", target: 15 },
  zone: { name: "Zone Control", objective: "Red or Blue: hold the center for 35 seconds", target: 35 },
  soloZone: { name: "Solo Zone Control", objective: "Hold the center for 15 seconds", target: 15 }
};
const ARENAS = [
  {
    id: "main-yard",
    width: 1200,
    height: 900,
    zoneRadius: 105,
    obstacles: [
      { x: 96, y: 122, w: 196, h: 54, kind: "stone" },
      { x: 908, y: 122, w: 196, h: 54, kind: "stone" },
      { x: 96, y: 724, w: 196, h: 54, kind: "stone" },
      { x: 908, y: 724, w: 196, h: 54, kind: "stone" },
      { x: 476, y: 190, w: 248, h: 46, kind: "stone" },
      { x: 476, y: 664, w: 248, h: 46, kind: "stone" },
      { x: 250, y: 336, w: 74, h: 228, kind: "crate" },
      { x: 876, y: 336, w: 74, h: 228, kind: "crate" },
      { x: 520, y: 382, w: 62, h: 136, kind: "stone" },
      { x: 618, y: 382, w: 62, h: 136, kind: "stone" },
      { x: 392, y: 274, w: 84, h: 62, kind: "crate" },
      { x: 724, y: 564, w: 84, h: 62, kind: "crate" }
    ],
    bushes: [
      { x: 340, y: 136, w: 104, h: 98 },
      { x: 756, y: 136, w: 104, h: 98 },
      { x: 340, y: 666, w: 104, h: 98 },
      { x: 756, y: 666, w: 104, h: 98 },
      { x: 106, y: 392, w: 104, h: 116 },
      { x: 990, y: 392, w: 104, h: 116 },
      { x: 536, y: 314, w: 128, h: 68 },
      { x: 536, y: 518, w: 128, h: 68 }
    ],
    spawnPoints: [
      { x: 88, y: 88 }, { x: 1112, y: 88 }, { x: 88, y: 812 }, { x: 1112, y: 812 },
      { x: 420, y: 450 }, { x: 780, y: 450 }, { x: 600, y: 112 }, { x: 600, y: 788 },
      { x: 182, y: 620 }, { x: 1018, y: 280 }
    ]
  },
  {
    id: "stone-ring",
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
  },
  {
    id: "open-flanks",
    width: 1200,
    height: 900,
    zoneRadius: 115,
    obstacles: [
      { x: 156, y: 224, w: 92, h: 212, kind: "stone" },
      { x: 952, y: 464, w: 92, h: 212, kind: "stone" },
      { x: 318, y: 132, w: 132, h: 52, kind: "crate" },
      { x: 750, y: 716, w: 132, h: 52, kind: "crate" },
      { x: 520, y: 158, w: 160, h: 44, kind: "stone" },
      { x: 520, y: 698, w: 160, h: 44, kind: "stone" },
      { x: 402, y: 356, w: 80, h: 88, kind: "crate" },
      { x: 718, y: 456, w: 80, h: 88, kind: "crate" },
      { x: 556, y: 390, w: 88, h: 120, kind: "stone" }
    ],
    bushes: [
      { x: 80, y: 104, w: 150, h: 74 },
      { x: 970, y: 722, w: 150, h: 74 },
      { x: 84, y: 632, w: 176, h: 88 },
      { x: 940, y: 180, w: 176, h: 88 },
      { x: 292, y: 500, w: 168, h: 74 },
      { x: 740, y: 326, w: 168, h: 74 },
      { x: 514, y: 552, w: 172, h: 70 }
    ],
    spawnPoints: [
      { x: 92, y: 92 }, { x: 1108, y: 92 }, { x: 92, y: 808 }, { x: 1108, y: 808 },
      { x: 190, y: 520 }, { x: 1010, y: 380 }, { x: 600, y: 262 }, { x: 600, y: 638 },
      { x: 356, y: 722 }, { x: 844, y: 178 }
    ]
  }
];
function arenaFor() { return ARENAS[Math.floor(Math.random() * ARENAS.length)]; }
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
function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }
function isValidEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value)); }
function isAdminEmail(value) { return ADMIN_EMAILS.has(normalizeEmail(value)); }
function isOwnerAdminEmail(value) { return normalizeEmail(value) === OWNER_ADMIN_EMAIL; }
function adminList() { return [...ADMIN_EMAILS].sort().map(email => ({ email, owner:isOwnerAdminEmail(email) })); }
function saveAdminEmails() { fs.writeFileSync(ADMIN_FILE, JSON.stringify([...ADMIN_EMAILS].sort(), null, 2)); }
function isAdminActor(socket, data = {}) {
  const ref = socketIndex.get(socket.id);
  const actorRoom = ref && rooms.get(ref.code);
  const actor = actorRoom?.players.get(ref.playerId);
  return isAdminEmail(actor?.accountEmail) || isAdminEmail(data.accountEmail);
}
function protectInvinciblePlayer(player) {
  if (!isOwnerAdminEmail(player?.accountEmail)) return false;
  player.health = player.maxHealth;
  player.alive = true;
  player.ghost = false;
  player.ghostItem = false;
  player.freezeMeter = 0;
  player.inkUntil = 0;
  player.hauntedUntil = 0;
  player.wallUntil = 0;
  player.confusedUntil = 0;
  player.hitUntil = 0;
  return true;
}
function arenaCenter(arena) { return { x:arena.width / 2, y:arena.height / 2 }; }
function arenaSafeRadius(arena) { return Math.min(arena.width, arena.height) * .58; }
function intersectsRect(x, y, radius, rect) { const cx=clamp(x,rect.x,rect.x+rect.w), cy=clamp(y,rect.y,rect.y+rect.h); return Math.hypot(x-cx,y-cy) < radius; }
function blocked(arena, x, y, radius = 24) { return arena.obstacles.some(rect => intersectsRect(x, y, radius, rect)); }
function randomSpot(arena) {
  for (let i=0;i<70;i++) {
    const base = i < arena.spawnPoints.length ? arena.spawnPoints[Math.floor(Math.random()*arena.spawnPoints.length)] : { x:90+Math.random()*(arena.width-180), y:90+Math.random()*(arena.height-180) };
    const spot = { x:clamp(base.x+(Math.random()-.5)*64,35,arena.width-35), y:clamp(base.y+(Math.random()-.5)*64,35,arena.height-35) };
    if (!blocked(arena, spot.x, spot.y, 28)) return spot;
  }
  return arenaCenter(arena);
}
function makeItems(arena, amount, type) { return Array.from({ length: amount }, () => ({ ...randomSpot(arena), type })); }
function gameFor(mode, arena = arenaFor(mode)) { return { startedAt: Date.now(), winner: null, winnerTeam: null, rewardCharacter: null, items: mode === "gems" ? makeItems(arena, 12, "gem") : mode === "coins" ? makeItems(arena, 18, "coin") : [], projectiles: [], pixelZones: [], iceZones: [], bazaarBoxes: [], nextProjectileId: 0, zoneScore: { red: 0, blue: 0 }, safeRadius: arenaSafeRadius(arena), nextItemAt: 0, nextBotAt: 0, botSerial: 0, wave: 0 }; }
function playerRadius(p) { return p.character === "tank" ? 26 : p.character === "grunt" ? 18 : 23; }
function movePlayer(arena, p, dx, dy) {
  const radius = playerRadius(p);
  const nextX = clamp(p.x + dx, 28, arena.width - 28);
  if (!blocked(arena, nextX, p.y, radius)) p.x = nextX;
  const nextY = clamp(p.y + dy, 28, arena.height - 28);
  if (!blocked(arena, p.x, nextY, radius)) p.y = nextY;
}
function dashPlayer(arena, p, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 18));
  for (let i=0;i<steps;i++) movePlayer(arena, p, dx / steps, dy / steps);
}
function segmentIntersectsExpandedRect(x1, y1, x2, y2, rect, radius = 0) {
  const minX = rect.x - radius, maxX = rect.x + rect.w + radius;
  const minY = rect.y - radius, maxY = rect.y + rect.h + radius;
  if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) || (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) return true;
  const dx = x2 - x1, dy = y2 - y1;
  let enter = 0, exit = 1;
  for (const [p, q] of [[-dx, x1 - minX], [dx, maxX - x1], [-dy, y1 - minY], [dy, maxY - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) enter = Math.max(enter, t);
    else exit = Math.min(exit, t);
    if (enter > exit) return false;
  }
  return true;
}
function lineBlocked(arena, x1, y1, x2, y2, radius = 8) {
  return arena.obstacles.some(rect => segmentIntersectsExpandedRect(x1, y1, x2, y2, rect, radius));
}
function aimDirection(p) {
  const x = Number.isFinite(p.aimX) ? p.aimX : p.input.x;
  const y = Number.isFinite(p.aimY) ? p.aimY : p.input.y;
  const len = Math.hypot(x, y);
  return len > .01 ? { x:x/len, y:y/len } : { x:1, y:0 };
}
function isTeamCombatMode(room) { return room.mode === "zone" || room.mode === "gems"; }
function sameTeam(room, a, b) { return isTeamCombatMode(room) && a?.team && b?.team && a.team === b.team; }
function chooseTeam(room) {
  if (!isTeamCombatMode(room)) return null;
  const redHumans = [...room.players.values()].filter(p => !p.bot && p.team === "red").length;
  const blueHumans = [...room.players.values()].filter(p => !p.bot && p.team === "blue").length;
  if (redHumans < 3 && redHumans <= blueHumans) return "red";
  if (blueHumans < 3) return "blue";
  return redHumans <= blueHumans ? "red" : "blue";
}
function canAffectWithSpecial(room, source, target) {
  return target.id !== source.id && target.alive && target.connected && !sameTeam(room, source, target) && !(room.mode === "survival" && Boolean(target.bot) === Boolean(source.bot));
}
function firstTargetOnLine(room, source, dx, dy, range) {
  let selected = null, selectedDistance = Infinity;
  for (const target of room.players.values()) {
    if (!canAffectWithSpecial(room, source, target)) continue;
    const tx = target.x - source.x, ty = target.y - source.y;
    const along = tx * dx + ty * dy;
    if (along < 12 || along > range || along >= selectedDistance) continue;
    const side = Math.abs(tx * dy - ty * dx);
    if (side > playerRadius(target) + 14) continue;
    if (lineBlocked(room.arena, source.x, source.y, source.x + dx * along, source.y + dy * along, 5)) continue;
    selected = target; selectedDistance = along;
  }
  return selected;
}
function firstWallPoint(arena, x, y, dx, dy, range) {
  let previous = { x, y };
  for (let distance = 18; distance <= range; distance += 10) {
    const next = { x:x + dx * distance, y:y + dy * distance };
    if (next.x < 28 || next.x > arena.width - 28 || next.y < 28 || next.y > arena.height - 28 || blocked(arena, next.x, next.y, 18)) return previous;
    previous = next;
  }
  return null;
}
function publicPlayer(p) { const now = Date.now(); return { id:p.id, name:p.name, color:p.color, team:p.team, character:p.character, characterName:CHARACTERS[p.character]?.name || p.character, bot:p.bot, admin:isAdminEmail(p.accountEmail), invincible:isOwnerAdminEmail(p.accountEmail), x:p.x, y:p.y, health:Math.ceil(p.health), maxHealth:p.maxHealth, alive:p.alive, ghost:p.ghost, ghostItem:p.ghostItem, ghostItemName:p.ghostItem && GHOST_ITEM_NAMES[p.ghostItem], ghostPing:now < (p.pingUntil || 0), haunted:now < (p.hauntedUntil || 0), walled:now < (p.wallUntil || 0), inked:now < (p.inkUntil || 0), confused:now < (p.confusedUntil || 0), freezeMeter:Math.round(p.freezeMeter || 0), bazaarBuff:p.bazaarBuff || "", damageBoost:now < (p.damageBoostUntil || 0), hit:now < (p.hitUntil || 0), score:p.score, gems:p.gems, coins:p.coins, connected:p.connected, shield:now < p.shieldUntil, cardboardShield:now < (p.cardboardShieldUntil || 0) && (p.cardboardShieldHp || 0) > 0, specialCharge:p.specialCharge || 0, specialRequired:SPECIAL_HITS, specialReady:(p.specialCharge || 0) >= SPECIAL_HITS }; }
function players(room) { return [...room.players.values()].map(publicPlayer); }
function humanPlayers(room) { return [...room.players.values()].filter(player => !player.bot); }
function teamGems(room, team) { return [...room.players.values()].filter(p => p.team === team).reduce((sum, p) => sum + (p.gems || 0), 0); }
function meta(room) { const mode = MODES[room.mode], survivalTime = room.mode === "survival" ? Math.floor(((room.game.endedAt || Date.now()) - room.game.startedAt) / 1000) : 0, winner = room.players.has(room.game.winner) ? publicPlayer(room.players.get(room.game.winner)) : room.game.winner, botCount = [...room.players.values()].filter(p => p.bot).length; return { mode:room.mode, modeName:mode.name, objective:mode.objective, target:mode.target, winner, winnerTeam:room.game.winnerTeam, rewardCharacter:room.game.rewardCharacter, items:room.game.items, projectiles:room.game.projectiles.map(({ id, x, y, vx, vy, type, color, returning, radius }) => ({ id, x, y, vx, vy, type, color, returning, radius })), pixelZones:(room.game.pixelZones || []).map(({ x, y, radius, landsAt, endsAt }) => ({ x, y, radius, landsAt, endsAt })), iceZones:(room.game.iceZones || []).map(({ x, y, radius, endsAt }) => ({ x, y, radius, endsAt })), bazaarBoxes:(room.game.bazaarBoxes || []).map(({ x, y, expiresAt }) => ({ x, y, expiresAt })), safeRadius:room.game.safeRadius, zoneScore:room.game.zoneScore, gemScore:{ red:teamGems(room,"red"), blue:teamGems(room,"blue") }, survivalTime, wave:room.game.wave, botCount, arena:room.arena, survivalLeaders }; }
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
function createRoom(hostSocketId, mode = "brawl") { const selectedMode = MODES[mode] ? mode : "brawl", arena = arenaFor(selectedMode); const room = { code:code(), hostSocketId, mode:selectedMode, arena, players:new Map(), bannedPlayerIds:new Set(), bannedEmails:new Set(), game:null }; room.game = gameFor(room.mode, room.arena); rooms.set(room.code, room); return room; }
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
function joinPlayer(socket, roomCode, playerId, name, character, accountEmail, ack) {
  const room = rooms.get(roomCode), id = String(playerId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  if (!room) return ack({ ok:false, error:"Room not found" }); if (!id) return ack({ ok:false, error:"Invalid player" });
  const cleanEmail = normalizeEmail(accountEmail);
  if (room.bannedPlayerIds.has(id) || (cleanEmail && room.bannedEmails?.has(cleanEmail))) return ack({ ok:false, error:"You are banned from this room" });
  if (character && !PLAYABLE_CHARACTERS.has(character)) return ack({ ok:false, error:"Unknown character" });
  detachSocket(socket, roomCode);
  const selectedCharacter = PLAYABLE_CHARACTERS.has(character) ? character : "blaze";
  let p = room.players.get(id);
  const maxHumans = isTeamCombatMode(room) ? 6 : MAX_PLAYERS;
  if (!p && humanPlayers(room).length >= maxHumans) return ack({ ok:false, error:"Room is full" });
  if (p) {
    clearTimeout(p.removeTimer); socketIndex.delete(p.socketId); p.socketId = socket.id; p.connected = true; p.accountEmail = cleanEmail || p.accountEmail || "";
    if (p.character !== selectedCharacter) {
      const ratio = p.maxHealth ? p.health / p.maxHealth : 1, stats = CHARACTERS[selectedCharacter];
      p.character = selectedCharacter; p.maxHealth = stats.hp; p.health = Math.min(stats.hp, Math.max(1, Math.round(stats.hp * ratio)));
    }
  }
  else { const c = selectedCharacter, stats = CHARACTERS[c], spot = randomSpot(room.arena), team=chooseTeam(room), defaultName=`Player ${humanPlayers(room).length + 1}`, displayName=String(name || "").trim().slice(0, 14) || defaultName; p = { id, socketId:socket.id, accountEmail:cleanEmail, name:displayName, character:c, color:COLORS[room.players.size % COLORS.length], team, x:spot.x, y:spot.y, aimX:1, aimY:0, maxHealth:stats.hp, health:stats.hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false}, lastAttack:0, lastSpecial:false, specialCharge:0, shieldUntil:0, bazaarBuff:"", connected:true }; room.players.set(id, p); }
  socketIndex.set(socket.id, { code:roomCode, playerId:id }); socket.join(roomCode); ack({ ok:true, code:roomCode, player:publicPlayer(p), players:players(room), meta:meta(room) }); broadcast(room);
}
function adminRoom(socket, data = {}, ack = () => {}) {
  const ref = socketIndex.get(socket.id);
  const roomCode = String(data.roomCode || ref?.code || "").trim().toUpperCase();
  const room = rooms.get(roomCode);
  if (!room || !isAdminActor(socket, data)) {
    ack({ ok:false, error:"Admin only" });
    return null;
  }
  return room;
}
function resetHumanForGame(room, player) {
  const stats = CHARACTERS[player.character] || CHARACTERS.blaze, spot = randomSpot(room.arena);
  Object.assign(player, {
    x:spot.x, y:spot.y, maxHealth:stats.hp, health:stats.hp, alive:true, ghost:false,
    ghostItem:false, ghostTargetId:null, score:0, gems:0, coins:0, specialCharge:0,
    shieldUntil:0, cardboardShieldUntil:0, cardboardShieldHp:0, hauntedUntil:0, wallUntil:0,
    inkUntil:0, confusedUntil:0, freezeMeter:0, freezeUntil:0, bazaarBuff:"", damageBoostUntil:0, iceVx:0, iceVy:0, hitUntil:0, input:{x:0,y:0,attack:false,special:false}
  });
}
function end(room, winner) { if (room.game.winner || !winner) return; room.game.winner = winner.id; broadcast(room); }
function endTeam(room, team) { if (room.game.winner || room.game.winnerTeam) return; room.game.winnerTeam = team; broadcast(room); }
function kill(room, victim, killer) {
  if (protectInvinciblePlayer(victim)) return;
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
  if (room.mode === "gems" && victim.gems) { for (let i=0;i<victim.gems;i++) room.game.items.push({ x:clamp(victim.x+(Math.random()-.5)*45,25,room.arena.width-25), y:clamp(victim.y+(Math.random()-.5)*45,25,room.arena.height-25), type:"gem" }); victim.gems=0; }
  if (room.mode === "showdown" || room.mode === "brawl") { const alive = [...room.players.values()].filter(p => p.alive), aliveHumans = alive.filter(p => !p.bot); if (alive.length === 1 || (!aliveHumans.length && alive.length)) end(room, alive[0]); }
  if (room.mode === "survival" && ![...room.players.values()].some(p => !p.bot && p.alive) && !room.game.endedAt) {
    room.game.winner = "survival-ended";
    room.game.endedAt = Date.now();
    recordSurvivalLeaders(room);
  }
}
function pushProjectile(room, attacker, dx, dy, stats, options = {}) {
  const start = options.start || 26;
  const projectile = {
    id:`${room.code}-${room.game.nextProjectileId++}`,
    ownerId:attacker.id,
    bot:Boolean(attacker.bot),
    team:attacker.team,
    character:attacker.character,
    type:options.type || "shot",
    color:options.color || attacker.color,
    x:attacker.x + dx * start,
    y:attacker.y + dy * start,
    vx:dx * (options.speed || PROJECTILE_SPEED),
    vy:dy * (options.speed || PROJECTILE_SPEED),
    damage:(options.damage || stats.damage) * (Date.now() < (attacker.damageBoostUntil || 0) ? 1.35 : 1),
    remaining:Math.max(24, stats.range - Math.max(0, start - 26)),
    radius:options.radius || 7,
    baseRadius:options.baseRadius || options.radius || 7,
    maxRadius:options.maxRadius || options.radius || 7,
    expand:Boolean(options.expand),
    traveled:0,
    bounces:options.bounces || 0,
    freezeBuild:options.freezeBuild || 0,
    returnSpeed:options.returnSpeed || options.speed || PROJECTILE_SPEED,
    returning:Boolean(options.returning),
    hitIds:[]
  };
  room.game.projectiles.push(projectile);
  if (options.lockOwnerUntilReturn) attacker.boomerangActive = projectile.id;
}
function attack(room, attacker, now) {
  const stats = CHARACTERS[attacker.character]; if (attacker.character === "boomer" && attacker.boomerangActive) return; if (now - attacker.lastAttack < stats.rate) return; attacker.lastAttack = now;
  const aim = aimDirection(attacker), dx = aim.x, dy = aim.y;
  if (attacker.character === "blaze") {
    for (const start of [26, 42, 58]) pushProjectile(room, attacker, dx, dy, stats, { type:"tennis", color:"#caff3f", start, radius:8 });
    return;
  }
  if (attacker.character === "fangli") {
    const missingHealth = clamp(1 - attacker.health / attacker.maxHealth, 0, 1);
    pushProjectile(room, attacker, dx, dy, stats, {
      type:"bone",
      color:"#ead9bf",
      speed:14 + missingHealth * 8,
      damage:stats.damage * (1 + missingHealth),
      radius:6
    });
    return;
  }
  if (attacker.character === "pixel") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"laser", color:"#75f7ff", speed:22, radius:5, bounces:2 });
    return;
  }
  if (attacker.character === "tank") {
    for (const angle of [-0.38, -0.19, 0, 0.19, 0.38]) {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      pushProjectile(room, attacker, dx * cos - dy * sin, dx * sin + dy * cos, stats, { type:"snowflake", color:"#dff8ff", speed:11, radius:7, freezeBuild:22 });
    }
    return;
  }
  if (attacker.character === "bazaar") {
    for (const start of [28, 48, 68]) pushProjectile(room, attacker, dx, dy, stats, { type:"coin", color:"#ffd54a", start, speed:13, radius:6, baseRadius:6, maxRadius:15, expand:true });
    return;
  }
  if (attacker.character === "masterv") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"laser", color:"#ffe66d", speed:19, radius:7, bounces:1, damage:stats.damage });
    return;
  }
  if (attacker.character === "boomer") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"boomerang", color:"#ffd15c", start:34, speed:11, returnSpeed:13, radius:13, lockOwnerUntilReturn:true });
    return;
  }
  pushProjectile(room, attacker, dx, dy, stats);
}
function special(room, p, now) {
  if (p.lastSpecial || (p.specialCharge || 0) < SPECIAL_HITS) return;
  p.specialCharge = 0; p.lastSpecialAt = now;
  const stats = CHARACTERS[p.character];
  if (p.character === "blaze") {
    const aim = aimDirection(p);
    dashPlayer(room.arena, p, aim.x * 125, aim.y * 125);
    p.shieldUntil = now + 3600;
    p.cardboardShieldUntil = now + 3600;
    p.cardboardShieldHp = 55;
  } else if (p.character === "fangli") {
    const aim = aimDirection(p), range = 430;
    const target = firstTargetOnLine(room, p, aim.x, aim.y, range);
    if (target) {
      const pullX = clamp(p.x + aim.x * 42, 30, room.arena.width - 30), pullY = clamp(p.y + aim.y * 42, 30, room.arena.height - 30);
      dashPlayer(room.arena, target, pullX - target.x, pullY - target.y);
      target.inkUntil = now + 950;
      target.hitUntil = now + 220;
    } else {
      const wall = firstWallPoint(room.arena, p.x, p.y, aim.x, aim.y, range);
      if (wall) dashPlayer(room.arena, p, wall.x - p.x, wall.y - p.y);
    }
  } else if (p.character === "pixel") {
    const aim = aimDirection(p), radius = 92;
    room.game.pixelZones ||= [];
    room.game.pixelZones.push({
      ownerId:p.id,
      team:p.team,
      bot:Boolean(p.bot),
      x:clamp(p.x + aim.x * 275, radius, room.arena.width - radius),
      y:clamp(p.y + aim.y * 275, radius, room.arena.height - radius),
      radius,
      landsAt:now + 550,
      endsAt:now + 3550
    });
  } else if (p.character === "tank") {
    const aim = aimDirection(p), radius = 170;
    room.game.iceZones ||= [];
    room.game.iceZones.push({
      ownerId:p.id,
      team:p.team,
      bot:Boolean(p.bot),
      x:clamp(p.x + aim.x * 185, radius, room.arena.width - radius),
      y:clamp(p.y + aim.y * 185, radius, room.arena.height - radius),
      radius,
      endsAt:now + 5200
    });
  } else if (p.character === "bazaar") {
    const aim = aimDirection(p);
    room.game.bazaarBoxes ||= [];
    room.game.bazaarBoxes.push({
      ownerId:p.id,
      team:p.team,
      bot:Boolean(p.bot),
      x:clamp(p.x + aim.x * 170, 35, room.arena.width - 35),
      y:clamp(p.y + aim.y * 170, 35, room.arena.height - 35),
      expiresAt:now + 5000
    });
  } else if (p.character === "masterv") {
    const aim = aimDirection(p);
    dashPlayer(room.arena, p, aim.x * 150, aim.y * 150);
    p.shieldUntil = Math.max(p.shieldUntil || 0, now + 4200);
    p.damageBoostUntil = Math.max(p.damageBoostUntil || 0, now + 4200);
    p.hitUntil = now + 420;
  }
  else { const len=Math.hypot(p.input.x,p.input.y)||1; dashPlayer(room.arena,p,p.input.x/len*105,p.input.y/len*105); }
}
function projectileCanHit(room, projectile, target) {
  return target.id !== projectile.ownerId && !projectile.hitIds?.includes(target.id) && target.alive && target.connected && !(isTeamCombatMode(room) && target.team && target.team === projectile.team) && !(room.mode === "survival" && Boolean(target.bot) === projectile.bot);
}
function hitWithProjectile(room, projectile, victim) {
  if (protectInvinciblePlayer(victim)) return;
  const attacker = room.players.get(projectile.ownerId);
  let damage = projectile.damage;
  const now = Date.now();
  if (now < (victim.cardboardShieldUntil || 0) && (victim.cardboardShieldHp || 0) > 0) {
    const absorbed = Math.min(victim.cardboardShieldHp, damage);
    victim.cardboardShieldHp -= absorbed;
    damage -= absorbed;
    if (victim.cardboardShieldHp <= 0) victim.cardboardShieldUntil = 0;
  }
  damage *= victim.character !== "blaze" && now < victim.shieldUntil ? .35 : 1;
  victim.health -= damage;
  if (projectile.freezeBuild) {
    victim.freezeMeter = Math.min(100, (victim.freezeMeter || 0) + projectile.freezeBuild);
    victim.freezeUntil = now + 2500;
    if (victim.freezeMeter >= 100) {
      victim.hauntedUntil = Math.max(victim.hauntedUntil || 0, now + 1200);
      victim.freezeMeter = 65;
    }
  }
  victim.hitUntil = now + 150;
  if (attacker && !attacker.bot && PLAYABLE_CHARACTERS.has(attacker.character)) attacker.specialCharge = Math.min(SPECIAL_HITS, (attacker.specialCharge || 0) + 1);
  if (victim.health <= 0) kill(room, victim, attacker || null);
}
function reflectLaser(arena, projectile, nextX, nextY) {
  if ((projectile.bounces || 0) <= 0) return false;
  projectile.bounces -= 1;
  const hitVertical = nextX < 0 || nextX > arena.width || blocked(arena, nextX, projectile.y, projectile.radius);
  const hitHorizontal = nextY < 0 || nextY > arena.height || blocked(arena, projectile.x, nextY, projectile.radius);
  if (hitVertical || (!hitVertical && !hitHorizontal)) projectile.vx *= -1;
  if (hitHorizontal || (!hitVertical && !hitHorizontal)) projectile.vy *= -1;
  projectile.x = clamp(projectile.x, 4, arena.width - 4);
  projectile.y = clamp(projectile.y, 4, arena.height - 4);
  projectile.remaining = Math.max(projectile.remaining, 90);
  return true;
}
function updateProjectiles(room) {
  const arena = room.arena;
  for (let i=room.game.projectiles.length-1;i>=0;i--) {
    const projectile = room.game.projectiles[i], owner = room.players.get(projectile.ownerId);
    if (projectile.type === "boomerang" && projectile.returning) {
      if (!owner) {
        room.game.projectiles.splice(i, 1);
        continue;
      }
      const dx = owner.x - projectile.x, dy = owner.y - projectile.y, distance = Math.hypot(dx, dy) || 1;
      if (distance < playerRadius(owner) + projectile.radius + 4) {
        if (owner.boomerangActive === projectile.id) owner.boomerangActive = false;
        room.game.projectiles.splice(i, 1);
        continue;
      }
      const speed = projectile.returnSpeed || PROJECTILE_SPEED;
      projectile.vx = dx / distance * speed;
      projectile.vy = dy / distance * speed;
    }
    const nextX = projectile.x + projectile.vx, nextY = projectile.y + projectile.vy;
    const stepDistance = Math.hypot(projectile.vx, projectile.vy);
    projectile.remaining -= projectile.returning ? 0 : stepDistance;
    if (projectile.expand) {
      projectile.traveled = (projectile.traveled || 0) + stepDistance;
      projectile.radius = Math.min(projectile.maxRadius || projectile.radius, (projectile.baseRadius || projectile.radius) + projectile.traveled / 42);
    }
    const blockedPath = !projectile.returning && lineBlocked(arena, projectile.x, projectile.y, nextX, nextY, projectile.radius);
    if (projectile.remaining <= 0 || nextX < 0 || nextX > arena.width || nextY < 0 || nextY > arena.height || blockedPath) {
      if (projectile.type === "laser" && projectile.remaining > 0 && reflectLaser(arena, projectile, nextX, nextY)) continue;
      if (projectile.type === "boomerang" && !projectile.returning) {
        projectile.returning = true;
        projectile.remaining = Infinity;
        continue;
      }
      if (projectile.type === "boomerang" && owner?.boomerangActive === projectile.id) owner.boomerangActive = false;
      room.game.projectiles.splice(i, 1);
      continue;
    }
    projectile.x = nextX; projectile.y = nextY;
    const victim = [...room.players.values()].find(p => projectileCanHit(room, projectile, p) && Math.hypot(p.x-projectile.x,p.y-projectile.y) < playerRadius(p) + projectile.radius);
    if (victim) {
      hitWithProjectile(room, projectile, victim);
      if (projectile.type === "boomerang") {
        projectile.hitIds.push(victim.id);
        projectile.returning = true;
        projectile.remaining = Infinity;
      } else {
        room.game.projectiles.splice(i, 1);
      }
    }
  }
}
function pixelZoneCanAffect(room, zone, target) {
  return target.id !== zone.ownerId && target.alive && target.connected && !(isTeamCombatMode(room) && target.team && target.team === zone.team) && !(room.mode === "survival" && Boolean(target.bot) === zone.bot);
}
function updatePixelZones(room, now) {
  room.game.pixelZones ||= [];
  room.game.pixelZones = room.game.pixelZones.filter(zone => now < zone.endsAt);
  for (const zone of room.game.pixelZones) {
    if (now < zone.landsAt) continue;
    for (const player of room.players.values()) {
      if (pixelZoneCanAffect(room, zone, player) && Math.hypot(player.x - zone.x, player.y - zone.y) < zone.radius) {
        player.confusedUntil = Math.max(player.confusedUntil || 0, now + 3000);
      }
    }
  }
}
function sameIceSide(room, zone, target) {
  return target.id === zone.ownerId || (isTeamCombatMode(room) && target.team && target.team === zone.team) || (room.mode === "survival" && Boolean(target.bot) === zone.bot);
}
function sameBazaarSide(room, box, target) {
  return target.id === box.ownerId || (isTeamCombatMode(room) && target.team && target.team === box.team) || (room.mode === "survival" && Boolean(target.bot) === box.bot);
}
function storeBazaarBuff(player, now) {
  if (player.bazaarBuff) return false;
  player.bazaarBuff = ["shield", "heal", "damage"][Math.floor(Math.random() * 3)];
  player.hitUntil = now + 260;
  return true;
}
function useBazaarBuff(player, now) {
  const buff = player.bazaarBuff;
  if (!buff) return false;
  player.bazaarBuff = "";
  if (buff === "shield") player.shieldUntil = Math.max(player.shieldUntil || 0, now + 5000);
  else if (buff === "heal") player.health = Math.min(player.maxHealth, player.health + 34);
  else player.damageBoostUntil = Math.max(player.damageBoostUntil || 0, now + 5000);
  player.hitUntil = now + 260;
  return true;
}
function updateBazaarBoxes(room, now) {
  room.game.bazaarBoxes ||= [];
  room.game.bazaarBoxes = room.game.bazaarBoxes.filter(box => now < box.expiresAt);
  for (let i = room.game.bazaarBoxes.length - 1; i >= 0; i--) {
    const box = room.game.bazaarBoxes[i];
    const collector = [...room.players.values()].find(player => !player.bazaarBuff && player.alive && player.connected && sameBazaarSide(room, box, player) && Math.hypot(player.x - box.x, player.y - box.y) < 34);
    if (collector && storeBazaarBuff(collector, now)) {
      room.game.bazaarBoxes.splice(i, 1);
    }
  }
}
function updateIceZones(room, now) {
  room.game.iceZones ||= [];
  room.game.iceZones = room.game.iceZones.filter(zone => now < zone.endsAt);
}
function iceEffectFor(room, player) {
  for (const zone of room.game.iceZones || []) {
    if (Math.hypot(player.x - zone.x, player.y - zone.y) < zone.radius) {
      return sameIceSide(room, zone, player) ? "friendly" : "enemy";
    }
  }
  return "";
}
function spawnBot(room, now, team = null) {
  const count = [...room.players.values()].filter(p => p.bot).length;
  const cap = isTeamCombatMode(room) ? 6 : Math.min(9, 2 + Math.floor(room.game.wave / 2));
  if (count >= cap) return;
  const arena = room.arena, edge = Math.floor(Math.random() * 4), spot = edge === 0 ? { x: 30, y: 80 + Math.random() * (arena.height-160) } : edge === 1 ? { x: arena.width-30, y: 80 + Math.random() * (arena.height-160) } : edge === 2 ? { x: 90 + Math.random() * (arena.width-180), y: 30 } : { x: 90 + Math.random() * (arena.width-180), y: arena.height-30 };
  const hp = CHARACTERS.grunt.hp + Math.min(24, room.game.wave * 2), id = `bot-${room.code}-${room.game.botSerial++}`;
  room.players.set(id, { id, socketId:null, name:`Bot ${room.game.botSerial}`, character:"grunt", bot:true, color:team === "blue" ? "#36c8ff" : "#f07167", team, x:spot.x, y:spot.y, maxHealth:hp, health:hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false}, lastAttack:0, lastSpecial:false, shieldUntil:0, connected:true });
  room.game.nextBotAt = now + Math.max(900, 2300 - room.game.wave * 95);
}
function updateBots(room) {
  for (const bot of [...room.players.values()].filter(p => p.bot && p.alive)) {
    let target = null, distance = Infinity;
    for (const candidate of room.players.values()) {
      if (candidate.id === bot.id || !candidate.alive || !candidate.connected) continue;
      if (room.mode === "survival" && Boolean(candidate.bot) === Boolean(bot.bot)) continue;
      if (sameTeam(room, bot, candidate)) continue;
      const d = Math.hypot(candidate.x - bot.x, candidate.y - bot.y);
      if (d < distance) { target = candidate; distance = d; }
    }
    if (!target) { bot.input = { x:0, y:0, attack:false, special:false }; continue; }
    const len = Math.hypot(target.x - bot.x, target.y - bot.y) || 1;
    bot.input.x = (target.x - bot.x) / len;
    bot.input.y = (target.y - bot.y) / len;
    bot.aimX = bot.input.x;
    bot.aimY = bot.input.y;
    bot.input.attack = distance < CHARACTERS[bot.character].range;
  }
}
function updateSurvival(room, now) {
  room.game.wave = Math.floor((now - room.game.startedAt) / 15000) + 1;
  const bobWinner = [...room.players.values()].find(p => !p.bot && p.alive && p.character === "blaze");
  if (room.game.wave > BOB_UNLOCK_WAVE && bobWinner && !room.game.endedAt) {
    room.game.winner = bobWinner.id;
    room.game.endedAt = now;
    room.game.rewardCharacter = "boomer";
    recordSurvivalLeaders(room);
    return;
  }
  if (now >= room.game.nextBotAt) spawnBot(room, now);
}
function ensureTeamBots(room, now) {
  if (!isTeamCombatMode(room)) return;
  if (!humanPlayers(room).some(p => p.connected)) return;
  const canSpawn = now >= room.game.nextBotAt;
  for (const team of ["red", "blue"]) {
    let teamPlayers = [...room.players.values()].filter(p => p.team === team);
    while (teamPlayers.length > 3) {
      const extraBot = teamPlayers.find(p => p.bot);
      if (!extraBot) break;
      room.players.delete(extraBot.id);
      teamPlayers = [...room.players.values()].filter(p => p.team === team);
    }
    if (!canSpawn) continue;
    while (teamPlayers.length < 3) {
      spawnBot(room, now, team);
      teamPlayers = [...room.players.values()].filter(p => p.team === team);
    }
  }
}
function updateRoom(room, now) {
  if (room.game.winner || room.game.winnerTeam) return;
  if (room.mode === "survival") updateSurvival(room, now);
  else ensureTeamBots(room, now);
  updateBots(room);
  const center = arenaCenter(room.arena);
  if (room.mode === "showdown") room.game.safeRadius = Math.max(90, arenaSafeRadius(room.arena) - (now-room.game.startedAt)/520);
  updateProjectiles(room);
  updateIceZones(room, now);
  updatePixelZones(room, now);
  updateBazaarBoxes(room, now);
  for (const p of room.players.values()) {
    if (!p.connected) continue;
    protectInvinciblePlayer(p);
    if (!p.alive && p.ghost) {
      // Dead players remain as non-combat ghosts. SPECIAL becomes a visible warning ping.
      const ghostSpeed = CHARACTERS[p.character].speed * .72;
      movePlayer(room.arena, p, p.input.x*ghostSpeed, p.input.y*ghostSpeed);
      if (now >= p.nextGhostItemAt) { p.ghostItem = GHOST_ITEMS[Math.floor(Math.random()*GHOST_ITEMS.length)]; p.nextGhostItemAt = now + 30_000; }
      if (p.input.special && !p.lastSpecial) {
        const target = room.players.get(p.ghostTargetId);
        if (p.ghostItem && target?.alive) {
          const item = p.ghostItem; p.ghostItem = false;
          if (item === "wall") target.wallUntil = now + 3_000;
          if (item === "ink") target.inkUntil = now + 2_700;
          if (item === "slow") target.hauntedUntil = now + 4_000;
          if (item === "teleport") { const spot=randomSpot(room.arena); target.x=spot.x; target.y=spot.y; }
          if (item === "shareHealth") { const amount=Math.min(34,Math.max(0,target.health-1)); const others=[...room.players.values()].filter(other=>other.alive&&other.id!==target.id); target.health-=amount; for(const other of others) other.health=Math.min(other.maxHealth,other.health+amount/Math.max(1,others.length)); }
        }
        else p.pingUntil = now + 1200;
      }
      p.lastSpecial = p.input.special;
      continue;
    }
    if (!p.alive) { // Non-elimination modes keep their fast respawn behavior.
      if (now-p.diedAt > 2200) { const spot=randomSpot(room.arena), s=CHARACTERS[p.character]; Object.assign(p,{x:spot.x,y:spot.y,health:s.hp,alive:true,ghost:false}); }
      continue;
    }
    if (p.bot) {
      p.input.special = false;
      p.specialCharge = 0;
      p.bazaarBuff = "";
    }
    if ((p.freezeMeter || 0) > 0 && now > (p.freezeUntil || 0)) p.freezeMeter = Math.max(0, p.freezeMeter - 0.9);
    const stats=CHARACTERS[p.character], shieldBoost=p.character==="blaze" && now < (p.cardboardShieldUntil||0) && (p.cardboardShieldHp||0)>0 ? 1.18 : 1, moveScale=now < (p.wallUntil||0) ? 0 : now < (p.hauntedUntil||0) ? .58 : shieldBoost, confusion=now < (p.confusedUntil||0) ? -1 : 1, iceEffect=iceEffectFor(room,p), iceSpeed=iceEffect==="friendly" ? 1.3 : iceEffect==="enemy" ? .55 : 1;
    const targetDx = p.input.x*stats.speed*moveScale*confusion*iceSpeed, targetDy = p.input.y*stats.speed*moveScale*confusion*iceSpeed;
    if (iceEffect === "enemy") {
      const maxSlide = stats.speed * .78;
      p.iceVx = clamp((p.iceVx || 0) * .9 + targetDx * .1, -maxSlide, maxSlide);
      p.iceVy = clamp((p.iceVy || 0) * .9 + targetDy * .1, -maxSlide, maxSlide);
      movePlayer(room.arena, p, p.iceVx, p.iceVy);
    } else {
      p.iceVx = targetDx; p.iceVy = targetDy;
      movePlayer(room.arena, p, targetDx, targetDy);
    }
    if (p.input.attack) attack(room,p,now);
    if (p.input.special && !p.lastSpecial && p.bazaarBuff) useBazaarBuff(p,now);
    else if (p.input.special) special(room,p,now);
    p.lastSpecial=p.input.special;
    if (room.mode === "showdown" && Math.hypot(p.x-center.x,p.y-center.y) > room.game.safeRadius) { p.health -= .55; if (p.health<=0) kill(room,p,null); }
    for (let i=room.game.items.length-1;i>=0;i--) { const item=room.game.items[i]; if (Math.hypot(item.x-p.x,item.y-p.y)<32) { room.game.items.splice(i,1); if(item.type==="gem")p.gems++; else p.coins++; } }
    if (room.mode === "gems") {
      if (teamGems(room, "red") >= 10) endTeam(room, "red");
      if (teamGems(room, "blue") >= 10) endTeam(room, "blue");
    } else if (room.mode === "coins" && p.coins >= 15) end(room,p);
    if (room.mode === "soloZone" && Math.hypot(p.x-center.x,p.y-center.y)<room.arena.zoneRadius) { room.game.zoneScore[p.id]=(room.game.zoneScore[p.id]||0)+1/30; if(room.game.zoneScore[p.id]>=15) end(room,p); }
    protectInvinciblePlayer(p);
  }
  if (room.mode === "zone") {
    const inside = [...room.players.values()].filter(p=>p.alive&&Math.hypot(p.x-center.x,p.y-center.y)<room.arena.zoneRadius);
    const red = inside.some(p=>p.team==="red"), blue = inside.some(p=>p.team==="blue");
    if (red !== blue) room.game.zoneScore[red?"red":"blue"] += 1/30;
    if (room.game.zoneScore.red >= 35) endTeam(room,"red");
    if (room.game.zoneScore.blue >= 35) endTeam(room,"blue");
  }
  if ((room.mode==="gems"||room.mode==="coins") && room.game.items.length<10 && now>room.game.nextItemAt) { room.game.items.push({ ...randomSpot(room.arena), type:room.mode==="gems"?"gem":"coin" }); room.game.nextItemAt=now+700; }
  broadcast(room);
}
io.on("connection", socket => {
  socket.on("host:create", (data={}, ack=()=>{}) => { if (typeof data === "function") { ack=data; data={}; } const room=createRoom(socket.id,data.mode); socket.join(room.code); socket.data.hostRoom=room.code; ack({ok:true,code:room.code,players:[],meta:meta(room)}); });
  socket.on("player:create", ({playerId,name,character,mode,accountEmail}={}, ack=()=>{}) => { const room=createRoom(null,mode); joinPlayer(socket,room.code,playerId,name,character,accountEmail,ack); });
  socket.on("player:autoJoin", ({playerId,name,character,mode,accountEmail}={}, ack=()=>{}) => {
    const selectedMode = MODES[mode] ? mode : "survival";
    const room = selectedMode === "survival" ? createRoom(null, selectedMode) : findOpenRoom(selectedMode) || createRoom(null, selectedMode);
    joinPlayer(socket, room.code, playerId, name, character, accountEmail, ack);
  });
  socket.on("player:join", ({code:roomCode,playerId,name,character,accountEmail}={}, ack=()=>{}) => joinPlayer(socket,String(roomCode||"").trim().toUpperCase(),playerId,name,character,accountEmail,ack));
  socket.on("player:leave", ({code:roomCode,playerId}={}, ack=()=>{}) => {
    const ref = socketIndex.get(socket.id);
    const code = String(roomCode || ref?.code || "").trim().toUpperCase();
    const id = String(playerId || ref?.playerId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    const room = rooms.get(code);
    if (!room || !id) return ack({ ok:false });
    const player = room.players.get(id);
    if (!player || player.socketId !== socket.id) return ack({ ok:false });
    socket.leave(code);
    socketIndex.delete(socket.id);
    removePlayer(room, id);
    ack({ ok:true });
  });
  socket.on("admin:identify", ({ roomCode, playerId, accountEmail } = {}, ack=()=>{}) => {
    const room = rooms.get(String(roomCode || "").trim().toUpperCase()), ref = socketIndex.get(socket.id);
    const p = room?.players.get(String(playerId || ref?.playerId || ""));
    if (!room || !p || p.socketId !== socket.id) return ack({ ok:false, error:"Player not found" });
    p.accountEmail = normalizeEmail(accountEmail);
    ack({ ok:true, admin:isAdminEmail(p.accountEmail), admins:adminList() });
    broadcast(room);
  });
  socket.on("admin:check", (data={}, ack=()=>{}) => {
    const email = normalizeEmail(data.accountEmail);
    ack({ ok:true, admin:isAdminEmail(email), admins:adminList() });
  });
  socket.on("admin:list", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket, data)) return ack({ ok:false, error:"Admin only" });
    ack({ ok:true, admins:adminList() });
  });
  socket.on("admin:addAdmin", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket, data)) return ack({ ok:false, error:"Admin only" });
    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) return ack({ ok:false, error:"Invalid Google account" });
    ADMIN_EMAILS.add(email);
    saveAdminEmails();
    io.emit("admin:updated", { admins:adminList() });
    for (const room of rooms.values()) broadcast(room);
    ack({ ok:true, admins:adminList() });
  });
  socket.on("admin:removeAdmin", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket, data)) return ack({ ok:false, error:"Admin only" });
    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) return ack({ ok:false, error:"Invalid Google account" });
    if (isOwnerAdminEmail(email)) return ack({ ok:false, error:"Owner admin cannot be removed" });
    ADMIN_EMAILS.delete(email);
    saveAdminEmails();
    io.emit("admin:updated", { admins:adminList() });
    for (const room of rooms.values()) broadcast(room);
    ack({ ok:true, admins:adminList() });
  });
  socket.on("admin:findPlayer", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket, data)) return ack({ ok:false, error:"Admin only" });
    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) return ack({ ok:false, error:"Invalid Google account" });
    for (const room of rooms.values()) {
      const target = [...room.players.values()].find(player => !player.bot && normalizeEmail(player.accountEmail) === email);
      if (target) return ack({ ok:true, roomCode:room.code, targetId:target.id, name:target.name });
    }
    ack({ ok:false, error:"Player not found" });
  });
  socket.on("admin:grantCharacter", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack), character = String(data.character || "");
    if (!room) return;
    if (!PLAYABLE_CHARACTERS.has(character)) return ack({ ok:false, error:"Unknown character" });
    const target = room.players.get(String(data.targetId || ""));
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    const ratio = target.maxHealth ? target.health / target.maxHealth : 1, stats = CHARACTERS[character];
    target.character = character;
    target.maxHealth = stats.hp;
    target.health = Math.min(stats.hp, Math.max(1, Math.round(stats.hp * ratio)));
    if (target.socketId) io.to(target.socketId).emit("admin:characterGranted", { character });
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:revokeCharacter", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack), character = String(data.character || "");
    if (!room) return;
    if (!PLAYABLE_CHARACTERS.has(character) || character === "blaze") return ack({ ok:false, error:"Unknown character" });
    const target = room.players.get(String(data.targetId || ""));
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    if (target.character === character) {
      const stats = CHARACTERS.blaze;
      target.character = "blaze";
      target.maxHealth = stats.hp;
      target.health = Math.min(stats.hp, Math.max(1, target.health));
    }
    if (target.socketId) io.to(target.socketId).emit("admin:characterRevoked", { character });
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:resetProgress", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = room.players.get(targetId);
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    if (target.socketId) io.to(target.socketId).emit("admin:progressReset");
    ack({ ok:true });
  });
  socket.on("admin:allowRename", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = room.players.get(targetId);
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    if (target.socketId) io.to(target.socketId).emit("admin:renameAllowed");
    ack({ ok:true });
  });
  socket.on("admin:banPlayer", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = room.players.get(targetId);
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    if (isAdminEmail(target.accountEmail)) return ack({ ok:false, error:"Cannot ban admin" });
    room.bannedPlayerIds.add(targetId);
    const targetEmail = normalizeEmail(target.accountEmail);
    if (targetEmail) room.bannedEmails.add(targetEmail);
    if (target.socketId) {
      io.to(target.socketId).emit("admin:banned");
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) targetSocket.leave(room.code);
      socketIndex.delete(target.socketId);
    }
    removePlayer(room, targetId);
    ack({ ok:true });
  });
  socket.on("admin:restartGame", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    for (const player of [...room.players.values()]) {
      if (player.bot) room.players.delete(player.id);
      else resetHumanForGame(room, player);
    }
    room.game = gameFor(room.mode, room.arena);
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("player:input", payload => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), p=room&&room.players.get(ref.playerId); if(!p||!Array.isArray(payload))return; const x=clamp(Number(payload[0])||0,-1,1), y=clamp(Number(payload[1])||0,-1,1), aimX=clamp(Number(payload[4])||0,-1,1), aimY=clamp(Number(payload[5])||0,-1,1); p.input={x,y,attack:Boolean(payload[2]),special:Boolean(payload[3])}; if(Math.hypot(aimX,aimY)>.12){p.aimX=aimX;p.aimY=aimY;} else if(Math.hypot(x,y)>.12){p.aimX=x;p.aimY=y;} });
  socket.on("ghost:target", ({ targetId } = {}) => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), ghost=room&&room.players.get(ref.playerId), target=room&&room.players.get(String(targetId||"")); if (!ghost?.ghost || !target?.alive || ghost.id===target.id) return; ghost.ghostTargetId=target.id; });
  socket.on("disconnect", () => { const host=socket.data.hostRoom; if(host&&rooms.get(host)?.hostSocketId===socket.id){io.to(host).emit("room:closed");rooms.delete(host);} const ref=socketIndex.get(socket.id);socketIndex.delete(socket.id);const room=ref&&rooms.get(ref.code),p=room&&room.players.get(ref.playerId);if(p&&p.socketId===socket.id){p.connected=false;p.input={x:0,y:0,attack:false,special:false};p.removeTimer=setTimeout(()=>removePlayer(room,ref.playerId),RECONNECT_MS);broadcast(room);} });
});
setInterval(()=>{const now=Date.now();for(const room of rooms.values())updateRoom(room,now);},1000/30);
server.listen(PORT,()=>console.log(`BrawkClaUi running at http://localhost:${PORT}/play/`));
