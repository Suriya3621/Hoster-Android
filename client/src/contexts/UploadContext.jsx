import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useRealtime } from './RealtimeContext';

const UploadContext = createContext(null);
const CONCURRENCY = 2;
const AUTO_DISMISS_MS = 8000;

function newId() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Tracks every transfer in one list:
 *  - uploads started on THIS device (precise progress from the browser), and
 *  - uploads happening on OTHER devices (progress pushed live by the server).
 * The Upload Center UI renders this list.
 */
export function UploadProvider({ children }) {
  const { socket } = useRealtime();
  const [items, setItems] = useState([]);
  const localIds = useRef(new Set());
  const aborters = useRef(new Map());
  const timers = useRef(new Map());

  const patch = useCallback((id, changes) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id) => {
      clearTimeout(timers.current.get(id));
      timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
    },
    [dismiss]
  );

  const announceDone = useCallback(() => {
    window.dispatchEvent(new CustomEvent('hoster:upload-done'));
  }, []);

  /** Upload files into a shared folder. Resolves when every file has finished (or failed). */
  const startUploads = useCallback(
    (virtualPath, files) => {
      const list = Array.from(files);
      const jobs = list.map((file) => {
        const id = newId();
        localIds.current.add(id);
        return { id, file };
      });

      setItems((prev) => [
        ...jobs.map(({ id, file }) => ({
          id, name: file.name, loaded: 0, total: file.size, percent: 0, speed: 0, etaSeconds: null,
          status: 'queued', local: true, device: api.getDeviceName(), startedAt: Date.now(), message: '',
        })),
        ...prev,
      ]);

      let next = 0;
      let succeeded = 0;

      async function runOne({ id, file }) {
        let last = { t: Date.now(), loaded: 0 };
        let speed = 0;
        const { promise, abort } = api.uploadFile(virtualPath, file, {
          id,
          onProgress: (loaded, total) => {
            const now = Date.now();
            if (now - last.t < 120 && loaded < total) return; // keep React updates light
            const dt = (now - last.t) / 1000;
            const instant = dt > 0 ? (loaded - last.loaded) / dt : 0;
            speed = speed ? speed * 0.7 + instant * 0.3 : instant;
            last = { t: now, loaded };
            patch(id, {
              status: 'uploading', loaded, total,
              percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
              speed, etaSeconds: speed > 0 ? Math.max(0, Math.round((total - loaded) / speed)) : null,
            });
          },
        });
        aborters.current.set(id, abort);
        patch(id, { status: 'uploading' });
        try {
          await promise;
          succeeded += 1;
          patch(id, { status: 'done', percent: 100, loaded: file.size, speed: 0, etaSeconds: 0 });
          scheduleDismiss(id);
        } catch (err) {
          patch(id, {
            status: err.cancelled ? 'cancelled' : 'error',
            message: err.cancelled ? 'Cancelled' : err.message,
          });
          scheduleDismiss(id);
        } finally {
          aborters.current.delete(id);
        }
      }

      async function worker() {
        while (next < jobs.length) {
          const job = jobs[next];
          next += 1;
          // eslint-disable-next-line no-await-in-loop
          await runOne(job);
        }
      }

      return Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker)).then(() => {
        if (succeeded) announceDone();
        return { total: jobs.length, succeeded };
      });
    },
    [patch, scheduleDismiss, announceDone]
  );

  const cancel = useCallback((id) => aborters.current.get(id)?.(), []);
  const clearFinished = useCallback(() => {
    setItems((prev) => prev.filter((it) => it.status === 'uploading' || it.status === 'queued'));
  }, []);

  // Uploads from OTHER devices, streamed live from the server.
  useEffect(() => {
    if (!socket) return undefined;
    const upsert = (snap) => {
      if (localIds.current.has(snap.id)) return; // we already track our own precisely
      setItems((prev) => {
        const exists = prev.some((it) => it.id === snap.id);
        const merged = { ...snap, local: false };
        return exists ? prev.map((it) => (it.id === snap.id ? { ...it, ...merged } : it)) : [merged, ...prev];
      });
    };
    const onDone = (snap) => {
      if (localIds.current.has(snap.id)) return;
      upsert(snap);
      scheduleDismiss(snap.id);
      announceDone();
    };
    const onError = (snap) => {
      if (localIds.current.has(snap.id)) return;
      upsert(snap);
      scheduleDismiss(snap.id);
    };
    socket.on('upload:start', upsert);
    socket.on('upload:progress', upsert);
    socket.on('upload:done', onDone);
    socket.on('upload:error', onError);
    return () => {
      socket.off('upload:start', upsert);
      socket.off('upload:progress', upsert);
      socket.off('upload:done', onDone);
      socket.off('upload:error', onError);
    };
  }, [socket, scheduleDismiss, announceDone]);

  return (
    <UploadContext.Provider value={{ items, startUploads, cancel, dismiss, clearFinished }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads must be used within UploadProvider');
  return ctx;
}
