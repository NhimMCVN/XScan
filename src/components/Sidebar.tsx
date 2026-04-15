import { Gamepad2, Shield, Sword, Target, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZONES = [
  { name: "LEAGUE OF LEGENDS", icon: Gamepad2, active: true },
  { name: "VALORANT", icon: Shield, active: false },
  { name: "AGE OF EMPIRES", icon: Sword, active: false },
  { name: "CS2", icon: Target, active: false },
  { name: "ARENA OF VALOR", icon: Zap, active: false },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-outline-variant/10 bg-surface-container flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4">
        <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] mb-6 px-2">ACTIVE_ZONES</h3>
        
        <div className="space-y-1">
          {ZONES.map((zone) => (
            <button
              key={zone.name}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all group relative ${
                zone.active 
                  ? "bg-primary/5 text-primary" 
                  : "text-outline hover:bg-surface-container-high hover:text-foreground"
              }`}
            >
              {zone.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
              <zone.icon className={`h-5 w-5 ${zone.active ? "text-primary" : "group-hover:text-primary"}`} />
              <span className="font-display font-bold text-[11px] tracking-widest">{zone.name}</span>
              {zone.active && <div className="absolute right-4 w-1 h-1 bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="text-[9px] font-bold text-primary tracking-widest">SYSTEM STATUS: OPTIMAL</span>
        </div>
        
        <Button className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold h-12 tracking-widest text-[10px] cut-corner-sm border-none">
          UPGRADE COMMS
        </Button>
      </div>
    </aside>
  );
}
