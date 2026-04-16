import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';
import { walletApi } from './wallet.api';

/**
 * Domain Challenges (OpenAPI `tags: ["Challenges"]`, basePath `/api`):
 * | Method | Path | Mô tả |
 * | POST | /challenges | Donor tạo thử thách; trừ ví ngay (201). |
 * | GET | /challenges/donor/me | Danh sách thử thách donor đã tạo (PaginatedResponse). |
 * | GET | /challenges/streamer/me | Danh sách thử thách streamer nhận (PaginatedResponse). |
 * | GET | /challenges/{id} | Chi tiết theo id. |
 * | POST | /challenges/{id}/accept | Streamer chấp nhận. |
 * | POST | /challenges/{id}/reject | Streamer từ chối — hoàn donor. |
 * | POST | /challenges/{id}/complete | Streamer hoàn thành — chuyển tiền cho streamer. |
 * | POST | /challenges/{id}/fail | Streamer đánh dấu thất bại — hoàn donor. |
 */
export const CHALLENGE_CONTENT_MAX_LENGTH = 1000;

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface CreateChallengeRequest {
  amount: number;
  /** 1…1000 ký tự (theo `CreateChallengeRequest` trong api-backend.json) */
  content: string;
  streamerId: string;
}

/** Dữ liệu challenge từ BE — field có thể mở rộng */
export interface Challenge {
  _id?: string;
  id?: string;
  amount?: number;
  currency?: string;
  content?: string;
  streamerId?: string;
  donorId?: string;
  donor?: { displayName?: string; username?: string; [key: string]: unknown };
  streamer?: { displayName?: string; username?: string; [key: string]: unknown };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PaginatedChallenges {
  data?: Challenge[];
  items?: Challenge[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export const challengesApi = createApi({
  reducerPath: 'challengesApi',
  tagTypes: ['Challenges', 'StreamerChallenges', 'DonorChallenges'],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({
    createChallenge: builder.mutation<ApiResponse<Challenge>, CreateChallengeRequest>({
      query: (body) => ({
        url: '/challenges',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DonorChallenges', 'StreamerChallenges'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(walletApi.util.invalidateTags(['Wallet', 'Transactions']));
        } catch {
          /* ignore */
        }
      },
    }),
    getChallengeById: builder.query<ApiResponse<Challenge>, string>({
      query: (id) => ({
        url: `/challenges/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'Challenges', id }],
    }),
    getMyDonorChallenges: builder.query<
      ApiResponse<PaginatedChallenges>,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/challenges/donor/me',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['DonorChallenges'],
    }),
    getMyStreamerChallenges: builder.query<
      ApiResponse<PaginatedChallenges>,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/challenges/streamer/me',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['StreamerChallenges'],
    }),
    acceptChallenge: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/challenges/${encodeURIComponent(id)}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamerChallenges', 'DonorChallenges', 'Challenges'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(walletApi.util.invalidateTags(['Wallet', 'Transactions']));
        } catch {
          /* ignore */
        }
      },
    }),
    rejectChallenge: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/challenges/${encodeURIComponent(id)}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamerChallenges', 'DonorChallenges', 'Challenges'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(walletApi.util.invalidateTags(['Wallet', 'Transactions']));
        } catch {
          /* ignore */
        }
      },
    }),
    completeChallenge: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/challenges/${encodeURIComponent(id)}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamerChallenges', 'DonorChallenges', 'Challenges'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(walletApi.util.invalidateTags(['Wallet', 'Transactions']));
        } catch {
          /* ignore */
        }
      },
    }),
    failChallenge: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/challenges/${encodeURIComponent(id)}/fail`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamerChallenges', 'DonorChallenges', 'Challenges'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(walletApi.util.invalidateTags(['Wallet', 'Transactions']));
        } catch {
          /* ignore */
        }
      },
    }),
  }),
});

export const {
  useCreateChallengeMutation,
  useGetChallengeByIdQuery,
  useLazyGetChallengeByIdQuery,
  useGetMyDonorChallengesQuery,
  useGetMyStreamerChallengesQuery,
  useAcceptChallengeMutation,
  useRejectChallengeMutation,
  useCompleteChallengeMutation,
  useFailChallengeMutation,
} = challengesApi;
