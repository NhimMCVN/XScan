import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { User, Mail, Wallet, Zap, ShieldCheck, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch } from "@/src/redux";
import {
  useGetProfileQuery,
  useGetProfileCompletionQuery,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  type UserProfile,
} from "@/src/redux/queries/user.api";
import type { WalletMe } from "@/src/redux/queries/wallet.api";
import { useGetMyWalletQuery } from "@/src/redux/queries/wallet.api";
import { setAuthUser } from "@/src/redux/slices/auth.slice";
import { isStreamerRole } from "@/src/utils/userRole";

function getMutationError(e: unknown): string {
  if (!e || typeof e !== "object") return "Có lỗi xảy ra.";
  const x = e as Record<string, unknown>;
  const data = x.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message) return d.message;
    const err = d.error;
    if (err && typeof err === "object") {
      const m = (err as Record<string, unknown>).message;
      if (typeof m === "string" && m) return m;
    }
  }
  if (typeof x.error === "string" && x.error) return x.error;
  return "Có lỗi xảy ra.";
}

function profileToAuthUser(p: UserProfile) {
  const id = p._id;
  return {
    id: id != null ? String(id) : undefined,
    email: typeof p.email === "string" ? p.email : undefined,
    username: typeof p.username === "string" ? p.username : undefined,
    role: typeof p.role === "string" ? p.role : undefined,
    displayName: typeof p.displayName === "string" ? p.displayName : undefined,
  };
}

/** Hồ sơ + ví: badge / form streamer lấy từ `profile.role` (API), đồng bộ donor vs streamer. */
export function ProfileDashboardHeader() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: profileRes,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErr,
    refetch: refetchProfile,
  } = useGetProfileQuery();

  const { data: completionRes } = useGetProfileCompletionQuery();

  const { data: walletRes, isLoading: walletLoading } = useGetMyWalletQuery();

  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [uploadPicture, { isLoading: uploadingPic }] =
    useUploadProfilePictureMutation();

  const profile = profileRes?.success ? profileRes.data : undefined;
  const isStreamer = isStreamerRole(profile?.role);
  const completionPct = completionRes?.success
    ? completionRes.data?.percentage
    : undefined;

  const walletData = walletRes?.data as WalletMe | undefined;

  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [streamCategory, setStreamCategory] = useState("");
  const [streamLanguage, setStreamLanguage] = useState("");
  const [streamSchedule, setStreamSchedule] = useState("");

  useEffect(() => {
    if (!profile) return;
    dispatch(setAuthUser(profileToAuthUser(profile)));
  }, [profile, dispatch]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setBio(profile.bio || "");
    setLocation(typeof profile.location === "string" ? profile.location : "");
    setStreamCategory(profile.streamCategory || "");
    setStreamLanguage(profile.streamLanguage || "");
    setStreamSchedule(profile.streamSchedule || "");
  }, [profile]);

  const handleSaveProfile = async () => {
    setFormError(null);
    try {
      const body: Record<string, string> = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
      };
      if (isStreamer) {
        body.streamCategory = streamCategory.trim();
        body.streamLanguage = streamLanguage.trim();
        body.streamSchedule = streamSchedule.trim();
      }
      const res = await updateProfile(body).unwrap();
      if (!res.success) {
        setFormError(
          res.message || res.error?.message || "Cập nhật không thành công.",
        );
        return;
      }
      setEditOpen(false);
      void refetchProfile();
    } catch (e) {
      setFormError(getMutationError(e));
    }
  };

  const handleAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadPicture(fd).unwrap();
      if (!res.success) {
        setFormError(res.message || "Upload ảnh không thành công.");
        return;
      }
      void refetchProfile();
    } catch (err) {
      setFormError(getMutationError(err));
    }
  };

  const avatarUrl =
    profile?.profilePicture && typeof profile.profilePicture === "string"
      ? profile.profilePicture
      : "https://picsum.photos/seed/profile/300/300";

  const displayTitle =
    profile?.displayName ||
    profile?.username ||
    (profile?.email ? profile.email.split("@")[0] : "Người dùng");
  const handle = profile?.username ? `@${profile.username}` : "—";
  const email = profile?.email ?? "—";
  const roleLabel = (profile?.role || "USER").toUpperCase();

  const vnd = walletData?.balanceVnd ?? 0;
  const gem = walletData?.balanceGem ?? 0;

  if (profileLoading) {
    return (
      <section className="bg-surface-container-low border border-outline-variant/10 p-8 rounded-[12px] flex items-center justify-center gap-3 text-outline">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-mono tracking-widest uppercase">
          Đang tải hồ sơ...
        </span>
      </section>
    );
  }

  if (profileError || !profile) {
    return (
      <section className="bg-surface-container-low border border-red-400/30 p-6 rounded-[12px] text-center">
        <p className="text-red-400 text-sm">
          Không tải được hồ sơ. {getMutationError(profileErr)}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void refetchProfile()}
        >
          Thử lại
        </Button>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-low border border-outline-variant/10 p-4 md:p-6 lg:p-8 rounded-[12px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarFile}
      />

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
        <div className="relative shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full border-2 md:border-4 border-primary/20 p-1">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary bg-surface-container">
              <img
                src={avatarUrl}
                alt={displayTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={uploadingPic}
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-0 right-0 rounded-full bg-surface-container-high border border-primary/40 p-1 text-primary hover:bg-primary/10 disabled:opacity-50 z-1"
            title="Đổi ảnh đại diện (POST /users/profile/picture)"
          >
            {uploadingPic ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary text-black p-1 md:p-1.5 rounded-full border-2 md:border-4 border-surface-container-low pointer-events-none z-0">
            {isStreamer ? (
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <User className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left w-full min-w-0">
          <div className="space-y-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  {displayTitle}
                </h1>
                <p className="text-primary font-mono text-xs md:text-sm tracking-widest">
                  {handle}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                {typeof completionPct === "number" ? (
                  <span className="text-[10px] font-mono text-outline uppercase tracking-widest">
                    Hồ sơ: {completionPct}%
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none text-[10px] font-bold tracking-widest border-primary/30"
                  onClick={() => {
                    setEditOpen((o) => !o);
                    setFormError(null);
                  }}
                >
                  {editOpen ? "ĐÓNG CHỈNH SỬA" : "CHỈNH SỬA THÔNG TIN"}
                </Button>
              </div>
            </div>
          </div>

          {editOpen ? (
            <div className="space-y-3 p-4 border border-outline-variant/20 bg-surface-container/40 rounded-[12px] text-left">
              {formError ? (
                <p className="text-[11px] font-mono text-red-400">{formError}</p>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-widest">
                    Tên hiển thị
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-10 rounded-[8px] bg-surface-container-highest/50 border-outline-variant/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-widest">
                    Khu vực / Địa điểm
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-10 rounded-[8px] bg-surface-container-highest/50 border-outline-variant/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-outline uppercase tracking-widest">
                  Giới thiệu
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[80px] rounded-[8px] bg-surface-container-highest/50 border-outline-variant/20 text-sm"
                  maxLength={500}
                />
              </div>
              {isStreamer ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-widest">
                      Danh mục stream
                    </label>
                    <Input
                      value={streamCategory}
                      onChange={(e) => setStreamCategory(e.target.value)}
                      className="h-10 rounded-[8px] bg-surface-container-highest/50 border-outline-variant/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-widest">
                      Ngôn ngữ
                    </label>
                    <Input
                      value={streamLanguage}
                      onChange={(e) => setStreamLanguage(e.target.value)}
                      className="h-10 rounded-[8px] bg-surface-container-highest/50 border-outline-variant/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-widest">
                      Lịch stream
                    </label>
                    <Input
                      value={streamSchedule}
                      onChange={(e) => setStreamSchedule(e.target.value)}
                      className="h-10 rounded-[8px] bg-surface-container-highest/50 border-outline-variant/20"
                    />
                  </div>
                </div>
              ) : null}
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveProfile()}
                className="rounded-none bg-primary text-black font-bold tracking-widest text-[10px] h-10"
              >
                {saving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">
                  Địa chỉ Email
                </p>
                <p className="text-xs md:text-sm font-medium truncate">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="text-left">
                <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">
                  Số dư ví
                </p>
                <p className="text-xs md:text-sm font-bold text-primary tracking-tight">
                  {walletLoading
                    ? "…"
                    : `${vnd.toLocaleString("vi-VN")} VND`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="text-left">
                <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">
                  Số dư GEM
                </p>
                <p className="text-xs md:text-sm font-bold text-primary tracking-tight">
                  {walletLoading
                    ? "…"
                    : `${gem.toLocaleString("vi-VN")} GEM`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface-container/50 p-2.5 md:p-3 rounded-[12px] border border-outline-variant/5">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-widest">
                  Vai trò tài khoản
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge className="bg-surface-container-highest text-foreground border-none rounded-none px-1.5 py-0 md:px-2 text-[9px] md:text-[10px] font-bold tracking-widest">
                    {roleLabel}
                  </Badge>
                  {!isStreamerRole(profile.role) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 md:h-6 px-1.5 md:px-2 text-[8px] md:text-[9px] font-bold tracking-widest text-primary hover:bg-primary/10 rounded-none border border-primary/20 shrink-0"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("navigate", {
                            detail: "BECOME_STREAMER",
                          }),
                        )
                      }
                    >
                      TRỞ THÀNH STREAMER
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
