import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';

/**
 * Khớp api-backend.json (tag Streamer Applications):
 * - GET  /streamer-applications/my-application
 * - POST /streamer-applications  (body: backend-go_core_dtos.CreateStreamerApplicationDTO)
 * Không có endpoint upload ảnh CCCD trong spec — chỉ JSON.
 */

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

/** Khớp CreateStreamerApplicationDTO — required: channelUrl, contentCategory, description, platform, reasonForApplying */
export interface CreateStreamerApplicationRequest {
  platform: StreamerPlatform;
  channelUrl: string;
  contentCategory: string;
  description: string;
  reasonForApplying: string;
  monthlyViewers?: number;
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

export const {
  useGetMyStreamerApplicationQuery,
  useCreateStreamerApplicationMutation,
} = streamerApplicationApi;
