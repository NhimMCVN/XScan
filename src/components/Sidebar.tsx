import { Button } from "@/components/ui/button";
import {
  DEFAULT_HOME_GAME_ZONE_ID,
  HOME_GAME_ZONES,
} from "@/src/constants/homeGameZones";

interface SidebarProps {
  activeGameZone?: string;
  onGameZoneChange?: (zoneId: string) => void;
}

export function Sidebar({
  activeGameZone = DEFAULT_HOME_GAME_ZONE_ID,
  onGameZoneChange,
}: SidebarProps) {
  const navigateTo = (view: string) => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: view }));
  };

  return (
    <aside className="w-64 border-r border-outline-variant/10 bg-surface-container flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4">
        <h3 className="text-[10px] font-bold text-outline tracking-[0.2em] mb-6 px-2">
          KHU VỰC HOẠT ĐỘNG
        </h3>

        <div className="space-y-1">
          {HOME_GAME_ZONES.map((zone) => {
            const active = activeGameZone === zone.id;
            const Icon = zone.icon;
            return (
              <button
                key={zone.id}
                type="button"
                aria-pressed={active}
                onClick={() => onGameZoneChange?.(zone.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all group relative ${
                  active
                    ? "bg-primary/5 text-primary"
                    : "text-outline hover:bg-surface-container-high hover:text-foreground"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 ${active ? "text-primary" : "group-hover:text-primary"}`}
                />
                <span className="font-display font-bold text-[11px] tracking-widest text-left">
                  {zone.label}
                </span>
                {active && (
                  <div className="absolute right-4 w-1 h-1 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="text-[9px] font-bold text-primary tracking-widest">
            TRẠNG THÁI HỆ THỐNG: TỐI ƯU
          </span>
        </div>

        <Button
          type="button"
          className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold h-12 tracking-widest text-[10px] cut-corner-sm border-none"
          onClick={() => navigateTo("PROFILE")}
        >
          NÂNG CẤP LIÊN LẠC
        </Button>
      </div>
    </aside>
  );
}
