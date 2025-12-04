import { createSlice } from "@reduxjs/toolkit";

const workflowSlice = createSlice({
  name: "workflow",
  initialState: {
    workflows: [], 
  },
  reducers: {

    setWorkflows: (state, action) => {
      const { workflows } = action.payload;
      state.workflows = workflows;
    },
  },
});

export const { setWorkflows } = workflowSlice.actions;

export const selectCurrentWorkflows = (state) => state?.workflow?.workflows;

export default workflowSlice.reducer;
