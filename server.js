"use strict";
const express = require("express"), http = require("http"), os = require("os"), fs = require("fs"), path = require("path"), crypto = require("crypto"), QRCode = require("qrcode");
const { Server } = require("socket.io");
const app = express(), server = http.createServer(app), io = new Server(server, { cors: { origin: "*" } });
const PORT = Number(process.env.PORT) || 3000, RECONNECT_MS = 30_000, MAX_PLAYERS = 8, SPECIAL_HITS = 5, AMMO_MAX = 5, PROJECTILE_SPEED = 12, BOB_UNLOCK_WAVE = 10;
const BOT_DAMAGE_SCALE = 0.62, BOT_MOVE_SCALE = 0.82, BOT_RANGE_SCALE = 0.82;
const rooms = new Map(), socketIndex = new Map(), lobbyPlayers = new Map(), nameLocks = new Map();
const survivalLeaders = [];
const COLORS = ["#ff5964", "#36c8ff", "#ffd54a", "#a875ff", "#52e084", "#ff8e4f", "#fa73bd", "#80a7ff"];
const OWNER_ADMIN_EMAIL = "zurtzilhagever@gmail.com";
const ADMIN_FILE = path.join(__dirname, "admins.json");
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "brawlclaui";
const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const firebaseCertCache = { expiresAt: 0, certs: {} };
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
  ari: { name: "\u05d0\u05e8\u05d9", hp: 168, speed: 3.35, damage: 22, range: 112, rate: 720, special: "Lion Slash" },
  skyfalcon: { name: "\u05d1\u05d6 \u05d4\u05e9\u05de\u05d9\u05d9\u05dd", hp: 92, speed: 4.18, damage: 18, range: 560, rate: 660, special: "Golden Cyclone" },
  seashark: { name: "\u05db\u05e8\u05d9\u05e9 \u05d4\u05d9\u05dd", hp: 124, speed: 3.78, damage: 17, range: 440, rate: 680, special: "Abyss Predator" },
  shoopi: { name: "\u05e9\u05d5\u05e4\u05d9", hp: 86, speed: 4.32, damage: 13, range: 585, rate: 720, special: "Wind Spiral" },
  tuli: { name: "\u05ea\u05d5\u05dc\u05d9 \u05ea\u05d5\u05dc\u05d9", hp: 94, speed: 4.45, damage: 12, range: 520, rate: 610, special: "Invincible Cat Run" },
  gack: { name: "\u05d2\u05d0\u05e7", hp: 132, speed: 3.65, damage: 16, range: 430, rate: 760, special: "Chameleon Cloak" },
  masterv: { name: "Master V", hp: 128, speed: 3.9, damage: 18, range: 470, rate: 620, special: "Ultimate Master" },
  mash: { name: "\u05de\u05d0\u05e9", hp: 78, speed: 2.8, damage: 7, range: 295, rate: 1050, special: "Star Drill" },
  grunt: { name: "Grunt", hp: 70, speed: 2.35, damage: 8, range: 44, rate: 760, special: "None" }
};
const PLAYABLE_CHARACTERS = new Set(["blaze", "boomer", "fangli", "pixel", "tank", "bazaar", "ari", "skyfalcon", "seashark", "shoopi", "tuli", "gack", "masterv"]);
const ADMIN_ONLY_CHARACTERS = new Set(["ari", "skyfalcon", "seashark", "masterv"]);
const MAX_CHARACTER_LEVEL = 10;
const SKINS = new Set(["default", "gold", "shadow"]);
const AMMO_RELOAD_MS = {
  blaze: 900,
  bazaar: 1050,
  mash: 1450,
  fangli: 1250,
  boomer: 1450,
  pixel: 1600,
  tank: 1850,
  ari: 1700,
  skyfalcon: 1500,
  seashark: 1450,
  shoopi: 1350,
  tuli: 1180,
  gack: 1500,
  masterv: 1250,
  grunt: 1300
};
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
function normalizeCharacterLevel(value) { return clamp(Math.floor(Number(value) || 1), 1, MAX_CHARACTER_LEVEL); }
function normalizeSkin(value) { return SKINS.has(String(value || "")) ? String(value) : "default"; }
function statsFor(character, level = 1) {
  const base = CHARACTERS[character] || CHARACTERS.blaze;
  const boost = 1 + (normalizeCharacterLevel(level) - 1) * .05;
  return { ...base, hp: Math.round(base.hp * boost), damage: base.damage * boost };
}
function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }
function isValidEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value)); }
function isAdminEmail(value) { return ADMIN_EMAILS.has(normalizeEmail(value)); }
function isOwnerAdminEmail(value) { return normalizeEmail(value) === OWNER_ADMIN_EMAIL; }
function adminList() { return [...ADMIN_EMAILS].sort().map(email => ({ email, owner:isOwnerAdminEmail(email) })); }
function saveAdminEmails() { fs.writeFileSync(ADMIN_FILE, JSON.stringify([...ADMIN_EMAILS].sort(), null, 2)); }
function readJwtPart(part) {
  return JSON.parse(Buffer.from(String(part || ""), "base64url").toString("utf8"));
}
async function firebasePublicCerts() {
  if (Date.now() < firebaseCertCache.expiresAt && Object.keys(firebaseCertCache.certs).length) return firebaseCertCache.certs;
  const response = await fetch(FIREBASE_CERTS_URL);
  if (!response.ok) throw new Error("Firebase certs unavailable");
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1]) || 3600;
  firebaseCertCache.certs = await response.json();
  firebaseCertCache.expiresAt = Date.now() + Math.max(60, maxAge - 30) * 1000;
  return firebaseCertCache.certs;
}
async function verifyFirebaseToken(token) {
  const [encodedHeader, encodedPayload, encodedSignature] = String(token || "").split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
  const header = readJwtPart(encodedHeader);
  if (header.alg !== "RS256" || !header.kid) return null;
  const certs = await firebasePublicCerts();
  const cert = certs[header.kid];
  if (!cert) return null;
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();
  const signature = Buffer.from(encodedSignature, "base64url");
  if (!verifier.verify(cert, signature)) return null;
  const payload = readJwtPart(encodedPayload);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.aud !== FIREBASE_PROJECT_ID) return null;
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
  if (!payload.sub || payload.exp <= nowSeconds || payload.iat > nowSeconds + 60) return null;
  if (payload.email_verified === false) return null;
  return payload;
}
async function verifyAuthEmail(socket, data = {}) {
  const cached = normalizeEmail(socket.data.verifiedEmail);
  const tokenProvided = Object.prototype.hasOwnProperty.call(data, "authToken");
  const token = String(data.authToken || "").trim();
  if (tokenProvided && !token) {
    socket.data.verifiedEmail = "";
    return "";
  }
  if (!token) return cached;
  try {
    const decoded = await verifyFirebaseToken(token);
    const email = normalizeEmail(decoded.email);
    if (!email || decoded.email_verified === false) return "";
    socket.data.verifiedEmail = email;
    return email;
  } catch {
    socket.data.verifiedEmail = "";
    return "";
  }
}
function verifiedSocketEmail(socket) {
  return normalizeEmail(socket.data.verifiedEmail);
}
function isAdminActor(socket) {
  return isAdminEmail(verifiedSocketEmail(socket));
}
function protectInvinciblePlayer(player) {
  if (!isOwnerAdminEmail(player?.accountEmail) || !player.invincibleMode) return false;
  player.health = player.maxHealth;
  player.alive = true;
  player.ghost = false;
  player.ghostItem = false;
  player.freezeMeter = 0;
  player.inkUntil = 0;
  player.hauntedUntil = 0;
  player.wallUntil = 0;
  player.rootUntil = 0;
  player.confusedUntil = 0;
  player.invisibleUntil = 0;
  player.goldenArmorUntil = 0;
  player.hitUntil = 0;
  return true;
}
function hasFullInvincibility(player, now = Date.now()) {
  return protectInvinciblePlayer(player) || now < (player?.catRushUntil || 0);
}
function ammoReloadMs(player, now = Date.now()) {
  const base = AMMO_RELOAD_MS[player?.character] || 1200;
  return Math.max(220, base * (now < (player?.reloadBoostUntil || 0) ? .5 : 1));
}
function resetAmmo(player, now = Date.now()) {
  player.ammo = AMMO_MAX;
  player.nextAmmoAt = now + ammoReloadMs(player, now);
}
function updateAmmo(player, now = Date.now()) {
  if (!player) return;
  if (!Number.isFinite(player.ammo)) player.ammo = AMMO_MAX;
  player.ammo = clamp(player.ammo, 0, AMMO_MAX);
  if (player.ammo >= AMMO_MAX) {
    player.nextAmmoAt = now + ammoReloadMs(player, now);
    return;
  }
  if (!Number.isFinite(player.nextAmmoAt)) player.nextAmmoAt = now + ammoReloadMs(player, now);
  while (player.ammo < AMMO_MAX && now >= player.nextAmmoAt) {
    player.ammo += 1;
    player.nextAmmoAt += ammoReloadMs(player, player.nextAmmoAt);
  }
  if (player.ammo >= AMMO_MAX) player.nextAmmoAt = now + ammoReloadMs(player, now);
}
function consumeAmmo(player, now) {
  updateAmmo(player, now);
  if (player.ammo <= 0) return false;
  player.ammo -= 1;
  if (player.ammo < AMMO_MAX && (!Number.isFinite(player.nextAmmoAt) || player.nextAmmoAt <= now)) {
    player.nextAmmoAt = now + ammoReloadMs(player, now);
  }
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
function gameFor(mode, arena = arenaFor(mode)) { return { startedAt: Date.now(), winner: null, winnerTeam: null, rewardCharacter: null, items: mode === "gems" ? makeItems(arena, 12, "gem") : mode === "coins" ? makeItems(arena, 18, "coin") : [], projectiles: [], pixelZones: [], iceZones: [], bazaarBoxes: [], skyBombs: [], sharkSurges: [], windBursts: [], fireTrails: [], decoys: [], nextProjectileId: 0, nextDecoyId: 0, zoneScore: { red: 0, blue: 0 }, safeRadius: arenaSafeRadius(arena), nextItemAt: 0, nextBotAt: 0, botSerial: 0, wave: 0 }; }
function playerRadius(p) { const base = p.character === "ari" ? 27 : p.character === "skyfalcon" ? 21 : p.character === "seashark" ? 25 : p.character === "shoopi" ? 20 : p.character === "tuli" ? 21 : p.character === "gack" ? 26 : p.character === "tank" ? 26 : p.character === "grunt" ? 18 : p.character === "mash" ? 22 : 23; return Date.now() < (p.giantUntil || 0) ? base * 1.2 : base; }
function movePlayer(arena, p, dx, dy) {
  const radius = playerRadius(p);
  const nextX = clamp(p.x + dx, 28, arena.width - 28);
  if (Date.now() < (p.phaseUntil || 0) || !blocked(arena, nextX, p.y, radius)) p.x = nextX;
  const nextY = clamp(p.y + dy, 28, arena.height - 28);
  if (Date.now() < (p.phaseUntil || 0) || !blocked(arena, p.x, nextY, radius)) p.y = nextY;
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
function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1);
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
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
  return target.id !== source.id && target.alive && target.connected && !hasFullInvincibility(target) && !sameTeam(room, source, target) && !(room.mode === "survival" && Boolean(target.bot) === Boolean(source.bot));
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
function hasUnlimitedSpecial(player) {
  return isAdminEmail(player?.accountEmail);
}
function publicPlayer(p) { const now = Date.now(), unlimitedSpecial = hasUnlimitedSpecial(p), gackCloakReady = p.character === "gack" && now >= (p.gackCloakReadyAt || 0); updateAmmo(p, now); return { id:p.id, name:p.name, color:p.color, team:p.team, character:p.character, characterName:CHARACTERS[p.character]?.name || p.character, characterLevel:normalizeCharacterLevel(p.characterLevel), skin:normalizeSkin(p.skin), bot:p.bot, admin:isAdminEmail(p.accountEmail), invincible:isOwnerAdminEmail(p.accountEmail) && Boolean(p.invincibleMode), x:p.x, y:p.y, health:Math.ceil(p.health), maxHealth:p.maxHealth, alive:p.alive, ghost:p.ghost, ghostItem:p.ghostItem, ghostItemName:p.ghostItem && GHOST_ITEM_NAMES[p.ghostItem], ghostPing:now < (p.pingUntil || 0), haunted:now < (p.hauntedUntil || 0), walled:now < (p.wallUntil || 0), rooted:now < (p.rootUntil || 0), catRush:now < (p.catRushUntil || 0), inked:now < (p.inkUntil || 0), confused:now < (p.confusedUntil || 0), freezeMeter:Math.round(p.freezeMeter || 0), bazaarBuff:p.bazaarBuff || "", damageBoost:now < (p.damageBoostUntil || 0), goldenArmor:now < (p.goldenArmorUntil || 0), invisible:now < (p.invisibleUntil || 0), giant:now < (p.giantUntil || 0), phase:now < (p.phaseUntil || 0), hit:now < (p.hitUntil || 0), score:p.score, gems:p.gems, coins:p.coins, connected:p.connected, shield:now < p.shieldUntil || now < (p.goldenArmorUntil || 0), cardboardShield:now < (p.cardboardShieldUntil || 0) && (p.cardboardShieldHp || 0) > 0, ammo:p.ammo, ammoMax:AMMO_MAX, ammoReloadMs:ammoReloadMs(p, now), ammoReadyAt:p.nextAmmoAt || now, specialCharge:unlimitedSpecial || gackCloakReady ? SPECIAL_HITS : p.specialCharge || 0, specialRequired:SPECIAL_HITS, specialReady:unlimitedSpecial || gackCloakReady || (p.specialCharge || 0) >= SPECIAL_HITS }; }
function players(room) { return [...room.players.values()].map(publicPlayer); }
function humanPlayers(room) { return [...room.players.values()].filter(player => !player.bot); }
function teamGems(room, team) { return [...room.players.values()].filter(p => p.team === team).reduce((sum, p) => sum + (p.gems || 0), 0); }
function meta(room) { const mode = MODES[room.mode], survivalTime = room.mode === "survival" ? Math.floor(((room.game.endedAt || Date.now()) - room.game.startedAt) / 1000) : 0, winner = room.players.has(room.game.winner) ? publicPlayer(room.players.get(room.game.winner)) : room.game.winner, botCount = [...room.players.values()].filter(p => p.bot).length; return { mode:room.mode, modeName:mode.name, objective:mode.objective, target:mode.target, winner, winnerTeam:room.game.winnerTeam, rewardCharacter:room.game.rewardCharacter, items:room.game.items, projectiles:room.game.projectiles.map(({ id, x, y, vx, vy, type, color, returning, radius }) => ({ id, x, y, vx, vy, type, color, returning, radius })), pixelZones:(room.game.pixelZones || []).map(({ x, y, radius, landsAt, endsAt }) => ({ x, y, radius, landsAt, endsAt })), iceZones:(room.game.iceZones || []).map(({ x, y, radius, endsAt }) => ({ x, y, radius, endsAt })), bazaarBoxes:(room.game.bazaarBoxes || []).map(({ x, y, expiresAt }) => ({ x, y, expiresAt })), skyBombs:(room.game.skyBombs || []).map(({ x, y, radius, endsAt }) => ({ x, y, radius, endsAt })), sharkSurges:(room.game.sharkSurges || []).map(({ x1, y1, x2, y2, radius, startAt, breachAt, endsAt }) => ({ x1, y1, x2, y2, radius, startAt, breachAt, endsAt })), windBursts:(room.game.windBursts || []).map(({ x, y, radius, startsAt, endsAt }) => ({ x, y, radius, startsAt, endsAt })), fireTrails:(room.game.fireTrails || []).map(({ type, color, x, y, x1, y1, x2, y2, radius, endsAt }) => ({ type, color, x, y, x1, y1, x2, y2, radius, endsAt })), decoys:(room.game.decoys || []).map(({ id, character, x, y, team, bot, health, golden }) => ({ id, character, x, y, team, bot, health, golden })), safeRadius:room.game.safeRadius, zoneScore:room.game.zoneScore, gemScore:{ red:teamGems(room,"red"), blue:teamGems(room,"blue") }, survivalTime, wave:room.game.wave, botCount, arena:room.arena, survivalLeaders }; }
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
function cleanPlayerName(value, fallback = "Player") {
  return String(value || "").trim().slice(0, 14) || fallback;
}
function nameLockKey(playerId, accountEmail) {
  const email = normalizeEmail(accountEmail);
  return email || String(playerId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
}
function allowedPlayerName(playerId, requestedName, accountEmail, fallback = "Player") {
  const next = cleanPlayerName(requestedName, fallback), key = nameLockKey(playerId, accountEmail);
  if (!key || isAdminEmail(accountEmail)) return next;
  const locked = nameLocks.get(key);
  if (!locked) {
    nameLocks.set(key, { name:next, canRename:false });
    return next;
  }
  if (locked.name === next) return locked.name;
  if (locked.canRename) {
    locked.name = next;
    locked.canRename = false;
    return next;
  }
  return locked.name;
}
function allowPlayerRename(playerId, accountEmail, currentName = "") {
  const key = nameLockKey(playerId, accountEmail);
  if (!key || isAdminEmail(accountEmail)) return;
  const locked = nameLocks.get(key) || { name:cleanPlayerName(currentName), canRename:false };
  locked.canRename = true;
  nameLocks.set(key, locked);
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
function joinPlayer(socket, roomCode, playerId, name, character, accountEmail, invincibleMode, characterLevels = {}, skin = "default", ack) {
  lobbyPlayers.delete(socket.id);
  const room = rooms.get(roomCode), id = String(playerId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  if (!room) return ack({ ok:false, error:"Room not found" }); if (!id) return ack({ ok:false, error:"Invalid player" });
  const cleanEmail = normalizeEmail(accountEmail);
  if (room.bannedPlayerIds.has(id) || (cleanEmail && room.bannedEmails?.has(cleanEmail))) return ack({ ok:false, error:"You are banned from this room" });
  if (character && !PLAYABLE_CHARACTERS.has(character)) return ack({ ok:false, error:"Unknown character" });
  detachSocket(socket, roomCode);
  const requestedCharacter = PLAYABLE_CHARACTERS.has(character) ? character : "blaze";
  const selectedCharacter = ADMIN_ONLY_CHARACTERS.has(requestedCharacter) && !isAdminEmail(cleanEmail) ? "blaze" : requestedCharacter;
  const selectedLevel = normalizeCharacterLevel(characterLevels?.[selectedCharacter]);
  const selectedSkin = normalizeSkin(skin);
  let p = room.players.get(id);
  const maxHumans = isTeamCombatMode(room) ? 6 : MAX_PLAYERS;
  if (!p && humanPlayers(room).length >= maxHumans) return ack({ ok:false, error:"Room is full" });
  if (p) {
    clearTimeout(p.removeTimer); socketIndex.delete(p.socketId); p.socketId = socket.id; p.connected = true; p.accountEmail = cleanEmail || p.accountEmail || "";
    p.invincibleMode = isOwnerAdminEmail(p.accountEmail) && Boolean(invincibleMode);
    p.name = allowedPlayerName(id, name, p.accountEmail, p.name);
    if (p.character !== selectedCharacter || p.characterLevel !== selectedLevel) {
      const ratio = p.maxHealth ? p.health / p.maxHealth : 1, stats = statsFor(selectedCharacter, selectedLevel);
      p.character = selectedCharacter; p.characterLevel = selectedLevel; p.maxHealth = stats.hp; p.health = Math.min(stats.hp, Math.max(1, Math.round(stats.hp * ratio)));
      resetAmmo(p);
    }
    p.skin = selectedSkin;
  }
  else { const c = selectedCharacter, stats = statsFor(c, selectedLevel), spot = randomSpot(room.arena), team=chooseTeam(room), defaultName=`Player ${humanPlayers(room).length + 1}`, displayName=allowedPlayerName(id, name, cleanEmail, defaultName); p = { id, socketId:socket.id, accountEmail:cleanEmail, invincibleMode:isOwnerAdminEmail(cleanEmail) && Boolean(invincibleMode), name:displayName, character:c, characterLevel:selectedLevel, skin:selectedSkin, color:COLORS[room.players.size % COLORS.length], team, x:spot.x, y:spot.y, aimX:1, aimY:0, maxHealth:stats.hp, health:stats.hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false,skyMode:"bomb"}, lastAttack:0, lastSpecial:false, specialCharge:0, shieldUntil:0, catRushUntil:0, bazaarBuff:"", damageBoostUntil:0, connected:true }; resetAmmo(p); room.players.set(id, p); }
  socketIndex.set(socket.id, { code:roomCode, playerId:id }); socket.join(roomCode); ack({ ok:true, code:roomCode, player:publicPlayer(p), players:players(room), meta:meta(room) }); broadcast(room);
}
function adminRoom(socket, data = {}, ack = () => {}) {
  const ref = socketIndex.get(socket.id);
  const roomCode = String(data.roomCode || ref?.code || "").trim().toUpperCase();
  const room = rooms.get(roomCode);
  if (!room || !isAdminActor(socket)) {
    ack({ ok:false, error:"Admin only" });
    return null;
  }
  return room;
}
function adminTarget(room, data = {}, ack = () => {}) {
  const target = room.players.get(String(data.targetId || ""));
  if (!target || target.bot) {
    ack({ ok:false, error:"Player not found" });
    return null;
  }
  return target;
}
function adminLobbyTarget(socket, data = {}, ack = () => {}) {
  if (String(data.roomCode || "").toUpperCase() !== "LOBBY") return null;
  if (!isAdminActor(socket)) {
    ack({ ok:false, error:"Admin only" });
    return null;
  }
  const targetId = String(data.targetId || "");
  const target = [...lobbyPlayers.values()].find(player => player.targetId === targetId);
  if (!target) {
    ack({ ok:false, error:"Player not found" });
    return null;
  }
  return target;
}
const ADMIN_TEXT_COMMANDS = [
  "פקודות / עזרה - הצג את כל הפקודות",
  "תן ל<שחקן> את <דמות> - לדוגמה: תן לבננה את בומר",
  "הסר / הורד מ<שחקן> את <דמות> - לדוגמה: הורד מבננה את פיקסל"
];
const CHARACTER_ALIASES = {
  blaze:["blaze", "bob", "בוב", "בלייז"],
  boomer:["boomer", "בומר"],
  fangli:["fangli", "פאנגלי", "פנגלי"],
  pixel:["pixel", "פיקסל"],
  tank:["tank", "aurora", "אורורה", "טנק"],
  bazaar:["bazaar", "באזאר", "בזאר"],
  skyfalcon:["skyfalcon", "sky falcon", "בז", "בז השמיים"],
  seashark:["seashark", "sea shark", "shark", "כריש", "כריש הים"],
  masterv:["masterv", "master v", "מאסטר", "מאסטר וי"]
};
function repairCommandEncoding(value) {
  const text = String(value || "");
  if (!/[×Ø]/.test(text)) return text;
  try { return Buffer.from(text, "latin1").toString("utf8"); } catch { return text; }
}
function commandText(value) { return repairCommandEncoding(value).trim().toLowerCase().replace(/\s+/g, " "); }
function commandIncludesAny(text, words) { return words.some(word => text.includes(word)); }
function commandStartsWithAny(text, words) { return words.find(word => text === word || text.startsWith(`${word} `)) || ""; }
function cleanCommandTarget(value) {
  return commandText(value)
    .replace(/^(?:את|ל|מ)\s+/, "")
    .replace(/^[למ](?=.)/, "")
    .trim();
}
function characterFromCommand(value) {
  const text = commandText(value);
  for (const [id, aliases] of Object.entries(CHARACTER_ALIASES)) {
    if (aliases.some(alias => text === alias || text.includes(alias))) return id;
  }
  return "";
}
function splitTargetAndCharacter(value) {
  const raw = commandText(value);
  for (const separator of [" את ", " דמות ", " character "]) {
    const index = raw.lastIndexOf(separator);
    if (index > -1) return { target:cleanCommandTarget(raw.slice(0, index)), character:characterFromCommand(raw.slice(index + separator.length)) };
  }
  const parts = raw.split(" ");
  for (let size = Math.min(3, parts.length - 1); size >= 1; size--) {
    const character = characterFromCommand(parts.slice(-size).join(" "));
    if (character) return { target:cleanCommandTarget(parts.slice(0, -size).join(" ")), character };
  }
  return { target:cleanCommandTarget(raw), character:"" };
}
function commandTargets(data = {}) {
  const preferredRoomCode = String(data.roomCode || "").trim().toUpperCase();
  const list = [];
  const addRoom = room => {
    for (const player of room.players.values()) {
      if (!player.bot) list.push({ kind:"room", room, player, id:player.id, name:player.name, email:normalizeEmail(player.accountEmail) });
    }
  };
  if (preferredRoomCode && preferredRoomCode !== "LOBBY" && rooms.has(preferredRoomCode)) addRoom(rooms.get(preferredRoomCode));
  for (const room of rooms.values()) if (room.code !== preferredRoomCode) addRoom(room);
  for (const player of lobbyPlayers.values()) {
    list.push({ kind:"lobby", lobbyTarget:player, id:player.targetId, name:player.name, email:normalizeEmail(player.accountEmail) });
  }
  return list;
}
function findCommandTarget(data = {}, targetQuery = "") {
  const query = cleanCommandTarget(targetQuery);
  const targets = commandTargets(data);
  const byId = String(data.targetId || "");
  if (!query && byId) return targets.find(target => target.id === byId) || null;
  if (!query) return null;
  return targets.find(target => commandText(target.name) === query || target.email === query)
    || targets.find(target => commandText(target.name).includes(query) || query.includes(commandText(target.name)) || target.email.includes(query));
}
function commandTargetLabel(target) {
  return target?.name ? `${target.name}${target.kind === "lobby" ? " (לובי)" : ""}` : "";
}
function emitProgressReset(target) {
  if (target.kind === "lobby") io.to(target.lobbyTarget.socketId).emit("admin:progressReset");
  else if (target.player.socketId) io.to(target.player.socketId).emit("admin:progressReset");
}
function emitCharacterGrant(target, character) {
  if (target.kind === "lobby") io.to(target.lobbyTarget.socketId).emit("admin:characterGranted", { character });
  else if (target.player.socketId) io.to(target.player.socketId).emit("admin:characterGranted", { character });
}
function emitCharacterRevoke(target, character) {
  if (target.kind === "lobby") io.to(target.lobbyTarget.socketId).emit("admin:characterRevoked", { character });
  else if (target.player.socketId) io.to(target.player.socketId).emit("admin:characterRevoked", { character });
}
function runAdminTextCommand(socket, data = {}) {
  if (!isAdminActor(socket)) return { ok:false, error:"Admin only" };
  const raw = String(data.command || "").trim();
  const text = commandText(raw);
  if (!text) return { ok:false, error:"כתוב פקודה" };
  if (["פקודות", "עזרה", "help", "commands", "?", "/help"].includes(text)) {
    return { ok:true, keep:true, message:ADMIN_TEXT_COMMANDS.join("\n") };
  }
  const grantPrefix = commandStartsWithAny(text, ["תן", "פתח", "give", "grant", "unlock"]);
  const revokePrefix = commandStartsWithAny(text, ["הסר", "הורד", "תוריד", "תורידו", "נעל", "קח", "remove", "revoke", "lock", "take"]);
  if (grantPrefix || revokePrefix) {
    const parsed = splitTargetAndCharacter(text.slice((grantPrefix || revokePrefix).length));
    if (!parsed.character || !PLAYABLE_CHARACTERS.has(parsed.character)) return { ok:false, error:"לא זיהיתי דמות" };
    if (revokePrefix && parsed.character === "blaze") return { ok:false, error:"אי אפשר להסיר את בוב" };
    const target = findCommandTarget(data, parsed.target);
    if (!target) return { ok:false, error:"לא מצאתי שחקן" };
    if (grantPrefix) {
      if (target.kind === "room") {
        const ratio = target.player.maxHealth ? target.player.health / target.player.maxHealth : 1, stats = statsFor(parsed.character, target.player.characterLevel);
        target.player.character = parsed.character;
        target.player.characterLevel = normalizeCharacterLevel(target.player.characterLevel);
        target.player.maxHealth = stats.hp;
        target.player.health = Math.min(stats.hp, Math.max(1, Math.round(stats.hp * ratio)));
        resetAmmo(target.player);
        broadcast(target.room);
      }
      emitCharacterGrant(target, parsed.character);
      return { ok:true, message:`נתתי ל${commandTargetLabel(target)} את ${CHARACTERS[parsed.character].name}` };
    }
    if (target.kind === "room" && target.player.character === parsed.character) {
      const stats = statsFor("blaze", target.player.characterLevel);
      target.player.character = "blaze";
      target.player.characterLevel = normalizeCharacterLevel(target.player.characterLevel);
      target.player.maxHealth = stats.hp;
      target.player.health = Math.min(stats.hp, Math.max(1, target.player.health));
      resetAmmo(target.player);
      broadcast(target.room);
    }
    emitCharacterRevoke(target, parsed.character);
    return { ok:true, message:`הסרתי מ${commandTargetLabel(target)} את ${CHARACTERS[parsed.character].name}` };
  }

  return { ok:false, error:"לא זיהיתי פקודה. כתוב: פקודות" };
  const actionPrefix = commandStartsWithAny(text, ["רפא", "heal", "החיה", "חסל", "kill", "eliminate", "הקפא", "freeze", "הבא אליי", "bring here", "teleport", "אפס התקדמות", "reset progress", "העף", "kick", "באן", "ban"]);
  const target = findCommandTarget(data, text.slice(actionPrefix.length));
  if (!target) return { ok:false, error:"לא מצאתי שחקן" };

  if (["רפא", "heal", "החיה"].includes(actionPrefix)) {
    if (target.kind !== "room") return { ok:false, error:"ריפוי עובד רק בחדר משחק" };
    Object.assign(target.player, { alive:true, ghost:false, health:target.player.maxHealth, freezeMeter:0, freezeUntil:0 });
    resetAmmo(target.player);
    broadcast(target.room);
    return { ok:true, message:`ריפאתי את ${commandTargetLabel(target)}` };
  }
  if (["חסל", "kill", "eliminate"].includes(actionPrefix)) {
    if (target.kind !== "room") return { ok:false, error:"חיסול עובד רק בחדר משחק" };
    const ref = socketIndex.get(socket.id);
    kill(target.room, target.player, ref ? target.room.players.get(ref.playerId) || null : null);
    broadcast(target.room);
    return { ok:true, message:`חיסלתי את ${commandTargetLabel(target)}` };
  }
  if (["הקפא", "freeze"].includes(actionPrefix)) {
    if (target.kind !== "room") return { ok:false, error:"הקפאה עובדת רק בחדר משחק" };
    target.player.freezeMeter = 100;
    target.player.freezeUntil = Date.now() + 3200;
    target.player.input = { x:0, y:0, attack:false, special:false };
    broadcast(target.room);
    return { ok:true, message:`הקפאתי את ${commandTargetLabel(target)}` };
  }
  if (["הבא אליי", "bring here", "teleport"].includes(actionPrefix)) {
    if (target.kind !== "room") return { ok:false, error:"שיגור עובד רק בחדר משחק" };
    const ref = socketIndex.get(socket.id), actor = ref ? target.room.players.get(ref.playerId) : null;
    if (!actor || actor.bot) return { ok:false, error:"האדמין צריך להיות באותו חדר" };
    target.player.x = clamp(actor.x + 42, 28, target.room.arena.width - 28);
    target.player.y = clamp(actor.y, 28, target.room.arena.height - 28);
    target.player.alive = true;
    target.player.ghost = false;
    broadcast(target.room);
    return { ok:true, message:`הבאתי את ${commandTargetLabel(target)} אליך` };
  }
  if (["אפס התקדמות", "reset progress"].includes(actionPrefix)) {
    emitProgressReset(target);
    return { ok:true, message:`איפסתי התקדמות ל${commandTargetLabel(target)}` };
  }
  if (["העף", "kick"].includes(actionPrefix)) {
    const email = target.kind === "lobby" ? target.lobbyTarget.accountEmail : target.player.accountEmail;
    if (isAdminEmail(email)) return { ok:false, error:"אי אפשר להעיף אדמין" };
    if (target.kind === "lobby") {
      io.to(target.lobbyTarget.socketId).emit("admin:kicked");
      lobbyPlayers.delete(target.lobbyTarget.socketId);
    } else {
      if (target.player.socketId) {
        io.to(target.player.socketId).emit("admin:kicked");
        const targetSocket = io.sockets.sockets.get(target.player.socketId);
        if (targetSocket) targetSocket.leave(target.room.code);
        socketIndex.delete(target.player.socketId);
      }
      removePlayer(target.room, target.player.id);
    }
    return { ok:true, message:`העפתי את ${commandTargetLabel(target)}` };
  }
  if (["באן", "ban"].includes(actionPrefix)) {
    if (target.kind !== "room") return { ok:false, error:"באן עובד רק בחדר משחק" };
    if (isAdminEmail(target.player.accountEmail)) return { ok:false, error:"אי אפשר לתת באן לאדמין" };
    target.room.bannedPlayerIds.add(target.player.id);
    const targetEmail = normalizeEmail(target.player.accountEmail);
    if (targetEmail) target.room.bannedEmails.add(targetEmail);
    if (target.player.socketId) {
      io.to(target.player.socketId).emit("admin:banned");
      const targetSocket = io.sockets.sockets.get(target.player.socketId);
      if (targetSocket) targetSocket.leave(target.room.code);
      socketIndex.delete(target.player.socketId);
    }
    removePlayer(target.room, target.player.id);
    return { ok:true, message:`נתתי באן ל${commandTargetLabel(target)}` };
  }
  return { ok:false, error:"לא זיהיתי פקודה. כתוב: פקודות" };
}
function resetHumanForGame(room, player) {
  const stats = statsFor(player.character, player.characterLevel), spot = randomSpot(room.arena);
  Object.assign(player, {
    x:spot.x, y:spot.y, maxHealth:stats.hp, health:stats.hp, alive:true, ghost:false,
    ghostItem:false, ghostTargetId:null, score:0, gems:0, coins:0, specialCharge:0,
    shieldUntil:0, cardboardShieldUntil:0, cardboardShieldHp:0, hauntedUntil:0, wallUntil:0, rootUntil:0, catRushUntil:0,
    inkUntil:0, confusedUntil:0, freezeMeter:0, freezeUntil:0, bazaarBuff:"", damageBoostUntil:0, coinMagnetUntil:0, desertSpiceUntil:0, goldenArmorUntil:0, reloadBoostUntil:0, phaseUntil:0, bouncyUntil:0, giantUntil:0, giantBonusHp:0, giantDamageUntil:0, invisibleUntil:0, iceVx:0, iceVy:0, clawRushUntil:0, hitUntil:0, input:{x:0,y:0,attack:false,special:false,skyMode:"bomb"}
  });
  resetAmmo(player);
}
function end(room, winner) { if (room.game.winner || !winner) return; room.game.winner = winner.id; broadcast(room); }
function endTeam(room, team) { if (room.game.winner || room.game.winnerTeam) return; room.game.winnerTeam = team; broadcast(room); }
function kill(room, victim, killer) {
  if (hasFullInvincibility(victim)) return;
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
  const originX = Number.isFinite(options.originX) ? options.originX : attacker.x;
  const originY = Number.isFinite(options.originY) ? options.originY : attacker.y;
  const projectile = {
    id:`${room.code}-${room.game.nextProjectileId++}`,
    ownerId:attacker.id,
    bot:Boolean(attacker.bot),
    team:attacker.team,
    character:attacker.character,
    type:options.type || "shot",
    color:options.color || attacker.color,
    x:originX + dx * start,
    y:originY + dy * start,
    vx:dx * (options.speed || PROJECTILE_SPEED),
    vy:dy * (options.speed || PROJECTILE_SPEED),
    damage:(options.damage || stats.damage) * (attacker.bot ? BOT_DAMAGE_SCALE : 1) * (Date.now() < (attacker.damageBoostUntil || 0) ? 1.35 : 1) * (Date.now() < (attacker.giantDamageUntil || 0) ? 1.15 : 1),
    remaining:Math.max(24, (options.range || stats.range) - Math.max(0, start - 26)),
    radius:options.radius || 7,
    baseRadius:options.baseRadius || options.radius || 7,
    maxRadius:options.maxRadius || options.radius || 7,
    expand:Boolean(options.expand),
    traveled:0,
    bounces:options.bounces || 0,
    freezeBuild:options.freezeBuild || 0,
    rootMs:options.rootMs || 0,
    pierce:Boolean(options.pierce),
    returnSpeed:options.returnSpeed || options.speed || PROJECTILE_SPEED,
    returning:Boolean(options.returning),
    hitIds:[]
  };
  room.game.projectiles.push(projectile);
  if (options.lockOwnerUntilReturn) attacker.boomerangActive = projectile.id;
}
function explodeSkyFeather(room, feather) {
  const owner = room.players.get(feather.ownerId);
  if (!owner) return;
  const stats = CHARACTERS.skyfalcon;
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI * 2 * i / 8;
    pushProjectile(room, owner, Math.cos(angle), Math.sin(angle), stats, { type:"featherShard", color:"#ffd76a", originX:feather.x, originY:feather.y, start:0, speed:10, radius:5, range:125, damage:7 });
  }
}
function spawnSkyBomb(room, owner, x, y, now, radius = 122, duration = 2200) {
  room.game.skyBombs ||= [];
  room.game.skyBombs.push({ ownerId:owner.id, team:owner.team, bot:Boolean(owner.bot), x:clamp(x, radius, room.arena.width - radius), y:clamp(y, radius, room.arena.height - radius), radius, endsAt:now + duration });
}
function explodeDepthShot(room, source, x, y, now) {
  const owner = room.players.get(source.ownerId) || null;
  const effectSource = { ...source, id:source.ownerId };
  const radius = 58;
  room.game.sharkSurges ||= [];
  room.game.sharkSurges.push({ ownerId:source.ownerId, team:source.team, bot:Boolean(source.bot), x1:x, y1:y, x2:x, y2:y, radius, startAt:now, breachAt:now, endsAt:now + 420, hitDone:true });
  for (const target of room.players.values()) {
    if (!canAffectWithSpecial(room, effectSource, target)) continue;
    if (Math.hypot(target.x - x, target.y - y) > radius + playerRadius(target)) continue;
    target.health -= owner?.bot ? 10 : 18;
    target.hitUntil = now + 190;
    if (target.health <= 0) kill(room, target, owner);
  }
}
function attack(room, attacker, now) {
  const stats = statsFor(attacker.character, attacker.characterLevel), rate = stats.rate * (now < (attacker.reloadBoostUntil || 0) ? .5 : 1) * (attacker.character === "ari" && now < (attacker.clawRushUntil || 0) ? .52 : 1); if (attacker.character === "boomer" && attacker.boomerangActive) return; if (now - attacker.lastAttack < rate) return; if (!consumeAmmo(attacker, now)) return; attacker.lastAttack = now;
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
  if (attacker.character === "ari") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"claw", color:"#ff9a3c", start:34, speed:18, radius:18 });
    return;
  }
  if (attacker.character === "skyfalcon") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"goldFeather", color:"#ffd76a", start:34, speed:21, radius:6 });
    return;
  }
  if (attacker.character === "seashark") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"depthShot", color:"#37cfff", start:36, speed:16, radius:10, range:430, damage:stats.damage });
    return;
  }
  if (attacker.character === "shoopi") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"bindingFeather", color:"#ff83d1", start:34, speed:18, radius:8, range:stats.range, damage:stats.damage, rootMs:5000 });
    return;
  }
  if (attacker.character === "tuli") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"yarnBall", color:"#43b7ff", start:34, speed:17, radius:9, bounces:3, range:stats.range, damage:stats.damage });
    return;
  }
  if (attacker.character === "gack") {
    pushProjectile(room, attacker, dx, dy, stats, { type:"gackWave", color:"#76ff47", start:38, speed:15, radius:24, range:stats.range, damage:stats.damage, pierce:true });
    return;
  }
  if (attacker.character === "mash") {
    for (const angle of [-0.08, 0, 0.08]) {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      pushProjectile(room, attacker, dx * cos - dy * sin, dx * sin + dy * cos, stats, { type:"plasma", color:"#6eeaff", speed:12, radius:6 });
    }
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
  if (p.character === "mash" && p.bot) {
    if (now - (p.lastSpecialAt || 0) < 9000) return;
    p.lastSpecialAt = now;
    const aim = aimDirection(p);
    dashPlayer(room.arena, p, aim.x * 75, aim.y * 75);
    const radius = 82;
    room.arena.obstacles = room.arena.obstacles.filter(rect => !intersectsRect(p.x, p.y, radius, rect));
    for (const target of room.players.values()) {
      if (!canAffectWithSpecial(room, p, target) || Math.hypot(target.x - p.x, target.y - p.y) > radius + playerRadius(target)) continue;
      target.health -= p.bot ? 16 : 32;
      target.hitUntil = now + 260;
      const len = Math.hypot(target.x - p.x, target.y - p.y) || 1;
      dashPlayer(room.arena, target, (target.x - p.x) / len * 54, (target.y - p.y) / len * 54);
      if (target.health <= 0) kill(room, target, p);
    }
    return;
  }
  const unlimitedSpecial = hasUnlimitedSpecial(p);
  const gackCloak = p.character === "gack";
  if (gackCloak && now < (p.gackCloakReadyAt || 0)) return;
  if (p.lastSpecial || (!unlimitedSpecial && !gackCloak && (p.specialCharge || 0) < SPECIAL_HITS)) return;
  if (!unlimitedSpecial && !gackCloak) p.specialCharge = 0;
  p.lastSpecialAt = now;
  const stats = statsFor(p.character, p.characterLevel);
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
  } else if (p.character === "ari") {
    const aim = aimDirection(p), range = 320, radius = 74;
    const startX = p.x, startY = p.y;
    const endX = clamp(startX + aim.x * range, 30, room.arena.width - 30);
    const endY = clamp(startY + aim.y * range, 30, room.arena.height - 30);
    room.arena.obstacles = room.arena.obstacles.filter(rect => !segmentIntersectsExpandedRect(startX, startY, endX, endY, rect, radius * .58));
    room.game.fireTrails ||= [];
    room.game.fireTrails.push({ ownerId:p.id, team:p.team, bot:Boolean(p.bot), type:"slash", color:p.color, x:(startX + endX) / 2, y:(startY + endY) / 2, x1:startX, y1:startY, x2:endX, y2:endY, radius, endsAt:now + 680 });
    p.x = endX; p.y = endY; p.hitUntil = now + 360;
    for (const target of room.players.values()) {
      if (!canAffectWithSpecial(room, p, target)) continue;
      if (pointSegmentDistance(target.x, target.y, startX, startY, endX, endY) > radius + playerRadius(target)) continue;
      target.health -= p.bot ? 28 : 56;
      target.hitUntil = now + 280;
      const len = Math.hypot(target.x - startX, target.y - startY) || 1;
      dashPlayer(room.arena, target, (target.x - startX) / len * 62, (target.y - startY) / len * 62);
      if (target.health <= 0) kill(room, target, p);
    }
  } else if (p.character === "skyfalcon") {
    const aim = aimDirection(p);
    if (Math.random() < .5) {
      pushProjectile(room, p, aim.x, aim.y, stats, { type:"skyBombShot", color:"#ffd76a", start:34, speed:14, radius:13, range:450, damage:8 });
    } else {
      room.game.decoys ||= [];
      const distance = 96;
      room.game.decoys.push({ id:`${room.code}-decoy-${room.game.nextDecoyId++}`, ownerId:p.id, team:p.team, bot:Boolean(p.bot), character:p.character, x:clamp(p.x - aim.x * distance, 28, room.arena.width - 28), y:clamp(p.y - aim.y * distance, 28, room.arena.height - 28), health:stats.hp, damage:stats.damage, rate:stats.rate, golden:true, endsAt:now + 4200, lastAttack:0 });
      p.invisibleUntil = Math.max(p.invisibleUntil || 0, now + 1000);
      p.hitUntil = now + 260;
    }
  } else if (p.character === "seashark") {
    const aim = aimDirection(p), target = nearestEnemy(room, p);
    const targetDistance = target ? Math.hypot(target.x - p.x, target.y - p.y) : Infinity;
    const lockedTarget = targetDistance <= 560 ? target : null;
    const endX = lockedTarget ? lockedTarget.x : p.x + aim.x * 430;
    const endY = lockedTarget ? lockedTarget.y : p.y + aim.y * 430;
    room.game.sharkSurges ||= [];
    room.game.sharkSurges.push({
      ownerId:p.id,
      targetId:lockedTarget?.id || null,
      team:p.team,
      bot:Boolean(p.bot),
      x1:p.x,
      y1:p.y,
      x2:clamp(endX, 55, room.arena.width - 55),
      y2:clamp(endY, 55, room.arena.height - 55),
      radius:82,
      startAt:now,
      breachAt:now + 620,
      endsAt:now + 1220,
      hitDone:false
    });
    p.hitUntil = now + 320;
  } else if (p.character === "shoopi") {
    const radius = 210;
    room.game.windBursts ||= [];
    room.game.windBursts.push({ ownerId:p.id, team:p.team, bot:Boolean(p.bot), x:p.x, y:p.y, radius, startsAt:now, endsAt:now + 720 });
    p.hitUntil = now + 320;
    for (const target of room.players.values()) {
      if (!canAffectWithSpecial(room, p, target)) continue;
      const dx = target.x - p.x, dy = target.y - p.y, distance = Math.hypot(dx, dy) || 1;
      if (distance > radius + playerRadius(target)) continue;
      target.health -= p.bot ? 22 : 44;
      target.hitUntil = now + 260;
      dashPlayer(room.arena, target, dx / distance * 96, dy / distance * 96);
      if (target.health <= 0) kill(room, target, p);
    }
  } else if (p.character === "tuli") {
    const aim = aimDirection(p);
    p.catRushUntil = Math.max(p.catRushUntil || 0, now + 4200);
    p.hitUntil = now + 380;
    dashPlayer(room.arena, p, aim.x * 175, aim.y * 175);
  } else if (p.character === "gack") {
    p.invisibleUntil = now + 20000;
    p.gackCloakReadyAt = now + 24000;
    p.hitUntil = now + 260;
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
  if (hasFullInvincibility(victim)) return;
  const attacker = room.players.get(projectile.ownerId);
  let damage = projectile.damage;
  const now = Date.now();
  const originalDamage = damage;
  if (now < (victim.cardboardShieldUntil || 0) && (victim.cardboardShieldHp || 0) > 0) {
    const absorbed = Math.min(victim.cardboardShieldHp, damage);
    victim.cardboardShieldHp -= absorbed;
    damage -= absorbed;
    if (victim.cardboardShieldHp <= 0) victim.cardboardShieldUntil = 0;
  }
  if (now < (victim.goldenArmorUntil || 0)) {
    damage *= .35;
    if (attacker && attacker.alive && attacker.id !== victim.id) {
      attacker.health -= originalDamage * .2;
      attacker.hitUntil = now + 160;
      if (attacker.health <= 0) kill(room, attacker, victim);
    }
  } else damage *= victim.character !== "blaze" && now < victim.shieldUntil ? .35 : 1;
  victim.health -= damage;
  if (now < (victim.bouncyUntil || 0)) {
    const len = Math.hypot(victim.x - projectile.x, victim.y - projectile.y) || 1;
    dashPlayer(room.arena, victim, (victim.x - projectile.x) / len * 28, (victim.y - projectile.y) / len * 28);
  }
  if (projectile.freezeBuild) {
    victim.freezeMeter = Math.min(100, (victim.freezeMeter || 0) + projectile.freezeBuild);
    victim.freezeUntil = now + 2500;
    if (victim.freezeMeter >= 100) {
      victim.hauntedUntil = Math.max(victim.hauntedUntil || 0, now + 1200);
      victim.freezeMeter = 65;
    }
  }
  if (projectile.rootMs) victim.rootUntil = Math.max(victim.rootUntil || 0, now + projectile.rootMs);
  victim.hitUntil = now + 150;
  if (attacker?.character === "ari" && projectile.type === "claw" && Math.hypot(victim.x - attacker.x, victim.y - attacker.y) < 145) attacker.clawRushUntil = now + 1150;
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
      if ((projectile.type === "laser" || projectile.type === "yarnBall") && projectile.remaining > 0 && reflectLaser(arena, projectile, nextX, nextY)) continue;
      if (projectile.type === "goldFeather") explodeSkyFeather(room, projectile);
      if (projectile.type === "skyBombShot" && owner) spawnSkyBomb(room, owner, projectile.x, projectile.y, Date.now(), 118, 2100);
      if (projectile.type === "depthShot") explodeDepthShot(room, projectile, projectile.x, projectile.y, Date.now());
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
    const decoy = (room.game.decoys || []).find(d => d.ownerId !== projectile.ownerId && !(isTeamCombatMode(room) && d.team && d.team === projectile.team) && !(room.mode === "survival" && Boolean(d.bot) === projectile.bot) && Math.hypot(d.x-projectile.x,d.y-projectile.y) < 24 + projectile.radius);
    if (decoy) {
      decoy.health -= projectile.damage;
      if (decoy.health <= 0) room.game.decoys = room.game.decoys.filter(item => item.id !== decoy.id);
      room.game.projectiles.splice(i, 1);
      continue;
    }
    const victim = [...room.players.values()].find(p => projectileCanHit(room, projectile, p) && Math.hypot(p.x-projectile.x,p.y-projectile.y) < playerRadius(p) + projectile.radius);
    if (victim) {
      hitWithProjectile(room, projectile, victim);
      if (projectile.type === "goldFeather") explodeSkyFeather(room, projectile);
      if (projectile.type === "skyBombShot" && owner) spawnSkyBomb(room, owner, projectile.x, projectile.y, Date.now(), 118, 2100);
      if (projectile.type === "depthShot") explodeDepthShot(room, projectile, projectile.x, projectile.y, Date.now());
      if (projectile.type === "boomerang") {
        projectile.hitIds.push(victim.id);
        projectile.returning = true;
        projectile.remaining = Infinity;
      } else if (projectile.pierce) {
        projectile.hitIds.push(victim.id);
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
  player.bazaarBuff = ["coinMagnet", "desertSpice", "goldenArmor", "mirageMirror", "sandglass", "hermes", "bouncyBoots", "giantElixir", "smokeBomb", "luckyCharm"][Math.floor(Math.random() * 10)];
  player.hitUntil = now + 260;
  return true;
}
function useBazaarBuff(room, player, now) {
  const buff = player.bazaarBuff;
  if (!buff) return false;
  player.bazaarBuff = "";
  if (buff === "coinMagnet") player.coinMagnetUntil = Math.max(player.coinMagnetUntil || 0, now + 5000);
  else if (buff === "desertSpice") player.desertSpiceUntil = Math.max(player.desertSpiceUntil || 0, now + 5000);
  else if (buff === "goldenArmor") player.goldenArmorUntil = Math.max(player.goldenArmorUntil || 0, now + 4000);
  else if (buff === "mirageMirror") {
    const aim = aimDirection(player);
    room.game.decoys ||= [];
    room.game.decoys.push({ id:`${room.code}-decoy-${room.game.nextDecoyId++}`, ownerId:player.id, team:player.team, bot:Boolean(player.bot), character:player.character, x:player.x + aim.x * 28, y:player.y + aim.y * 28, health:70, endsAt:now + 5000 });
  }
  else if (buff === "sandglass") player.reloadBoostUntil = Math.max(player.reloadBoostUntil || 0, now + 4000);
  else if (buff === "hermes") player.phaseUntil = Math.max(player.phaseUntil || 0, now + 3000);
  else if (buff === "bouncyBoots") player.bouncyUntil = Math.max(player.bouncyUntil || 0, now + 5000);
  else if (buff === "giantElixir") {
    if (!(player.giantBonusHp || 0)) {
      player.giantBonusHp = 1500;
      player.maxHealth += 1500;
      player.health += 1500;
    }
    player.giantUntil = Math.max(player.giantUntil || 0, now + 5000);
    player.giantDamageUntil = Math.max(player.giantDamageUntil || 0, now + 5000);
  }
  else if (buff === "smokeBomb") player.invisibleUntil = Math.max(player.invisibleUntil || 0, now + 3000);
  else if (buff === "luckyCharm") player.specialCharge = Math.min(SPECIAL_HITS, (player.specialCharge || 0) + SPECIAL_HITS * .5);
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
function updateSkyBombs(room, now) {
  room.game.skyBombs ||= [];
  room.game.skyBombs = room.game.skyBombs.filter(bomb => now < bomb.endsAt);
  for (const bomb of room.game.skyBombs) {
    const owner = room.players.get(bomb.ownerId) || null;
    for (const player of room.players.values()) {
      if (!canAffectWithSpecial(room, bomb, player)) continue;
      const dx = bomb.x - player.x, dy = bomb.y - player.y, distance = Math.hypot(dx, dy) || 1;
      if (distance > bomb.radius + playerRadius(player)) continue;
      dashPlayer(room.arena, player, dx / distance * 4.8, dy / distance * 4.8);
      player.wallUntil = Math.max(player.wallUntil || 0, now + 120);
      player.hitUntil = now + 120;
      player.health -= owner?.bot ? .14 : .24;
      if (player.health <= 0) kill(room, player, owner);
    }
  }
}
function updateSharkSurges(room, now) {
  room.game.sharkSurges ||= [];
  room.game.sharkSurges = room.game.sharkSurges.filter(surge => now < surge.endsAt);
  for (const surge of room.game.sharkSurges) {
    const target = surge.targetId ? room.players.get(surge.targetId) : null;
    if (!surge.hitDone && target?.alive && target.connected) {
      surge.x2 = clamp(target.x, 55, room.arena.width - 55);
      surge.y2 = clamp(target.y, 55, room.arena.height - 55);
    }
    if (surge.hitDone || now < surge.breachAt) continue;
    surge.hitDone = true;
    const owner = room.players.get(surge.ownerId) || null;
    const effectSource = { ...surge, id:surge.ownerId };
    for (const player of room.players.values()) {
      if (!canAffectWithSpecial(room, effectSource, player)) continue;
      const dx = player.x - surge.x2, dy = player.y - surge.y2, distance = Math.hypot(dx, dy) || 1;
      if (distance > surge.radius + playerRadius(player)) continue;
      player.health -= owner?.bot ? 28 : 54;
      player.hitUntil = now + 300;
      dashPlayer(room.arena, player, dx / distance * 52, dy / distance * 52);
      if (player.health <= 0) kill(room, player, owner);
    }
  }
}
function nearestEnemy(room, source) {
  let selected = null, distance = Infinity;
  const sourceId = source.ownerId || source.id;
  for (const player of room.players.values()) {
    if (!player.alive || !player.connected || player.id === sourceId) continue;
    if (isTeamCombatMode(room) && source.team && player.team === source.team) continue;
    if (room.mode === "survival" && Boolean(player.bot) === source.bot) continue;
    const d = Math.hypot(player.x - source.x, player.y - source.y);
    if (d < distance) { selected = player; distance = d; }
  }
  return selected;
}
function updateDecoys(room, now) {
  room.game.decoys ||= [];
  room.game.decoys = room.game.decoys.filter(decoy => now < decoy.endsAt && decoy.health > 0);
  for (const decoy of room.game.decoys) {
    const target = nearestEnemy(room, decoy);
    if (!target) continue;
    const dx = target.x - decoy.x, dy = target.y - decoy.y, len = Math.hypot(dx, dy) || 1;
    const speed = decoy.golden ? CHARACTERS.skyfalcon.speed : 4.1;
    decoy.x = clamp(decoy.x + dx / len * speed, 28, room.arena.width - 28);
    decoy.y = clamp(decoy.y + dy / len * speed, 28, room.arena.height - 28);
    if (decoy.golden && len < playerRadius(target) + 26 && now - (decoy.lastAttack || 0) > (decoy.rate || CHARACTERS.skyfalcon.rate)) {
      if (hasFullInvincibility(target, now)) continue;
      decoy.lastAttack = now;
      target.health -= (decoy.damage || CHARACTERS.skyfalcon.damage) * (decoy.bot ? BOT_DAMAGE_SCALE : 1);
      target.hitUntil = now + 150;
      if (target.health <= 0) kill(room, target, room.players.get(decoy.ownerId) || null);
    }
  }
}
function updateFireTrails(room, now) {
  room.game.fireTrails ||= [];
  room.game.fireTrails = room.game.fireTrails.filter(trail => now < trail.endsAt);
  for (const trail of room.game.fireTrails) {
    if (trail.type === "slash") continue;
    for (const player of room.players.values()) {
      if (!player.alive || !player.connected || player.id === trail.ownerId) continue;
      if (isTeamCombatMode(room) && trail.team && player.team === trail.team) continue;
      if (room.mode === "survival" && Boolean(player.bot) === trail.bot) continue;
      if (!hasFullInvincibility(player, now) && Math.hypot(player.x - trail.x, player.y - trail.y) < trail.radius + playerRadius(player)) {
        player.health -= .32;
        player.hitUntil = now + 80;
        if (player.health <= 0) kill(room, player, room.players.get(trail.ownerId) || null);
      }
    }
  }
}
function updateWindBursts(room, now) {
  room.game.windBursts ||= [];
  room.game.windBursts = room.game.windBursts.filter(burst => now < burst.endsAt);
}
function updateCoinMagnet(room) {
  for (const player of room.players.values()) {
    if (!player.alive || Date.now() >= (player.coinMagnetUntil || 0)) continue;
    for (let i = room.game.items.length - 1; i >= 0; i--) {
      const item = room.game.items[i], distance = Math.hypot(item.x - player.x, item.y - player.y);
      if (distance > 260) continue;
      if (distance < 34) {
        room.game.items.splice(i, 1);
        if (item.type === "gem") player.gems++;
        else player.coins++;
      } else {
        item.x += (player.x - item.x) / distance * 9;
        item.y += (player.y - item.y) / distance * 9;
      }
    }
  }
}
function updateGiantStatus(room, now) {
  for (const player of room.players.values()) {
    if ((player.giantBonusHp || 0) > 0 && now >= (player.giantUntil || 0)) {
      player.maxHealth = Math.max(1, player.maxHealth - player.giantBonusHp);
      player.health = Math.min(player.health, player.maxHealth);
      player.giantBonusHp = 0;
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
  const character = "mash", hp = CHARACTERS[character].hp + Math.min(45, room.game.wave * 3), id = `bot-${room.code}-${room.game.botSerial++}`;
  const bot = { id, socketId:null, name:`\u05de\u05d0\u05e9 ${room.game.botSerial}`, character, bot:true, color:team === "blue" ? "#36c8ff" : "#f07167", team, x:spot.x, y:spot.y, maxHealth:hp, health:hp, alive:true, score:0, gems:0, coins:0, input:{x:0,y:0,attack:false,special:false}, lastAttack:0, lastSpecial:false, lastSpecialAt:0, shieldUntil:0, connected:true };
  resetAmmo(bot, now);
  room.players.set(id, bot);
  room.game.nextBotAt = now + Math.max(900, 2300 - room.game.wave * 95);
}
function updateBots(room) {
  for (const bot of [...room.players.values()].filter(p => p.bot && p.alive)) {
    let target = null, distance = Infinity;
    for (const candidate of room.players.values()) {
      if (candidate.id === bot.id || !candidate.alive || !candidate.connected || Date.now() < (candidate.invisibleUntil || 0)) continue;
      if (room.mode === "survival" && Boolean(candidate.bot) === Boolean(bot.bot)) continue;
      if (sameTeam(room, bot, candidate)) continue;
      const d = Math.hypot(candidate.x - bot.x, candidate.y - bot.y);
      if (d < distance) { target = candidate; distance = d; }
    }
    if (!target) { bot.input = { x:0, y:0, attack:false, special:false }; continue; }
    const len = Math.hypot(target.x - bot.x, target.y - bot.y) || 1;
    bot.aimX = (target.x - bot.x) / len;
    bot.aimY = (target.y - bot.y) / len;
    bot.input.x = bot.aimX * BOT_MOVE_SCALE;
    bot.input.y = bot.aimY * BOT_MOVE_SCALE;
    bot.input.attack = distance < CHARACTERS[bot.character].range * BOT_RANGE_SCALE;
    bot.input.special = bot.character === "mash" && distance < 95 && Date.now() - (bot.lastSpecialAt || 0) > 9000;
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
  updateSkyBombs(room, now);
  updateSharkSurges(room, now);
  updateDecoys(room, now);
  updateFireTrails(room, now);
  updateWindBursts(room, now);
  updateCoinMagnet(room);
  updateGiantStatus(room, now);
  for (const p of room.players.values()) {
    if (!p.connected) continue;
    updateAmmo(p, now);
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
      if (now-p.diedAt > 2200) { const spot=randomSpot(room.arena), s=statsFor(p.character, p.characterLevel); Object.assign(p,{x:spot.x,y:spot.y,maxHealth:s.hp,health:s.hp,alive:true,ghost:false,rootUntil:0,catRushUntil:0}); resetAmmo(p, now); }
      continue;
    }
    if ((p.freezeMeter || 0) > 0 && now > (p.freezeUntil || 0)) p.freezeMeter = Math.max(0, p.freezeMeter - 0.9);
    const stats=CHARACTERS[p.character], shieldBoost=p.character==="blaze" && now < (p.cardboardShieldUntil||0) && (p.cardboardShieldHp||0)>0 ? 1.18 : 1, spiceBoost=now < (p.desertSpiceUntil||0) ? 1.35 : 1, catBoost=now < (p.catRushUntil||0) ? 1.85 : 1, moveScale=now < (p.wallUntil||0) || now < (p.rootUntil||0) ? 0 : now < (p.hauntedUntil||0) ? .58 : shieldBoost * spiceBoost * catBoost, confusion=now < (p.confusedUntil||0) ? -1 : 1, iceEffect=iceEffectFor(room,p), iceSpeed=iceEffect==="friendly" ? 1.3 : iceEffect==="enemy" ? .55 : 1;
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
    if (now < (p.desertSpiceUntil || 0) && Math.hypot(targetDx, targetDy) > .2 && now > (p.nextFireTrailAt || 0)) {
      room.game.fireTrails ||= [];
      room.game.fireTrails.push({ ownerId:p.id, team:p.team, bot:Boolean(p.bot), x:p.x, y:p.y, radius:22, endsAt:now + 1600 });
      p.nextFireTrailAt = now + 180;
    }
    if (p.input.attack) attack(room,p,now);
    if (p.input.special && !p.lastSpecial && p.bazaarBuff) useBazaarBuff(room,p,now);
    else if (p.input.special) special(room,p,now);
    p.lastSpecial=p.input.special;
    if (room.mode === "showdown" && !hasFullInvincibility(p, now) && Math.hypot(p.x-center.x,p.y-center.y) > room.game.safeRadius) { p.health -= .55; if (p.health<=0) kill(room,p,null); }
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
  socket.use(async ([event, data], next) => {
    if (String(event || "").startsWith("admin:")) await verifyAuthEmail(socket, data || {});
    next();
  });
  socket.on("lobby:present", async (data={}) => {
    if (data.active === false) {
      lobbyPlayers.delete(socket.id);
      return;
    }
    const email = await verifyAuthEmail(socket, data);
    if (!isValidEmail(email)) {
      lobbyPlayers.delete(socket.id);
      return;
    }
    const playerId = String(data.playerId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    lobbyPlayers.set(socket.id, {
      socketId:socket.id,
      targetId:`lobby:${socket.id}`,
      playerId,
      name:allowedPlayerName(playerId, data.name, email, email),
      accountEmail:email,
      connected:true
    });
  });
  socket.on("host:create", (data={}, ack=()=>{}) => { if (typeof data === "function") { ack=data; data={}; } const room=createRoom(socket.id,data.mode); socket.join(room.code); socket.data.hostRoom=room.code; ack({ok:true,code:room.code,players:[],meta:meta(room)}); });
  socket.on("player:create", async ({playerId,name,character,mode,authToken,invincibleMode,characterLevels,skin}={}, ack=()=>{}) => { const accountEmail = await verifyAuthEmail(socket, { authToken }); const room=createRoom(null,mode); joinPlayer(socket,room.code,playerId,name,character,accountEmail,invincibleMode,characterLevels,skin,ack); });
  socket.on("player:autoJoin", async ({playerId,name,character,mode,authToken,invincibleMode,characterLevels,skin}={}, ack=()=>{}) => {
    const accountEmail = await verifyAuthEmail(socket, { authToken });
    const selectedMode = MODES[mode] ? mode : "survival";
    const room = selectedMode === "survival" ? createRoom(null, selectedMode) : findOpenRoom(selectedMode) || createRoom(null, selectedMode);
    joinPlayer(socket, room.code, playerId, name, character, accountEmail, invincibleMode, characterLevels, skin, ack);
  });
  socket.on("player:join", async ({code:roomCode,playerId,name,character,authToken,invincibleMode,characterLevels,skin}={}, ack=()=>{}) => {
    const accountEmail = await verifyAuthEmail(socket, { authToken });
    joinPlayer(socket,String(roomCode||"").trim().toUpperCase(),playerId,name,character,accountEmail,invincibleMode,characterLevels,skin,ack);
  });
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
  socket.on("admin:identify", async ({ roomCode, playerId, authToken } = {}, ack=()=>{}) => {
    const accountEmail = await verifyAuthEmail(socket, { authToken });
    const room = rooms.get(String(roomCode || "").trim().toUpperCase()), ref = socketIndex.get(socket.id);
    const p = room?.players.get(String(playerId || ref?.playerId || ""));
    if (!room || !p || p.socketId !== socket.id) return ack({ ok:false, error:"Player not found" });
    p.accountEmail = accountEmail;
    const admin = isAdminEmail(accountEmail);
    ack({ ok:true, admin, admins:admin ? adminList() : [] });
    broadcast(room);
  });
  socket.on("admin:check", async (data={}, ack=()=>{}) => {
    const email = await verifyAuthEmail(socket, data);
    const admin = isAdminEmail(email);
    ack({ ok:true, admin, admins:admin ? adminList() : [] });
  });
  socket.on("admin:list", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket)) return ack({ ok:false, error:"Admin only" });
    ack({ ok:true, admins:adminList() });
  });
  socket.on("admin:runCommand", (data={}, ack=()=>{}) => {
    const reply = runAdminTextCommand(socket, data);
    ack(reply.ok ? reply : { ok:false, error:reply.error || "Admin action failed" });
  });
  socket.on("admin:listLobby", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket)) return ack({ ok:false, error:"Admin only" });
    const actorEmail = verifiedSocketEmail(socket);
    const players = [...lobbyPlayers.values()]
      .filter(player => normalizeEmail(player.accountEmail) !== actorEmail)
      .map(player => ({ id:player.targetId, name:player.name, roomCode:"LOBBY", lobby:true, connected:true }));
    ack({ ok:true, players });
  });
  socket.on("admin:addAdmin", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket)) return ack({ ok:false, error:"Admin only" });
    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) return ack({ ok:false, error:"Invalid Google account" });
    ADMIN_EMAILS.add(email);
    saveAdminEmails();
    io.emit("admin:updated", { admins:adminList() });
    for (const room of rooms.values()) broadcast(room);
    ack({ ok:true, admins:adminList() });
  });
  socket.on("admin:removeAdmin", (data={}, ack=()=>{}) => {
    if (!isAdminActor(socket)) return ack({ ok:false, error:"Admin only" });
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
    if (!isAdminActor(socket)) return ack({ ok:false, error:"Admin only" });
    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) return ack({ ok:false, error:"Invalid Google account" });
    for (const room of rooms.values()) {
      const target = [...room.players.values()].find(player => !player.bot && normalizeEmail(player.accountEmail) === email);
      if (target) return ack({ ok:true, roomCode:room.code, targetId:target.id, name:target.name });
    }
    const lobbyTarget = [...lobbyPlayers.values()].find(player => normalizeEmail(player.accountEmail) === email);
    if (lobbyTarget) return ack({ ok:true, roomCode:"LOBBY", targetId:lobbyTarget.targetId, name:lobbyTarget.name, lobby:true });
    ack({ ok:false, error:"Player not found" });
  });
  socket.on("admin:grantCharacter", (data={}, ack=()=>{}) => {
    const isLobbyTarget = String(data.roomCode || "").toUpperCase() === "LOBBY";
    const lobbyTarget = isLobbyTarget ? adminLobbyTarget(socket, data, ack) : null, character = String(data.character || "");
    if (isLobbyTarget) {
      if (!lobbyTarget) return;
      if (!PLAYABLE_CHARACTERS.has(character)) return ack({ ok:false, error:"Unknown character" });
      io.to(lobbyTarget.socketId).emit("admin:characterGranted", { character });
      return ack({ ok:true });
    }
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    if (!PLAYABLE_CHARACTERS.has(character)) return ack({ ok:false, error:"Unknown character" });
    const target = room.players.get(String(data.targetId || ""));
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    const ratio = target.maxHealth ? target.health / target.maxHealth : 1, stats = statsFor(character, target.characterLevel);
    target.character = character;
    target.characterLevel = normalizeCharacterLevel(target.characterLevel);
    target.maxHealth = stats.hp;
    target.health = Math.min(stats.hp, Math.max(1, Math.round(stats.hp * ratio)));
    if (target.socketId) io.to(target.socketId).emit("admin:characterGranted", { character });
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:revokeCharacter", (data={}, ack=()=>{}) => {
    const isLobbyTarget = String(data.roomCode || "").toUpperCase() === "LOBBY";
    const lobbyTarget = isLobbyTarget ? adminLobbyTarget(socket, data, ack) : null, character = String(data.character || "");
    if (isLobbyTarget) {
      if (!lobbyTarget) return;
      if (!PLAYABLE_CHARACTERS.has(character) || character === "blaze") return ack({ ok:false, error:"Unknown character" });
      io.to(lobbyTarget.socketId).emit("admin:characterRevoked", { character });
      return ack({ ok:true });
    }
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    if (!PLAYABLE_CHARACTERS.has(character) || character === "blaze") return ack({ ok:false, error:"Unknown character" });
    const target = room.players.get(String(data.targetId || ""));
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    if (target.character === character) {
      const stats = statsFor("blaze", target.characterLevel);
      target.character = "blaze";
      target.characterLevel = normalizeCharacterLevel(target.characterLevel);
      target.maxHealth = stats.hp;
      target.health = Math.min(stats.hp, Math.max(1, target.health));
    }
    if (target.socketId) io.to(target.socketId).emit("admin:characterRevoked", { character });
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:healPlayer", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    const target = adminTarget(room, data, ack);
    if (!target) return;
    target.alive = true;
    target.ghost = false;
    target.health = target.maxHealth;
    target.freezeMeter = 0;
    target.freezeUntil = 0;
    resetAmmo(target);
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:eliminatePlayer", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    const target = adminTarget(room, data, ack);
    if (!target) return;
    const ref = socketIndex.get(socket.id);
    kill(room, target, ref ? room.players.get(ref.playerId) || null : null);
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:freezePlayer", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    const target = adminTarget(room, data, ack);
    if (!target) return;
    target.freezeMeter = 100;
    target.freezeUntil = Date.now() + 3200;
    target.input = { x:0, y:0, attack:false, special:false };
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:teleportPlayer", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack);
    if (!room) return;
    const target = adminTarget(room, data, ack);
    if (!target) return;
    const ref = socketIndex.get(socket.id);
    const actor = ref ? room.players.get(ref.playerId) : null;
    if (!actor || actor.bot) return ack({ ok:false, error:"Admin player not found" });
    target.x = clamp(actor.x + 42, 28, room.arena.width - 28);
    target.y = clamp(actor.y, 28, room.arena.height - 28);
    target.alive = true;
    target.ghost = false;
    broadcast(room);
    ack({ ok:true });
  });
  socket.on("admin:resetProgress", (data={}, ack=()=>{}) => {
    const isLobbyTarget = String(data.roomCode || "").toUpperCase() === "LOBBY";
    const lobbyTarget = isLobbyTarget ? adminLobbyTarget(socket, data, ack) : null;
    if (isLobbyTarget) {
      if (!lobbyTarget) return;
      io.to(lobbyTarget.socketId).emit("admin:progressReset");
      return ack({ ok:true });
    }
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = room.players.get(targetId);
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    if (target.socketId) io.to(target.socketId).emit("admin:progressReset");
    ack({ ok:true });
  });
  socket.on("admin:allowRename", (data={}, ack=()=>{}) => {
    const isLobbyTarget = String(data.roomCode || "").toUpperCase() === "LOBBY";
    const lobbyTarget = isLobbyTarget ? adminLobbyTarget(socket, data, ack) : null;
    if (isLobbyTarget) {
      if (!lobbyTarget) return;
      allowPlayerRename(lobbyTarget.playerId, lobbyTarget.accountEmail, lobbyTarget.name);
      io.to(lobbyTarget.socketId).emit("admin:renameAllowed");
      return ack({ ok:true });
    }
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = room.players.get(targetId);
    if (!target || target.bot) return ack({ ok:false, error:"Player not found" });
    allowPlayerRename(target.id, target.accountEmail, target.name);
    if (target.socketId) io.to(target.socketId).emit("admin:renameAllowed");
    ack({ ok:true });
  });
  socket.on("admin:kickPlayer", (data={}, ack=()=>{}) => {
    const isLobbyTarget = String(data.roomCode || "").toUpperCase() === "LOBBY";
    const lobbyTarget = isLobbyTarget ? adminLobbyTarget(socket, data, ack) : null;
    if (isLobbyTarget) {
      if (!lobbyTarget) return;
      if (isAdminEmail(lobbyTarget.accountEmail)) return ack({ ok:false, error:"Cannot kick admin" });
      io.to(lobbyTarget.socketId).emit("admin:kicked");
      lobbyPlayers.delete(lobbyTarget.socketId);
      return ack({ ok:true });
    }
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = adminTarget(room, data, ack);
    if (!target) return;
    if (isAdminEmail(target.accountEmail)) return ack({ ok:false, error:"Cannot kick admin" });
    if (target.socketId) {
      io.to(target.socketId).emit("admin:kicked");
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) targetSocket.leave(room.code);
      socketIndex.delete(target.socketId);
    }
    removePlayer(room, targetId);
    ack({ ok:true });
  });
  socket.on("admin:banPlayer", (data={}, ack=()=>{}) => {
    const room = adminRoom(socket, data, ack), targetId = String(data.targetId || "");
    if (!room) return;
    const target = adminTarget(room, data, ack);
    if (!target) return;
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
  socket.on("player:input", payload => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), p=room&&room.players.get(ref.playerId); if(!p||!Array.isArray(payload))return; const x=clamp(Number(payload[0])||0,-1,1), y=clamp(Number(payload[1])||0,-1,1), aimX=clamp(Number(payload[4])||0,-1,1), aimY=clamp(Number(payload[5])||0,-1,1), skyMode=payload[6] === "clone" ? "clone" : "bomb"; p.input={x,y,attack:Boolean(payload[2]),special:Boolean(payload[3]),skyMode}; if(Math.hypot(aimX,aimY)>.12){p.aimX=aimX;p.aimY=aimY;} else if(Math.hypot(x,y)>.12){p.aimX=x;p.aimY=y;} });
  socket.on("ghost:target", ({ targetId } = {}) => { const ref=socketIndex.get(socket.id), room=ref&&rooms.get(ref.code), ghost=room&&room.players.get(ref.playerId), target=room&&room.players.get(String(targetId||"")); if (!ghost?.ghost || !target?.alive || ghost.id===target.id) return; ghost.ghostTargetId=target.id; });
  socket.on("disconnect", () => { lobbyPlayers.delete(socket.id); const host=socket.data.hostRoom; if(host&&rooms.get(host)?.hostSocketId===socket.id){io.to(host).emit("room:closed");rooms.delete(host);} const ref=socketIndex.get(socket.id);socketIndex.delete(socket.id);const room=ref&&rooms.get(ref.code),p=room&&room.players.get(ref.playerId);if(p&&p.socketId===socket.id){p.connected=false;p.input={x:0,y:0,attack:false,special:false};p.removeTimer=setTimeout(()=>removePlayer(room,ref.playerId),RECONNECT_MS);broadcast(room);} });
});
setInterval(()=>{const now=Date.now();for(const room of rooms.values())updateRoom(room,now);},1000/30);
server.listen(PORT,()=>console.log(`BrawkClaUi running at http://localhost:${PORT}/play/`));
