import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Clapperboard,
  Image,
  Music2,
  FileText,
  Star,
  Settings,
  Server,
  NotebookPen,
  ShieldCheck,
} from 'lucide-react';
import { useServer } from '../../contexts/ServerContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/videos', label: 'Videos', icon: Clapperboard },
  { to: '/photos', label: 'Photos', icon: Image },
  { to: '/music', label: 'Music', icon: Music2 },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/favorites', label: 'Favorites', icon: Star },
];

export default function Sidebar() {
  const { online } = useServer();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col border-r border-border bg-surface-alt shrink-0">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
          <Server size={18} className="text-accent" />
        </div>
        <div>
          <div className="font-semibold tracking-tight leading-none">HOSTER</div>
          <div className="text-[11px] text-text-muted leading-none mt-1">
            {online ? 'Server online' : 'Connecting…'}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-accent-soft text-accent font-medium'
                  : 'text-text-muted hover:bg-surface-raised hover:text-text'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 space-y-1">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-accent-soft text-accent font-medium'
                : 'text-text-muted hover:bg-surface-raised hover:text-text'
            }`
          }
        >
          <ShieldCheck size={18} />
          Admin
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-accent-soft text-accent font-medium'
                : 'text-text-muted hover:bg-surface-raised hover:text-text'
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
