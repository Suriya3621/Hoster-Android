const os = require('os');

/** Returns the most likely LAN-facing IPv4 address of this machine. */
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs || []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        candidates.push({ name, address: addr.address });
      }
    }
  }

  // Prefer common LAN prefixes (typical home/office router ranges) first.
  const priority = ['192.168.', '10.', '172.'];
  candidates.sort((a, b) => {
    const aScore = priority.findIndex((p) => a.address.startsWith(p));
    const bScore = priority.findIndex((p) => b.address.startsWith(p));
    return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
  });

  return candidates;
}

function getPrimaryLocalIP() {
  const ips = getLocalIPs();
  return ips.length ? ips[0].address : '127.0.0.1';
}

module.exports = { getLocalIPs, getPrimaryLocalIP };
