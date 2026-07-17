import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toggleTheme } from '../../features/dashboard/uiSlice';
import { logoutThunk } from '../../features/auth/authSlice';
import { useSelector } from 'react-redux';
import NotificationBell from './NotificationBell';
import Avatar from '../common/Avatar';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useSelector((state) => state.ui.theme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-800 px-6 py-3">
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects, tasks, people…"
          className="input !pl-9 !py-2"
        />
      </form>

      <div className="flex items-center gap-2">
        <button onClick={() => dispatch(toggleTheme())} className="btn-ghost !p-2 rounded-full" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-50 dark:hover:bg-ink-700"
          >
            <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
            <span className="hidden sm:block text-sm font-medium text-ink-700 dark:text-ink-100">{user?.name}</span>
            <ChevronDown size={14} className="text-ink-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-card bg-white dark:bg-ink-800 shadow-popover border border-ink-100 dark:border-ink-700 z-40 animate-slide-up py-1">
              <button
                onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink-700 dark:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-700"
              >
                <UserIcon size={15} /> My Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-priority-critical hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
