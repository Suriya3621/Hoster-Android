const os = require('os');
const { ADMIN_PIN } = require('../config/settings');

const OWN_ADDRESSES = () => {
  const set = new Set(['127.0.0.1', '::1']);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) set.add(a.address);
  }
  return set;
};

function normalize(ip) {
  return String(ip || '').replace(/^::ffff:/, '');
}

/**
 * Who is really asking? In dev, requests from phones reach Express through
 * Vite's proxy, so the direct peer is always localhost. Vite is configured to
 * add X-Forwarded-For (xfwd), and we trust ONLY the LAST entry of that header —
 * the one our own proxy appended — and only when the direct peer is loopback.
 * A device hitting port 4173 directly can't fake being local this way.
 */
function clientAddress(req) {
  const direct = normalize(req.socket.remoteAddress);
  if (direct === '127.0.0.1' || direct === '::1') {
    const forwarded = String(req.headers['x-forwarded-for'] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (forwarded.length) return normalize(forwarded[forwarded.length - 1]);
  }
  return direct;
}

function isHostMachine(req) {
  return OWN_ADDRESSES().has(clientAddress(req));
}

/** { allowed, via } — local PC always; other devices only with the admin PIN. */
function adminAccess(req) {
  if (isHostMachine(req)) return { allowed: true, via: 'local' };
  const provided = req.header('x-admin-pin');
  if (ADMIN_PIN && provided && provided === ADMIN_PIN) return { allowed: true, via: 'pin' };
  return { allowed: false, via: null };
}

function requireAdmin(req, res, next) {
  if (adminAccess(req).allowed) return next();
  return res.status(403).json({
    error: ADMIN_PIN
      ? 'Admin panel needs the admin PIN when opened from another device.'
      : 'Admin panel is only available on the PC that runs Hoster.',
  });
}

module.exports = { requireAdmin, adminAccess, ADMIN_PIN_SET: Boolean(ADMIN_PIN) };
