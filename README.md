# Hoster — Your Local Files. Everywhere.

A local-network file hosting web app and media center. Run it on a laptop or
PC; browse and stream your real files from any phone, tablet, or other
computer on the same Wi-Fi/LAN. Nothing goes through the internet.

## Quick start

```bash
# from the repo root
npm run install:all   # installs server + client dependencies
npm run dev            # starts the API (port 4173) and the Vite dev server (port 5173)
```

Then open the printed **Network** address (e.g. `http://192.168.1.10:5173`)
on any device connected to the same Wi-Fi network. On the host machine itself
you can also use `http://localhost:5173`.

> The dev server binds to `0.0.0.0` (`vite --host`) and Express listens on
> `0.0.0.0` as well, so both are reachable from other devices out of the box.

## Configuring which folders are shared

Hoster only ever exposes folders you explicitly list. Edit
`server/config/shares.js`:

```js
const DEFAULT_SHARES = [
  { name: 'Movies', path: 'D:/Movies' },
  { name: 'Photos', path: 'D:/Photos' },
  { name: 'Music', path: 'D:/Music' },
  { name: 'Documents', path: 'D:/Documents' },
];
```

Or set the `HOSTER_SHARES` environment variable to a JSON array with the same
shape, without touching the code:

```bash
HOSTER_SHARES='[{"name":"Movies","path":"D:/Movies"}]' npm run server
```

Out of the box (before you edit anything) Hoster shares four empty
placeholder folders under `server/sample-data/` so the app runs immediately —
drop some files in there to try it out.

## Optional PIN protection

By default anyone on your network can open Hoster. To require a PIN, set
`HOSTER_PIN` before starting the server:

```bash
HOSTER_PIN=1234 npm run server
```

Visiting clients will be prompted for the PIN once; it's then remembered in
that browser's local storage.

## Architecture

```
hoster/
├── server/            Express API — the only thing with real filesystem access
│   ├── config/        Shared-directory + settings config
│   ├── controllers/   Route handlers (files, streaming, status, upload)
│   ├── middleware/     PIN auth, error handling
│   ├── routes/        /api routes
│   └── utils/         Path-safety, file categorization, network detection
└── client/            Vite + React + Tailwind SPA
    └── src/
        ├── components/  file-manager, media viewers, layout, settings, ui
        ├── pages/       Home, Files, Videos, Photos, Music, Documents, Settings
        ├── themes/      8 CSS-variable-based themes
        ├── contexts/    Theme + Server (status/network/shares) state
        ├── services/    api.js — the only place that calls the backend
        └── hooks/       useFiles, useLocalStorage
```

### Security

- **Path traversal protection** — every filesystem read goes through
  `server/utils/pathSafety.js`, which rejects `..` segments and verifies
  (via `fs.realpathSync`) that the resolved path — and any symlink target —
  is actually inside the configured share, not just string-prefixed by it.
- **Access control** — only folders listed in `SHARED_DIRECTORIES` are ever
  reachable; there is no "browse the whole disk" mode.
- **Optional PIN** — see above.

### Streaming

`server/controllers/streamController.js` implements real HTTP Range Request
support (`206 Partial Content`, `Content-Range`, `Accept-Ranges`), streaming
via `fs.createReadStream` so a multi-gigabyte file is never fully loaded into
memory and the browser can seek freely.

### Formats

The browser can natively play MP4/WebM/OGG video and MP3/WAV/OGG/M4A/FLAC
audio. Other containers (MKV, AVI, MOV, FLV) are detected and shown with a
clear "can't be played directly, download it" fallback rather than pretending
they work — the architecture (`isNativelyPlayableVideo` / the stream
controller) is set up so FFmpeg-based transcoding can be dropped in later
without touching the rest of the app.

## What's intentionally not built yet

Per the original brief, these are structured for but not implemented:
FFmpeg transcoding/thumbnails, WebSocket live updates, multi-user auth,
HTTPS, resumable downloads, and an Electron/Tauri desktop wrapper.


---

## New in this version

**Admin panel** (`/admin`) — add, rename, edit and remove shared folders from the browser, with a folder picker that
browses the PC's drives. Saved to `server/data/shares.json` (created from your old list on first run) and applied
instantly. Folders can be marked read-only. By default the panel only works on the host PC (localhost); set
`HOSTER_ADMIN_PIN` to allow it from another device. Edited the JSON by hand? Press **Reload** in the Admin panel.

**Live upload animations** — every upload shows a ring, striped progress bar, speed and ETA in the Upload Center
(bottom-right). Uploads from other devices appear **live** on every connected screen (Socket.IO).

**Notes** (`/notes`) — Markdown / plain text / code notes with colours, tags, pinning, search, templates, clickable
checklists, split live preview, autosave and instant sync between devices. Stored in `server/data/notes.json`.

**70+ file icons** — per-extension icons and colours (MP4, MKV, DOCX, XLSX, PY, JS, EXE, APK, ISO…), and special
folders (Movies, Music, Photos, Downloads…) get a badge.

Environment variables: `HOSTER_ADMIN_PIN`, `HOSTER_DATA_DIR` (where shares.json / notes.json live).

---

## Apps (Windows .exe / Android .apk)
See **BUILD.md**. Quick version: `npm run dist:win` builds the Windows installer; the **Build Android APK**
GitHub workflow (or Android Studio) builds the phone app from `mobile/`. Production mode: `npm start`.
