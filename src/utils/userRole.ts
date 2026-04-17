/**
 * Role từ BE (`auth.user.role`, `UserProfile.role`).
 * Streamer / admin: luồng streamer (profile dashboard, OBS, …).
 * Donor / user / mọi role khác: luồng donor (profile user, challenge donor, …).
 */
export function isStreamerRole(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "streamer" || r === "admin";
}
