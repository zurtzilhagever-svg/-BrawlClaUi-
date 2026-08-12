/* For browsers, use the current origin. Store builds set the HTTPS game server here. */
window.CouchBrawlRuntime = {
  serverUrl: window.COUCHBRAWL_SERVER_URL || location.origin
};
