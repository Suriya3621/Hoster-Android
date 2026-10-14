const notesStore = require('../services/notesStore');
const { emit } = require('../services/realtime');

function listNotes(req, res) {
  res.json({ notes: notesStore.list({ q: req.query.q, tag: req.query.tag }) });
}

function getNote(req, res) {
  const note = notesStore.get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found.' });
  res.json(note);
}

function createNote(req, res) {
  const note = notesStore.create(req.body || {});
  emit('notes:changed', { action: 'created', id: note.id, by: req.header('x-device-id') || null });
  res.status(201).json(note);
}

function updateNote(req, res) {
  const note = notesStore.update(req.params.id, req.body || {});
  if (!note) return res.status(404).json({ error: 'Note not found.' });
  emit('notes:changed', { action: 'updated', id: note.id, by: req.header('x-device-id') || null });
  res.json(note);
}

function deleteNote(req, res) {
  if (!notesStore.remove(req.params.id)) return res.status(404).json({ error: 'Note not found.' });
  emit('notes:changed', { action: 'deleted', id: req.params.id, by: req.header('x-device-id') || null });
  res.json({ ok: true });
}

module.exports = { listNotes, getNote, createNote, updateNote, deleteNote };
