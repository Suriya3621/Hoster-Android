const fs = require('fs');
const { SHARED_DIRECTORIES } = require('../config/shares');
const { getLocalIPs, getPrimaryLocalIP } = require('../utils/network');
const { PORT, UI_PORT, APP_NAME, ACCESS_PIN } = require('../config/settings');
const { deviceList } = require('../services/realtime');

function getStatus(req, res) {
  res.json({
    app: APP_NAME,
    status: 'online',
    authRequired: Boolean(ACCESS_PIN),
    port: PORT,
    uptimeSeconds: Math.floor(process.uptime()),
    sharesCount: SHARED_DIRECTORIES.length,
    connectedDevices: deviceList().length,
  });
}

function getNetwork(req, res) {
  const ips = getLocalIPs();
  const primary = getPrimaryLocalIP();
  res.json({
    primaryIP: primary,
    port: UI_PORT,
    url: `http://${primary}:${UI_PORT}`,
    interfaces: ips,
  });
}

function getShares(req, res) {
  const shares = SHARED_DIRECTORIES.map((s) => {
    let exists = false;
    try {
      exists = fs.existsSync(s.path) && fs.statSync(s.path).isDirectory();
    } catch {
      exists = false;
    }
    return { id: s.id, name: s.name, exists, readOnly: Boolean(s.readOnly) };
  });
  res.json({ shares });
}

module.exports = { getStatus, getNetwork, getShares };
