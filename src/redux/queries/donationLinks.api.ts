import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';

export interface ThemeDTO {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface SocialMediaLinkItem {
  platform?: string;
  url?: string;
  [key: string]: unknown;
}

export interface DonationLinkItem {
  id?: string;
  _id?: string;
  streamerId?: string;
  title?: string;
  customUrl?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  isFeatured?: boolean;
  isExpired?: boolean;
  allowAnonymous?: boolean;
  currency?: string;
  qrCodeUrl?: string;
  expiresAt?: string;
  lastDonationAt?: string;
  /** socialMediaLinks trả về từ BE (mảng string URL) */
  socialMediaLinks?: string[];
  theme?: ThemeDTO;
  totalAmount?: number;
  totalDonations?: number;
  pageViews?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** POST /donation-links — CreateDonationLinkDTO */
export interface CreateDonationLinkBody {
  title: string;
  customUrl: string;
  description?: string;
  allowAnonymous?: boolean;
  isFeatured?: boolean;
  expiresAt?: string;
  /** Mảng URL string theo UpdateSocialMediaDTO */
  socialMediaLinks?: string[];
  theme: ThemeDTO;
}

/** PUT /donation-links/{id} — UpdateDonationLinkDTO */
export interface UpdateDonationLinkBody {
  title?: string;
  customUrl?: string;
  description?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  allowAnonymous?: boolean;
  expiresAt?: string;
  /** Mảng URL string theo UpdateSocialMediaDTO */
  socialMediaLinks?: string[];
}

/** GET /donation-links/check-url — URLAvailabilityDTO */
export interface URLAvailabilityDTO {
  isAvailable: boolean;
  url: string;
}

export interface CheckUrlResponse {
  success: boolean;
  data?: URLAvailabilityDTO;
  message?: string;
}

/** PATCH /donation-links/{id}/social-media — UpdateSocialMediaDTO (mảng string URL) */
export interface UpdateSocialMediaBody {
  socialMediaLinks: string[];
}

/** PATCH /donation-links/{id}/theme — UpdateThemeDTO */
export interface UpdateThemeBody {
  theme: ThemeDTO;
}

/** GET /donation-links/stats — DonationLinkStatsDTO */
export interface DonationLinkStatsDTO {
  totalLinks?: number;
  activeLinks?: number;
  totalDonations?: number;
  totalAmount?: number;
  totalPageViews?: number;
  averagePerLink?: number;
}

/** GET /donation-links/{id}/analytics — DonationLinkAnalyticsDTO */
export interface DonationLinkAnalyticsDTO {
  linkId?: string;
  pageViews?: number;
  totalDonations?: number;
  totalAmount?: number;
  averageDonation?: number;
  conversionRate?: number;
  donationsByDay?: any[];
  recentDonations?: any[];
}

export interface DonationLinksListResponse {
  success: boolean;
  message?: string;
  data?: {
    links?: DonationLinkItem[];
    pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
  };
}

export interface DonationLinkResponse {
  success: boolean;
  data?: DonationLinkItem;
  message?: string;
}

export interface DonationLinkStatsResponse {
  success: boolean;
  data?: DonationLinkStatsDTO;
  message?: string;
}

export interface DonationLinkAnalyticsResponse {
  success: boolean;
  data?: DonationLinkAnalyticsDTO;
  message?: string;
}

export const donationLinksApi = createApi({
  reducerPath: 'donationLinksApi',
  tagTypes: ['DonationLinks', 'DonationLinkStats'],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({
    /** GET /donation-links */
    getDonationLinks: builder.query<
      DonationLinksListResponse,
      { page?: number; limit?: number; search?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/donation-links',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['DonationLinks'],
    }),

    /** GET /donation-links/stats */
    getDonationLinkStats: builder.query<DonationLinkStatsResponse, void>({
      query: () => ({
        url: '/donation-links/stats',
        method: 'GET',
      }),
      providesTags: ['DonationLinkStats'],
    }),

    /** GET /donation-links/check-url?url=... */
    checkDonationLinkUrl: builder.query<CheckUrlResponse, string>({
      query: (url) => ({
        url: '/donation-links/check-url',
        method: 'GET',
        params: { url },
      }),
    }),

    /** GET /donation-links/{id} */
    getDonationLink: builder.query<DonationLinkResponse, string>({
      query: (id) => ({
        url: `/donation-links/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: ['DonationLinks'],
    }),

    /** GET /donation-links/{id}/analytics */
    getDonationLinkAnalytics: builder.query<DonationLinkAnalyticsResponse, string>({
      query: (id) => ({
        url: `/donation-links/${encodeURIComponent(id)}/analytics`,
        method: 'GET',
      }),
    }),

    /** POST /donation-links */
    createDonationLink: builder.mutation<DonationLinkResponse, CreateDonationLinkBody>({
      query: (body) => ({
        url: '/donation-links',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DonationLinks', 'DonationLinkStats'],
    }),

    /** PUT /donation-links/{id} */
    updateDonationLink: builder.mutation<DonationLinkResponse, { id: string; body: UpdateDonationLinkBody }>({
      query: ({ id, body }) => ({
        url: `/donation-links/${encodeURIComponent(id)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DonationLinks'],
    }),

    /** DELETE /donation-links/{id} */
    deleteDonationLink: builder.mutation<{ success: boolean; message?: string }, string>({
      query: (id) => ({
        url: `/donation-links/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DonationLinks', 'DonationLinkStats'],
    }),

    /** PATCH /donation-links/{id}/toggle-status */
    toggleDonationLinkStatus: builder.mutation<DonationLinkResponse, string>({
      query: (id) => ({
        url: `/donation-links/${encodeURIComponent(id)}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DonationLinks'],
    }),

    /** PATCH /donation-links/{id}/set-default */
    setDefaultDonationLink: builder.mutation<DonationLinkResponse, string>({
      query: (id) => ({
        url: `/donation-links/${encodeURIComponent(id)}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DonationLinks'],
    }),

    /** PATCH /donation-links/{id}/social-media */
    updateDonationLinkSocialMedia: builder.mutation<
      DonationLinkResponse,
      { id: string; body: UpdateSocialMediaBody }
    >({
      query: ({ id, body }) => ({
        url: `/donation-links/${encodeURIComponent(id)}/social-media`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['DonationLinks'],
    }),

    /** PATCH /donation-links/{id}/theme */
    updateDonationLinkTheme: builder.mutation<
      DonationLinkResponse,
      { id: string; body: UpdateThemeBody }
    >({
      query: ({ id, body }) => ({
        url: `/donation-links/${encodeURIComponent(id)}/theme`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['DonationLinks'],
    }),
  }),
});

export const {
  useGetDonationLinksQuery,
  useGetDonationLinkStatsQuery,
  useLazyCheckDonationLinkUrlQuery,
  useGetDonationLinkQuery,
  useLazyGetDonationLinkAnalyticsQuery,
  useGetDonationLinkAnalyticsQuery,
  useCreateDonationLinkMutation,
  useUpdateDonationLinkMutation,
  useDeleteDonationLinkMutation,
  useToggleDonationLinkStatusMutation,
  useSetDefaultDonationLinkMutation,
  useUpdateDonationLinkSocialMediaMutation,
  useUpdateDonationLinkThemeMutation,
} = donationLinksApi;
