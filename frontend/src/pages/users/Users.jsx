import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Search, ShieldOff, ShieldCheck, Trash2, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchUsers, toggleBlockUser, changeUserRole, deleteUser } from '../../features/users/usersSlice';
import Avatar from '../../components/common/Avatar';
import { SkeletonRow, EmptyState } from '../../components/common/Feedback';
import Pagination from '../../components/common/Pagination';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuth } from '../../hooks/useAuth';

const ROLE_OPTIONS = ['admin', 'project_manager', 'team_member'];

export default function Users() {
  const dispatch = useDispatch();
  const { user: currentUser } = useAuth();
  const { items, pagination, status } = useSelector((state) => state.users);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    dispatch(fetchUsers({ search: debouncedSearch, role: roleFilter, status: statusFilter, page, limit: 15 }));
  }, [dispatch, debouncedSearch, roleFilter, statusFilter, page]);

  const handleToggleBlock = async (u) => {
    const result = await dispatch(toggleBlockUser({ id: u.id, blocked: !u.is_blocked }));
    if (toggleBlockUser.fulfilled.match(result)) {
      toast.success(u.is_blocked ? 'User unblocked' : 'User blocked');
    }
  };

  const handleRoleChange = async (u, role) => {
    const result = await dispatch(changeUserRole({ id: u.id, role }));
    if (changeUserRole.fulfilled.match(result)) toast.success('Role updated');
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    const result = await dispatch(deleteUser(u.id));
    if (deleteUser.fulfilled.match(result)) toast.success('User deleted');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Users</h1>
        <p className="text-sm text-ink-400 mt-1">{pagination.total} registered users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className="input !pl-9" placeholder="Search users…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input sm:w-44" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
        <select className="input sm:w-36" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 dark:bg-ink-700/50 text-ink-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Role</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Last Login</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50 dark:divide-ink-700">
            {status === 'loading' && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={5}><SkeletonRow /></td></tr>
            ))}

            {status !== 'loading' && items.map((u) => (
              <tr key={u.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-700/30">
                <td className="px-4 py-3">
                  <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatar_url} size="sm" />
                    <div>
                      <p className="font-medium text-ink-800 dark:text-ink-100">{u.name}</p>
                      <p className="text-xs text-ink-400">{u.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <select
                    className="input !py-1 !text-xs w-auto"
                    value={u.role}
                    disabled={u.id === currentUser.id}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ink-400 text-xs">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_blocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {u.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {u.id !== currentUser.id && (
                      <>
                        <button onClick={() => handleToggleBlock(u)} className="text-ink-400 hover:text-signal-500" title={u.is_blocked ? 'Unblock' : 'Block'}>
                          {u.is_blocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                        </button>
                        <button onClick={() => handleDelete(u)} className="text-ink-400 hover:text-priority-critical" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {status !== 'loading' && items.length === 0 && (
          <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your search or filters." />
        )}
      </div>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
    </div>
  );
}
