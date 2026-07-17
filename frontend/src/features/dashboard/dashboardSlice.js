import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  summary: null,
  charts: null,
  loginMonitoring: null,
  status: 'idle',
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/dashboard/summary');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchDashboardCharts = createAsyncThunk('dashboard/fetchCharts', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/dashboard/charts');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load charts');
  }
});

export const fetchLoginMonitoring = createAsyncThunk('dashboard/fetchLoginMonitoring', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/dashboard/login-monitoring');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load login monitoring');
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchDashboardCharts.fulfilled, (state, action) => {
        state.charts = action.payload;
      })
      .addCase(fetchLoginMonitoring.fulfilled, (state, action) => {
        state.loginMonitoring = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
