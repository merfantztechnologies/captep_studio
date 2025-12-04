// src/redux/services/agentService.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const agentApi = createApi({
  reducerPath: "agentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://sakthi:8000/api/v1/agent/",
  }),
  endpoints: (builder) => ({
    // 🔹 Get all agents   
    getAllAgents: builder.mutation({
      query: (data) => ({
        url: "getAllAgents",
        method: "POST",
        body: { ...data },
      }),
    }),
    getAgent: builder.mutation({
      query: (data) => ({
        url: "getAgent",
        method: "POST",
        body: { ...data},
      })
    }),
    getModels: builder.mutation({
      query: (body) =>({
        url: "getmodels",
        method:"GET",
      })
    })
  }),
});

export const {
  useGetAllAgentsMutation ,
  useGetAgentMutation,
  useGetModelsMutation
} = agentApi;

export default agentApi;