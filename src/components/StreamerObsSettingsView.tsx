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
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [updateLevel] = useUpdateDonationLevelMutation();
  const [updateMySettings] = useUpdateMySettingsMutation();

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

  const Section = ({
    title,
    children,
    className = "",
    rightContent,
  }: {
    title: string;
    children: ReactNode;
    className?: string;
    rightContent?: ReactNode;
  }) => (
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

  const Control = ({
    label,
    children,
  }: {
    label: string;
    children: ReactNode;
  }) => (
    <div className="bg-[#333333] p-4 space-y-1">
      <Label className="text-[10px] font-bold uppercase text-[#999999]">
        {label}
      </Label>
      {children}
    </div>
  );

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
        <Section title="Media">
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
        </Section>

        <Section title="Audio">
          <div className="space-y-4">
            <Control label="Volume">
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[50]}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:rounded-full"
                />
                <span className="text-sm font-bold text-primary w-8 text-right">
                  50%
                </span>
              </div>
            </Control>
            <div className="grid grid-cols-2 gap-4">
              <Control label="On/Off">
                <Switch className={OBS_SWITCH_ROW_CLASS} />
              </Control>
              <Control label="Loop">
                <Switch className={OBS_SWITCH_ROW_CLASS} />
              </Control>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Control label="Fade in (ms)">
              <Input
                type="number"
                defaultValue={300}
                className="bg-transparent border-none p-0 h-6 text-sm"
              />
            </Control>
            <Control label="Fade out (ms)">
              <Input
                type="number"
                defaultValue={300}
                className="bg-transparent border-none p-0 h-6 text-sm"
              />
            </Control>
          </div>
        </Section>
      </div>

      <Section title="Styling & Typography">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Control label="Font Family">
              <Select>
                <SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm">
                  <SelectValue placeholder="Space Grotesk" />
                </SelectTrigger>
              </Select>
            </Control>
            <div className="grid grid-cols-2 gap-4">
              <Control label="Weight">
                <Select>
                  <SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm">
                    <SelectValue placeholder="Bold" />
                  </SelectTrigger>
                </Select>
              </Control>
              <Control label="Font Size (px)">
                <Input
                  type="number"
                  defaultValue={24}
                  className="bg-transparent border-none p-0 h-6 text-sm"
                />
              </Control>
            </div>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:rounded-full"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Control label="Message Color">
              <div className="w-8 h-8 bg-gray-200 border border-outline" />
            </Control>
            <Control label="Background Color">
              <div className="w-8 h-8 bg-black border border-outline" />
            </Control>
            <Control label="Money Color">
              <div className="w-8 h-8 bg-primary border border-outline" />
            </Control>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section
          title="Animation"
          rightContent={<Switch className={OBS_SWITCH_ROW_CLASS} />}
        >
          <div className="space-y-4">
            <Control label="Kiểu (Type)">
              <Select>
                <SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm">
                  <SelectValue placeholder="Slide In" />
                </SelectTrigger>
              </Select>
            </Control>
            <Control label="Hướng (Direction)">
              <Select>
                <SelectTrigger className="bg-transparent border-none p-0 h-6 text-sm">
                  <SelectValue placeholder="From Left" />
                </SelectTrigger>
              </Select>
            </Control>
            <Control label="Duration (ms)">
              <Input
                type="number"
                defaultValue={800}
                className="bg-transparent border-none p-0 h-6 text-sm"
              />
            </Control>
          </div>
        </Section>

        <Section
          title="Thời gian hiển thị"
          rightContent={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase">Tự ẩn</span>{" "}
              <Switch className={OBS_SWITCH_ROW_CLASS} />
            </div>
          }
        >
          <div className="space-y-4">
            <Control label="Display Duration (Seconds)">
              <Input
                type="number"
                defaultValue={10}
                className="bg-transparent border-none p-0 h-6 text-sm"
              />
            </Control>
            <div className="grid grid-cols-2 gap-4">
              <Control label="Fade in (ms)">
                <Input
                  type="number"
                  defaultValue={400}
                  className="bg-transparent border-none p-0 h-6 text-sm"
                />
              </Control>
              <Control label="Fade out (ms)">
                <Input
                  type="number"
                  defaultValue={400}
                  className="bg-transparent border-none p-0 h-6 text-sm"
                />
              </Control>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
