const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { SHARED_DIRECTORIES } = require('../config/shares');
const { resolveSafePath, resolveExistingSafePath, assertWritable } = require('../utils/pathSafety');
const { getFileCategory, getExtension } = require('../utils/fileCategory');

async function statToEntry(name, fullPath, virtualParent) {
  const stat = await fsp.stat(fullPath);
  const isDirectory = stat.isDirectory();
  return {
    name,
    virtualPath: virtualParent ? `${virtualParent}/${name}` : name,
    isDirectory,
    size: isDirectory ? null : stat.size,
    modified: stat.mtime,
    extension: isDirectory ? null : getExtension(name),
    category: isDirectory ? 'folder' : getFileCategory(name),
  };
}

/** GET /api/files?path=<shareId>/<relative> — list a directory's contents. */
async function listFiles(req, res, next) {
  try {
    const virtualPath = req.query.path || '';

    // Special case: empty path lists the shares themselves as top-level "folders".
    if (!virtualPath) {
      const entries = SHARED_DIRECTORIES.map((s) => ({
        name: s.name,
        virtualPath: s.id,
        isDirectory: true,
        size: null,
        modified: null,
        extension: null,
        category: 'folder',
      }));
      return res.json({ path: '', entries });
    }

    const { absolutePath, relative } = resolveExistingSafePath(virtualPath);
    const stat = await fsp.stat(absolutePath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Requested path is a file, not a folder.' });
    }

    const dirents = await fsp.readdir(absolutePath, { withFileTypes: true });
    const entries = await Promise.all(
      dirents
        .filter((d) => !d.name.startsWith('.')) // hide dotfiles
        .map((d) => statToEntry(d.name, path.join(absolutePath, d.name), virtualPath))
    );

    // Folders first, then alphabetical — client can re-sort.
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    res.json({ path: virtualPath, relative, entries });
  } catch (err) {
    next(err);
  }
}

/** GET /api/files/details?path=... — metadata for a single file/folder. */
async function getFileDetails(req, res, next) {
  try {
    const virtualPath = req.query.path;
    const { absolutePath, share, relative } = resolveExistingSafePath(virtualPath);
    const stat = await fsp.stat(absolutePath);
    const name = path.basename(absolutePath);

    res.json({
      name,
      virtualPath,
      share: share.name,
      isDirectory: stat.isDirectory(),
      size: stat.isDirectory() ? null : stat.size,
      modified: stat.mtime,
      created: stat.birthtime,
      extension: stat.isDirectory() ? null : getExtension(name),
      category: stat.isDirectory() ? 'folder' : getFileCategory(name),
      location: path.dirname(relative || '') === '.' ? share.name : `${share.name}/${path.dirname(relative)}`,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/download/:path(*) — force-download a file. */
async function downloadFile(req, res, next) {
  try {
    const virtualPath = req.params[0];
    const { absolutePath } = resolveExistingSafePath(virtualPath);
    const stat = await fsp.stat(absolutePath);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Cannot download a folder directly.' });
    res.download(absolutePath);
  } catch (err) {
    next(err);
  }
}

/** GET /api/search?q=&path= — recursive, depth-limited filename search. */
async function searchFiles(req, res, next) {
  try {
    const query = String(req.query.q || '').toLowerCase().trim();
    const scope = req.query.path || '';
    if (!query) return res.json({ results: [] });

    const MAX_RESULTS = 200;
    const MAX_DEPTH = 8;
    const results = [];

    async function walk(virtualPath, absPath, depth) {
      if (results.length >= MAX_RESULTS || depth > MAX_DEPTH) return;
      let dirents;
      try {
        dirents = await fsp.readdir(absPath, { withFileTypes: true });
      } catch {
        return;
      }
      for (const d of dirents) {
        if (results.length >= MAX_RESULTS) return;
        if (d.name.startsWith('.')) continue;
        const childVirtual = virtualPath ? `${virtualPath}/${d.name}` : d.name;
        const childAbs = path.join(absPath, d.name);
        if (d.name.toLowerCase().includes(query)) {
          const entry = await statToEntry(d.name, childAbs, virtualPath);
          results.push(entry);
        }
        if (d.isDirectory()) await walk(childVirtual, childAbs, depth + 1);
      }
    }

    if (scope) {
      const { absolutePath } = resolveExistingSafePath(scope);
      await walk(scope, absolutePath, 0);
    } else {
      for (const share of SHARED_DIRECTORIES) {
        if (fs.existsSync(share.path)) await walk(share.id, share.path, 0);
      }
    }

    res.json({ results, truncated: results.length >= MAX_RESULTS });
  } catch (err) {
    next(err);
  }
}

/** POST /api/folders — { path: "<shareId>/<relative-parent>", name } */
async function createFolder(req, res, next) {
  try {
    const { path: virtualParent, name } = req.body;
    if (!name || /[\\/]/.test(name)) {
      return res.status(400).json({ error: 'Invalid folder name.' });
    }
    const { absolutePath, share } = resolveSafePath(`${virtualParent}/${name}`);
    assertWritable(share);
    if (fs.existsSync(absolutePath)) {
      return res.status(409).json({ error: 'A file or folder with that name already exists.' });
    }
    await fsp.mkdir(absolutePath, { recursive: false });
    res.status(201).json({ ok: true, virtualPath: `${virtualParent}/${name}` });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/files/:path(*) */
async function deleteFile(req, res, next) {
  try {
    const virtualPath = req.params[0];
    const { absolutePath, share } = resolveExistingSafePath(virtualPath);
    assertWritable(share);
    const stat = await fsp.stat(absolutePath);
    if (stat.isDirectory()) {
      await fsp.rm(absolutePath, { recursive: true, force: true });
    } else {
      await fsp.unlink(absolutePath);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/files/:path(*) — rename/move within the same share. { newName } */
async function renameFile(req, res, next) {
  try {
    const virtualPath = req.params[0];
    const { newName } = req.body;
    if (!newName || /[\\/]/.test(newName)) {
      return res.status(400).json({ error: 'Invalid new name.' });
    }
    const { absolutePath, share } = resolveExistingSafePath(virtualPath);
    assertWritable(share);
    const targetVirtual = virtualPath.split('/').slice(0, -1).concat(newName).join('/');
    const { absolutePath: targetAbsolute } = resolveSafePath(targetVirtual);
    if (fs.existsSync(targetAbsolute)) {
      return res.status(409).json({ error: 'A file or folder with that name already exists.' });
    }
    await fsp.rename(absolutePath, targetAbsolute);
    res.json({ ok: true, virtualPath: targetVirtual });
  } catch (err) {
    next(err);
  }
}

/** GET /api/media?category=video — recursively collect files of one category across all shares. */
async function browseByCategory(req, res, next) {
  try {
    const category = req.query.category;
    if (!category) return res.status(400).json({ error: 'category is required.' });

    const MAX_RESULTS = 500;
    const MAX_DEPTH = 10;
    const results = [];

    async function walk(virtualPath, absPath, depth) {
      if (results.length >= MAX_RESULTS || depth > MAX_DEPTH) return;
      let dirents;
      try {
        dirents = await fsp.readdir(absPath, { withFileTypes: true });
      } catch {
        return;
      }
      for (const d of dirents) {
        if (results.length >= MAX_RESULTS) return;
        if (d.name.startsWith('.')) continue;
        const childVirtual = virtualPath ? `${virtualPath}/${d.name}` : d.name;
        const childAbs = path.join(absPath, d.name);
        if (d.isDirectory()) {
          await walk(childVirtual, childAbs, depth + 1);
        } else if (getFileCategory(d.name) === category) {
          const entry = await statToEntry(d.name, childAbs, virtualPath);
          results.push(entry);
        }
      }
    }

    for (const share of SHARED_DIRECTORIES) {
      if (fs.existsSync(share.path)) await walk(share.id, share.path, 0);
    }

    res.json({ results, truncated: results.length >= MAX_RESULTS });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFiles,
  getFileDetails,
  downloadFile,
  searchFiles,
  browseByCategory,
  createFolder,
  deleteFile,
  renameFile,
};
