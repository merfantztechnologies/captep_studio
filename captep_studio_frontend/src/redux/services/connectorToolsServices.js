// src/redux/services/connectorToolsServices.jsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const connectorToolsApi = createApi({
  reducerPath: 'connectorToolsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://sakthi:8000/api/v1/integration',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token; // auth slice irundha
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // GET: Fetch all connector tools
    getConnectorTools: builder.query({
      query: (userId) => ({
        url: '/get-connectors',
        method: 'POST',
        body: { id: userId },
      }),
    }),

    // POST: Create new connector tool
    createConnectorTool: builder.mutation({
      query: (data) => ({
        url: '/create-connection',
        method: 'POST',
        body: data,
      }),
    }),
    OAuthConnectorTool: builder.mutation({
      query: (data) => ({
        url: '/service',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetConnectorToolsQuery,
  useCreateConnectorToolMutation,
  useOAuthConnectorToolMutation,
} = connectorToolsApi;

export default connectorToolsApi;