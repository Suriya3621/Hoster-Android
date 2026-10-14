const { emit } = require('../services/realtime');

/**
 * Watches an upload request as its bytes arrive and broadcasts live progress
 * to every connected device (Socket.IO), so the PC can watch a phone upload in
 * real time. It only COUNTS bytes — multer still streams the data to disk.
 *
 * The client labels the transfer with headers:
 *   X-Upload-Id, X-Upload-Name (URL-encoded), X-Device-Name (URL-encoded)
 */
function safeDecode(value, max) {
  try {
    return decodeURIComponent(String(value || '')).slice(0, max);
  } catch {
    return String(value || '').slice(0, max);
  }
}

function trackUpload(req, res, next) {
  const rawId = String(req.header('x-upload-id') || '');
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(rawId)) return next(); // untracked upload still works

  const id = rawId;
  const name = safeDecode(req.header('x-upload-name'), 200) || 'file';
  const device = safeDecode(req.header('x-device-name'), 40) || 'Unknown device';
  const total = parseInt(req.header('content-length'), 10) || 0;

  let loaded = 0;
  let lastEmit = 0;
  let lastLoaded = 0;
  let speed = 0; // bytes per second, smoothed
  let finished = false;
  const startedAt = Date.now();

  const snapshot = (status, extra = {}) => ({
    id,
    name,
    device,
    status,
    loaded,
    total,
    percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
    speed: Math.round(speed),
    etaSeconds: speed > 0 && total ? Math.max(0, Math.round((total - loaded) / speed)) : null,
    startedAt,
    ...extra,
  });

  emit('upload:start', snapshot('uploading'));

  req.on('data', (chunk) => {
    loaded += chunk.length;
    const now = Date.now();
    if (now - lastEmit >= 150) {
      const dt = (now - (lastEmit || startedAt)) / 1000;
      const instant = dt > 0 ? (loaded - lastLoaded) / dt : 0;
      speed = speed ? speed * 0.7 + instant * 0.3 : instant;
      lastEmit = now;
      lastLoaded = loaded;
      emit('upload:progress', snapshot('uploading'));
    }
  });

  res.on('finish', () => {
    finished = true;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      loaded = total || loaded;
      emit('upload:done', snapshot('done', { percent: 100 }));
    } else {
      emit('upload:error', snapshot('error', { message: 'Upload was rejected by the server.' }));
    }
  });

  res.on('close', () => {
    if (!finished) emit('upload:error', snapshot('error', { message: 'Upload was interrupted.' }));
  });

  next();
}

module.exports = { trackUpload };
