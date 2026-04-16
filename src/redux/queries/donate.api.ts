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

export interface StreamerProfile {
  _id?: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  streamCategory?: string;
  totalAll?: number;
  totalViaSystem?: number;
  [key: string]: any;
}

export interface StreamerDiscoveryData {
  streamers: StreamerProfile[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Một số BE trả thêm thống kê toàn hệ thống trong response discover */
  totalPlatformDonations?: number;
  platformDonationTotal?: number;
  totalDonationsVolume?: number;
  donationsToday?: number;
  donationsLast30Days?: number;
  donationsMonth?: number;
}

/** GET /donations/donor | /donations/streamer — phần tử trong data có thể là Donation model */
export interface DonationRecord {
  id?: string;
  _id?: string;
  amount?: number;
  netAmount?: number;
  streamerId?: string;
  donationLinkId?: string;
  message?: string;
  status?: string;
  isAnonymous?: boolean;
  paymentMethod?: string;
  createdAt?: string;
  currency?: string;
  streamer?: { displayName?: string; username?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface PaginatedDonations {
  data?: DonationRecord[];
  items?: DonationRecord[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface DiscoverStreamersParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

/** POST /donations — CreateDonationDTO */
export interface CreateDonationRequest {
  amount: number;
  streamerId: string;
  donationLinkId: string;
  message?: string;
  isAnonymous?: boolean;
  /** OpenAPI: backend-go_core_model.PaymentMethod */
  paymentMethod: 'wallet' | 'bank_transfer' | 'qrbank';
  metadata?: Record<string, unknown>;
}

/** POST /donations/qrbank — core_controller.donationQRRequest */
export interface DonationQrBankRequest {
  amount: number;
  streamerId: string;
  donationLinkId: string;
  message: string;
}

/** Dữ liệu trả về từ BE sau khi generate QR */
export interface DonationQrBankResponse {
  qrCodeUrl?: string;
  qrUrl?: string;
  imageUrl?: string;
  transferContent?: string;
  content?: string;
  /** Nội dung chuyển khoản (VietQR addInfo) */
  addInfo?: string;
  hash?: string;
  amount?: number;
  bankName?: string;
  bankShortName?: string;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  depositCode?: string;
  currency?: string;
  message?: string;
  status?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

/** GET /donations/qrbank/me — QR donation record */
export interface QrDonationRecord {
  id?: string;
  _id?: string;
  hash?: string;
  amount?: number;
  message?: string;
  streamerId?: string;
  donationLinkId?: string;
  status?: string;
  createdAt?: string;
  expiresAt?: string;
  transferContent?: string;
  addInfo?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  qrCodeUrl?: string;
  [key: string]: unknown;
}

/** GET /donations/qrbank/{hash} — thông tin QR donation theo hash */
export interface QrDonationInfoResponse {
  hash?: string;
  amount?: number;
  streamerId?: string;
  donationLinkId?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  expiresAt?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  addInfo?: string;
  qrCodeUrl?: string;
  [key: string]: unknown;
}

export const donateApi = createApi({
  reducerPath: 'donateApi',
  tagTypes: ['Streamers', 'Donations', 'DonorDonations', 'StreamerDonations', 'QrDonations'],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({
    discoverStreamers: builder.query<
      ApiResponse<StreamerDiscoveryData>,
      DiscoverStreamersParams | void
    >({
      query: (params) => ({
        url: '/users/discover/streamers',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['Streamers'],
    }),

    /** GET /donations/donor */
    getDonorDonations: builder.query<
      {
        success: boolean;
        data?: DonationRecord[];
        meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/donations/donor',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['DonorDonations'],
    }),

    /** GET /donations/streamer */
    getStreamerDonations: builder.query<
      {
        success: boolean;
        data?: DonationRecord[];
        meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/donations/streamer',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['StreamerDonations'],
    }),

    /** GET /donations/{id} */
    getDonation: builder.query<ApiResponse<DonationRecord>, string>({
      query: (id) => ({
        url: `/donations/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: ['Donations'],
    }),

    /** POST /donations */
    createDonation: builder.mutation<ApiResponse, CreateDonationRequest>({
      query: (body) => ({
        url: '/donations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Donations', 'DonorDonations'],
    }),

    /** POST /donations/{id}/process */
    processDonation: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/donations/${encodeURIComponent(id)}/process`,
        method: 'POST',
      }),
      invalidatesTags: ['Donations', 'DonorDonations', 'StreamerDonations'],
    }),

    /** GET /donations/qrbank/me */
    getMyQrDonations: builder.query<
      {
        success: boolean;
        data?: QrDonationRecord[];
        meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/donations/qrbank/me',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['QrDonations'],
    }),

    /** GET /donations/qrbank/{hash} */
    getDonationQrByHash: builder.query<ApiResponse<QrDonationInfoResponse>, string>({
      query: (hash) => ({
        url: `/donations/qrbank/${encodeURIComponent(hash)}`,
        method: 'GET',
      }),
    }),

    /** POST /donations/qrbank — Generate donation QR bank code */
    generateDonationQrBank: builder.mutation<
      ApiResponse<DonationQrBankResponse>,
      DonationQrBankRequest
    >({
      query: (body) => ({
        url: '/donations/qrbank',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Donations', 'DonorDonations', 'QrDonations'],
    }),
  }),
});

export const {
  useDiscoverStreamersQuery,
  useGetDonorDonationsQuery,
  useGetStreamerDonationsQuery,
  useGetDonationQuery,
  useGetMyQrDonationsQuery,
  useLazyGetDonationQrByHashQuery,
  useCreateDonationMutation,
  useProcessDonationMutation,
  useGenerateDonationQrBankMutation,
} = donateApi;
