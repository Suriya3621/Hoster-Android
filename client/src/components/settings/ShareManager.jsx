import { FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useServer } from '../../contexts/ServerContext';

export default function ShareManager() {
  const { shares } = useServer();

  return (
    <div className="card divide-y divide-border">
      {shares.map((s) => (
        <div key={s.id} className="flex items-center gap-3 px-4 py-3">
          <FolderOpen size={18} className="text-accent" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{s.name}</p>
          </div>
          {s.exists ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={14} /> Available
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-danger">
              <XCircle size={14} /> Not found
            </span>
          )}
        </div>
      ))}
      {!shares.length && (
        <p className="p-4 text-sm text-text-muted">No shared folders configured yet.</p>
      )}
      <div className="px-4 py-3 text-xs text-text-muted bg-surface-alt">
        Add, edit or remove shared folders in the <Link to="/admin" className="text-accent underline">Admin panel</Link> —
        changes apply instantly and are saved to <code className="text-accent">server/data/shares.json</code>.
      </div>
    </div>
  );
}
