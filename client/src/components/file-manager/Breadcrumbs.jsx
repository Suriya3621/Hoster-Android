import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useServer } from '../../contexts/ServerContext';

/** virtualPath looks like "movies/Action/Trilogy" — first segment is the share id. */
export default function Breadcrumbs({ virtualPath = '', basePath = '/files' }) {
  const { shares } = useServer();
  const parts = virtualPath.split('/').filter(Boolean);

  const crumbs = parts.map((part, i) => {
    const pathSoFar = parts.slice(0, i + 1).join('/');
    let label = part;
    if (i === 0) {
      const share = shares.find((s) => s.id === part);
      label = share ? share.name : part;
    }
    return { label, path: pathSoFar };
  });

  return (
    <div className="flex items-center gap-1 text-sm text-text-muted overflow-x-auto no-scrollbar">
      <Link to={basePath} className="flex items-center gap-1 hover:text-text shrink-0">
        <Home size={14} />
        <span>Shares</span>
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1 shrink-0">
          <ChevronRight size={14} />
          {i === crumbs.length - 1 ? (
            <span className="text-text font-medium">{c.label}</span>
          ) : (
            <Link to={`${basePath}?path=${encodeURIComponent(c.path)}`} className="hover:text-text">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
