import { useSelector } from 'react-redux';

export function useAuth() {
  const { user, accessToken, status, error } = useSelector((state) => state.auth);
  return {
    user,
    isAuthenticated: Boolean(accessToken && user),
    isAdmin: user?.role === 'admin',
    isProjectManager: user?.role === 'project_manager',
    isTeamMember: user?.role === 'team_member',
    // All logged-in users can create projects and teams
    canManage: Boolean(user),
    // Only admin/PM can do admin-level things like delete others' projects, manage users
    canAdminManage: user?.role === 'admin' || user?.role === 'project_manager',
    status,
    error,
  };
}
