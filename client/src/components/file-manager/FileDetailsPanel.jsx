import { X, Download, ExternalLink, Copy, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import FileIcon from './FileIcon';
import { formatBytes, formatDate } from '../../utils/formatters';
import { api } from '../../services/api';

export default function FileDetailsPanel({ entry, onClose, onOpenPreview, isFavorite, onToggleFavorite }) {
  if (!entry) return null;

  function copyPath() {
    navigator.clipboard.writeText(entry.virtualPath);
    toast.success('Path copied');
  }

  return (
    <aside className="w-full md:w-80 shrink-0 border-l border-border bg-surface-alt flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium">File details</span>
        <button onClick={onClose} className="text-text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col items-center text-center gap-3 border-b border-border">
        <FileIcon entry={entry} size={40} tile />
        <div className="break-all font-medium text-sm">{entry.name}</div>
      </div>

      <div className="p-4 space-y-3 text-sm flex-1 overflow-y-auto">
        <Row label="Type" value={entry.category} capitalize />
        {!entry.isDirectory && <Row label="Size" value={formatBytes(entry.size)} />}
        <Row label="Modified" value={formatDate(entry.modified)} />
        {entry.extension && <Row label="Extension" value={`.${entry.extension}`} />}
        <Row label="Location" value={entry.virtualPath.split('/').slice(0, -1).join('/') || '/'} truncate />
      </div>

      <div className="p-4 space-y-2 border-t border-border">
        {!entry.isDirectory && (
          <>
            <button className="btn-primary w-full justify-center" onClick={() => onOpenPreview(entry)}>
              <ExternalLink size={16} /> Open
            </button>
            <a
              className="btn-ghost w-full justify-center card"
              href={api.downloadUrl(entry.virtualPath)}
            >
              <Download size={16} /> Download
            </a>
          </>
        )}
        <button className="btn-ghost w-full justify-center card" onClick={copyPath}>
          <Copy size={16} /> Copy path
        </button>
        <button className="btn-ghost w-full justify-center card" onClick={() => onToggleFavorite(entry)}>
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-accent' : ''} />
          {isFavorite ? 'Remove favorite' : 'Add to favorites'}
        </button>
      </div>
    </aside>
  );
}

function Row({ label, value, capitalize, truncate }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className={`text-right ${capitalize ? 'capitalize' : ''} ${truncate ? 'truncate max-w-[180px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}
