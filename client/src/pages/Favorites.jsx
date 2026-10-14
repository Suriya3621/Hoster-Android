import { useState } from 'react';
import { Star } from 'lucide-react';
import FileGrid from '../components/file-manager/FileGrid';
import FileListView from '../components/file-manager/FileListView';
import PreviewModal from '../components/media/PreviewModal';
import EmptyState from '../components/ui/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Favorites() {
  const [favorites] = useLocalStorage('hoster:favorites', []);
  const [previewEntry, setPreviewEntry] = useState(null);

  function openEntry(entry) {
    if (entry.isDirectory) return;
    setPreviewEntry(entry);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 md:px-6 py-4 border-b border-border flex items-center gap-2">
        <Star size={18} className="text-accent" />
        <h1 className="font-medium">Favorites</h1>
        <span className="text-xs text-text-muted ml-1">({favorites.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {favorites.length ? (
          <FileGrid entries={favorites} onOpen={openEntry} />
        ) : (
          <EmptyState
            icon={Star}
            title="No favorites yet"
            description="Open a file's details panel and tap the star to add it here."
          />
        )}
      </div>

      {previewEntry && (
        <PreviewModal
          entry={previewEntry}
          siblings={favorites}
          onChange={setPreviewEntry}
          onClose={() => setPreviewEntry(null)}
        />
      )}
    </div>
  );
}
