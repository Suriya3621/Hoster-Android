import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Clapperboard, NotebookPen, Settings } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/videos', label: 'Videos', icon: Clapperboard },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-alt border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 px-3 text-[11px] ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
