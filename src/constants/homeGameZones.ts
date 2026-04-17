import type { LucideIcon } from "lucide-react";
import { Gamepad2, Shield, Sword, Target, Zap } from "lucide-react";

export interface HomeGameZoneDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const HOME_GAME_ZONES: HomeGameZoneDef[] = [
  { id: "LEAGUE_OF_LEGENDS", label: "LEAGUE OF LEGENDS", icon: Gamepad2 },
  { id: "VALORANT", label: "VALORANT", icon: Shield },
  { id: "AGE_OF_EMPIRES", label: "AGE OF EMPIRES", icon: Sword },
  { id: "CS2", label: "CS2", icon: Target },
  { id: "ARENA_OF_VALOR", label: "ARENA OF VALOR", icon: Zap },
];

export const DEFAULT_HOME_GAME_ZONE_ID = HOME_GAME_ZONES[0].id;
