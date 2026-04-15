import { Search, Heart, DollarSign, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DonateModal } from "./DonateModal";
import { DonationHistoryDrawer } from "./DonationHistoryDrawer";

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
  key?: any;
}

function StreamerCard({ streamer, featured = false, onDonate }: StreamerCardProps) {
  return (
    <div className={`group relative bg-surface-container-low/40 border border-outline-variant/10 p-6 flex flex-col items-center text-center space-y-4 transition-all hover:bg-surface-container-low/60`}>
      {/* Background Scanlines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
          backgroundSize: '100% 4px'
        }} />
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className={`rounded-full p-1 transition-all duration-500 ${featured ? 'w-28 h-28 border-4 border-primary shadow-[0_0_25px_rgba(255,184,0,0.3)]' : 'w-24 h-24 border border-outline-variant/30'}`}>
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

      {/* Info */}
      <div className="space-y-1 relative z-10">
        <h3 className={`font-display font-bold tracking-[0.1em] uppercase ${featured ? 'text-xl text-foreground' : 'text-sm text-foreground'}`}>
          {streamer.name}
        </h3>
        {!featured && (
          <p className="text-[8px] font-mono text-outline tracking-widest uppercase">
            {streamer.level}
          </p>
        )}
      </div>

      {/* Socials */}
      <div className="flex gap-3 relative z-10">
        {streamer.socials.map((s: string) => (
          <div key={s} className="text-outline hover:text-primary transition-colors cursor-pointer">
            <SocialIcon type={s} />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full pt-2 relative z-10">
        <Button 
          onClick={() => onDonate(streamer)}
          className={`flex-1 font-bold tracking-[0.2em] text-[10px] h-10 cut-corner-sm border-none ${featured ? 'bg-primary text-black hover:bg-primary/90' : 'bg-surface-container-highest/50 text-foreground hover:bg-surface-container-highest border border-outline-variant/20'}`}
        >
          DONATE
        </Button>
        <Button 
          size="icon" 
          className={`h-10 w-10 cut-corner-sm border-none ${featured ? 'bg-surface-container-highest text-primary hover:text-primary' : 'bg-surface-container-highest/50 text-outline hover:text-primary border border-outline-variant/20'}`}
        >
          <Heart className={`h-4 w-4 ${featured ? 'fill-primary' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

const DONATION_HISTORY = [
  { id: 1, name: "VALKYRIE_09", avatar: "https://picsum.photos/seed/v1/100/100", amount: 250, time: "2M AGO", badge: "square" },
  { id: 2, name: "GHOST_TACTIC", avatar: "https://picsum.photos/seed/v2/100/100", amount: 50, time: "15M AGO", badge: null },
  { id: 3, name: "NEON_REAPER", avatar: "https://picsum.photos/seed/v3/100/100", amount: 1200, time: "22M AGO", badge: "medal" },
  { id: 4, name: "CYBER_X", avatar: "https://picsum.photos/seed/v4/100/100", amount: 25, time: "45M AGO", badge: null },
];

export function StreamersView() {
  const [search, setSearch] = useState("");
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedStreamer, setSelectedStreamer] = useState<any>(null);

  const handleOpenDonate = (streamer: any) => {
    setSelectedStreamer({
      type: 'streamer',
      ...streamer
    });
    setIsDonateOpen(true);
  };

  const filteredStreamers = ALL_STREAMERS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-surface relative">
      <div className="scanline" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-16 max-w-6xl mx-auto w-full">
          {/* Favorited Streamers */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-l-4 border-primary pl-4">
              <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground italic">FAVORITED_STREAMERS</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FAVORITES.map(s => (
                <StreamerCard key={s.id} streamer={s} featured onDonate={handleOpenDonate} />
              ))}
            </div>
          </section>

          {/* All Streamers */}
          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 border-l-4 border-primary pl-4">
                <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground italic">STREAMERS - 1,248</h2>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="FILTER_BY_RANK..." 
                  className="pl-10 bg-surface-container-low border border-outline-variant/20 focus-visible:ring-primary/50 font-mono text-[10px] tracking-widest h-10 rounded-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-outline" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStreamers.map(s => (
                <StreamerCard key={s.id} streamer={s} onDonate={handleOpenDonate} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Right Sidebar: Donation History */}
      <aside className="w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest/50 flex flex-col overflow-hidden relative z-10">
        <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
          <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase">DONATION_HISTORY</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {DONATION_HISTORY.map((item, idx) => (
              <div 
                key={item.id} 
                className={`relative bg-surface-container-low p-6 transition-all border-l-2 ${idx === 0 ? 'border-primary' : 'border-transparent'} hover:bg-surface-container-high`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={item.avatar} 
                    alt={item.name} 
                    className="w-8 h-8 rounded-full border border-outline-variant/30"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-foreground tracking-wider uppercase">{item.name}</span>
                      <span className="text-[9px] font-mono text-outline uppercase">{item.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-display font-bold text-primary tracking-tight">
                    ${item.amount.toFixed(2)}
                  </div>
                  {item.badge === 'square' && (
                    <div className="w-2.5 h-2.5 bg-primary" />
                  )}
                  {item.badge === 'medal' && (
                    <div className="text-primary">
                      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                        <path d="M6 0L0 3V8C0 11.31 2.55 14.39 6 15.19C9.45 14.39 12 11.31 12 8V3L6 0ZM6 10.5C4.62 10.5 3.5 9.38 3.5 8C3.5 6.62 4.62 5.5 6 5.5C7.38 5.5 8.5 6.62 8.5 8C8.5 9.38 7.38 10.5 6 10.5Z" />
                        <path d="M6 12L4.5 14L6 13L7.5 14L6 12Z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/50 relative z-20">
          <Button 
            variant="outline" 
            className="w-full text-[10px] font-bold tracking-[0.2em] uppercase h-12 rounded-none border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            VIEW ALL HISTORY
          </Button>
        </div>
      </aside>

      <DonateModal 
        isOpen={isDonateOpen} 
        onClose={() => setIsDonateOpen(false)} 
        subject={selectedStreamer}
      />

      <DonationHistoryDrawer 
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
}
