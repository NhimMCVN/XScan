import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
  type ChangeEvent,
} from "react";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
  Music2,
} from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getPublicAppOrigin } from "@/src/constants";
import { absoluteApiUrl } from "@/src/utils/absoluteApiUrl";
import { useGetProfileQuery } from "@/src/redux/queries/user.api";
import {
  useGetMySettingsQuery,
  useCreateSettingsMutation,
  useUpdateMySettingsMutation,
  useGetDonationLevelsQuery,
  useAddDonationLevelMutation,
  useUpdateDonationLevelMutation,
  useDeleteDonationLevelMutation,
  useRegenerateTokenMutation,
  useUploadMediaMutation,
  useDeleteMediaMutation,
  type DonationLevelDTO,
  type ApiResponse,
  type MediaUploadResponse,
  type ImageSettings,
  type SoundSettings,
  type OBSSettingsResponse,
} from "@/src/redux/queries/obs.api";

const UNLIMITED_MAX_SENTINEL = 9e15;

/** Luôn render dòng đầu: cấu hình gốc trên `my-settings` (không phải một donation level). */
const OBS_GLOBAL_DEFAULT_LIST_KEY = "__obs_global_default__";

const ANIMATION_TYPES = [
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "bounce", label: "Bounce" },
] as const;

const ANIMATION_DIRECTIONS = [
  { value: "top", label: "Từ trên" },
  { value: "bottom", label: "Từ dưới" },
  { value: "left", label: "Từ trái" },
  { value: "right", label: "Từ phải" },
] as const;

const EASING_OPTIONS = [
  { value: "linear", label: "Linear" },
  { value: "ease-in", label: "Ease in" },
  { value: "ease-out", label: "Ease out" },
  { value: "ease-in-out", label: "Ease in-out" },
] as const;

const WIDGET_ANCHOR_OPTIONS = [
  { value: "top-left", label: "Trên — trái" },
  { value: "top-center", label: "Trên — giữa" },
  { value: "top-right", label: "Trên — phải" },
  { value: "middle-left", label: "Giữa — trái" },
  { value: "middle-center", label: "Giữa — giữa" },
  { value: "middle-right", label: "Giữa — phải" },
  { value: "bottom-left", label: "Dưới — trái" },
  { value: "bottom-center", label: "Dưới — giữa" },
  { value: "bottom-right", label: "Dưới — phải" },
] as const;

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "600", label: "600" },
  { value: "700", label: "700" },
  { value: "800", label: "800" },
] as const;

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let id: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (id) clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

function clamp255(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(255, Math.max(0, Math.round(n)));
}

function byteToHex2(n: number): string {
  return clamp255(n).toString(16).padStart(2, "0");
}

function isTransparentCss(input: string): boolean {
  const s = input.trim().toLowerCase();
  if (s === "transparent") return true;
  const rgba =
    /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i.exec(
      input.trim(),
    );
  if (rgba) {
    const a = Number(rgba[1]);
    return Number.isFinite(a) && a === 0;
  }
  return false;
}

/** Chuẩn hoá màu CSS (rgb/rgba/#…) → `#rrggbb` cho `<input type="color">`. */
function cssColorToHex(input: string): string {
  const s = input.trim();
  if (!s) return "#000000";
  if (isTransparentCss(s)) return "#000000";
  const hex6 = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex6?.[1]) return `#${hex6[1].toLowerCase()}`;
  const hex3 = /^#([0-9a-f]{3})$/i.exec(s);
  if (hex3?.[1]) {
    const h = hex3[1];
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  const rgb =
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(s);
  if (rgb) {
    return `#${byteToHex2(Number(rgb[1]))}${byteToHex2(Number(rgb[2]))}${byteToHex2(Number(rgb[3]))}`;
  }
  if (typeof document !== "undefined") {
    try {
      const el = document.createElement("span");
      el.style.color = s;
      if (!el.style.color) return "#000000";
      document.documentElement.appendChild(el);
      const resolved = getComputedStyle(el).color;
      document.documentElement.removeChild(el);
      const m =
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(resolved);
      if (m) {
        return `#${byteToHex2(Number(m[1]))}${byteToHex2(Number(m[2]))}${byteToHex2(Number(m[3]))}`;
      }
    } catch {
      /* ignore */
    }
  }
  return "#000000";
}

function getMutationError(e: unknown): string {
  if (!e || typeof e !== "object") return "Có lỗi xảy ra.";
  const x = e as Record<string, unknown>;
  const data = x.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message) return d.message;
    const err = d.error;
    if (err && typeof err === "object") {
      const m = (err as Record<string, unknown>).message;
      if (typeof m === "string" && m) return m;
    }
  }
  if (typeof x.error === "string" && x.error) return x.error;
  return "Có lỗi xảy ra.";
}

/** Track Switch khi OFF — sáng hơn `muted` / `gray-600` (Base UI: `data-checked` / `data-unchecked`). */
const OBS_SWITCH_OFF_TRACK =
  "data-unchecked:bg-zinc-300 dark:data-unchecked:bg-zinc-500 data-unchecked:border data-unchecked:border-outline-variant/50 dark:data-unchecked:border-zinc-400/50";

const OBS_SWITCH_ROW_CLASS =
  "data-checked:bg-primary dark:data-checked:bg-primary " +
  OBS_SWITCH_OFF_TRACK;

function parseDonationLevelsPayload(
  res: ApiResponse<{ donationLevels?: DonationLevelDTO[] }> | undefined,
): DonationLevelDTO[] {
  if (!res?.success || res.data == null) return [];
  const inner = res.data as Record<string, unknown>;
  if (Array.isArray(inner)) return inner as DonationLevelDTO[];
  const arr = inner.donationLevels ?? inner.items ?? inner.data;
  if (Array.isArray(arr)) return arr as DonationLevelDTO[];
  return [];
}

/** POST /donation-levels có thể trả DTO phẳng hoặc bọc trong `level` / `data`. */
function tryParseCreatedDonationLevelId(res: unknown): string {
  if (!res || typeof res !== "object") return "";
  const r = res as ApiResponse<unknown>;
  if (!r.success || r.data == null) return "";
  const data = r.data;
  if (typeof data !== "object" || data === null) return "";
  const o = data as Record<string, unknown>;
  const nested = o.level ?? o.donationLevel ?? o.item;
  if (nested && typeof nested === "object") {
    return donationLevelRouteId(nested as DonationLevelDTO);
  }
  return donationLevelRouteId(data as DonationLevelDTO);
}

function donationLevelRouteId(d: DonationLevelDTO): string {
  return String(
    d.levelId ?? (d as { id?: string }).id ?? (d as { _id?: string })._id ?? "",
  );
}

/**
 * Thứ tự hiển thị cố định trên FE: sau toggle/refetch BE có thể đổi thứ tự (vd. theo `updatedAt`);
 * sort theo createdAt → min → max → tên → id để vị trí các dòng không nhảy.
 */
function compareDonationLevelsStable(
  a: DonationLevelDTO,
  b: DonationLevelDTO,
): number {
  const ca = typeof a.createdAt === "string" ? Date.parse(a.createdAt) : NaN;
  const cb = typeof b.createdAt === "string" ? Date.parse(b.createdAt) : NaN;
  if (!Number.isNaN(ca) && !Number.isNaN(cb) && ca !== cb) return ca - cb;
  if (!Number.isNaN(ca) && Number.isNaN(cb)) return -1;
  if (Number.isNaN(ca) && !Number.isNaN(cb)) return 1;

  const minA = Number(a.minAmount) || 0;
  const minB = Number(b.minAmount) || 0;
  if (minA !== minB) return minA - minB;

  const maxA =
    a.maxAmount != null ? Number(a.maxAmount) : UNLIMITED_MAX_SENTINEL;
  const maxB =
    b.maxAmount != null ? Number(b.maxAmount) : UNLIMITED_MAX_SENTINEL;
  if (maxA !== maxB) return maxA - maxB;

  const nameA = a.levelName || "";
  const nameB = b.levelName || "";
  const nc = nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
  if (nc !== 0) return nc;

  return donationLevelRouteId(a).localeCompare(donationLevelRouteId(b));
}

function maxAmountToUi(maxAmount: number | undefined): number {
  if (maxAmount == null || Number.isNaN(maxAmount))
    return UNLIMITED_MAX_SENTINEL;
  if (maxAmount >= UNLIMITED_MAX_SENTINEL / 10) return Infinity;
  return maxAmount;
}

function uiMaxToApiMax(maxUi: number, unlimited: boolean): number {
  if (unlimited || maxUi === Infinity) return UNLIMITED_MAX_SENTINEL;
  return maxUi;
}

type UiDonationLevel = {
  routeId: string;
  listKey: string;
  persisted: boolean;
  dto: DonationLevelDTO;
  name: string;
  min: number;
  max: number;
  active: boolean;
  isOpen: boolean;
};

type DisplayRow =
  | {
      kind: "global";
      listKey: typeof OBS_GLOBAL_DEFAULT_LIST_KEY;
      isOpen: boolean;
      widgetActive: boolean;
    }
  | ({ kind: "level" } & UiDonationLevel);

function buildGlobalSettingsAsConfiguration(
  s: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!s || typeof s !== "object") return undefined;
  const pick = (k: string) => {
    const v = s[k];
    if (v !== undefined && typeof v === "object" && v !== null) return v;
    return undefined;
  };
  const out: Record<string, unknown> = {};
  const img = pick("imageSettings");
  const snd = pick("soundSettings");
  const anim = pick("animationSettings");
  const sty = pick("styleSettings");
  const disp = pick("displaySettings");
  const gen = pick("generalSettings");
  const pos = pick("positionSettings");
  const lay = pick("layoutSettings");
  if (img) out.imageSettings = img;
  if (snd) out.soundSettings = snd;
  if (anim) out.animationSettings = anim;
  if (sty) out.styleSettings = sty;
  if (disp) out.displaySettings = disp;
  if (gen) out.generalSettings = gen;
  if (pos) out.positionSettings = pos;
  if (lay) out.layoutSettings = lay;
  return Object.keys(out).length ? out : undefined;
}

const WIDGET_PUBLIC_ALERT_IN_URL =
  /\/widget-public\/alert\/([^/]+)\/([^/?#]+)/i;

function parseStreamerTokenFromWidgetUrl(
  widgetUrl: string,
): { streamerId: string; token: string } | null {
  const m = widgetUrl.match(WIDGET_PUBLIC_ALERT_IN_URL);
  if (!m?.[1] || !m?.[2]) return null;
  try {
    return {
      streamerId: decodeURIComponent(m[1]),
      token: decodeURIComponent(m[2]),
    };
  } catch {
    return { streamerId: m[1], token: m[2] };
  }
}

/**
 * URL «Xem widget» / copy: cùng origin với app, `/widget/alert/{streamerId}/{token}`
 * (giống x-scan-fe-v2: rewrite từ `widgetUrl` nếu có đoạn `.../widget-public/alert/...`).
 * Query `donationLevelId` khi đang chọn một mức donation bật (radio).
 */
function buildObsWidgetDisplayUrl(opts: {
  settings?: OBSSettingsResponse;
  profileStreamerId?: string;
  /** `undefined` = cấu hình mặc định (không gắn level). */
  selectedLevelRouteId?: string;
}): string {
  const { settings, profileStreamerId, selectedLevelRouteId } = opts;
  if (!settings) return "";

  const origin = getPublicAppOrigin();
  if (!origin) return "";

  const wu =
    typeof settings.widgetUrl === "string" ? settings.widgetUrl.trim() : "";
  const fromApi = wu ? parseStreamerTokenFromWidgetUrl(wu) : null;

  const sid =
    fromApi?.streamerId ||
    (typeof settings.streamerId === "string" && settings.streamerId) ||
    profileStreamerId ||
    "";
  const tok =
    fromApi?.token ||
    (typeof settings.alertToken === "string" ? settings.alertToken : "");

  if (!sid || !tok) return "";

  const path = `/widget/alert/${encodeURIComponent(sid)}/${encodeURIComponent(tok)}`;

  try {
    const u = new URL(`${origin}${path}`);
    if (selectedLevelRouteId) {
      u.searchParams.set("donationLevelId", selectedLevelRouteId);
    } else {
      u.searchParams.delete("donationLevelId");
      u.searchParams.delete("levelId");
    }
    return u.href;
  } catch {
    if (!selectedLevelRouteId) return `${origin}${path}`;
    return `${origin}${path}?donationLevelId=${encodeURIComponent(selectedLevelRouteId)}`;
  }
}

export function StreamerObsSettingsView() {
  const { data: profileRes, isLoading: profileLoading } = useGetProfileQuery();
  const profile = profileRes?.success ? profileRes.data : undefined;
  const streamerId = profile?._id != null ? String(profile._id) : undefined;

  const {
    data: settingsRes,
    isLoading: settingsLoading,
    isFetching: settingsFetching,
    isError: settingsIsError,
    error: settingsError,
    refetch: refetchSettings,
  } = useGetMySettingsQuery(undefined, {
    skip: profileLoading || !streamerId,
  });

  const settings = settingsRes?.success ? settingsRes.data : undefined;

  const [createSettings, { isLoading: creatingSettings }] =
    useCreateSettingsMutation();
  const [regenerateToken, { isLoading: regenerating }] =
    useRegenerateTokenMutation();
  const [copied, setCopied] = useState(false);

  const [createOnce404, setCreateOnce404] = useState(false);

  useEffect(() => {
    if (!streamerId || createOnce404 || !settingsIsError || !settingsError)
      return;
    const err = settingsError as FetchBaseQueryError;
    const status = err.status;
    if (status === 404) {
      setCreateOnce404(true);
      void (async () => {
        try {
          await createSettings({ streamerId }).unwrap();
          await refetchSettings();
        } catch {
          setCreateOnce404(false);
        }
      })();
    }
  }, [
    streamerId,
    createOnce404,
    settingsIsError,
    settingsError,
    createSettings,
    refetchSettings,
  ]);

  const {
    data: levelsRes,
    isLoading: levelsLoading,
    refetch: refetchDonationLevels,
  } = useGetDonationLevelsQuery(undefined, {
    skip: profileLoading || !streamerId,
  });

  const apiLevels = useMemo(() => {
    const raw = parseDonationLevelsPayload(levelsRes);
    return [...raw].sort(compareDonationLevelsStable);
  }, [levelsRes]);

  const [openByListKey, setOpenByListKey] = useState<Record<string, boolean>>(
    {},
  );

  const donationLevelsUi: UiDonationLevel[] = useMemo(
    () =>
      apiLevels.map((dto, idx) => {
        const routeId = donationLevelRouteId(dto);
        const persisted = Boolean(routeId);
        const listKey =
          routeId || `pending-${idx}-${dto.levelName}-${dto.minAmount}`;
        const min = Number(dto.minAmount) || 0;
        const max = maxAmountToUi(
          dto.maxAmount != null ? Number(dto.maxAmount) : undefined,
        );
        return {
          routeId,
          listKey,
          persisted,
          dto,
          name: dto.levelName || "Mức",
          min,
          max,
          active: dto.isEnabled === true,
          isOpen: openByListKey[listKey] ?? false,
        };
      }),
    [apiLevels, openByListKey],
  );

  /** Mức donation đang bật (radio) — không có thì URL dùng cấu hình default. */
  const selectedEnabledDonationRouteId = useMemo(() => {
    for (const d of apiLevels) {
      if (d.isEnabled === true) {
        const id = donationLevelRouteId(d);
        if (id) return id;
      }
    }
    return undefined;
  }, [apiLevels]);

  const selectedWidgetDisplayUrl = useMemo(
    () =>
      buildObsWidgetDisplayUrl({
        settings,
        profileStreamerId: streamerId,
        selectedLevelRouteId: selectedEnabledDonationRouteId,
      }),
    [settings, streamerId, selectedEnabledDonationRouteId],
  );

  const displayRows: DisplayRow[] = useMemo(() => {
    const rows: DisplayRow[] = [];
    if (settingsRes?.success && settings) {
      rows.push({
        kind: "global",
        listKey: OBS_GLOBAL_DEFAULT_LIST_KEY,
        isOpen: openByListKey[OBS_GLOBAL_DEFAULT_LIST_KEY] ?? false,
        /** Radio với mức donation: chỉ ON khi không có mức nào bật và widget default đang bật. */
        widgetActive:
          !selectedEnabledDonationRouteId && settings.isActive !== false,
      });
    }
    for (const l of donationLevelsUi) {
      rows.push({ kind: "level", ...l });
    }
    return rows;
  }, [
    settingsRes?.success,
    settings,
    donationLevelsUi,
    openByListKey,
    selectedEnabledDonationRouteId,
  ]);

  const toggleRowOpen = (listKey: string) => {
    setOpenByListKey((m) => ({ ...m, [listKey]: !m[listKey] }));
  };

  const [addLevel] = useAddDonationLevelMutation();
  const [updateLevel] = useUpdateDonationLevelMutation();
  const [updateMySettings] = useUpdateMySettingsMutation();
  const [deleteLevelMut] = useDeleteDonationLevelMutation();

  const [isAddLevelOpen, setIsAddLevelOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addMin, setAddMin] = useState("");
  const [addMax, setAddMax] = useState("");
  const [addUnlimited, setAddUnlimited] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  /** Đang đồng bộ nhiều API (toggle level / default / copy) — hiện overlay để tránh cảm giác lag. */
  const [obsSelectionSyncBusy, setObsSelectionSyncBusy] = useState(false);

  /** Radio-style: chỉ một donation level được `isEnabled` tại một thời điểm. */
  const toggleLevelActive = async (routeId: string, next: boolean) => {
    if (!routeId) return;
    setObsSelectionSyncBusy(true);
    try {
      if (next) {
        const otherIds = apiLevels
          .map((d) => donationLevelRouteId(d))
          .filter((id) => Boolean(id) && id !== routeId);
        await Promise.all(
          otherIds.map((id) =>
            updateLevel({ levelId: id, body: { isEnabled: false } }).unwrap(),
          ),
        );
        await updateLevel({
          levelId: routeId,
          body: { isEnabled: true },
        }).unwrap();
        await updateMySettings({ isActive: false }).unwrap();
        await refetchSettings();
      } else {
        await updateLevel({
          levelId: routeId,
          body: { isEnabled: false },
        }).unwrap();
        const othersStillOn = apiLevels.some((d) => {
          const id = donationLevelRouteId(d);
          return id && id !== routeId && d.isEnabled === true;
        });
        if (!othersStillOn) {
          await updateMySettings({ isActive: true }).unwrap();
          await refetchSettings();
        }
      }
    } catch (e) {
      console.warn(getMutationError(e));
    } finally {
      try {
        await refetchDonationLevels();
      } catch {
        /* ignore */
      }
      setObsSelectionSyncBusy(false);
    }
  };

  const toggleGlobalWidgetActive = async (next: boolean) => {
    setObsSelectionSyncBusy(true);
    try {
      if (next) {
        const ids = apiLevels
          .map((d) => donationLevelRouteId(d))
          .filter((id): id is string => Boolean(id));
        await Promise.all(
          ids.map((id) =>
            updateLevel({ levelId: id, body: { isEnabled: false } }).unwrap(),
          ),
        );
      }
      await updateMySettings({ isActive: next }).unwrap();
      await refetchSettings();
    } catch (e) {
      console.warn(getMutationError(e));
    } finally {
      try {
        await refetchDonationLevels();
      } catch {
        /* ignore */
      }
      setObsSelectionSyncBusy(false);
    }
  };

  /** Không còn mức donation nào bật → bật widget mặc định (`isActive`). Collapse chỉ do user bấm vùng trái card. */
  useEffect(() => {
    if (
      !settingsRes?.success ||
      !settings ||
      profileLoading ||
      !streamerId ||
      levelsLoading
    )
      return;

    const anyLevelEnabled = apiLevels.some(
      (d) => d.isEnabled === true && donationLevelRouteId(d),
    );
    if (anyLevelEnabled) return;

    if (settings.isActive !== true) {
      void (async () => {
        try {
          await updateMySettings({ isActive: true }).unwrap();
          await refetchSettings();
        } catch {
          /* ignore */
        }
      })();
    }
  }, [
    apiLevels,
    settings,
    settingsRes?.success,
    streamerId,
    profileLoading,
    levelsLoading,
    updateMySettings,
    refetchSettings,
  ]);

  const cloneLevel = async (routeId: string) => {
    const src = apiLevels.find((d) => donationLevelRouteId(d) === routeId);
    if (!src) return;
    const newName = `${src.levelName || "Mức"} (Copy)`;
    const oldIds = new Set(
      apiLevels
        .map((d) => donationLevelRouteId(d))
        .filter((id): id is string => Boolean(id)),
    );
    const srcMin = Number(src.minAmount) || 0;
    const srcMax =
      src.maxAmount != null ? Number(src.maxAmount) : UNLIMITED_MAX_SENTINEL;
    setObsSelectionSyncBusy(true);
    try {
      const createRes = await addLevel({
        levelName: newName,
        minAmount: srcMin,
        maxAmount: srcMax,
        currency: src.currency || "VND",
        isEnabled: false,
        configuration: src.configuration,
      }).unwrap();

      let newRouteId = tryParseCreatedDonationLevelId(createRes);

      const refetchRes = await refetchDonationLevels();
      const list = parseDonationLevelsPayload(
        refetchRes.data as ApiResponse<{ donationLevels?: DonationLevelDTO[] }>,
      );

      if (!newRouteId) {
        const newcomers = list.filter((d) => {
          const id = donationLevelRouteId(d);
          return Boolean(id) && !oldIds.has(id);
        });
        const nameMatches = newcomers.filter(
          (d) => (d.levelName || "") === newName,
        );
        const picked =
          nameMatches.length === 1
            ? nameMatches[0]
            : (nameMatches.find(
                (d) =>
                  Number(d.minAmount) === srcMin &&
                  (d.maxAmount != null
                    ? Number(d.maxAmount)
                    : UNLIMITED_MAX_SENTINEL) === srcMax,
              ) ??
              nameMatches.at(-1) ??
              newcomers.at(-1));
        newRouteId = picked ? donationLevelRouteId(picked) : "";
      }

      if (!newRouteId) {
        console.warn("[cloneLevel] Không xác định được mức mới sau refetch.");
        return;
      }

      /** Giống bật toggle thủ công: tắt các mức khác, chỉ bật mức vừa copy (không PUT toàn bộ danh sách). */
      const otherIds = list
        .map((d) => donationLevelRouteId(d))
        .filter((id): id is string => Boolean(id) && id !== newRouteId);
      await Promise.all(
        otherIds.map((id) =>
          updateLevel({ levelId: id, body: { isEnabled: false } }).unwrap(),
        ),
      );
      await updateLevel({
        levelId: newRouteId,
        body: { isEnabled: true },
      }).unwrap();
      await updateMySettings({ isActive: false }).unwrap();
      await refetchSettings();
      await refetchDonationLevels();
    } catch (e) {
      console.warn(getMutationError(e));
    } finally {
      setObsSelectionSyncBusy(false);
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [levelToDeleteRouteId, setLevelToDeleteRouteId] = useState<
    string | null
  >(null);
  const [isEditLevelOpen, setIsEditLevelOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [editUnlimited, setEditUnlimited] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const openEditLevel = (l: UiDonationLevel) => {
    setEditingRouteId(l.routeId);
    setEditName(l.name);
    setEditMin(String(l.min));
    setEditMax(l.max === Infinity ? "" : String(l.max));
    setEditUnlimited(l.max === Infinity);
    setEditError(null);
    setIsEditLevelOpen(true);
  };

  const saveEditLevel = async () => {
    if (!editingRouteId) return;
    const minN = Number(editMin.replace(/\s/g, ""));
    const maxN = Number(editMax.replace(/\s/g, ""));
    if (!editName.trim()) {
      setEditError("Nhập tên mức.");
      return;
    }
    if (Number.isNaN(minN) || minN < 0) {
      setEditError("Số tiền tối thiểu không hợp lệ.");
      return;
    }
    if (!editUnlimited && (Number.isNaN(maxN) || maxN < minN)) {
      setEditError("Số tiền tối đa phải ≥ tối thiểu.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await updateLevel({
        levelId: editingRouteId,
        body: {
          levelName: editName.trim(),
          minAmount: minN,
          maxAmount: uiMaxToApiMax(maxN, editUnlimited),
          currency: "VND",
        },
      }).unwrap();
      setIsEditLevelOpen(false);
      setEditingRouteId(null);
    } catch (e) {
      setEditError(getMutationError(e));
    } finally {
      setEditSaving(false);
    }
  };

  const deleteLevel = async () => {
    if (!levelToDeleteRouteId) return;
    try {
      await deleteLevelMut(levelToDeleteRouteId).unwrap();
      setIsDeleteDialogOpen(false);
      setLevelToDeleteRouteId(null);
    } catch (e) {
      console.warn(getMutationError(e));
    }
  };

  const submitAddLevel = async () => {
    const minN = Number(addMin.replace(/\s/g, ""));
    const maxN = Number(addMax.replace(/\s/g, ""));
    if (!addName.trim()) {
      setAddError("Nhập tên mức.");
      return;
    }
    if (Number.isNaN(minN) || minN < 0) {
      setAddError("Số tiền tối thiểu không hợp lệ.");
      return;
    }
    if (!addUnlimited && (Number.isNaN(maxN) || maxN < minN)) {
      setAddError("Số tiền tối đa phải ≥ tối thiểu.");
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      await addLevel({
        levelName: addName.trim(),
        minAmount: minN,
        maxAmount: uiMaxToApiMax(maxN, addUnlimited),
        currency: "VND",
        /** Mới tạo luôn tắt — user bật toggle để chọn (radio một mức). */
        isEnabled: false,
      }).unwrap();
      setIsAddLevelOpen(false);
      setAddName("");
      setAddMin("");
      setAddMax("");
      setAddUnlimited(false);
    } catch (e) {
      setAddError(getMutationError(e));
    } finally {
      setAddSaving(false);
    }
  };

  const copyWidgetUrl = useCallback(async () => {
    if (!selectedWidgetDisplayUrl) return;
    try {
      await navigator.clipboard.writeText(selectedWidgetDisplayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Không copy được URL.");
    }
  }, [selectedWidgetDisplayUrl]);

  const onRegenerateToken = async () => {
    try {
      await regenerateToken().unwrap();
      await refetchSettings();
    } catch (e) {
      console.warn(getMutationError(e));
    }
  };

  const pageBlocking =
    profileLoading ||
    creatingSettings ||
    (Boolean(streamerId) && settingsLoading && !settingsIsError);

  const settingsErrMsg = settingsIsError
    ? (() => {
        const err = settingsError as FetchBaseQueryError;
        if (err.status === 404) return null;
        const data = err.data as Record<string, unknown> | undefined;
        const msg =
          data && typeof data === "object" && typeof data.message === "string"
            ? data.message
            : null;
        return msg || "Không tải được cấu hình OBS.";
      })()
    : null;

  /** Widget coi là đang dùng: default bật hoặc đang chọn một mức donation. */
  const isWidgetActive =
    Boolean(selectedEnabledDonationRouteId) ||
    (settings?.isActive !== false && !selectedEnabledDonationRouteId);

  return (
    <div className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden">
      <div className="scanline" />

      {pageBlocking && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/30">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground italic flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          CẤU HÌNH OBS
        </h2>
        <p className="text-xs text-outline mt-1">
          WIDGET ALERT, MEDIA VÀ ÂM THANH CHO STREAM
        </p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        {!profileLoading && !streamerId && (
          <p className="text-sm text-destructive">
            Không xác định được tài khoản streamer. Vui lòng đăng nhập lại hoặc
            hoàn tất hồ sơ.
          </p>
        )}

        {settingsErrMsg && (
          <p className="text-sm text-destructive">{settingsErrMsg}</p>
        )}

        <Card className="bg-surface-container-low border-outline-variant/20 rounded-none">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold uppercase tracking-widest">
                  WIDGET URL
                </h3>
                <p className="text-xs text-outline">
                  Dán địa chỉ này vào OBS → Browser Source.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end items-center">
                <Badge
                  className={
                    isWidgetActive
                      ? "bg-primary/10 text-primary border-none rounded-none"
                      : "bg-muted text-muted-foreground border-none rounded-none"
                  }
                >
                  {isWidgetActive ? "HOẠT ĐỘNG" : "TẮT"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  disabled={!selectedWidgetDisplayUrl}
                  onClick={() => {
                    if (selectedWidgetDisplayUrl)
                      window.open(
                        selectedWidgetDisplayUrl,
                        "_blank",
                        "noreferrer",
                      );
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" /> Xem widget
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  disabled={regenerating || settingsFetching}
                  onClick={() => void onRegenerateToken()}
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Token mới
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                readOnly
                value={selectedWidgetDisplayUrl || "—"}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-none shrink-0"
                disabled={!selectedWidgetDisplayUrl}
                onClick={() => void copyWidgetUrl()}
              >
                {copied ? <CheckMini /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-widest">
              Cấu hình mức donation
            </h3>
            <p className="text-xs text-outline">
              Cấu hình giao diện của widget theo mức donation
            </p>
          </div>
          <Button
            type="button"
            disabled={obsSelectionSyncBusy}
            onClick={() => {
              setAddError(null);
              setIsAddLevelOpen(true);
            }}
            className="bg-primary text-black rounded-none font-bold uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm mức
          </Button>
        </div>

        {levelsLoading && (
          <div className="flex items-center gap-2 text-xs text-outline">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách mức…
          </div>
        )}

        <div className="relative space-y-4">
          {obsSelectionSyncBusy && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-sm bg-background/50 pt-16 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground shadow-sm">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                Đang cập nhật…
              </div>
            </div>
          )}
          {displayRows.map((row) => (
            <Card
              key={row.listKey}
              className="bg-surface-container-low border-outline-variant/20 rounded-none"
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between gap-2 p-4">
                  <div
                    role="button"
                    tabIndex={obsSelectionSyncBusy ? -1 : 0}
                    className={`flex min-w-0 flex-1 items-center gap-4 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      obsSelectionSyncBusy
                        ? "cursor-wait opacity-60"
                        : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!obsSelectionSyncBusy) toggleRowOpen(row.listKey);
                    }}
                    onKeyDown={(e) => {
                      if (obsSelectionSyncBusy) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleRowOpen(row.listKey);
                      }
                    }}
                  >
                    <span className="inline-flex shrink-0 text-outline">
                      {row.isOpen ? (
                        <ChevronUp className="size-5" />
                      ) : (
                        <ChevronDown className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      {row.kind === "global" ? (
                        <>
                          <p className="font-bold">Cấu hình mặc định</p>
                          <p className="text-xs text-outline">
                            Cấu hình gốc trên OBS (my-settings) — 0 — Vô hạn VND
                            · các mức bên dưới có thể ghi đè theo ngưỡng
                            donation
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold">{row.name}</p>
                          <p className="text-xs text-outline">
                            {row.min.toLocaleString()} —{" "}
                            {row.max === Infinity
                              ? "Vô hạn"
                              : row.max.toLocaleString()}{" "}
                            VND
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={
                        row.kind === "global" ? row.widgetActive : row.active
                      }
                      disabled={
                        obsSelectionSyncBusy ||
                        (row.kind === "level" && !row.persisted)
                      }
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onCheckedChange={(v) => {
                        if (row.kind === "global")
                          void toggleGlobalWidgetActive(v);
                        else void toggleLevelActive(row.routeId, v);
                      }}
                      className={OBS_SWITCH_ROW_CLASS}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={
                        obsSelectionSyncBusy || !selectedWidgetDisplayUrl
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedWidgetDisplayUrl)
                          window.open(
                            selectedWidgetDisplayUrl,
                            "_blank",
                            "noreferrer",
                          );
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {row.kind === "level" && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={obsSelectionSyncBusy || !row.persisted}
                          onClick={(e) => {
                            e.stopPropagation();
                            void cloneLevel(row.routeId);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={obsSelectionSyncBusy || !row.persisted}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditLevel(row);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={
                            obsSelectionSyncBusy ||
                            apiLevels.length <= 1 ||
                            !row.persisted
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setLevelToDeleteRouteId(row.routeId);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {row.isOpen && (
                  <div className="p-6 border-t border-outline-variant/10">
                    {row.kind === "level" && !row.persisted && (
                      <p className="text-xs text-outline mb-4">
                        Đang chờ mã mức từ server — tải lại sau vài giây hoặc mở
                        lại trang.
                      </p>
                    )}
                    {row.kind === "global" && settings ? (
                      <SettingsForm
                        scope="global"
                        configuration={buildGlobalSettingsAsConfiguration(
                          settings as unknown as Record<string, unknown>,
                        )}
                      />
                    ) : row.kind === "level" ? (
                      <SettingsForm
                        scope="level"
                        levelRouteId={row.routeId}
                        configuration={
                          row.dto.configuration as
                            | Record<string, unknown>
                            | undefined
                        }
                      />
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!levelsLoading &&
          apiLevels.length === 0 &&
          streamerId &&
          settingsRes?.success && (
            <p className="text-sm text-outline">
              Chưa có mức donation tùy chỉnh. Dòng &quot;Cấu hình mặc định&quot;
              phía trên dùng cấu hình gốc; nhấn &quot;Thêm mức&quot; để tạo thêm
              trên server.
            </p>
          )}
      </div>

      <Dialog open={isAddLevelOpen} onOpenChange={setIsAddLevelOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">
              Thêm mức donation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <Input
              placeholder="Tên mức (VD: Cấp 2)"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Số tiền tối thiểu (VND)"
                value={addMin}
                onChange={(e) => setAddMin(e.target.value)}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
              />
              <Input
                placeholder="Số tiền tối đa (VND)"
                value={addMax}
                onChange={(e) => setAddMax(e.target.value)}
                disabled={addUnlimited}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unlimited"
                checked={addUnlimited}
                onCheckedChange={(c) => setAddUnlimited(c === true)}
              />
              <Label htmlFor="unlimited">Số tiền tối đa là vô hạn</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsAddLevelOpen(false)}
              className="rounded-none"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              className="bg-primary text-black rounded-none"
              disabled={addSaving}
              onClick={() => void submitAddLevel()}
            >
              {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLevelOpen} onOpenChange={setIsEditLevelOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">
              Chỉnh sửa mức donation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <Input
              placeholder="Tên mức"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Số tiền tối thiểu (VND)"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
              />
              <Input
                placeholder="Số tiền tối đa (VND)"
                value={editMax}
                onChange={(e) => setEditMax(e.target.value)}
                disabled={editUnlimited}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unlimited-edit"
                checked={editUnlimited}
                onCheckedChange={(c) => setEditUnlimited(c === true)}
              />
              <Label htmlFor="unlimited-edit">Số tiền tối đa là vô hạn</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsEditLevelOpen(false)}
              className="rounded-none"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={() => void saveEditLevel()}
              className="bg-primary text-black rounded-none"
              disabled={editSaving}
            >
              {editSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Lưu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-surface-container-lowest border border-outline-variant/20 rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">
              Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-outline">
            Bạn có chắc chắn muốn xóa mức donation này không?
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="rounded-none"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={() => void deleteLevel()}
              className="bg-destructive text-white rounded-none"
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckMini() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ObsSettingsSection({
  title,
  children,
  className = "",
  rightContent,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  rightContent?: ReactNode;
}) {
  return (
    <div
      className={`bg-[#1A1A1A] p-6 space-y-4 border-l-4 border-primary ${className}`}
    >
      <div className="flex justify-between items-center">
        <h4 className="font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
          {title}
        </h4>
        {rightContent}
      </div>
      {children}
    </div>
  );
}

function ObsSettingsControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#333333] p-4 space-y-1">
      <Label className="text-[10px] font-bold uppercase text-[#999999]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SettingsForm(
  props:
    | { scope: "global"; configuration?: Record<string, unknown> }
    | {
        scope: "level";
        levelRouteId: string;
        configuration?: Record<string, unknown>;
      },
) {
  const isGlobal = props.scope === "global";
  const levelRouteId = props.scope === "level" ? props.levelRouteId : "";
  const configuration = props.configuration;

  const imageVideoInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);
  const [uploadSlot, setUploadSlot] = useState<null | "visual" | "sound">(null);
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia, { isLoading: deleting }] = useDeleteMediaMutation();
  const [updateLevel, { isLoading: savingLevel }] =
    useUpdateDonationLevelMutation();
  const [updateMySettings, { isLoading: savingGlobal }] =
    useUpdateMySettingsMutation();
  const savingNested = savingLevel || savingGlobal;

  const imageSettings = configuration?.imageSettings as
    | { url?: string | null; mediaType?: string | null }
    | undefined;
  const soundSettings = configuration?.soundSettings as
    | { url?: string | null; mediaType?: string | null }
    | undefined;
  const imageUrl =
    typeof imageSettings?.url === "string" ? imageSettings.url : "";
  const soundUrl =
    typeof soundSettings?.url === "string" ? soundSettings.url : "";
  const hasImageMedia = Boolean(imageUrl);
  const hasSoundMedia = Boolean(soundUrl);
  const resolvedImageSrc = imageUrl ? absoluteApiUrl(imageUrl) : "";
  const resolvedSoundSrc = soundUrl ? absoluteApiUrl(soundUrl) : "";
  const imageStoredMediaType =
    typeof imageSettings?.mediaType === "string" ? imageSettings.mediaType : "";

  const mergeConfiguration = useCallback(
    (patch: Record<string, unknown>) => ({
      ...(configuration && typeof configuration === "object"
        ? configuration
        : {}),
      ...patch,
    }),
    [configuration],
  );

  const persistConfigPatch = useCallback(
    async (
      key:
        | "soundSettings"
        | "animationSettings"
        | "styleSettings"
        | "displaySettings"
        | "positionSettings",
      patch: Record<string, unknown>,
    ) => {
      if (!isGlobal && !levelRouteId) return;
      const prevRaw = configuration?.[key];
      const base =
        prevRaw && typeof prevRaw === "object" && !Array.isArray(prevRaw)
          ? { ...(prevRaw as Record<string, unknown>) }
          : {};
      const next = { ...base, ...patch };
      try {
        if (isGlobal) {
          await updateMySettings({ [key]: next } as never).unwrap();
        } else if (levelRouteId) {
          await updateLevel({
            levelId: levelRouteId,
            body: {
              configuration: mergeConfiguration({ [key]: next }),
            },
          }).unwrap();
        }
      } catch (err) {
        console.warn(getMutationError(err));
      }
    },
    [
      configuration,
      isGlobal,
      levelRouteId,
      mergeConfiguration,
      updateLevel,
      updateMySettings,
    ],
  );

  const persistMediaConfig = async (nextConfig: Record<string, unknown>) => {
    if (isGlobal) {
      const body: {
        imageSettings?: ImageSettings;
        soundSettings?: SoundSettings;
      } = {};
      if (nextConfig.imageSettings !== undefined) {
        body.imageSettings = nextConfig.imageSettings as ImageSettings;
      }
      if (nextConfig.soundSettings !== undefined) {
        body.soundSettings = nextConfig.soundSettings as SoundSettings;
      }
      await updateMySettings(body).unwrap();
      return;
    }
    if (!levelRouteId) return;
    await updateLevel({
      levelId: levelRouteId,
      body: { configuration: nextConfig },
    }).unwrap();
  };

  const uploadAlertMedia = async (file: File, slot: "visual" | "sound") => {
    if (!isGlobal && !levelRouteId) return;
    const mime = file.type || "";
    let mediaType: string;
    if (slot === "sound") {
      if (!mime.startsWith("audio")) {
        console.warn("Chỉ chấp nhận file âm thanh.");
        return;
      }
      mediaType = "sound";
    } else if (mime.startsWith("video")) {
      mediaType = "video";
    } else if (mime.startsWith("image")) {
      mediaType = "image";
    } else {
      console.warn("Chỉ chấp nhận ảnh hoặc video.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mediaType", mediaType);
    fd.append("purpose", "alert");
    setUploadSlot(slot);
    try {
      const res = (await uploadMedia(
        fd,
      ).unwrap()) as ApiResponse<MediaUploadResponse>;
      const url = res.data?.url;
      if (!url) return;
      const nextConfig =
        mediaType === "sound"
          ? mergeConfiguration({
              soundSettings: {
                ...(typeof soundSettings === "object" && soundSettings
                  ? soundSettings
                  : {}),
                url,
                mediaType,
              },
            })
          : mergeConfiguration({
              imageSettings: {
                ...(typeof imageSettings === "object" && imageSettings
                  ? imageSettings
                  : {}),
                url,
                mediaType,
              },
            });
      await persistMediaConfig(nextConfig);
    } catch (err) {
      console.warn(getMutationError(err));
    } finally {
      setUploadSlot(null);
    }
  };

  const onPickVisualFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadAlertMedia(file, "visual");
  };

  const onPickSoundFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadAlertMedia(file, "sound");
  };

  /** DELETE /obs-settings/media?url= — xóa file trên storage, sau đó gỡ URL khỏi cấu hình. */
  const onDeleteImageMedia = async () => {
    if (!imageUrl) return;
    if (!isGlobal && !levelRouteId) return;
    try {
      await deleteMedia(imageUrl).unwrap();
      await persistMediaConfig(
        mergeConfiguration({
          imageSettings: {
            ...(typeof imageSettings === "object" && imageSettings
              ? imageSettings
              : {}),
            url: null,
          },
        }),
      );
    } catch (err) {
      console.warn(getMutationError(err));
    }
  };

  const onDeleteSoundMedia = async () => {
    if (!soundUrl) return;
    if (!isGlobal && !levelRouteId) return;
    try {
      await deleteMedia(soundUrl).unwrap();
      await persistMediaConfig(
        mergeConfiguration({
          soundSettings: {
            ...(typeof soundSettings === "object" && soundSettings
              ? soundSettings
              : {}),
            url: null,
          },
        }),
      );
    } catch (err) {
      console.warn(getMutationError(err));
    }
  };

  const canPersist = isGlobal || Boolean(levelRouteId);

  return (
    <div className="space-y-6">
      <input
        ref={imageVideoInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onPickVisualFile}
      />
      <input
        ref={soundInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={onPickSoundFile}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ObsSettingsSection title="Media">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex min-h-[132px] min-w-0 flex-col overflow-hidden rounded-sm border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest">
              {uploading && uploadSlot === "visual" ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-outline">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-[9px] font-bold uppercase">
                    Đang tải…
                  </span>
                </div>
              ) : resolvedImageSrc ? (
                <>
                  <div className="flex min-h-0 flex-1 items-center justify-center bg-black/20 p-2">
                    {imageStoredMediaType === "video" ? (
                      <video
                        src={resolvedImageSrc}
                        controls
                        playsInline
                        className="max-h-[100px] w-full object-contain"
                        title={imageUrl}
                      />
                    ) : (
                      <img
                        src={resolvedImageSrc}
                        alt="Ảnh alert"
                        className="max-h-[100px] w-full object-contain"
                        title={imageUrl}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploading || !canPersist}
                    onClick={() => imageVideoInputRef.current?.click()}
                    className="shrink-0 border-t border-outline-variant/25 bg-surface-container-low/90 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide text-outline hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Thay ảnh / video
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={uploading || !canPersist}
                  onClick={() => imageVideoInputRef.current?.click()}
                  className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center text-outline transition-colors hover:bg-surface-container-lowest/80 disabled:opacity-50"
                >
                  <ImageIcon className="h-6 w-6 shrink-0 text-primary" />
                  <p className="text-[10px] font-bold uppercase leading-tight">
                    Ảnh / video
                  </p>
                  <p className="text-[9px] text-outline/80 leading-snug">
                    Hiển thị trên alert
                  </p>
                </button>
              )}
            </div>

            <div className="flex min-h-[132px] min-w-0 flex-col overflow-hidden rounded-sm border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest">
              {uploading && uploadSlot === "sound" ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-outline">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-[9px] font-bold uppercase">
                    Đang tải…
                  </span>
                </div>
              ) : resolvedSoundSrc ? (
                <>
                  <div className="flex min-h-0 flex-1 flex-col items-stretch justify-center gap-1 bg-black/20 p-2">
                    <audio
                      src={resolvedSoundSrc}
                      controls
                      className="h-8 w-full min-w-0"
                      title={soundUrl}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={uploading || !canPersist}
                    onClick={() => soundInputRef.current?.click()}
                    className="shrink-0 border-t border-outline-variant/25 bg-surface-container-low/90 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide text-outline hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Thay âm thanh
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={uploading || !canPersist}
                  onClick={() => soundInputRef.current?.click()}
                  className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center text-outline transition-colors hover:bg-surface-container-lowest/80 disabled:opacity-50"
                >
                  <Music2 className="h-6 w-6 shrink-0 text-primary" />
                  <p className="text-[10px] font-bold uppercase leading-tight">
                    Âm thanh
                  </p>
                  <p className="text-[9px] text-outline/80 leading-snug">
                    File audio alert
                  </p>
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {(hasImageMedia || hasSoundMedia) && (
              <div
                className={
                  hasImageMedia && hasSoundMedia
                    ? "grid grid-cols-2 gap-2"
                    : "grid grid-cols-1 gap-2"
                }
              >
                {hasImageMedia && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-outline rounded-none uppercase text-xs font-bold text-destructive"
                    disabled={deleting || !canPersist}
                    onClick={() => void onDeleteImageMedia()}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa ảnh / video
                  </Button>
                )}
                {hasSoundMedia && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-outline rounded-none uppercase text-xs font-bold text-destructive"
                    disabled={deleting || !canPersist}
                    onClick={() => void onDeleteSoundMedia()}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa âm thanh
                  </Button>
                )}
              </div>
            )}
          </div>
        </ObsSettingsSection>

        <ObsSettingsSection title="Audio">
          <AudioStyleAnimationControls
            disabled={savingNested || !canPersist}
            soundSettings={soundSettings as SoundSettings | undefined}
            onPatchSound={(patch) => void persistConfigPatch("soundSettings", patch)}
          />
        </ObsSettingsSection>
      </div>

      <ObsSettingsSection title="Vị trí widget">
        <PositionControls
          disabled={savingNested || !canPersist}
          positionSettings={
            configuration?.positionSettings as
              | Record<string, unknown>
              | undefined
          }
          onPatch={(patch) =>
            void persistConfigPatch("positionSettings", patch)
          }
        />
      </ObsSettingsSection>

      <ObsSettingsSection title="Styling & Typography">
        <StyleControls
          disabled={savingNested || !canPersist}
          styleSettings={
            configuration?.styleSettings as Record<string, unknown> | undefined
          }
          onPatch={(patch) => void persistConfigPatch("styleSettings", patch)}
        />
      </ObsSettingsSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ObsSettingsSection
          title="Animation"
          rightContent={
            <Switch
              className={OBS_SWITCH_ROW_CLASS}
              disabled={savingNested || !canPersist}
              checked={
                (configuration?.animationSettings as Record<string, unknown> | undefined)
                  ?.enabled !== false
              }
              onCheckedChange={(c) =>
                void persistConfigPatch("animationSettings", {
                  enabled: c === true,
                })
              }
            />
          }
        >
          <AnimationControls
            disabled={savingNested || !canPersist}
            animationSettings={
              configuration?.animationSettings as
                | Record<string, unknown>
                | undefined
            }
            onPatch={(patch) =>
              void persistConfigPatch("animationSettings", patch)
            }
          />
        </ObsSettingsSection>

        <ObsSettingsSection
          title="Thời gian hiển thị"
          rightContent={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase">Tự ẩn</span>
              <Switch
                className={OBS_SWITCH_ROW_CLASS}
                disabled={savingNested || !canPersist}
                checked={
                  (configuration?.displaySettings as Record<string, unknown> | undefined)
                    ?.autoHide !== false
                }
                onCheckedChange={(c) =>
                  void persistConfigPatch("displaySettings", {
                    autoHide: c === true,
                  })
                }
              />
            </div>
          }
        >
          <DisplayControls
            disabled={savingNested || !canPersist}
            displaySettings={
              configuration?.displaySettings as
                | Record<string, unknown>
                | undefined
            }
            onPatch={(patch) =>
              void persistConfigPatch("displaySettings", patch)
            }
          />
        </ObsSettingsSection>
      </div>
    </div>
  );
}

function AudioStyleAnimationControls({
  disabled,
  soundSettings,
  onPatchSound,
}: {
  disabled: boolean;
  soundSettings: SoundSettings | undefined;
  onPatchSound: (patch: Record<string, unknown>) => void;
}) {
  const snd = soundSettings ?? {};
  const volume = typeof snd.volume === "number" ? snd.volume : 80;
  const fadeIn = typeof snd.fadeIn === "number" ? snd.fadeIn : 0;
  const fadeOut = typeof snd.fadeOut === "number" ? snd.fadeOut : 0;
  const [volumeUi, setVolumeUi] = useState(volume);
  useEffect(() => {
    setVolumeUi(volume);
  }, [volume]);

  const debouncedVolumePatch = useMemo(
    () =>
      debounce((v: number) => {
        onPatchSound({ volume: v });
      }, 400),
    [onPatchSound],
  );

  return (
    <>
      <div className="space-y-4">
        <ObsSettingsControl label="Volume">
          <div className="flex items-center gap-4">
            <Slider
              disabled={disabled}
              value={[volumeUi]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => {
                const n = v[0];
                if (typeof n === "number") {
                  setVolumeUi(n);
                  debouncedVolumePatch(n);
                }
              }}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:rounded-full"
            />
            <span className="text-sm font-bold text-primary w-10 text-right tabular-nums">
              {volumeUi}%
            </span>
          </div>
        </ObsSettingsControl>
        <div className="grid grid-cols-2 gap-4">
          <ObsSettingsControl label="Bật âm thanh">
            <Switch
              className={OBS_SWITCH_ROW_CLASS}
              disabled={disabled}
              checked={snd.enabled !== false}
              onCheckedChange={(c) => onPatchSound({ enabled: c === true })}
            />
          </ObsSettingsControl>
          <ObsSettingsControl label="Lặp (loop)">
            <Switch
              className={OBS_SWITCH_ROW_CLASS}
              disabled={disabled}
              checked={snd.loop === true}
              onCheckedChange={(c) => onPatchSound({ loop: c === true })}
            />
          </ObsSettingsControl>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ObsSettingsControl label="Fade in (ms)">
          <Input
            key={`snd-fi-${fadeIn}`}
            type="number"
            disabled={disabled}
            defaultValue={fadeIn}
            min={0}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0) onPatchSound({ fadeIn: n });
            }}
            className="bg-transparent border-none p-0 h-6 text-sm"
          />
        </ObsSettingsControl>
        <ObsSettingsControl label="Fade out (ms)">
          <Input
            key={`snd-fo-${fadeOut}`}
            type="number"
            disabled={disabled}
            defaultValue={fadeOut}
            min={0}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0) onPatchSound({ fadeOut: n });
            }}
            className="bg-transparent border-none p-0 h-6 text-sm"
          />
        </ObsSettingsControl>
      </div>
    </>
  );
}

function PositionControls({
  disabled,
  positionSettings,
  onPatch,
}: {
  disabled: boolean;
  positionSettings: Record<string, unknown> | undefined;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const pos = positionSettings ?? {};
  const anchorRaw =
    typeof pos.anchor === "string" && pos.anchor.trim()
      ? pos.anchor.trim()
      : "middle-center";
  const anchor = WIDGET_ANCHOR_OPTIONS.some((o) => o.value === anchorRaw)
    ? anchorRaw
    : "middle-center";
  const x = typeof pos.x === "number" ? pos.x : 0;
  const y = typeof pos.y === "number" ? pos.y : 0;
  const zIndex = typeof pos.zIndex === "number" ? pos.zIndex : 1000;
  const responsive = pos.responsive !== false;
  const mobileScale =
    typeof pos.mobileScale === "number" ? pos.mobileScale : 0.8;
  const [scaleUi, setScaleUi] = useState(mobileScale);
  useEffect(() => {
    setScaleUi(mobileScale);
  }, [mobileScale]);

  const debouncedScalePatch = useMemo(
    () => debounce((v: number) => onPatch({ mobileScale: v }), 400),
    [onPatch],
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ObsSettingsControl label="Neo (anchor) — vị trí trên màn hình">
        <Select
          value={anchor}
          onValueChange={(v) => onPatch({ anchor: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full min-w-0 max-w-full border border-outline-variant/40 bg-transparent text-sm">
            <SelectValue placeholder="Chọn vị trí" />
          </SelectTrigger>
          <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none max-h-72">
            {WIDGET_ANCHOR_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ObsSettingsControl>
      <ObsSettingsControl label="z-index (lớp chồng)">
        <Input
          key={`pos-z-${zIndex}`}
          type="number"
          disabled={disabled}
          defaultValue={zIndex}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onPatch({ zIndex: Math.round(n) });
          }}
          className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
        />
      </ObsSettingsControl>
      <ObsSettingsControl label="Offset X (px)">
        <Input
          key={`pos-x-${x}`}
          type="number"
          disabled={disabled}
          defaultValue={x}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onPatch({ x: Math.round(n) });
          }}
          className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
        />
      </ObsSettingsControl>
      <ObsSettingsControl label="Offset Y (px)">
        <Input
          key={`pos-y-${y}`}
          type="number"
          disabled={disabled}
          defaultValue={y}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onPatch({ y: Math.round(n) });
          }}
          className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
        />
      </ObsSettingsControl>
      <ObsSettingsControl label="Responsive">
        <Switch
          className={OBS_SWITCH_ROW_CLASS}
          disabled={disabled}
          checked={responsive}
          onCheckedChange={(c) => onPatch({ responsive: c === true })}
        />
      </ObsSettingsControl>
      <ObsSettingsControl label={`Tỷ lệ mobile (${Math.round(scaleUi * 100)}%)`}>
        <div className="flex items-center gap-3">
          <Slider
            disabled={disabled}
            value={[scaleUi]}
            min={0.5}
            max={1.5}
            step={0.05}
            onValueChange={(v) => {
              const n = v[0];
              if (typeof n === "number") {
                setScaleUi(n);
                debouncedScalePatch(n);
              }
            }}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:rounded-full"
          />
        </div>
      </ObsSettingsControl>
    </div>
  );
}

function ObsStyleColorField({
  label,
  disabled,
  cssValue,
  fallbackHex,
  onPick,
}: {
  label: string;
  disabled: boolean;
  cssValue: string;
  /** Màu hex khi tắt «Trong suốt» (color picker không hỗ trợ alpha). */
  fallbackHex: string;
  onPick: (cssColor: string) => void;
}) {
  const transparent = isTransparentCss(cssValue);
  const pickerValue = transparent
    ? fallbackHex
    : cssColorToHex(cssValue);

  return (
    <ObsSettingsControl label={label}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            type="color"
            disabled={disabled || transparent}
            value={pickerValue}
            onChange={(e) => onPick(e.target.value)}
            className="h-9 w-12 shrink-0 cursor-pointer rounded border border-outline-variant/50 bg-[#252525] p-0.5 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-color-swatch-wrapper]:p-px [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0"
            aria-label={`Chọn ${label}`}
          />
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-outline">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(#737373 0% 25%, #3f3f3f 0% 50%)",
                backgroundSize: "6px 6px",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: cssValue }}
            />
          </div>
          <span
            className="min-w-0 flex-1 truncate font-mono text-xs text-outline"
            title={cssValue}
          >
            {transparent ? "transparent" : cssValue}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            className={OBS_SWITCH_ROW_CLASS}
            disabled={disabled}
            checked={transparent}
            onCheckedChange={(c) =>
              onPick(c === true ? "transparent" : fallbackHex)
            }
          />
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#999999]">
            Trong suốt
          </span>
        </div>
      </div>
    </ObsSettingsControl>
  );
}

function StyleControls({
  disabled,
  styleSettings,
  onPatch,
}: {
  disabled: boolean;
  styleSettings: Record<string, unknown> | undefined;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const st = styleSettings ?? {};
  const fontFamily =
    typeof st.fontFamily === "string"
      ? st.fontFamily
      : "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
  const fontWeight =
    typeof st.fontWeight === "string" ? st.fontWeight : "normal";
  const fontSize = typeof st.fontSize === "number" ? st.fontSize : 16;
  const textColor =
    typeof st.textColor === "string" ? st.textColor : "#ffffff";
  const backgroundColor =
    typeof st.backgroundColor === "string"
      ? st.backgroundColor
      : "#1a1a1a";
  const accentColor =
    typeof st.accentColor === "string" ? st.accentColor : "#F6BD2A";
  const borderColor =
    typeof st.borderColor === "string" ? st.borderColor : "#333333";
  const textShadow = st.textShadow === true;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <ObsSettingsControl label="Font family">
          <Input
            key={`ff-${fontFamily.slice(0, 40)}`}
            disabled={disabled}
            defaultValue={fontFamily}
            onBlur={(e) => onPatch({ fontFamily: e.target.value })}
            className="min-w-0 bg-transparent border border-outline-variant/30 p-2 h-9 text-xs"
          />
        </ObsSettingsControl>
        <div className="grid grid-cols-2 gap-4">
          <ObsSettingsControl label="Weight">
            <Select
              value={fontWeight}
              onValueChange={(v) => onPatch({ fontWeight: v })}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-full min-w-0 border border-outline-variant/40 bg-transparent text-sm">
                <SelectValue placeholder="Weight" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
                {FONT_WEIGHT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ObsSettingsControl>
          <ObsSettingsControl label="Font size (px)">
            <Input
              key={`fs-${fontSize}`}
              type="number"
              disabled={disabled}
              defaultValue={fontSize}
              min={8}
              max={96}
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 8 && n <= 96)
                  onPatch({ fontSize: Math.round(n) });
              }}
              className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
            />
          </ObsSettingsControl>
        </div>
        <ObsSettingsControl label="Đổ bóng chữ">
          <Switch
            className={OBS_SWITCH_ROW_CLASS}
            disabled={disabled}
            checked={textShadow}
            onCheckedChange={(c) => onPatch({ textShadow: c === true })}
          />
        </ObsSettingsControl>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <ObsStyleColorField
          label="Màu chữ (text)"
          disabled={disabled}
          cssValue={textColor}
          fallbackHex="#ffffff"
          onPick={(v) => onPatch({ textColor: v })}
        />
        <ObsStyleColorField
          label="Nền (background)"
          disabled={disabled}
          cssValue={backgroundColor}
          fallbackHex="#1a1a1a"
          onPick={(v) => onPatch({ backgroundColor: v })}
        />
        <ObsStyleColorField
          label="Màu nhấn / số tiền (accent)"
          disabled={disabled}
          cssValue={accentColor}
          fallbackHex="#F6BD2A"
          onPick={(v) => onPatch({ accentColor: v })}
        />
        <ObsStyleColorField
          label="Viền (border color)"
          disabled={disabled}
          cssValue={borderColor}
          fallbackHex="#333333"
          onPick={(v) => onPatch({ borderColor: v })}
        />
      </div>
    </div>
  );
}

function AnimationControls({
  disabled,
  animationSettings,
  onPatch,
}: {
  disabled: boolean;
  animationSettings: Record<string, unknown> | undefined;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const a = animationSettings ?? {};
  const animationType =
    typeof a.animationType === "string" ? a.animationType : "fade";
  const direction =
    typeof a.direction === "string" ? a.direction : "bottom";
  const duration = typeof a.duration === "number" ? a.duration : 500;
  const easing = typeof a.easing === "string" ? a.easing : "ease-out";
  const zoomScale = typeof a.zoomScale === "number" ? a.zoomScale : 1.2;
  const bounceIntensity =
    typeof a.bounceIntensity === "number" ? a.bounceIntensity : 20;

  return (
    <div className="space-y-4">
      <ObsSettingsControl label="Kiểu">
        <Select
          value={animationType}
          onValueChange={(v) => onPatch({ animationType: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full min-w-0 border border-outline-variant/40 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
            {ANIMATION_TYPES.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ObsSettingsControl>
      <ObsSettingsControl label="Hướng">
        <Select
          value={direction}
          onValueChange={(v) => onPatch({ direction: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full min-w-0 border border-outline-variant/40 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
            {ANIMATION_DIRECTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ObsSettingsControl>
      <ObsSettingsControl label="Easing">
        <Select
          value={easing}
          onValueChange={(v) => onPatch({ easing: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full min-w-0 border border-outline-variant/40 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-container-low border-outline-variant/20 rounded-none">
            {EASING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ObsSettingsControl>
      <ObsSettingsControl label="Duration (ms)">
        <Input
          key={`anim-dur-${duration}`}
          type="number"
          disabled={disabled}
          defaultValue={duration}
          min={50}
          max={10000}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 50 && n <= 10000)
              onPatch({ duration: Math.round(n) });
          }}
          className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
        />
      </ObsSettingsControl>
      {(animationType === "zoom" || animationType === "bounce") && (
        <div className="grid grid-cols-2 gap-4">
          {animationType === "zoom" && (
            <ObsSettingsControl label="Zoom scale">
              <Input
                key={`zoom-${zoomScale}`}
                type="number"
                disabled={disabled}
                defaultValue={zoomScale}
                step={0.05}
                min={1}
                max={2}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 1 && n <= 2)
                    onPatch({ zoomScale: n });
                }}
                className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
              />
            </ObsSettingsControl>
          )}
          {animationType === "bounce" && (
            <ObsSettingsControl label="Bounce intensity">
              <Input
                key={`bounce-${bounceIntensity}`}
                type="number"
                disabled={disabled}
                defaultValue={bounceIntensity}
                min={0}
                max={100}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 0 && n <= 100)
                    onPatch({ bounceIntensity: Math.round(n) });
                }}
                className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
              />
            </ObsSettingsControl>
          )}
        </div>
      )}
    </div>
  );
}

function DisplayControls({
  disabled,
  displaySettings,
  onPatch,
}: {
  disabled: boolean;
  displaySettings: Record<string, unknown> | undefined;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const d = displaySettings ?? {};
  const durationMs = typeof d.duration === "number" ? d.duration : 5000;
  const fadeInDuration =
    typeof d.fadeInDuration === "number" ? d.fadeInDuration : 300;
  const fadeOutDuration =
    typeof d.fadeOutDuration === "number" ? d.fadeOutDuration : 300;
  const showProgress = d.showProgress === true;
  const progressColor =
    typeof d.progressColor === "string" ? d.progressColor : "#00ff00";
  const progressHeight =
    typeof d.progressHeight === "number" ? d.progressHeight : 3;

  return (
    <div className="space-y-4">
      <ObsSettingsControl label="Thời gian hiển thị (ms)">
        <Input
          key={`disp-dur-${durationMs}`}
          type="number"
          disabled={disabled}
          defaultValue={durationMs}
          min={500}
          max={120000}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 500 && n <= 120000)
              onPatch({ duration: Math.round(n) });
          }}
          className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
        />
      </ObsSettingsControl>
      <div className="grid grid-cols-2 gap-4">
        <ObsSettingsControl label="Fade in overlay (ms)">
          <Input
            key={`disp-fi-${fadeInDuration}`}
            type="number"
            disabled={disabled}
            defaultValue={fadeInDuration}
            min={0}
            max={5000}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0 && n <= 5000)
                onPatch({ fadeInDuration: Math.round(n) });
            }}
            className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
          />
        </ObsSettingsControl>
        <ObsSettingsControl label="Fade out overlay (ms)">
          <Input
            key={`disp-fo-${fadeOutDuration}`}
            type="number"
            disabled={disabled}
            defaultValue={fadeOutDuration}
            min={0}
            max={5000}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0 && n <= 5000)
                onPatch({ fadeOutDuration: Math.round(n) });
            }}
            className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
          />
        </ObsSettingsControl>
      </div>
      <ObsSettingsControl label="Thanh tiến trình">
        <Switch
          className={OBS_SWITCH_ROW_CLASS}
          disabled={disabled}
          checked={showProgress}
          onCheckedChange={(c) => onPatch({ showProgress: c === true })}
        />
      </ObsSettingsControl>
      {showProgress && (
        <div className="grid grid-cols-2 gap-4">
          <ObsSettingsControl label="Màu thanh">
            <Input
              key={`prog-c-${progressColor}`}
              disabled={disabled}
              defaultValue={progressColor}
              onBlur={(e) => onPatch({ progressColor: e.target.value })}
              className="bg-transparent border border-outline-variant/30 p-2 h-9 text-xs font-mono"
            />
          </ObsSettingsControl>
          <ObsSettingsControl label="Chiều cao (px)">
            <Input
              key={`prog-h-${progressHeight}`}
              type="number"
              disabled={disabled}
              defaultValue={progressHeight}
              min={1}
              max={24}
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1 && n <= 24)
                  onPatch({ progressHeight: Math.round(n) });
              }}
              className="bg-transparent border border-outline-variant/30 p-2 h-9 text-sm"
            />
          </ObsSettingsControl>
        </div>
      )}
    </div>
  );
}
