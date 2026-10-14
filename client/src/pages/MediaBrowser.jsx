import { useEffect, useState } from 'react';
import FileGrid from '../components/file-manager/FileGrid';
import FileListView from '../components/file-manager/FileListView';
import PreviewModal from '../components/media/PreviewModal';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function MediaBrowser({ category, title, icon: Icon, emptyHint, defaultView = 'grid' }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [view] = useLocalStorage(`hoster:viewMode:${category}`, defaultView);
  const [, setRecent] = useLocalStorage('hoster:recentFiles', []);

  useEffect(() => {
    setLoading(true);
    api
      .browseByCategory(category)
      .then((data) => setEntries(data.results || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  function openEntry(entry) {
    setPreviewEntry(entry);
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.virtualPath !== entry.virtualPath);
      return [{ ...entry, openedAt: new Date().toISOString() }, ...filtered].slice(0, 30);
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 md:px-6 py-4 border-b border-border flex items-center gap-2">
        {Icon && <Icon size={18} className="text-accent" />}
        <h1 className="font-medium">{title}</h1>
        {!loading && <span className="text-xs text-text-muted ml-1">({entries.length})</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <EmptyState icon={Icon} title="Couldn't load media" description={error} />
        ) : entries.length ? (
          view === 'grid' ? (
            <FileGrid entries={entries} onOpen={openEntry} />
          ) : (
            <FileListView entries={entries} onOpen={openEntry} />
          )
        ) : (
          <EmptyState icon={Icon} title={`No ${title.toLowerCase()} yet`} description={emptyHint} />
        )}
      </div>

      {previewEntry && (
        <PreviewModal
          entry={previewEntry}
          siblings={entries}
          onChange={setPreviewEntry}
          onClose={() => setPreviewEntry(null)}
        />
      )}
    </div>
  );
}
