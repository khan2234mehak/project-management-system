import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Users, UsersRound, Calendar,
  ShieldCheck, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../features/dashboard/uiSlice';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'project_manager', 'team_member'] },
  { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'project_manager', 'team_member'] },
  { to: '/teams', label: 'Teams', icon: UsersRound, roles: ['admin', 'project_manager', 'team_member'] },
  { to: '/calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'project_manager', 'team_member'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/admin/monitoring', label: 'Login Monitoring', icon: ShieldCheck, roles: ['admin'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector((state) => state.ui.sidebarCollapsed);
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <aside
      className={`hidden md:flex flex-col bg-ink-900 text-ink-100 transition-all duration-200 ${
        collapsed ? 'w-[72px]' : 'w-60'
      } shrink-0`}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-signal-500 flex items-center justify-center font-display font-bold text-white">
          P
        </div>
        {!collapsed && <span className="font-display font-semibold text-lg tracking-tight">Pulseboard</span>}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-signal-500/15 text-signal-300'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-white'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => dispatch(toggleSidebar())}
        className="flex items-center gap-2 px-5 py-4 text-ink-400 hover:text-white text-sm border-t border-ink-800"
      >
        {collapsed ? <ChevronsRight size={18} /> : (
          <>
            <ChevronsLeft size={18} /> Collapse
          </>
        )}
      </button>
    </aside>
  );
}
