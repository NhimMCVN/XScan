/** Đồng bộ pathname với `currentView` — reload & chia sẻ link, không dùng hash */

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
      hash
        .replace(/^#\/?/, "")
        .split("/")[0]
        ?.trim()
        .toLowerCase() ?? "";
    const fromHash = SEGMENT_TO_VIEW[legacy];
    if (fromHash) {
      const next = pathFromView(fromHash);
      window.history.replaceState(
        null,
        "",
        `${next}${window.location.search}`,
      );
      return fromHash;
    }
  }

  return "MATCHES";
}

export function pathsEqual(a: string, b: string): boolean {
  return normalizePathname(a) === normalizePathname(b);
}
