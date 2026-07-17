import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectsReducer from '../features/projects/projectsSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import teamsReducer from '../features/teams/teamsSlice';
import usersReducer from '../features/users/usersSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import uiReducer from '../features/dashboard/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    teams: teamsReducer,
    users: usersReducer,
    notifications: notificationsReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
});
