import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Wifi, Clock, Monitor, Globe, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchLoginMonitoring } from '../../features/dashboard/dashboardSlice';
import StatCard from '../../components/common/StatCard';
import { PageSpinner } from '../../components/common/Feedback';
import Avatar from '../../components/common/Avatar';
import api from '../../utils/api';

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function formatDuration(secs) {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

function UserHistoryRow({ user }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (history) { setExpanded((e) => !e); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${user.id}/login-history?limit=10`);
      setHistory(data.data);
      setExpanded(true);
    } catch { setHistory([]); setExpanded(true); }
    finally { setLoading(false); }
  };

  return (
    <>
      <tr className="hover:bg-ink-50 dark:hover:bg-ink-700/30 cursor-pointer" onClick={loadHistory}>
        <td className="px-5 py-3">
          <Link to={`/users/${user.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Avatar name={user.name} size="sm" />
            <div>
              <p className="font-medium text-ink-800 dark:text-ink-100">{user.name}</p>
              <p className="text-xs text-ink-400">{user.email}</p>
            </div>
          </Link>
        </td>
        <td className="px-5 py-3 text-ink-500 dark:text-ink-300 text-sm">{formatDate(user.last_login_at)}</td>
        <td className="px-5 py-3">
          <button className="flex items-center gap-1 text-xs text-signal-500 hover:underline">
            {loading ? 'Loading…' : expanded ? <><ChevronUp size={14}/> Hide</> : <><ChevronDown size={14}/> View history</>}
          </button>
        </td>
      </tr>
      {expanded && history && (
        <tr>
          <td colSpan={3} className="px-5 pb-3 pt-0 bg-ink-50 dark:bg-ink-800/50">
            {history.length === 0 ? (
              <p className="text-xs text-ink-400 py-2">No login history found.</p>
            ) : (
              <div className="rounded-lg border border-ink-200 dark:border-ink-700 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-ink-100 dark:bg-ink-700 text-ink-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Login Time</th>
                      <th className="text-left px-3 py-2 font-medium">Logout Time</th>
                      <th className="text-left px-3 py-2 font-medium">Duration</th>
                      <th className="text-left px-3 py-2 font-medium">IP Address</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                    {history.map((h) => (
                      <tr key={h.id} className="bg-white dark:bg-ink-800">
                        <td className="px-3 py-2 text-ink-600 dark:text-ink-300 flex items-center gap-1.5">
                          <Clock size={11} className="text-ink-300" />
                          {formatDate(h.login_at)}
                        </td>
                        <td className="px-3 py-2 text-ink-500 dark:text-ink-400">{formatDate(h.logout_at)}</td>
                        <td className="px-3 py-2 text-ink-500 dark:text-ink-400">{formatDuration(h.session_duration_seconds)}</td>
                        <td className="px-3 py-2 text-ink-500 dark:text-ink-400 flex items-center gap-1">
                          <Globe size={11} className="text-ink-300" />{h.ip_address || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {h.was_successful
                            ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={11}/> Success</span>
                            : <span className="flex items-center gap-1 text-red-500"><XCircle size={11}/> Failed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function LoginMonitoring() {
  const dispatch = useDispatch();
  const { loginMonitoring } = useSelector((state) => state.dashboard);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => { dispatch(fetchLoginMonitoring()); }, [dispatch]);

  if (!loginMonitoring) return <PageSpinner />;

  const dailyData = loginMonitoring.dailyStats.map((d) => ({ day: d.day?.slice(5), logins: d.logins, users: d.unique_users }));
  const weeklyData = loginMonitoring.weeklyStats.map((d) => ({ week: `W${d.week?.split('-')[1] || d.week}`, logins: d.logins, users: d.unique_users }));
  const monthlyData = loginMonitoring.monthlyStats.map((d) => ({ month: d.month, logins: d.logins, users: d.unique_users }));

  const chartData = activeTab === 'daily' ? dailyData : activeTab === 'weekly' ? weeklyData : monthlyData;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Login Monitoring</h1>
        <p className="text-sm text-ink-400 mt-1">System-wide authentication activity and user login history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={loginMonitoring.totalUsers} icon={Users} accent="signal" />
        <StatCard label="Active Users" value={loginMonitoring.activeUsers} icon={UserCheck} accent="green" />
        <StatCard label="Online Now" value={loginMonitoring.onlineUsers} icon={Wifi} accent="blue" />
      </div>

      {/* Chart with tab switching */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-ink-800 dark:text-white">Login Activity</h3>
          <div className="flex gap-1 bg-ink-100 dark:bg-ink-700 rounded-lg p-1">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  activeTab === t ? 'bg-white dark:bg-ink-600 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500 hover:text-ink-800'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
              <XAxis dataKey={activeTab === 'daily' ? 'day' : activeTab === 'weekly' ? 'week' : 'month'} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="logins" fill="#E0700D" radius={[4, 4, 0, 0]} name="Total Logins" />
              <Bar dataKey="users" fill="#3D7FE0" radius={[4, 4, 0, 0]} name="Unique Users" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-sm text-ink-300">No data yet</div>
        )}
      </div>

      {/* Per-user login history table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-800 dark:text-white">User Login History</h3>
            <p className="text-xs text-ink-400 mt-0.5">Click a row to expand full session history with date, time & IP</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-ink-50 dark:bg-ink-700/50 text-ink-400 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium">User</th>
              <th className="text-left px-5 py-2.5 font-medium">Last Login</th>
              <th className="text-left px-5 py-2.5 font-medium">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50 dark:divide-ink-700">
            {loginMonitoring.lastLogins.map((u) => (
              <UserHistoryRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
