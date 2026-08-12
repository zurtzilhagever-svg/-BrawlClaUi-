/* Lightweight Bluetooth/USB controller adapter. Nintendo layouts can swap A/B. */
window.GamepadController = (() => {
  let callback = () => {};
  let swapAB = JSON.parse(localStorage.getItem("couchbrawl-swap-ab") || "false");
  function deadzone(value) { return Math.abs(value) < 0.16 ? 0 : Math.max(-1, Math.min(1, value)); }
  function tick() {
    const gamepad = [...navigator.getGamepads()].find(Boolean);
    if (gamepad) {
      const a = Boolean(gamepad.buttons[swapAB ? 1 : 0]?.pressed);
      const b = Boolean(gamepad.buttons[swapAB ? 0 : 1]?.pressed);
      callback({ x: deadzone(gamepad.axes[0] || 0), y: deadzone(gamepad.axes[1] || 0), attack: a, special: b, id: gamepad.id });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return {
    onInput(fn) { callback = typeof fn === "function" ? fn : () => {}; },
    get swapAB() { return swapAB; },
    setSwapAB(value) { swapAB = Boolean(value); localStorage.setItem("couchbrawl-swap-ab", JSON.stringify(swapAB)); }
  };
})();
