const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const shares = require('../config/shares');
const { adminAccess } = require('../middleware/adminAuth');
const { ADMIN_PIN, DATA_DIR } = require('../config/settings');
const { emit } = require('../services/realtime');

function getAdminStatus(req, res) {
  const access = adminAccess(req);
  res.json({
    allowed: access.allowed,
    via: access.via,
    pinAvailable: Boolean(ADMIN_PIN),
    sharesFile: access.allowed ? shares.SHARES_FILE : null,
    dataDir: access.allowed ? DATA_DIR : null,
    platform: process.platform,
  });
}

function listShares(req, res) {
  res.json({ shares: shares.listShareRecords(), file: shares.SHARES_FILE });
}

function createShare(req, res, next) {
  try {
    const record = shares.addShare(req.body || {});
    emit('shares:changed', { action: 'added', id: record.id });
    res.status(201).json({ share: record, shares: shares.listShareRecords() });
  } catch (err) {
    next(err);
  }
}

function updateShare(req, res, next) {
  try {
    const record = shares.updateShare(req.params.id, req.body || {});
    emit('shares:changed', { action: 'updated', id: record.id });
    res.json({ share: record, shares: shares.listShareRecords() });
  } catch (err) {
    next(err);
  }
}

function deleteShare(req, res, next) {
  try {
    shares.removeShare(req.params.id);
    emit('shares:changed', { action: 'removed', id: req.params.id });
    res.json({ ok: true, shares: shares.listShareRecords() });
  } catch (err) {
    next(err);
  }
}

function reloadShares(req, res, next) {
  try {
    const count = shares.reloadFromDisk();
    emit('shares:changed', { action: 'reloaded' });
    res.json({ ok: true, count, shares: shares.listShareRecords() });
  } catch (err) {
    next(err);
  }
}

function toForward(p) {
  return p.replace(/\\/g, '/');
}

/** Windows drive letters that currently exist (C:/, D:/, E:/ ...). */
function listDrives() {
  const drives = [];
  for (let code = 65; code <= 90; code += 1) {
    const letter = String.fromCharCode(code);
    try {
      if (fs.existsSync(`${letter}:/`)) drives.push({ name: `${letter}:`, path: `${letter}:/`, kind: 'drive' });
    } catch {
      /* skip unreadable drive */
    }
  }
  return drives;
}

function quickPlaces() {
  const home = os.homedir();
  const names = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos', 'Movies'];
  const places = [];
  for (const n of names) {
    const p = path.join(home, n);
    try {
      if (fs.statSync(p).isDirectory()) places.push({ name: n, path: toForward(p), kind: 'place' });
    } catch {
      /* not present on this OS */
    }
  }
  return places;
}

/**
 * GET /api/admin/browse?path=  — list sub-folders of any folder on THIS PC so the
 * admin can pick what to share. Folders only (never file names/contents), and
 * only for an authorised admin (see requireAdmin on the route).
 */
async function browse(req, res, next) {
  try {
    const requested = String(req.query.path || '').trim();

    if (!requested) {
      const roots = process.platform === 'win32' ? listDrives() : [{ name: '/', path: '/', kind: 'drive' }];
      return res.json({ path: '', parent: null, entries: roots, places: quickPlaces() });
    }

    if (requested.includes('\0')) return res.status(400).json({ error: 'Invalid path.' });
    const abs = path.resolve(requested);
    const stat = await fsp.stat(abs).catch(() => null);
    if (!stat || !stat.isDirectory()) return res.status(404).json({ error: 'Folder not found.' });

    let dirents = [];
    try {
      dirents = await fsp.readdir(abs, { withFileTypes: true });
    } catch (err) {
      return res.status(403).json({ error: `Can't read this folder (${err.code || 'access denied'}).` });
    }

    const entries = dirents
      .filter((d) => d.isDirectory() && !d.name.startsWith('$') && d.name !== 'System Volume Information')
      .map((d) => ({ name: d.name, path: toForward(path.join(abs, d.name)), kind: 'folder' }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const parentAbs = path.dirname(abs);
    res.json({
      path: toForward(abs),
      parent: parentAbs === abs ? '' : toForward(parentAbs), // '' means "back to the drive list"
      entries,
      places: [],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAdminStatus, listShares, createShare, updateShare, deleteShare, reloadShares, browse };
