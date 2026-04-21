import { createApi } from '@reduxjs/toolkit/query/react';
import { customFetchBase } from './customFetchBase';

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

/** GET /wallets/me */
export interface WalletMe {
  id: string;
  userId: string;
  balanceVnd: number;
  balanceGem: number;
  balanceCoin: number;
  isActive: boolean;
  lastTransactionAt: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /deposit-config — PublicDepositConfigDTO (OpenAPI) */
export interface DepositConfig {
  supportedCurrencies?: string[];
}

/** POST /wallets/deposit — DepositQRRequestDTO */
export interface WalletDepositQrRequest {
  amount: number;
  currency: string;
}

/** POST /wallets/deposit — DepositQRResponseDTO */
export interface WalletDepositQrData {
  accountName?: string;
  accountNumber?: string;
  /** Nội dung CK đầy đủ (prefix + mã + currency + prefix) */
  addInfo?: string;
  amount?: number;
  bankName?: string;
  bankShortName?: string;
  currency?: string;
  depositCode?: string;
  qrUrl?: string;
}

/** GET /transactions/history — giao dịch thống nhất (nạp, donate, thử thách, mua asset, …) */
export interface UnifiedTransactionItem {
  id?: string;
  _id?: string;
  type?: string;
  status?: string;
  amount?: number;
  currency?: string;
  /** Chi tiết theo loại giao dịch (BE trả nested) */
  detail?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  reference?: string;
  referenceCode?: string;
  streamerId?: string;
  donationLinkId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TransactionHistoryParams {
  type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

/** BE có thể trả data là mảng hoặc object phân trang */
export type TransactionHistoryData =
  | UnifiedTransactionItem[]
  | {
      items?: UnifiedTransactionItem[];
      transactions?: UnifiedTransactionItem[];
      data?: UnifiedTransactionItem[];
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
      /** Một số BE dùng `pagination` thay cho `meta` */
      pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
      summary?: Record<string, unknown>;
    };

/** Tổng hợp kèm `data.items` (BE có thể trả thêm) */
export interface TransactionHistorySummary {
  deposits?: number;
  donations?: number;
  challenges?: number;
  assetPurchases?: number;
  [key: string]: unknown;
}

export type TransactionHistoryResponse = ApiResponse<TransactionHistoryData> & {
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
};

export function unwrapTransactionHistory(res: TransactionHistoryResponse | undefined): {
  rows: UnifiedTransactionItem[];
  total: number;
  page: number;
  limit: number;
  summary?: TransactionHistorySummary;
} {
  const rootMeta = res?.meta;
  const raw = res?.data;

  if (Array.isArray(raw)) {
    const total = rootMeta?.total ?? raw.length;
    const page = rootMeta?.page ?? 1;
    const limit = rootMeta?.limit ?? raw.length;
    return { rows: raw, total, page, limit, summary: undefined };
  }

  if (raw && typeof raw === 'object') {
    const d = raw as Record<string, unknown>;
    const items = (
      Array.isArray(d.items)
        ? d.items
        : Array.isArray(d.transactions)
          ? d.transactions
          : Array.isArray(d.data)
            ? d.data
            : []
    ) as UnifiedTransactionItem[];
    const innerMeta = (d.meta as typeof rootMeta) || {};
    const pagination =
      d.pagination && typeof d.pagination === 'object'
        ? (d.pagination as Record<string, unknown>)
        : {};
    const total =
      Number(
        rootMeta?.total ??
          innerMeta.total ??
          pagination.total ??
          d.total ??
          items.length,
      ) || items.length;
    const page =
      Number(rootMeta?.page ?? innerMeta.page ?? pagination.page ?? d.page ?? 1) || 1;
    const limit =
      Number(
        rootMeta?.limit ?? innerMeta.limit ?? pagination.limit ?? d.limit ?? items.length,
      ) || items.length;
    const summary =
      d.summary && typeof d.summary === 'object'
        ? (d.summary as TransactionHistorySummary)
        : undefined;
    return { rows: items, total, page, limit, summary };
  }

  return { rows: [], total: 0, page: 1, limit: 20, summary: undefined };
}

export const walletApi = createApi({
  reducerPath: 'walletApi',
  tagTypes: ['Wallet', 'Transactions'],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({
    getMyWallet: builder.query<ApiResponse<WalletMe>, void>({
      query: () => ({
        url: '/wallets/me',
        method: 'GET',
      }),
      providesTags: ['Wallet'],
    }),
    getDepositConfig: builder.query<ApiResponse<DepositConfig>, void>({
      query: () => ({
        url: '/deposit-config',
        method: 'GET',
      }),
    }),
    createWalletDeposit: builder.mutation<ApiResponse<WalletDepositQrData>, WalletDepositQrRequest>({
      query: (body) => ({
        url: '/wallets/deposit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    /** GET /transactions/history */
    getTransactionHistory: builder.query<TransactionHistoryResponse, TransactionHistoryParams | void>({
      query: (params) => ({
        url: '/transactions/history',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['Transactions'],
    }),
  }),
});

export const {
  useGetMyWalletQuery,
  useLazyGetMyWalletQuery,
  useGetDepositConfigQuery,
  useCreateWalletDepositMutation,
  useGetTransactionHistoryQuery,
  useLazyGetTransactionHistoryQuery,
} = walletApi;
