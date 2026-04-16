import {
  Search,
  Heart,
  DollarSign,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Sword,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DonateModal } from "./DonateModal";
import { DonationHistoryDrawer } from "./DonationHistoryDrawer";
import { ChallengeModal } from "./ChallengeModal";
import { useDiscoverStreamersQuery } from "@/src/redux/queries/donate.api";
import type { StreamerProfile } from "@/src/redux/queries/donate.api";
import {
  useGetFavoriteStreamersQuery,
  useAddFavoriteStreamerMutation,
  useRemoveFavoriteStreamerMutation,
  type FavoriteStreamerRecord,
} from "@/src/redux/queries/favoriteStreamers.api";
import { useGetPublicLeaderboardDonorsQuery } from "@/src/redux/queries/public.api";
import { useAuthSelector } from "@/src/redux/slices/auth.slice";

const AVATAR_PLACEHOLDER =
  "https://placehold.co/400x400/1a1a1a/666666?text=XSCAN";

export type StreamerCardModel = {
  id: string;
  name: string;
  avatar: string;
  socials: string[];
  level: string;
};

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "facebook":
      return <Facebook className="w-3 h-3" />;
    case "twitter":
      return <Twitter className="w-3 h-3" />;
    case "instagram":
      return <Instagram className="w-3 h-3" />;
    case "youtube":
      return <Youtube className="w-3 h-3" />;
    default:
      return null;
  }
}

function socialsFromProfile(p: StreamerProfile): string[] {
  const out: string[] = [];
  const r = p as Record<string, unknown>;
  if (r.facebookHandle) out.push("facebook");
  if (r.twitterHandle) out.push("twitter");
  if (r.instagramHandle) out.push("instagram");
  if (r.youtubeChannel) out.push("youtube");
  return out;
}

function formatLevelLine(p: StreamerProfile): string {
  if (p.streamCategory) return String(p.streamCategory).toUpperCase();
  if (typeof p.totalAll === "number" && p.totalAll > 0) {
    return `TỔNG ỦNG HỘ ${p.totalAll.toLocaleString("vi-VN")}`;
  }
  return "STREAMER";
}

function profileToCardModel(p: StreamerProfile): StreamerCardModel | null {
  const id = p._id != null ? String(p._id) : "";
  if (!id) return null;
  return {
    id,
    name: String(p.displayName || p.username || id).toUpperCase(),
    avatar: p.profilePicture || AVATAR_PLACEHOLDER,
    socials: socialsFromProfile(p),
    level: formatLevelLine(p),
  };
}

function favoriteToCardModel(
  rec: FavoriteStreamerRecord,
): StreamerCardModel | null {
  const s = rec.streamer;
  const id = String(rec.streamerId || s?._id || rec.id || "");
  if (!id) return null;
  return {
    id,
    name: String(s?.displayName || s?.username || "STREAMER").toUpperCase(),
    avatar: s?.profilePicture || AVATAR_PLACEHOLDER,
    socials: [],
    level: s?.bio ? String(s.bio).slice(0, 48).toUpperCase() : "YÊU THÍCH",
  };
}

interface StreamerTileProps {
  streamer: StreamerCardModel;
  featured?: boolean;
  isFavorite: boolean;
  favoriteBusy?: boolean;
  favoriteDisabled?: boolean;
  onDonate: (streamer: StreamerCardModel) => void;
  onChallenge: (streamer: StreamerCardModel) => void;
  onToggleFavorite: (streamer: StreamerCardModel) => void | Promise<void>;
}

function StreamerTile({
  streamer,
  featured = false,
  isFavorite,
  favoriteBusy,
  favoriteDisabled,
  onDonate,
  onChallenge,
  onToggleFavorite,
}: StreamerTileProps) {
  return (
    <div
      className={`group relative bg-surface-container-low/40 border border-outline-variant/10 p-6 flex flex-col items-center text-center space-y-4 transition-all hover:bg-surface-container-low/60`}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)",
            backgroundSize: "100% 4px",
          }}
        />
      </div>

      <div className="relative">
        <div
          className={`rounded-full p-1 transition-all duration-500 ${featured ? "w-28 h-28 border-4 border-primary shadow-[0_0_25px_rgba(255,184,0,0.3)]" : "w-24 h-24 border border-outline-variant/30"}`}
        >
          <div className="w-full h-full rounded-full overflow-hidden border border-outline-variant/20">
            <img
              src={streamer.avatar}
              alt={streamer.name}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = AVATAR_PLACEHOLDER;
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={favoriteDisabled || favoriteBusy}
        title={
          favoriteDisabled
            ? "Đăng nhập để dùng yêu thích"
            : isFavorite
              ? "Bỏ yêu thích"
              : "Thêm yêu thích"
        }
        onClick={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!favoriteDisabled && !favoriteBusy) onToggleFavorite(streamer);
        }}
        className={`absolute top-4 right-4 z-20 p-2 transition-all hover:scale-110 disabled:opacity-40 disabled:pointer-events-none ${isFavorite ? "text-primary" : "text-outline hover:text-primary"}`}
      >
        <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary" : ""}`} />
      </button>

      <div className="space-y-1 relative z-10">
        <h3
          className={`font-display font-bold tracking-[0.1em] uppercase ${featured ? "text-xl text-foreground" : "text-sm text-foreground"}`}
        >
          {streamer.name}
        </h3>
        {!featured && (
          <p className="text-[7px] md:text-[8px] font-mono text-outline tracking-widest uppercase">
            {streamer.level}
          </p>
        )}
      </div>

      {streamer.socials.length > 0 && (
        <div className="flex gap-3 relative z-10">
          {streamer.socials.map((s) => (
            <div
              key={s}
              className="text-outline hover:text-primary transition-colors cursor-pointer"
            >
              <SocialIcon type={s} />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 w-full pt-2 relative z-10">
        <Button
          type="button"
          onClick={() => onDonate(streamer)}
          className={`font-bold tracking-[0.1em] text-[9px] h-10 cut-corner-sm border-none ${featured ? "bg-primary text-black hover:bg-primary/90" : "bg-surface-container-highest/50 text-foreground hover:bg-surface-container-highest border border-outline-variant/20"}`}
        >
          ỦNG HỘ
        </Button>
        <Button
          type="button"
          onClick={() => onChallenge(streamer)}
          className="font-bold tracking-[0.1em] text-[9px] h-10 cut-corner-sm bg-surface-container-highest/50 text-foreground hover:text-primary border border-primary/40 hover:border-primary transition-all"
        >
          +1 THỬ THÁCH
        </Button>
      </div>
    </div>
  );
}

export function StreamersView() {
  const { isAuthenticated } = useAuthSelector();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedStreamer, setSelectedStreamer] =
    useState<StreamerCardModel | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const discoverArgs = useMemo(
    () => ({
      search: deferredSearch || undefined,
      page: 1,
      limit: 24,
    }),
    [deferredSearch],
  );

  const {
    data: discoverRes,
    isLoading: discoverLoading,
    isFetching: discoverFetching,
    error: discoverError,
  } = useDiscoverStreamersQuery(discoverArgs);

  const {
    data: favRes,
    isLoading: favLoading,
    isFetching: favFetching,
  } = useGetFavoriteStreamersQuery(
    { page: 1, limit: 50 },
    { skip: !isAuthenticated },
  );

  const { data: leaderboardRes, isLoading: leaderboardLoading } =
    useGetPublicLeaderboardDonorsQuery({ period: "month" });

  const [addFavorite, { isLoading: addFavBusy }] =
    useAddFavoriteStreamerMutation();
  const [removeFavorite, { isLoading: remFavBusy }] =
    useRemoveFavoriteStreamerMutation();

  const favoriteBusy = addFavBusy || remFavBusy;

  const favoriteIds = useMemo(() => {
    const set = new Set<string>();
    const list = favRes?.data?.favorites ?? [];
    for (const rec of list) {
      const id = rec.streamerId || rec.streamer?._id || rec.id;
      if (id) set.add(String(id));
    }
    return set;
  }, [favRes]);

  const favoriteCards = useMemo(() => {
    const list = favRes?.data?.favorites ?? [];
    return list
      .map((r) => favoriteToCardModel(r))
      .filter((x): x is StreamerCardModel => Boolean(x));
  }, [favRes]);

  const allCards = useMemo(() => {
    const raw = discoverRes?.data?.streamers ?? [];
    return raw
      .map((p) => profileToCardModel(p))
      .filter((x): x is StreamerCardModel => Boolean(x));
  }, [discoverRes]);

  const totalStreamers = discoverRes?.data?.total ?? allCards.length;

  const leaderboardDonors = leaderboardRes?.data ?? [];

  const handleOpenDonate = useCallback((streamer: StreamerCardModel) => {
    setSelectedStreamer(streamer);
    setIsDonateOpen(true);
  }, []);

  const handleOpenChallenge = useCallback((streamer: StreamerCardModel) => {
    setSelectedStreamer(streamer);
    setIsChallengeOpen(true);
  }, []);

  const toggleFavorite = useCallback(
    async (streamer: StreamerCardModel) => {
      if (!isAuthenticated) return;
      setBanner(null);
      const id = streamer.id;
      const isFav = favoriteIds.has(id);
      try {
        if (isFav) await removeFavorite(id).unwrap();
        else await addFavorite(id).unwrap();
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "data" in e
            ? String(
                (
                  e as {
                    data?: { message?: string; error?: { message?: string } };
                  }
                ).data?.message ||
                  (e as { data?: { error?: { message?: string } } }).data?.error
                    ?.message ||
                  "",
              )
            : "";
        setBanner(msg || "Không cập nhật được yêu thích.");
      }
    },
    [isAuthenticated, favoriteIds, removeFavorite, addFavorite],
  );

  const donateSubject = selectedStreamer
    ? {
        type: "streamer" as const,
        streamerId: selectedStreamer.id,
        name: selectedStreamer.name,
        avatar: selectedStreamer.avatar,
        level: selectedStreamer.level,
      }
    : null;

  const challengeStreamer = selectedStreamer
    ? { name: selectedStreamer.name, id: selectedStreamer.id }
    : null;

  const discoverPending = discoverLoading || discoverFetching;
  const favPending = isAuthenticated && (favLoading || favFetching);

  return (
    <div className="flex-1 flex overflow-hidden bg-surface relative">
      <div className="scanline" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-16 max-w-6xl mx-auto w-full">
          {banner && (
            <p className="text-[11px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-2">
              {banner}
            </p>
          )}

          <section className="space-y-8">
            <div className="flex items-center gap-4 border-l-4 border-primary pl-4">
              <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground italic">
                STREAMER YÊU THÍCH
              </h2>
            </div>
            {!isAuthenticated && (
              <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
                Đăng nhập để xem và quản lý streamer yêu thích.
              </p>
            )}
            {isAuthenticated && favPending && (
              <p className="text-[10px] font-mono text-primary tracking-widest uppercase">
                ĐANG TẢI DANH SÁCH YÊU THÍCH...
              </p>
            )}
            {isAuthenticated && !favPending && favoriteCards.length === 0 && (
              <p className="text-[10px] font-mono text-outline tracking-widest uppercase">
                Chưa có streamer yêu thích — thêm từ danh sách bên dưới.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {favoriteCards.map((s) => (
                <Fragment key={s.id}>
                  <StreamerTile
                    streamer={s}
                    featured
                    isFavorite
                    favoriteBusy={favoriteBusy}
                    favoriteDisabled={!isAuthenticated}
                    onDonate={handleOpenDonate}
                    onChallenge={handleOpenChallenge}
                    onToggleFavorite={toggleFavorite}
                  />
                </Fragment>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 border-l-4 border-primary pl-4">
                <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground italic">
                  DANH SÁCH STREAMER — {totalStreamers.toLocaleString("vi-VN")}
                </h2>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="TÌM THEO TÊN / USERNAME..."
                  className="pl-10 bg-surface-container-low border border-outline-variant/20 focus-visible:ring-primary/50 font-mono text-[10px] tracking-widest h-10 rounded-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0 border-l-[3px] md:border-l-[4px] border-l-transparent border-r-[3px] md:border-r-[4px] border-r-transparent border-t-[5px] md:border-t-[6px] border-t-outline" />
                </div>
              </div>
            </div>

            {discoverError && (
              <p className="text-[11px] font-mono text-red-400">
                Không tải được danh sách streamer. Thử lại sau.
              </p>
            )}
            {discoverPending && (
              <p className="text-[10px] font-mono text-primary tracking-widest uppercase">
                ĐANG TẢI DANH SÁCH...
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allCards.map((s) => (
                <Fragment key={s.id}>
                  <StreamerTile
                    streamer={s}
                    isFavorite={favoriteIds.has(s.id)}
                    favoriteBusy={favoriteBusy}
                    favoriteDisabled={!isAuthenticated}
                    onDonate={handleOpenDonate}
                    onChallenge={handleOpenChallenge}
                    onToggleFavorite={toggleFavorite}
                  />
                </Fragment>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">
            TOP ỦNG HỘ TRONG THÁNG
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {leaderboardLoading && (
              <p className="text-[9px] font-mono text-outline uppercase">
                Đang tải...
              </p>
            )}
            {!leaderboardLoading && leaderboardDonors.length === 0 && (
              <p className="text-[9px] font-mono text-outline uppercase">
                Chưa có dữ liệu bảng xếp hạng tháng này.
              </p>
            )}
            {leaderboardDonors.map((item, idx) => {
              const label = String(
                item.displayName || item.username || "ẨN DANH",
              ).toUpperCase();
              const amount = item.totalAmount ?? 0;
              const amountText = `${amount.toLocaleString("vi-VN")} VND`;
              const count = item.donationCount ?? 0;
              const streamers = item.streamerCount ?? 0;

              return (
                <div
                  key={item.donorId || `${label}-${idx}`}
                  className={`relative bg-surface-container-low p-5 transition-all border-l-2 ${idx === 0 ? "border-primary" : "border-transparent"} hover:bg-surface-container-high group`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <img
                        src={item.profilePicture || AVATAR_PLACEHOLDER}
                        alt={label}
                        className="w-8 h-8 rounded-full border border-outline-variant/30 object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            AVATAR_PLACEHOLDER;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant/20">
                        <DollarSign className="w-2.5 h-2.5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-foreground tracking-wider uppercase truncate">
                          {label}
                        </span>
                        <span className="text-[8px] font-mono text-outline uppercase shrink-0">
                          THÁNG
                        </span>
                      </div>
                      <p className="text-[9px] text-outline uppercase font-bold tracking-widest mt-0.5">
                        TỔNG ỦNG HỘ TRONG THÁNG
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xl font-display font-bold text-primary tracking-tight">
                      {amountText}
                    </div>
                    <div className="flex items-start gap-2 bg-primary/5 p-2 border border-primary/10">
                      <Sword className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      <p className="text-[9px] text-primary/80 leading-relaxed line-clamp-2">
                        {count} lần ủng hộ · {streamers} streamer
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/50 relative z-20">
          <Button
            variant="outline"
            className="w-full text-[10px] font-bold tracking-[0.2em] uppercase h-12 rounded-none border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            XEM TẤT CẢ LỊCH SỬ
          </Button>
        </div>
      </aside>

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        subject={donateSubject}
      />

      <ChallengeModal
        isOpen={isChallengeOpen}
        onClose={() => setIsChallengeOpen(false)}
        streamer={challengeStreamer}
      />

      <DonationHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
}
