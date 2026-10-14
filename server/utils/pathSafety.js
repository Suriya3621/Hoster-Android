const path = require('path');
const fs = require('fs');
const { getShareById } = require('../config/shares');

class UnsafePathError extends Error {
  constructor(message = 'Access denied: path is outside the shared directory.') {
    super(message);
    this.status = 403;
  }
}
class ShareNotFoundError extends Error {
  constructor(message = 'Unknown share.') {
    super(message);
    this.status = 404;
  }
}
class ReadOnlyError extends Error {
  constructor(message = 'This shared folder is read-only.') {
    super(message);
    this.status = 403;
  }
}
class NotFoundError extends Error {
  constructor(message = 'File or folder not found.') {
    super(message);
    this.status = 404;
  }
}

/**
 * Resolve a client-supplied "virtualPath" like "movies/Action/film.mp4"
 * into a real, validated, absolute filesystem path.
 *
 * virtualPath format: "<shareId>/<relative/sub/path>"
 *
 * This is the ONLY function in the app that is allowed to turn user input
 * into a real fs path. Every route must go through it.
 */
function resolveSafePath(virtualPath) {
  if (typeof virtualPath !== 'string') throw new UnsafePathError('Invalid path.');

  // Normalize slashes, strip leading/trailing slashes.
  const cleaned = virtualPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  const [shareId, ...rest] = cleaned.split('/').filter(Boolean);

  const share = getShareById(shareId);
  if (!share) throw new ShareNotFoundError(`Share "${shareId}" does not exist.`);

  const relative = rest.join('/');

  // Reject any segment that is '..' or contains null bytes before we even touch fs.
  const segments = relative.split('/');
  for (const seg of segments) {
    if (seg === '..' || seg.includes('\0')) {
      throw new UnsafePathError();
    }
  }

  const candidate = path.resolve(share.path, relative);
  const shareRoot = path.resolve(share.path);

  // The definitive check: resolved path must be the share root or nested inside it.
  const isInside =
    candidate === shareRoot || candidate.startsWith(shareRoot + path.sep);
  if (!isInside) throw new UnsafePathError();

  return { absolutePath: candidate, share, relative };
}

/** Like resolveSafePath, but also verifies the target exists on disk. */
function resolveExistingSafePath(virtualPath) {
  const result = resolveSafePath(virtualPath);
  if (!fs.existsSync(result.absolutePath)) throw new NotFoundError();

  // Defend against symlink escapes: resolve realpath and re-check containment.
  const real = fs.realpathSync(result.absolutePath);
  const shareRealRoot = fs.realpathSync(result.share.path);
  const isInside = real === shareRealRoot || real.startsWith(shareRealRoot + path.sep);
  if (!isInside) throw new UnsafePathError();

  return result;
}

/** Throws if the share was marked read-only in the Admin panel. */
function assertWritable(share) {
  if (share && share.readOnly) throw new ReadOnlyError(`"${share.name}" is read-only.`);
}

module.exports = {
  assertWritable,
  ReadOnlyError,
  resolveSafePath,
  resolveExistingSafePath,
  UnsafePathError,
  ShareNotFoundError,
  NotFoundError,
};
