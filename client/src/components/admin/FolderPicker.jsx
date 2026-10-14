import { useCallback, useEffect, useState } from 'react';
import { ArrowUp, Check, HardDrive, Loader2, Folder, Home, CornerDownLeft } from 'lucide-react';
import { api } from '../../services/api';

/** Browse folders on the host PC and pick one to share. */
export default function FolderPicker({ initialPath = '', onSelect, onCancel }) {
  const [state, setState] = useState({ path: '', parent: null, entries: [], places: [] });
  const [typed, setTyped] = useState(initialPath);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const go = useCallback(async (path) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminBrowse(path);
      setState(data);
      setTyped(data.path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    go(initialPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atRoot = state.path === '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(typed.trim());
        }}
        className="flex gap-2 border-b border-border p-3"
      >
        <button
          type="button"
          className="btn-secondary px-2.5"
          disabled={atRoot || state.parent === null}
          onClick={() => go(state.parent || '')}
          title="Up one level"
        >
          <ArrowUp size={16} />
        </button>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={atRoot ? 'Pick a drive below, or type a path' : 'Type a folder path'}
          className="input min-w-0 flex-1 font-mono text-xs"
          spellCheck={false}
        />
        <button type="submit" className="btn-secondary px-2.5" title="Go">
          <CornerDownLeft size={16} />
        </button>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted">
            <Loader2 size={16} className="animate-spin" /> Reading folders…
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-danger">{error}</p>
        ) : (
          <>
            {atRoot && state.places?.length > 0 && (
              <div className="mb-3">
                <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Quick places</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {state.places.map((p) => (
                    <button key={p.path} onClick={() => go(p.path)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-alt">
                      <Home size={15} className="text-accent" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {atRoot && <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Drives</p>}
            {state.entries.map((e) => (
              <button key={e.path} onClick={() => go(e.path)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-alt">
                {e.kind === 'drive' ? <HardDrive size={17} className="text-sky-400" /> : <Folder size={17} className="text-accent" fill="currentColor" fillOpacity={0.25} />}
                <span className="truncate">{e.name}</span>
              </button>
            ))}
            {!state.entries.length && !atRoot && <p className="p-4 text-center text-sm text-text-muted">No sub-folders here.</p>}
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border p-3">
        <p className="min-w-0 truncate font-mono text-[11px] text-text-muted">{state.path || 'Choose a folder'}</p>
        <div className="flex shrink-0 gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" disabled={!state.path} onClick={() => onSelect(state.path)}>
            <Check size={16} /> Use this folder
          </button>
        </div>
      </div>
    </div>
  );
}
