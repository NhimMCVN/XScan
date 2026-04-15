import { Button } from "@/components/ui/button";

interface MatchCardProps {
  key?: string | number;
  sessionId: string;
  team1: { name: string; image: string; amount: string; ratio: number };
  team2: { name: string; image: string; amount: string; ratio: number };
  format: string;
  onSupport?: () => void;
}

export function MatchCard({ sessionId, team1, team2, format, onSupport }: MatchCardProps) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 p-6 relative group cut-corner-sm">
      {/* Background Scanlines Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
          backgroundSize: '100% 4px'
        }} />
      </div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-outline tracking-[0.2em]">MÃ PHIÊN: {sessionId}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-destructive animate-pulse" />
            <span className="text-[9px] font-bold text-destructive tracking-widest">TRỰC TIẾP</span>
          </div>
        </div>

        {/* Matchup */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-3 text-center">
            <div className="aspect-square w-full border border-primary/40 p-1 bg-surface-container">
              <img 
                src={team1.image} 
                alt={team1.name} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase truncate">{team1.name}</h4>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold italic text-primary tracking-tighter">VS</span>
            <span className="text-[8px] font-mono text-outline tracking-widest">{format}</span>
          </div>

          <div className="flex-1 space-y-3 text-center">
            <div className="aspect-square w-full border border-outline-variant/30 p-1 bg-surface-container">
              <img 
                src={team2.image} 
                alt={team2.name} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase truncate">{team2.name}</h4>
          </div>
        </div>

        {/* Support Intel */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-outline tracking-widest uppercase">THÔNG TIN ỦNG HỘ</span>
              <span className="text-[8px] font-mono text-foreground tracking-widest">
                {team1.amount} vs {team2.amount}
              </span>
            </div>
            <div className="h-1 bg-surface-container-highest w-full relative">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary shadow-[0_0_8px_rgba(255,184,0,0.5)]" 
                style={{ width: `${team1.ratio}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-primary tracking-widest uppercase">MỤC TIÊU TRẬN ĐẤU</span>
              <span className="text-[8px] font-mono text-foreground tracking-widest">
                19,150 / 50,000 GEM
              </span>
            </div>
            <div className="h-1 bg-surface-container-highest w-full relative">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary/40" 
                style={{ width: `38%` }}
              />
            </div>
          </div>
        </div>

        {/* Action */}
        <Button 
          onClick={onSupport}
          variant="outline" 
          className="w-full border-outline-variant/30 hover:bg-surface-container-high hover:text-primary text-[10px] font-bold tracking-[0.2em] h-10 uppercase transition-all"
        >
          ỦNG HỘ ĐỘI HÌNH
        </Button>
      </div>
    </div>
  );
}
