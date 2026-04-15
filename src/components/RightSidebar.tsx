import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STREAM_DATA = [
  { user: "USER_ALPHA", time: "12:04:12", message: "JUST DROPPED 🔥 2.5K ON THE BATTLE!", avatar: "https://picsum.photos/seed/u1/40/40" },
  { user: "GALAXY_RUN", time: "12:05:55", message: "THE CLUTCH IS REAL 🚀🚀🚀", avatar: "https://picsum.photos/seed/u2/40/40" },
  { user: "DIAMOND_HANDS", time: "12:06:10", message: "COLLECTED 💎 XSCAN REWARDS", avatar: "https://picsum.photos/seed/u3/40/40" },
  { user: "CYBER_PUNK", time: "12:07:01", message: "SYSTEM OVERRIDE DETECTED...", avatar: "https://picsum.photos/seed/u4/40/40" },
];

const REPORTS = [
  { tag: "PATCH_14.2", time: "2H AGO", title: "NEW MAP REVEALED FOR SEASONAL DEPLOYMENT" },
  { tag: "TOURNAMENT", time: "5H AGO", title: "GRAND FINALS PRIZE POOL HITS 1.2M CREDITS" },
  { tag: "META_ALERT", time: "8H AGO", title: "CRITICAL WEAPON ADJUSTMENTS DETECTED IN LAST HOTFIX" },
];

export function RightSidebar() {
  return (
    <aside className="w-80 border-l border-outline-variant/10 bg-surface-container flex flex-col h-[calc(100vh-64px)]">
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-foreground tracking-[0.2em] flex items-center gap-2">
            LIVE_DATA_STREAM
            <span className="w-1.5 h-1.5 bg-primary" />
          </h3>
        </div>
        
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-4">
            {STREAM_DATA.map((item, i) => (
              <div key={i} className="flex gap-3 group bg-surface-container-low p-2 border-l-2 border-transparent hover:border-primary transition-all">
                <Avatar className="h-8 w-8 rounded-none border border-outline-variant/30">
                  <AvatarImage src={item.avatar} referrerPolicy="no-referrer" className="grayscale group-hover:grayscale-0 transition-all" />
                  <AvatarFallback className="bg-surface-container-high text-[10px]">U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary tracking-wider">{item.user}</span>
                    <span className="text-[8px] font-mono text-outline">{item.time}</span>
                  </div>
                  <p className="text-[10px] text-outline leading-relaxed group-hover:text-foreground transition-colors">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 bg-surface-container-high">
        <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] mb-6 flex items-center gap-2">
          <div className="w-3 h-3 border border-outline flex items-center justify-center text-[8px] font-mono">I</div>
          INTEL_REPORTS
        </h3>

        <div className="space-y-6">
          {REPORTS.map((report, i) => (
            <div key={i} className="space-y-1 group cursor-pointer border-b border-outline-variant/10 pb-4 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-primary tracking-widest">{report.tag}</span>
                <span className="text-[8px] font-mono text-outline">{report.time}</span>
              </div>
              <h4 className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight tracking-wide">
                {report.title}
              </h4>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
