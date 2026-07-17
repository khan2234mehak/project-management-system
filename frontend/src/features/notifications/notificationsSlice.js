import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
};

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  await api.patch(`/notifications/${id}/read`);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.patch('/notifications/read-all');
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushRealtimeNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.items.find((i) => i.id === action.payload);
        if (n && !n.is_read) {
          n.is_read = 1;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => (n.is_read = 1));
        state.unreadCount = 0;
      });
  },
});

export const { pushRealtimeNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
