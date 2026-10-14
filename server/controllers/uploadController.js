const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { resolveSafePath, assertWritable } = require('../utils/pathSafety');
const { MAX_UPLOAD_MB } = require('../config/settings');

// Storage destination is resolved per-request from the "path" field, so files
// land directly in the real shared folder — never in a temp/public directory.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      const virtualParent = req.body.path || req.query.path || '';
      const { absolutePath, share } = resolveSafePath(virtualParent);
      assertWritable(share);
      fs.mkdirSync(absolutePath, { recursive: true });
      cb(null, absolutePath);
    } catch (err) {
      cb(err);
    }
  },
  filename(req, file, cb) {
    // Avoid clobbering existing files with the same name.
    const destDir = req.body.path || req.query.path || '';
    try {
      const { absolutePath: parentAbs } = resolveSafePath(destDir);
      let name = file.originalname;
      let counter = 1;
      const ext = path.extname(name);
      const base = path.basename(name, ext);
      while (fs.existsSync(path.join(parentAbs, name))) {
        name = `${base} (${counter})${ext}`;
        counter += 1;
      }
      cb(null, name);
    } catch (err) {
      cb(err);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

function handleUpload(req, res) {
  const uploaded = (req.files || []).map((f) => ({
    name: f.filename,
    size: f.size,
  }));
  res.status(201).json({ ok: true, uploaded });
}

module.exports = { upload, handleUpload };
