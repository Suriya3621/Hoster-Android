function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[hoster] Unhandled error:', err);
  res.status(status).json({ error: err.message || 'Internal server error.' });
}

module.exports = { errorHandler };
