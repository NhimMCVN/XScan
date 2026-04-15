import { Search, Settings, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <nav className="h-16 border-b border-outline-variant/10 bg-surface flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary flex items-center justify-center rotate-45">
            <span className="text-on-primary font-bold text-xl -rotate-45">X</span>
          </div>
          <span className="font-display font-bold text-2xl tracking-tighter italic text-primary">XScan</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          {['MATCHES', 'LEAGUES', 'STREAMERS', 'PROFILE', 'PLAYERS', 'STATS'].map((item) => (
            <a 
              key={item}
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('navigate', { detail: item }));
              }}
              className="text-outline hover:text-primary transition-colors font-bold pb-1 px-1 text-xs tracking-widest uppercase"
            >
              {item}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <Input 
            placeholder="SEARCH INTEL..." 
            className="pl-10 bg-surface-container-highest border-none focus-visible:ring-primary/50 font-mono text-[10px] tracking-widest h-9"
          />
          <div className="absolute right-1 top-1 bottom-1 w-1 bg-primary/20" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-outline hover:text-primary hover:bg-surface-container">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-outline hover:text-primary hover:bg-surface-container relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary" />
        </Button>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'PROFILE' }))}
          className="w-10 h-10 border border-outline-variant/30 bg-surface-container-high p-0.5 hover:border-primary transition-all cursor-pointer"
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
      </div>
    </nav>
  );
}
