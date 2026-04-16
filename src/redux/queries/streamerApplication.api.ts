import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
}

export type StreamerPlatform = 'twitch' | 'youtube' | 'kick' | 'facebook' | 'other';

export interface CreateStreamerApplicationRequest {
  platform: StreamerPlatform;
  channelUrl: string;
  contentCategory: string;
  monthlyViewers: number;
  description: string;
  reasonForApplying: string;
  referrer?: string;
}

export interface StreamerApplicationResponse {
  _id?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  email?: string;
  platform?: StreamerPlatform | string;
  channelUrl?: string;
  contentCategory?: string;
  monthlyViewers?: number;
  description?: string;
  reasonForApplying?: string;
  referrer?: string;
  status?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const streamerApplicationApi = createApi({
  reducerPath: 'streamerApplicationApi',
  tagTypes: ['StreamerApplication'],
  baseQuery: customFetchBase,
  endpoints: builder => ({
    getMyStreamerApplication: builder.query<ApiResponse<StreamerApplicationResponse>, void>({
      query: () => ({
        url: '/streamer-applications/my-application',
        method: 'GET',
      }),
      providesTags: ['StreamerApplication'],
    }),
    createStreamerApplication: builder.mutation<ApiResponse<StreamerApplicationResponse>, CreateStreamerApplicationRequest>({
      query: body => ({
        url: '/streamer-applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StreamerApplication'],
    }),
  }),
});

export const { useGetMyStreamerApplicationQuery, useCreateStreamerApplicationMutation } = streamerApplicationApi;
