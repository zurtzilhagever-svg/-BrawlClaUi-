const socket = io(CouchBrawlRuntime.serverUrl, { transports: ["websocket", "polling"] });
const lobby = document.querySelector("#lobby");
const game = document.querySelector("#game");
const nameInput = document.querySelector("#name");
const codeInput = document.querySelector("#code");
const error = document.querySelector("#error");
const canvas = document.querySelector("#arena");
const ctx = canvas.getContext("2d");
const lobbyRoomCode = document.querySelector("#lobby-room-code");
const matchStatus = document.querySelector("#match-status");
const phoneConnect = document.querySelector("#phone-connect");
const phoneLink = document.querySelector("#phone-link");
const phoneQr = document.querySelector("#phone-qr");
const languageSelect = document.querySelector("#language");
const controlModeSelect = document.querySelector("#control-mode");
const keyboardPanel = document.querySelector("#keyboard-panel");
const controls = document.querySelector(".controls");
const input = { x: 0, y: 0, attack: false, special: false };
const keyboardState = new Set();
const keyboardBindings = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  attack: "KeyJ",
  special: "KeyK"
};
const playerKey = "couchbrawl-player-id";
const playerId = localStorage.getItem(playerKey) || crypto.randomUUID();
localStorage.setItem(playerKey, playerId);
const languageKey = "couchbrawl-language";
const translations = {
  en: {
    title: "Brawl anywhere.",
    subtitle: "Choose a brawler, game mode, and controls.",
    languageLabel: "LANGUAGE",
    languageSystem: "Use device language",
    namePlaceholder: "Your name",
    brawlerLabel: "YOUR BRAWLER",
    blazeDesc: "Balanced dash",
    tankDesc: "Heavy shield",
    sparkDesc: "Fast striker",
    medicDesc: "Self heal",
    modeLabel: "GAME MODE",
    modeSurvival: "Survival - bot waves",
    modeBrawl: "Solo Brawl - last alive",
    modeGems: "Gem Grab - 10 gems",
    modeShowdown: "Showdown - last alive",
    modeCoins: "Coin Rush - 15 coins",
    modeZone: "Zone Control - Red vs Blue",
    modeSoloZone: "Solo Zone Control - 15 seconds",
    controlsLabel: "CONTROLS",
    controlTouch: "Phone / touch",
    controlKeyboard: "Computer keyboard",
    controlGamepad: "Bluetooth / USB controller",
    keysMove: "ARROWS",
    keysAttack: "J ATTACK",
    keysSpecial: "K SPECIAL",
    create: "CREATE A GAME",
    playNow: "PLAY NOW",
    roomCodeLabel: "ROOM CODE",
    findingPlayers: "Finding players...",
    readyRoom: "Ready - share this code or press Play",
    joinDivider: "OR JOIN A FRIEND",
    codePlaceholder: "CODE",
    join: "JOIN",
    install: "INSTALL APP",
    leaveAria: "Leave game",
    initialObjective: "Share the room code to play together",
    attack: "ATTACK",
    special: "SPECIAL",
    useItem: "USE ITEM",
    ping: "PING",
    survivalEnded: "Survival ended",
    createAgain: "Create a new game to play again",
    shareRoom: "Share the room code to play together",
    reconnecting: "Reconnecting...",
    ghostCharge: "You are a ghost - an item charges every 30s",
    targetSelected: "Target selected",
    wave: "Wave",
    survived: "s survived",
    bots: "bots",
    botSingular: "BOT",
    botPlural: "BOTS",
    playerSingular: "PLAYER",
    playerPlural: "PLAYERS",
    room: "ROOM",
    control: "CONTROL",
    red: "RED",
    blue: "BLUE",
    teamWins: "TEAM wins",
    wins: "wins",
    kos: "KOs"
  },
  he: {
    title: "קרב מכל מכשיר.",
    subtitle: "בחר דמות, מצב משחק ושליטה.",
    languageLabel: "שפה",
    languageSystem: "לפי שפת המכשיר",
    namePlaceholder: "השם שלך",
    brawlerLabel: "דמות",
    blazeDesc: "מאוזן עם דאש",
    tankDesc: "הרבה חיים ומגן",
    sparkDesc: "מהיר מאוד",
    medicDesc: "ריפוי עצמי",
    modeLabel: "מצב משחק",
    modeSurvival: "הישרדות - גלי בוטים",
    modeBrawl: "קרב יחיד - האחרון שנשאר",
    modeGems: "איסוף יהלומים - 10 לניצחון",
    modeShowdown: "שואודאון - האחרון שנשאר",
    modeCoins: "מרוץ מטבעות - 15 לניצחון",
    modeZone: "שליטה באזור - אדום מול כחול",
    modeSoloZone: "שליטה יחיד - 15 שניות",
    controlsLabel: "שליטה",
    controlTouch: "טלפון / מגע",
    controlKeyboard: "מקלדת מחשב",
    controlGamepad: "שלט Bluetooth / USB",
    keysMove: "חצים",
    keysAttack: "J התקפה",
    keysSpecial: "K מיוחד",
    create: "צור משחק",
    playNow: "שחק עכשיו",
    roomCodeLabel: "קוד חדר",
    findingPlayers: "מחפש שחקנים...",
    readyRoom: "מוכן - שתף את הקוד או לחץ שחק",
    joinDivider: "או הצטרף לחבר",
    codePlaceholder: "קוד",
    join: "הצטרף",
    install: "התקן אפליקציה",
    leaveAria: "צא מהמשחק",
    initialObjective: "שתף את קוד החדר כדי לשחק יחד",
    attack: "התקפה",
    special: "מיוחד",
    useItem: "השתמש",
    ping: "סימון",
    survivalEnded: "ההישרדות הסתיימה",
    createAgain: "צור משחק חדש כדי לשחק שוב",
    shareRoom: "שתף את קוד החדר כדי לשחק יחד",
    reconnecting: "מתחבר מחדש...",
    ghostCharge: "אתה רוח - פריט נטען כל 30 שניות",
    targetSelected: "נבחר יעד",
    wave: "גל",
    survived: "שניות שרדת",
    bots: "בוטים",
    botSingular: "בוט",
    botPlural: "בוטים",
    playerSingular: "שחקן",
    playerPlural: "שחקנים",
    room: "חדר",
    control: "שליטה",
    red: "אדום",
    blue: "כחול",
    teamWins: "ניצחו",
    wins: "ניצח",
    kos: "חיסולים"
  }
};
function deviceLanguage() {
  return (navigator.language || "").toLowerCase().startsWith("he") ? "he" : "en";
}
function selectedLanguage() {
  const saved = localStorage.getItem(languageKey) || "system";
  return saved === "system" ? deviceLanguage() : saved;
}
function t(key) {
  return translations[selectedLanguage()]?.[key] || translations.en[key] || key;
}
function applyLanguage() {
  const language = selectedLanguage();
  document.documentElement.lang = language;
  document.documentElement.dir = language === "he" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  if (roomCode) document.querySelector("#room-label").textContent = `${t("room")} ${roomCode}`;
  updateLobbyRoom();
  updateMeta();
}
let roomCode = "";
let players = [];
let wasPlaying = false;
let selectedCharacter = "blaze";
let gameMeta = { items: [], zoneScore: {} };
let controlMode = localStorage.getItem("couchbrawl-control-mode") || "touch";
let autoJoinTimer = 0;
let phoneOrigin = location.origin;
const characterImages = Object.fromEntries(["blaze", "tank", "spark", "medic"].map(id => {
  const image = new Image();
  image.src = `/characters/${id}.png`;
  return [id, image];
}));

nameInput.value = localStorage.getItem("couchbrawl-name") || "";
languageSelect.value = localStorage.getItem(languageKey) || "system";
controlModeSelect.value = controlMode;
applyLanguage();
applyControlMode();
loadPhoneOrigin();

function name() {
  return nameInput.value.trim().slice(0, 14) || "Player";
}

function enter(reply) {
  if (!reply.ok) return error.textContent = reply.error;
  roomCode = reply.code;
  players = reply.players;
  gameMeta = reply.meta || gameMeta;
  wasPlaying = true;
  localStorage.setItem("couchbrawl-name", name());
  localStorage.setItem("couchbrawl-room", roomCode);
  lobby.hidden = true;
  game.hidden = false;
  document.querySelector("#room-label").textContent = `${t("room")} ${roomCode}`;
  applyControlMode();
  updateMeta();
}

function updateLobbyRoom() {
  if (!lobbyRoomCode || !matchStatus) return;
  lobbyRoomCode.textContent = roomCode || "----";
  matchStatus.textContent = roomCode ? `${t("readyRoom")} - ${players.filter(p => !p.bot).length}/8` : t("findingPlayers");
  updatePhoneConnect();
}

async function loadPhoneOrigin() {
  try {
    const response = await fetch("/api/network", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    phoneOrigin = data.origin || phoneOrigin;
    updatePhoneConnect();
  } catch {
    updatePhoneConnect();
  }
}

function updatePhoneConnect() {
  if (!phoneConnect || !phoneLink || !phoneQr) return;
  phoneConnect.hidden = !roomCode;
  if (!roomCode) return;
  const url = `${phoneOrigin}/mobile/?room=${encodeURIComponent(roomCode)}`;
  phoneLink.href = url;
  phoneLink.textContent = url;
  if (window.QRGenerator) QRGenerator.setImage(phoneQr, url);
}

function autoJoinLobby() {
  if (!socket.connected || wasPlaying) return;
  window.clearTimeout(autoJoinTimer);
  matchStatus.textContent = t("findingPlayers");
  socket.emit("player:autoJoin", {
    playerId,
    name: name(),
    character: selectedCharacter,
    mode: document.querySelector("#mode").value
  }, reply => {
    if (!reply.ok) {
      error.textContent = reply.error;
      roomCode = "";
      updateLobbyRoom();
      return;
    }
    error.textContent = "";
    roomCode = reply.code;
    players = reply.players;
    gameMeta = reply.meta || gameMeta;
    localStorage.setItem("couchbrawl-room", roomCode);
    updateLobbyRoom();
    updateMeta();
  });
}

function queueAutoJoin() {
  window.clearTimeout(autoJoinTimer);
  autoJoinTimer = window.setTimeout(autoJoinLobby, 120);
}

function updateMeta() {
  if (!gameMeta.mode) {
    document.querySelector("#objective").textContent = t("initialObjective");
    document.querySelector("#help").textContent = "";
    return;
  }
  const me = players.find(p => p.id === playerId);
  const winner = gameMeta.winnerTeam
    ? `${gameMeta.winnerTeam === "red" ? t("red") : t("blue")} ${t("teamWins")} ${gameMeta.modeName}!`
    : gameMeta.mode === "survival" && gameMeta.winner
      ? `${t("survivalEnded")} - ${gameMeta.survivalTime || 0}s - ${me?.score || 0} ${t("kos")}`
      : gameMeta.winner
        ? `${gameMeta.winner.name} ${t("wins")} ${gameMeta.modeName}!`
        : "";
  document.querySelector("#objective").textContent = winner || `${gameMeta.modeName || ""} - ${gameMeta.objective || ""}`;
  document.querySelector("#help").textContent = winner
    ? t("createAgain")
    : gameMeta.mode === "survival"
      ? `${t("wave")} ${gameMeta.wave || 1} - ${gameMeta.survivalTime || 0}${t("survived")} - ${gameMeta.botCount || 0} ${t("bots")}`
      : t("shareRoom");
}

function applyControlMode() {
  controlMode = controlModeSelect.value;
  localStorage.setItem("couchbrawl-control-mode", controlMode);
  keyboardPanel.hidden = controlMode !== "keyboard";
  controls.hidden = controlMode === "keyboard" || controlMode === "gamepad";
  if (controlMode !== "keyboard") keyboardState.clear();
  input.x = 0;
  input.y = 0;
  input.attack = false;
  input.special = false;
  document.querySelector("#stick-knob").style.transform = "";
}

controlModeSelect.addEventListener("change", applyControlMode);
languageSelect.addEventListener("change", () => {
  localStorage.setItem(languageKey, languageSelect.value);
  applyLanguage();
});

document.querySelectorAll("[data-character]").forEach(button => {
  button.onclick = () => {
    selectedCharacter = button.dataset.character;
    document.querySelectorAll("[data-character]").forEach(b => b.classList.toggle("selected", b === button));
    queueAutoJoin();
  };
});
document.querySelector("#mode").addEventListener("change", queueAutoJoin);
nameInput.addEventListener("change", queueAutoJoin);
document.querySelector("#create").onclick = () => {
  if (roomCode) return enter({ ok: true, code: roomCode, players, meta: gameMeta });
  socket.emit("player:autoJoin", { playerId, name: name(), character: selectedCharacter, mode: document.querySelector("#mode").value }, enter);
};
document.querySelector("#join").onclick = () => socket.emit("player:join", { code: codeInput.value.trim().toUpperCase(), playerId, name: name(), character: selectedCharacter }, enter);
codeInput.addEventListener("input", () => codeInput.value = codeInput.value.toUpperCase());
document.querySelector("#leave").onclick = () => { location.reload(); };

socket.on("game:state", next => {
  players = next;
  const humans = next.filter(p => !p.bot);
  const bots = next.filter(p => p.bot);
  document.querySelector("#count").textContent = gameMeta.mode === "survival"
    ? `${bots.length} ${bots.length === 1 ? t("botSingular") : t("botPlural")}`
    : gameMeta.mode === "zone"
      ? `${t("red")} ${Math.floor(gameMeta.zoneScore?.red || 0)} - ${Math.floor(gameMeta.zoneScore?.blue || 0)} ${t("blue")}`
      : gameMeta.mode === "soloZone"
        ? `${t("control")} ${Math.floor(gameMeta.zoneScore?.[playerId] || 0)} / 15`
        : `${humans.length} ${humans.length === 1 ? t("playerSingular") : t("playerPlural")}`;
  const me = next.find(p => p.id === playerId);
  if (!wasPlaying) updateLobbyRoom();
  const special = document.querySelector("#special");
  if (me?.ghost) {
    special.textContent = me.ghostItem ? t("useItem") : t("ping");
    document.querySelector("#help").textContent = me.ghostItem ? `${me.ghostItemName}: tap a living player, then use it` : t("ghostCharge");
  } else {
    special.textContent = t("special");
  }
});
socket.on("game:meta", next => {
  gameMeta = next;
  updateMeta();
  if (next.mode === "survival") document.querySelector("#count").textContent = `${t("wave")} ${next.wave || 1} - ${next.survivalTime || 0}s`;
  if (next.mode === "zone") document.querySelector("#count").textContent = `${t("red")} ${Math.floor(next.zoneScore?.red || 0)} - ${Math.floor(next.zoneScore?.blue || 0)} ${t("blue")}`;
  if (next.mode === "soloZone") document.querySelector("#count").textContent = `${t("control")} ${Math.floor(next.zoneScore?.[playerId] || 0)} / 15`;
});
socket.on("disconnect", () => { if (wasPlaying) document.querySelector("#help").textContent = t("reconnecting"); });
socket.on("connect", () => {
  if (wasPlaying && roomCode) socket.emit("player:join", { code: roomCode, playerId, name: name(), character: selectedCharacter }, enter);
  else autoJoinLobby();
});
if (socket.connected) autoJoinLobby();
else updateLobbyRoom();

const zone = document.querySelector("#stick-zone");
const knob = document.querySelector("#stick-knob");
function moveStick(e) {
  if (controlMode !== "touch") return;
  const r = zone.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  const max = r.width * .28;
  const length = Math.hypot(dx, dy) || 1;
  const s = Math.min(1, max / length);
  input.x = +(dx * s / max).toFixed(3);
  input.y = +(dy * s / max).toFixed(3);
  knob.style.transform = `translate(${dx * s}px,${dy * s}px)`;
}
zone.addEventListener("pointerdown", e => { zone.setPointerCapture(e.pointerId); moveStick(e); });
zone.addEventListener("pointermove", e => { if (zone.hasPointerCapture(e.pointerId)) moveStick(e); });
["pointerup", "pointercancel"].forEach(type => zone.addEventListener(type, () => {
  if (controlMode !== "touch") return;
  input.x = 0;
  input.y = 0;
  knob.style.transform = "";
}));

function action(selector, key) {
  const el = document.querySelector(selector);
  const set = value => {
    if (controlMode !== "touch") return;
    input[key] = value;
    el.classList.toggle("pressed", value);
    if (value) navigator.vibrate?.(12);
  };
  el.addEventListener("pointerdown", e => { e.preventDefault(); set(true); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => el.addEventListener(type, () => set(false)));
}
action("#attack", "attack");
action("#special", "special");

function updateKeyboardInput() {
  if (controlMode !== "keyboard") return;
  const x = (keyboardState.has(keyboardBindings.right) ? 1 : 0) - (keyboardState.has(keyboardBindings.left) ? 1 : 0);
  const y = (keyboardState.has(keyboardBindings.down) ? 1 : 0) - (keyboardState.has(keyboardBindings.up) ? 1 : 0);
  const length = Math.hypot(x, y) || 1;
  input.x = +(x / length).toFixed(3);
  input.y = +(y / length).toFixed(3);
  input.attack = keyboardState.has(keyboardBindings.attack);
  input.special = keyboardState.has(keyboardBindings.special);
}

window.addEventListener("keydown", event => {
  if (controlMode !== "keyboard" || event.repeat) return;
  if (!Object.values(keyboardBindings).includes(event.code)) return;
  event.preventDefault();
  keyboardState.add(event.code);
  updateKeyboardInput();
});
window.addEventListener("keyup", event => {
  if (!keyboardState.has(event.code)) return;
  event.preventDefault();
  keyboardState.delete(event.code);
  updateKeyboardInput();
});
window.addEventListener("blur", () => {
  keyboardState.clear();
  updateKeyboardInput();
});

canvas.addEventListener("pointerdown", event => {
  const me = players.find(p => p.id === playerId);
  if (!me?.ghost) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * 800 / rect.width;
  const y = (event.clientY - rect.top) * 600 / rect.height;
  const target = players.find(p => p.alive && Math.hypot(p.x - x, p.y - y) < 42);
  if (target) {
    socket.emit("ghost:target", { targetId: target.id });
    document.querySelector("#help").textContent = `${t("targetSelected")}: ${target.name}`;
  }
});
setInterval(() => {
  updateKeyboardInput();
  if (socket.connected && wasPlaying) socket.emit("player:input", [input.x, input.y, input.attack ? 1 : 0, input.special ? 1 : 0]);
}, 1000 / 60);
GamepadController.onInput(next => {
  if (controlMode === "gamepad") Object.assign(input, next);
});

function drawCharacter(p) {
  const image = characterImages[p.character];
  if (image?.complete && image.naturalWidth) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, -24, -24, 48, 48);
    ctx.restore();
    return;
  }

  const fill = p.ghost ? "#b8d9ff" : p.color;
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (p.character === "tank") {
    ctx.rect(-23, -22, 46, 42);
  } else if (p.character === "spark") {
    ctx.moveTo(0, -27);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 27);
    ctx.lineTo(-24, 0);
    ctx.closePath();
  } else if (p.character === "medic") {
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
  } else if (p.character === "grunt") {
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
  } else {
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(28, -4, 18, 25, 0, 25);
    ctx.bezierCurveTo(-18, 25, -28, -4, 0, -28);
  }
  ctx.fill();

  if (p.character === "tank") {
    ctx.fillStyle = "#dce7f2";
    ctx.fillRect(-12, -7, 24, 8);
  } else if (p.character === "spark") {
    ctx.strokeStyle = "#fff176";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.lineTo(7, -2);
    ctx.lineTo(-2, 0);
    ctx.lineTo(8, 15);
    ctx.stroke();
  } else if (p.character === "medic") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(-4, -14, 8, 28);
    ctx.fillRect(-14, -4, 28, 8);
  }
}

function draw() {
  const g = ctx.createLinearGradient(0, 0, 800, 600);
  g.addColorStop(0, "#4d837b");
  g.addColorStop(1, "#2e504c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 800, 600);
  ctx.strokeStyle = "#ffffff14";
  ctx.lineWidth = 3;
  for (let x = 0; x < 800; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 0; y < 600; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }
  if (gameMeta.mode === "zone" || gameMeta.mode === "soloZone") {
    ctx.strokeStyle = "#75d8ff99";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(400, 300, 70, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (gameMeta.mode === "showdown") {
    ctx.strokeStyle = "#ff6978aa";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(400, 300, gameMeta.safeRadius || 350, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const item of gameMeta.items || []) {
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.type === "gem" ? "G" : "C", item.x, item.y + 8);
  }
  for (const p of players) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alive ? 1 : .38;
    ctx.fillStyle = "#0005";
    ctx.beginPath();
    ctx.ellipse(4, 18, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCharacter(p);
    if (p.team) {
      ctx.strokeStyle = p.team === "red" ? "#ff606c" : "#55bfff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.walled) {
      ctx.strokeStyle = "#d6e8ff";
      ctx.lineWidth = 7;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (p.haunted) {
      ctx.strokeStyle = "#8d60ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.ghostPing) {
      ctx.strokeStyle = "#ffed72";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.shield) {
      ctx.strokeStyle = "#d8ecff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 27, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.hit) {
      ctx.strokeStyle = p.bot ? "#ffd166" : "#ff5964";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-7, -3, 4, 0, Math.PI * 2);
    ctx.arc(7, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    if (p.alive) {
      ctx.fillStyle = "#1a223c";
      ctx.fillRect(-22, -34, 44, 5);
      ctx.fillStyle = "#63eb83";
      ctx.fillRect(-22, -34, 44 * (p.health / p.maxHealth), 5);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${p.name}${p.ghost ? " GHOST" : ""} - ${p.score}`, 0, -43);
    ctx.restore();
  }
  const me = players.find(p => p.id === playerId);
  if (me?.inked) {
    ctx.fillStyle = "#10101de8";
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = "#b6b6d0";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("INKED!", 400, 300);
  }
  requestAnimationFrame(draw);
}
draw();

let installEvent;
const install = document.querySelector("#install");
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  installEvent = e;
  install.hidden = false;
});
install.onclick = async () => {
  await installEvent?.prompt();
  install.hidden = true;
};
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js");
