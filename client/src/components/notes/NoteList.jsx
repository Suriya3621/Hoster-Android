import { memo } from 'react';
import { Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NOTE_COLORS, FORMATS, plainPreview } from './noteMeta';

const NoteCard = memo(function NoteCard({ note, active, onSelect }) {
  const color = NOTE_COLORS[note.color] || NOTE_COLORS.none;
  const format = FORMATS.find((f) => f.id === note.format);
  const preview = plainPreview(note.body);

  return (
    <button
      onClick={() => onSelect(note.id)}
      className={`note-in group relative w-full overflow-hidden rounded-xl border p-3 pl-4 text-left transition-all ${
        active ? 'border-accent bg-accent-soft shadow-soft' : 'border-border bg-surface-raised hover:border-accent/40 hover:bg-surface-alt'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} />
      <div className="flex items-start gap-2">
        <p className={`min-w-0 flex-1 truncate text-sm font-semibold ${note.title ? '' : 'text-text-muted italic'}`}>
          {note.title || 'Untitled note'}
        </p>
        {note.pinned && <Pin size={12} className="mt-0.5 shrink-0 fill-current text-accent" />}
      </div>
      <p className="mt-1 line-clamp-2 min-h-[2.2em] text-xs leading-snug text-text-muted">{preview || 'No content yet'}</p>
      <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
        <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-text-muted">{format?.short}</span>
        {(note.tags || []).slice(0, 2).map((t) => (
          <span key={t} className="shrink-0 truncate rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">#{t}</span>
        ))}
        {(note.tags || []).length > 2 && <span className="text-[10px] text-text-muted">+{note.tags.length - 2}</span>}
        <span className="ml-auto shrink-0 text-[10px] text-text-muted">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
});

export default function NoteList({ notes, activeId, onSelect }) {
  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);

  const section = (title, list) =>
    list.length > 0 && (
      <div className="space-y-2">
        {title && <p className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">{title}</p>}
        {list.map((n) => <NoteCard key={n.id} note={n} active={n.id === activeId} onSelect={onSelect} />)}
      </div>
    );

  return (
    <div className="space-y-3 p-3">
      {section(pinned.length && others.length ? 'Pinned' : pinned.length ? 'Pinned' : '', pinned)}
      {section(pinned.length ? 'Notes' : '', others)}
    </div>
  );
}
