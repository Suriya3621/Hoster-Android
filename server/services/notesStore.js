const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('../config/settings');

const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const FORMATS = ['markdown', 'text', 'code'];
const COLORS = ['none', 'rose', 'amber', 'emerald', 'sky', 'violet', 'slate'];

function load() {
  try {
    const parsed = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(notes) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${NOTES_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(notes, null, 2), 'utf8');
  fs.renameSync(tmp, NOTES_FILE);
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  for (const t of tags) {
    const tag = String(t).trim().toLowerCase().replace(/^#/, '').slice(0, 30);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.slice(0, 12);
}

function sanitize(input, base = {}) {
  const n = { ...base };
  if (input.title !== undefined) n.title = String(input.title).slice(0, 200);
  if (input.body !== undefined) n.body = String(input.body).slice(0, 2_000_000);
  if (input.format !== undefined && FORMATS.includes(input.format)) n.format = input.format;
  if (input.language !== undefined) n.language = String(input.language).slice(0, 30);
  if (input.color !== undefined && COLORS.includes(input.color)) n.color = input.color;
  if (input.tags !== undefined) n.tags = cleanTags(input.tags);
  if (input.pinned !== undefined) n.pinned = Boolean(input.pinned);
  return n;
}

function list({ q, tag } = {}) {
  let notes = load();
  if (tag) notes = notes.filter((n) => (n.tags || []).includes(tag));
  if (q) {
    const needle = String(q).toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(needle) ||
        n.body.toLowerCase().includes(needle) ||
        (n.tags || []).some((t) => t.includes(needle))
    );
  }
  return notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function get(id) {
  return load().find((n) => n.id === id) || null;
}

function create(input = {}) {
  const notes = load();
  const now = new Date().toISOString();
  const note = sanitize(input, {
    id: crypto.randomUUID(),
    title: '',
    body: '',
    format: 'markdown',
    language: '',
    color: 'none',
    tags: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
  });
  notes.push(note);
  persist(notes);
  return note;
}

function update(id, patch) {
  const notes = load();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const next = sanitize(patch, notes[idx]);
  next.updatedAt = new Date().toISOString();
  notes[idx] = next;
  persist(notes);
  return next;
}

function remove(id) {
  const notes = load();
  const next = notes.filter((n) => n.id !== id);
  if (next.length === notes.length) return false;
  persist(next);
  return true;
}

module.exports = { list, get, create, update, remove, COLORS, FORMATS };
