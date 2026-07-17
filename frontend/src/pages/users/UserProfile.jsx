import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Camera, Clock, Activity as ActivityIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Avatar from '../../components/common/Avatar';
import { PageSpinner, EmptyState } from '../../components/common/Feedback';
import { updateLocalUser } from '../../features/auth/authSlice';
import { useAuth } from '../../hooks/useAuth';

export default function UserProfile() {
  const { id } = useParams(); // undefined on /profile (self view)
  const dispatch = useDispatch();
  const { user: currentUser } = useAuth();
  const targetId = id || currentUser.id;
  const isSelf = Number(targetId) === currentUser.id;

  const [profile, setProfile] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('activity');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', jobTitle: '' });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [profileRes, loginRes, activityRes] = await Promise.all([
      api.get(`/users/${targetId}`),
      api.get(`/users/${targetId}/login-history`, { params: { limit: 20 } }),
      api.get(`/users/${targetId}/activity`, { params: { limit: 30 } }),
    ]);
    setProfile(profileRes.data.data);
    setForm({ name: profileRes.data.data.name, jobTitle: profileRes.data.data.job_title || '' });
    setLoginHistory(loginRes.data.data);
    setActivity(activityRes.data.data);
  };

  useEffect(() => { load(); }, [targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const res = await api.post(`/users/${targetId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, avatar_url: res.data.data.avatarUrl }));
      if (isSelf) dispatch(updateLocalUser({ avatar_url: res.data.data.avatarUrl }));
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.put(`/users/${targetId}`, form);
      setProfile((p) => ({ ...p, ...form }));
      if (isSelf) dispatch(updateLocalUser({ name: form.name, job_title: form.jobTitle }));
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (!profile) return <PageSpinner />;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="relative shrink-0">
          <Avatar name={profile.name} src={profile.avatar_url} size="lg" />
          {isSelf && (
            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-signal-500 flex items-center justify-center text-white cursor-pointer hover:bg-signal-600">
              <Camera size={13} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          )}
        </div>

        <div className="flex-1">
          {editing ? (
            <div className="space-y-2 max-w-sm">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              <input className="input" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Job title" />
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="btn-primary !py-1.5 text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary !py-1.5 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-white">{profile.name}</h1>
              <p className="text-sm text-ink-400">{profile.job_title || 'No job title set'}</p>
              <p className="text-sm text-ink-400">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300 font-medium capitalize">
                  {profile.role.replace('_', ' ')}
                </span>
                {isSelf && (
                  <button onClick={() => setEditing(true)} className="text-xs text-signal-500 hover:underline">Edit profile</button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-right text-xs text-ink-400 shrink-0">
          <p>Last login</p>
          <p className="font-medium text-ink-600 dark:text-ink-200">{profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'Never'}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-ink-100 dark:border-ink-700">
        <TabButton active={tab === 'activity'} onClick={() => setTab('activity')} icon={ActivityIcon} label="Activity Timeline" />
        <TabButton active={tab === 'logins'} onClick={() => setTab('logins')} icon={Clock} label="Login History" />
      </div>

      {tab === 'activity' && (
        <div className="card p-5">
          {activity.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity yet" />
          ) : (
            <ul className="divide-y divide-ink-50 dark:divide-ink-700">
              {activity.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-ink-600 dark:text-ink-300">{a.description}</span>
                  <span className="text-xs text-ink-300 shrink-0 ml-3">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'logins' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 dark:bg-ink-700/50 text-ink-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Login</th>
                <th className="text-left px-4 py-2.5 font-medium">Logout</th>
                <th className="text-left px-4 py-2.5 font-medium">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50 dark:divide-ink-700">
              {loginHistory.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5">{new Date(l.login_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{l.logout_at ? new Date(l.logout_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2.5">{l.session_duration_seconds ? `${Math.round(l.session_duration_seconds / 60)}m` : '—'}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-ink-400">{l.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loginHistory.length === 0 && <EmptyState icon={Clock} title="No login history" />}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-signal-500 text-signal-600' : 'border-transparent text-ink-400 hover:text-ink-600'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
