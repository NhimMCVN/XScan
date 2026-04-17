import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';

/**
 * Users (api-backend.json):
 * - GET    /users/profile              → UserProfileResponseDTO
 * - GET    /users/profile/completion   → ProfileCompletionDTO
 * - PATCH  /users/profile/update       → UpdateProfileDTO
 * - POST   /users/profile/picture      → multipart, ProfilePictureUploadDTO
 * - POST   /users/profile/cover        → multipart, ProfilePictureUploadDTO
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

/** backend-go_core_dtos.UserProfileResponseDTO */
export interface UserProfile {
  _id?: string;
  email?: string;
  username?: string;
  displayName?: string;
  role?: string;
  bio?: string;
  profilePicture?: string;
  coverImage?: string;
  location?: string;
  streamCategory?: string;
  streamLanguage?: string;
  streamSchedule?: string;
  facebookHandle?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  twitterHandle?: string;
  twitchChannel?: string;
  youtubeChannel?: string;
  website?: string;
  followersCount?: number;
  followingCount?: number;
  totalAll?: number;
  totalViaBank?: number;
  totalViaSystem?: number;
  isActive?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** backend-go_core_dtos.UpdateProfileDTO */
export interface UpdateProfileRequest {
  bio?: string;
  displayName?: string;
  facebookHandle?: string;
  instagramHandle?: string;
  location?: string;
  streamCategory?: string;
  streamLanguage?: string;
  streamSchedule?: string;
  tiktokHandle?: string;
  twitchChannel?: string;
  twitterHandle?: string;
  username?: string;
  website?: string;
  youtubeChannel?: string;
}

/** backend-go_core_dtos.ProfileCompletionDTO */
export interface ProfileCompletion {
  completedFields?: string[];
  missingFields?: string[];
  percentage?: number;
}

/** backend-go_core_dtos.ProfilePictureUploadDTO */
export interface ProfilePictureUpload {
  url?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['UserProfile'],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({
    getProfile: builder.query<ApiResponse<UserProfile>, void>({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      providesTags: ['UserProfile'],
    }),
    getProfileCompletion: builder.query<ApiResponse<ProfileCompletion>, void>({
      query: () => ({
        url: '/users/profile/completion',
        method: 'GET',
      }),
      providesTags: ['UserProfile'],
    }),
    updateProfile: builder.mutation<ApiResponse<UserProfile>, UpdateProfileRequest>({
      query: (body) => ({
        url: '/users/profile/update',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['UserProfile'],
    }),
    uploadProfilePicture: builder.mutation<ApiResponse<ProfilePictureUpload>, FormData>({
      query: (formData) => ({
        url: '/users/profile/picture',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['UserProfile'],
    }),
    uploadCoverImage: builder.mutation<ApiResponse<ProfilePictureUpload>, FormData>({
      query: (formData) => ({
        url: '/users/profile/cover',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['UserProfile'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useGetProfileCompletionQuery,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  useUploadCoverImageMutation,
} = userApi;
