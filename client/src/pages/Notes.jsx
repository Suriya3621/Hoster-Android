import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { NotebookPen, Plus, Search, X, ChevronDown, Radio, Sparkles, FileText, ListChecks, Code2, BookOpen } from 'lucide-react';
import NoteList from '../components/notes/NoteList';
import NoteEditor from '../components/notes/NoteEditor';
import { TEMPLATES } from '../components/notes/noteMeta';
import { api } from '../services/api';
import { useRealtime } from '../contexts/RealtimeContext';

const TEMPLATE_ICONS = { blank: FileText, checklist: ListChecks, code: Code2, meeting: BookOpen };

function sortNotes(list) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function TemplateGrid({ onPick, compact }) {
  return (
    <div className={`grid gap-2 ${compact ? 'w-64 grid-cols-1' : 'w-full max-w-md grid-cols-2'}`}>
      {TEMPLATES.map((t) => {
        const Icon = TEMPLATE_ICONS[t.id];
        return (
          <button key={t.id} onClick={() => onPick(t)}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface-alt">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"><Icon size={17} /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{t.label}</span>
              <span className="block truncate text-[11px] text-text-muted">{t.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Notes() {
  const { socket, connected } = useRealtime();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [mobileEditor, setMobileEditor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const loadTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await api.listNotes();
      setNotes(sortNotes(data.notes));
    } catch (err) {
      toast.error(err.message || "Couldn't load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live sync: a note changed on another device → refresh (lightly debounced).
  useEffect(() => {
    if (!socket) return undefined;
    const onChanged = () => {
      clearTimeout(loadTimer.current);
      loadTimer.current = setTimeout(load, 250);
    };
    socket.on('notes:changed', onChanged);
    return () => {
      socket.off('notes:changed', onChanged);
      clearTimeout(loadTimer.current);
    };
  }, [socket, load]);

  // On desktop, open the newest note automatically.
  useEffect(() => {
    if (!activeId && notes.length && window.matchMedia('(min-width: 768px)').matches) setActiveId(notes[0].id);
    if (activeId && notes.length && !notes.some((n) => n.id === activeId)) {
      setActiveId(null);
      setMobileEditor(false);
    }
  }, [notes, activeId]);

  const allTags = useMemo(() => {
    const counts = new Map();
    notes.forEach((n) => (n.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [notes]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (tag && !(n.tags || []).includes(tag)) return false;
      if (!needle) return true;
      return n.title.toLowerCase().includes(needle) || n.body.toLowerCase().includes(needle) || (n.tags || []).some((t) => t.includes(needle));
    });
  }, [notes, query, tag]);

  const active = notes.find((n) => n.id === activeId) || null;

  async function create(template = TEMPLATES[0]) {
    setMenuOpen(false);
    try {
      const note = await api.createNote(template.note);
      setNotes((prev) => sortNotes([note, ...prev]));
      setQuery('');
      setTag('');
      setActiveId(note.id);
      setMobileEditor(true);
    } catch (err) {
      toast.error(err.message || "Couldn't create note");
    }
  }

  const save = useCallback(async (id, patch) => {
    const saved = await api.updateNote(id, patch);
    setNotes((prev) => sortNotes(prev.map((n) => (n.id === id ? saved : n))));
    return saved;
  }, []);

  async function remove(id) {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setActiveId(null);
      setMobileEditor(false);
      toast.success('Note deleted');
    } catch (err) {
      toast.error(err.message || "Couldn't delete note");
    }
  }

  const select = useCallback((id) => {
    setActiveId(id);
    setMobileEditor(true);
  }, []);

  return (
    <div className="flex h-full min-h-0">
      {/* List column */}
      <section className={`${mobileEditor ? 'hidden md:flex' : 'flex'} w-full min-h-0 flex-col border-r border-border bg-surface-alt/40 md:w-[340px] md:shrink-0`}>
        <div className="space-y-3 border-b border-border p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><NotebookPen size={18} /></span>
            <div className="flex-1">
              <h1 className="text-base font-semibold leading-tight">Notes</h1>
              <p className="flex items-center gap-1 text-[11px] text-text-muted">
                <Radio size={10} className={connected ? 'live-dot text-success' : 'text-text-muted'} />
                {connected ? 'Synced live across your devices' : 'Offline'} · {notes.length}
              </p>
            </div>
            <div className="relative flex">
              <button className="btn-primary rounded-r-none px-3" onClick={() => create()}><Plus size={16} /> New</button>
              <button className="btn-primary rounded-l-none border-l border-white/20 px-2" onClick={() => setMenuOpen((o) => !o)} aria-label="Choose a template">
                <ChevronDown size={15} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-surface-raised p-2 shadow-2xl">
                    <TemplateGrid compact onPick={create} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes, text and #tags" className="input w-full pl-9 pr-8" />
            {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"><X size={14} /></button>}
          </div>
          {allTags.length > 0 && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              <button onClick={() => setTag('')} className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${!tag ? 'bg-accent text-white' : 'bg-surface-raised text-text-muted hover:text-text'}`}>All</button>
              {allTags.map((t) => (
                <button key={t} onClick={() => setTag(tag === t ? '' : t)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${tag === t ? 'bg-accent text-white' : 'bg-surface-raised text-text-muted hover:text-text'}`}>#{t}</button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
          ) : filtered.length ? (
            <NoteList notes={filtered} activeId={activeId} onSelect={select} />
          ) : notes.length ? (
            <p className="p-8 text-center text-sm text-text-muted">No notes match your search.</p>
          ) : (
            <p className="p-8 text-center text-sm text-text-muted">No notes yet — create your first one.</p>
          )}
        </div>
      </section>

      {/* Editor column */}
      <section className={`${mobileEditor ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-1 flex-col`}>
        {active ? (
          <NoteEditor key={active.id} note={active} allTags={allTags} onSave={save} onDelete={remove} onBack={() => setMobileEditor(false)} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto p-8 text-center">
            <div className="relative">
              <span className="absolute inset-0 -z-10 scale-150 rounded-full bg-accent-soft blur-2xl" />
              <span className="drop-float flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-soft text-accent"><Sparkles size={34} /></span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Capture anything</h2>
              <p className="mt-1 max-w-sm text-sm text-text-muted">Write notes, checklists and code on your phone or PC — they appear on every device instantly.</p>
            </div>
            <TemplateGrid onPick={create} />
          </div>
        )}
      </section>
    </div>
  );
}
