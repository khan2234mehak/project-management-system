import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

import Dashboard from './pages/dashboard/Dashboard';
import Projects from './pages/projects/Projects';
import ProjectDetail from './pages/projects/ProjectDetail';
import TaskDetail from './pages/tasks/TaskDetail';
import Teams from './pages/teams/Teams';
import TeamDetail from './pages/teams/TeamDetail';
import Users from './pages/users/Users';
import UserProfile from './pages/users/UserProfile';
import LoginMonitoring from './pages/admin/LoginMonitoring';
import CalendarPage from './pages/calendar/Calendar';

import { fetchMe } from './features/auth/authSlice';
import { PageSpinner } from './components/common/Feedback';

export default function App() {
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    if (accessToken && !user) dispatch(fetchMe());
  }, [accessToken, user, dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (accessToken && !user) return <PageSpinner />;

  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/users/:id" element={<UserProfile />} />

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/users" element={<Users />} />
            <Route path="/admin/monitoring" element={<LoginMonitoring />} />
          </Route>
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
