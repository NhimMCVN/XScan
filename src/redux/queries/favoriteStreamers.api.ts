import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; message?: string; details?: any };
}

export interface FavoriteStreamerInfo {
  _id?: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
}

export interface FavoriteStreamerRecord {
  id?: string;
  streamerId?: string;
  streamer?: FavoriteStreamerInfo;
  createdAt?: string;
}

export interface FavoriteStreamerListData {
  favorites: FavoriteStreamerRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetFavoriteStreamersParams {
  page?: number;
  limit?: number;
}

export const favoriteStreamersApi = createApi({
  reducerPath: 'favoriteStreamersApi',
  tagTypes: ['FavoriteStreamers'],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({
    /** GET /favorite-streamers */
    getFavoriteStreamers: builder.query<
      ApiResponse<FavoriteStreamerListData>,
      GetFavoriteStreamersParams | void
    >({
      query: (params) => ({
        url: '/favorite-streamers',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['FavoriteStreamers'],
    }),

    /** POST /favorite-streamers */
    addFavoriteStreamer: builder.mutation<ApiResponse<FavoriteStreamerRecord>, string>({
      query: (streamerId) => ({
        url: '/favorite-streamers',
        method: 'POST',
        body: { streamerId },
      }),
      invalidatesTags: ['FavoriteStreamers'],
    }),

    /** DELETE /favorite-streamers/{streamerId} */
    removeFavoriteStreamer: builder.mutation<ApiResponse, string>({
      query: (streamerId) => ({
        url: `/favorite-streamers/${encodeURIComponent(streamerId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FavoriteStreamers'],
    }),
  }),
});

export const {
  useGetFavoriteStreamersQuery,
  useAddFavoriteStreamerMutation,
  useRemoveFavoriteStreamerMutation,
} = favoriteStreamersApi;
