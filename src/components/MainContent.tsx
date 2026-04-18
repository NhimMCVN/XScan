import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DonateModal, type DonateModalSubject } from "./DonateModal";
import { MatchCard } from "./MatchCard";
import {
  useDiscoverStreamersQuery,
  type StreamerProfile,
} from "@/src/redux/queries/donate.api";
import { absoluteApiUrl } from "@/src/utils/absoluteApiUrl";
import {
  DEFAULT_HOME_GAME_ZONE_ID,
  HOME_DEMO_MATCH_ZONE_ID,
  HOME_GAME_ZONES,
} from "@/src/constants/homeGameZones";

/** Hero — URL tĩnh (có thể thay bằng import ảnh trong repo) */
const HERO_IMAGE_URL = "https://picsum.photos/seed/xscan-hero-battle/1920/823";

const AVATAR_FALLBACK = "https://placehold.co/160x160/1a1a1a/666666?text=X";

function streamerLabel(p: StreamerProfile): string {
  return String(p.displayName || p.username || "Streamer").trim() || "Streamer";
}

export function StreamerHomeAvatar({
  name,
  rank,
  image,
  onSelect,
}: {
  name: string;
  rank: string;
  image: string;
  onSelect?: () => void;
}) {
  const interactive = Boolean(onSelect);
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onSelect}
      className={`flex flex-col items-center gap-3 group text-left ${interactive ? "cursor-pointer" : "cursor-default opacity-80"}`}
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full border border-outline-variant/30 p-1 group-hover:border-primary transition-colors bg-surface-container-low">
          <div className="w-full h-full rounded-full overflow-hidden border border-outline-variant/20">
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-110 group-hover:scale-100"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = AVATAR_FALLBACK;
              }}
            />
          </div>
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-surface border border-outline-variant/50 px-2 py-0.5 rounded-full">
          <span className="text-[8px] font-bold text-foreground tracking-widest">
            #{rank}
          </span>
        </div>
        {rank === "01" && (
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 bg-primary flex items-center justify-center border border-surface rounded-full">
              <span className="text-[10px] text-black">★</span>
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <span className="text-[10px] font-bold text-outline group-hover:text-primary transition-colors tracking-[0.2em] uppercase line-clamp-2 max-w-[7rem]">
          {name}
        </span>
      </div>
    </button>
  );
}

const MATCHES = [
  {
    sessionId: "99482",
    team1: {
      name: "TEAM_CSDN",
      image: "https://picsum.photos/seed/t1/200/200",
      amount: "12,450 GEM",
      ratio: 65,
    },
    team2: {
      name: "TEAM_Helios",
      image: "https://picsum.photos/seed/t2/200/200",
      amount: "6,700 GEM",
      ratio: 35,
    },
    format: "BO3",
  },
  {
    sessionId: "88102",
    team1: {
      name: "BIBI",
      image: "https://picsum.photos/seed/t3/200/200",
      amount: "8,200 GEM",
      ratio: 42,
    },
    team2: {
      name: "CHIM SẺ ĐI NẮNG",
      image: "https://picsum.photos/seed/t4/200/200",
      amount: "11,300 GEM",
      ratio: 58,
    },
    format: "BO5",
  },
];

interface MainContentProps {
  activeHomeGameZone?: string;
}

export function MainContent({
  activeHomeGameZone = DEFAULT_HOME_GAME_ZONE_ID,
}: MainContentProps) {
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] =
    useState<DonateModalSubject | null>(null);
  const gameZoneAnchorRef = useRef<HTMLDivElement>(null);
  const skipNextGameZoneScroll = useRef(true);

  const { data: discoverRes, isFetching: discoverLoading } =
    useDiscoverStreamersQuery({ page: 1, limit: 24 });

  const topStreamers = useMemo(() => {
    const raw = discoverRes?.data?.streamers ?? [];
    return [...raw]
      .filter((p) => p._id != null && String(p._id).trim() !== "")
      .sort((a, b) => (Number(b.totalAll) || 0) - (Number(a.totalAll) || 0))
      .slice(0, 4);
  }, [discoverRes]);

  const discoverTotal = discoverRes?.data?.total;

  const activeZoneLabel = useMemo(
    () =>
      HOME_GAME_ZONES.find((z) => z.id === activeHomeGameZone)?.label ??
      activeHomeGameZone,
    [activeHomeGameZone],
  );

  useEffect(() => {
    if (skipNextGameZoneScroll.current) {
      skipNextGameZoneScroll.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      gameZoneAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(id);
  }, [activeHomeGameZone]);

  const openDonateStreamer = (p: StreamerProfile) => {
    const id = p._id != null ? String(p._id) : "";
    if (!id) return;
    const pic =
      typeof p.profilePicture === "string" && p.profilePicture.trim()
        ? absoluteApiUrl(p.profilePicture)
        : AVATAR_FALLBACK;
    setSelectedSubject({
      type: "streamer",
      streamerId: id,
      name: streamerLabel(p),
      avatar: pic,
    });
    setIsDonateOpen(true);
  };

  const navigateTo = (view: string) => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: view }));
  };

  const handleSupportMatch = (match: (typeof MATCHES)[0]) => {
    setSelectedSubject({
      type: "match",
      team1: match.team1,
      team2: match.team2,
      currentDonation: "$12,450.00",
    });
    setIsDonateOpen(true);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-surface relative">
      <div className="scanline" />

      <div className="p-8 space-y-12">
        <div className="relative aspect-[21/9] w-full overflow-hidden border border-outline-variant/20 group cut-corner">
          <img
            // src={HERO_IMAGE_URL}
            src={
              "https://genk.mediacdn.vn/2019/11/26/photo-1-15747646273681104143353.jpg"
            }
            alt="Hero Battle"
            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

          <div className="absolute top-6 left-6">
            <Badge className="bg-destructive hover:bg-destructive text-white border-none rounded-none px-3 py-1 flex items-center gap-2 font-bold tracking-[0.2em] text-[10px]">
              <span
                className="mr-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.95)] animate-pulse"
                aria-hidden
              />
              TRỰC TIẾP
            </Badge>
          </div>

          <div className="absolute bottom-6 right-6">
            <div className="bg-surface/80 backdrop-blur-md border border-outline-variant/30 px-3 py-1">
              <span className="text-[10px] font-mono text-outline tracking-widest">
                TÍN HIỆU: 1080P_60FPS
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.9] uppercase">
              THỐNG TRỊ
            </h1>
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.9] uppercase text-primary">
              ĐẤU TRƯỜNG SỐ
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              type="button"
              className="hover:cursor-pointer! bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold h-12 px-8 tracking-widest text-[10px] cut-corner-sm border-none"
              onClick={() => navigateTo("STREAMERS")}
            >
              BẮT ĐẦU ỦNG HỘ
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hover:cursor-pointer! border-outline-variant hover:bg-surface-container-high text-foreground font-bold h-12 px-8 tracking-widest text-[10px] cut-corner-sm"
              onClick={() => navigateTo("STREAMER_CHALLENGES")}
            >
              TẠO THỬ THÁCH
            </Button>
          </div>
        </div>

        <div className="border-y border-outline-variant/10 py-4 -mx-8 px-8 overflow-hidden bg-surface-container-low/30">
          <div className="flex items-center gap-16 whitespace-nowrap animate-marquee">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-16">
                <span className="text-[10px] font-bold text-outline tracking-[0.3em]">
                  ĐÃ GỬI <span className="text-primary">🚀 500K</span> CHO
                  STREAMER_Y
                </span>
                <span className="text-[10px] font-bold text-outline tracking-[0.3em]">
                  ELITE_SNIPER ĐÃ TRIỂN KHAI{" "}
                  <span className="text-primary">💎 250K</span> GEM BOOST
                </span>
                <span className="text-[10px] font-bold text-outline tracking-[0.3em]">
                  COMMANDER_X ĐÃ THAM GIA PHÒNG CHỜ
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-l-2 border-primary pl-4">
            <h2 className="text-xl font-bold tracking-[0.2em] uppercase">
              Streamer hàng đầu
            </h2>
            <span className="text-[10px] font-mono text-outline tracking-widest">
              {discoverLoading
                ? "Đang tải…"
                : typeof discoverTotal === "number"
                  ? `${discoverTotal.toLocaleString("vi-VN")} streamer trên hệ thống`
                  : "Theo tổng ủng hộ"}
            </span>
          </div>

          {discoverLoading && topStreamers.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-outline">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Đang tải streamer…
              </span>
            </div>
          ) : topStreamers.length === 0 ? (
            <p className="text-sm text-outline py-8">
              Chưa có dữ liệu streamer. Hãy thử lại sau hoặc vào mục Streamer.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {topStreamers.map((p, i) => {
                const id = String(p._id);
                const rank = String(i + 1).padStart(2, "0");
                const pic =
                  typeof p.profilePicture === "string" &&
                  p.profilePicture.trim()
                    ? absoluteApiUrl(p.profilePicture)
                    : AVATAR_FALLBACK;
                return (
                  <Fragment key={id}>
                    <StreamerHomeAvatar
                      name={streamerLabel(p)}
                      rank={rank}
                      image={pic}
                      onSelect={() => openDonateStreamer(p)}
                    />
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>

        <div
          ref={gameZoneAnchorRef}
          id="home-game-zone"
          className="scroll-mt-28 pt-12 border-t border-outline-variant/10 space-y-8"
        >
          {activeHomeGameZone === HOME_DEMO_MATCH_ZONE_ID ? (
            <>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold italic tracking-tighter uppercase text-primary">
                  AGE OF EMPIRES
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary rounded-none font-mono text-[9px] tracking-widest px-3"
                >
                  5 CHIẾN DỊCH BATTLE ĐANG DIỄN RA
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {MATCHES.map((match, i) => (
                  <MatchCard
                    key={i}
                    sessionId={match.sessionId}
                    team1={match.team1}
                    team2={match.team2}
                    format={match.format}
                    onSupport={() => handleSupportMatch(match)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[12px] border border-outline-variant/15 bg-surface-container-low/60 px-6 py-12 text-center space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-outline">
                Khu vực đang mở
              </p>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-primary">
                {activeZoneLabel}
              </h2>
              <p className="text-sm text-outline max-w-md mx-auto leading-relaxed">
                Nội dung trận đấu cho tựa game này đang được chuẩn bị. Bạn có
                thể chọn Age of Empires ở sidebar để xem khu vực demo, hoặc vào
                mục Streamer để ủng hộ ngay.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 font-bold tracking-widest text-[10px]"
                onClick={() => navigateTo("STREAMERS")}
              >
                Đến danh sách streamer
              </Button>
            </div>
          )}
        </div>
      </div>

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => {
          setIsDonateOpen(false);
          setSelectedSubject(null);
        }}
        subject={selectedSubject}
      />
    </main>
  );
}
