import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldAlert, Plus, Pencil, Trash2, Lock, CheckCircle2, AlertTriangle, FileJson, RefreshCw, Loader2, KeyRound,
} from 'lucide-react';
import FileIcon from '../components/file-manager/FileIcon';
import ShareEditor from '../components/admin/ShareEditor';
import { api } from '../services/api';
import { useServer } from '../contexts/ServerContext';

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card px-4 py-3">
      <p className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}

function ShareCard({ share, onEdit, onRemove, onToggleReadOnly }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="card flex flex-wrap items-center gap-3 p-3.5 sm:flex-nowrap"
    >
      <FileIcon name={share.name} isDirectory size={22} tile />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{share.name}</p>
          {share.readOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
              <Lock size={10} /> Read-only
            </span>
          )}
        </div>
        <p className="truncate font-mono text-[11px] text-text-muted" title={share.path}>{share.path}</p>
      </div>

      {share.exists ? (
        <span className="flex items-center gap-1 text-xs text-success" title="Available"><CheckCircle2 size={14} /> <span className="hidden sm:inline">Available</span></span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-danger" title="Folder missing or drive disconnected">
          <AlertTriangle size={14} /> <span className="hidden sm:inline">Not found</span>
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        {confirming ? (
          <>
            <span className="mr-1 hidden text-[11px] text-text-muted md:inline">Stop sharing? Files stay on your PC.</span>
            <button className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => setConfirming(false)}>Keep</button>
            <button className="btn bg-danger px-2.5 py-1.5 text-xs text-white hover:opacity-90" onClick={() => onRemove(share)}>Remove</button>
          </>
        ) : (
          <>
            <button className="btn-ghost p-2" title={share.readOnly ? 'Allow changes' : 'Make read-only'} onClick={() => onToggleReadOnly(share)}>
              <Lock size={15} className={share.readOnly ? 'text-amber-400' : ''} />
            </button>
            <button className="btn-ghost p-2" title="Edit" onClick={() => onEdit(share)}><Pencil size={15} /></button>
            <button className="btn-ghost p-2 hover:text-danger" title="Stop sharing" onClick={() => setConfirming(true)}><Trash2 size={15} /></button>
          </>
        )}
      </div>
    </motion.li>
  );
}

export default function Admin() {
  const { refresh } = useServer();
  const [access, setAccess] = useState(null);
  const [shares, setShares] = useState([]);
  const [file, setFile] = useState('');
  const [editor, setEditor] = useState(null); // null | { share?: ... }
  const [pinInput, setPinInput] = useState('');
  const [reloading, setReloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const status = await api.adminStatus();
      setAccess(status);
      if (status.allowed) {
        const data = await api.adminShares();
        setShares(data.shares);
        setFile(data.file);
      }
    } catch (err) {
      setAccess({ allowed: false, error: err.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function applySaved(list, message) {
    setShares(list);
    setEditor(null);
    toast.success(message);
    refresh();
  }

  async function removeShare(share) {
    try {
      const data = await api.adminDeleteShare(share.id);
      setShares(data.shares);
      toast.success(`Stopped sharing "${share.name}"`);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleReadOnly(share) {
    try {
      const data = await api.adminUpdateShare(share.id, { readOnly: !share.readOnly });
      setShares(data.shares);
      toast.success(share.readOnly ? 'Changes allowed' : 'Now read-only');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function reloadFile() {
    setReloading(true);
    try {
      const data = await api.adminReloadShares();
      setShares(data.shares);
      toast.success(`Reloaded ${data.count} shared folder${data.count === 1 ? '' : 's'} from shares.json`);
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReloading(false);
    }
  }

  function savePin(e) {
    e.preventDefault();
    api.setAdminPin(pinInput.trim());
    load();
  }

  if (!access) {
    return <div className="flex items-center justify-center gap-2 p-16 text-sm text-text-muted"><Loader2 size={16} className="animate-spin" /> Checking access…</div>;
  }

  if (!access.allowed) {
    return (
      <div className="mx-auto max-w-lg p-6 md:p-10">
        <div className="card p-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger"><ShieldAlert size={28} /></span>
          <h1 className="text-lg font-semibold">Admin is locked on this device</h1>
          <p className="mt-2 text-sm text-text-muted">
            Choosing which folders are shared is only allowed on the PC that runs Hoster
            {access.pinAvailable ? ', or from another device with the admin PIN.' : '.'}
          </p>
          {access.error && <p className="mt-2 text-xs text-danger">{access.error}</p>}
          {access.pinAvailable ? (
            <form onSubmit={savePin} className="mt-5 flex gap-2">
              <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Admin PIN" className="input flex-1" />
              <button className="btn-primary" type="submit"><KeyRound size={15} /> Unlock</button>
            </form>
          ) : (
            <p className="mt-4 rounded-lg bg-surface-alt p-3 text-xs text-text-muted">
              On the host PC open <span className="font-mono text-accent">{`${window.location.protocol}//localhost:${window.location.port}/admin`}</span>.
              To allow other devices, start the server with <span className="font-mono text-accent">HOSTER_ADMIN_PIN</span> set.
            </p>
          )}
        </div>
      </div>
    );
  }

  const available = shares.filter((s) => s.exists).length;
  const readOnlyCount = shares.filter((s) => s.readOnly).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent"><ShieldCheck size={22} /></span>
        <div className="flex-1">
          <h1 className="text-xl font-semibold leading-tight">Admin</h1>
          <p className="text-sm text-text-muted">Choose which folders on this PC Hoster shares.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditor({})}><Plus size={16} /> Add folder</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Shared" value={shares.length} />
        <Stat label="Available" value={available} tone="text-success" />
        <Stat label="Read-only" value={readOnlyCount} tone={readOnlyCount ? 'text-amber-400' : ''} />
      </div>

      {shares.length ? (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {shares.map((s) => (
              <ShareCard key={s.id} share={s} onEdit={(sh) => setEditor({ share: sh })} onRemove={removeShare} onToggleReadOnly={toggleReadOnly} />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <FileIcon isDirectory size={30} tile />
          <p className="font-medium">Nothing is shared yet</p>
          <p className="text-sm text-text-muted">Add a drive or folder to start browsing it from your phone.</p>
          <button className="btn-primary" onClick={() => setEditor({})}><Plus size={16} /> Add folder</button>
        </div>
      )}

      <div className="card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <FileJson size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Saved in a JSON file</p>
            <p className="break-all font-mono text-[11px] text-text-muted">{file}</p>
            <p className="mt-1 text-xs text-text-muted">Changes here are saved instantly. You can also edit that file by hand, then reload it.</p>
          </div>
          <button className="btn-secondary shrink-0" onClick={reloadFile} disabled={reloading}>
            <RefreshCw size={14} className={reloading ? 'animate-spin' : ''} /> Reload
          </button>
        </div>
      </div>

      <AnimatePresence>
        {editor && <ShareEditor key="editor" share={editor.share} onClose={() => setEditor(null)} onSaved={applySaved} />}
      </AnimatePresence>
    </div>
  );
}
