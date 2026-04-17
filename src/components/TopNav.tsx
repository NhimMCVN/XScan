import { Search, LogOut, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pathFromView } from "@/src/utils/appNavigation";

const NAV_ITEMS = [
  { id: "MATCHES", label: "TRẬN ĐẤU" },
  { id: "STREAMERS", label: "STREAMER" },
  { id: "STREAMER_CHALLENGES", label: "CHALLENGE" },
  { id: "BECOME_STREAMER", label: "TRỞ THÀNH STREAMER" },
] as const;

interface TopNavProps {
  currentView: string;
}

export function TopNav({ currentView }: TopNavProps) {
  return (
    <nav className="h-16 border-b border-outline-variant/10 bg-surface flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("navigate", { detail: "MATCHES" }))
          }
        >
          <div className="w-8 h-8 bg-primary flex items-center justify-center rotate-45 group-hover:scale-110 transition-transform">
            <span className="text-on-primary font-bold text-xl -rotate-45">X</span>
          </div>
          <span
            className={cn(
              "font-display font-bold text-2xl tracking-tighter italic transition-colors",
              currentView === "MATCHES"
                ? "text-primary"
                : "text-primary/75 group-hover:text-primary",
            )}
          >
            XScan
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.id;
            return (
              <a
                key={item.id}
                href={pathFromView(item.id)}
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(
                    new CustomEvent("navigate", { detail: item.id }),
                  );
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-bold px-1 text-xs tracking-widest uppercase transition-colors",
                  active
                    ? "text-primary"
                    : "text-outline hover:text-primary",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <Input 
            placeholder="TÌM KIẾM THÔNG TIN..." 
            className="pl-10 bg-surface-container-highest border-none focus-visible:ring-primary/50 font-mono text-[10px] tracking-widest h-9"
          />
          <div className="absolute right-1 top-1 bottom-1 w-1 bg-primary/20" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Toggle (Demo) */}
        <Button
          variant="outline"
          size="sm"
          className="text-[9px] font-bold tracking-widest uppercase border-primary/30 text-primary hover:bg-primary hover:text-black h-8"
          onClick={() => window.dispatchEvent(new CustomEvent('toggleRole'))}
        >
          ĐỔI ROLE
        </Button>

        {/* Wallet Info */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest/50 border border-outline-variant/10">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold text-primary tracking-tight">2,450,000 VND</span>
        </div>

        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("navigate", { detail: "PROFILE" }))
          }
          aria-label="Hồ sơ"
          aria-current={currentView === "PROFILE" ? "page" : undefined}
          className={cn(
            "w-10 h-10 border bg-surface-container-high p-0.5 transition-all cursor-pointer",
            currentView === "PROFILE"
              ? "border-primary"
              : "border-outline-variant/30 hover:border-primary",
          )}
        >
          <div className="w-full h-full bg-surface-container overflow-hidden">
            <img 
              src="https://picsum.photos/seed/user1/100/100" 
              alt="User" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
            />
          </div>
        </button>
        <div className="h-8 w-[1px] bg-outline-variant/20 mx-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-outline hover:text-destructive hover:bg-surface-container transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'LOGOUT' }))}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}
