import { Search, Heart, DollarSign, Facebook, Twitter, Instagram, Youtube, Sword } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DonateModal } from "./DonateModal";
import { DonationHistoryDrawer } from "./DonationHistoryDrawer";
import { ChallengeModal } from "./ChallengeModal";

const FAVORITES = [
  { id: 1, name: "VALKYRIE_09", avatar: "https://picsum.photos/seed/v1/200/200", socials: ["twitter", "youtube", "instagram"], rank: "ELITE" },
  { id: 2, name: "GHOST_TACTIC", avatar: "https://picsum.photos/seed/v2/200/200", socials: ["twitter", "facebook"], rank: "COMMANDER" },
  { id: 3, name: "NEON_REAPER", avatar: "https://picsum.photos/seed/v3/200/200", socials: ["instagram", "youtube", "twitter"], rank: "STRIKER" },
];

const ALL_STREAMERS = [
  { id: 4, name: "CYBER_X", avatar: "https://picsum.photos/seed/v4/200/200", socials: ["twitter", "youtube"], level: "LVL 42 ARCHIVIST" },
  { id: 5, name: "ZERO_RECALL", avatar: "https://picsum.photos/seed/v5/200/200", socials: ["twitter", "facebook"], level: "LVL 89 PREDATOR" },
  { id: 6, name: "MOD_VOID", avatar: "https://picsum.photos/seed/v6/200/200", socials: ["youtube", "twitter"], level: "LVL 12 RECRUIT" },
  { id: 7, name: "PIXEL_REBEL", avatar: "https://picsum.photos/seed/v7/200/200", socials: ["twitter", "instagram"], level: "LVL 67 VETERAN" },
  { id: 8, name: "SUMMIT1G", avatar: "https://picsum.photos/seed/v8/200/200", socials: ["twitter"], level: "LVL 99 LEGEND" },
  { id: 9, name: "ASMONGOLD", avatar: "https://picsum.photos/seed/v9/200/200", socials: ["youtube", "twitter"], level: "LVL 50 WARLORD" },
];

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "facebook": return <Facebook className="w-3 h-3" />;
    case "twitter": return <Twitter className="w-3 h-3" />;
    case "instagram": return <Instagram className="w-3 h-3" />;
    case "youtube": return <Youtube className="w-3 h-3" />;
    default: return null;
  }
}

interface StreamerCardProps {
  streamer: any;
  featured?: boolean;
  onDonate: (streamer: any) => void;
  onChallenge: (streamer: any) => void;
  key?: any;
}

function StreamerCard({ streamer, featured = false, onDonate, onChallenge }: StreamerCardProps) {
  return (
    <div className={`group relative bg-surface-container-low/40 border border-outline-variant/10 p-4 md:p-6 flex flex-col items-center text-center space-y-3 md:space-y-4 transition-all hover:bg-surface-container-low/60`}>
      {/* Background Scanlines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
          backgroundSize: '100% 4px'
        }} />
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className={`rounded-full p-1 transition-all duration-500 ${featured ? 'w-20 h-20 md:w-28 md:h-28 border-2 md:border-4 border-primary shadow-[0_0_25px_rgba(255,184,0,0.3)]' : 'w-16 h-16 md:w-24 md:h-24 border border-outline-variant/30'}`}>
          <div className="w-full h-full rounded-full overflow-hidden border border-outline-variant/20">
            <img 
              src={streamer.avatar} 
              alt={streamer.name} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Favorite Button - Top Right */}
      <button 
        className={`absolute top-2 right-2 md:top-4 md:right-4 z-20 p-2 transition-all hover:scale-110 ${featured ? 'text-primary' : 'text-outline hover:text-primary'}`}
      >
        <Heart className={`h-4 w-4 md:h-5 md:w-5 ${featured ? 'fill-primary' : ''}`} />
      </button>

      {/* Info */}
      <div className="space-y-1 relative z-10">
        <h3 className={`font-display font-bold tracking-[0.1em] uppercase ${featured ? 'text-lg md:text-xl text-foreground' : 'text-xs md:text-sm text-foreground'}`}>
          {streamer.name}
        </h3>
        {!featured && (
          <p className="text-[7px] md:text-[8px] font-mono text-outline tracking-widest uppercase">
            {streamer.level}
          </p>
        )}
      </div>

      {/* Socials */}
      <div className="flex gap-2 md:gap-3 relative z-10">
        {streamer.socials.map((s: string) => (
          <div key={s} className="text-outline hover:text-primary transition-colors cursor-pointer">
            <SocialIcon type={s} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 w-full pt-2 relative z-10">
        <Button 
          onClick={() => onDonate(streamer)}
          className={`font-bold tracking-[0.1em] text-[8px] md:text-[9px] h-8 md:h-10 cut-corner-sm border-none ${featured ? 'bg-primary text-black hover:bg-primary/90' : 'bg-surface-container-highest/50 text-foreground hover:bg-surface-container-highest border border-outline-variant/20'}`}
        >
          ỦNG HỘ
        </Button>
        <Button 
          onClick={() => onChallenge(streamer)}
          className={`font-bold tracking-[0.1em] text-[8px] md:text-[9px] h-8 md:h-10 cut-corner-sm bg-surface-container-highest/50 text-foreground hover:text-primary border border-primary/40 hover:border-primary transition-all`}
        >
          +1 THỬ THÁCH
        </Button>
      </div>
    </div>
  );
}

const RECENT_ACTIVITIES = [
  { id: 1, type: 'donate', name: "VALKYRIE_09", avatar: "https://picsum.photos/seed/v1/100/100", amount: 250, time: "2 PHÚT TRƯỚC" },
  { id: 2, type: 'challenge', name: "GHOST_TACTIC", avatar: "https://picsum.photos/seed/v2/100/100", amount: 50000, time: "15 PHÚT TRƯỚC", content: "Sử dụng rìu trong trận đấu tiếp theo" },
  { id: 3, type: 'donate', name: "NEON_REAPER", avatar: "https://picsum.photos/seed/v3/100/100", amount: 1200, time: "22 PHÚT TRƯỚC" },
  { id: 4, type: 'challenge', name: "CYBER_X", avatar: "https://picsum.photos/seed/v4/100/100", amount: 20000, time: "45 PHÚT TRƯỚC", content: "Chỉ sử dụng súng lục" },
];

export function StreamersView() {
  const [search, setSearch] = useState("");
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedStreamer, setSelectedStreamer] = useState<any>(null);

  const handleOpenDonate = (streamer: any) => {
    setSelectedStreamer({
      type: 'streamer',
      ...streamer
    });
    setIsDonateOpen(true);
  };

  const handleOpenChallenge = (streamer: any) => {
    setSelectedStreamer(streamer);
    setIsChallengeOpen(true);
  };

  const filteredStreamers = ALL_STREAMERS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-surface relative">
      <div className="scanline" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 space-y-8 md:space-y-12 lg:space-y-16 max-w-6xl mx-auto w-full">
          {/* Favorited Streamers */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-l-4 border-primary pl-3 md:pl-4">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase text-foreground italic">STREAMER YÊU THÍCH</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {FAVORITES.map(s => (
                <StreamerCard key={s.id} streamer={s} featured onDonate={handleOpenDonate} onChallenge={handleOpenChallenge} />
              ))}
            </div>
          </section>

          {/* All Streamers */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4 border-l-4 border-primary pl-3 md:pl-4">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase text-foreground italic">DANH SÁCH STREAMER - 1,248</h2>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-outline" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="LỌC THEO CẤP BẬC..." 
                  className="pl-8 md:pl-10 bg-surface-container-low border border-outline-variant/20 focus-visible:ring-primary/50 font-mono text-[9px] md:text-[10px] tracking-widest h-8 md:h-10 rounded-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0 border-l-[3px] md:border-l-[4px] border-l-transparent border-r-[3px] md:border-r-[4px] border-r-transparent border-t-[5px] md:border-t-[6px] border-t-outline" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredStreamers.map(s => (
                <StreamerCard key={s.id} streamer={s} onDonate={handleOpenDonate} onChallenge={handleOpenChallenge} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Right Sidebar: Recent Activities */}
      <aside className="hidden lg:flex w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex-col overflow-hidden relative z-10">
        <div className="p-4 md:p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <h3 className="text-[9px] md:text-[10px] font-bold text-outline tracking-[0.2em] uppercase">HOẠT ĐỘNG GẦN ĐÂY</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            {RECENT_ACTIVITIES.map((item, idx) => (
              <div 
                key={item.id} 
                className={`relative bg-surface-container-low p-4 md:p-5 transition-all border-l-2 ${idx === 0 ? 'border-primary' : 'border-transparent'} hover:bg-surface-container-high group`}
              >
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="relative">
                    <img 
                      src={item.avatar} 
                      alt={item.name} 
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-outline-variant/30"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant/20">
                      {item.type === 'donate' ? (
                        <DollarSign className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary" />
                      ) : (
                        <Sword className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] md:text-[10px] font-bold text-foreground tracking-wider uppercase">{item.name}</span>
                      <span className="text-[7px] md:text-[8px] font-mono text-outline uppercase">{item.time}</span>
                    </div>
                    <p className="text-[8px] md:text-[9px] text-outline uppercase font-bold tracking-widest mt-0.5">
                      {item.type === 'donate' ? 'ỦNG HỘ' : 'THỬ THÁCH'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <div className="text-lg md:text-xl font-display font-bold text-primary tracking-tight">
                    {item.type === 'donate' ? `$${item.amount.toFixed(2)}` : `${item.amount.toLocaleString()} VND`}
                  </div>
                  {item.type === 'challenge' && (
                    <div className="flex items-start gap-1.5 md:gap-2 bg-primary/5 p-1.5 md:p-2 border border-primary/10">
                      <Sword className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary shrink-0 mt-0.5" />
                      <p className="text-[8px] md:text-[9px] text-primary/80 leading-relaxed italic line-clamp-2">
                        {item.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 md:p-4 border-t border-outline-variant/20 bg-surface-container-low/50 relative z-20">
          <Button 
            variant="outline" 
            className="w-full text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase h-10 md:h-12 rounded-none border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            XEM TẤT CẢ LỊCH SỬ
          </Button>
        </div>
      </aside>

      <DonateModal 
        isOpen={isDonateOpen} 
        onClose={() => setIsDonateOpen(false)} 
        subject={selectedStreamer}
      />

      <ChallengeModal 
        isOpen={isChallengeOpen}
        onClose={() => setIsChallengeOpen(false)}
        streamer={selectedStreamer}
      />

      <DonationHistoryDrawer 
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
}
