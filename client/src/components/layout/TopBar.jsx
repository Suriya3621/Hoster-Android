import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Wifi, WifiOff } from 'lucide-react';
import { useServer } from '../../contexts/ServerContext';

export default function TopBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { online } = useServer();
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function submit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/files?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 md:px-6 border-b border-border bg-surface/90 backdrop-blur">
      <form onSubmit={submit} className="flex-1 max-w-xl relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files, folders, types… (Ctrl+K)"
          className="input w-full pl-9 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          >
            <X size={14} />
          </button>
        )}
      </form>

      <div
        className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          online
            ? 'border-success/30 text-success bg-success/10'
            : 'border-danger/30 text-danger bg-danger/10'
        }`}
        title={online ? 'Connected to Hoster server' : 'Not connected to server'}
      >
        {online ? <Wifi size={13} /> : <WifiOff size={13} />}
        {online ? 'Online' : 'Offline'}
      </div>
    </header>
  );
}
