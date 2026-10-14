import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import Breadcrumbs from '../components/file-manager/Breadcrumbs';
import Toolbar from '../components/file-manager/Toolbar';
import FileGrid from '../components/file-manager/FileGrid';
import FileListView from '../components/file-manager/FileListView';
import FileDetailsPanel from '../components/file-manager/FileDetailsPanel';
import PreviewModal from '../components/media/PreviewModal';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeleton';
import { useFiles } from '../hooks/useFiles';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { api } from '../services/api';
import { useUploads } from '../contexts/UploadContext';
import { FolderOpen, SearchX } from 'lucide-react';

export default function Files() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const virtualPath = params.get('path') || '';
  const searchQuery = params.get('q') || '';

  const [view, setView] = useLocalStorage('hoster:viewMode', 'grid');
  const [favorites, setFavorites] = useLocalStorage('hoster:favorites', []);
  const [recent, setRecent] = useLocalStorage('hoster:recentFiles', []);
  const [selected, setSelected] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const { entries, loading, error, reload, sortBy, setSortBy, sortDir, setSortDir } = useFiles(virtualPath);
  const { startUploads } = useUploads();

  // Any finished upload (from this device or a phone) refreshes the folder you're looking at.
  useEffect(() => {
    let timer;
    const onDone = () => {
      clearTimeout(timer);
      timer = setTimeout(reload, 400);
    };
    window.addEventListener('hoster:upload-done', onDone);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hoster:upload-done', onDone);
    };
  }, [reload]);

  const displayEntries = searchQuery ? searchResults || [] : entries;

  useMemo(() => {
    if (!searchQuery) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    api
      .search(searchQuery, virtualPath)
      .then((data) => setSearchResults(data.results))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const openEntry = useCallback(
    (entry) => {
      if (entry.isDirectory) {
        setParams(entry.virtualPath ? { path: entry.virtualPath } : {});
        setSelected(null);
        return;
      }
      setSelected(entry);
      setRecent((prev) => {
        const filtered = prev.filter((r) => r.virtualPath !== entry.virtualPath);
        return [{ ...entry, openedAt: new Date().toISOString() }, ...filtered].slice(0, 30);
      });
    },
    [setParams, setRecent]
  );

  const onDrop = useCallback(
    async (files) => {
      if (!virtualPath) {
        toast.error('Open a shared folder before uploading.');
        return;
      }
      // Progress, speed and ETA appear in the Upload Center (bottom-right).
      await startUploads(virtualPath, files);
    },
    [virtualPath, startUploads]
  );

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  async function handleNewFolder() {
    if (!virtualPath) {
      toast.error('Open a shared folder first.');
      return;
    }
    const name = window.prompt('Folder name');
    if (!name) return;
    try {
      await api.createFolder(virtualPath, name);
      toast.success('Folder created');
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not create folder');
    }
  }

  function toggleFavorite(entry) {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.virtualPath === entry.virtualPath);
      if (exists) return prev.filter((f) => f.virtualPath !== entry.virtualPath);
      return [...prev, entry];
    });
  }
  const isFavorite = selected && favorites.some((f) => f.virtualPath === selected.virtualPath);

  return (
    <div {...getRootProps()} className="relative h-full flex flex-col">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 z-20 bg-accent/10 backdrop-blur-[2px] border-2 border-dashed border-accent flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-accent">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <span className="drop-ring absolute inset-0 rounded-full border-2 border-accent" />
              <span className="drop-ring absolute inset-0 rounded-full border-2 border-accent [animation-delay:0.5s]" />
              <UploadCloud size={46} className="drop-float" />
            </div>
            <p className="font-semibold text-lg">Drop to upload</p>
            <p className="text-xs text-text-muted">{virtualPath ? 'Files will be saved to this folder' : 'Open a shared folder first'}</p>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 py-3 border-b border-border">
        <Breadcrumbs virtualPath={virtualPath} />
      </div>

      {!searchQuery && (
        <Toolbar
          view={view}
          onViewChange={setView}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDir={sortDir}
          onToggleSortDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          onNewFolder={virtualPath ? handleNewFolder : undefined}
          onUploadClick={virtualPath ? openFileDialog : undefined}
          onRefresh={reload}
        />
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-y-auto">
          {searchQuery ? (
            searching ? (
              <SkeletonList />
            ) : displayEntries.length ? (
              <FileListView entries={displayEntries} onOpen={openEntry} selectedPath={selected?.virtualPath} />
            ) : (
              <EmptyState icon={SearchX} title="No results" description={`Nothing matched "${searchQuery}".`} />
            )
          ) : loading ? (
            view === 'grid' ? <SkeletonGrid /> : <SkeletonList />
          ) : error ? (
            <EmptyState icon={FolderOpen} title="Couldn't load this folder" description={error} />
          ) : displayEntries.length ? (
            view === 'grid' ? (
              <FileGrid entries={displayEntries} onOpen={openEntry} selectedPath={selected?.virtualPath} />
            ) : (
              <FileListView entries={displayEntries} onOpen={openEntry} selectedPath={selected?.virtualPath} />
            )
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="This folder is empty"
              description={virtualPath ? 'Drag and drop files here to upload them.' : 'No shared folders are configured yet.'}
            />
          )}
        </div>

        {selected && (
          <FileDetailsPanel
            entry={selected}
            onClose={() => setSelected(null)}
            onOpenPreview={setPreviewEntry}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>

      {previewEntry && (
        <PreviewModal
          entry={previewEntry}
          siblings={displayEntries}
          onChange={setPreviewEntry}
          onClose={() => setPreviewEntry(null)}
        />
      )}
    </div>
  );
}
