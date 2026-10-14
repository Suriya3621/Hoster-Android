import FileIcon from './FileIcon';
import { formatBytes, formatDate } from '../../utils/formatters';

export default function FileListView({ entries, onOpen, selectedPath }) {
  return (
    <div className="px-4 md:px-6 pb-6">
      <div className="hidden md:grid grid-cols-[1fr_100px_140px_80px] gap-3 px-3 py-2 text-xs text-text-muted border-b border-border">
        <span>Name</span>
        <span>Size</span>
        <span>Modified</span>
        <span>Type</span>
      </div>
      {entries.map((entry) => (
        <button
          key={entry.virtualPath}
          onClick={() => onOpen(entry)}
          className={`w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_140px_80px] gap-3 items-center px-3 py-2.5 rounded-lg text-sm text-left hover:bg-surface-alt transition-colors ${
            selectedPath === entry.virtualPath ? 'bg-accent-soft' : ''
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <FileIcon entry={entry} size={16} tile />
            <span className="truncate">{entry.name}</span>
          </span>
          <span className="hidden md:inline text-text-muted text-xs">
            {entry.isDirectory ? '—' : formatBytes(entry.size)}
          </span>
          <span className="hidden md:inline text-text-muted text-xs">
            {entry.isDirectory ? '—' : formatDate(entry.modified)}
          </span>
          <span className="hidden md:inline text-text-muted text-xs uppercase">
            {entry.extension || (entry.isDirectory ? 'folder' : '—')}
          </span>
        </button>
      ))}
    </div>
  );
}
