import type { LucideIcon } from "lucide-react";
import { Gamepad2, Shield, Sword, Target, Zap } from "lucide-react";

export interface HomeGameZoneDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** Thứ tự = ưu tiên sidebar; mục đầu là mặc định khi vào trang chủ. */
export const HOME_GAME_ZONES: HomeGameZoneDef[] = [
  { id: "AGE_OF_EMPIRES", label: "AGE OF EMPIRES", icon: Sword },
  { id: "LEAGUE_OF_LEGENDS", label: "LEAGUE OF LEGENDS", icon: Gamepad2 },
  { id: "VALORANT", label: "VALORANT", icon: Shield },
  { id: "CS2", label: "CS2", icon: Target },
  { id: "ARENA_OF_VALOR", label: "ARENA OF VALOR", icon: Zap },
];

export const DEFAULT_HOME_GAME_ZONE_ID = HOME_GAME_ZONES[0].id;

/** Khu vực hiển thị lưới trận / battle demo trên trang chủ */
export const HOME_DEMO_MATCH_ZONE_ID = "AGE_OF_EMPIRES";
