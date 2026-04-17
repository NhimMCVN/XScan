import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DonateModal } from "./DonateModal";

export function OperatorAvatar({
  name,
  rank,
  image,
}: {
  name: string;
  rank: string;
  image: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border border-outline-variant/30 p-1 group-hover:border-primary transition-colors bg-surface-container-low">
          <div className="w-full h-full rounded-full overflow-hidden border border-outline-variant/20">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-110 group-hover:scale-100"
              referrerPolicy="no-referrer"
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
        <span className="text-[10px] font-bold text-outline group-hover:text-primary transition-colors tracking-[0.2em] uppercase">
          {name}
        </span>
      </div>
    </div>
  );
}

import { MatchCard } from "./MatchCard";

const MATCHES = [
  {
    sessionId: "99482",
    team1: {
      name: "TEAM_VALOR",
      image: "https://picsum.photos/seed/t1/200/200",
      amount: "12,450 GEM",
      ratio: 65,
    },
    team2: {
      name: "TEAM_MYSTIC",
      image: "https://picsum.photos/seed/t2/200/200",
      amount: "6,700 GEM",
      ratio: 35,
    },
    format: "BO3",
  },
  {
    sessionId: "88102",
    team1: {
      name: "DYNASTY_X",
      image: "https://picsum.photos/seed/t3/200/200",
      amount: "8,200 GEM",
      ratio: 42,
    },
    team2: {
      name: "TITAN_PRO",
      image: "https://picsum.photos/seed/t4/200/200",
      amount: "11,300 GEM",
      ratio: 58,
    },
    format: "BO5",
  },
];

export function MainContent() {
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const handleSupportMatch = (match: any) => {
    setSelectedMatch({
      type: "match",
      team1: match.team1,
      team2: match.team2,
      currentDonation: "$12,450.00", // Mock donation amount
    });
    setIsDonateOpen(true);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-surface relative">
      <div className="scanline" />

      {/* Hero Section */}
      <div className="p-8 space-y-12">
        <div className="relative aspect-[21/9] w-full overflow-hidden border border-outline-variant/20 group cut-corner">
          <img
            src="live-battle-stream.png"
            alt="Hero Battle"
            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

          <div className="absolute top-6 left-6">
            <Badge className="bg-destructive hover:bg-destructive text-white border-none rounded-none px-3 py-1 flex items-center gap-2 font-bold tracking-[0.2em] text-[10px]">
              <div className="w-1.5 h-1.5 bg-white animate-pulse" />
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

          <div className="flex gap-4">
            <Button className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold h-12 px-8 tracking-widest text-[10px] cut-corner-sm border-none">
              BẮT ĐẦU ỦNG HỘ
            </Button>
            <Button
              variant="outline"
              className="border-outline-variant hover:bg-surface-container-high text-foreground font-bold h-12 px-8 tracking-widest text-[10px] cut-corner-sm"
            >
              NÂNG CẤP DỰ TRỮ
            </Button>
          </div>
        </div>

        {/* Ticker */}
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

        {/* Top Operators */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-l-2 border-primary pl-4">
            <h2 className="text-xl font-bold tracking-[0.2em] uppercase">
              ĐẶC VỤ HÀNG ĐẦU
            </h2>
            <span className="text-[10px] font-mono text-outline tracking-widest">
              XẾP HẠNG TOÀN CẦU 00:00:00
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <OperatorAvatar
              name="OPERATOR_AXL"
              rank="01"
              image="https://picsum.photos/seed/op1/200/200"
            />
            <OperatorAvatar
              name="GHOST_WALKER"
              rank="02"
              image="https://picsum.photos/seed/op2/200/200"
            />
            <OperatorAvatar
              name="ZEN_VOID"
              rank="03"
              image="https://picsum.photos/seed/op3/200/200"
            />
            <OperatorAvatar
              name="RAPTOR_7"
              rank="04"
              image="https://picsum.photos/seed/op4/200/200"
            />
          </div>
        </div>

        {/* League of Legends Section */}
        <div className="pt-12 border-t border-outline-variant/10 space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold italic tracking-tighter uppercase text-primary">
              LIÊN MINH HUYỀN THOẠI
            </h2>
            <div className="h-[1px] flex-1 bg-outline-variant/20" />
            <Badge
              variant="outline"
              className="border-primary/30 text-primary rounded-none font-mono text-[9px] tracking-widest px-3"
            >
              24 TRẬN ĐẤU ĐANG DIỄN RA
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
        </div>
      </div>

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        subject={selectedMatch}
      />
    </main>
  );
}
