import { createApi } from '@reduxjs/toolkit/query/react'
import { customFetchBase } from './customFetchBase'

/**
 * Mapping với api-backend.json (tag "OBS Settings"):
 * - GET    /obs-settings/my-settings      → OBSSettingsResponseDTO (đây là API load khi vào trang)
 * - POST   /obs-settings                  → tạo (CreateOBSSettingsDTO, bắt buộc streamerId)
 * - PUT    /obs-settings/my-settings      → cập nhật (UpdateOBSSettingsDTO)
 * - POST   /obs-settings/media/upload     → upload multipart
 * - DELETE /obs-settings/media?url=       → xóa file storage + gỡ URL (query `url` bắt buộc, OpenAPI)
 * - GET/POST /obs-settings/donation-levels, DELETE /obs-settings/donation-levels/{levelId}
 * - POST   /obs-settings/regenerate-token
 * - PUT    /obs-settings/security         → chưa gắn UI
 * - POST/DELETE /obs-settings/presets…    → chưa gắn UI
 * - POST   /obs-settings/test-alert
 * - POST   /obs-settings/test-connection  → kiểm tra kết nối (đã thêm vào api-backend.json cho khớp FE)
 */

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

export interface LayoutSettings {
  overlayOnMedia?: boolean
  backgroundWidth?: number
  backgroundHeight?: number
}

/** Khớp backend-go_core_dtos.OBSSettingsResponseDTO + các field nested thực tế từ API */
export interface OBSSettingsResponse {
  _id?: string
  id?: string
  streamerId?: string
  widgetUrl?: string
  alertToken?: string
  settingsBehavior?: string
  isActive?: boolean
  totalAlerts?: number
  createdAt?: string
  updatedAt?: string
  __v?: number
  securitySettings?: Record<string, unknown>
  imageSettings?: Record<string, unknown>
  soundSettings?: Record<string, unknown>
  displaySettings?: Record<string, unknown>
  generalSettings?: Record<string, unknown>
  animationSettings?: Record<string, unknown>
  styleSettings?: Record<string, unknown>
  positionSettings?: Record<string, unknown>
  /** Neo layout / overlay chữ lên media (cấu hình mặc định widget). */
  layoutSettings?: LayoutSettings
  donationLevels?: unknown
  presets?: unknown[]
  /** Một số bản BE trả thêm URL widget tổng bank */
  bankTotalWidgetUrl?: string
  bankWidgetUrl?: string
  [key: string]: unknown
}

/** Chuẩn hóa: BE có thể trả `{ success, data }` hoặc trả thẳng DTO ở root */
export function normalizeObsSettingsResponse(response: unknown): ApiResponse<OBSSettingsResponse> {
  if (response == null || typeof response !== 'object') {
    return { success: false }
  }
  const r = response as Record<string, unknown>
  if (r.data !== undefined && typeof r.data === 'object' && r.data !== null) {
    return response as ApiResponse<OBSSettingsResponse>
  }
  const looksLikeDto =
    typeof r.streamerId === 'string' ||
    typeof r.widgetUrl === 'string' ||
    typeof r.alertToken === 'string' ||
    typeof r._id === 'string' ||
    typeof r.id === 'string'
  if (looksLikeDto && r.success === undefined) {
    return { success: true, data: response as OBSSettingsResponse }
  }
  return response as ApiResponse<OBSSettingsResponse>
}

export interface SoundSettings {
  url?: string | null
  volume?: number
  enabled?: boolean
  loop?: boolean
  fadeIn?: number
  fadeOut?: number
}

export interface ImageSettings {
  /** Gửi `null` khi xóa media khỏi cấu hình (JSON không được bỏ qua như `undefined`). */
  url?: string | null
  mediaType?: string
  width?: number
  height?: number
  borderRadius?: number
  enabled?: boolean
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
}

export interface UpdateObsBody {
  settingsBehavior?: 'basic' | 'donation_level'
  imageSettings?: ImageSettings
  soundSettings?: SoundSettings
  displaySettings?: Record<string, unknown>
  generalSettings?: Record<string, unknown>
  animationSettings?: Record<string, unknown>
  styleSettings?: Record<string, unknown>
  positionSettings?: Record<string, unknown>
  isActive?: boolean
  allowUserMedia?: boolean
  allowVoiceRecording?: boolean
  layoutSettings?: LayoutSettings
}

export interface TestAlertBody {
  amount?: string
  donorName?: string
  message?: string
  useCurrentSettings?: boolean
}

export interface DonationLevelDTO {
  id?: string
  levelId?: string
  levelName: string
  minAmount: number
  maxAmount: number
  currency?: string
  isEnabled?: boolean
  configuration?: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

export interface UpdateDonationLevelBody {
  levelName?: string
  minAmount?: number
  maxAmount?: number
  currency?: string
  isEnabled?: boolean
  configuration?: Record<string, any>
}

export interface MediaUploadResponse {
  url?: string
  fileName?: string
  fileSize?: number
  mediaType?: string
  uploadedAt?: string
}

export const obsApi = createApi({
  reducerPath: 'obsApi',
  tagTypes: ['ObsSettings', 'DonationLevels'],
  baseQuery: customFetchBase,
  endpoints: builder => ({
    /** GET /obs-settings/my-settings — luôn dùng endpoint này để tải cấu hình (OpenAPI không có GET tại /obs-settings) */
    getMySettings: builder.query<ApiResponse<OBSSettingsResponse>, void>({
      query: () => ({ url: '/obs-settings/my-settings', method: 'GET' }),
      providesTags: ['ObsSettings'],
      keepUnusedDataFor: 0,
      transformResponse: normalizeObsSettingsResponse,
    }),
    createSettings: builder.mutation<ApiResponse<OBSSettingsResponse>, { streamerId: string }>({
      query: body => ({
        url: '/obs-settings',
        method: 'POST',
        body: { streamerId: body.streamerId },
      }),
      invalidatesTags: ['ObsSettings'],
      transformResponse: normalizeObsSettingsResponse,
    }),
    updateMySettings: builder.mutation<ApiResponse<OBSSettingsResponse>, UpdateObsBody>({
      query: body => ({
        url: '/obs-settings/my-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ObsSettings'],
      transformResponse: normalizeObsSettingsResponse,
    }),
    uploadMedia: builder.mutation<ApiResponse<MediaUploadResponse>, FormData>({
      query: formData => ({
        url: '/obs-settings/media/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ObsSettings'],
    }),
    deleteMedia: builder.mutation<ApiResponse, string>({
      query: url => ({
        url: '/obs-settings/media',
        method: 'DELETE',
        params: { url },
      }),
      invalidatesTags: ['ObsSettings'],
    }),
    testAlert: builder.mutation<ApiResponse, TestAlertBody>({
      query: body => ({
        url: '/obs-settings/test-alert',
        method: 'POST',
        body,
      }),
    }),
    /** Kiểm tra kết nối tới dịch vụ widget / backend */
    testConnection: builder.mutation<ApiResponse<{ message?: string; connected?: boolean }>, void>({
      query: () => ({
        url: '/obs-settings/test-connection',
        method: 'POST',
      }),
    }),
    regenerateToken: builder.mutation<ApiResponse<OBSSettingsResponse>, void>({
      query: () => ({
        url: '/obs-settings/regenerate-token',
        method: 'POST',
      }),
      invalidatesTags: ['ObsSettings'],
      transformResponse: normalizeObsSettingsResponse,
    }),
    getDonationLevels: builder.query<ApiResponse<{ donationLevels: DonationLevelDTO[] }>, void>({
      query: () => ({ url: '/obs-settings/donation-levels', method: 'GET' }),
      providesTags: ['DonationLevels'],
    }),
    addDonationLevel: builder.mutation<ApiResponse, DonationLevelDTO>({
      query: body => ({
        url: '/obs-settings/donation-levels',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DonationLevels', 'ObsSettings'],
    }),
    updateDonationLevel: builder.mutation<ApiResponse, { levelId: string; body: UpdateDonationLevelBody }>({
      query: ({ levelId, body }) => ({
        url: `/obs-settings/donation-levels/${levelId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DonationLevels', 'ObsSettings'],
    }),
    deleteDonationLevel: builder.mutation<ApiResponse, string>({
      query: levelId => ({
        url: `/obs-settings/donation-levels/${levelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DonationLevels', 'ObsSettings'],
    }),
  }),
})

export const {
  useGetMySettingsQuery,
  useLazyGetMySettingsQuery,
  useCreateSettingsMutation,
  useUpdateMySettingsMutation,
  useUploadMediaMutation,
  useDeleteMediaMutation,
  useTestAlertMutation,
  useTestConnectionMutation,
  useRegenerateTokenMutation,
  useGetDonationLevelsQuery,
  useAddDonationLevelMutation,
  useUpdateDonationLevelMutation,
  useDeleteDonationLevelMutation,
} = obsApi
