// src/redux/slices/connectorToolsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  connectorTools: [], // local cache
  loading: false,
  error: null,
};

const connectorToolsSlice = createSlice({
  name: 'connectorTools',
  initialState,
  reducers: {
    setConnectorTools: (state, action) => {
      state.connectorTools = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearConnectorTools: (state) => {
      state.connectorTools = [];
    },
  },
});

// Actions
export const {
  setConnectorTools,
  setLoading,
  setError,
  clearConnectorTools,
} = connectorToolsSlice.actions;

// Selectors
export const selectConnectorTools = (state) => state.connectorTools.connectorTools;
export const selectConnectorToolsLoading = (state) => state.connectorTools.loading;
export const selectConnectorToolsError = (state) => state.connectorTools.error;

export default connectorToolsSlice.reducer;