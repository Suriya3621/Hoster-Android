import { X, Download, FileType } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import PdfViewer from './PdfViewer';
import TextViewer from './TextViewer';
import PhotoViewer from './PhotoViewer';
import { api } from '../../services/api';

export default function PreviewModal({ entry, siblings = [], onChange, onClose }) {
  if (!entry) return null;

  if (entry.category === 'image') {
    return <PhotoViewer entry={entry} siblings={siblings} onChange={onChange} onClose={onClose} />;
  }

  const mediaSiblings = siblings.filter((s) => s.category === entry.category);
  const isVideo = entry.category === 'video';

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center ${
        isVideo ? '' : 'p-4'
      }`}
    >
      <div
        className={`w-full flex flex-col overflow-hidden ${
          isVideo
            ? 'h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:card'
            : 'max-w-4xl max-h-[90vh] card'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <span className="text-sm font-medium truncate">{entry.name}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text p-2 -mr-2">
            <X size={20} />
          </button>
        </div>

        <div className={`overflow-auto flex-1 min-h-0 ${isVideo ? 'flex items-center bg-black' : 'p-4'}`}>
          {isVideo && (
            <VideoPlayer
              entry={entry}
              onNext={
                mediaSiblings.length > 1
                  ? () => onChange(mediaSiblings[(mediaSiblings.findIndex((s) => s.virtualPath === entry.virtualPath) + 1) % mediaSiblings.length])
                  : undefined
              }
              onPrevious={
                mediaSiblings.length > 1
                  ? () =>
                      onChange(
                        mediaSiblings[
                          (mediaSiblings.findIndex((s) => s.virtualPath === entry.virtualPath) - 1 + mediaSiblings.length) %
                            mediaSiblings.length
                        ]
                      )
                  : undefined
              }
            />
          )}
          {entry.category === 'audio' && (
            <AudioPlayer entry={entry} queue={mediaSiblings} onSelect={onChange} />
          )}
          {entry.category === 'pdf' && (
            <div className="h-[70vh]">
              <PdfViewer entry={entry} />
            </div>
          )}
          {(entry.category === 'text' || entry.category === 'code') && <TextViewer entry={entry} />}
          {entry.category === 'document' && <UnsupportedPreview entry={entry} />}
          {entry.category === 'archive' && <UnsupportedPreview entry={entry} label="Archives can't be previewed yet." />}
          {entry.category === 'unknown' && <UnsupportedPreview entry={entry} />}
        </div>
      </div>
    </div>
  );
}

function UnsupportedPreview({ entry, label = 'Preview unavailable for this file type.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-alt flex items-center justify-center">
        <FileType size={26} className="text-text-muted" />
      </div>
      <p className="text-sm text-text-muted max-w-xs">{label}</p>
      <a href={api.downloadUrl(entry.virtualPath)} className="btn-primary">
        <Download size={16} /> Download file
      </a>
    </div>
  );
}
