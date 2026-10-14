import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

// pdf.js needs its worker configured explicitly under Vite.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfViewer({ entry }) {
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(null);
  const [fitWidth, setFitWidth] = useState(true);

  const src = api.streamUrl(entry.virtualPath);

  function toggleFullscreen() {
    const el = document.getElementById('hoster-pdf-stage');
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  return (
    <div id="hoster-pdf-stage" className="flex flex-col h-full bg-surface-alt rounded-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface">
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost p-1.5"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-muted tabular-nums">
            Page {page} {numPages ? `of ${numPages}` : ''}
          </span>
          <button
            className="btn-ghost p-1.5"
            disabled={numPages && page >= numPages}
            onClick={() => setPage((p) => Math.min(p + 1, numPages || p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost p-1.5" onClick={() => { setFitWidth(false); setScale((s) => Math.max(s - 0.2, 0.4)); }}>
            <ZoomOut size={16} />
          </button>
          <button
            className="btn-ghost text-xs px-2"
            onClick={() => {
              setFitWidth(true);
              setScale(1);
            }}
          >
            Fit width
          </button>
          <button className="btn-ghost p-1.5" onClick={() => { setFitWidth(false); setScale((s) => Math.min(s + 0.2, 3)); }}>
            <ZoomIn size={16} />
          </button>
          <button className="btn-ghost p-1.5" onClick={toggleFullscreen}>
            <Maximize size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center p-4">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 text-text-muted text-sm">
            <AlertTriangle className="text-amber-400" size={24} />
            Couldn't render this PDF.
            <a href={api.downloadUrl(entry.virtualPath)} className="text-accent underline">
              Download instead
            </a>
          </div>
        ) : (
          <Document
            file={src}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={(err) => setError(err)}
            loading={<Loader2 className="animate-spin text-text-muted" size={28} />}
          >
            <Page
              pageNumber={page}
              width={fitWidth ? undefined : undefined}
              scale={fitWidth ? 1.2 : scale}
              renderAnnotationLayer
              renderTextLayer
            />
          </Document>
        )}
      </div>
    </div>
  );
}
