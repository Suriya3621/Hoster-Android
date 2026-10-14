import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ChevronDown, ChevronUp, AlertTriangle, UploadCloud, Radio, Trash2 } from 'lucide-react';
import FileIcon from '../file-manager/FileIcon';
import { formatBytes } from '../../utils/formatters';
import { useUploads } from '../../contexts/UploadContext';

const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;

function formatEta(seconds) {
  if (seconds == null) return '';
  if (seconds < 60) return `${seconds}s left`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${seconds % 60}s left`;
  return `${Math.floor(m / 60)}h ${m % 60}m left`;
}

/** Circular progress that wraps the file icon; turns into a check / warning when finished. */
function StatusRing({ item }) {
  const done = item.status === 'done';
  const failed = item.status === 'error' || item.status === 'cancelled';
  const stroke = done ? 'var(--success)' : failed ? 'var(--danger)' : 'var(--accent)';
  const offset = RING_C * (1 - (done ? 100 : item.percent) / 100);

  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
        <circle cx="20" cy="20" r={RING_R} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={RING_R} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={RING_C} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span key="done" initial={{ scale: 0.3, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }} className="text-success">
              <Check size={20} strokeWidth={3} />
            </motion.span>
          ) : failed ? (
            <motion.span key="fail" initial={{ x: -4 }} animate={{ x: [0, -4, 4, -3, 3, 0] }}
              transition={{ duration: 0.4 }} className="text-danger">
              <AlertTriangle size={18} />
            </motion.span>
          ) : (
            <motion.span key="icon" className="upload-icon-pulse">
              <FileIcon name={item.name} size={17} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {done && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-success"
        />
      )}
    </div>
  );
}

function UploadCard({ item, onCancel, onDismiss }) {
  const active = item.status === 'uploading' || item.status === 'queued';
  const fillClass = item.status === 'done' ? 'is-done' : item.status === 'error' || item.status === 'cancelled' ? 'is-failed' : '';

  let detail;
  if (item.status === 'queued') detail = 'Waiting in queue…';
  else if (item.status === 'done') detail = `${formatBytes(item.total)} · Complete`;
  else if (item.status === 'error' || item.status === 'cancelled') detail = item.message || 'Failed';
  else {
    detail = [
      `${formatBytes(item.loaded)} of ${formatBytes(item.total)}`,
      item.speed ? `${formatBytes(item.speed)}/s` : null,
      formatEta(item.etaSeconds),
    ].filter(Boolean).join(' · ');
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="flex items-start gap-3 px-3 py-3"
    >
      <StatusRing item={item} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{item.name}</p>
          {!item.local && active && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              <Radio size={10} className="live-dot" /> Live
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-text-muted">
          {!item.local && <span className="text-text-muted">From {item.device} · </span>}
          {detail}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className={`upload-fill h-full rounded-full ${fillClass} ${active ? 'is-active' : ''}`}
            style={{ width: `${item.status === 'done' ? 100 : item.percent}%` }}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs font-semibold tabular-nums">
          {item.status === 'done' ? '100%' : item.status === 'queued' ? '—' : `${item.percent}%`}
        </span>
        {item.local && active ? (
          <button onClick={() => onCancel(item.id)} className="rounded p-1 text-text-muted hover:bg-surface hover:text-danger" title="Cancel upload">
            <X size={14} />
          </button>
        ) : !active ? (
          <button onClick={() => onDismiss(item.id)} className="rounded p-1 text-text-muted hover:bg-surface hover:text-text" title="Dismiss">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </motion.li>
  );
}

/** Floating panel: every upload on this device and (live) on other devices. */
export default function UploadCenter() {
  const { items, cancel, dismiss, clearFinished } = useUploads();
  const [collapsed, setCollapsed] = useState(false);

  const summary = useMemo(() => {
    const active = items.filter((i) => i.status === 'uploading' || i.status === 'queued');
    const counted = active.length ? active : items;
    const loaded = counted.reduce((n, i) => n + (i.status === 'done' ? i.total : i.loaded), 0);
    const total = counted.reduce((n, i) => n + i.total, 0);
    const speed = active.reduce((n, i) => n + (i.speed || 0), 0);
    return {
      activeCount: active.length,
      percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
      speed,
    };
  }, [items]);

  if (!items.length) return null;
  const busy = summary.activeCount > 0;
  const failed = items.filter((i) => i.status === 'error').length;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-20 z-[60] md:inset-x-auto md:bottom-5 md:right-5 md:w-[390px]">
      <motion.div
        layout
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className={`pointer-events-auto overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-2xl ${busy ? 'upload-panel-active' : ''}`}
      >
        <button onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent ${busy ? 'upload-bounce' : ''}`}>
            {busy ? <UploadCloud size={18} /> : <Check size={18} strokeWidth={3} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">
              {busy
                ? `Uploading ${summary.activeCount} file${summary.activeCount > 1 ? 's' : ''}`
                : failed ? 'Some uploads failed' : 'All uploads complete'}
            </p>
            <p className="text-[11px] text-text-muted">
              {busy ? `${summary.percent}%${summary.speed ? ` · ${formatBytes(summary.speed)}/s` : ''}` : `${items.length} item${items.length > 1 ? 's' : ''}`}
            </p>
          </div>
          {collapsed ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
        </button>
        {busy && (
          <div className="h-1 bg-surface">
            <div className="upload-fill is-active h-full" style={{ width: `${summary.percent}%` }} />
          </div>
        )}

        {!collapsed && (
          <>
            <ul className="max-h-[46vh] divide-y divide-border overflow-y-auto border-t border-border">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <UploadCard key={item.id} item={item} onCancel={cancel} onDismiss={dismiss} />
                ))}
              </AnimatePresence>
            </ul>
            {!busy && (
              <div className="flex justify-end border-t border-border px-3 py-2">
                <button onClick={clearFinished} className="btn-ghost px-2 py-1 text-xs">
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
