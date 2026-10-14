import { format, formatDistanceToNow } from 'date-fns';

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function formatDate(dateLike) {
  if (!dateLike) return '—';
  try {
    return format(new Date(dateLike), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatRelative(dateLike) {
  if (!dateLike) return '—';
  try {
    return formatDistanceToNow(new Date(dateLike), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, '0') : m;
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
