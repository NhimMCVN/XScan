import { API_URL } from "@/src/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** POST /auth/verify-email — OpenAPI: VerifyEmailRequest */
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface AuthPayload {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/** GET /widget-public/settings/{streamerId}/{token} — full widget style/config */
export interface WidgetAnimationSettings {
  enabled?: boolean;
  animationType?: string;
  duration?: number;
  easing?: string;
  direction?: string;
  bounceIntensity?: number;
  zoomScale?: number;
}

export interface WidgetDisplaySettings {
  duration?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  autoHide?: boolean;
  showProgress?: boolean;
  progressColor?: string;
  progressHeight?: number;
}

export interface WidgetImageSettings {
  enabled?: boolean;
  url?: string;
  mediaType?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface WidgetPositionSettings {
  x?: number;
  y?: number;
  anchor?: string;
  zIndex?: number;
  responsive?: boolean;
  mobileScale?: number;
}

export interface WidgetSoundSettings {
  enabled?: boolean;
  url?: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
}

export interface WidgetStyleSettings {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textShadow?: boolean;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
}

export interface WidgetSettingsData {
  animationSettings?: WidgetAnimationSettings;
  displaySettings?: WidgetDisplaySettings;
  donationLevels?: any[];
  imageSettings?: WidgetImageSettings;
  positionSettings?: WidgetPositionSettings;
  soundSettings?: WidgetSoundSettings;
  streamerId?: string;
  styleSettings?: WidgetStyleSettings;
}

/** GET /widget-public/init/{streamerId}/{token} — init data + websocketUrl */
export interface WidgetPublicInitSettings {
  animationSettings?: WidgetAnimationSettings;
  displaySettings?: WidgetDisplaySettings;
  donationLevels?: any[];
  generalSettings?: Record<string, unknown>;
  imageSettings?: WidgetImageSettings;
  positionSettings?: WidgetPositionSettings;
  soundSettings?: WidgetSoundSettings;
  styleSettings?: WidgetStyleSettings;
}

export interface WidgetPublicInitData {
  displayName?: string;
  profilePicture?: string | null;
  settings?: WidgetPublicInitSettings;
  streamerId?: string;
  streamerName?: string;
  websocketUrl?: string;
}

/** GET /public/donations/stats — thống kê donate công khai (BE có thể bổ sung field) */
export interface DonationPublicStatsPayload {
  totalAmount?: number;
  totalPlatformDonations?: number;
  platformDonationTotal?: number;
  donationsToday?: number;
  donationsLast30Days?: number;
  donationsMonth?: number;
  revenueToday?: number;
  revenueWeek?: number;
  revenueMonth?: number;
  totalRevenue?: number;
  [key: string]: unknown;
}

/** GET /public/donation-links/{customUrl} — DonationLinkResponseDTO */
export interface DonationLinkPublic {
  id?: string;
  _id?: string;
  streamerId?: string;
  customUrl?: string;
  slug?: string;
  title?: string;
  description?: string;
  qrCodeUrl?: string;
  isActive?: boolean;
  isDefault?: boolean;
  allowAnonymous?: boolean;
  currency?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  totalDonations?: number;
  totalAmount?: number;
  pageViews?: number;
  socialMediaLinks?: Record<string, string> | null;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** GET /public/leaderboard/donors — core_controller.LeaderboardDonorDTO[] */
export interface LeaderboardDonorDTO {
  displayName?: string;
  donationCount?: number;
  donorId?: string;
  profilePicture?: string;
  streamerCount?: number;
  totalAmount?: number;
  username?: string;
}

export type PublicLeaderboardDonorsPeriod = "month" | "all";

export const publicApi = createApi({
  reducerPath: "publicApi",
  tagTypes: ["Public", "Auth"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
  keepUnusedDataFor: 0,
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    verify: builder.mutation<any, any>({
      query: (params) => ({
        url: "/api/public/verify",
        method: "POST",
        body: params,
      }),
    }),
    welcome: builder.query<any, void>({
      query: () => ({
        url: "/api/public/health-check",
        method: "GET",
      }),
    }),
    /** Thống kê donate toàn hệ thống (public, không cần Bearer) */
    getPublicDonationStats: builder.query<
      ApiResponse<DonationPublicStatsPayload>,
      void
    >({
      query: () => ({
        url: "/public/donations/stats",
        method: "GET",
      }),
    }),
    /** GET /public/leaderboard/donors — bảng xếp hạng donor (?period=month mặc định, hoặc all) */
    getPublicLeaderboardDonors: builder.query<
      ApiResponse<LeaderboardDonorDTO[]>,
      { period?: PublicLeaderboardDonorsPeriod } | void
    >({
      query: (params) => {
        const period =
          params &&
          typeof params === "object" &&
          (params.period === "month" || params.period === "all")
            ? params.period
            : "month";
        return {
          url: "/public/leaderboard/donors",
          method: "GET",
          params: { period },
        };
      },
    }),
    /** OpenAPI: GET /public/donation-links/{customUrl} — lấy link (cần _id để POST /donations) */
    getPublicDonationLinkByCustomUrl: builder.query<
      ApiResponse<DonationLinkPublic>,
      string
    >({
      query: (customUrl) => ({
        url: `/public/donation-links/${encodeURIComponent(customUrl)}`,
        method: "GET",
      }),
    }),
    /** GET /public/donation-links/streamer/{streamerId} — lấy tất cả donation links của streamer */
    getPublicDonationLinksByStreamer: builder.query<
      ApiResponse<DonationLinkPublic[]>,
      string
    >({
      query: (streamerId) => ({
        url: `/public/donation-links/streamer/${encodeURIComponent(streamerId)}`,
        method: "GET",
      }),
    }),
    /** GET /public/donation-links/id/{id} — lấy donation link bằng _id */
    getPublicDonationLinkById: builder.query<
      ApiResponse<DonationLinkPublic>,
      string
    >({
      query: (id) => ({
        url: `/public/donation-links/id/${encodeURIComponent(id)}`,
        method: "GET",
      }),
    }),
    /** GET /widget-public/settings/{streamerId}/{token} — widget style config */
    getWidgetSettings: builder.query<
      ApiResponse<WidgetSettingsData>,
      { streamerId: string; token: string }
    >({
      query: ({ streamerId, token }) => ({
        url: `/widget-public/settings/${encodeURIComponent(streamerId)}/${encodeURIComponent(token)}`,
        method: "GET",
      }),
    }),
    /** GET /widget-public/init/{streamerId}/{token} — init + websocketUrl */
    getWidgetPublicInit: builder.query<
      ApiResponse<WidgetPublicInitData>,
      { streamerId: string; token: string }
    >({
      query: ({ streamerId, token }) => ({
        url: `/widget-public/init/${encodeURIComponent(streamerId)}/${encodeURIComponent(token)}`,
        method: "GET",
      }),
    }),
    login: builder.mutation<ApiResponse<AuthPayload>, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    refreshToken: builder.mutation<
      ApiResponse<AuthPayload>,
      RefreshTokenRequest
    >({
      query: (body) => ({
        url: "/auth/refresh",
        method: "POST",
        body,
      }),
    }),
    register: builder.mutation<ApiResponse<AuthPayload>, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    /** POST /auth/verify-email — 6-digit OTP, thường trả token trong data sau khi xác minh */
    verifyEmail: builder.mutation<ApiResponse<AuthPayload>, VerifyEmailRequest>(
      {
        query: (body) => ({
          url: "/auth/verify-email",
          method: "POST",
          body,
        }),
        invalidatesTags: ["Auth"],
      },
    ),
    forgotPassword: builder.mutation<ApiResponse, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      ApiResponse,
      { token: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useVerifyMutation,
  useWelcomeQuery,
  useGetPublicDonationStatsQuery,
  useGetPublicLeaderboardDonorsQuery,
  useLazyGetPublicDonationLinkByCustomUrlQuery,
  useGetPublicDonationLinksByStreamerQuery,
  useLazyGetPublicDonationLinksByStreamerQuery,
  useLazyGetPublicDonationLinkByIdQuery,
  useLazyGetWidgetSettingsQuery,
  useLazyGetWidgetPublicInitQuery,
  useLoginMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = publicApi;
