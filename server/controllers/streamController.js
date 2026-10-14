const fs = require('fs');
const fsp = fs.promises;
const { resolveExistingSafePath } = require('../utils/pathSafety');
const { getMimeType } = require('../utils/fileCategory');

/**
 * GET /api/stream/:path(*)
 *
 * Streams a file from disk using Node's fs.createReadStream, honoring
 * HTTP Range headers so large media (a 10GB movie, say) never has to be
 * fully read into memory and the browser can seek freely.
 */
async function streamFile(req, res, next) {
  try {
    const virtualPath = req.params[0];
    const { absolutePath } = resolveExistingSafePath(virtualPath);
    const stat = await fsp.stat(absolutePath);

    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Cannot stream a folder.' });
    }

    const fileSize = stat.size;
    const mimeType = getMimeType(absolutePath);
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    // Media files are safe to cache aggressively client-side since the local
    // library rarely mutates a file in place.
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (!range) {
      // No range requested — send the whole thing, still via a stream.
      res.setHeader('Content-Length', fileSize);
      const stream = fs.createReadStream(absolutePath);
      stream.on('error', (err) => next(err));
      return stream.pipe(res);
    }

    // Parse "bytes=start-end"
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }

    let [, startStr, endStr] = match;
    let start = startStr ? parseInt(startStr, 10) : undefined;
    let end = endStr ? parseInt(endStr, 10) : undefined;

    if (start === undefined) {
      // suffix range: "bytes=-500" -> last 500 bytes
      const suffixLength = end;
      start = Math.max(fileSize - suffixLength, 0);
      end = fileSize - 1;
    } else if (end === undefined) {
      // Open-ended range: "bytes=1000-" means "from 1000 to the END of the
      // file" per RFC 7233 — NOT an arbitrary small window. This used to be
      // capped to a 5MB chunk here, which is what broke playback for many
      // mp4/mkv files (especially on mobile): players that issue an
      // open-ended range for the remainder of the file got a truncated
      // response and either stalled or aborted instead of continuing to
      // stream. fs.createReadStream still reads lazily off disk, so serving
      // all the way to EOF here is just as memory-safe as chunking was.
      end = fileSize - 1;
    }

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }
    end = Math.min(end, fileSize - 1);

    const chunkSize = end - start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);

    const stream = fs.createReadStream(absolutePath, { start, end });
    stream.on('error', (err) => next(err));
    req.on('close', () => stream.destroy()); // stop reading if the client disconnects/seeks away
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { streamFile };
