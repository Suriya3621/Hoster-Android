import { LayoutGrid, List, ArrowUpDown, FolderPlus, Upload, RefreshCw } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'modified', label: 'Modified' },
  { value: 'type', label: 'Type' },
];

export default function Toolbar({
  view,
  onViewChange,
  sortBy,
  onSortByChange,
  sortDir,
  onToggleSortDir,
  onNewFolder,
  onUploadClick,
  onRefresh,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 md:px-6 py-2.5 md:py-3 border-b border-border">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="input py-1.5 text-xs"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </select>
      <button className="btn-ghost p-2" onClick={onToggleSortDir} title="Toggle sort direction">
        <ArrowUpDown size={16} className={sortDir === 'desc' ? 'rotate-180' : ''} />
      </button>

      <div className="hidden sm:block flex-1" />

      {onRefresh && (
        <button className="btn-ghost p-2" onClick={onRefresh} title="Refresh">
          <RefreshCw size={16} />
        </button>
      )}
      {onNewFolder && (
        <button className="btn-ghost p-2" onClick={onNewFolder} title="New folder">
          <FolderPlus size={16} />
        </button>
      )}
      {onUploadClick && (
        <button className="btn-ghost p-2" onClick={onUploadClick} title="Upload">
          <Upload size={16} />
        </button>
      )}

      <div className="flex items-center rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => onViewChange('grid')}
          className={`p-2 ${view === 'grid' ? 'bg-accent-soft text-accent' : 'text-text-muted'}`}
          title="Grid view"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={`p-2 ${view === 'list' ? 'bg-accent-soft text-accent' : 'text-text-muted'}`}
          title="List view"
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
