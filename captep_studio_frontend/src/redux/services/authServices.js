import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://sakthi:8000/api/v1/auth/',
    }),
    endpoints: (builder) => ({
        getLogin: builder.mutation({
            query: (credentials) => ({
                url: "login",
                method: "POST",
                body: { ...credentials }
            }),
        }),
        getSignup: builder.mutation({
            query: (SignupData) => ({
                url: "signup",
                method: "POST",
                body: { ...SignupData }
            })
        })
    })
})

export const { useGetLoginuseGetLoginMutation, useGetSignupMutation } = authApi;

export default authApi;