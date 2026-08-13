const socket = io(BrawlClaUiRuntime.serverUrl, { transports: ["websocket", "polling"] });
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
const personalBestEl = document.querySelector("#personal-best");
const currentRunEl = document.querySelector("#current-run");
const leaderboardList = document.querySelector("#leaderboard-list");
const survivalGameStats = document.querySelector("#survival-game-stats");
const gamePersonalBestEl = document.querySelector("#game-personal-best");
const gameGlobalBestEl = document.querySelector("#game-global-best");
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
const playerKey = "brawlclaui-player-id";
const playerId = sessionStorage.getItem(playerKey) || crypto.randomUUID();
sessionStorage.setItem(playerKey, playerId);
const languageKey = "brawlclaui-language";
const survivalBestKey = "brawlclaui-survival-best";
const unlockedCharactersKey = "brawlclaui-unlocked-characters";
const lockedCharacters = new Set(["boomer", "tank", "spark", "medic"]);
const translations = {
  en: {
    title: "Brawl anywhere.",
    subtitle: "Choose a brawler, game mode, and controls.",
    languageLabel: "LANGUAGE",
    languageSystem: "Use device language",
    namePlaceholder: "Your name",
    brawlerLabel: "YOUR BRAWLER",
    bobName: "Bob",
    boomerName: "Boomer",
    auroraName: "\u05d0\u05d5\u05e8\u05e8\u05d4",
    blazeDesc: "Starting Character",
    boomerDesc: "",
    unlockBoomer: "Beat wave 10 with Bob",
    boomerUnlocked: "Boomer unlocked",
    lockedCharacter: "Locked",
    tankDesc: "Snow Princess",
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
    kos: "KOs",
    personalBest: "BEST",
    currentRun: "CURRENT",
    globalBest: "GLOBAL",
    globalLeaders: "GLOBAL BEST",
    noLeaders: "No scores yet",
    secondsShort: "s"
  },
  he: {
    title: "\u05e7\u05e8\u05d1 \u05de\u05db\u05dc \u05de\u05db\u05e9\u05d9\u05e8.",
    subtitle: "\u05d1\u05d7\u05e8 \u05d3\u05de\u05d5\u05ea, \u05de\u05e6\u05d1 \u05de\u05e9\u05d7\u05e7 \u05d5\u05e9\u05dc\u05d9\u05d8\u05d4.",
    languageLabel: "\u05e9\u05e4\u05d4",
    languageSystem: "\u05dc\u05e4\u05d9 \u05e9\u05e4\u05ea \u05d4\u05de\u05db\u05e9\u05d9\u05e8",
    namePlaceholder: "\u05d4\u05e9\u05dd \u05e9\u05dc\u05da",
    brawlerLabel: "\u05d3\u05de\u05d5\u05ea",
    bobName: "\u05d1\u05d5\u05d1",
    boomerName: "\u05d1\u05d5\u05de\u05e8",
    auroraName: "\u05d0\u05d5\u05e8\u05e8\u05d4",
    blazeDesc: "\u05d4\u05d3\u05de\u05d5\u05ea \u05d4\u05d4\u05ea\u05d7\u05dc\u05ea\u05d9\u05ea",
    boomerDesc: "",
    unlockBoomer: "\u05e0\u05e6\u05d7 \u05d0\u05ea \u05d2\u05dc 10 \u05e2\u05dd \u05d1\u05d5\u05d1",
    boomerUnlocked: "\u05d1\u05d5\u05de\u05e8 \u05e0\u05e4\u05ea\u05d7",
    lockedCharacter: "\u05e0\u05e2\u05d5\u05dc",
    tankDesc: "\u05e0\u05e1\u05d9\u05db\u05ea \u05d4\u05e9\u05dc\u05d2",
    sparkDesc: "\u05de\u05d4\u05d9\u05e8 \u05de\u05d0\u05d5\u05d3",
    medicDesc: "\u05e8\u05d9\u05e4\u05d5\u05d9 \u05e2\u05e6\u05de\u05d9",
    modeLabel: "\u05de\u05e6\u05d1 \u05de\u05e9\u05d7\u05e7",
    modeSurvival: "\u05d4\u05d9\u05e9\u05e8\u05d3\u05d5\u05ea - \u05d2\u05dc\u05d9 \u05d1\u05d5\u05d8\u05d9\u05dd",
    modeBrawl: "\u05e7\u05e8\u05d1 \u05d9\u05d7\u05d9\u05d3 - \u05d4\u05d0\u05d7\u05e8\u05d5\u05df \u05e9\u05e0\u05e9\u05d0\u05e8",
    modeGems: "\u05d0\u05d9\u05e1\u05d5\u05e3 \u05d9\u05d4\u05dc\u05d5\u05de\u05d9\u05dd - 10 \u05dc\u05e0\u05d9\u05e6\u05d7\u05d5\u05df",
    modeShowdown: "\u05e9\u05d5\u05d0\u05d5\u05d3\u05d0\u05d5\u05df - \u05d4\u05d0\u05d7\u05e8\u05d5\u05df \u05e9\u05e0\u05e9\u05d0\u05e8",
    modeCoins: "\u05de\u05e8\u05d5\u05e5 \u05de\u05d8\u05d1\u05e2\u05d5\u05ea - 15 \u05dc\u05e0\u05d9\u05e6\u05d7\u05d5\u05df",
    modeZone: "\u05e9\u05dc\u05d9\u05d8\u05d4 \u05d1\u05d0\u05d6\u05d5\u05e8 - \u05d0\u05d3\u05d5\u05dd \u05de\u05d5\u05dc \u05db\u05d7\u05d5\u05dc",
    modeSoloZone: "\u05e9\u05dc\u05d9\u05d8\u05d4 \u05d9\u05d7\u05d9\u05d3 - 15 \u05e9\u05e0\u05d9\u05d5\u05ea",
    controlsLabel: "\u05e9\u05dc\u05d9\u05d8\u05d4",
    controlTouch: "\u05d8\u05dc\u05e4\u05d5\u05df / \u05de\u05d2\u05e2",
    controlKeyboard: "\u05de\u05e7\u05dc\u05d3\u05ea \u05de\u05d7\u05e9\u05d1",
    controlGamepad: "\u05e9\u05dc\u05d8 Bluetooth / USB",
    keysMove: "\u05d7\u05e6\u05d9\u05dd",
    keysAttack: "J \u05d4\u05ea\u05e7\u05e4\u05d4",
    keysSpecial: "K \u05de\u05d9\u05d5\u05d7\u05d3",
    create: "\u05e6\u05d5\u05e8 \u05de\u05e9\u05d7\u05e7",
    playNow: "\u05e9\u05d7\u05e7 \u05e2\u05db\u05e9\u05d9\u05d5",
    roomCodeLabel: "\u05e7\u05d5\u05d3 \u05d7\u05d3\u05e8",
    findingPlayers: "\u05de\u05d7\u05e4\u05e9 \u05e9\u05d7\u05e7\u05e0\u05d9\u05dd...",
    readyRoom: "\u05de\u05d5\u05db\u05df - \u05e9\u05ea\u05e3 \u05d0\u05ea \u05d4\u05e7\u05d5\u05d3 \u05d0\u05d5 \u05dc\u05d7\u05e5 \u05e9\u05d7\u05e7",
    joinDivider: "\u05d0\u05d5 \u05d4\u05e6\u05d8\u05e8\u05e3 \u05dc\u05d7\u05d1\u05e8",
    codePlaceholder: "\u05e7\u05d5\u05d3",
    join: "\u05d4\u05e6\u05d8\u05e8\u05e3",
    install: "\u05d4\u05ea\u05e7\u05df \u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4",
    leaveAria: "\u05e6\u05d0 \u05de\u05d4\u05de\u05e9\u05d7\u05e7",
    initialObjective: "\u05e9\u05ea\u05e3 \u05d0\u05ea \u05e7\u05d5\u05d3 \u05d4\u05d7\u05d3\u05e8 \u05db\u05d3\u05d9 \u05dc\u05e9\u05d7\u05e7 \u05d9\u05d7\u05d3",
    attack: "\u05d4\u05ea\u05e7\u05e4\u05d4",
    special: "\u05de\u05d9\u05d5\u05d7\u05d3",
    useItem: "\u05d4\u05e9\u05ea\u05de\u05e9",
    ping: "\u05e1\u05d9\u05de\u05d5\u05df",
    survivalEnded: "\u05d4\u05d4\u05d9\u05e9\u05e8\u05d3\u05d5\u05ea \u05d4\u05e1\u05ea\u05d9\u05d9\u05de\u05d4",
    createAgain: "\u05e6\u05d5\u05e8 \u05de\u05e9\u05d7\u05e7 \u05d7\u05d3\u05e9 \u05db\u05d3\u05d9 \u05dc\u05e9\u05d7\u05e7 \u05e9\u05d5\u05d1",
    shareRoom: "\u05e9\u05ea\u05e3 \u05d0\u05ea \u05e7\u05d5\u05d3 \u05d4\u05d7\u05d3\u05e8 \u05db\u05d3\u05d9 \u05dc\u05e9\u05d7\u05e7 \u05d9\u05d7\u05d3",
    reconnecting: "\u05de\u05ea\u05d7\u05d1\u05e8 \u05de\u05d7\u05d3\u05e9...",
    ghostCharge: "\u05d0\u05ea\u05d4 \u05e8\u05d5\u05d7 - \u05e4\u05e8\u05d9\u05d8 \u05e0\u05d8\u05e2\u05df \u05db\u05dc 30 \u05e9\u05e0\u05d9\u05d5\u05ea",
    targetSelected: "\u05e0\u05d1\u05d7\u05e8 \u05d9\u05e2\u05d3",
    wave: "\u05d2\u05dc",
    survived: "\u05e9\u05e0\u05d9\u05d5\u05ea \u05e9\u05e8\u05d3\u05ea",
    bots: "\u05d1\u05d5\u05d8\u05d9\u05dd",
    botSingular: "\u05d1\u05d5\u05d8",
    botPlural: "\u05d1\u05d5\u05d8\u05d9\u05dd",
    playerSingular: "\u05e9\u05d7\u05e7\u05df",
    playerPlural: "\u05e9\u05d7\u05e7\u05e0\u05d9\u05dd",
    room: "\u05d7\u05d3\u05e8",
    control: "\u05e9\u05dc\u05d9\u05d8\u05d4",
    red: "\u05d0\u05d3\u05d5\u05dd",
    blue: "\u05db\u05d7\u05d5\u05dc",
    teamWins: "\u05e0\u05d9\u05e6\u05d7\u05d5",
    wins: "\u05e0\u05d9\u05e6\u05d7",
    kos: "\u05d7\u05d9\u05e1\u05d5\u05dc\u05d9\u05dd",
    personalBest: "\u05e9\u05d9\u05d0",
    currentRun: "\u05e2\u05db\u05e9\u05d9\u05d5",
    globalBest: "\u05db\u05dc\u05dc\u05d9",
    globalLeaders: "\u05d8\u05d1\u05dc\u05ea \u05e9\u05d9\u05d0\u05d9\u05dd",
    noLeaders: "\u05d0\u05d9\u05df \u05e9\u05d9\u05d0\u05d9\u05dd \u05e2\u05d3\u05d9\u05d9\u05df",
    secondsShort: "\u05e9'"
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
function formatSeconds(value) {
  return `${Math.max(0, Math.floor(Number(value) || 0))}${t("secondsShort")}`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function renderSurvivalStats() {
  const current = gameMeta.mode === "survival" ? gameMeta.survivalTime || 0 : 0;
  if (gameMeta.mode === "survival" && gameMeta.winner && current > personalBest) {
    personalBest = current;
    localStorage.setItem(survivalBestKey, String(personalBest));
  }
  const globalBest = gameMeta.survivalLeaders?.[0]?.time || 0;
  if (personalBestEl) personalBestEl.textContent = formatSeconds(personalBest);
  if (currentRunEl) currentRunEl.textContent = formatSeconds(current);
  if (gamePersonalBestEl) gamePersonalBestEl.textContent = formatSeconds(personalBest);
  if (gameGlobalBestEl) gameGlobalBestEl.textContent = formatSeconds(globalBest);
  if (survivalGameStats) survivalGameStats.hidden = gameMeta.mode !== "survival";
  if (!leaderboardList) return;
  const leaders = gameMeta.survivalLeaders || [];
  leaderboardList.innerHTML = leaders.length
    ? leaders.slice(0, 5).map(entry => `<li><span>${escapeHtml(entry.name)}</span><strong>${formatSeconds(entry.time)}</strong><em>${entry.score || 0} ${t("kos")}</em></li>`).join("")
    : `<li>${t("noLeaders")}</li>`;
}
function unlockedCharacters() {
  try {
    return new Set(JSON.parse(localStorage.getItem(unlockedCharactersKey) || "[]"));
  } catch {
    return new Set();
  }
}
function isCharacterUnlocked(character) {
  return !lockedCharacters.has(character) || unlockedCharacters().has(character);
}
function unlockCharacter(character) {
  const unlocked = unlockedCharacters();
  if (unlocked.has(character)) return false;
  unlocked.add(character);
  localStorage.setItem(unlockedCharactersKey, JSON.stringify([...unlocked]));
  renderCharacterLocks();
  return true;
}
function renderCharacterLocks() {
  document.querySelectorAll("[data-character]").forEach(button => {
    const character = button.dataset.character;
    const locked = !isCharacterUnlocked(character);
    button.classList.toggle("locked", locked);
    button.disabled = locked;
    const label = button.querySelector("small");
    if (label && locked) label.textContent = character === "boomer" ? t("unlockBoomer") : t("lockedCharacter");
    else if (label && character === "boomer") label.textContent = t("boomerDesc");
    if (locked && button.classList.contains("selected")) {
      selectedCharacter = "blaze";
      document.querySelectorAll("[data-character]").forEach(b => b.classList.toggle("selected", b.dataset.character === selectedCharacter));
    }
  });
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
  renderSurvivalStats();
  updateMeta();
  renderCharacterLocks();
}
let roomCode = "";
let players = [];
let wasPlaying = false;
let selectedCharacter = "blaze";
let gameMeta = { items: [], zoneScore: {} };
let controlMode = localStorage.getItem("brawlclaui-control-mode") || "touch";
let autoJoinTimer = 0;
let phoneOrigin = location.origin;
let personalBest = Number(localStorage.getItem(survivalBestKey)) || 0;
const characterImages = Object.fromEntries(["blaze", "boomer", "tank", "spark", "medic"].map(id => {
  const image = new Image();
  image.src = `/characters/${id}.png`;
  return [id, image];
}));
const motionState = new Map();
const fallbackArena = { width: 1200, height: 900, zoneRadius: 95, obstacles: [], bushes: [], spawnPoints: [] };
const viewport = { width: 800, height: 600 };
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

nameInput.value = localStorage.getItem("brawlclaui-name") || "";
languageSelect.value = localStorage.getItem(languageKey) || "system";
controlModeSelect.value = controlMode;
applyLanguage();
applyControlMode();
renderSurvivalStats();
loadPhoneOrigin();

function name() {
  return nameInput.value.trim().slice(0, 14);
}

function requestAppFullscreen() {
  const target = document.documentElement;
  if (document.fullscreenElement || !target.requestFullscreen) return;
  try {
    target.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  } catch {}
}

function enter(reply) {
  if (!reply.ok) return error.textContent = reply.error;
  roomCode = reply.code;
  players = reply.players;
  gameMeta = reply.meta || gameMeta;
  wasPlaying = true;
  localStorage.setItem("brawlclaui-name", name());
  localStorage.setItem("brawlclaui-room", roomCode);
  lobby.hidden = true;
  game.hidden = false;
  document.documentElement.classList.add("playing");
  document.body.classList.add("playing");
  window.scrollTo(0, 0);
  document.querySelector("#room-label").textContent = `${t("room")} ${roomCode}`;
  applyControlMode();
  updateMeta();
}

function updateLobbyRoom() {
  if (!lobbyRoomCode || !matchStatus) return;
  lobbyRoomCode.textContent = roomCode || "----";
  matchStatus.textContent = roomCode ? `${t("readyRoom")} - ${players.filter(p => !p.bot).length}/8` : t("initialObjective");
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

function queueAutoJoin() {
  window.clearTimeout(autoJoinTimer);
  autoJoinTimer = window.setTimeout(updateLobbyRoom, 120);
}

function updateMeta() {
  renderSurvivalStats();
  if (!gameMeta.mode) {
    document.querySelector("#objective").textContent = t("initialObjective");
    document.querySelector("#help").textContent = "";
    return;
  }
  const me = players.find(p => p.id === playerId);
  const winner = gameMeta.winnerTeam
    ? `${gameMeta.winnerTeam === "red" ? t("red") : t("blue")} ${t("teamWins")} ${gameMeta.modeName}!`
    : gameMeta.mode === "survival" && gameMeta.rewardCharacter === "boomer" && gameMeta.winner?.id === playerId
      ? t("boomerUnlocked")
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
  localStorage.setItem("brawlclaui-control-mode", controlMode);
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
    if (!isCharacterUnlocked(button.dataset.character)) return;
    selectedCharacter = button.dataset.character;
    document.querySelectorAll("[data-character]").forEach(b => b.classList.toggle("selected", b === button));
    queueAutoJoin();
  };
});
document.querySelector("#mode").addEventListener("change", queueAutoJoin);
nameInput.addEventListener("change", queueAutoJoin);
document.querySelector("#create").onclick = () => {
  requestAppFullscreen();
  if (roomCode) return enter({ ok: true, code: roomCode, players, meta: gameMeta });
  socket.emit("player:autoJoin", { playerId, name: name(), character: selectedCharacter, mode: document.querySelector("#mode").value }, enter);
};
document.querySelector("#join").onclick = () => {
  requestAppFullscreen();
  socket.emit("player:join", { code: codeInput.value.trim().toUpperCase(), playerId, name: name(), character: selectedCharacter }, enter);
};
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
    special.classList.remove("charging", "ready");
    document.querySelector("#help").textContent = me.ghostItem ? `${me.ghostItemName}: tap a living player, then use it` : t("ghostCharge");
  } else {
    const charge = Math.min(me?.specialCharge || 0, me?.specialRequired || 5);
    const required = me?.specialRequired || 5;
    special.textContent = charge >= required ? t("special") : `${t("special")} ${charge}/${required}`;
    special.classList.toggle("charging", charge < required);
    special.classList.toggle("ready", charge >= required);
  }
});
socket.on("game:meta", next => {
  gameMeta = next;
  if (next.mode === "survival" && next.rewardCharacter === "boomer" && next.winner?.id === playerId) unlockCharacter("boomer");
  updateMeta();
  if (next.mode === "survival") document.querySelector("#count").textContent = `${t("wave")} ${next.wave || 1} - ${next.survivalTime || 0}s`;
  if (next.mode === "zone") document.querySelector("#count").textContent = `${t("red")} ${Math.floor(next.zoneScore?.red || 0)} - ${Math.floor(next.zoneScore?.blue || 0)} ${t("blue")}`;
  if (next.mode === "soloZone") document.querySelector("#count").textContent = `${t("control")} ${Math.floor(next.zoneScore?.[playerId] || 0)} / 15`;
});
socket.on("disconnect", () => { if (wasPlaying) document.querySelector("#help").textContent = t("reconnecting"); });
socket.on("connect", () => {
  if (wasPlaying && roomCode) socket.emit("player:join", { code: roomCode, playerId, name: name(), character: selectedCharacter }, enter);
  else updateLobbyRoom();
});
updateLobbyRoom();

const zone = document.querySelector("#stick-zone");
const knob = document.querySelector("#stick-knob");
function moveStick(e) {
  e.preventDefault();
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
zone.addEventListener("pointerdown", e => { e.preventDefault(); zone.setPointerCapture(e.pointerId); moveStick(e); });
zone.addEventListener("pointermove", e => { e.preventDefault(); if (zone.hasPointerCapture(e.pointerId)) moveStick(e); });
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
window.addEventListener("touchmove", event => {
  if (!game.hidden) event.preventDefault();
}, { passive: false });
window.addEventListener("wheel", event => {
  if (!game.hidden) event.preventDefault();
}, { passive: false });
window.addEventListener("scroll", () => {
  if (!game.hidden) window.scrollTo(0, 0);
});

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  const me = players.find(p => p.id === playerId);
  if (!me?.ghost) return;
  const rect = canvas.getBoundingClientRect();
  const arena = gameMeta.arena || fallbackArena;
  const camera = cameraFor(arena);
  const x = camera.x + (event.clientX - rect.left) * canvas.width / rect.width;
  const y = camera.y + (event.clientY - rect.top) * canvas.height / rect.height;
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

function motionFor(p, now) {
  const previous = motionState.get(p.id) || { x: p.x, y: p.y, phase: 0 };
  const distance = Math.hypot(p.x - previous.x, p.y - previous.y);
  const moving = p.alive && distance > .18;
  const phase = moving ? previous.phase + distance * .42 : previous.phase;
  motionState.set(p.id, { x: p.x, y: p.y, phase });
  return {
    moving,
    bob: moving ? Math.sin(phase * 2) * 1.7 : 0,
    leg: moving ? Math.sin(phase) : 0
  };
}

function drawCharacter(p, motion) {
  const image = characterImages[p.character];
  if (image?.complete && image.naturalWidth) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, -24, -24, 48, 48);
    ctx.restore();
    return true;
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
  return false;
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function cameraFor(arena) {
  const me = players.find(p => p.id === playerId) || players.find(p => p.alive);
  const viewWidth = Math.min(viewport.width, arena.width);
  const viewHeight = Math.min(viewport.height, arena.height);
  return {
    x: clamp((me?.x || arena.width / 2) - viewWidth / 2, 0, Math.max(0, arena.width - viewWidth)),
    y: clamp((me?.y || arena.height / 2) - viewHeight / 2, 0, Math.max(0, arena.height - viewHeight)),
    width: viewWidth,
    height: viewHeight
  };
}

function drawArena(now) {
  const arena = gameMeta.arena || fallbackArena;
  const camera = cameraFor(arena);
  if (canvas.width !== camera.width || canvas.height !== camera.height) {
    canvas.width = camera.width;
    canvas.height = camera.height;
  }
  const centerX = arena.width / 2;
  const centerY = arena.height / 2;
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  const g = ctx.createLinearGradient(0, 0, arena.width, arena.height);
  g.addColorStop(0, "#5f986f");
  g.addColorStop(.56, "#47765e");
  g.addColorStop(1, "#315b54");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, arena.width, arena.height);

  ctx.fillStyle = "#45685b";
  ctx.fillRect(0, centerY - 54, arena.width, 108);
  ctx.fillRect(centerX - 54, 0, 108, arena.height);
  ctx.fillStyle = "#6e9f6c";
  for (let x = 28; x < arena.width; x += 64) {
    for (let y = 30; y < arena.height; y += 64) {
      ctx.globalAlpha = ((x + y) / 64) % 2 ? .1 : .05;
      ctx.fillRect(x, y, 34, 24);
    }
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#ffffff13";
  ctx.lineWidth = 2;
  for (let x = 40; x < arena.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, arena.height);
    ctx.stroke();
  }
  for (let y = 40; y < arena.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(arena.width, y);
    ctx.stroke();
  }

  for (const bush of arena.bushes || []) {
    const pulse = Math.sin(now / 650 + bush.x * .01) * 2;
    ctx.fillStyle = "#286f46cc";
    drawRoundedRect(bush.x, bush.y + pulse, bush.w, bush.h, 18);
    ctx.fill();
    ctx.fillStyle = "#55b86c88";
    for (let x = bush.x + 14; x < bush.x + bush.w - 8; x += 24) {
      ctx.beginPath();
      ctx.arc(x, bush.y + bush.h / 2 + Math.sin(now / 500 + x) * 4, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const block of arena.obstacles || []) {
    ctx.fillStyle = "#00000024";
    drawRoundedRect(block.x + 5, block.y + 8, block.w, block.h, 8);
    ctx.fill();
    const bg = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.h);
    bg.addColorStop(0, block.kind === "crate" ? "#bd8751" : "#9aa3a0");
    bg.addColorStop(1, block.kind === "crate" ? "#7b5131" : "#59615f");
    ctx.fillStyle = bg;
    drawRoundedRect(block.x, block.y, block.w, block.h, 8);
    ctx.fill();
    ctx.strokeStyle = "#ffffff35";
    ctx.lineWidth = 2;
    drawRoundedRect(block.x + 3, block.y + 3, block.w - 6, block.h - 6, 6);
    ctx.stroke();
  }

  if (gameMeta.mode === "zone" || gameMeta.mode === "soloZone") {
    ctx.fillStyle = "#75d8ff22";
    ctx.strokeStyle = "#75d8ffcc";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arena.zoneRadius || 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (gameMeta.mode === "showdown") {
    ctx.strokeStyle = "#ff6978cc";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, gameMeta.safeRadius || Math.min(arena.width, arena.height) * .58, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProjectile(projectile, now) {
  const angle = Math.atan2(projectile.vy, projectile.vx);
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#00000035";
  ctx.beginPath();
  ctx.ellipse(-3, 9, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (projectile.type === "rocket") {
    const flicker = Math.sin(now / 55 + projectile.x) * 2;
    ctx.fillStyle = "#ff7b35";
    ctx.beginPath();
    ctx.moveTo(-18 - flicker, 0);
    ctx.lineTo(-30 - flicker, -7);
    ctx.lineTo(-26 - flicker, 0);
    ctx.lineTo(-30 - flicker, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f4f0df";
    drawRoundedRect(-18, -7, 28, 14, 6);
    ctx.fill();
    ctx.fillStyle = projectile.color || "#ff5964";
    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.lineTo(24, 0);
    ctx.lineTo(10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#314057";
    ctx.fillRect(-7, -10, 7, 20);
  } else {
    ctx.fillStyle = projectile.color || "#ffd761";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffffaa";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  const now = performance.now();
  const arena = gameMeta.arena || fallbackArena;
  const camera = cameraFor(arena);
  drawArena(now);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (const item of gameMeta.items || []) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.fillStyle = "#00000035";
    ctx.beginPath();
    ctx.ellipse(3, 10, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (item.type === "gem") {
      ctx.fillStyle = "#74e5ff";
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffffaa";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ffd761";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9c6a20";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const projectile of gameMeta.projectiles || []) drawProjectile(projectile, now);
  for (const p of players) {
    const motion = motionFor(p, now);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alive ? 1 : .38;
    ctx.fillStyle = "#0005";
    ctx.beginPath();
    ctx.ellipse(4, 18, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    const imageCharacter = drawCharacter(p, motion);
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
    if (!imageCharacter) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-7, -3, 4, 0, Math.PI * 2);
      ctx.arc(7, -3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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
  ctx.restore();
  const me = players.find(p => p.id === playerId);
  if (me?.inked) {
    ctx.fillStyle = "#10101de8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#b6b6d0";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("INKED!", canvas.width / 2, canvas.height / 2);
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
