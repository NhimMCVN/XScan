import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { API_URL } from "@/src/constants";
import { logout, setAuth } from "../slices/auth.slice";
import { parseAuthPayload } from "../utils/parseAuthPayload";

const baseQuery = (token: string) =>
  fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders(headers) {
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  });

const rawBaseQuery = fetchBaseQuery({ baseUrl: API_URL });

/** Tránh nhiều request 401 song song mỗi cái gọi refresh — rotation token có thể làm lần sau fail / logout nhầm */
let refreshInFlight: Promise<string | null> | null = null;

function getRequestUrl(args: string | FetchArgs): string {
  if (typeof args === "string") return args;
  return args.url || "";
}

/**
 * Endpoint public: không gửi Bearer — JWT hết hạn gửi kèp thường bị BE trả 401 → kích hoạt refresh/logout nhầm.
 */
function shouldOmitAuthHeader(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("/users/discover/streamers") ||
    url.includes("/public/donations/stats")
  );
}

/**
 * Một số API trả HTTP 200 nhưng body { success: false, error: { code: 'UNAUTHORIZED' } }.
 * fetchBaseQuery coi là success → không refresh. Chuẩn hóa thành 401 để refresh + retry.
 */
function normalizeBusinessUnauthorized(result: {
  data?: unknown;
  error?: FetchBaseQueryError;
}): {
  data?: unknown;
  error?: FetchBaseQueryError;
} {
  if (result.error) return result;
  const data = result.data;
  if (!data || typeof data !== "object") return result;
  const root = data as Record<string, unknown>;
  const errObj = root.error;
  if (root.success !== false || !errObj || typeof errObj !== "object")
    return result;
  const code = String(
    (errObj as Record<string, unknown>).code || "",
  ).toUpperCase();
  if (code !== "UNAUTHORIZED") return result;
  return {
    error: {
      status: 401,
      data: result.data,
    } as FetchBaseQueryError,
  };
}

function isRefreshUnauthorized(
  error: FetchBaseQueryError | undefined,
): boolean {
  if (!error) return false;
  const s = error.status;
  return s === 401 || s === 403;
}

function runRefresh(
  api: Parameters<BaseQueryFn>[1],
  refreshtk: string,
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken: refreshtk },
          headers: {
            "Content-Type": "application/json",
          },
        },
        api,
        extraOptions,
      );

      if (refreshResult.error) {
        if (isRefreshUnauthorized(refreshResult.error as FetchBaseQueryError)) {
          api.dispatch(logout());
        }
        return null;
      }

      const {
        accessToken: newAccess,
        refreshToken: newRefresh,
        user,
      } = parseAuthPayload(refreshResult.data);
      const nextRefresh = newRefresh ?? refreshtk;

      if (!newAccess) {
        console.warn(
          "[auth] Refresh thành công nhưng không đọc được accessToken — không logout để tránh mất phiên oan.",
        );
        return null;
      }

      api.dispatch(
        setAuth({
          accessToken: newAccess,
          refreshToken: nextRefresh,
          user: user ?? undefined,
        }),
      );

      return newAccess;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

function isUnauthorizedResult(
  result: { data?: unknown; error?: FetchBaseQueryError },
  omitAuth: boolean,
): boolean {
  if (omitAuth) return false;
  return Boolean(result.error && result.error.status === 401);
}

export const customFetchBase: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  try {
    const state = api.getState() as {
      auth?: { accessToken?: string; refreshToken?: string };
    };
    const token = state?.auth?.accessToken;
    const refreshtk = state?.auth?.refreshToken;

    const url = getRequestUrl(args);
    const omitAuth = shouldOmitAuthHeader(url);
    const effectiveToken = omitAuth ? "" : token || "";

    let result = await baseQuery(effectiveToken)(args, api, extraOptions);
    result = normalizeBusinessUnauthorized(result) as typeof result;

    if (isUnauthorizedResult(result, omitAuth) && refreshtk) {
      const newAccess = await runRefresh(api, refreshtk, extraOptions);
      if (!newAccess) {
        return result;
      }
      result = await baseQuery(newAccess)(args, api, extraOptions);
      result = normalizeBusinessUnauthorized(result) as typeof result;
    }

    return result;
  } catch (e) {
    console.log(e);
    return {
      error: { status: "FETCH_ERROR", error: String(e) } as FetchBaseQueryError,
    };
  }
};
