# CouchBrawl native store release

The game UI in `public/play` is packaged directly into the native app. It opens at `/play/`; users do not see a browser address bar or a TV/controller selection screen.

## Required deployment setup

1. Deploy `server.js` to a public host with HTTPS and WebSocket support.
2. Set `window.COUCHBRAWL_SERVER_URL` in `public/native-config.js` to that HTTPS origin, for example `https://game.example.com`.
3. Run `npm.cmd install` and `npm.cmd run native:sync`.

The native apps contain the UI but multiplayer still needs the public Node.js/Socket.io server. Never use `localhost` in the store build.

## Android / Google Play

Run `npm.cmd exec cap add android` once, then `npm.cmd run native:sync` and `npm.cmd run native:android`. In Android Studio, create a signed Android App Bundle (`.aab`) and upload it in Google Play Console.

## iPhone / iPad / App Store

On a Mac with Xcode, run `npm exec cap add ios`, then `npm run native:sync` and `npm run native:ios`. Select a signing team, set the final bundle identifier, archive the app, then submit the archive in App Store Connect.

Before submission, replace the placeholder app icon, prepare privacy policy/support URLs, complete the store listings, and test real-device multiplayer against the production HTTPS server.
