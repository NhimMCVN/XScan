import { API_URL } from "@/src/constants";
import { removeTrailingSlash } from "@/src/utils/common";

/**
 * Gỡ lặp prefix api sai từ BE hoặc OpenAPI (segment wildcard giữa hai nhánh api,
 * hoặc %2A thay cho dấu sao, hoặc bất kỳ một segment giữa hai api).
 * Gỡ luôn chuỗi api lặp liền nhau.
 */
function collapseDuplicateApiPathSegments(pathname: string): string {
  let p = pathname;
  let prev = "";
  while (p !== prev) {
    prev = p;
    p = p.replace(/\/api\/%2A\/api\//gi, "/api/");
    p = p.replace(/\/api\/\*\/api\//g, "/api/");
    p = p.replace(/\/api\/[^/]+\/api(?=\/|$)/g, "/api");
    while (/\/api\/api\//.test(p)) {
      p = p.replace(/\/api\/api\//g, "/api/");
    }
  }
  return p;
}

export function normalizeMalformedApiUrl(href: string): string {
  try {
    const u = new URL(href);
    u.pathname = collapseDuplicateApiPathSegments(u.pathname);
    return u.href;
  } catch {
    let s = href;
    s = s.replace(/\/api\/%2A\/api\//gi, "/api/");
    s = s.replace(/\/api\/\*\/api\//g, "/api/");
    let prev = "";
    while (s !== prev) {
      prev = s;
      s = s.replace(/\/api\/[^/]+\/api(?=\/|\?|#|$)/g, "/api");
      while (/\/api\/api\//.test(s)) {
        s = s.replace(/\/api\/api\//g, "/api/");
      }
    }
    return s;
  }
}

/** Bỏ trùng path với pathname của API_URL (vd. base `.../api` + path `/api/widget-public/...`). */
function dedupePathAgainstApiBase(baseUrl: string, path: string): string {
  const base = removeTrailingSlash(baseUrl);
  let p = path.startsWith("/") ? path : `/${path}`;
  try {
    const normalizedBase =
      base.includes("://") && !base.endsWith("/") ? `${base}/` : base;
    const u = new URL(
      normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`,
    );
    const basePath = u.pathname.replace(/\/+$/, "") || "";
    if (basePath && p.startsWith(`${basePath}/`)) {
      p = p.slice(basePath.length);
      if (!p.startsWith("/")) p = `/${p}`;
    }
  } catch {
    if (/\/api$/i.test(base) && /^\/api\//.test(p)) {
      p = p.replace(/^\/api(?=\/)/, "") || "/";
    }
  }
  return p;
}

/**
 * Chuỗi tương đối (bắt đầu `/`) hoặc tuyệt đối `http(s)://` → URL đầy đủ gọi API,
 * tránh lặp `/api` khi `VITE_PUBLIC_API_URL` đã kết thúc bằng `/api`.
 */
export function absoluteApiUrl(maybe: string | undefined): string {
  if (!maybe) return "";
  const t = String(maybe).trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) {
    return normalizeMalformedApiUrl(t);
  }
  const base = removeTrailingSlash(API_URL);
  const path = dedupePathAgainstApiBase(base, t);
  const joined = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  return normalizeMalformedApiUrl(joined);
}
