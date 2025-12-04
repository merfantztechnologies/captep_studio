// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// ──────────────────────────────────────────────
// REDUCERS (Slices)
// ──────────────────────────────────────────────
import authReducer from './redux/slices/authSlices';
import workflowReducer from './redux/slices/workflowSlice';
import connectorToolsReducer from './redux/slices/connectorToolsSlice';
import toolReducer from './redux/slices/toolSlice';
import agentReducer from './redux/slices/agentSlice';

// ──────────────────────────────────────────────
// RTK QUERY APIs (Services)
// ──────────────────────────────────────────────
import authApi from './redux/services/authServices';
import workflowApi from './redux/services/workflowServices';
import connectorToolsApi from './redux/services/connectorToolsServices';
import toolApi from './redux/services/toolServices';
import agentApi from './redux/services/agentServices';

// ──────────────────────────────────────────────
// CONFIGURE STORE
// ──────────────────────────────────────────────
const store = configureStore({
  reducer: {
    // ── Auth ──
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,

    // ── Workflow ──
    workflow: workflowReducer,
    [workflowApi.reducerPath]: workflowApi.reducer,

    // ── Connector Tools ──
    connectorTools: connectorToolsReducer,
    [connectorToolsApi.reducerPath]: connectorToolsApi.reducer,
    // ── Tools ──
    tool: toolReducer,
    [toolApi.reducerPath]: toolApi.reducer,
    // ── Agents ──
    agent: agentReducer,
    [agentApi.reducerPath]: agentApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // if using non-serializable data
    })
      .concat(authApi.middleware)
      .concat(workflowApi.middleware)
      .concat(connectorToolsApi.middleware)
      .concat(toolApi.middleware)
      .concat(agentApi.middleware),
});
// ──────────────────────────────────────────────
// SETUP RTK QUERY LISTENERS
// ──────────────────────────────────────────────
setupListeners(store.dispatch);

export default store;