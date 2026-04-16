/** Role từ BE (UserProfile) — streamer mới gọi được API quản lý phía streamer. */
export function isStreamerRole(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "streamer" || r === "admin";
}
