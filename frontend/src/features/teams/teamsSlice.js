import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  items: [],
  current: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  status: 'idle',
  error: null,
};

export const fetchTeams = createAsyncThunk('teams/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/teams', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load teams');
  }
});

export const fetchTeamById = createAsyncThunk('teams/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/teams/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load team');
  }
});

export const createTeam = createAsyncThunk('teams/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/teams', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create team');
  }
});

export const deleteTeam = createAsyncThunk('teams/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/teams/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete team');
  }
});

export const addTeamMembers = createAsyncThunk('teams/addMembers', async ({ teamId, memberIds }, { rejectWithValue }) => {
  try {
    await api.post(`/teams/${teamId}/members`, { memberIds });
    return teamId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add members');
  }
});

export const removeTeamMember = createAsyncThunk('teams/removeMember', async ({ teamId, userId }, { rejectWithValue }) => {
  try {
    await api.delete(`/teams/${teamId}/members/${userId}`);
    return { teamId, userId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove member');
  }
});

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearCurrentTeam(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeamById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        if (state.current) {
          state.current.members = state.current.members.filter((m) => m.id !== action.payload.userId);
        }
      });
  },
});

export const { clearCurrentTeam } = teamsSlice.actions;
export default teamsSlice.reducer;
