// src/redux/services/toolService.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const toolApi = createApi({
  reducerPath: "toolApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://sakthi:8000/api/v1/tool/",
  }),
  endpoints: (builder) => ({
    // 🔹 Get all tools
    getTools: builder.query({
      query: () => ({
        url: "getNodes",
        method: "GET",
      }),
    }),
    
    getCreatedTools: builder.mutation({
      query: (data) => ({
        url: "getcreatedtools",
        method: "POST",
        body: { ...data },
      }),
    }),
    getToolById: builder.mutation({
      query: (id) => ({
        url: "getToolById", 
        method: "POST",
        body: { id }, 
      }),
    }),
    getIntegrationTools: builder.mutation({
      query: (data) => ({
        url: "getIntegrationTools",
        method: "POST",
        body: { ...data},

      })
    }),
    CreateRegisterTool: builder.mutation({
      query: (data) => ({
        url: "createRegistertool",
        method: "POST",
        body: { ...data},

      })
    }),
  }),
});

export const {
  useGetToolsQuery,
  useGetCreatedToolsMutation ,
  useGetToolByIdMutation,
  useGetIntegrationToolsMutation,
  useCreateRegisterToolMutation
} = toolApi;

export default toolApi;
