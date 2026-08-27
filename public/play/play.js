const socket = io(BrawlClaUiRuntime.serverUrl, { transports: ["websocket", "polling"] });
const lobby = document.querySelector("#lobby");
const game = document.querySelector("#game");
const profileGate = document.querySelector("#profile-gate");
const profileLanguageSelect = document.querySelector("#profile-language");
const profileLanguageButtons = document.querySelectorAll("[data-profile-language]");
const profileNameInput = document.querySelector("#profile-name");
const profileContinue = document.querySelector("#profile-continue");
const profileStatus = document.querySelector("#profile-status");
const nameInput = document.querySelector("#name");
const codeInput = document.querySelector("#code");
const error = document.querySelector("#error");
const canvas = document.querySelector("#arena");
const ctx = canvas.getContext("2d");
const lobbyRoomCode = document.querySelector("#lobby-room-code");
const serverJoinCodeEl = document.querySelector("#server-join-code");
const roomLabel = document.querySelector("#room-label");
const serverLabel = document.querySelector("#server-label");
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
const gamepadPanel = document.querySelector("#gamepad-panel");
const gamepadStatus = document.querySelector("#gamepad-status");
const controls = document.querySelector(".controls");
const accountStatus = document.querySelector("#account-status");
const googleSignIn = document.querySelector("#google-sign-in");
const googleSignOut = document.querySelector("#google-sign-out");
const newLocalPlayer = document.querySelector("#new-local-player");
const creditsCount = document.querySelector("#credits-count");
const powerPointsCount = document.querySelector("#power-points-count");
const moneyCount = document.querySelector("#money-count");
const rewardScreen = document.querySelector("#reward-screen");
const rewardResult = document.querySelector("#reward-result");
const rewardKillsCount = document.querySelector("#reward-kills-count");
const rewardCredits = document.querySelector("#reward-credits");
const rewardPowerPoints = document.querySelector("#reward-power-points");
const rewardMoney = document.querySelector("#reward-money");
const rewardClose = document.querySelector("#reward-close");
const characterPickerOpen = document.querySelector("#character-picker-open");
const characterPicker = document.querySelector("#character-picker");
const characterPickerClose = document.querySelector("#character-picker-close");
const characterConfirm = document.querySelector("#character-confirm");
const characterPrev = document.querySelector("#character-prev");
const characterNext = document.querySelector("#character-next");
const currentCharacterName = document.querySelector("#current-character-name");
const adminToggle = document.querySelector("#admin-toggle");
const adminPanel = document.querySelector("#admin-panel");
const adminRoleBadge = document.querySelector("#admin-role-badge");
const adminRoomBadge = document.querySelector("#admin-room-badge");
const adminPlayersBadge = document.querySelector("#admin-players-badge");
const adminTargetInfo = document.querySelector("#admin-target-info");
const adminCommandSearch = document.querySelector("#admin-command-search");
const adminRunCommand = document.querySelector("#admin-run-command");
const adminCommandHint = document.querySelector("#admin-command-hint");
const adminPlayerSelect = document.querySelector("#admin-player");
const adminCharacterSelect = document.querySelector("#admin-character");
const adminGoogleAccount = document.querySelector("#admin-google-account");
const adminFindGoogle = document.querySelector("#admin-add-google");
const adminEmailInput = document.querySelector("#admin-email");
const adminListSelect = document.querySelector("#admin-list");
const adminAddAdmin = document.querySelector("#admin-add-admin");
const adminRemoveAdmin = document.querySelector("#admin-remove-admin");
const adminGrant = document.querySelector("#admin-grant");
const adminRevoke = document.querySelector("#admin-revoke");
const adminAllowRename = document.querySelector("#admin-allow-rename");
const adminHeal = document.querySelector("#admin-heal");
const adminEliminate = document.querySelector("#admin-eliminate");
const adminFreeze = document.querySelector("#admin-freeze");
const adminTeleport = document.querySelector("#admin-teleport");
const adminResetProgress = document.querySelector("#admin-reset-progress");
const adminKick = document.querySelector("#admin-kick");
const adminBan = document.querySelector("#admin-ban");
const adminRestart = document.querySelector("#admin-restart");
const adminStatus = document.querySelector("#admin-status");
const skyModeButton = document.querySelector("#sky-mode");
const input = { x: 0, y: 0, attack: false, special: false, skyMode: "bomb" };
const touchAim = { x: 0, y: 0, active: false };
const gamepadAim = { x: 0, y: 0, active: false };
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
const localAccountKey = "brawlclaui-local-account";
let playerId = sessionStorage.getItem(playerKey) || crypto.randomUUID();
sessionStorage.setItem(playerKey, playerId);
const languageKey = "brawlclaui-language";
const languagePickedKey = "brawlclaui-language-picked";
const profileCompletedKey = "brawlclaui-profile-completed";
const profileGateVersionKey = "brawlclaui-profile-gate-version";
const profileGateVersion = "74";
const languageCodes = ["system", "he", "en", "ar"];
const rtlLanguages = new Set(["ar", "he"]);
const survivalBestKey = "brawlclaui-survival-best";
const economyKey = "brawlclaui-economy";
const economyRewardKey = "brawlclaui-economy-last-reward";
const unlockedCharactersKey = "brawlclaui-unlocked-characters";
const nameLockedKey = "brawlclaui-name-locked";
const renameGrantKey = "brawlclaui-can-rename";
const firstGameCompletedKey = "brawlclaui-first-game-completed";
const lockedCharacters = new Set(["boomer", "fangli", "pixel", "tank", "bazaar", "ari", "skyfalcon", "masterv"]);
const characterRarities = {
  blaze: "common",
  boomer: "common",
  pixel: "common",
  fangli: "rare",
  tank: "rare",
  bazaar: "epic",
  ari: "mythic",
  skyfalcon: "legendary",
  masterv: "special"
};
const rarityCreditCosts = {
  common: 150,
  rare: 300,
  epic: 600,
  mythic: 1000,
  legendary: 1500
};
const adminOnlyCharacters = new Set(["masterv"]);
const adminGrantCharacters = ["boomer", "fangli", "pixel", "tank", "bazaar", "ari", "skyfalcon", "masterv"];
const concealedCharacterLabel = "???";
const ownerAdminEmail = "zurtzilhagever@gmail.com";
const adminEmails = new Set(["zurtzilhagever@gmail.com"]);
const adminTogglePositionKey = "brawlclaui-admin-toggle-position";
const adminInvincibleKey = "brawlclaui-admin-invincible";
let adminVerified = false;
let adminPanelOpen = false;
let adminToggleDrag = null;
let adminListRequestAt = 0;
let adminLobbyRequestAt = 0;
let adminLobbyPlayers = [];
let adminInvincibleMode = localStorage.getItem(adminInvincibleKey) === "1";
let progressStorageSuffix = "";
function progressKey(baseKey) {
  return `${baseKey}${progressStorageSuffix}`;
}
function loadStoredPersonalBest() {
  return Number(localStorage.getItem(progressKey(survivalBestKey))) || 0;
}
function normalizeEconomy(value = {}) {
  return {
    credits: Math.max(0, Math.floor(Number(value.credits) || 0)),
    powerPoints: Math.max(0, Math.floor(Number(value.powerPoints) || 0)),
    money: Math.max(0, Math.floor(Number(value.money) || 0))
  };
}
function loadEconomy() {
  try {
    return normalizeEconomy(JSON.parse(localStorage.getItem(progressKey(economyKey)) || "{}"));
  } catch {
    return normalizeEconomy();
  }
}
function saveEconomy(next) {
  const economy = normalizeEconomy(next);
  localStorage.setItem(progressKey(economyKey), JSON.stringify(economy));
  renderEconomy(economy);
  queueCloudSave();
  return economy;
}
function renderEconomy(value = loadEconomy()) {
  const economy = normalizeEconomy(value);
  if (creditsCount) creditsCount.textContent = String(economy.credits);
  if (powerPointsCount) powerPointsCount.textContent = String(economy.powerPoints);
  if (moneyCount) moneyCount.textContent = String(economy.money);
  syncCharacterPicker();
}
function addEconomy(reward = {}) {
  const current = loadEconomy();
  return saveEconomy({
    credits: current.credits + (Number(reward.credits) || 0),
    powerPoints: current.powerPoints + (Number(reward.powerPoints) || 0),
    money: current.money + (Number(reward.money) || 0)
  });
}
function spendCredits(amount) {
  const cost = Math.max(0, Math.floor(Number(amount) || 0));
  const current = loadEconomy();
  if (current.credits < cost) return false;
  saveEconomy({ ...current, credits: current.credits - cost });
  return true;
}
function playerKillCount(player) {
  return Math.max(0, Math.floor(Number(player?.kills ?? player?.kos ?? player?.score ?? 0) || 0));
}
function showRewardScreen({ reward, kills, won }) {
  if (!rewardScreen) return;
  if (rewardResult) rewardResult.textContent = won ? t("rewardWon") : t("rewardLost");
  if (rewardKillsCount) rewardKillsCount.textContent = String(kills);
  if (rewardCredits) rewardCredits.textContent = `+${reward.credits}`;
  if (rewardPowerPoints) rewardPowerPoints.textContent = `+${reward.powerPoints}`;
  if (rewardMoney) rewardMoney.textContent = `+${reward.money}`;
  rewardScreen.hidden = false;
}
function hideRewardScreen() {
  if (rewardScreen) rewardScreen.hidden = true;
}
function rewardEconomyForFinishedGame(meta) {
  if (!meta || !(meta.endedAt || meta.winner || meta.winnerTeam)) return;
  const rewardId = [roomCode || "local", meta.mode || "", meta.endedAt || "", meta.winner?.id || "", meta.winnerTeam || ""].join(":");
  if (!rewardId.trim() || localStorage.getItem(progressKey(economyRewardKey)) === rewardId) return;
  const me = players.find(player => player.id === playerId);
  if (!me) return;
  const won = meta.winner?.id === playerId || Boolean(meta.winnerTeam && me.team === meta.winnerTeam);
  const kills = playerKillCount(me);
  const reward = {
    credits: 10 + (won ? 5 : 0),
    powerPoints: 5 + (won ? 3 : 0),
    money: 20 + (won ? 10 : 0)
  };
  addEconomy(reward);
  localStorage.setItem(progressKey(economyRewardKey), rewardId);
  const message = `+${reward.credits} ${t("creditsLabel")}  +${reward.powerPoints} ${t("powerPointsLabel")}  +${reward.money} ${t("moneyLabel")}`;
  if (error) error.textContent = message;
  document.querySelector("#help").textContent = message;
  showRewardScreen({ reward, kills, won });
}
function isAdminUser(user = activeCloudUser()) {
  return adminVerified || adminEmails.has((user?.email || "").toLowerCase());
}
function isOwnerUser(user = activeCloudUser()) {
  return (user?.email || "").toLowerCase() === ownerAdminEmail;
}
const translations = {
  en: {
    brandHebrew: "\u05d1\u05e8\u05d0\u05d5\u05dc \u05db\u05dc\u05d5\u05d5\u05d9",
    title: "BrawkClaUi",
    subtitle: "Choose a brawler, game mode, and controls.",
    profileKicker: "Welcome",
    profileIntro: "Choose your language and player name.",
    profileLanguagePick: "Choose language",
    profileContinue: "Continue",
    nameRequired: "Choose a name to continue",
    languageLabel: "LANGUAGE",
    languageSystem: "Use device language",
    namePlaceholder: "Your name",
    nameLockedNotice: "Your name is locked. An admin can allow one rename.",
    renameAllowed: "Rename is available",
    renameSaved: "Name saved",
    accountLabel: "GOOGLE ACCOUNT",
    cloudGuest: "Not signed in",
    cloudSignedIn: "Signed in as",
    cloudSyncing: "Syncing progress...",
    cloudSaved: "Progress saved",
    cloudError: "Google save is unavailable",
    adminLabel: "Admin",
    adminPanelTitle: "ADMIN PANEL",
    adminCommandSearchLabel: "COMMAND CONSOLE",
    adminCommandSearchPlaceholder: "Type a command, e.g. give Banana Boomer",
    adminRunCommand: "Run",
    adminCommandMatches: "commands found",
    adminCommandNoMatches: "No matching commands",
    adminCommandEnterHint: "Type commands or help",
    adminRoomLabel: "ROOM",
    adminPlayersLabel: "PLAYERS",
    adminFindSection: "FIND PLAYER",
    adminAdminsSection: "ADMINS",
    adminTargetSection: "TARGET PLAYER",
    adminCharactersSection: "CHARACTERS",
    adminLiveSection: "LIVE CONTROL",
    adminDangerSection: "DANGER",
    adminHealth: "Health",
    adminCharacterStat: "Character",
    adminScore: "Score",
    adminStatusLabel: "Status",
    adminAlive: "Alive",
    adminDown: "Down",
    adminConnected: "Online",
    adminDisconnected: "Offline",
    adminLobby: "Lobby",
    adminGrant: "Give character",
    adminRevoke: "Remove character",
    adminAllowRename: "Allow rename",
    adminHeal: "Heal",
    adminEliminate: "Eliminate",
    adminFreeze: "Freeze",
    adminTeleport: "Bring here",
    adminResetProgress: "Reset progress",
    adminKick: "Kick player",
    adminBan: "Ban player",
    adminRestart: "Restart game",
    adminFindGoogle: "Find player",
    adminGooglePlaceholder: "Google account to search",
    adminEmailPlaceholder: "Admin Google account",
    adminAddAdmin: "Add admin",
    adminRemoveAdmin: "Remove admin",
    adminOwnerLocked: "Main admin cannot be removed",
    adminListEmpty: "No admins",
    adminNoRoom: "No active room",
    adminNoPlayers: "No other players",
    adminPickPlayer: "Choose a player",
    adminDone: "Done",
    adminFailed: "Admin action failed",
    adminPlayerFound: "Player selected",
    adminPlayerNotFound: "Player not found",
    adminInvalidEmail: "Enter a valid Google account",
    adminGrantedNotice: "Character unlocked by admin",
    adminRevokedNotice: "Character removed by admin",
    adminProgressResetNotice: "Progress reset by admin",
    adminKickedNotice: "You were removed from this room",
    adminBannedNotice: "You were banned from this room",
    signInGoogle: "Sign in with Google",
    signOut: "Sign out",
    newLocalPlayer: "New local player",
    creditsLabel: "Credits",
    powerPointsLabel: "Power points",
    moneyLabel: "Money",
    unlockWithCredits: "Unlock with",
    needCredits: "Need",
    rewardTitle: "Match rewards",
    rewardKills: "KOs",
    rewardWon: "Victory",
    rewardLost: "Game ended",
    closeRewards: "Close",
    rarityCommon: "Common",
    rarityRare: "Rare",
    rarityEpic: "Epic",
    rarityMythic: "Mythic",
    rarityLegendary: "Legendary",
    raritySpecial: "Special",
    chooseCharacter: "Choose character",
    chooseForGame: "Choose for game",
    closePicker: "Close",
    localPlayerCreated: "New local player created",
    brawlerLabel: "YOUR BRAWLER",
    bobName: "Bob",
    boomerName: "Boomer",
    fangliName: "Fangli",
    pixelName: "Pixel",
    auroraName: "\u05d0\u05d5\u05e8\u05e8\u05d4",
    bazaarName: "Bazaar",
    ariName: "Ari",
    skyFalconName: "Sky Falcon",
    mastervName: "Master V",
    blazeDesc: "3 tennis-ball volley",
    boomerDesc: "Boomerang - waits for return",
    fangliDesc: "Long bone shot, stronger when hurt",
    pixelDesc: "Fast ricochet laser",
    unlockBoomer: "Beat wave 10 with Bob",
    unlockPixel: "Finish one game to unlock",
    boomerUnlocked: "Boomer unlocked",
    pixelUnlocked: "Pixel unlocked",
    lockedCharacter: "Locked",
    tankDesc: "Snowstorm + ice field",
    bazaarDesc: "Coin chain + buff box",
    ariDesc: "Claw punch + wall-breaking slash",
    skyFalconDesc: "Gold feather + bomb or clone",
    mastervDesc: "Admin-only ultimate brawler",
    skyBombMode: "BOMB",
    skyCloneMode: "CLONE",
    adminOnlyCharacter: "Special character",
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
    gamepadTitle: "Controller mode",
    gamepadWaiting: "Press any button on the controller",
    gamepadConnected: "Controller connected",
    gamepadPlayStationHint: "R2 attack, L2 super, right stick aim",
    gamepadHelp: "Connect the controller to Bluetooth or USB, then return to the game.",
    keysMove: "ARROWS",
    keysAttack: "J ATTACK",
    keysSpecial: "K SUPER",
    create: "CREATE A GAME",
    playNow: "PLAY NOW",
    roomCodeLabel: "ROOM CODE",
    serverCodeLabel: "SERVER CODE",
    findingPlayers: "Finding players...",
    readyRoom: "Ready - share this code or press Play",
    joinDivider: "OR JOIN A FRIEND",
    codePlaceholder: "ROOM OR SERVER CODE",
    join: "JOIN",
    install: "INSTALL GAME",
    installHelp: "To install the game, open your browser menu and choose Install app or Add to Home Screen.",
    leaveAria: "Leave game",
    initialObjective: "Share the room code to play together",
    adminInvinciblePrompt: "Admin mode: press OK to be invincible, or Cancel to play normally.",
    adminInvincibleOn: "Admin invincible mode",
    adminInvincibleOff: "Admin normal mode",
    attack: "ATTACK",
    special: "SUPER",
    useItem: "USE ITEM",
    useBuff: "USE BUFF",
    gotBuff: "Buff received",
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
    brandHebrew: "\u05d1\u05e8\u05d0\u05d5\u05dc \u05db\u05dc\u05d5\u05d5\u05d9",
    title: "BrawkClaUi",
    subtitle: "\u05d1\u05d7\u05e8 \u05d3\u05de\u05d5\u05ea, \u05de\u05e6\u05d1 \u05de\u05e9\u05d7\u05e7 \u05d5\u05e9\u05dc\u05d9\u05d8\u05d4.",
    profileKicker: "\u05d1\u05e8\u05d5\u05da \u05d4\u05d1\u05d0",
    profileIntro: "\u05d1\u05d7\u05e8 \u05e9\u05e4\u05d4 \u05d5\u05e9\u05dd \u05e9\u05d7\u05e7\u05df.",
    profileLanguagePick: "\u05d1\u05d7\u05e8 \u05e9\u05e4\u05d4",
    profileContinue: "\u05d4\u05de\u05e9\u05da",
    nameRequired: "\u05d1\u05d7\u05e8 \u05e9\u05dd \u05db\u05d3\u05d9 \u05dc\u05d4\u05de\u05e9\u05d9\u05da",
    languageLabel: "\u05e9\u05e4\u05d4",
    languageSystem: "\u05dc\u05e4\u05d9 \u05e9\u05e4\u05ea \u05d4\u05de\u05db\u05e9\u05d9\u05e8",
    namePlaceholder: "\u05d4\u05e9\u05dd \u05e9\u05dc\u05da",
    nameLockedNotice: "\u05d4\u05e9\u05dd \u05e0\u05e2\u05d5\u05dc. \u05d0\u05d3\u05de\u05d9\u05df \u05d9\u05db\u05d5\u05dc \u05dc\u05d0\u05e4\u05e9\u05e8 \u05e9\u05d9\u05e0\u05d5\u05d9 \u05d7\u05d3-\u05e4\u05e2\u05de\u05d9.",
    renameAllowed: "\u05e9\u05d9\u05e0\u05d5\u05d9 \u05e9\u05dd \u05e4\u05ea\u05d5\u05d7",
    renameSaved: "\u05d4\u05e9\u05dd \u05e0\u05e9\u05de\u05e8",
    accountLabel: "\u05d7\u05e9\u05d1\u05d5\u05df Google",
    cloudGuest: "\u05dc\u05d0 \u05de\u05d7\u05d5\u05d1\u05e8",
    cloudSignedIn: "\u05de\u05d7\u05d5\u05d1\u05e8 \u05db\u05de\u05d5",
    cloudSyncing: "\u05de\u05e1\u05e0\u05db\u05e8\u05df \u05d4\u05ea\u05e7\u05d3\u05de\u05d5\u05ea...",
    cloudSaved: "\u05d4\u05d4\u05ea\u05e7\u05d3\u05de\u05d5\u05ea \u05e0\u05e9\u05de\u05e8\u05d4",
    cloudError: "\u05e9\u05de\u05d9\u05e8\u05ea Google \u05dc\u05d0 \u05d6\u05de\u05d9\u05e0\u05d4",
    adminLabel: "\u05d0\u05d3\u05de\u05d9\u05df",
    adminPanelTitle: "\u05e4\u05d0\u05e0\u05dc \u05d0\u05d3\u05de\u05d9\u05df",
    adminCommandSearchLabel: "\u05e7\u05d5\u05e0\u05e1\u05d5\u05dc\u05ea \u05e4\u05e7\u05d5\u05d3\u05d5\u05ea",
    adminCommandSearchPlaceholder: "\u05db\u05ea\u05d5\u05d1 \u05e4\u05e7\u05d5\u05d3\u05d4, \u05dc\u05de\u05e9\u05dc: \u05ea\u05df \u05dc\u05d1\u05e0\u05e0\u05d4 \u05d0\u05ea \u05d1\u05d5\u05de\u05e8",
    adminRunCommand: "\u05d4\u05e8\u05e5",
    adminCommandMatches: "\u05e4\u05e7\u05d5\u05d3\u05d5\u05ea \u05e0\u05de\u05e6\u05d0\u05d5",
    adminCommandNoMatches: "\u05d0\u05d9\u05df \u05e4\u05e7\u05d5\u05d3\u05d5\u05ea \u05ea\u05d5\u05d0\u05de\u05d5\u05ea",
    adminCommandEnterHint: "\u05db\u05ea\u05d5\u05d1 \u05e4\u05e7\u05d5\u05d3\u05d4 \u05d0\u05d5 \u05e4\u05e7\u05d5\u05d3\u05d5\u05ea",
    adminRoomLabel: "\u05d7\u05d3\u05e8",
    adminPlayersLabel: "\u05e9\u05d7\u05e7\u05e0\u05d9\u05dd",
    adminFindSection: "\u05d7\u05d9\u05e4\u05d5\u05e9 \u05e9\u05d7\u05e7\u05df",
    adminAdminsSection: "\u05d0\u05d3\u05de\u05d9\u05e0\u05d9\u05dd",
    adminTargetSection: "\u05e9\u05d7\u05e7\u05df \u05d9\u05e2\u05d3",
    adminCharactersSection: "\u05d3\u05de\u05d5\u05d9\u05d5\u05ea",
    adminLiveSection: "\u05e9\u05dc\u05d9\u05d8\u05d4 \u05d7\u05d9\u05d4",
    adminDangerSection: "\u05de\u05e1\u05d5\u05db\u05df",
    adminHealth: "\u05d7\u05d9\u05d9\u05dd",
    adminCharacterStat: "\u05d3\u05de\u05d5\u05ea",
    adminScore: "\u05e0\u05d9\u05e7\u05d5\u05d3",
    adminStatusLabel: "\u05de\u05e6\u05d1",
    adminAlive: "\u05d7\u05d9",
    adminDown: "\u05e0\u05e4\u05e1\u05dc",
    adminConnected: "\u05de\u05d7\u05d5\u05d1\u05e8",
    adminDisconnected: "\u05de\u05e0\u05d5\u05ea\u05e7",
    adminLobby: "\u05dc\u05d5\u05d1\u05d9",
    adminGrant: "\u05ea\u05df \u05d3\u05de\u05d5\u05ea",
    adminRevoke: "\u05d4\u05e1\u05e8 \u05d3\u05de\u05d5\u05ea",
    adminAllowRename: "\u05d0\u05e4\u05e9\u05e8 \u05e9\u05d9\u05e0\u05d5\u05d9 \u05e9\u05dd",
    adminHeal: "\u05e8\u05e4\u05d0",
    adminEliminate: "\u05d7\u05e1\u05dc",
    adminFreeze: "\u05d4\u05e7\u05e4\u05d0",
    adminTeleport: "\u05d4\u05d1\u05d0 \u05d0\u05dc\u05d9\u05d9",
    adminResetProgress: "\u05d0\u05e4\u05e1 \u05d4\u05ea\u05e7\u05d3\u05de\u05d5\u05ea",
    adminKick: "\u05d4\u05e2\u05e3 \u05e9\u05d7\u05e7\u05df",
    adminBan: "\u05d1\u05d0\u05df \u05dc\u05e9\u05d7\u05e7\u05df",
    adminRestart: "\u05d4\u05ea\u05d7\u05dc \u05de\u05d7\u05d3\u05e9",
    adminFindGoogle: "\u05d7\u05e4\u05e9 \u05e9\u05d7\u05e7\u05df",
    adminGooglePlaceholder: "\u05d7\u05e9\u05d1\u05d5\u05df Google \u05dc\u05d7\u05d9\u05e4\u05d5\u05e9",
    adminEmailPlaceholder: "\u05d7\u05e9\u05d1\u05d5\u05df Google \u05dc\u05d0\u05d3\u05de\u05d9\u05df",
    adminAddAdmin: "\u05d4\u05d5\u05e1\u05e3 \u05d0\u05d3\u05de\u05d9\u05df",
    adminRemoveAdmin: "\u05d4\u05e1\u05e8 \u05d0\u05d3\u05de\u05d9\u05df",
    adminOwnerLocked: "\u05d0\u05d9 \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05e1\u05d9\u05e8 \u05d0\u05ea \u05d4\u05d0\u05d3\u05de\u05d9\u05df \u05d4\u05e8\u05d0\u05e9\u05d9",
    adminListEmpty: "\u05d0\u05d9\u05df \u05d0\u05d3\u05de\u05d9\u05e0\u05d9\u05dd",
    adminNoRoom: "\u05d0\u05d9\u05df \u05d7\u05d3\u05e8 \u05e4\u05e2\u05d9\u05dc",
    adminNoPlayers: "\u05d0\u05d9\u05df \u05e9\u05d7\u05e7\u05e0\u05d9\u05dd \u05d0\u05d7\u05e8\u05d9\u05dd",
    adminPickPlayer: "\u05d1\u05d7\u05e8 \u05e9\u05d7\u05e7\u05df",
    adminDone: "\u05d1\u05d5\u05e6\u05e2",
    adminFailed: "\u05e4\u05e2\u05d5\u05dc\u05ea \u05d0\u05d3\u05de\u05d9\u05df \u05e0\u05db\u05e9\u05dc\u05d4",
    adminPlayerFound: "\u05e9\u05d7\u05e7\u05df \u05e0\u05d1\u05d7\u05e8",
    adminPlayerNotFound: "\u05e9\u05d7\u05e7\u05df \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0",
    adminInvalidEmail: "\u05d4\u05db\u05e0\u05e1 \u05d7\u05e9\u05d1\u05d5\u05df Google \u05ea\u05e7\u05d9\u05df",
    adminGrantedNotice: "\u05d3\u05de\u05d5\u05ea \u05e0\u05e4\u05ea\u05d7\u05d4 \u05e2\u05dc \u05d9\u05d3\u05d9 \u05d0\u05d3\u05de\u05d9\u05df",
    adminRevokedNotice: "\u05d3\u05de\u05d5\u05ea \u05d4\u05d5\u05e1\u05e8\u05d4 \u05e2\u05dc \u05d9\u05d3\u05d9 \u05d0\u05d3\u05de\u05d9\u05df",
    adminProgressResetNotice: "\u05d4\u05d4\u05ea\u05e7\u05d3\u05de\u05d5\u05ea \u05d0\u05d5\u05e4\u05e1\u05d4 \u05e2\u05dc \u05d9\u05d3\u05d9 \u05d0\u05d3\u05de\u05d9\u05df",
    adminKickedNotice: "\u05d4\u05d5\u05e6\u05d0\u05ea \u05de\u05d4\u05d7\u05d3\u05e8",
    adminBannedNotice: "\u05e7\u05d9\u05d1\u05dc\u05ea \u05d1\u05d0\u05df \u05de\u05d4\u05d7\u05d3\u05e8",
    signInGoogle: "\u05d4\u05ea\u05d7\u05d1\u05e8 \u05e2\u05dd Google",
    signOut: "\u05d4\u05ea\u05e0\u05ea\u05e7",
    newLocalPlayer: "\u05e9\u05d7\u05e7\u05df \u05de\u05e7\u05d5\u05de\u05d9 \u05d7\u05d3\u05e9",
    creditsLabel: "\u05e7\u05e8\u05d3\u05d9\u05d8\u05d9\u05dd",
    powerPointsLabel: "\u05e0\u05e7\u05d5\u05d3\u05d5\u05ea \u05db\u05d5\u05d7",
    moneyLabel: "\u05db\u05e1\u05e3",
    unlockWithCredits: "\u05e4\u05ea\u05d7 \u05d1-",
    needCredits: "\u05e6\u05e8\u05d9\u05da",
    rewardTitle: "\u05e4\u05e8\u05e1\u05d9\u05dd \u05de\u05d4\u05de\u05e9\u05d7\u05e7",
    rewardKills: "\u05d7\u05d9\u05e1\u05d5\u05dc\u05d9\u05dd",
    rewardWon: "\u05e0\u05d9\u05e6\u05d7\u05d5\u05df",
    rewardLost: "\u05d4\u05de\u05e9\u05d7\u05e7 \u05e0\u05d2\u05de\u05e8",
    closeRewards: "\u05e1\u05d2\u05d5\u05e8",
    rarityCommon: "\u05e8\u05d2\u05d9\u05dc",
    rarityRare: "\u05e0\u05d3\u05d9\u05e8",
    rarityEpic: "\u05e2\u05dc",
    rarityMythic: "\u05db\u05d5\u05db\u05d1\u05d9",
    rarityLegendary: "\u05d0\u05d2\u05d3\u05d9",
    raritySpecial: "\u05de\u05d9\u05d5\u05d7\u05d3",
    chooseCharacter: "\u05d1\u05d7\u05d9\u05e8\u05ea \u05d3\u05de\u05d5\u05ea",
    chooseForGame: "\u05d1\u05d7\u05e8 \u05dc\u05de\u05e9\u05d7\u05e7",
    closePicker: "\u05e1\u05d2\u05d5\u05e8",
    localPlayerCreated: "\u05e0\u05d5\u05e6\u05e8 \u05e9\u05d7\u05e7\u05df \u05de\u05e7\u05d5\u05de\u05d9 \u05d7\u05d3\u05e9",
    brawlerLabel: "\u05d3\u05de\u05d5\u05ea",
    bobName: "\u05d1\u05d5\u05d1",
    boomerName: "\u05d1\u05d5\u05de\u05e8",
    fangliName: "\u05e4\u05d0\u05e0\u05d2\u05dc\u05d9",
    pixelName: "\u05e4\u05d9\u05e7\u05e1\u05dc",
    auroraName: "\u05d0\u05d5\u05e8\u05e8\u05d4",
    bazaarName: "\u05d1\u05d0\u05d6\u05d0\u05e8",
    ariName: "\u05d0\u05e8\u05d9",
    skyFalconName: "\u05d1\u05d6 \u05d4\u05e9\u05de\u05d9\u05d9\u05dd",
    mastervName: "Master V",
    blazeDesc: "\u05de\u05d8\u05d7 3 \u05db\u05d3\u05d5\u05e8\u05d9 \u05d8\u05e0\u05d9\u05e1",
    boomerDesc: "\u05d1\u05d5\u05de\u05e8\u05e0\u05d2 - \u05de\u05d7\u05db\u05d4 \u05e9\u05d9\u05d7\u05d6\u05d5\u05e8",
    fangliDesc: "\u05d9\u05e8\u05d9\u05d9\u05ea \u05e2\u05e6\u05dd \u05e8\u05d7\u05d5\u05e7\u05d4, \u05de\u05ea\u05d7\u05d6\u05e7\u05ea \u05db\u05e9\u05e0\u05e4\u05d2\u05e2",
    pixelDesc: "\u05dc\u05d9\u05d9\u05d6\u05e8 \u05de\u05d4\u05d9\u05e8 \u05e2\u05dd \u05d4\u05d7\u05d6\u05e8\u05d4 \u05de\u05e7\u05d9\u05e8\u05d5\u05ea",
    unlockBoomer: "\u05e0\u05e6\u05d7 \u05d0\u05ea \u05d2\u05dc 10 \u05e2\u05dd \u05d1\u05d5\u05d1",
    unlockPixel: "\u05e1\u05d9\u05d9\u05dd \u05de\u05e9\u05d7\u05e7 \u05d0\u05d7\u05d3 \u05db\u05d3\u05d9 \u05dc\u05e4\u05ea\u05d5\u05d7",
    boomerUnlocked: "\u05d1\u05d5\u05de\u05e8 \u05e0\u05e4\u05ea\u05d7",
    pixelUnlocked: "\u05e4\u05d9\u05e7\u05e1\u05dc \u05e0\u05e4\u05ea\u05d7",
    lockedCharacter: "\u05e0\u05e2\u05d5\u05dc",
    tankDesc: "\u05e1\u05e2\u05e8\u05ea \u05e9\u05dc\u05d2 + \u05de\u05e9\u05d8\u05d7 \u05e7\u05e8\u05d7",
    bazaarDesc: "\u05e9\u05e8\u05e9\u05e8\u05ea \u05de\u05d8\u05d1\u05e2\u05d5\u05ea + \u05ea\u05d9\u05d1\u05ea Buff",
    ariDesc: "\u05d0\u05d2\u05e8\u05d5\u05e3 \u05d8\u05d5\u05e4\u05e8 + \u05d7\u05d9\u05ea\u05d5\u05da \u05e9\u05d5\u05d1\u05e8 \u05e7\u05d9\u05e8\u05d5\u05ea",
    skyFalconDesc: "\u05e0\u05d5\u05e6\u05ea \u05d6\u05d4\u05d1 + \u05e4\u05e6\u05e6\u05d4 \u05d0\u05d5 \u05db\u05e4\u05d9\u05dc",
    mastervDesc: "\u05dc\u05d5\u05d7\u05dd \u05d0\u05d5\u05dc\u05d8\u05d9\u05de\u05d8\u05d9\u05d1\u05d9 \u05dc\u05d0\u05d3\u05de\u05d9\u05df \u05d1\u05dc\u05d1\u05d3",
    skyBombMode: "\u05e4\u05e6\u05e6\u05d4",
    skyCloneMode: "\u05db\u05e4\u05d9\u05dc",
    adminOnlyCharacter: "\u05d3\u05de\u05d5\u05ea \u05de\u05d9\u05d5\u05d7\u05d3\u05ea",
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
    gamepadTitle: "\u05de\u05e6\u05d1 \u05e9\u05dc\u05d8",
    gamepadWaiting: "\u05dc\u05d7\u05e5 \u05e2\u05dc \u05db\u05e4\u05ea\u05d5\u05e8 \u05d1\u05e9\u05dc\u05d8",
    gamepadConnected: "\u05e9\u05dc\u05d8 \u05de\u05d7\u05d5\u05d1\u05e8",
    gamepadPlayStationHint: "R2 \u05d4\u05ea\u05e7\u05e4\u05d4, L2 \u05e1\u05d5\u05e4\u05e8, \u05e1\u05d8\u05d9\u05e7 \u05d9\u05de\u05e0\u05d9 \u05dc\u05db\u05d9\u05d5\u05d5\u05df",
    gamepadHelp: "\u05d7\u05d1\u05e8 \u05d0\u05ea \u05d4\u05e9\u05dc\u05d8 \u05dc-Bluetooth \u05d0\u05d5 USB, \u05d5\u05d0\u05d6 \u05d7\u05d6\u05d5\u05e8 \u05dc\u05de\u05e9\u05d7\u05e7.",
    keysMove: "\u05d7\u05e6\u05d9\u05dd",
    keysAttack: "J \u05d4\u05ea\u05e7\u05e4\u05d4",
    keysSpecial: "K \u05e1\u05d5\u05e4\u05e8",
    create: "\u05e6\u05d5\u05e8 \u05de\u05e9\u05d7\u05e7",
    playNow: "\u05e9\u05d7\u05e7 \u05e2\u05db\u05e9\u05d9\u05d5",
    roomCodeLabel: "\u05e7\u05d5\u05d3 \u05d7\u05d3\u05e8",
    serverCodeLabel: "\u05e7\u05d5\u05d3 \u05e9\u05e8\u05ea",
    findingPlayers: "\u05de\u05d7\u05e4\u05e9 \u05e9\u05d7\u05e7\u05e0\u05d9\u05dd...",
    readyRoom: "\u05de\u05d5\u05db\u05df - \u05e9\u05ea\u05e3 \u05d0\u05ea \u05d4\u05e7\u05d5\u05d3 \u05d0\u05d5 \u05dc\u05d7\u05e5 \u05e9\u05d7\u05e7",
    joinDivider: "\u05d0\u05d5 \u05d4\u05e6\u05d8\u05e8\u05e3 \u05dc\u05d7\u05d1\u05e8",
    codePlaceholder: "\u05e7\u05d5\u05d3 \u05d7\u05d3\u05e8 \u05d0\u05d5 \u05e9\u05e8\u05ea",
    join: "\u05d4\u05e6\u05d8\u05e8\u05e3",
    install: "\u05d4\u05d5\u05e8\u05d3 \u05d0\u05ea \u05d4\u05de\u05e9\u05d7\u05e7",
    installHelp: "\u05db\u05d3\u05d9 \u05dc\u05d4\u05ea\u05e7\u05d9\u05df \u05d0\u05ea \u05d4\u05de\u05e9\u05d7\u05e7, \u05e4\u05ea\u05d7 \u05d0\u05ea \u05ea\u05e4\u05e8\u05d9\u05d8 \u05d4\u05d3\u05e4\u05d3\u05e4\u05df \u05d5\u05d1\u05d7\u05e8 \u05d4\u05ea\u05e7\u05df \u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4 \u05d0\u05d5 \u05d4\u05d5\u05e1\u05e3 \u05dc\u05de\u05e1\u05da \u05d4\u05d1\u05d9\u05ea.",
    leaveAria: "\u05e6\u05d0 \u05de\u05d4\u05de\u05e9\u05d7\u05e7",
    initialObjective: "\u05e9\u05ea\u05e3 \u05d0\u05ea \u05e7\u05d5\u05d3 \u05d4\u05d7\u05d3\u05e8 \u05db\u05d3\u05d9 \u05dc\u05e9\u05d7\u05e7 \u05d9\u05d7\u05d3",
    adminInvinciblePrompt: "\u05de\u05e6\u05d1 \u05d0\u05d3\u05de\u05d9\u05df: \u05dc\u05d7\u05e5 \u05d0\u05d9\u05e9\u05d5\u05e8 \u05db\u05d3\u05d9 \u05dc\u05d4\u05d9\u05d5\u05ea \u05d1\u05dc\u05ea\u05d9 \u05e4\u05d2\u05d9\u05e2, \u05d0\u05d5 \u05d1\u05d9\u05d8\u05d5\u05dc \u05db\u05d3\u05d9 \u05dc\u05e9\u05d7\u05e7 \u05e8\u05d2\u05d9\u05dc.",
    adminInvincibleOn: "\u05de\u05e6\u05d1 \u05d0\u05d3\u05de\u05d9\u05df \u05d1\u05dc\u05ea\u05d9 \u05e4\u05d2\u05d9\u05e2",
    adminInvincibleOff: "\u05de\u05e6\u05d1 \u05d0\u05d3\u05de\u05d9\u05df \u05e8\u05d2\u05d9\u05dc",
    attack: "\u05d4\u05ea\u05e7\u05e4\u05d4",
    special: "\u05e1\u05d5\u05e4\u05e8",
    useItem: "\u05d4\u05e9\u05ea\u05de\u05e9",
    useBuff: "\u05d4\u05e4\u05e2\u05dc Buff",
    gotBuff: "\u05e7\u05d9\u05d1\u05dc\u05ea Buff",
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
translations.ar = {
  "brandHebrew": "????? ?????",
  "title": "BrawkClaUi",
  "subtitle": "???? ????? ???? ??? ?????? ????.",
  "profileKicker": "?????",
  "profileIntro": "???? ????? ???? ??????.",
  "profileLanguagePick": "???? ?????",
  "profileContinue": "??????",
  "nameRequired": "???? ???? ????????",
  "languageLabel": "?????",
  "languageSystem": "??????? ??? ??????",
  "namePlaceholder": "????",
  "nameLockedNotice": "???? ????. ???? ?????? ?????? ?????? ????.",
  "renameAllowed": "????? ????? ????",
  "renameSaved": "?? ??? ?????",
  "accountLabel": "???? Google",
  "cloudGuest": "??? ???? ??????",
  "cloudSignedIn": "???? ?????? ????",
  "cloudSyncing": "??? ?????? ??????...",
  "cloudSaved": "?? ??? ??????",
  "cloudError": "??? Google ??? ????",
  "adminLabel": "????",
  "adminPanelTitle": "???? ??????",
  "adminCommandSearchLabel": "???? ???????",
  "adminCommandSearchPlaceholder": "???? ????? ????: ???? Banana ????? Boomer",
  "adminRunCommand": "?????",
  "adminCommandMatches": "????? ??????",
  "adminCommandNoMatches": "?? ???? ????? ??????",
  "adminCommandEnterHint": "???? ????? ?? ??????",
  "adminRoomLabel": "??????",
  "adminPlayersLabel": "????????",
  "adminFindSection": "????? ?? ????",
  "adminAdminsSection": "????????",
  "adminTargetSection": "?????? ?????",
  "adminCharactersSection": "????????",
  "adminLiveSection": "???? ?????",
  "adminDangerSection": "???",
  "adminHealth": "?????",
  "adminCharacterStat": "???????",
  "adminScore": "??????",
  "adminStatusLabel": "??????",
  "adminAlive": "??",
  "adminDown": "???? ?????",
  "adminConnected": "????",
  "adminDisconnected": "??? ????",
  "adminLobby": "??????",
  "adminGrant": "????? ?????",
  "adminRevoke": "????? ?????",
  "adminAllowRename": "?????? ?????? ?????",
  "adminHeal": "????",
  "adminEliminate": "?????",
  "adminFreeze": "?????",
  "adminTeleport": "????? ???",
  "adminResetProgress": "????? ??? ??????",
  "adminKick": "??? ??????",
  "adminBan": "??? ??????",
  "adminRestart": "????? ????? ??????",
  "adminFindGoogle": "??? ?? ????",
  "adminGooglePlaceholder": "???? Google ?????",
  "adminEmailPlaceholder": "???? Google ??????",
  "adminAddAdmin": "????? ????",
  "adminRemoveAdmin": "????? ????",
  "adminOwnerLocked": "?? ???? ????? ?????? ???????",
  "adminListEmpty": "?? ???? ??????",
  "adminNoRoom": "?? ???? ???? ????",
  "adminNoPlayers": "?? ???? ?????? ?????",
  "adminPickPlayer": "???? ?????",
  "adminDone": "??",
  "adminFailed": "??? ????? ??????",
  "adminPlayerFound": "?? ?????? ??????",
  "adminPlayerNotFound": "?? ??? ?????? ??? ??????",
  "adminInvalidEmail": "???? ???? Google ?????",
  "adminGrantedNotice": "?? ??? ??????? ?????? ??????",
  "adminRevokedNotice": "??? ????? ??????? ?????? ??????",
  "adminProgressResetNotice": "??? ????? ??? ?????? ?????? ??????",
  "adminKickedNotice": "?? ?????? ?? ??? ??????",
  "adminBannedNotice": "?? ???? ?? ??? ??????",
  "signInGoogle": "????? ?????? ???????? Google",
  "signOut": "????? ??????",
  "newLocalPlayer": "???? ???? ????",
  "creditsLabel": "Credits",
  "powerPointsLabel": "Power points",
  "moneyLabel": "Money",
  "unlockWithCredits": "Unlock with",
  "needCredits": "Need",
  "rarityCommon": "Common",
  "rarityRare": "Rare",
  "rarityEpic": "Epic",
  "rarityMythic": "Mythic",
  "rarityLegendary": "Legendary",
  "raritySpecial": "Special",
  "chooseCharacter": "???? ?????",
  "chooseForGame": "???? ?????",
  "closePicker": "?????",
  "localPlayerCreated": "?? ????? ???? ???? ????",
  "brawlerLabel": "??????",
  "bobName": "???",
  "boomerName": "????",
  "fangliName": "??????",
  "pixelName": "?????",
  "auroraName": "??????",
  "bazaarName": "?????",
  "ariName": "???",
  "skyFalconName": "??? ??????",
  "mastervName": "Master V",
  "blazeDesc": "???? ?? 3 ???? ???",
  "boomerDesc": "???????? - ????? ?????",
  "fangliDesc": "???? ??? ?????? ???? ??? ???????",
  "pixelDesc": "???? ???? ???? ?? ???????",
  "unlockBoomer": "???? ?????? 10 ???????? ???",
  "unlockPixel": "???? ???? ????? ?????",
  "boomerUnlocked": "?? ??? ????",
  "pixelUnlocked": "?? ??? ?????",
  "lockedCharacter": "????",
  "tankDesc": "????? ????? + ??? ????",
  "bazaarDesc": "????? ????? + ????? ?????",
  "ariDesc": "???? ???? + ?? ???? ???????",
  "skyFalconDesc": "???? ????? + ????? ?? ????",
  "mastervDesc": "????? ????? ?????? ???",
  "skyBombMode": "?????",
  "skyCloneMode": "????",
  "adminOnlyCharacter": "????? ????",
  "modeLabel": "??? ??????",
  "modeSurvival": "???? - ????? ?????",
  "modeBrawl": "???? ???? - ??? ???? ????",
  "modeGems": "??? ??????? - 10 ?????",
  "modeShowdown": "?????? - ??? ???? ????",
  "modeCoins": "???? ??????? - 15 ????",
  "modeZone": "????? ??? ??????? - ???? ?? ????",
  "modeSoloZone": "????? ????? ??? ??????? - 15 ?????",
  "controlsLabel": "??????",
  "controlTouch": "???? / ???",
  "controlKeyboard": "???? ?????? ?????????",
  "controlGamepad": "?? ???? Bluetooth / USB",
  "gamepadTitle": "??? ?? ??????",
  "gamepadWaiting": "???? ?? ?? ?? ?? ??????",
  "gamepadConnected": "?? ????? ?? ??????",
  "gamepadPlayStationHint": "R2 ??????? L2 ??????? ????? ?????? ???????",
  "gamepadHelp": "??? ?? ?????? ??? Bluetooth ?? USB? ?? ???? ??? ??????.",
  "keysMove": "??????",
  "keysAttack": "J ????",
  "keysSpecial": "K ????",
  "create": "????? ????",
  "playNow": "???? ????",
  "roomCodeLabel": "??? ??????",
  "serverCodeLabel": "??? ??????",
  "findingPlayers": "??? ????? ?? ??????...",
  "readyRoom": "???? - ???? ????? ?? ???? ???",
  "joinDivider": "?? ???? ??? ????",
  "codePlaceholder": "??? ?????? ?? ??????",
  "join": "??????",
  "install": "????? ??????",
  "installHelp": "?????? ??????? ???? ????? ??????? ????? ????? ??????? ?? ????? ??? ?????? ????????.",
  "leaveAria": "?????? ??????",
  "initialObjective": "???? ??? ?????? ??????? ???",
  "adminInvinciblePrompt": "??? ??????: ???? ????? ????? ??? ???? ???????? ?? ????? ???? ???? ????.",
  "adminInvincibleOn": "??? ???? ??? ???? ???????",
  "adminInvincibleOff": "??? ???? ????",
  "attack": "????",
  "special": "????",
  "useItem": "?????? ??????",
  "useBuff": "?????? ???????",
  "gotBuff": "?? ?????? ??? ?????",
  "ping": "?????",
  "survivalEnded": "????? ??????",
  "createAgain": "???? ???? ????? ???? ??? ????",
  "shareRoom": "???? ??? ?????? ??????? ???",
  "reconnecting": "??? ????? ???????...",
  "ghostCharge": "??? ??? - ??? ??? ???? ?? 30 ?????",
  "targetSelected": "?? ?????? ?????",
  "wave": "????",
  "survived": "???? ????",
  "bots": "?????",
  "botSingular": "???",
  "botPlural": "?????",
  "playerSingular": "????",
  "playerPlural": "??????",
  "room": "????",
  "control": "????",
  "red": "????",
  "blue": "????",
  "teamWins": "?????? ????",
  "wins": "????",
  "kos": "???????",
  "personalBest": "??????",
  "currentRun": "??????",
  "globalBest": "?????",
  "globalLeaders": "???? ??????? ??????",
  "noLeaders": "?? ???? ????? ???",
  "secondsShort": "?"
};
translations.ar = {
  brandHebrew: "براول كلاوي",
  title: "BrawkClaUi",
  subtitle: "اختر شخصية ونمط لعب وطريقة تحكم.",
  profileKicker: "مرحبا",
  profileIntro: "اختر اللغة واسم اللاعب.",
  profileTitle: "مرحبا بك في BrawkClaUi",
  profileLanguagePick: "اختر اللغة",
  profileSubtitle: "اختر اسم اللاعب. يمكنك تسجيل الدخول بحساب Google لحفظ التقدم.",
  profileNameLabel: "اسم اللاعب",
  profileContinue: "متابعة",
  nameRequired: "اختر اسما للمتابعة",
  languageLabel: "اللغة",
  languageSystem: "استخدام لغة الجهاز",
  namePlaceholder: "اسمك",
  nameLockedNotice: "اسمك مقفل. يمكن للمشرف السماح بتغيير واحد.",
  renameAllowed: "تغيير الاسم متاح",
  renameSaved: "تم حفظ الاسم",
  accountLabel: "حساب Google",
  cloudGuest: "غير مسجل الدخول",
  cloudSignedIn: "مسجل الدخول باسم",
  cloudSyncing: "جار مزامنة التقدم...",
  cloudSaved: "تم حفظ التقدم",
  cloudError: "حفظ Google غير متاح",
  adminLabel: "مشرف",
  adminPanelTitle: "لوحة المشرف",
  adminCommandSearchLabel: "وحدة الأوامر",
  adminCommandSearchPlaceholder: "اكتب أمرا، مثلا: أعطِ Banana شخصية Boomer",
  adminRunCommand: "تشغيل",
  adminCommandMatches: "أوامر موجودة",
  adminCommandNoMatches: "لا توجد أوامر مطابقة",
  adminCommandEnterHint: "اكتب أوامر أو مساعدة",
  adminRoomLabel: "الغرفة",
  adminPlayersLabel: "اللاعبون",
  adminFindSection: "البحث عن لاعب",
  adminAdminsSection: "المشرفون",
  adminTargetSection: "اللاعب الهدف",
  adminCharactersSection: "الشخصيات",
  adminLiveSection: "تحكم مباشر",
  adminDangerSection: "خطر",
  adminHealth: "الصحة",
  adminCharacterStat: "الشخصية",
  adminScore: "النقاط",
  adminStatusLabel: "الحالة",
  adminAlive: "حي",
  adminDown: "خارج اللعب",
  adminConnected: "متصل",
  adminDisconnected: "غير متصل",
  adminLobby: "الردهة",
  adminGrant: "إعطاء شخصية",
  adminRevoke: "إزالة شخصية",
  adminAllowRename: "السماح بتغيير الاسم",
  adminHeal: "شفاء",
  adminEliminate: "إقصاء",
  adminFreeze: "تجميد",
  adminTeleport: "أحضره هنا",
  adminResetProgress: "إعادة ضبط التقدم",
  adminKick: "طرد اللاعب",
  adminBan: "حظر اللاعب",
  adminRestart: "إعادة تشغيل اللعبة",
  adminFindGoogle: "بحث عن لاعب",
  adminGooglePlaceholder: "حساب Google للبحث",
  adminEmailPlaceholder: "حساب Google للمشرف",
  adminAddAdmin: "إضافة مشرف",
  adminRemoveAdmin: "إزالة مشرف",
  adminOwnerLocked: "لا يمكن إزالة المشرف الرئيسي",
  adminListEmpty: "لا يوجد مشرفون",
  adminNoRoom: "لا توجد غرفة نشطة",
  adminNoPlayers: "لا يوجد لاعبون آخرون",
  adminPickPlayer: "اختر لاعبا",
  adminDone: "تم",
  adminFailed: "فشل إجراء المشرف",
  adminPlayerFound: "تم اختيار اللاعب",
  adminPlayerNotFound: "لم يتم العثور على اللاعب",
  adminInvalidEmail: "أدخل حساب Google صالحا",
  adminGrantedNotice: "تم فتح الشخصية بواسطة المشرف",
  adminRevokedNotice: "تمت إزالة الشخصية بواسطة المشرف",
  adminProgressResetNotice: "تمت إعادة ضبط التقدم بواسطة المشرف",
  adminKickedNotice: "تم إخراجك من هذه الغرفة",
  adminBannedNotice: "تم حظرك من هذه الغرفة",
  signInGoogle: "تسجيل الدخول باستخدام Google",
  signOut: "تسجيل الخروج",
  newLocalPlayer: "لاعب محلي جديد",
  chooseCharacter: "اختر شخصية",
  chooseForGame: "اختر للعبة",
  closePicker: "إغلاق",
  localPlayerCreated: "تم إنشاء لاعب محلي جديد",
  brawlerLabel: "شخصيتك",
  bobName: "بوب",
  boomerName: "بومر",
  fangliName: "فانغلي",
  pixelName: "بيكسل",
  auroraName: "أورورا",
  bazaarName: "بازار",
  ariName: "آري",
  skyFalconName: "صقر السماء",
  mastervName: "Master V",
  blazeDesc: "رشقة من 3 كرات تنس",
  boomerDesc: "بوميرانغ - ينتظر عودته",
  fangliDesc: "طلقة عظم بعيدة، أقوى عند الإصابة",
  pixelDesc: "ليزر سريع يرتد من الجدران",
  unlockBoomer: "اهزم الموجة 10 باستخدام بوب",
  unlockPixel: "أنهِ لعبة واحدة لفتحه",
  boomerUnlocked: "تم فتح بومر",
  pixelUnlocked: "تم فتح بيكسل",
  lockedCharacter: "مقفل",
  tankDesc: "عاصفة ثلجية + حقل جليد",
  bazaarDesc: "سلسلة عملات + صندوق تعزيز",
  ariDesc: "ضربة مخلب + شق يكسر الجدران",
  skyFalconDesc: "ريشة ذهبية + قنبلة أو نسخة",
  mastervDesc: "مقاتل نهائي للمشرف فقط",
  skyBombMode: "قنبلة",
  skyCloneMode: "نسخة",
  adminOnlyCharacter: "شخصية خاصة",
  modeLabel: "نمط اللعبة",
  modeSurvival: "نجاة - موجات بوتات",
  modeBrawl: "قتال فردي - آخر لاعب يبقى",
  modeGems: "جمع الجواهر - 10 جواهر",
  modeHeist: "سرقة - دمر الخزنة",
  modeShowdown: "مواجهة - آخر لاعب يبقى",
  modeCoins: "سباق العملات - 15 عملة",
  modeZone: "سيطرة على المنطقة - أحمر ضد أزرق",
  modeSoloZone: "سيطرة فردية على المنطقة - 15 ثانية",
  controlsLabel: "التحكم",
  controlTouch: "هاتف / لمس",
  controlKeyboard: "لوحة مفاتيح الكمبيوتر",
  controlGamepad: "يد تحكم Bluetooth / USB",
  gamepadTitle: "وضع يد التحكم",
  gamepadWaiting: "اضغط أي زر في يد التحكم",
  gamepadConnected: "تم توصيل يد التحكم",
  gamepadPlayStationHint: "R2 للهجوم، L2 للسوبر، العصا اليمنى للتصويب",
  gamepadHelp: "وصل يد التحكم عبر Bluetooth أو USB، ثم ارجع إلى اللعبة.",
  keysMove: "الأسهم",
  keysAttack: "J هجوم",
  keysSpecial: "K سوبر",
  create: "إنشاء لعبة",
  playNow: "العب الآن",
  roomCodeLabel: "رمز الغرفة",
  serverCodeLabel: "رمز الخادم",
  findingPlayers: "جار البحث عن لاعبين...",
  readyRoom: "جاهز - شارك الرمز أو اضغط لعب",
  joinDivider: "أو انضم إلى صديق",
  codePlaceholder: "رمز الغرفة أو الخادم",
  join: "انضمام",
  install: "تثبيت اللعبة",
  installHelp: "لتثبيت اللعبة، افتح قائمة المتصفح واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.",
  leaveAria: "مغادرة اللعبة",
  initialObjective: "شارك رمز الغرفة لتلعبوا معا",
  adminInvinciblePrompt: "وضع المشرف: اضغط موافق لتصبح غير قابل للإصابة، أو إلغاء للعب بشكل عادي.",
  adminInvincibleOn: "وضع مشرف غير قابل للإصابة",
  adminInvincibleOff: "وضع مشرف عادي",
  attack: "هجوم",
  special: "سوبر",
  useItem: "استخدم العنصر",
  useBuff: "استخدم التعزيز",
  gotBuff: "تم الحصول على تعزيز",
  ping: "إشارة",
  survivalEnded: "انتهت النجاة",
  createAgain: "أنشئ لعبة جديدة للعب مرة أخرى",
  shareRoom: "شارك رمز الغرفة لتلعبوا معا",
  reconnecting: "جار إعادة الاتصال...",
  ghostCharge: "أنت شبح - يتم شحن عنصر كل 30 ثانية",
  targetSelected: "تم اختيار الهدف",
  wave: "موجة",
  survived: "ثوان صمدت",
  bots: "بوتات",
  botSingular: "بوت",
  botPlural: "بوتات",
  playerSingular: "لاعب",
  playerPlural: "لاعبون",
  room: "غرفة",
  control: "تحكم",
  red: "أحمر",
  blue: "أزرق",
  teamWins: "الفريق يفوز",
  wins: "يفوز",
  kos: "إقصاءات",
  personalBest: "الأفضل",
  currentRun: "الحالي",
  globalBest: "عالمي",
  globalLeaders: "أفضل النتائج عالميا",
  noLeaders: "لا توجد نتائج بعد",
  secondsShort: "ث"
};
function supportedLanguage(language) {
  const code = String(language || "en").toLowerCase().split("-")[0];
  return languageCodes.includes(code) && code !== "system" ? code : "en";
}
function deviceLanguage() {
  return supportedLanguage(navigator.language || "en");
}
function selectedLanguage() {
  const saved = localStorage.getItem(languageKey);
  return saved && saved !== "system" ? supportedLanguage(saved) : deviceLanguage();
}
function t(key) {
  return translations[selectedLanguage()]?.[key] || translations.en[key] || key;
}
function populateLanguageSelect() {
  const current = languageSelect.value || localStorage.getItem(languageKey) || "he";
  const displayNames = typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames([navigator.language || "en"], { type: "language" })
    : null;
  languageSelect.replaceChildren(...languageCodes.map(code => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code === "system"
      ? (((navigator.language || "").toLowerCase().startsWith("he")) ? "\u05dc\u05e4\u05d9 \u05e9\u05e4\u05ea \u05d4\u05de\u05db\u05e9\u05d9\u05e8" : "Use device language")
      : `${displayNames?.of(code) || code.toUpperCase()} (${code.toUpperCase()})`;
    return option;
  }));
  languageSelect.value = languageCodes.includes(current) ? current : "he";
}
function formatSeconds(value) {
  return `${Math.max(0, Math.floor(Number(value) || 0))}${t("secondsShort")}`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}
function renderSurvivalStats() {
  const current = gameMeta.mode === "survival" ? gameMeta.survivalTime || 0 : 0;
  if (gameMeta.mode === "survival" && gameMeta.winner && current > personalBest) {
    personalBest = current;
    localStorage.setItem(progressKey(survivalBestKey), String(personalBest));
    queueCloudSave();
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
    return new Set(JSON.parse(localStorage.getItem(progressKey(unlockedCharactersKey)) || "[]"));
  } catch {
    return new Set();
  }
}
function saveUnlockedCharacters(unlocked) {
  localStorage.setItem(progressKey(unlockedCharactersKey), JSON.stringify([...unlocked].sort()));
}
function isCharacterUnlocked(character) {
  if (isAdminUser()) return true;
  return !lockedCharacters.has(character) || unlockedCharacters().has(character);
}
function characterRarity(character) {
  return characterRarities[character] || "common";
}
function rarityLabel(rarity) {
  return t(`rarity${rarity.charAt(0).toUpperCase()}${rarity.slice(1)}`);
}
function characterUnlockCost(character) {
  return Math.max(0, Number(rarityCreditCosts[characterRarity(character)]) || 0);
}
function characterCanUnlockWithCredits(character) {
  const cost = characterUnlockCost(character);
  return cost > 0 && !adminOnlyCharacters.has(character) && !isCharacterUnlocked(character) && loadEconomy().credits >= cost;
}
function canRevealMasterV() {
  return isCharacterUnlocked("masterv");
}
function isConcealedMasterV(character) {
  return character === "masterv" && !canRevealMasterV();
}
function characterButtons() {
  return [...document.querySelectorAll("[data-character]")];
}
function characterButton(character) {
  return characterButtons().find(button => button.dataset.character === character);
}
function characterDisplayName(character) {
  const button = characterButton(character);
  const label = button?.querySelector("span[data-i18n]");
  return label?.textContent?.trim() || character;
}
function scrollPendingCharacterIntoView() {
  characterButton(pendingCharacter)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}
function syncCharacterPicker() {
  if (!isCharacterUnlocked(selectedCharacter)) selectedCharacter = "blaze";
  if (!pendingCharacter || !characterButton(pendingCharacter)) pendingCharacter = selectedCharacter;
  characterButtons().forEach(button => button.classList.toggle("selected", button.dataset.character === pendingCharacter));
  if (currentCharacterName) currentCharacterName.textContent = characterDisplayName(selectedCharacter);
  if (characterConfirm) {
    const unlocked = isCharacterUnlocked(pendingCharacter);
    const cost = characterUnlockCost(pendingCharacter);
    characterConfirm.disabled = !unlocked && !characterCanUnlockWithCredits(pendingCharacter);
    characterConfirm.textContent = unlocked
      ? t("chooseForGame")
      : adminOnlyCharacters.has(pendingCharacter) || !cost
        ? t("lockedCharacter")
        : characterConfirm.disabled
          ? `${t("needCredits")} ${cost} ${t("creditsLabel")}`
          : `${t("unlockWithCredits")} ${cost} ${t("creditsLabel")}`;
  }
}
function openCharacterPicker() {
  pendingCharacter = selectedCharacter;
  syncCharacterPicker();
  if (characterPicker) characterPicker.hidden = false;
  window.setTimeout(scrollPendingCharacterIntoView, 40);
}
function closeCharacterPicker() {
  if (characterPicker) characterPicker.hidden = true;
  pendingCharacter = selectedCharacter;
  syncCharacterPicker();
}
function movePendingCharacter(step) {
  const buttons = characterButtons();
  if (!buttons.length) return;
  const current = Math.max(0, buttons.findIndex(button => button.dataset.character === pendingCharacter));
  const next = (current + step + buttons.length) % buttons.length;
  pendingCharacter = buttons[next].dataset.character;
  syncCharacterPicker();
  scrollPendingCharacterIntoView();
}
function confirmCharacterPicker() {
  if (!isCharacterUnlocked(pendingCharacter)) {
    const cost = characterUnlockCost(pendingCharacter);
    if (!characterCanUnlockWithCredits(pendingCharacter) || !spendCredits(cost)) return;
    unlockCharacter(pendingCharacter);
  }
  selectedCharacter = pendingCharacter;
  syncCharacterPicker();
  closeCharacterPicker();
  queueAutoJoin();
}
function unlockCharacter(character) {
  const unlocked = unlockedCharacters();
  if (unlocked.has(character)) return false;
  unlocked.add(character);
  saveUnlockedCharacters(unlocked);
  renderCharacterLocks();
  queueCloudSave();
  return true;
}

function revokeCharacter(character) {
  const unlocked = unlockedCharacters();
  if (!unlocked.delete(character)) return false;
  saveUnlockedCharacters(unlocked);
  if (selectedCharacter === character) selectedCharacter = "blaze";
  if (pendingCharacter === character) pendingCharacter = selectedCharacter;
  renderCharacterLocks();
  queueCloudSave();
  return true;
}

function resetProgress() {
  saveUnlockedCharacters(new Set());
  personalBest = 0;
  localStorage.removeItem(progressKey(survivalBestKey));
  localStorage.removeItem(progressKey(economyKey));
  localStorage.removeItem(progressKey(economyRewardKey));
  localStorage.removeItem(nameLockedKey);
  localStorage.removeItem(renameGrantKey);
  localStorage.removeItem(firstGameCompletedKey);
  selectedCharacter = "blaze";
  pendingCharacter = selectedCharacter;
  syncCharacterPicker();
  renderSurvivalStats();
  renderCharacterLocks();
  updateNameLock();
  queueCloudSave();
}

function markFirstGameCompleted() {
  if (!wasPlaying || localStorage.getItem(firstGameCompletedKey) === "1") return;
  localStorage.setItem(firstGameCompletedKey, "1");
  if (unlockCharacter("pixel")) error.textContent = t("pixelUnlocked");
  queueCloudSave();
}

function renderCharacterLocks() {
  document.querySelectorAll("[data-character]").forEach(button => {
    const character = button.dataset.character;
    const rarity = characterRarity(character);
    const locked = !isCharacterUnlocked(character);
    const concealed = character === "masterv" && locked;
    button.dataset.rarity = rarity;
    button.dataset.rarityLabel = rarityLabel(rarity);
    button.classList.toggle("locked", locked);
    button.classList.toggle("concealed", concealed);
    button.disabled = locked;
    const name = button.querySelector("span[data-i18n]");
    if (name && character === "masterv") name.textContent = concealed ? concealedCharacterLabel : t("mastervName");
    const label = button.querySelector("small");
    if (label && concealed) label.textContent = concealedCharacterLabel;
    else if (label && locked) {
      const cost = characterUnlockCost(character);
      label.textContent = character === "boomer"
        ? `${rarityLabel(rarity)} / ${t("unlockBoomer")} / ${cost} ${t("creditsLabel")}`
        : character === "pixel"
          ? `${rarityLabel(rarity)} / ${t("unlockPixel")} / ${cost} ${t("creditsLabel")}`
          : adminOnlyCharacters.has(character)
            ? t("adminOnlyCharacter")
            : cost
              ? `${rarityLabel(rarity)} / ${cost} ${t("creditsLabel")}`
              : t("lockedCharacter");
    }
    else if (label && character === "boomer") label.textContent = t("boomerDesc");
    else if (label && character === "pixel") label.textContent = t("pixelDesc");
    else if (label && character === "ari") label.textContent = t("ariDesc");
    else if (label && character === "skyfalcon") label.textContent = t("skyFalconDesc");
    else if (label && character === "masterv") label.textContent = t("mastervDesc");
    if (locked && character === selectedCharacter) {
      selectedCharacter = "blaze";
      pendingCharacter = selectedCharacter;
    }
  });
  syncCharacterPicker();
}
function applyLanguage() {
  const language = selectedLanguage();
  document.documentElement.lang = language;
  document.documentElement.dir = rtlLanguages.has(language.split("-")[0]) ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  if (roomLabel) {
    roomLabel.hidden = !roomCode;
    if (roomCode) roomLabel.textContent = `${t("room")} ${roomCode}`;
  }
  updateLobbyRoom();
  renderSurvivalStats();
  updateMeta();
  renderEconomy();
  renderCharacterLocks();
  renderAccountStatus();
  renderAdminPanel();
  renderSkyModeButton();
}
let roomCode = "";
let adminTargetRoomCode = "";
let adminFoundTarget = null;
let players = [];
let wasPlaying = false;
let selectedCharacter = "blaze";
let skySpecialMode = "bomb";
let skyBombAttackLatched = false;
let pendingCharacter = selectedCharacter;
let gameMeta = { items: [], zoneScore: {} };
let lastBazaarBuff = "";
const savedControlMode = localStorage.getItem("brawlclaui-control-mode");
let controlMode = ["touch", "keyboard", "gamepad"].includes(savedControlMode) ? savedControlMode : (matchMedia("(hover: hover) and (pointer: fine)").matches ? "keyboard" : "touch");
let autoJoinTimer = 0;
let phoneOrigin = location.origin;
let personalBest = loadStoredPersonalBest();
let cloudApi = null;
let cloudUser = null;
let cloudAuthToken = "";
let localAccountMode = sessionStorage.getItem(localAccountKey) === "1";
let cloudSaveTimer = 0;
let lastCloudSnapshot = "";
let pendingJoinCode = (new URLSearchParams(location.search).get("join") || "").trim().toUpperCase();
let profileIntroResetApplied = false;
const characterImages = Object.fromEntries(["blaze", "boomer", "fangli", "pixel", "tank", "bazaar", "ari", "skyfalcon", "masterv", "mash"].map(id => {
  const image = new Image();
  image.src = `/characters/${id}.png?v=${id === "skyfalcon" ? 87 : id === "ari" ? 85 : id === "masterv" ? 77 : 62}`;
  return [id, image];
}));
const motionState = new Map();
const fallbackArena = { width: 1200, height: 900, zoneRadius: 95, obstacles: [], bushes: [], spawnPoints: [] };
const viewport = { width: 800, height: 600 };
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function removeAdminButtonSections() {
  document.querySelectorAll('[data-i18n="adminCharactersSection"], [data-i18n="adminLiveSection"], [data-i18n="adminDangerSection"]')
    .forEach(label => label.closest(".admin-section")?.remove());
}

nameInput.value = localStorage.getItem("brawlclaui-name") || "";
if (profileNameInput) profileNameInput.value = nameInput.value;
populateLanguageSelect();
{
  const savedLanguage = localStorage.getItem(languageKey);
  if (savedLanguage && !languageCodes.includes(savedLanguage)) localStorage.setItem(languageKey, "he");
  languageSelect.value = savedLanguage && languageCodes.includes(savedLanguage) ? savedLanguage : "he";
  if (profileLanguageSelect) profileLanguageSelect.value = localStorage.getItem(languagePickedKey) === "1" ? languageSelect.value : "";
}
controlModeSelect.value = controlMode;
setupAdminToggle();
applyLanguage();
updateProfileGate();
updateNameLock();
applyControlMode();
setLocalAccountMode(localAccountMode);
renderSurvivalStats();
loadPhoneOrigin();
setupCloudProgress();

function name() {
  return nameInput.value.trim().slice(0, 14);
}

function updateProfileGate() {
  const params = new URLSearchParams(location.search);
  if (!profileIntroResetApplied && (params.has("intro") || params.has("resetIntro"))) {
    profileIntroResetApplied = true;
    localStorage.removeItem(languagePickedKey);
    localStorage.removeItem(profileCompletedKey);
    localStorage.removeItem(profileGateVersionKey);
  }
  const needsProfile = localStorage.getItem(profileCompletedKey) !== "1" || localStorage.getItem(profileGateVersionKey) !== profileGateVersion;
  if (profileGate) profileGate.hidden = !needsProfile;
  if (lobby) lobby.hidden = needsProfile;
  if (profileNameInput && !profileNameInput.value) profileNameInput.value = nameInput.value;
  renderProfileLanguageButtons();
}

function chooseProfileLanguage(language) {
  if (!languageCodes.includes(language) || language === "system") return;
  languageSelect.value = language;
  if (profileLanguageSelect) profileLanguageSelect.value = language;
  localStorage.setItem(languageKey, language);
  localStorage.setItem(languagePickedKey, "1");
  renderProfileLanguageButtons();
  applyLanguage();
}

function renderProfileLanguageButtons() {
  const current = localStorage.getItem(languageKey) || languageSelect.value || "he";
  Array.prototype.forEach.call(profileLanguageButtons, button => {
    button.classList.toggle("selected", button.dataset.profileLanguage === current);
  });
}

function completeProfileGate() {
  const nextName = (profileNameInput?.value || nameInput.value || "").trim().slice(0, 14);
  if (!nextName) {
    if (profileStatus) profileStatus.textContent = t("nameRequired");
    profileNameInput?.focus();
    return;
  }
  if (!localStorage.getItem(languageKey)) chooseProfileLanguage("he");
  savePlayerName(nextName, false);
  localStorage.setItem(languagePickedKey, "1");
  localStorage.setItem(profileCompletedKey, "1");
  localStorage.setItem(profileGateVersionKey, profileGateVersion);
  if (profileStatus) profileStatus.textContent = "";
  updateProfileGate();
  queueAutoJoin();
}

function isNameLocked() {
  return localStorage.getItem(nameLockedKey) === "1" && Boolean(localStorage.getItem("brawlclaui-name"));
}

function canEditName() {
  return isAdminUser() || !isNameLocked() || localStorage.getItem(renameGrantKey) === "1";
}

function updateNameLock() {
  if (!nameInput) return;
  const locked = !canEditName();
  nameInput.disabled = locked;
  nameInput.classList.toggle("name-locked", locked);
  if (locked) error.textContent = t("nameLockedNotice");
}

function savePlayerName(value = name(), lock = false) {
  const next = String(value || "").trim().slice(0, 14);
  if (!next) return false;
  nameInput.value = next;
  localStorage.setItem("brawlclaui-name", next);
  if (lock && !isAdminUser()) {
    localStorage.setItem(nameLockedKey, "1");
    localStorage.removeItem(renameGrantKey);
  }
  updateNameLock();
  queueCloudSave();
  return true;
}

function playerJoinPayload(extra = {}, options = {}) {
  const user = activeCloudUser();
  if (options.askAdmin && isOwnerUser(user)) {
    adminInvincibleMode = window.confirm(t("adminInvinciblePrompt"));
    localStorage.setItem(adminInvincibleKey, adminInvincibleMode ? "1" : "0");
    error.textContent = adminInvincibleMode ? t("adminInvincibleOn") : t("adminInvincibleOff");
  }
  return {
    playerId,
    name: name(),
    character: selectedCharacter,
    authToken: cloudAuthToken,
    invincibleMode: adminInvincibleMode,
    ...extra
  };
}

function syncLobbyPresence(active = !wasPlaying && !roomCode) {
  if (!socket.connected) return;
  const user = activeCloudUser();
  socket.emit("lobby:present", {
    active: Boolean(active && user?.email),
    playerId,
    name: name() || user?.displayName || user?.email || "",
    authToken: cloudAuthToken
  });
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
  lastBazaarBuff = players.find(p => p.id === playerId)?.bazaarBuff || "";
  wasPlaying = true;
  syncLobbyPresence(false);
  savePlayerName(name(), true);
  localStorage.setItem("brawlclaui-room", roomCode);
  lobby.hidden = true;
  game.hidden = false;
  document.documentElement.classList.add("playing");
  document.body.classList.add("playing");
  window.scrollTo(0, 0);
  if (roomLabel) {
    roomLabel.hidden = !roomCode;
    if (roomCode) roomLabel.textContent = `${t("room")} ${roomCode}`;
  }
  updateServerJoinCode();
  applyControlMode();
  updateMeta();
  identifyAdminInRoom();
  renderAdminPanel();
}

function updateLobbyRoom() {
  if (!lobbyRoomCode || !matchStatus) return;
  lobbyRoomCode.textContent = roomCode || "----";
  updateServerJoinCode();
  matchStatus.textContent = roomCode ? `${t("readyRoom")} - ${players.filter(p => !p.bot).length}/8` : t("initialObjective");
  updatePhoneConnect();
}

function updateServerJoinCode() {
  const code = roomCode ? makeServerJoinCode() : "----";
  if (serverJoinCodeEl) serverJoinCodeEl.textContent = code;
  if (serverLabel) {
    serverLabel.hidden = !roomCode;
    serverLabel.textContent = roomCode ? code : "";
  }
}

function makeServerJoinCode() {
  if (!roomCode) return "----";
  try {
    const url = new URL(phoneOrigin);
    const parts = url.hostname.split(".").map(part => Number(part));
    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return roomCode;
    const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
    return `S-${parts.join("-")}-${port}-${roomCode}`;
  } catch {
    return roomCode;
  }
}

function parseServerJoinCode(value) {
  const match = String(value || "").trim().toUpperCase().match(/^S-(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,5})-([A-Z0-9]{4})$/);
  if (!match) return null;
  const ip = match.slice(1, 5).map(Number);
  const port = Number(match[5]);
  if (ip.some(part => part < 0 || part > 255) || port < 1 || port > 65535) return null;
  return { origin: `http://${ip.join(".")}:${port}`, room: match[6] };
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
  updateServerJoinCode();
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

function progressSnapshot() {
  return {
    bestSurvival: personalBest,
    economy: loadEconomy(),
    unlockedCharacters: isAdminUser() ? [...lockedCharacters].sort() : [...unlockedCharacters()].sort(),
    firstGameCompleted: localStorage.getItem(firstGameCompletedKey) === "1",
    nameLocked: isNameLocked(),
    canRename: isAdminUser() || localStorage.getItem(renameGrantKey) === "1",
    role: isAdminUser() ? "admin" : "player",
    preferredName: name(),
    language: localStorage.getItem(languageKey) || "he"
  };
}

function renderAccountStatus(message) {
  if (!accountStatus || !googleSignIn || !googleSignOut) return;
  const user = activeCloudUser();
  googleSignIn.hidden = Boolean(user);
  googleSignOut.hidden = !user;
  if (message) {
    accountStatus.textContent = message;
  } else if (user) {
    const role = isAdminUser() ? ` (${t("adminLabel")})` : "";
    accountStatus.textContent = `${t("cloudSignedIn")} ${user.displayName || user.email || "Google"}${role}`;
  } else {
    accountStatus.textContent = t("cloudGuest");
  }
}

function characterLabel(character) {
  if (character === "blaze") return t("bobName");
  if (character === "boomer") return t("boomerName");
  if (character === "fangli") return t("fangliName");
  if (character === "pixel") return t("pixelName");
  if (character === "tank") return t("auroraName");
  if (character === "bazaar") return t("bazaarName");
  if (character === "ari") return t("ariName");
  if (character === "skyfalcon") return t("skyFalconName");
  if (character === "masterv") return t("mastervName");
  return character.charAt(0).toUpperCase() + character.slice(1);
}

function renderSkyModeButton(me = players.find(p => p.id === playerId)) {
  if (!skyModeButton) return;
  const active = me?.character === "skyfalcon" && me.alive && !me.ghost;
  skyModeButton.hidden = !active;
  input.skyMode = skySpecialMode;
  skyModeButton.textContent = skySpecialMode === "clone" ? t("skyCloneMode") : t("skyBombMode");
  skyModeButton.classList.toggle("clone", skySpecialMode === "clone");
}

function toggleSkySpecialMode() {
  skySpecialMode = skySpecialMode === "bomb" ? "clone" : "bomb";
  input.skyMode = skySpecialMode;
  renderSkyModeButton();
}

function bazaarBuffLabel(buff) {
  const labels = {
    coinMagnet: "\u05de\u05d2\u05e0\u05d8 \u05d4\u05de\u05d8\u05d1\u05e2\u05d5\u05ea",
    desertSpice: "\u05ea\u05d1\u05dc\u05d9\u05df \u05de\u05d3\u05d1\u05e8\u05d9",
    goldenArmor: "\u05e9\u05e8\u05d9\u05d5\u05df \u05d6\u05d4\u05d1",
    mirageMirror: "\u05de\u05e8\u05d0\u05ea \u05d4\u05d0\u05e9\u05dc\u05d9\u05d5\u05ea",
    sandglass: "\u05e9\u05e2\u05d5\u05df \u05d7\u05d5\u05dc \u05e2\u05ea\u05d9\u05e7",
    hermes: "\u05e0\u05e2\u05dc\u05d9 \u05db\u05e0\u05e4\u05d9\u05d9\u05dd",
    bouncyBoots: "\u05e1\u05d5\u05dc\u05d9\u05d9\u05ea \u05d2\u05d5\u05de\u05d9",
    giantElixir: "\u05e9\u05d9\u05e7\u05d5\u05d9 \u05e6\u05de\u05d9\u05d7\u05d4",
    smokeBomb: "\u05e4\u05e6\u05e6\u05ea \u05e2\u05e9\u05df \u05d5\u05d0\u05d1\u05e7",
    luckyCharm: "\u05e7\u05de\u05d9\u05e2 \u05d4\u05de\u05d6\u05dc"
  };
  return labels[buff] || buff || "";
}

function setAdminStatus(message) {
  if (adminStatus) adminStatus.textContent = message || "";
}

function readAdminTogglePosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(adminTogglePositionKey) || "null");
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved;
  } catch {}
  return { x: window.innerWidth - 72, y: 14 };
}

function clampAdminTogglePosition(position) {
  const size = 54;
  const margin = 8;
  return {
    x: clamp(Number(position?.x) || 0, margin, Math.max(margin, window.innerWidth - size - margin)),
    y: clamp(Number(position?.y) || 0, margin, Math.max(margin, window.innerHeight - size - margin))
  };
}

function placeAdminControls(position = readAdminTogglePosition()) {
  if (!adminToggle) return null;
  const next = clampAdminTogglePosition(position);
  adminToggle.style.left = `${next.x}px`;
  adminToggle.style.top = `${next.y}px`;
  adminToggle.style.right = "auto";
  if (adminPanel) {
    const panelWidth = Math.min(340, Math.max(220, window.innerWidth - 24));
    const panelLeft = clamp(next.x, 8, Math.max(8, window.innerWidth - panelWidth - 8));
    const panelTop = clamp(next.y + 62, 8, Math.max(8, window.innerHeight - 170));
    adminPanel.style.left = `${panelLeft}px`;
    adminPanel.style.top = `${panelTop}px`;
    adminPanel.style.right = "auto";
    adminPanel.style.maxHeight = `${Math.max(140, window.innerHeight - panelTop - 8)}px`;
  }
  return next;
}

function updateAdminPanelVisibility(active = isAdminUser()) {
  if (adminToggle) {
    adminToggle.hidden = !active;
    adminToggle.classList.toggle("open", active && adminPanelOpen);
    adminToggle.setAttribute("aria-expanded", String(active && adminPanelOpen));
  }
  if (!active) adminPanelOpen = false;
  if (adminPanel) adminPanel.hidden = !active || !adminPanelOpen;
  placeAdminControls();
}

function setupAdminToggle() {
  if (!adminToggle) return;
  placeAdminControls();
  adminToggle.addEventListener("pointerdown", event => {
    if (event.button && event.button !== 0) return;
    const origin = readAdminTogglePosition();
    adminToggleDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin, moved: false };
    adminToggle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  adminToggle.addEventListener("pointermove", event => {
    if (!adminToggleDrag || adminToggleDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - adminToggleDrag.startX;
    const dy = event.clientY - adminToggleDrag.startY;
    if (Math.hypot(dx, dy) > 4) adminToggleDrag.moved = true;
    const next = placeAdminControls({ x: adminToggleDrag.origin.x + dx, y: adminToggleDrag.origin.y + dy });
    if (adminToggleDrag.moved && next) localStorage.setItem(adminTogglePositionKey, JSON.stringify(next));
    event.preventDefault();
  });
  adminToggle.addEventListener("pointerup", event => {
    if (!adminToggleDrag || adminToggleDrag.pointerId !== event.pointerId) return;
    const moved = adminToggleDrag.moved;
    adminToggle.releasePointerCapture?.(event.pointerId);
    adminToggleDrag = null;
    if (!moved) {
      adminPanelOpen = !adminPanelOpen;
      updateAdminPanelVisibility();
    }
    event.preventDefault();
  });
  adminToggle.addEventListener("pointercancel", () => { adminToggleDrag = null; });
  adminToggle.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    adminPanelOpen = !adminPanelOpen;
    updateAdminPanelVisibility();
  });
  window.addEventListener("resize", () => {
    const next = placeAdminControls();
    if (next) localStorage.setItem(adminTogglePositionKey, JSON.stringify(next));
  });
}

function activeCloudUser() {
  return localAccountMode ? null : cloudUser;
}

async function refreshCloudAuthToken(force = false) {
  const user = activeCloudUser();
  if (!user?.getIdToken) {
    cloudAuthToken = "";
    return "";
  }
  try {
    cloudAuthToken = await user.getIdToken(force);
    return cloudAuthToken;
  } catch {
    cloudAuthToken = "";
    return "";
  }
}

function setLocalAccountMode(active) {
  localAccountMode = Boolean(active);
  if (localAccountMode) sessionStorage.setItem(localAccountKey, "1");
  else sessionStorage.removeItem(localAccountKey);
  adminVerified = false;
  progressStorageSuffix = activeCloudUser() ? `:${activeCloudUser().uid}` : `:local:${playerId}`;
  personalBest = loadStoredPersonalBest();
}

function adminPayload(extra = {}) {
  return { roomCode: adminTargetRoomCode || roomCode, playerId, authToken: cloudAuthToken, ...extra };
}

function applyAdminList(admins = []) {
  adminEmails.clear();
  for (const admin of admins) {
    const email = normalizeEmail(typeof admin === "string" ? admin : admin?.email);
    if (email) adminEmails.add(email);
  }
  adminEmails.add("zurtzilhagever@gmail.com");
  adminVerified = isAdminUser();
  renderAdminList();
}

function renderAdminList() {
  if (!adminListSelect) return;
  const selected = adminListSelect.value;
  const entries = [...adminEmails].sort();
  adminListSelect.innerHTML = entries.length
    ? entries.map(email => `<option value="${escapeHtml(email)}">${escapeHtml(email)}${email === "zurtzilhagever@gmail.com" ? " OWNER" : ""}</option>`).join("")
    : `<option value="">${t("adminListEmpty")}</option>`;
  if (entries.includes(selected)) adminListSelect.value = selected;
  if (adminRemoveAdmin) adminRemoveAdmin.disabled = !adminListSelect.value || adminListSelect.value === "zurtzilhagever@gmail.com";
}

function renderAdminTargetInfo(target) {
  if (!adminTargetInfo) return;
  if (!target) {
    adminTargetInfo.innerHTML = `<span><b>${escapeHtml(t("adminStatusLabel"))}</b>${escapeHtml(t("adminPickPlayer"))}</span>`;
    return;
  }
  const health = Number.isFinite(target.health) && Number.isFinite(target.maxHealth)
    ? `${Math.max(0, target.health)}/${target.maxHealth}`
    : "--";
  const status = target.lobby
    ? t("adminLobby")
    : target.connected === false
    ? t("adminDisconnected")
    : target.alive === false || target.ghost
      ? t("adminDown")
      : t("adminAlive");
  adminTargetInfo.innerHTML = [
    `<span><b>${escapeHtml(t("adminHealth"))}</b>${escapeHtml(health)}</span>`,
    `<span><b>${escapeHtml(t("adminCharacterStat"))}</b>${escapeHtml(characterLabel(target.character) || target.characterName || "--")}</span>`,
    `<span><b>${escapeHtml(t("adminScore"))}</b>${escapeHtml(String(target.score ?? target.gems ?? target.coins ?? 0))}</span>`,
    `<span><b>${escapeHtml(t("adminStatusLabel"))}</b>${escapeHtml(status)}</span>`
  ].join("");
}

function adminCommandText(element) {
  return [
    element.textContent,
    element.getAttribute("data-admin-command"),
    element.getAttribute("placeholder")
  ].filter(Boolean).join(" ").toLowerCase();
}

function filterAdminCommands() {
  if (!adminPanel || !adminCommandSearch) return;
  const query = adminCommandSearch.value.trim().toLowerCase();
  const sections = [...adminPanel.querySelectorAll(".admin-section:not(.admin-command-section)")];
  for (const section of sections) {
    section.hidden = false;
    section.querySelectorAll("[data-admin-command]").forEach(command => { command.hidden = false; });
  }
  if (adminCommandHint) {
    adminCommandHint.textContent = query ? t("adminCommandEnterHint") : t("adminCommandEnterHint");
  }
}

async function syncAdminState(force = false) {
  const email = activeCloudUser()?.email || "";
  if (!email || (!socket.connected && !force)) return renderAdminPanel();
  if (!force && Date.now() - adminListRequestAt < 1200) return;
  adminListRequestAt = Date.now();
  const authToken = await refreshCloudAuthToken(force);
  socket.emit("admin:check", { authToken }, reply => {
    if (reply?.admins) applyAdminList(reply.admins);
    adminVerified = Boolean(reply?.admin);
    renderAccountStatus();
    renderCharacterLocks();
    renderAdminPanel();
  });
}

function requestAdminList() {
  if (!isAdminUser() || !socket.connected || Date.now() - adminListRequestAt < 1200) return;
  adminListRequestAt = Date.now();
  socket.emit("admin:list", adminPayload(), reply => {
    if (!reply?.ok) return;
    applyAdminList(reply.admins);
    renderAdminPanel();
  });
}

function requestAdminLobbyPlayers() {
  if (!isAdminUser() || !socket.connected || Date.now() - adminLobbyRequestAt < 1200) return;
  adminLobbyRequestAt = Date.now();
  socket.emit("admin:listLobby", adminPayload(), reply => {
    if (!reply?.ok) return;
    adminLobbyPlayers = Array.isArray(reply.players) ? reply.players : [];
    renderAdminPanel();
  });
}

async function identifyAdminInRoom() {
  if (!roomCode || !activeCloudUser()) return;
  await refreshCloudAuthToken();
  socket.emit("admin:identify", adminPayload(), reply => {
    adminVerified = Boolean(reply?.admin);
    if (reply?.admins) applyAdminList(reply.admins);
    renderAccountStatus();
    renderCharacterLocks();
    renderAdminPanel();
  });
}

function renderAdminPanel() {
  if (!adminPanel || !adminPlayerSelect || !adminCharacterSelect) return;
  const active = isAdminUser();
  updateAdminPanelVisibility(active);
  if (!active) return;
  renderAdminList();
  requestAdminList();
  requestAdminLobbyPlayers();
  if (adminRoleBadge) adminRoleBadge.textContent = isOwnerUser() ? "OWNER" : t("adminLabel");
  if (adminRoomBadge) adminRoomBadge.textContent = adminTargetRoomCode || roomCode || "----";
  if (adminPlayersBadge) adminPlayersBadge.textContent = String(players.filter(player => !player.bot).length);
  const previousPlayer = adminPlayerSelect.value;
  const selectablePlayers = players.filter(player => !player.bot && player.id !== playerId);
  const remoteTarget = adminFoundTarget && adminFoundTarget.roomCode !== roomCode ? adminFoundTarget : null;
  const playerOptions = selectablePlayers.map(player => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}${player.admin ? ` (${t("adminLabel")})` : ""}</option>`);
  for (const lobbyPlayer of adminLobbyPlayers) {
    if (!playerOptions.some(option => option.includes(`value="${escapeHtml(lobbyPlayer.id)}"`))) {
      playerOptions.push(`<option value="${escapeHtml(lobbyPlayer.id)}">${escapeHtml(lobbyPlayer.name)} (${escapeHtml(t("adminLobby"))})</option>`);
    }
  }
  if (remoteTarget && !selectablePlayers.some(player => player.id === remoteTarget.id) && !adminLobbyPlayers.some(player => player.id === remoteTarget.id)) {
    playerOptions.push(`<option value="${escapeHtml(remoteTarget.id)}">${escapeHtml(remoteTarget.name)} (${escapeHtml(remoteTarget.lobby ? t("adminLobby") : remoteTarget.roomCode)})</option>`);
  }
  adminPlayerSelect.innerHTML = playerOptions.length
    ? playerOptions.join("")
    : `<option value="">${roomCode ? t("adminNoPlayers") : t("adminNoRoom")}</option>`;
  if (selectablePlayers.some(player => player.id === previousPlayer) || adminLobbyPlayers.some(player => player.id === previousPlayer) || remoteTarget?.id === previousPlayer) adminPlayerSelect.value = previousPlayer;
  else {
    adminTargetRoomCode = "";
    adminFoundTarget = null;
  }
  const previousCharacter = adminCharacterSelect.value;
  adminCharacterSelect.innerHTML = adminGrantCharacters
    .map(character => `<option value="${character}">${escapeHtml(characterLabel(character))}</option>`)
    .join("");
  if (adminGrantCharacters.includes(previousCharacter)) adminCharacterSelect.value = previousCharacter;
  const selectedTarget = players.find(player => player.id === adminPlayerSelect.value) || adminLobbyPlayers.find(player => player.id === adminPlayerSelect.value) || remoteTarget || null;
  if (selectedTarget?.lobby) adminTargetRoomCode = "LOBBY";
  else if (adminFoundTarget?.id === adminPlayerSelect.value) adminTargetRoomCode = adminFoundTarget.roomCode;
  else if (adminTargetRoomCode === "LOBBY") adminTargetRoomCode = "";
  if (adminRoomBadge) adminRoomBadge.textContent = adminTargetRoomCode || roomCode || "----";
  const hasTarget = Boolean((adminTargetRoomCode || roomCode) && adminPlayerSelect.value);
  const targetInLobby = Boolean(selectedTarget?.lobby || adminTargetRoomCode === "LOBBY");
  renderAdminTargetInfo(selectedTarget);
  if (adminGrant) adminGrant.disabled = !hasTarget;
  if (adminRevoke) adminRevoke.disabled = !hasTarget || adminCharacterSelect.value === "blaze";
  if (adminHeal) adminHeal.disabled = !hasTarget || targetInLobby;
  if (adminEliminate) adminEliminate.disabled = !hasTarget || targetInLobby;
  if (adminFreeze) adminFreeze.disabled = !hasTarget || targetInLobby;
  if (adminTeleport) adminTeleport.disabled = !hasTarget || targetInLobby || Boolean(adminTargetRoomCode);
  if (adminAllowRename) adminAllowRename.disabled = !hasTarget;
  if (adminResetProgress) adminResetProgress.disabled = !hasTarget;
  if (adminKick) adminKick.disabled = !hasTarget;
  if (adminBan) adminBan.disabled = !hasTarget || targetInLobby;
  if (adminRestart) adminRestart.disabled = !(adminTargetRoomCode || roomCode);
  if (adminFindGoogle) adminFindGoogle.disabled = false;
  if (adminAddAdmin) adminAddAdmin.disabled = false;
  if (adminRemoveAdmin) adminRemoveAdmin.disabled = !adminListSelect?.value || adminListSelect.value === "zurtzilhagever@gmail.com";
  if (!roomCode && !adminTargetRoomCode) setAdminStatus(t("adminNoRoom"));
  else if (adminStatus?.textContent === t("adminNoRoom")) setAdminStatus("");
  filterAdminCommands();
}

function runAdminCommand(event, payload = {}) {
  if (!isAdminUser()) return setAdminStatus(t("adminFailed"));
  socket.emit(event, adminPayload(payload), reply => {
    setAdminStatus(reply?.ok ? t("adminDone") : reply?.error || t("adminFailed"));
    window.setTimeout(() => setAdminStatus(""), 1400);
  });
}

function runAdminTextCommand() {
  const command = adminCommandSearch?.value.trim();
  if (!command) return filterAdminCommands();
  if (!isAdminUser()) return setAdminStatus(t("adminFailed"));
  socket.emit("admin:runCommand", adminPayload({ command, targetId: adminPlayerSelect?.value || "" }), reply => {
    setAdminStatus(reply?.ok ? reply.message || t("adminDone") : reply?.error || t("adminFailed"));
    if (reply?.ok && !reply.keep && adminCommandSearch) adminCommandSearch.value = "";
    filterAdminCommands();
    if (reply?.ok && !reply.keep) window.setTimeout(() => setAdminStatus(""), 1800);
  });
}

function runAdminTargetCommand(event) {
  if (!adminPlayerSelect.value) return setAdminStatus(t("adminPickPlayer"));
  runAdminCommand(event, { targetId: adminPlayerSelect.value });
}

function findPlayerByGoogleAccount() {
  const email = normalizeEmail(adminGoogleAccount?.value);
  if (!email || !isValidEmail(email)) return setAdminStatus(t("adminInvalidEmail"));
  if (!isAdminUser()) return setAdminStatus(t("adminFailed"));
  socket.emit("admin:findPlayer", adminPayload({ email }), reply => {
    if (reply?.ok && reply.targetId && reply.roomCode) {
      adminTargetRoomCode = reply.roomCode;
      adminFoundTarget = { id: reply.targetId, name: reply.name || email, roomCode: reply.roomCode, lobby: Boolean(reply.lobby), connected: true };
      renderAdminPanel();
      adminPlayerSelect.value = reply.targetId;
      setAdminStatus(`${t("adminPlayerFound")}: ${reply.name || email}${reply.lobby ? ` (${t("adminLobby")})` : ""}`);
    } else {
      setAdminStatus(reply?.error === "Player not found" ? t("adminPlayerNotFound") : reply?.error || t("adminFailed"));
    }
    window.setTimeout(() => setAdminStatus(""), 1800);
  });
}

function addAdminByEmail() {
  const email = normalizeEmail(adminEmailInput?.value);
  if (!email || !isValidEmail(email)) return setAdminStatus(t("adminInvalidEmail"));
  if (!isAdminUser()) return setAdminStatus(t("adminFailed"));
  socket.emit("admin:addAdmin", adminPayload({ email }), reply => {
    if (reply?.ok) {
      if (reply.admins) applyAdminList(reply.admins);
      if (adminEmailInput) adminEmailInput.value = "";
      setAdminStatus(t("adminDone"));
      renderAdminPanel();
    } else {
      setAdminStatus(reply?.error || t("adminFailed"));
    }
    window.setTimeout(() => setAdminStatus(""), 1600);
  });
}

function removeSelectedAdmin() {
  const email = normalizeEmail(adminListSelect?.value);
  if (!email || !isValidEmail(email)) return setAdminStatus(t("adminInvalidEmail"));
  if (email === "zurtzilhagever@gmail.com") return setAdminStatus(t("adminOwnerLocked"));
  if (!isAdminUser()) return setAdminStatus(t("adminFailed"));
  socket.emit("admin:removeAdmin", adminPayload({ email }), reply => {
    if (reply?.ok) {
      if (reply.admins) applyAdminList(reply.admins);
      setAdminStatus(t("adminDone"));
      renderAdminPanel();
    } else {
      setAdminStatus(reply?.error === "Owner admin cannot be removed" ? t("adminOwnerLocked") : reply?.error || t("adminFailed"));
    }
    window.setTimeout(() => setAdminStatus(""), 1600);
  });
}

function applyCloudProgress(progress) {
  if (!progress) return;
  const cloudBest = Number(progress.bestSurvival) || 0;
  if (cloudBest > personalBest) {
    personalBest = cloudBest;
    localStorage.setItem(progressKey(survivalBestKey), String(personalBest));
  }
  if (Array.isArray(progress.unlockedCharacters)) {
    const merged = unlockedCharacters();
    for (const character of progress.unlockedCharacters) {
      if (lockedCharacters.has(character)) merged.add(character);
    }
    saveUnlockedCharacters(merged);
  }
  if (!nameInput.value && progress.preferredName) {
    nameInput.value = String(progress.preferredName).slice(0, 14);
    localStorage.setItem("brawlclaui-name", name());
  }
  if (progress.nameLocked && name()) localStorage.setItem(nameLockedKey, "1");
  if (progress.canRename) localStorage.setItem(renameGrantKey, "1");
  if (progress.economy) {
    const local = loadEconomy();
    const cloud = normalizeEconomy(progress.economy);
    saveEconomy({
      credits: Math.max(local.credits, cloud.credits),
      powerPoints: Math.max(local.powerPoints, cloud.powerPoints),
      money: Math.max(local.money, cloud.money)
    });
  }
  if (progress.firstGameCompleted) {
    localStorage.setItem(firstGameCompletedKey, "1");
    unlockCharacter("pixel");
  }
  renderSurvivalStats();
  renderEconomy();
  renderCharacterLocks();
  updateNameLock();
}

function queueCloudSave() {
  if (!cloudApi || !activeCloudUser()) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(saveCloudProgress, 500);
}

async function saveCloudProgress() {
  const user = activeCloudUser();
  if (!cloudApi || !user) return;
  const snapshot = progressSnapshot();
  const serialized = JSON.stringify(snapshot);
  if (serialized === lastCloudSnapshot) return;
  try {
    renderAccountStatus(t("cloudSyncing"));
    await cloudApi.saveProgress(user, snapshot);
    lastCloudSnapshot = serialized;
    renderAccountStatus(t("cloudSaved"));
    window.setTimeout(() => renderAccountStatus(), 1200);
  } catch {
    renderAccountStatus(t("cloudError"));
  }
}

async function setupCloudProgress() {
  try {
    cloudApi = await import("/shared/firebase-progress.js?v=52");
    googleSignIn.onclick = async () => {
      try {
        setLocalAccountMode(false);
        renderAccountStatus(t("cloudSyncing"));
        const result = await cloudApi.signIn();
        cloudUser = result?.user || cloudApi.currentUser?.() || cloudUser;
        await refreshCloudAuthToken(true);
        progressStorageSuffix = activeCloudUser() ? `:${activeCloudUser().uid}` : `:local:${playerId}`;
        personalBest = loadStoredPersonalBest();
        lastCloudSnapshot = "";
        syncAdminState(true);
        identifyAdminInRoom();
        renderSurvivalStats();
        renderEconomy();
        renderCharacterLocks();
        renderAccountStatus();
        renderAdminPanel();
        syncLobbyPresence();
        if (activeCloudUser()) {
          const progress = await cloudApi.loadProgress(activeCloudUser());
          applyCloudProgress(progress);
          lastCloudSnapshot = JSON.stringify(progressSnapshot());
          queueCloudSave();
        }
      } catch {
        renderAccountStatus(t("cloudError"));
      }
    };
    googleSignOut.onclick = () => {
      setLocalAccountMode(true);
      cloudAuthToken = "";
      lastCloudSnapshot = "";
      syncAdminState(true);
      renderSurvivalStats();
      renderEconomy();
      renderCharacterLocks();
      renderAccountStatus();
      renderAdminPanel();
      syncLobbyPresence(false);
      if (roomCode) socket.emit("admin:identify", { roomCode, playerId, authToken: "" }, () => {});
    };
    cloudApi.onUserChanged(async user => {
      cloudUser = user;
      const activeUser = activeCloudUser();
      adminVerified = false;
      await refreshCloudAuthToken(true);
      progressStorageSuffix = activeUser ? `:${activeUser.uid}` : `:local:${playerId}`;
      personalBest = loadStoredPersonalBest();
      lastCloudSnapshot = "";
      syncAdminState(true);
      renderSurvivalStats();
      renderEconomy();
      renderCharacterLocks();
      renderAccountStatus(activeUser ? t("cloudSyncing") : null);
      identifyAdminInRoom();
      renderAdminPanel();
      syncLobbyPresence(Boolean(activeUser));
      if (!activeUser) return;
      try {
        const progress = await cloudApi.loadProgress(activeUser);
        applyCloudProgress(progress);
        lastCloudSnapshot = JSON.stringify(progressSnapshot());
        queueCloudSave();
        renderAccountStatus();
        renderAdminPanel();
        syncLobbyPresence();
      } catch {
        renderAccountStatus(t("cloudError"));
      }
    });
  } catch {
    renderAccountStatus(t("cloudError"));
  }
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
  if (!["touch", "keyboard", "gamepad"].includes(controlMode)) controlMode = matchMedia("(hover: hover) and (pointer: fine)").matches ? "keyboard" : "touch";
  controlModeSelect.value = controlMode;
  localStorage.setItem("brawlclaui-control-mode", controlMode);
  keyboardPanel.hidden = controlMode !== "keyboard";
  if (gamepadPanel) gamepadPanel.hidden = controlMode !== "gamepad";
  controls.hidden = controlMode !== "touch";
  if (controlMode !== "keyboard") keyboardState.clear();
  input.x = 0;
  input.y = 0;
  input.attack = false;
  input.special = false;
  input.skyMode = skySpecialMode;
  gamepadAim.x = 0;
  gamepadAim.y = 0;
  gamepadAim.active = false;
  document.querySelector("#stick-knob").style.transform = "";
}

controlModeSelect.addEventListener("change", applyControlMode);
languageSelect.addEventListener("change", () => {
  localStorage.setItem(languageKey, languageSelect.value);
  localStorage.setItem(languagePickedKey, "1");
  if (profileLanguageSelect) profileLanguageSelect.value = languageSelect.value;
  updateProfileGate();
  applyLanguage();
});
profileLanguageSelect?.addEventListener("change", () => {
  chooseProfileLanguage(profileLanguageSelect.value);
});
Array.prototype.forEach.call(profileLanguageButtons, button => {
  button.addEventListener("click", () => chooseProfileLanguage(button.dataset.profileLanguage));
});
profileGate?.addEventListener("click", event => {
  const button = event.target.closest?.("[data-profile-language]");
  if (button) chooseProfileLanguage(button.dataset.profileLanguage);
});
profileContinue?.addEventListener("click", completeProfileGate);
profileNameInput?.addEventListener("input", () => {
  if (profileStatus) profileStatus.textContent = "";
  nameInput.value = profileNameInput.value.slice(0, 14);
});
profileNameInput?.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  completeProfileGate();
});

characterPickerOpen?.addEventListener("click", openCharacterPicker);
characterPickerClose?.addEventListener("click", closeCharacterPicker);
characterConfirm?.addEventListener("click", confirmCharacterPicker);
characterPrev?.addEventListener("click", () => movePendingCharacter(-1));
characterNext?.addEventListener("click", () => movePendingCharacter(1));
rewardClose?.addEventListener("click", hideRewardScreen);
characterPicker?.addEventListener("click", event => {
  if (event.target === characterPicker) closeCharacterPicker();
});
document.addEventListener("keydown", event => {
  if (characterPicker?.hidden === false && event.key === "Escape") closeCharacterPicker();
  if (rewardScreen?.hidden === false && event.key === "Escape") hideRewardScreen();
});
characterButtons().forEach(button => {
  button.onclick = () => {
    pendingCharacter = button.dataset.character;
    syncCharacterPicker();
    scrollPendingCharacterIntoView();
  };
});
document.querySelector("#mode").addEventListener("change", queueAutoJoin);
nameInput.addEventListener("change", () => {
  if (!canEditName()) {
    nameInput.value = localStorage.getItem("brawlclaui-name") || nameInput.value;
    updateNameLock();
    return;
  }
  if (name()) savePlayerName(name(), false);
  queueAutoJoin();
});
nameInput.addEventListener("change", queueCloudSave);
nameInput.addEventListener("change", () => syncLobbyPresence());
async function joinByCode(value, requestFullscreenForJoin = true) {
  if (requestFullscreenForJoin) requestAppFullscreen();
  const joinValue = String(value || "").trim();
  if (!joinValue) return error.textContent = t("codePlaceholder");
  const remote = parseServerJoinCode(joinValue);
  if (remote && remote.origin !== location.origin) {
    location.href = `${remote.origin}/play/?join=${encodeURIComponent(remote.room)}&fresh=server`;
    return;
  }
  const joinCode = remote ? remote.room : joinValue.toUpperCase();
  error.textContent = t("reconnecting");
  await refreshCloudAuthToken();
  socket.emit("player:join", playerJoinPayload({ code: joinCode }, { askAdmin: true }), reply => {
    pendingJoinCode = "";
    if (!reply?.ok) {
      error.textContent = reply?.error || t("adminFailed");
      return;
    }
    enter(reply);
  });
}
document.querySelector("#create").onclick = async () => {
  requestAppFullscreen();
  await refreshCloudAuthToken();
  if (roomCode) return socket.emit("player:join", playerJoinPayload({ code: roomCode }, { askAdmin: true }), enter);
  socket.emit("player:autoJoin", playerJoinPayload({ mode: document.querySelector("#mode").value }, { askAdmin: true }), enter);
};
document.querySelector("#join").onclick = () => {
  joinByCode(codeInput.value, true);
};
codeInput.addEventListener("input", () => codeInput.value = codeInput.value.toUpperCase());
if (pendingJoinCode && /^[A-Z0-9]{4}$/.test(pendingJoinCode)) codeInput.value = pendingJoinCode;
else pendingJoinCode = "";
function leaveGame() {
  markFirstGameCompleted();
  hideRewardScreen();
  const leavingRoom = roomCode;
  if (leavingRoom) socket.emit("player:leave", { code: leavingRoom, playerId });
  roomCode = "";
  players = [];
  gameMeta = { items: [], zoneScore: {} };
  wasPlaying = false;
  lastBazaarBuff = "";
  input.x = 0;
  input.y = 0;
  input.attack = false;
  input.special = false;
  input.skyMode = skySpecialMode;
  gamepadAim.x = 0;
  gamepadAim.y = 0;
  gamepadAim.active = false;
  keyboardState.clear();
  document.querySelector("#stick-knob").style.transform = "";
  localStorage.removeItem("brawlclaui-room");
  if (roomLabel) roomLabel.hidden = true;
  document.documentElement.classList.remove("playing");
  document.body.classList.remove("playing");
  game.hidden = true;
  lobby.hidden = false;
  error.textContent = "";
  updateLobbyRoom();
  updateMeta();
  renderAdminPanel();
  syncLobbyPresence(true);
  window.scrollTo(0, 0);
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

function createNewLocalPlayer() {
  if (roomCode) leaveGame();
  playerId = crypto.randomUUID();
  sessionStorage.setItem(playerKey, playerId);
  setLocalAccountMode(true);
  nameInput.value = "";
  localStorage.removeItem("brawlclaui-name");
  localStorage.removeItem(nameLockedKey);
  localStorage.removeItem(renameGrantKey);
  localStorage.removeItem(firstGameCompletedKey);
  localStorage.removeItem(progressKey(economyKey));
  localStorage.removeItem(progressKey(economyRewardKey));
  localStorage.removeItem(profileCompletedKey);
  localStorage.removeItem(profileGateVersionKey);
  if (profileNameInput) profileNameInput.value = "";
  selectedCharacter = "blaze";
  pendingCharacter = selectedCharacter;
  syncCharacterPicker();
  error.textContent = t("localPlayerCreated");
  renderAccountStatus();
  renderSurvivalStats();
  renderEconomy();
  renderCharacterLocks();
  updateNameLock();
  updateProfileGate();
  renderAdminPanel();
  syncLobbyPresence(false);
}

newLocalPlayer?.addEventListener("click", createNewLocalPlayer);

const leaveButton = document.querySelector("#leave");
leaveButton.addEventListener("click", leaveGame);
leaveButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  leaveGame();
});

adminGrant?.addEventListener("click", () => {
  if (!adminPlayerSelect.value) return setAdminStatus(t("adminPickPlayer"));
  runAdminCommand("admin:grantCharacter", { targetId: adminPlayerSelect.value, character: adminCharacterSelect.value });
});
adminRevoke?.addEventListener("click", () => {
  if (!adminPlayerSelect.value) return setAdminStatus(t("adminPickPlayer"));
  runAdminCommand("admin:revokeCharacter", { targetId: adminPlayerSelect.value, character: adminCharacterSelect.value });
});
adminHeal?.addEventListener("click", () => runAdminTargetCommand("admin:healPlayer"));
adminEliminate?.addEventListener("click", () => runAdminTargetCommand("admin:eliminatePlayer"));
adminFreeze?.addEventListener("click", () => runAdminTargetCommand("admin:freezePlayer"));
adminTeleport?.addEventListener("click", () => runAdminTargetCommand("admin:teleportPlayer"));
adminAllowRename?.addEventListener("click", () => {
  if (!adminPlayerSelect.value) return setAdminStatus(t("adminPickPlayer"));
  runAdminCommand("admin:allowRename", { targetId: adminPlayerSelect.value });
});
adminResetProgress?.addEventListener("click", () => runAdminTargetCommand("admin:resetProgress"));
adminKick?.addEventListener("click", () => runAdminTargetCommand("admin:kickPlayer"));
adminBan?.addEventListener("click", () => runAdminTargetCommand("admin:banPlayer"));
adminRestart?.addEventListener("click", () => runAdminCommand("admin:restartGame"));
adminPlayerSelect?.addEventListener("change", () => {
  adminTargetRoomCode = adminFoundTarget?.id === adminPlayerSelect.value ? adminFoundTarget.roomCode : "";
  if (!adminTargetRoomCode) adminFoundTarget = null;
  renderAdminPanel();
});
adminFindGoogle?.addEventListener("click", findPlayerByGoogleAccount);
adminGoogleAccount?.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  findPlayerByGoogleAccount();
});
adminAddAdmin?.addEventListener("click", addAdminByEmail);
adminRemoveAdmin?.addEventListener("click", removeSelectedAdmin);
adminListSelect?.addEventListener("change", () => {
  if (adminRemoveAdmin) adminRemoveAdmin.disabled = !adminListSelect.value || adminListSelect.value === "zurtzilhagever@gmail.com";
});
adminEmailInput?.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addAdminByEmail();
});
adminCommandSearch?.addEventListener("input", filterAdminCommands);
adminCommandSearch?.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  runAdminTextCommand();
});
adminRunCommand?.addEventListener("click", runAdminTextCommand);

socket.on("game:state", next => {
  players = next;
  renderAdminPanel();
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
  if (me?.bazaarBuff && me.bazaarBuff !== lastBazaarBuff) {
    const message = `${t("gotBuff")}: ${bazaarBuffLabel(me.bazaarBuff)}`;
    document.querySelector("#help").textContent = message;
    error.textContent = message;
  }
  lastBazaarBuff = me?.bazaarBuff || "";
  renderSkyModeButton(me);
  if (!wasPlaying) updateLobbyRoom();
  const attack = document.querySelector("#attack");
  if (attack) {
    const ammo = Number.isFinite(me?.ammo) ? me.ammo : me?.ammoMax || 5;
    const ammoMax = me?.ammoMax || 5;
    const attackLabel = me?.character === "skyfalcon" && skySpecialMode === "bomb" ? t("skyBombMode") : t("attack");
    attack.textContent = `${attackLabel} ${ammo}/${ammoMax}`;
    attack.classList.toggle("charging", ammo <= 0);
  }
  const special = document.querySelector("#special");
  if (me?.ghost) {
    special.textContent = me.ghostItem ? t("useItem") : t("ping");
    special.classList.remove("charging", "ready");
    document.querySelector("#help").textContent = me.ghostItem ? `${me.ghostItemName}: tap a living player, then use it` : t("ghostCharge");
  } else {
    const charge = Math.min(me?.specialCharge || 0, me?.specialRequired || 5);
    const required = me?.specialRequired || 5;
    const hasBuff = Boolean(me?.bazaarBuff);
    const specialLabel = me?.character === "skyfalcon" && skySpecialMode === "clone" ? t("skyCloneMode") : t("special");
    special.textContent = hasBuff ? t("useBuff") : charge >= required ? specialLabel : `${specialLabel} ${charge}/${required}`;
    special.classList.toggle("charging", !hasBuff && charge < required);
    special.classList.toggle("ready", hasBuff || charge >= required);
  }
});
socket.on("game:meta", next => {
  gameMeta = next;
  if (wasPlaying && (next.winner || next.winnerTeam || next.endedAt)) {
    markFirstGameCompleted();
    rewardEconomyForFinishedGame(next);
  }
  if (next.mode === "survival" && next.rewardCharacter === "boomer" && next.winner?.id === playerId) unlockCharacter("boomer");
  updateMeta();
  if (next.mode === "survival") document.querySelector("#count").textContent = `${t("wave")} ${next.wave || 1} - ${next.survivalTime || 0}s`;
  if (next.mode === "gems") document.querySelector("#count").textContent = `${t("red")} ${Math.floor(next.gemScore?.red || 0)} - ${Math.floor(next.gemScore?.blue || 0)} ${t("blue")}`;
  if (next.mode === "zone") document.querySelector("#count").textContent = `${t("red")} ${Math.floor(next.zoneScore?.red || 0)} - ${Math.floor(next.zoneScore?.blue || 0)} ${t("blue")}`;
  if (next.mode === "soloZone") document.querySelector("#count").textContent = `${t("control")} ${Math.floor(next.zoneScore?.[playerId] || 0)} / 15`;
});
socket.on("admin:verified", () => {
  adminVerified = true;
  renderAccountStatus();
  renderCharacterLocks();
  renderAdminPanel();
});
socket.on("admin:updated", ({ admins } = {}) => {
  if (admins) applyAdminList(admins);
  syncAdminState(true);
});
socket.on("admin:characterGranted", ({ character } = {}) => {
  if (!lockedCharacters.has(character)) return;
  unlockCharacter(character);
  error.textContent = `${t("adminGrantedNotice")}: ${characterLabel(character)}`;
});
socket.on("admin:characterRevoked", ({ character } = {}) => {
  revokeCharacter(character);
  error.textContent = `${t("adminRevokedNotice")}: ${characterLabel(character)}`;
});
socket.on("admin:progressReset", () => {
  resetProgress();
  error.textContent = t("adminProgressResetNotice");
});
socket.on("admin:renameAllowed", () => {
  localStorage.setItem(renameGrantKey, "1");
  updateNameLock();
  error.textContent = t("renameAllowed");
  queueCloudSave();
});
socket.on("admin:kicked", () => {
  error.textContent = t("adminKickedNotice");
  const help = document.querySelector("#help");
  if (help) help.textContent = t("adminKickedNotice");
  window.setTimeout(() => location.reload(), 900);
});
socket.on("admin:banned", () => {
  error.textContent = t("adminBannedNotice");
  const help = document.querySelector("#help");
  if (help) help.textContent = t("adminBannedNotice");
  window.setTimeout(() => location.reload(), 900);
});
socket.on("disconnect", () => { if (wasPlaying) document.querySelector("#help").textContent = t("reconnecting"); });
socket.on("connect", async () => {
  syncAdminState(true);
  syncLobbyPresence();
  if (pendingJoinCode && !wasPlaying) {
    joinByCode(pendingJoinCode, false);
  } else if (wasPlaying && roomCode) {
    await refreshCloudAuthToken();
    socket.emit("player:join", playerJoinPayload({ code: roomCode }), enter);
  }
  else updateLobbyRoom();
});
updateLobbyRoom();
if (pendingJoinCode && socket.connected) window.setTimeout(() => joinByCode(pendingJoinCode, false), 150);

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
  const setAim = event => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const max = r.width * .42;
    const length = Math.hypot(dx, dy);
    if (length < 8) {
      touchAim.active = false;
      touchAim.x = 0;
      touchAim.y = 0;
      el.classList.remove("aiming");
      el.style.removeProperty("--aim-x");
      el.style.removeProperty("--aim-y");
      return;
    }
    const scale = Math.min(1, max / length);
    touchAim.active = true;
    touchAim.x = +(dx / length).toFixed(3);
    touchAim.y = +(dy / length).toFixed(3);
    el.classList.add("aiming");
    el.style.setProperty("--aim-x", `${dx * scale}px`);
    el.style.setProperty("--aim-y", `${dy * scale}px`);
  };
  const clearAim = () => {
    touchAim.active = false;
    touchAim.x = 0;
    touchAim.y = 0;
    el.classList.remove("aiming");
    el.style.removeProperty("--aim-x");
    el.style.removeProperty("--aim-y");
  };
  el.addEventListener("pointerdown", e => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); set(true); setAim(e); });
  el.addEventListener("pointermove", e => { e.preventDefault(); if (el.hasPointerCapture?.(e.pointerId)) setAim(e); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => el.addEventListener(type, e => {
    if (e?.pointerId && el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture?.(e.pointerId);
    set(false);
    clearAim();
  }));
}
action("#attack", "attack");
action("#special", "special");
skyModeButton?.addEventListener("click", toggleSkySpecialMode);

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

function gamepadName(id = "") {
  if (/xbox/i.test(id)) return "Xbox";
  if (/dualsense|dualshock|wireless controller|playstation|sony/i.test(id)) return "PlayStation";
  if (/nintendo|switch|pro controller|joy-con/i.test(id)) return "Nintendo";
  return id ? id.split("(")[0].trim() || t("gamepadConnected") : t("gamepadConnected");
}

function updateGamepadStatus(id = "") {
  if (!gamepadStatus) return;
  const label = gamepadName(id);
  const extra = label === "PlayStation" ? ` - ${t("gamepadPlayStationHint")}` : "";
  gamepadStatus.textContent = id ? `${t("gamepadConnected")}: ${label}${extra}` : t("gamepadWaiting");
}

window.GamepadController?.onInput(next => {
  if (controlMode !== "gamepad") return;
  input.x = Number(next.x || 0);
  input.y = Number(next.y || 0);
  input.attack = Boolean(next.attack);
  input.special = Boolean(next.special);
  gamepadAim.x = Number(next.aimX || 0);
  gamepadAim.y = Number(next.aimY || 0);
  gamepadAim.active = Math.hypot(gamepadAim.x, gamepadAim.y) > 0.1;
  updateGamepadStatus(next.id);
});

window.addEventListener("gamepadconnected", event => updateGamepadStatus(event.gamepad?.id || ""));
window.addEventListener("gamepaddisconnected", () => {
  if (controlMode !== "gamepad") return;
  input.x = 0;
  input.y = 0;
  input.attack = false;
  input.special = false;
  gamepadAim.x = 0;
  gamepadAim.y = 0;
  gamepadAim.active = false;
  updateGamepadStatus("");
});

function autoAimAtNearestBot() {
  if (!["keyboard", "gamepad"].includes(controlMode) || !input.attack) return null;
  const me = players.find(p => p.id === playerId && p.alive);
  if (!me) return null;
  let target = null, distance = Infinity;
  for (const bot of players) {
    if (!bot.bot || !bot.alive) continue;
    const d = Math.hypot(bot.x - me.x, bot.y - me.y);
    if (d < distance) { target = bot; distance = d; }
  }
  if (!target) return null;
  const len = Math.hypot(target.x - me.x, target.y - me.y) || 1;
  return [(target.x - me.x) / len, (target.y - me.y) / len];
}

window.addEventListener("keydown", event => {
  if (controlMode !== "keyboard" || event.repeat) return;
  if (event.code === "KeyL" && !skyModeButton?.hidden) {
    event.preventDefault();
    toggleSkySpecialMode();
    return;
  }
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
  if (socket.connected && wasPlaying) {
    const autoAim = autoAimAtNearestBot();
    const aimX = touchAim.active ? touchAim.x : gamepadAim.active ? gamepadAim.x : autoAim?.[0] || 0;
    const aimY = touchAim.active ? touchAim.y : gamepadAim.active ? gamepadAim.y : autoAim?.[1] || 0;
    const me = players.find(p => p.id === playerId);
    let sentSkyMode = input.skyMode;
    if (me?.character === "skyfalcon" && input.attack && skySpecialMode === "bomb" && !skyBombAttackLatched) {
      sentSkyMode = "bomb";
      skyBombAttackLatched = true;
      skySpecialMode = "clone";
      input.skyMode = skySpecialMode;
      renderSkyModeButton(me);
    } else {
      if (!input.attack) skyBombAttackLatched = false;
      sentSkyMode = skySpecialMode;
      input.skyMode = skySpecialMode;
    }
    socket.emit("player:input", [input.x, input.y, input.attack ? 1 : 0, input.special ? 1 : 0, aimX, aimY, sentSkyMode]);
  }
}, 1000 / 60);
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
    const size = p.giant ? 58 : 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  const fill = p.ghost ? "#b8d9ff" : p.color;
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (p.character === "tank") {
    ctx.rect(-23, -22, 46, 42);
  } else if (p.character === "ari") {
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(24, -21, 28, 7, 18, 25);
    ctx.lineTo(-18, 25);
    ctx.bezierCurveTo(-28, 7, -24, -21, 0, -30);
    ctx.closePath();
  } else if (p.character === "skyfalcon") {
    ctx.moveTo(0, -29);
    ctx.lineTo(19, 18);
    ctx.lineTo(0, 27);
    ctx.lineTo(-19, 18);
    ctx.closePath();
  } else if (p.character === "masterv") {
    ctx.moveTo(0, -30);
    ctx.lineTo(27, -7);
    ctx.lineTo(17, 25);
    ctx.lineTo(-17, 25);
    ctx.lineTo(-27, -7);
    ctx.closePath();
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
  } else if (p.character === "ari") {
    ctx.fillStyle = "#ffcf65";
    ctx.beginPath();
    ctx.arc(0, -8, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff7a2f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -12, 15, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  } else if (p.character === "skyfalcon") {
    ctx.strokeStyle = "#e7d7ad";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 7, -5);
      ctx.quadraticCurveTo(side * 36, -28, side * 54, -16);
      ctx.quadraticCurveTo(side * 35, -4, side * 12, 7);
      ctx.stroke();
    }
    ctx.fillStyle = "#64a7ff";
    ctx.beginPath();
    ctx.arc(0, -5, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.character === "masterv") {
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    ctx.arc(0, -7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffffcc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, 9);
    ctx.lineTo(13, 9);
    ctx.stroke();
  }
  return false;
}

function drawPixelatedConcealment(p, now) {
  const pulse = 1 + Math.sin(now / 180) * .05;
  const blocks = [
    [-28, -32, 18], [-7, -38, 20], [16, -31, 18],
    [-36, -10, 20], [-13, -13, 24], [13, -13, 24], [36, -8, 20],
    [-29, 17, 18], [-7, 20, 22], [17, 18, 18],
    [-42, 33, 12], [34, 31, 12]
  ];
  ctx.save();
  ctx.scale(pulse, pulse);
  ctx.shadowColor = "#78f5ff";
  ctx.shadowBlur = 16;
  ctx.globalAlpha *= .92;
  for (let i = 0; i < blocks.length; i++) {
    const [x, y, size] = blocks[i];
    const flicker = Math.sin(now / 95 + i * 1.7) * 3;
    ctx.fillStyle = i % 3 === 0 ? "#10213fdd" : i % 3 === 1 ? "#4ecfffcc" : "#f7e36bcc";
    ctx.fillRect(Math.round(x + flicker), Math.round(y - flicker * .6), size, size);
  }
  ctx.strokeStyle = "#ffffff88";
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, 43, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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

function drawBush(bush, now) {
  const sway = Math.sin(now / 900 + bush.x * .017 + bush.y * .011) * 2;
  const leafCount = Math.max(8, Math.floor((bush.w + bush.h) / 22));
  ctx.save();
  ctx.translate(0, sway);
  ctx.fillStyle = "#00000024";
  drawRoundedRect(bush.x + 6, bush.y + 9, bush.w, bush.h, 18);
  ctx.fill();
  const body = ctx.createLinearGradient(bush.x, bush.y, bush.x, bush.y + bush.h);
  body.addColorStop(0, "#3fad56");
  body.addColorStop(.58, "#287849");
  body.addColorStop(1, "#1b5538");
  ctx.fillStyle = body;
  drawRoundedRect(bush.x, bush.y, bush.w, bush.h, 20);
  ctx.fill();
  for (let i = 0; i < leafCount; i++) {
    const t = (i + .5) / leafCount;
    const x = bush.x + 12 + (bush.w - 24) * ((Math.sin(i * 2.37 + bush.x * .03) + 1) / 2);
    const y = bush.y + 10 + (bush.h - 20) * t;
    const rx = 14 + Math.sin(i * 1.7 + bush.y) * 4;
    const ry = 8 + Math.cos(i * 1.3 + bush.x) * 3;
    ctx.fillStyle = i % 3 === 0 ? "#5ed36eaa" : i % 3 === 1 ? "#2f9657bb" : "#76df7f88";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.sin(i) * .55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#153a2a88";
  ctx.lineWidth = 3;
  drawRoundedRect(bush.x + 2, bush.y + 2, bush.w - 4, bush.h - 4, 18);
  ctx.stroke();
  ctx.strokeStyle = "#9bf58a55";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bush.x + 18, bush.y + 14);
  ctx.quadraticCurveTo(bush.x + bush.w * .45, bush.y + 4, bush.x + bush.w - 18, bush.y + 18);
  ctx.stroke();
  ctx.restore();
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

  for (const bush of arena.bushes || []) drawBush(bush, now);

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
  for (const zone of gameMeta.iceZones || []) {
    const radius = zone.radius || 170;
    const shimmer = Math.sin(now / 180) * 3;
    ctx.fillStyle = "#bdf6ff36";
    ctx.strokeStyle = "#eefcffcc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(zone.x, zone.y, radius + shimmer, radius * .68 + shimmer, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#73d8ff99";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(zone.x - radius * .72, zone.y + i * 24);
      ctx.lineTo(zone.x + radius * .72, zone.y + i * 18);
      ctx.stroke();
    }
  }
  for (const zone of gameMeta.pixelZones || []) {
    const landed = Date.now() >= zone.landsAt;
    const radius = zone.radius || 92;
    const pulse = landed ? Math.sin(now / 90) * 4 : 0;
    ctx.fillStyle = landed ? "#65f7ff28" : "#ffffff18";
    ctx.strokeStyle = landed ? "#f7ff5dcc" : "#ffffffaa";
    ctx.lineWidth = landed ? 4 : 2;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!landed) {
      ctx.fillStyle = "#f7ff5d";
      ctx.fillRect(zone.x - 14, zone.y - 62, 28, 28);
      ctx.fillStyle = "#65f7ff";
      ctx.fillRect(zone.x - 9, zone.y - 55, 8, 8);
      ctx.fillRect(zone.x + 3, zone.y - 45, 8, 8);
    } else {
      ctx.fillStyle = "#65f7ff99";
      for (let i = 0; i < 14; i++) {
        const angle = i * 2.399 + now / 360;
        const dist = (i % 5 + 1) * radius / 6;
        ctx.fillRect(zone.x + Math.cos(angle) * dist, zone.y + Math.sin(angle) * dist, 10, 10);
      }
    }
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
  if (projectile.type === "tennis") {
    ctx.fillStyle = "#caff3f";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f7ffe0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-2, 0, 5, -Math.PI / 2, Math.PI / 2);
    ctx.arc(2, 0, 5, Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
  } else if (projectile.type === "bone") {
    ctx.fillStyle = "#ead9bf";
    ctx.strokeStyle = "#7c5d44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(5, -6);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-25, 0);
    ctx.lineTo(-18, 5);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff4df";
    ctx.beginPath();
    ctx.arc(-18, -5, 5, 0, Math.PI * 2);
    ctx.arc(-18, 5, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (projectile.type === "laser") {
    ctx.fillStyle = projectile.color || "#75f7ff";
    ctx.shadowColor = projectile.color || "#75f7ff";
    ctx.shadowBlur = 14;
    drawRoundedRect(-20, -4, 40, 8, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(4, -2, 14, 4, 2);
    ctx.fill();
  } else if (projectile.type === "snowflake") {
    ctx.strokeStyle = projectile.color || "#dff8ff";
    ctx.shadowColor = "#bdf6ff";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(11, 0);
      ctx.moveTo(4, -4);
      ctx.lineTo(11, 0);
      ctx.lineTo(4, 4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  } else if (projectile.type === "coin") {
    const size = Math.max(7, projectile.radius || 8);
    ctx.fillStyle = "#ffd54a";
    ctx.strokeStyle = "#9f6519";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * .78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff1a8";
    ctx.font = `bold ${Math.max(10, size)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
  } else if (projectile.type === "claw") {
    ctx.strokeStyle = projectile.color || "#ff9a3c";
    ctx.shadowColor = "#ff6a2a";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (const offset of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(-24, offset);
      ctx.quadraticCurveTo(2, offset - 12, 26, offset - 3);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffe2a6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
  } else if (projectile.type === "skyBombShot") {
    ctx.rotate(now / 120);
    ctx.fillStyle = "#ffd76a";
    ctx.strokeStyle = "#7d5a16";
    ctx.shadowColor = "#ffd76a";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fff4c8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (projectile.type === "goldFeather" || projectile.type === "featherShard") {
    const shard = projectile.type === "featherShard";
    ctx.fillStyle = projectile.color || "#ffd76a";
    ctx.strokeStyle = shard ? "#fff4c8" : "#9f7420";
    ctx.shadowColor = "#ffd76a";
    ctx.shadowBlur = shard ? 9 : 14;
    ctx.lineWidth = shard ? 1.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(shard ? 12 : 24, 0);
    ctx.quadraticCurveTo(shard ? -2 : -6, shard ? -5 : -9, shard ? -13 : -22, shard ? -2 : -4);
    ctx.quadraticCurveTo(shard ? -4 : -8, shard ? 4 : 8, shard ? 12 : 24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (projectile.type === "plasma") {
    ctx.fillStyle = projectile.color || "#6eeaff";
    ctx.shadowColor = projectile.color || "#6eeaff";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e7fbff";
    ctx.beginPath();
    ctx.arc(5, -1, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (projectile.type === "boomerang") {
    ctx.rotate(now / 95);
    ctx.strokeStyle = projectile.returning ? "#8ff0ff" : "#ffd15c";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 16, -2.35, -.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 16, .75, 2.85);
    ctx.stroke();
    ctx.fillStyle = "#ffffffcc";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (projectile.type === "rocket") {
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
  for (const box of gameMeta.bazaarBoxes || []) {
    ctx.save();
    ctx.translate(box.x, box.y);
    ctx.fillStyle = "#00000035";
    ctx.beginPath();
    ctx.ellipse(4, 16, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9b5a2a";
    drawRoundedRect(-20, -18, 40, 34, 6);
    ctx.fill();
    ctx.strokeStyle = "#ffd86a";
    ctx.lineWidth = 3;
    drawRoundedRect(-20, -18, 40, 34, 6);
    ctx.stroke();
    ctx.fillStyle = "#ffd54a";
    ctx.fillRect(-4, -18, 8, 34);
    ctx.fillRect(-20, -3, 40, 7);
    ctx.fillStyle = "#fff4b8";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, -1);
    ctx.restore();
  }
  for (const trail of gameMeta.fireTrails || []) {
    ctx.save();
    if (trail.type === "slash" && Number.isFinite(trail.x1) && Number.isFinite(trail.y1) && Number.isFinite(trail.x2) && Number.isFinite(trail.y2)) {
      const color = trail.color || "#ff9a3c";
      const alpha = Math.max(.18, Math.min(.82, ((trail.endsAt || now) - now) / 680));
      const dx = trail.x2 - trail.x1, dy = trail.y2 - trail.y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const gradient = ctx.createLinearGradient(trail.x1, trail.y1, trail.x2, trail.y2);
      gradient.addColorStop(0, `${color}00`);
      gradient.addColorStop(.32, `${color}${Math.round(alpha * 165).toString(16).padStart(2, "0")}`);
      gradient.addColorStop(1, `${color}00`);
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = gradient;
      ctx.lineCap = "round";
      ctx.lineWidth = (trail.radius || 74) * .72;
      ctx.beginPath();
      ctx.moveTo(trail.x1, trail.y1);
      ctx.lineTo(trail.x2, trail.y2);
      ctx.stroke();
      ctx.strokeStyle = "#fff0c9cc";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(trail.x1 + nx * 11, trail.y1 + ny * 11);
      ctx.lineTo(trail.x2 + nx * 11, trail.y2 + ny * 11);
      ctx.stroke();
    } else {
      ctx.translate(trail.x, trail.y);
      ctx.fillStyle = "#ff7a2f66";
      ctx.beginPath();
      ctx.arc(0, 0, trail.radius || 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd35a88";
      ctx.beginPath();
      ctx.arc(0, 0, (trail.radius || 22) * .45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const bomb of gameMeta.skyBombs || []) {
    const radius = bomb.radius || 132;
    const pulse = 1 + Math.sin(now / 95) * .08;
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    ctx.rotate(now / 260);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "#ffd76a30";
    ctx.beginPath();
    ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff1b8cc";
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * .72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffd76acc";
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(now / 70) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5d7dff99";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 48, -1.2, 1.7);
    ctx.stroke();
    ctx.restore();
  }
  for (const decoy of gameMeta.decoys || []) {
    ctx.save();
    ctx.translate(decoy.x, decoy.y);
    ctx.globalAlpha = .55;
    ctx.strokeStyle = decoy.golden ? "#ffd76a" : "#ffe9a6";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = decoy.golden ? "#fff0a8" : "#ffd54a";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5f3a12";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1);
    ctx.restore();
  }
  for (const projectile of gameMeta.projectiles || []) drawProjectile(projectile, now);
  for (const p of players) {
    const motion = motionFor(p, now);
    const concealedMasterV = isConcealedMasterV(p.character);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alive ? p.invisible ? .24 : 1 : .38;
    ctx.fillStyle = "#0005";
    ctx.beginPath();
    ctx.ellipse(4, 18, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    const imageCharacter = concealedMasterV ? true : drawCharacter(p, motion);
    if (concealedMasterV) drawPixelatedConcealment(p, now);
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
    if (p.cardboardShield) {
      ctx.fillStyle = "#b9824e55";
      ctx.strokeStyle = "#efc28b";
      ctx.lineWidth = 5;
      drawRoundedRect(-37, -35, 74, 70, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#7b5131";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-26, -35);
      ctx.lineTo(-8, -48);
      ctx.lineTo(8, -35);
      ctx.lineTo(26, -48);
      ctx.stroke();
    } else if (p.shield) {
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
    if (p.damageBoost) {
      ctx.strokeStyle = "#ffd54a";
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 37, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (p.goldenArmor) {
      ctx.strokeStyle = "#ffd54a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.phase) {
      ctx.strokeStyle = "#ffffffaa";
      ctx.lineWidth = 3;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!concealedMasterV && p.bazaarBuff) {
      ctx.fillStyle = "#8d5524";
      drawRoundedRect(16, -45, 18, 16, 4);
      ctx.fill();
      ctx.strokeStyle = "#ffd54a";
      ctx.lineWidth = 2;
      drawRoundedRect(16, -45, 18, 16, 4);
      ctx.stroke();
      ctx.fillStyle = "#fff1a8";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", 25, -37);
    }
    if (!concealedMasterV && !imageCharacter) {
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
      if (p.freezeMeter > 0) {
        ctx.fillStyle = "#102c42";
        ctx.fillRect(-22, -27, 44, 4);
        ctx.fillStyle = "#9eeeff";
        ctx.fillRect(-22, -27, 44 * Math.min(1, p.freezeMeter / 100), 4);
      }
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${concealedMasterV ? concealedCharacterLabel : p.name}${p.ghost ? " GHOST" : ""} - ${p.score}`, 0, -43);
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
  if (me?.confused) {
    ctx.fillStyle = "#65f7ff24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f7ff5d";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 + 42);
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
  if (!installEvent) {
    alert(t("installHelp"));
    return;
  }
  await installEvent.prompt();
  installEvent = null;
  install.hidden = true;
};
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js");
