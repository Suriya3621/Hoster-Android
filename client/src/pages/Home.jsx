import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from '../components/settings/QRCode';
import {
  Copy,
  Clapperboard,
  Image,
  Music2,
  FileText,
  Server,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useServer } from '../contexts/ServerContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatDate } from '../utils/formatters';
import FileIcon from '../components/file-manager/FileIcon';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACCESS = [
  { to: '/videos', label: 'Videos', icon: Clapperboard },
  { to: '/photos', label: 'Photos', icon: Image },
  { to: '/music', label: 'Music', icon: Music2 },
  { to: '/documents', label: 'Documents', icon: FileText },
];

export default function Home() {
  const { online, network, shares } = useServer();
  const [recent] = useLocalStorage('hoster:recentFiles', []);
  const [copied, setCopied] = useState(false);

  const url = network?.url || '';

  function copyAddress() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-text-muted text-sm">{greeting()}</p>
        <h1 className="text-2xl font-semibold tracking-tight">HOSTER</h1>
      </div>

      <div className="card p-5 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {online ? 'Local server online' : 'Server offline'}
            </span>
          </div>
          <p className="font-mono text-lg mb-3 break-all">{url || '—'}</p>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={copyAddress}>
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy address'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3">
            Open this address on any phone, tablet, or laptop connected to the same Wi-Fi.
          </p>
        </div>
        {url && (
          <div className="shrink-0 flex flex-col items-center gap-2">
            <QRCode value={url} size={128} />
            <span className="text-[11px] text-text-muted">Scan to open Hoster</span>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-text-muted mb-3">Quick access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACCESS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="card p-4 flex flex-col items-center gap-2 hover:border-accent/50 transition-colors">
              <Icon size={24} className="text-accent" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <Server size={14} /> Shared folders
        </h2>
        <div className="flex flex-wrap gap-2">
          {shares.map((s) => (
            <Link
              key={s.id}
              to={`/files?path=${encodeURIComponent(s.id)}`}
              className="px-3 py-1.5 rounded-full text-sm card hover:border-accent/50"
            >
              {s.name}
            </Link>
          ))}
          {!shares.length && <p className="text-sm text-text-muted">No shares configured yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <Clock size={14} /> Recent files
        </h2>
        {recent.length ? (
          <div className="card divide-y divide-border">
            {recent.slice(0, 8).map((r) => (
              <Link
                key={r.virtualPath}
                to={`/files?path=${encodeURIComponent(r.virtualPath.split('/').slice(0, -1).join('/'))}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-alt text-sm"
              >
                <FileIcon entry={r} size={15} tile />
                <span className="truncate flex-1">{r.name}</span>
                <span className="text-xs text-text-muted">{formatDate(r.openedAt)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Files you open will show up here.</p>
        )}
      </div>
    </div>
  );
}
