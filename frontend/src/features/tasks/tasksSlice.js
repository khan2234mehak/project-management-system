import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const initialState = {
  board: { backlog: [], todo: [], in_progress: [], review: [], done: [] },
  current: null,
  searchResults: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  status: 'idle',
  error: null,
};

export const fetchBoard = createAsyncThunk('tasks/fetchBoard', async ({ projectId, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load board');
  }
});

export const fetchTaskById = createAsyncThunk('tasks/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/tasks/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load task');
  }
});

export const createTask = createAsyncThunk('tasks/create', async ({ projectId, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
    return { ...data.data, status: payload.status || 'backlog', priority: payload.priority || 'medium' };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    await api.put(`/tasks/${id}`, payload);
    return { id, ...payload };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update task');
  }
});

export const moveTask = createAsyncThunk(
  'tasks/move',
  async ({ id, status, position, fromStatus }, { rejectWithValue }) => {
    try {
      await api.patch(`/tasks/${id}/move`, { status, position });
      return { id, status, position, fromStatus };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to move task');
    }
  }
);

export const deleteTask = createAsyncThunk('tasks/delete', async ({ id, status }, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${id}`);
    return { id, status };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete task');
  }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearCurrentTask(state) {
      state.current = null;
    },
    // Optimistic local move — called immediately on drop, before the API confirms.
    moveTaskLocal(state, action) {
      const { id, fromStatus, toStatus, toIndex } = action.payload;
      const sourceList = state.board[fromStatus];
      const taskIndex = sourceList.findIndex((t) => t.id === id);
      if (taskIndex === -1) return;
      const [task] = sourceList.splice(taskIndex, 1);
      task.status = toStatus;
      state.board[toStatus].splice(toIndex, 0, task);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.board = action.payload;
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const status = action.payload.status || 'backlog';
        if (state.board[status]) state.board[status].push(action.payload);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        if (state.board[status]) {
          state.board[status] = state.board[status].filter((t) => t.id !== id);
        }
      });
  },
});

export const { clearCurrentTask, moveTaskLocal } = tasksSlice.actions;
export default tasksSlice.reducer;
export { STATUSES };
