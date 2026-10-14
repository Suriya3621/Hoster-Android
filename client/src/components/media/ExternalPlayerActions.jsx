import { useState } from 'react';
import { Download, ExternalLink, Copy, Check } from 'lucide-react';
import { api } from '../../services/api';

/**
 * A set of actions that reliably get a video playing somewhere, even when
 * the in-app <video> element can't handle it (unsupported container like
 * MKV/AVI, or a codec inside an mp4 the browser can't decode):
 *
 *  - Open in new tab: hands the raw stream URL to the browser/OS directly.
 *    On mobile this is what lets iOS/Android offer their own native
 *    "Open with…" handling for a file the in-page <video> tag rejected.
 *  - Copy stream link: for pasting into VLC's "Open Network Stream" (or any
 *    other player) — VLC in particular will play almost anything (MKV,
 *    HEVC, etc.) once given this URL, and it still benefits from the
 *    server's Range-request support for seeking.
 *  - Download: the guaranteed-to-work fallback.
 */
export default function ExternalPlayerActions({ entry, compact }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(api.absoluteStreamUrl(entry.virtualPath));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (e.g. non-HTTPS LAN context on some
      // browsers); the link is still visible/selectable as plain text below.
    }
  }

  return (
    <div className={compact ? 'flex flex-wrap items-center justify-center gap-2' : 'flex flex-col gap-2 w-full max-w-xs'}>
      <a
        href={api.streamUrl(entry.virtualPath)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary justify-center"
      >
        <ExternalLink size={16} /> Open with another player
      </a>
      <div className="flex gap-2">
        <button onClick={copyLink} className="btn-secondary flex-1 justify-center">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy stream link'}
        </button>
        <a href={api.downloadUrl(entry.virtualPath)} className="btn-secondary flex-1 justify-center">
          <Download size={16} /> Download
        </a>
      </div>
      <p className="text-xs text-text-muted text-center">
        "Open with another player" hands this off to your device — on mobile it
        offers your installed video apps; on desktop it opens in a new tab. For
        anything that still won't play (e.g. some MKV/HEVC files), paste the
        copied link into VLC via <span className="font-medium">Open Network Stream</span>.
      </p>
    </div>
  );
}
