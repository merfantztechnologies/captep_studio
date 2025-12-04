// src/redux/slices/toolSlice.js
import { createSlice } from "@reduxjs/toolkit";

const toolSlice = createSlice({
  name: "tool",
  initialState: {
    tools: [],
    listToolOauthCollection:[],
    loading: false,
    error: null,
    toolByIdConfigData: null,
  },
  reducers: {
    setTools: (state, action) => {
      state.tools = action.payload;
    },
    setListToolOauthCollection: (state, action) => {
      state.listToolOauthCollection = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTool: (state, action) => {
      state.tools.push(action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setToolByIdConfigData: (state, action) => {
      state.toolByIdConfigData = action.payload; 
    },
    clearToolByIdConfigData: (state) => {
      state.toolByIdConfigData = null; 
    },
  },
});


// payload actions
export const { setTools,setListToolOauthCollection, addTool, setLoading, setError, setToolByIdConfigData, clearToolByIdConfigData } = toolSlice.actions;

// selectors  states
export const selectListToolOauthCollection = (state) => state.tool.listToolOauthCollection;
export const selectTools = (state) => state.tool.tools;

export default toolSlice.reducer;
