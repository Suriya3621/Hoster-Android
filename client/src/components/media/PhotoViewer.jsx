import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Download,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatBytes, formatDate } from '../../utils/formatters';

export default function PhotoViewer({ entry, siblings = [], onChange, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const index = siblings.findIndex((s) => s.virtualPath === entry.virtualPath);
  const total = siblings.length;

  const reset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  useEffect(() => {
    reset();
  }, [entry.virtualPath, reset]);

  const goTo = useCallback(
    (delta) => {
      if (!siblings.length) return;
      const nextIndex = (index + delta + total) % total;
      onChange?.(siblings[nextIndex]);
    },
    [index, total, siblings, onChange]
  );

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') goTo(1);
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === 'Escape') onClose?.();
      if (e.key === '+') setZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.5));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, onClose]);

  function toggleFullscreen() {
    const el = document.getElementById('hoster-photo-stage');
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  return (
    <div id="hoster-photo-stage" className="fixed inset-0 z-50 bg-black flex flex-col select-none">
      <div className="flex items-center justify-between px-4 py-3 text-white/90 bg-gradient-to-b from-black/70 to-transparent absolute top-0 inset-x-0 z-10">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{entry.name}</p>
          <p className="text-xs text-white/60">
            {formatBytes(entry.size)} · {formatDate(entry.modified)}
            {total > 1 ? ` · ${index + 1} / ${total}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <a href={api.downloadUrl(entry.virtualPath)} className="p-2 hover:bg-white/10 rounded-full">
            <Download size={18} />
          </a>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden touch-pan-y">
        {siblings.length > 1 && (
          <button
            onClick={() => goTo(-1)}
            className="hidden sm:flex absolute left-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <img
          src={api.streamUrl(entry.virtualPath)}
          alt={entry.name}
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          className="max-w-full max-h-full object-contain transition-transform duration-150"
          draggable={false}
        />
        {siblings.length > 1 && (
          <button
            onClick={() => goTo(1)}
            className="hidden sm:flex absolute right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 inset-x-0">
        <ToolBtn onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} icon={ZoomOut} />
        <span className="text-white/80 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
        <ToolBtn onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} icon={ZoomIn} />
        <ToolBtn onClick={() => setRotation((r) => r + 90)} icon={RotateCw} />
        <ToolBtn onClick={toggleFullscreen} icon={Maximize} />
      </div>
    </div>
  );
}

function ToolBtn({ onClick, icon: Icon }) {
  return (
    <button onClick={onClick} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
      <Icon size={18} />
    </button>
  );
}
