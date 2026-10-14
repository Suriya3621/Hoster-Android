const path = require('path');

const fs = require('fs');

// The built web UI (client/dist). In the desktop app it is shipped next to the server.
const CLIENT_DIST = process.env.HOSTER_CLIENT_DIST || path.join(__dirname, '..', '..', 'client', 'dist');
const HAS_CLIENT_DIST = fs.existsSync(path.join(CLIENT_DIST, 'index.html'));
const PORT = parseInt(process.env.HOSTER_PORT, 10) || 4173;

module.exports = {
  CLIENT_DIST,
  HAS_CLIENT_DIST,
  // Port people open in a browser: the server itself once the UI is built, Vite's 5173 in dev mode.
  UI_PORT: HAS_CLIENT_DIST ? PORT : 5173,
  PORT,
  // Optional PIN for LAN access. Leave empty to disable auth entirely.
  ACCESS_PIN: process.env.HOSTER_PIN || '',
  // Optional PIN that lets the admin panel be used from OTHER devices.
  // Without it, the admin panel only works on the host PC itself (localhost).
  ADMIN_PIN: process.env.HOSTER_ADMIN_PIN || '',
  MAX_UPLOAD_MB: parseInt(process.env.HOSTER_MAX_UPLOAD_MB, 10) || 20000,
  APP_NAME: 'Hoster',
  // Everything Hoster saves about itself (shares.json, notes.json) lives here.
  DATA_DIR: process.env.HOSTER_DATA_DIR || path.join(__dirname, '..', 'data'),
};
