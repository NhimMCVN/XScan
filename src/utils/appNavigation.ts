/** Đồng bộ pathname với `currentView` — reload & chia sẻ link, không dùng hash */

/** TopNav tìm streamer → `StreamersView` đọc một lần khi vào tab STREAMERS. */
export const STREAMERS_SEARCH_FROM_HEADER_SESSION_KEY =
  "xscan_streamers_search_from_header";

const SEGMENT_TO_VIEW: Record<string, string> = {
  "": "MATCHES",
  matches: "MATCHES",
  streamers: "STREAMERS",
  challenges: "STREAMER_CHALLENGES",
  "streamer-challenges": "STREAMER_CHALLENGES",
  "become-streamer": "BECOME_STREAMER",
  profile: "PROFILE",
  "streamer-donations": "STREAMER_DONATIONS",
  "donation-links": "DONATION_LINKS",
  "obs-settings": "OBS_SETTINGS",
};

const VIEW_TO_SEGMENT: Record<string, string> = {
  MATCHES: "",
  STREAMERS: "streamers",
  STREAMER_CHALLENGES: "challenges",
  BECOME_STREAMER: "become-streamer",
  PROFILE: "profile",
  STREAMER_DONATIONS: "streamer-donations",
  DONATION_LINKS: "donation-links",
  OBS_SETTINGS: "obs-settings",
};

function normalizePathname(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/" ? "/" : p;
}

/** Một segment path → view (vd. "/challenges" → STREAMER_CHALLENGES) */
export function viewFromPathname(pathname: string): string {
  const n = normalizePathname(pathname);
  if (n === "/") return "MATCHES";
  const seg = n.replace(/^\//, "").split("/")[0]?.toLowerCase() ?? "";
  return SEGMENT_TO_VIEW[seg] ?? "MATCHES";
}

/** View → pathname luôn bắt đầu bằng / ; trang chủ là "/" */
export function pathFromView(view: string): string {
  const seg = VIEW_TO_SEGMENT[view];
  if (seg === undefined || seg === "") return "/";
  return `/${seg}`;
}

/**
 * Đọc view từ URL; nếu pathname là `/` mà còn bookmark cũ `#/...` thì chuyển sang pathname.
 */
export function getInitialViewFromLocation(): string {
  if (typeof window === "undefined") return "MATCHES";

  const path = normalizePathname(window.location.pathname);
  if (path !== "/") {
    return viewFromPathname(window.location.pathname);
  }

  const hash = window.location.hash;
  if (hash && /^#\/?/.test(hash)) {
    const legacy =
      hash.replace(/^#\/?/, "").split("/")[0]?.trim().toLowerCase() ?? "";
    const fromHash = SEGMENT_TO_VIEW[legacy];
    if (fromHash) {
      const next = pathFromView(fromHash);
      window.history.replaceState(null, "", `${next}${window.location.search}`);
      return fromHash;
    }
  }

  return "MATCHES";
}

export function pathsEqual(a: string, b: string): boolean {
  return normalizePathname(a) === normalizePathname(b);
}

/** Trang donation công khai: `/d/{customUrl}` (giống x-scan-fe-v2 `app/d/[customUrl]`). */
export function parseDonationLinkCustomUrl(pathname: string): string | null {
  const n = normalizePathname(pathname);
  if (n === "/") return null;
  const m = /^\/d\/(.+)/i.exec(n);
  if (!m?.[1]?.trim()) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/**
 * Trang widget alert (khớp x-scan-fe-v2): `/widget/alert/{streamerId}/{token}`.
 */
export function parseObsWidgetAlertPath(
  pathname: string,
): { streamerId: string; token: string } | null {
  const n = normalizePathname(pathname);
  const m = /^\/widget\/alert\/([^/]+)\/([^/]+)$/i.exec(n);
  if (!m?.[1] || !m[2]) return null;
  try {
    return {
      streamerId: decodeURIComponent(m[1]),
      token: decodeURIComponent(m[2]),
    };
  } catch {
    return { streamerId: m[1], token: m[2] };
  }
}

/**
 * Query trên URL trang widget: `?donationLevelId=` hoặc `?levelId=` (khớp OBS settings).
 */
export function parseWidgetDonationLevelQuery(search: string): string | undefined {
  const sp = new URLSearchParams(
    search.startsWith("?") ? search : `?${search}`,
  );
  const raw = sp.get("donationLevelId") ?? sp.get("levelId");
  const t = raw?.trim();
  return t || undefined;
}
