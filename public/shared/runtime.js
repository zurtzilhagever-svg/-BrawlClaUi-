/* For browsers, use the current origin. Store builds set the HTTPS game server here. */
window.BrawlClaUiRuntime = {
  serverUrl: window.BRAWLCLAUI_SERVER_URL || window.COUCHBRAWL_SERVER_URL || location.origin
};
