import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, UsersRound, Calendar, User } from 'lucide-react';

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/teams', label: 'Teams', icon: UsersRound },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-ink-800 border-t border-ink-100 dark:border-ink-700 flex justify-around py-2">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
              isActive ? 'text-signal-500' : 'text-ink-400'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
