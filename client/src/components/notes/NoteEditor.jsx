import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListChecks, Quote, Code, Link as LinkIcon,
  Minus, Pin, PinOff, Copy, Download, Trash2, Check, Loader2, Eye, Pencil, Columns2, X, CloudOff, Tag,
} from 'lucide-react';
import NotePreview from './NotePreview';
import { NOTE_COLORS, FORMATS, LANGUAGES, countWords } from './noteMeta';

const fromNote = (n) => ({
  title: n.title, body: n.body, format: n.format, language: n.language || 'javascript',
  color: n.color, tags: n.tags || [], pinned: n.pinned,
});

function ToolBtn({ icon: Icon, label, onClick }) {
  return (
    <button type="button" title={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-alt hover:text-text">
      <Icon size={16} />
    </button>
  );
}

export default function NoteEditor({ note, allTags, onSave, onDelete, onBack }) {
  const [draft, setDraft] = useState(() => fromNote(note));
  const [status, setStatus] = useState('saved'); // saved | dirty | saving | error
  const [mode, setMode] = useState(note.format === 'text' ? 'edit' : 'split');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const taRef = useRef(null);
  const titleRef = useRef(null);
  const pending = useRef({});
  const timer = useRef(null);
  const saving = useRef(false);
  const ownStamp = useRef(note.updatedAt);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // Focus the title of brand-new, empty notes.
  useEffect(() => {
    if (!note.title && !note.body) titleRef.current?.focus();
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (saving.current || !Object.keys(pending.current).length) return;
    const patch = pending.current;
    pending.current = {};
    saving.current = true;
    setStatus('saving');
    try {
      const saved = await onSaveRef.current(note.id, patch);
      ownStamp.current = saved.updatedAt;
      setStatus(Object.keys(pending.current).length ? 'dirty' : 'saved');
    } catch {
      pending.current = { ...patch, ...pending.current };
      setStatus('error');
    } finally {
      saving.current = false;
      if (Object.keys(pending.current).length) timer.current = setTimeout(flush, 700);
    }
  }, [note.id]);

  const change = useCallback((patch, immediate = false) => {
    setDraft((d) => ({ ...d, ...patch }));
    pending.current = { ...pending.current, ...patch };
    setStatus('dirty');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, immediate ? 0 : 700);
  }, [flush]);

  // Save anything still pending when leaving this note.
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (Object.keys(pending.current).length) onSaveRef.current(note.id, pending.current).catch(() => {});
  }, [note.id]);

  // Edited on another device while we're idle → adopt their version.
  useEffect(() => {
    if (status === 'saved' && note.updatedAt !== ownStamp.current) {
      ownStamp.current = note.updatedAt;
      setDraft(fromNote(note));
    }
  }, [note, status]);

  // ---- Markdown helpers --------------------------------------------------
  function edit(fn) {
    const ta = taRef.current;
    if (!ta) return;
    const { text, start, end } = fn(ta.value, ta.selectionStart, ta.selectionEnd);
    change({ body: text });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, end);
    });
  }
  const wrap = (before, after = before, placeholder = 'text') => edit((v, s, e) => {
    const sel = v.slice(s, e) || placeholder;
    return { text: v.slice(0, s) + before + sel + after + v.slice(e), start: s + before.length, end: s + before.length + sel.length };
  });
  const prefixLines = (prefix) => edit((v, s, e) => {
    const from = v.lastIndexOf('\n', s - 1) + 1;
    let to = v.indexOf('\n', e);
    if (to === -1) to = v.length;
    const lines = v.slice(from, to).split('\n');
    const allHave = lines.every((l) => l.startsWith(prefix));
    const out = lines.map((l) => (allHave ? l.slice(prefix.length) : prefix + l)).join('\n');
    return { text: v.slice(0, from) + out + v.slice(to), start: from, end: from + out.length };
  });
  const insertBlock = (block) => edit((v, s) => {
    const lead = s > 0 && v[s - 1] !== '\n' ? '\n' : '';
    return { text: v.slice(0, s) + lead + block + v.slice(s), start: s + lead.length + block.length, end: s + lead.length + block.length };
  });
  const addLink = () => edit((v, s, e) => {
    const sel = v.slice(s, e) || 'link text';
    const ins = `[${sel}](https://)`;
    return { text: v.slice(0, s) + ins + v.slice(e), start: s + sel.length + 3, end: s + ins.length - 1 };
  });

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (draft.format === 'markdown' && mod && !e.shiftKey && !e.altKey) {
      if (e.key === 'b') { e.preventDefault(); wrap('**', '**', 'bold'); return; }
      if (e.key === 'i') { e.preventDefault(); wrap('*', '*', 'italic'); return; }
    }
    if (e.key === 'Tab' && draft.format === 'code' && !e.shiftKey) {
      e.preventDefault();
      edit((v, s, en) => ({ text: `${v.slice(0, s)}  ${v.slice(en)}`, start: s + 2, end: s + 2 }));
      return;
    }
    // Enter continues bullet / numbered / checklist lines.
    if (e.key === 'Enter' && draft.format === 'markdown' && !e.shiftKey && !mod) {
      const ta = e.target;
      const { value, selectionStart: s, selectionEnd: en } = ta;
      if (s !== en) return;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const line = value.slice(lineStart, s);
      const m = /^(\s*)([-*+]|\d+\.)(\s+\[[ xX]\])?\s(.*)$/.exec(line);
      if (!m) return;
      e.preventDefault();
      if (!m[4].trim()) {
        edit((v) => ({ text: v.slice(0, lineStart) + v.slice(s), start: lineStart, end: lineStart }));
        return;
      }
      const marker = /^\d+\.$/.test(m[2]) ? `${parseInt(m[2], 10) + 1}.` : m[2];
      const ins = `\n${m[1]}${marker}${m[3] ? ' [ ]' : ''} `;
      edit((v) => ({ text: v.slice(0, s) + ins + v.slice(s), start: s + ins.length, end: s + ins.length }));
    }
  }

  // ---- Actions -----------------------------------------------------------
  async function copyBody() {
    try {
      await navigator.clipboard.writeText(draft.body);
      toast.success('Note copied');
    } catch {
      toast.error('Copy is blocked on this connection — select the text and copy manually.');
    }
  }
  function exportNote() {
    const ext = draft.format === 'markdown' ? 'md' : draft.format === 'code' ? 'txt' : 'txt';
    const blob = new Blob([draft.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(draft.title || 'note').replace(/[\\/:*?"<>|]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function addTag(raw) {
    const tag = raw.trim().toLowerCase().replace(/^#/, '').slice(0, 30);
    if (tag && !draft.tags.includes(tag) && draft.tags.length < 12) change({ tags: [...draft.tags, tag] }, true);
    setTagInput('');
  }

  const color = NOTE_COLORS[draft.color] || NOTE_COLORS.none;
  const words = useMemo(() => countWords(draft.body), [draft.body]);
  const canPreview = draft.format !== 'text';
  const effectiveMode = canPreview ? mode : 'edit';
  const showEdit = effectiveMode !== 'preview';
  const showPreview = canPreview && effectiveMode !== 'edit';

  const statusUi = {
    saved: { icon: Check, text: 'Saved', cls: 'text-success' },
    dirty: { icon: Pencil, text: 'Editing…', cls: 'text-text-muted' },
    saving: { icon: Loader2, text: 'Saving…', cls: 'text-text-muted', spin: true },
    error: { icon: CloudOff, text: 'Not saved — retrying', cls: 'text-danger' },
  }[status];

  return (
    <div className={`flex h-full min-h-0 flex-col bg-gradient-to-b ${color.glow} to-transparent`}>
      {/* Top bar */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-2 md:px-4">
        <button onClick={onBack} className="btn-ghost p-2 md:hidden" aria-label="Back to notes"><ArrowLeft size={18} /></button>
        <span className={`flex items-center gap-1.5 px-2 text-xs ${statusUi.cls}`}>
          <statusUi.icon size={13} className={statusUi.spin ? 'animate-spin' : ''} /> {statusUi.text}
        </span>
        <div className="flex-1" />
        {canPreview && (
          <div className="mr-1 inline-flex overflow-hidden rounded-lg border border-border">
            {[
              { id: 'edit', icon: Pencil, label: 'Write', cls: '' },
              { id: 'split', icon: Columns2, label: 'Split', cls: 'hidden md:inline-flex' },
              { id: 'preview', icon: Eye, label: 'Preview', cls: '' },
            ].map(({ id, icon: Icon, label, cls }) => (
              <button key={id} onClick={() => setMode(id)} title={label}
                className={`${cls} items-center gap-1.5 px-2.5 py-1.5 text-xs ${mode === id ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text'} inline-flex`}>
                <Icon size={13} /> <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>
        )}
        <button className="btn-ghost p-2" title={draft.pinned ? 'Unpin' : 'Pin to top'} onClick={() => change({ pinned: !draft.pinned }, true)}>
          {draft.pinned ? <PinOff size={16} className="text-accent" /> : <Pin size={16} />}
        </button>
        <button className="btn-ghost p-2" title="Copy note" onClick={copyBody}><Copy size={16} /></button>
        <button className="btn-ghost p-2" title="Download" onClick={exportNote}><Download size={16} /></button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setConfirmDelete(false)}>Keep</button>
            <button className="btn bg-danger px-2 py-1 text-xs text-white" onClick={() => onDelete(note.id)}>Delete</button>
          </div>
        ) : (
          <button className="btn-ghost p-2 hover:text-danger" title="Delete note" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /></button>
        )}
      </div>

      {/* Title + meta */}
      <div className="space-y-3 px-4 pt-4 md:px-8">
        <input
          ref={titleRef}
          value={draft.title}
          onChange={(e) => change({ title: e.target.value })}
          placeholder="Untitled note"
          maxLength={200}
          className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-text-muted/50 md:text-3xl"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {FORMATS.map((f) => (
              <button key={f.id} onClick={() => { change({ format: f.id }, true); if (f.id === 'text') setMode('edit'); else if (mode === 'edit' && draft.format === 'text') setMode('split'); }}
                className={`px-2.5 py-1 text-[11px] font-semibold ${draft.format === f.id ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text'}`}>
                {f.label}
              </button>
            ))}
          </div>
          {draft.format === 'code' && (
            <select value={draft.language} onChange={(e) => change({ language: e.target.value }, true)} className="input py-1 text-xs">
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Note colour">
            {Object.entries(NOTE_COLORS).map(([id, c]) => (
              <button key={id} role="radio" aria-checked={draft.color === id} title={c.label} onClick={() => change({ color: id }, true)}
                className={`h-5 w-5 rounded-full border-2 transition-transform ${c.dot} ${draft.color === id ? 'scale-110 border-text' : 'border-transparent opacity-70 hover:opacity-100'}`} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size={13} className="text-text-muted" />
          {draft.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
              #{t}
              <button onClick={() => change({ tags: draft.tags.filter((x) => x !== t) }, true)} aria-label={`Remove tag ${t}`}><X size={11} /></button>
            </span>
          ))}
          <input
            value={tagInput}
            list="note-tag-suggestions"
            onChange={(e) => (e.target.value.endsWith(',') ? addTag(e.target.value.slice(0, -1)) : setTagInput(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } if (e.key === 'Backspace' && !tagInput && draft.tags.length) change({ tags: draft.tags.slice(0, -1) }, true); }}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={draft.tags.length ? 'Add tag' : 'Add tags (press Enter)'}
            className="min-w-[8rem] flex-1 bg-transparent text-xs outline-none placeholder:text-text-muted"
          />
          <datalist id="note-tag-suggestions">{allTags.filter((t) => !draft.tags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
        </div>
      </div>

      {/* Markdown toolbar */}
      {draft.format === 'markdown' && showEdit && (
        <div className="mx-4 mt-3 flex items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-surface-raised/70 p-1 md:mx-8">
          <ToolBtn icon={Bold} label="Bold (Ctrl+B)" onClick={() => wrap('**', '**', 'bold')} />
          <ToolBtn icon={Italic} label="Italic (Ctrl+I)" onClick={() => wrap('*', '*', 'italic')} />
          <ToolBtn icon={Strikethrough} label="Strikethrough" onClick={() => wrap('~~', '~~', 'text')} />
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn icon={Heading1} label="Heading 1" onClick={() => prefixLines('# ')} />
          <ToolBtn icon={Heading2} label="Heading 2" onClick={() => prefixLines('## ')} />
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn icon={List} label="Bullet list" onClick={() => prefixLines('- ')} />
          <ToolBtn icon={ListChecks} label="Checklist" onClick={() => prefixLines('- [ ] ')} />
          <ToolBtn icon={Quote} label="Quote" onClick={() => prefixLines('> ')} />
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn icon={Code} label="Code block" onClick={() => insertBlock('```\ncode\n```\n')} />
          <ToolBtn icon={LinkIcon} label="Link" onClick={addLink} />
          <ToolBtn icon={Minus} label="Divider" onClick={() => insertBlock('\n---\n')} />
        </div>
      )}

      {/* Body */}
      <div className="mt-3 flex min-h-0 flex-1 divide-x divide-border border-t border-border">
        {showEdit && (
          <textarea
            ref={taRef}
            value={draft.body}
            onChange={(e) => change({ body: e.target.value })}
            onKeyDown={onKeyDown}
            spellCheck={draft.format !== 'code'}
            placeholder={draft.format === 'code' ? 'Paste or type code…' : draft.format === 'markdown' ? 'Write in Markdown — **bold**, # headings, - [ ] tasks…' : 'Start typing…'}
            className={`note-textarea min-w-0 flex-1 resize-none bg-transparent px-4 py-4 text-[15px] leading-relaxed outline-none placeholder:text-text-muted/50 md:px-8 ${
              draft.format === 'code' ? 'font-mono text-[13px]' : ''
            }`}
          />
        )}
        {showPreview && (
          <div className={`${effectiveMode === 'split' ? 'hidden md:block' : 'block'} min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-8`}>
            <NotePreview body={draft.body} format={draft.format} language={draft.language} onBodyChange={(b) => change({ body: b }, true)} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-1.5 text-[11px] text-text-muted md:px-8">
        <span>{words} {words === 1 ? 'word' : 'words'}</span>
        <span>{draft.body.length.toLocaleString()} characters</span>
        <span className="ml-auto hidden sm:inline">≈ {Math.max(1, Math.round(words / 200))} min read</span>
      </div>
    </div>
  );
}
