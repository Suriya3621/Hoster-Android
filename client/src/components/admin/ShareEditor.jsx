import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderSearch, Loader2, Lock, X } from 'lucide-react';
import FolderPicker from './FolderPicker';
import { api } from '../../services/api';

function folderNameOf(p) {
  const clean = String(p || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const last = clean.split('/').pop() || '';
  return last.endsWith(':') ? `${last} Drive` : last;
}

/** Add or edit one shared folder. */
export default function ShareEditor({ share, onClose, onSaved }) {
  const editing = Boolean(share);
  const [name, setName] = useState(share?.name || '');
  const [path, setPath] = useState(share?.path || '');
  const [readOnly, setReadOnly] = useState(Boolean(share?.readOnly));
  const [picking, setPicking] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { name: name.trim(), path: path.trim(), readOnly };
      const result = editing ? await api.adminUpdateShare(share.id, body) : await api.adminAddShare(body);
      onSaved(result.shares, editing ? 'Shared folder updated' : 'Shared folder added');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className="flex h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface-raised shadow-2xl md:h-[640px] md:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{editing ? 'Edit shared folder' : 'Add a shared folder'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-alt hover:text-text"><X size={18} /></button>
        </div>

        {picking ? (
          <div className="min-h-0 flex-1">
            <FolderPicker
              initialPath={path}
              onCancel={() => (editing || path ? setPicking(false) : onClose())}
              onSelect={(p) => {
                setPath(p);
                if (!name.trim()) setName(folderNameOf(p));
                setPicking(false);
              }}
            />
          </div>
        ) : (
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text-muted">Folder on this PC</span>
                <div className="flex gap-2">
                  <input value={path} onChange={(e) => setPath(e.target.value)} className="input min-w-0 flex-1 font-mono text-xs" placeholder="E:/Movies" spellCheck={false} />
                  <button type="button" className="btn-secondary" onClick={() => setPicking(true)}>
                    <FolderSearch size={16} /> Browse
                  </button>
                </div>
                <span className="mt-1.5 block text-[11px] text-text-muted">Use forward slashes on Windows, like E:/Movies.</span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text-muted">Name shown in Hoster</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="Movies" maxLength={60} />
              </label>

              <button
                type="button"
                onClick={() => setReadOnly((r) => !r)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-alt p-3.5 text-left"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${readOnly ? 'bg-amber-400/15 text-amber-400' : 'bg-surface text-text-muted'}`}>
                  <Lock size={16} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">Read-only</span>
                  <span className="block text-[11px] text-text-muted">Devices can view and stream, but can't upload, rename or delete.</span>
                </span>
                <span className={`relative h-6 w-11 rounded-full transition-colors ${readOnly ? 'bg-accent' : 'bg-border'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${readOnly ? 'left-[22px]' : 'left-0.5'}`} />
                </span>
              </button>

              {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving || !name.trim() || !path.trim()}>
                {saving && <Loader2 size={16} className="animate-spin" />} {editing ? 'Save changes' : 'Add folder'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
