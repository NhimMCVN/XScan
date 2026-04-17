function pickToken(
  inner: Record<string, unknown>,
  camel: "accessToken" | "refreshToken",
): string | undefined {
  const snake = camel === "accessToken" ? "access_token" : "refresh_token";
  const a = inner[camel];
  const b = inner[snake];
  if (typeof a === "string" && a) return a;
  if (typeof b === "string" && b) return b;
  const tokens = inner.tokens;
  if (tokens && typeof tokens === "object") {
    const t = tokens as Record<string, unknown>;
    const x = t[camel] ?? t[snake];
    if (typeof x === "string" && x) return x;
  }
  return undefined;
}

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
    accessToken: pickToken(inner, "accessToken"),
    refreshToken: pickToken(inner, "refreshToken"),
    user:
      rawUser && typeof rawUser === "object"
        ? (rawUser as Record<string, unknown>)
        : undefined,
  };
}
