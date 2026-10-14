/**
 * Shared folders — stored in server/data/shares.json and editable live from
 * the Admin panel (no restart needed).
 *
 * This is the ONLY list of folders Hoster is allowed to expose. Nothing
 * outside these roots is ever reachable (see utils/pathSafety.js).
 *
 * First run: shares.json doesn't exist yet, so it is created from
 * DEFAULT_SHARES below (or HOSTER_SHARES if you set that env variable).
 * After that, shares.json is the source of truth — edit it by hand or use
 * the Admin panel. DEFAULT_SHARES is never consulted again.
 *
 * IMPORTANT: SHARED_DIRECTORIES is mutated IN PLACE (never reassigned), so
 * every module that did `require('./shares').SHARED_DIRECTORIES` keeps seeing
 * the current list after an admin edit.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DATA_DIR } = require('./settings');

const SHARES_FILE = path.join(DATA_DIR, 'shares.json');

// Used ONLY to create shares.json the first time. Use forward slashes on Windows.
const DEFAULT_SHARES = [
  { name: 'Movies', path: 'E:/Movies' },
  { name: 'Anime', path: 'E:/Anime' },
  { name: 'Web Series', path: 'E:/WebSeries' },
  { name: 'Photos', path: 'C:/Users/ST/Pictures' },
  { name: 'Music', path: 'C:/Users/ST/Music' },
  { name: 'Devolopment Videos', path: 'D:/Devolopment Videos' },
  { name: 'Documents', path: 'D:/PDF' },
];

function slug(name) {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizePath(p) {
  return String(p || '').trim().replace(/\\/g, '/').replace(/\/+$/, '') || '/';
}

/** Resolve a stored path to the real on-disk path (follows symlinks when it exists). */
function resolveReal(p) {
  try {
    return fs.realpathSync(path.resolve(p));
  } catch {
    return path.resolve(p); // may not exist right now (unplugged drive); validated per request
  }
}

function readStored() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SHARES_FILE, 'utf8'));
    if (parsed && Array.isArray(parsed.shares)) return parsed.shares;
  } catch {
    /* missing or corrupt — fall through to seeding */
  }
  return null;
}

function seedFromDefaults() {
  let source = DEFAULT_SHARES;
  if (process.env.HOSTER_SHARES) {
    try {
      const parsed = JSON.parse(process.env.HOSTER_SHARES);
      if (Array.isArray(parsed) && parsed.length) source = parsed;
    } catch (err) {
      console.warn('[hoster] Could not parse HOSTER_SHARES env var, using built-in defaults.', err.message);
    }
  }
  const os = require('os');
  let usable = source.filter((s) => {
    try { return fs.statSync(path.resolve(s.path)).isDirectory(); } catch { return false; }
  });
  if (!usable.length) {
    // Fresh install on another PC: start with the normal user folders instead of nothing.
    const home = os.homedir();
    usable = ['Videos', 'Music', 'Pictures', 'Documents', 'Downloads']
      .map((n) => ({ name: n, path: path.join(home, n) }))
      .filter((s) => { try { return fs.statSync(s.path).isDirectory(); } catch { return false; } });
  }
  const used = new Set();
  return usable.map((s) => {
    let id = slug(s.name) || 'share';
    while (used.has(id)) id += '-2';
    used.add(id);
    return { id, name: s.name, path: normalizePath(s.path), readOnly: Boolean(s.readOnly) };
  });
}

function persist(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${SHARES_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, shares: list }, null, 2), 'utf8');
  fs.renameSync(tmp, SHARES_FILE); // atomic: never leaves a half-written file
}

// Raw, editable records (what is saved in shares.json).
let records = readStored();
if (!records) {
  records = seedFromDefaults();
  try {
    persist(records);
  } catch (err) {
    console.warn('[hoster] Could not write shares.json:', err.message);
  }
}

// Live list used by the rest of the server (id/name/path = resolved real path).
const SHARED_DIRECTORIES = [];

function rebuild() {
  SHARED_DIRECTORIES.length = 0;
  for (const r of records) {
    SHARED_DIRECTORIES.push({
      id: r.id,
      name: r.name,
      path: resolveReal(r.path),
      configuredPath: r.path,
      readOnly: Boolean(r.readOnly),
    });
  }
}
rebuild();

function getShareById(id) {
  return SHARED_DIRECTORIES.find((s) => s.id === id);
}

/** Admin-facing view of every share, including whether its folder exists right now. */
function listShareRecords() {
  return records.map((r) => {
    let exists = false;
    try {
      exists = fs.statSync(resolveReal(r.path)).isDirectory();
    } catch {
      exists = false;
    }
    return { id: r.id, name: r.name, path: r.path, readOnly: Boolean(r.readOnly), exists };
  });
}

/** Re-read shares.json (after someone edited it by hand). Keeps the current list if the file is unreadable. */
function reloadFromDisk() {
  const stored = readStored();
  if (!stored) throw Object.assign(new Error('shares.json is missing or not valid JSON — nothing was changed.'), { status: 400 });
  const used = new Set();
  const cleaned = [];
  for (const s of stored) {
    if (!s || typeof s.name !== 'string' || typeof s.path !== 'string') continue;
    let id = typeof s.id === 'string' && s.id ? s.id : slug(s.name) || 'share';
    while (used.has(id)) id += '-2';
    used.add(id);
    cleaned.push({ id, name: s.name.trim(), path: normalizePath(s.path), readOnly: Boolean(s.readOnly) });
  }
  records = cleaned;
  persist(records);
  rebuild();
  return records.length;
}

function validateInput({ name, path: p }, ignoreId) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return 'Give this shared folder a name.';
  if (cleanName.length > 60) return 'Name must be 60 characters or fewer.';
  if (!String(p || '').trim()) return 'Choose a folder path.';
  if (records.some((r) => r.id !== ignoreId && r.name.toLowerCase() === cleanName.toLowerCase())) {
    return `A shared folder named "${cleanName}" already exists.`;
  }
  let stat;
  try {
    stat = fs.statSync(path.resolve(p));
  } catch {
    return `That folder doesn't exist on this PC: ${p}`;
  }
  if (!stat.isDirectory()) return 'That path is a file, not a folder.';
  return null;
}

function addShare({ name, path: p, readOnly }) {
  const error = validateInput({ name, path: p });
  if (error) throw Object.assign(new Error(error), { status: 400 });
  let id = slug(name) || 'share';
  const ids = new Set(records.map((r) => r.id));
  while (ids.has(id)) id = `${slug(name) || 'share'}-${crypto.randomBytes(2).toString('hex')}`;
  const record = { id, name: String(name).trim(), path: normalizePath(p), readOnly: Boolean(readOnly) };
  records.push(record);
  persist(records);
  rebuild();
  return record;
}

/** The id never changes on rename, so bookmarks/favorites keep working. */
function updateShare(id, patch) {
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) throw Object.assign(new Error('Shared folder not found.'), { status: 404 });
  const merged = { ...records[idx], ...patch };
  const error = validateInput(merged, id);
  if (error) throw Object.assign(new Error(error), { status: 400 });
  records[idx] = {
    id,
    name: String(merged.name).trim(),
    path: normalizePath(merged.path),
    readOnly: Boolean(merged.readOnly),
  };
  persist(records);
  rebuild();
  return records[idx];
}

/** Stops sharing a folder. Never touches the files inside it. */
function removeShare(id) {
  const next = records.filter((r) => r.id !== id);
  if (next.length === records.length) throw Object.assign(new Error('Shared folder not found.'), { status: 404 });
  records = next;
  persist(records);
  rebuild();
}

module.exports = {
  SHARED_DIRECTORIES,
  getShareById,
  slug,
  listShareRecords,
  addShare,
  updateShare,
  removeShare,
  reloadFromDisk,
  SHARES_FILE,
};
