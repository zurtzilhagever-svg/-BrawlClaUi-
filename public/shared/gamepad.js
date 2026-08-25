/* Lightweight Bluetooth/USB controller adapter. Nintendo layouts can swap A/B. */
window.GamepadController = (() => {
  let callback = () => {};
  let lastAttack = false;
  let lastSpecial = false;
  let swapAB = JSON.parse(localStorage.getItem("brawlclaui-swap-ab") || "false");
  function deadzone(value) { return Math.abs(value) < 0.16 ? 0 : Math.max(-1, Math.min(1, value)); }
  function isPlayStation(gamepad) {
    return /dualsense|dualshock|wireless controller|playstation|sony/i.test(gamepad.id || "");
  }
  function pressed(gamepad, index) {
    return Boolean(gamepad.buttons[index]?.pressed);
  }
  function pulse(gamepad, duration = 38, strongMagnitude = 0.34) {
    const actuator = gamepad.vibrationActuator || gamepad.hapticActuators?.[0];
    actuator?.playEffect?.("dual-rumble", {
      duration,
      startDelay: 0,
      strongMagnitude,
      weakMagnitude: 0.18
    }).catch?.(() => {});
  }
  function tick() {
    const gamepad = [...navigator.getGamepads()].find(Boolean);
    if (gamepad) {
      const playStation = isPlayStation(gamepad);
      const faceAttack = pressed(gamepad, swapAB ? 1 : 0);
      const faceSpecial = pressed(gamepad, swapAB ? 0 : 1);
      const attack = playStation ? faceAttack || pressed(gamepad, 7) : faceAttack;
      const special = playStation ? faceSpecial || pressed(gamepad, 6) || pressed(gamepad, 3) : faceSpecial;
      const aimX = deadzone(gamepad.axes[2] || 0);
      const aimY = deadzone(gamepad.axes[3] || 0);
      if (playStation && (attack && !lastAttack || special && !lastSpecial)) pulse(gamepad, special ? 58 : 34, special ? 0.46 : 0.28);
      lastAttack = attack;
      lastSpecial = special;
      callback({
        x: deadzone(gamepad.axes[0] || 0),
        y: deadzone(gamepad.axes[1] || 0),
        aimX,
        aimY,
        attack,
        special,
        id: gamepad.id,
        type: playStation ? "playstation" : "generic"
      });
    } else {
      lastAttack = false;
      lastSpecial = false;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return {
    onInput(fn) { callback = typeof fn === "function" ? fn : () => {}; },
    get swapAB() { return swapAB; },
    setSwapAB(value) { swapAB = Boolean(value); localStorage.setItem("brawlclaui-swap-ab", JSON.stringify(swapAB)); }
  };
})();
