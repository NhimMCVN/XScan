import { createApi } from '@reduxjs/toolkit/query/react'
import { customFetchBase } from './customFetchBase'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code?: string
    message?: string
    details?: any
  }
}

/** Khớp backend-go_core_dtos.UserProfileResponseDTO */
export interface UserProfile {
  _id?: string
  email?: string
  username?: string
  displayName?: string
  role?: string
  bio?: string
  profilePicture?: string
  coverImage?: string
  streamCategory?: string
  streamLanguage?: string
  streamSchedule?: string
  [key: string]: any
}

export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['UserProfile'],
  baseQuery: customFetchBase,
  endpoints: builder => ({
    getProfile: builder.query<ApiResponse<UserProfile>, void>({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      providesTags: ['UserProfile'],
    }),
  }),
})

export const { useGetProfileQuery, useLazyGetProfileQuery } = userApi
