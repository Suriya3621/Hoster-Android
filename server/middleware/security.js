const { ACCESS_PIN } = require('../config/settings');

/**
 * If HOSTER_PIN is set, every /api request (other than /api/status, so the
 * client can render the "enter PIN" screen) must include a matching
 * X-Hoster-Pin header. If no PIN is configured, auth is a no-op — Hoster is
 * open to anyone on the LAN, which is the default, simplest experience.
 */
function requirePinIfConfigured(req, res, next) {
  if (!ACCESS_PIN) return next();
  if (req.path === '/status') return next();

  // Normal fetch() calls send the PIN as a header; native <video>/<img>/<audio>
  // tags can't set custom headers, so streaming/thumbnail URLs may pass it as
  // a query param instead.
  const provided = req.header('x-hoster-pin') || req.query.pin;
  if (provided && provided === ACCESS_PIN) return next();

  return res.status(401).json({ error: 'A valid PIN is required to access this Hoster server.' });
}

module.exports = { requirePinIfConfigured };
