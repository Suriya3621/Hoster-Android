const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const { PORT, UI_PORT, APP_NAME, ACCESS_PIN, CLIENT_DIST, HAS_CLIENT_DIST } = require('./config/settings');
const { SHARED_DIRECTORIES } = require('./config/shares');
const { getPrimaryLocalIP } = require('./utils/network');
const { requirePinIfConfigured } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const apiRouter = require('./routes/api');
const { initRealtime } = require('./services/realtime');

const app = express();

// Allow the Vite dev server (any LAN device) to call this API during development.
app.use(cors());

app.use('/api', requirePinIfConfigured, apiRouter);

if (HAS_CLIENT_DIST) {
  // Production / desktop app: this one server delivers the web UI AND the API.
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
  // Single-page app: any non-API address (/notes, /admin, /files/...) loads index.html.
  app.get(/^\/(?!api\/|socket\.io\/).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.type('text/plain').send(
      `${APP_NAME} API is running. The web UI is served separately by Vite on port 5173.\n` +
        `Try http://${getPrimaryLocalIP()}:5173 on this network.`
    );
  });
}

app.use(errorHandler);

// Socket.IO shares the same port: it needs the raw HTTP server, not just Express.
const httpServer = http.createServer(app);
initRealtime(httpServer);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use — is Hoster already running? Set HOSTER_PORT to use another port.\n`);
  } else {
    console.error('\n  Server error:', err.message, '\n');
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getPrimaryLocalIP();
  console.log('');
  console.log(`  ${APP_NAME} server listening`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${ip}:${PORT}   <- open this on your phone`);
  console.log(`  Shares:  ${SHARED_DIRECTORIES.map((s) => s.name).join(', ') || '(none configured)'}`);
  if (ACCESS_PIN) console.log('  PIN protection: ENABLED');
  console.log(`  Admin panel: http://localhost:${UI_PORT}/admin  (host PC only` + (process.env.HOSTER_ADMIN_PIN ? ', or admin PIN)' : ')'));
  console.log('');
});

module.exports = { app, httpServer };
