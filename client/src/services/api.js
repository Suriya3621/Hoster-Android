const PIN_KEY = 'hoster:pin';

// In dev, Vite proxies /api to the Express server (see vite.config.js), so a
// relative base works both on localhost and when a phone hits the LAN IP.
const BASE = '/api';

function getPin() {
  return localStorage.getItem(PIN_KEY) || '';
}
function setPin(pin) {
  if (pin) localStorage.setItem(PIN_KEY, pin);
  else localStorage.removeItem(PIN_KEY);
}
function hasPin() {
  return Boolean(getPin());
}

// Admin panel PIN (only needed when opening Admin from a different device than the host PC).
const ADMIN_PIN_KEY = 'hoster:adminPin';
const getAdminPin = () => localStorage.getItem(ADMIN_PIN_KEY) || '';
const setAdminPin = (pin) => (pin ? localStorage.setItem(ADMIN_PIN_KEY, pin) : localStorage.removeItem(ADMIN_PIN_KEY));

// A friendly name for this browser, shown to other devices ("Sam's Phone uploading…").
const DEVICE_KEY = 'hoster:deviceName';
function guessDeviceName() {
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android Phone' : 'Android Tablet';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux PC';
  return 'Browser';
}
const getDeviceName = () => localStorage.getItem(DEVICE_KEY) || guessDeviceName();
const setDeviceName = (n) => (n ? localStorage.setItem(DEVICE_KEY, n.slice(0, 40)) : localStorage.removeItem(DEVICE_KEY));

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const pin = getPin();
  if (pin) headers['X-Hoster-Pin'] = pin;
  const adminPin = getAdminPin();
  if (adminPin) headers['X-Admin-Pin'] = adminPin;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      /* ignore parse errors */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const api = {
  setPin,
  getPin,
  hasPin,
  getAdminPin,
  setAdminPin,
  getDeviceName,
  setDeviceName,

  // --- Notes ---
  listNotes: ({ q = '', tag = '' } = {}) =>
    request(`/notes?q=${encodeURIComponent(q)}&tag=${encodeURIComponent(tag)}`),
  createNote: (note) => request('/notes', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(note) }),
  updateNote: (id, patch) =>
    request(`/notes/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(patch) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // --- Admin ---
  adminStatus: () => request('/admin/status'),
  adminShares: () => request('/admin/shares'),
  adminAddShare: (share) =>
    request('/admin/shares', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(share) }),
  adminUpdateShare: (id, patch) =>
    request(`/admin/shares/${encodeURIComponent(id)}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(patch) }),
  adminDeleteShare: (id) => request(`/admin/shares/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  adminReloadShares: () => request('/admin/shares/reload', { method: 'POST' }),
  adminBrowse: (path = '') => request(`/admin/browse?path=${encodeURIComponent(path)}`),

  /**
   * Upload ONE file with live progress. Returns { promise, abort }.
   * The X-Upload-* headers let the server broadcast this transfer to every
   * other connected device in real time.
   */
  uploadFile: (parentVirtualPath, file, { id, onProgress } = {}) => {
    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('path', parentVirtualPath);
      form.append('files', file);
      xhr.open('POST', `${BASE}/upload`);
      const pin = getPin();
      if (pin) xhr.setRequestHeader('X-Hoster-Pin', pin);
      if (id) xhr.setRequestHeader('X-Upload-Id', id);
      xhr.setRequestHeader('X-Upload-Name', encodeURIComponent(file.name));
      xhr.setRequestHeader('X-Device-Name', encodeURIComponent(getDeviceName()));
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve(JSON.parse(xhr.responseText));
        let message = `Upload failed (${xhr.status})`;
        try {
          message = JSON.parse(xhr.responseText).error || message;
        } catch {
          /* keep default */
        }
        reject(Object.assign(new Error(message), { status: xhr.status }));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(Object.assign(new Error('Upload cancelled'), { cancelled: true }));
      xhr.send(form);
    });
    return { promise, abort: () => xhr.abort() };
  },

  getStatus: () => request('/status'),
  getNetwork: () => request('/network'),
  getShares: () => request('/shares'),

  listFiles: (virtualPath = '') =>
    request(`/files?path=${encodeURIComponent(virtualPath)}`),

  getFileDetails: (virtualPath) =>
    request(`/files/details?path=${encodeURIComponent(virtualPath)}`),

  search: (query, scope = '') =>
    request(`/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(scope)}`),

  browseByCategory: (category) => request(`/media?category=${encodeURIComponent(category)}`),

  createFolder: (parentVirtualPath, name) =>
    request('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: parentVirtualPath, name }),
    }),

  deleteFile: (virtualPath) =>
    request(`/files/${encodeURIComponent(virtualPath).replace(/%2F/g, '/')}`, {
      method: 'DELETE',
    }),

  renameFile: (virtualPath, newName) =>
    request(`/files/${encodeURIComponent(virtualPath).replace(/%2F/g, '/')}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    }),

  upload: async (parentVirtualPath, files, onProgress) => {
    const form = new FormData();
    form.append('path', parentVirtualPath);
    files.forEach((f) => form.append('files', f));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/upload`);
      const pin = getPin();
      if (pin) xhr.setRequestHeader('X-Hoster-Pin', pin);
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error('Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(form);
    });
  },

  // URL builders — used directly by <video>/<img>/<audio> tags and download links.
  // Every path segment is percent-encoded individually (preserving the "/"
  // separators) so filenames with spaces, "#", "%", "&", "+", etc. — very
  // common in real movie/show filenames — don't corrupt the URL. This was
  // previously missing here (even though other endpoints used
  // encodeURIComponent), which is why some files with special characters in
  // their names would silently fail to stream.
  streamUrl: (virtualPath) => {
    const pin = getPin();
    return `${BASE}/stream/${encodeVirtualPath(virtualPath)}${pin ? `?pin=${encodeURIComponent(pin)}` : ''}`;
  },
  downloadUrl: (virtualPath) => {
    const pin = getPin();
    return `${BASE}/download/${encodeVirtualPath(virtualPath)}${pin ? `?pin=${encodeURIComponent(pin)}` : ''}`;
  },

  // Absolute version of streamUrl, for cases where a relative "/api/..." URL
  // won't work — e.g. copying a link into VLC's "Open Network Stream", or
  // handing it to the OS to open in another app. Same-origin relative paths
  // are fine for the <video>/<img> tags elsewhere in the app.
  absoluteStreamUrl: (virtualPath) => `${window.location.origin}${api.streamUrl(virtualPath)}`,
};

function encodeVirtualPath(virtualPath) {
  return String(virtualPath)
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}
