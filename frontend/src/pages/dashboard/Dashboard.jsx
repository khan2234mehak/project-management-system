import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FolderKanban, CheckCircle2, Clock, AlertOctagon, Users, ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import { fetchDashboardSummary, fetchDashboardCharts } from '../../features/dashboard/dashboardSlice';
import StatCard from '../../components/common/StatCard';
import { PageSpinner } from '../../components/common/Feedback';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  planning: '#8A92A6', in_progress: '#E0700D', testing: '#9456D6', completed: '#1F9E6B',
};
const PRIORITY_COLORS = { low: '#5B9E6B', medium: '#3D7FE0', high: '#E0700D', critical: '#D8395B' };

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user, isAdmin } = useAuth();
  const { summary, charts, status } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchDashboardCharts());
  }, [dispatch]);

  if (status === 'loading' && !summary) return <PageSpinner />;
  if (!summary) return null;

  const projectStatusData = (charts?.projectProgress || []).map((p) => ({
    name: p.status.replace('_', ' '),
    value: p.count,
    color: STATUS_COLORS[p.status] || '#8A92A6',
  }));

  const priorityData = (charts?.priorityDistribution || []).map((p) => ({
    name: p.priority,
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || '#8A92A6',
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-ink-400 mt-1">Here's what's happening across your workspace.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={summary.projects.active} icon={FolderKanban} accent="signal" />
        <StatCard label="Completed Tasks" value={summary.tasks.completed} icon={CheckCircle2} accent="green" />
        <StatCard label="Pending Tasks" value={summary.tasks.pending} icon={Clock} accent="blue" />
        <StatCard label="Overdue Tasks" value={summary.tasks.overdue} icon={AlertOctagon} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Total Projects" value={summary.projects.total} icon={FolderKanban} accent="signal" />
        <StatCard label="Total Tasks" value={summary.tasks.total} icon={CheckCircle2} accent="blue" />
        <StatCard label="Team Members" value={summary.teamMembers} icon={Users} accent="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-800 dark:text-white mb-4">Project Progress</h3>
          {projectStatusData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {projectStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-800 dark:text-white mb-4">Task Priority Distribution</h3>
          {priorityData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-ink-800 dark:text-white mb-4">Monthly Task Completion</h3>
          {charts?.monthlyCompletion?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={charts.monthlyCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#E0700D" strokeWidth={2.5} name="Completed" />
                <Line type="monotone" dataKey="total" stroke="#8A92A6" strokeWidth={2} strokeDasharray="4 4" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>


      {/* Admin quick-access */}
      {isAdmin && (
        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                <ShieldCheck size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-800 dark:text-white text-sm">Admin Panel</h3>
                <p className="text-xs text-ink-400">Monitor user login activity and manage users</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/monitoring" className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Login Monitoring
              </Link>
              <Link to="/users" className="text-xs px-3 py-1.5 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-colors dark:bg-ink-700 dark:text-ink-200">
                Manage Users
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-800 dark:text-white mb-4">Recent Activity</h3>
        {summary.recentActivity?.length ? (
          <ul className="divide-y divide-ink-50 dark:divide-ink-700">
            {summary.recentActivity.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                <span className="text-ink-600 dark:text-ink-200">
                  <strong className="text-ink-800 dark:text-white">{a.user_name || 'System'}</strong> {a.description}
                </span>
                <span className="text-xs text-ink-300 shrink-0 ml-3">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-400 py-4 text-center">No recent activity yet.</p>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-60 flex items-center justify-center text-sm text-ink-300">Not enough data yet</div>;
}
