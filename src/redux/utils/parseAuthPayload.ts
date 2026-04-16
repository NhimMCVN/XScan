/** Chuẩn hóa body ApiResponse hoặc object phẳng từ /auth/* thành token + user */
export function parseAuthPayload(data: unknown): {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user?: {
    id?: string;
    email?: string;
    role?: string;
    username?: string;
    [key: string]: unknown;
  };
} {
  if (!data || typeof data !== "object")
    return { accessToken: undefined, refreshToken: undefined };
  const root = data as Record<string, unknown>;
  const inner = (
    root.data && typeof root.data === "object" ? root.data : root
  ) as Record<string, unknown>;
  const rawUser = inner.user;
  return {
    accessToken:
      typeof inner.accessToken === "string" ? inner.accessToken : undefined,
    refreshToken:
      typeof inner.refreshToken === "string" ? inner.refreshToken : undefined,
    user:
      rawUser && typeof rawUser === "object"
        ? (rawUser as Record<string, unknown>)
        : undefined,
  };
}
