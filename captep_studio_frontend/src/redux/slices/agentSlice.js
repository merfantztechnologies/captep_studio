// src/redux/slices/agentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  agents: [],                    // Full list of agents from DB
  selectedAgent: null,           // Agent shown in overview
  loading: false,                // For UI spinners
  error: null,                   // API errors
  searchTerm: "",                // Client-side search
};

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    // List
    setAgents: (state, action) => {
      state.agents = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Selected
    setSelectedAgent: (state, action) => {
      state.selectedAgent = action.payload;
    },

    // Loading & Error
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  setAgents,
  clearAgents,
  setSelectedAgent,
  clearSelectedAgent,
  setSearchTerm,
  setLoading,
  setError,
} = agentSlice.actions;

// Export selectors
export const selectAgents = (state) => state.agent.agents;
export const selectSelectedAgent = (state) => state.agent.selectedAgent;
export const selectAgentLoading = (state) => state.agent.loading;
export const selectAgentError = (state) => state.agent.error;
export const selectSearchTerm = (state) => state.agent.searchTerm;

export default agentSlice.reducer;