const express = require('express');
const router = express.Router();

const statusController = require('../controllers/statusController');
const filesController = require('../controllers/filesController');
const { streamFile } = require('../controllers/streamController');
const { upload, handleUpload } = require('../controllers/uploadController');
const notesController = require('../controllers/notesController');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminAuth');
const { trackUpload } = require('../middleware/uploadTracker');

// --- Status / network / shares -------------------------------------------
router.get('/status', statusController.getStatus);
router.get('/network', statusController.getNetwork);
router.get('/shares', statusController.getShares);

// --- Browsing --------------------------------------------------------------
router.get('/files', filesController.listFiles);
router.get('/files/details', filesController.getFileDetails);
router.get('/search', filesController.searchFiles);
router.get('/media', filesController.browseByCategory);

// --- Streaming / download ---------------------------------------------------
// The :path(*) pattern lets a virtual path with slashes ("movies/Action/x.mp4")
// arrive as a single route param.
router.get('/stream/:path(*)', streamFile);
router.get('/download/:path(*)', filesController.downloadFile);

// --- Mutations ---------------------------------------------------------------
router.post('/folders', express.json(), filesController.createFolder);
router.delete('/files/:path(*)', filesController.deleteFile);
router.patch('/files/:path(*)', express.json(), filesController.renameFile);
router.post('/upload', trackUpload, upload.array('files'), handleUpload);

// --- Notes ---------------------------------------------------------------------
router.get('/notes', notesController.listNotes);
router.get('/notes/:id', notesController.getNote);
router.post('/notes', express.json({ limit: '5mb' }), notesController.createNote);
router.put('/notes/:id', express.json({ limit: '5mb' }), notesController.updateNote);
router.delete('/notes/:id', notesController.deleteNote);

// --- Admin (host PC only, or admin PIN) ------------------------------------
router.get('/admin/status', adminController.getAdminStatus);
router.get('/admin/shares', requireAdmin, adminController.listShares);
router.post('/admin/shares/reload', requireAdmin, adminController.reloadShares);
router.post('/admin/shares', requireAdmin, express.json(), adminController.createShare);
router.put('/admin/shares/:id', requireAdmin, express.json(), adminController.updateShare);
router.delete('/admin/shares/:id', requireAdmin, adminController.deleteShare);
router.get('/admin/browse', requireAdmin, adminController.browse);

module.exports = router;
