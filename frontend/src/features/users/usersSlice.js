import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  items: [],
  current: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  status: 'idle',
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load users');
  }
});

export const toggleBlockUser = createAsyncThunk('users/toggleBlock', async ({ id, blocked }, { rejectWithValue }) => {
  try {
    await api.patch(`/users/${id}/block`, { blocked });
    return { id, blocked };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update user');
  }
});

export const changeUserRole = createAsyncThunk('users/changeRole', async ({ id, role }, { rejectWithValue }) => {
  try {
    await api.patch(`/users/${id}/role`, { role });
    return { id, role };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update role');
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/users/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete user');
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        const user = state.items.find((u) => u.id === action.payload.id);
        if (user) user.is_blocked = action.payload.blocked ? 1 : 0;
      })
      .addCase(changeUserRole.fulfilled, (state, action) => {
        const user = state.items.find((u) => u.id === action.payload.id);
        if (user) user.role = action.payload.role;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
      });
  },
});

export default usersSlice.reducer;
