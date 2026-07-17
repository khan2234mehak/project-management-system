import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../features/notifications/notificationsSlice';
import { Spinner } from '../common/Feedback';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, status } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleClick = (n) => {
    if (!n.is_read) dispatch(markNotificationRead(n.id));
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative btn-ghost !p-2 rounded-full"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-priority-critical px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-card bg-white dark:bg-ink-800 shadow-popover border border-ink-100 dark:border-ink-700 z-40 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-700">
            <span className="font-display font-semibold text-sm text-ink-900 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllNotificationsRead())}
                className="text-xs text-signal-500 hover:underline flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {status === 'loading' && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {status !== 'loading' && items.length === 0 && (
              <p className="text-sm text-ink-400 text-center py-8">You're all caught up</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-ink-50 dark:border-ink-700/50 hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors ${
                  !n.is_read ? 'bg-signal-100/40 dark:bg-signal-500/10' : ''
                }`}
              >
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{n.title}</p>
                {n.message && <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>}
                <p className="text-[11px] text-ink-300 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
