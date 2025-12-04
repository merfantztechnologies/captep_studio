import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const workflowApi = createApi({
  reducerPath: "workflowApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://sakthi:8000/api/v1/workflow",
  }),
  endpoints: (builder) => ({
    createWorkflow: builder.mutation({
      query: (data) => ({
        url: "/createworkflow",
        // url: "/createdemoworkflow",
        method: "POST",
        body: { ...data },
      }),
    }),
    getAllWorkflows: builder.query({
      query: (data) => ({
        url: "/getworkflow",
        method: "POST",
        body: { ...data},
      }),
    }),
    getWorkflowById: builder.query({
      query: (data) => ({
        url: "/getworkflowbyid",
        method: "POST",
        body: { ...data},
      }),
    }),
    updateWorkflow: builder.mutation({
      query: (data) => ({
        url: "/update-workflow",
        method: "POST",
        body: { ...data },
      }),
    }),
    triggerAgentSetup: builder.mutation({
      query: (workflowId) => ({
        url: "/testworkflow",
        method: "POST",
        body: { id: workflowId },
      }),
    }),
    runAgentQuery: builder.mutation({
      query: (data) => ({
        url: "/chatbot",
        method: "POST",
        body: { ...data }, 
      }),
    }),
    cancelAgentSetup: builder.mutation({
      query:(data)=>({
        url: "/cancel-bot",
        method:"POST",
        body: {...data},
      })

    })
  }),
});

export const {
  useCreateWorkflowMutation,
  useGetAllWorkflowsQuery,
  useGetWorkflowByIdQuery,
  useUpdateWorkflowMutation,
  useTriggerAgentSetupMutation,
  useRunAgentQueryMutation,
  useCancelAgentSetupMutation,
} = workflowApi;

export default workflowApi;
