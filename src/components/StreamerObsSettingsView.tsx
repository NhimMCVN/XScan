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
  Upload,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
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
import { API_URL } from "@/src/constants";
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
} from "@/src/redux/queries/obs.api";

const UNLIMITED_MAX_SENTINEL = 9e15;

/** Luôn render dòng đầu: cấu hình gốc trên `my-settings` (không phải một donation level). */
const OBS_GLOBAL_DEFAULT_LIST_KEY = "__obs_global_default__";

function absoluteApiUrl(maybe: string | undefined): string {
  if (!maybe) return "";
  const t = String(maybe).trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `${API_URL}${t.startsWith("/") ? "" : "/"}${t}`;
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

function donationLevelRouteId(d: DonationLevelDTO): string {
  return String(
    d.levelId ??
      (d as { id?: string }).id ??
      (d as { _id?: string })._id ??
      "",
  );
}

function maxAmountToUi(maxAmount: number | undefined): number {
  if (maxAmount == null || Number.isNaN(maxAmount)) return UNLIMITED_MAX_SENTINEL;
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

export function StreamerObsSettingsView() {
  const { data: profileRes, isLoading: profileLoading } = useGetProfileQuery();
  const profile = profileRes?.success ? profileRes.data : undefined;
  const streamerId =
    profile?._id != null ? String(profile._id) : undefined;

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
  const widgetUrlResolved = absoluteApiUrl(
    typeof settings?.widgetUrl === "string"
      ? settings.widgetUrl
      : undefined,
  );

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

  const { data: levelsRes, isLoading: levelsLoading } =
    useGetDonationLevelsQuery(undefined, {
      skip: profileLoading || !streamerId,
    });

  const apiLevels = useMemo(
    () => parseDonationLevelsPayload(levelsRes),
    [levelsRes],
  );

  const [openByListKey, setOpenByListKey] = useState<Record<string, boolean>>(
    {},
  );

  const donationLevelsUi: UiDonationLevel[] = useMemo(
    () =>
      apiLevels.map((dto, idx) => {
        const routeId = donationLevelRouteId(dto);
        const persisted = Boolean(routeId);
        const listKey = routeId || `pending-${idx}-${dto.levelName}-${dto.minAmount}`;
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
          active: dto.isEnabled !== false,
          isOpen: openByListKey[listKey] ?? false,
        };
      }),
    [apiLevels, openByListKey],
  );

  const displayRows: DisplayRow[] = useMemo(() => {
    const rows: DisplayRow[] = [];
    if (settingsRes?.success && settings) {
      rows.push({
        kind: "global",
        listKey: OBS_GLOBAL_DEFAULT_LIST_KEY,
        isOpen: openByListKey[OBS_GLOBAL_DEFAULT_LIST_KEY] ?? false,
        widgetActive: settings.isActive !== false,
      });
    }
    for (const l of donationLevelsUi) {
      rows.push({ kind: "level", ...l });
    }
    return rows;
  }, [settingsRes?.success, settings, donationLevelsUi, openByListKey]);

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

  const toggleLevelActive = async (routeId: string, next: boolean) => {
    if (!routeId) return;
    try {
      await updateLevel({
        levelId: routeId,
        body: { isEnabled: next },
      }).unwrap();
    } catch (e) {
      console.warn(getMutationError(e));
    }
  };

  const toggleGlobalWidgetActive = async (next: boolean) => {
    try {
      await updateMySettings({ isActive: next }).unwrap();
      await refetchSettings();
    } catch (e) {
      console.warn(getMutationError(e));
    }
  };

  const cloneLevel = async (routeId: string) => {
    const src = apiLevels.find((d) => donationLevelRouteId(d) === routeId);
    if (!src) return;
    try {
      await addLevel({
        levelName: `${src.levelName || "Mức"} (Copy)`,
        minAmount: Number(src.minAmount) || 0,
        maxAmount:
          src.maxAmount != null
            ? Number(src.maxAmount)
            : UNLIMITED_MAX_SENTINEL,
        currency: src.currency || "VND",
        isEnabled: src.isEnabled !== false,
        configuration: src.configuration,
      }).unwrap();
    } catch (e) {
      console.warn(getMutationError(e));
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
        isEnabled: true,
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
    if (!widgetUrlResolved) return;
    try {
      await navigator.clipboard.writeText(widgetUrlResolved);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Không copy được URL.");
    }
  }, [widgetUrlResolved]);

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
          data &&
          typeof data === "object" &&
          typeof data.message === "string"
            ? data.message
            : null;
        return msg || "Không tải được cấu hình OBS.";
      })()
    : null;

  const isWidgetActive = settings?.isActive !== false;

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
              <div className="flex gap-2 flex-wrap justify-end">
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
                  disabled={!widgetUrlResolved}
                  onClick={() => {
                    if (widgetUrlResolved)
                      window.open(widgetUrlResolved, "_blank", "noreferrer");
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
                value={widgetUrlResolved || "—"}
                className="bg-surface-container-highest/30 border-outline-variant/20 rounded-none font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-none shrink-0"
                disabled={!widgetUrlResolved}
                onClick={() => void copyWidgetUrl()}
              >
                {copied ? (
                  <CheckMini />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
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

        <div className="space-y-4">
          {displayRows.map((row) => (
            <Card
              key={row.listKey}
              className="bg-surface-container-low border-outline-variant/20 rounded-none"
            >
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between">
                  <div
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => toggleRowOpen(row.listKey)}
                  >
                    <Button variant="ghost" size="icon">
                      {row.isOpen ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <div>
                      {row.kind === "global" ? (
                        <>
                          <p className="font-bold">Cấu hình mặc định</p>
                          <p className="text-xs text-outline">
                            Cấu hình gốc trên OBS (my-settings) — 0 — Vô hạn
                            VND · các mức bên dưới có thể ghi đè theo ngưỡng
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
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={
                        row.kind === "global"
                          ? row.widgetActive
                          : row.active
                      }
                      disabled={row.kind === "level" && !row.persisted}
                      onCheckedChange={(v) => {
                        if (row.kind === "global")
                          void toggleGlobalWidgetActive(v);
                        else void toggleLevelActive(row.routeId, v);
                      }}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!widgetUrlResolved}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (widgetUrlResolved)
                          window.open(
                            widgetUrlResolved,
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
                          disabled={!row.persisted}
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
                          disabled={!row.persisted}
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
                          disabled={apiLevels.length <= 1 || !row.persisted}
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
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
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
              {addSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Tạo"
              )}
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

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia, { isLoading: deleting }] = useDeleteMediaMutation();
  const [updateLevel] = useUpdateDonationLevelMutation();
  const [updateMySettings] = useUpdateMySettingsMutation();

  const imageSettings = configuration?.imageSettings as
    | { url?: string | null }
    | undefined;
  const soundSettings = configuration?.soundSettings as
    | { url?: string | null }
    | undefined;
  const imageUrl =
    typeof imageSettings?.url === "string" ? imageSettings.url : "";
  const soundUrl =
    typeof soundSettings?.url === "string" ? soundSettings.url : "";
  const mediaUrl = imageUrl || soundUrl;

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

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isGlobal && !levelRouteId) return;
    const mime = file.type || "";
    const mediaType = mime.startsWith("video")
      ? "video"
      : mime.startsWith("audio")
        ? "sound"
        : "image";
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mediaType", mediaType);
    fd.append("purpose", "alert");
    try {
      const res = (await uploadMedia(fd).unwrap()) as ApiResponse<MediaUploadResponse>;
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
    }
  };

  const onDeleteMedia = async () => {
    if (!mediaUrl) return;
    if (!isGlobal && !levelRouteId) return;
    try {
      await deleteMedia(mediaUrl).unwrap();
      const nextConfig = soundUrl
        ? mergeConfiguration({
            soundSettings: {
              ...(typeof soundSettings === "object" && soundSettings
                ? soundSettings
                : {}),
              url: null,
            },
          })
        : mergeConfiguration({
            imageSettings: {
              ...(typeof imageSettings === "object" && imageSettings
                ? imageSettings
                : {}),
              url: null,
            },
          });
      await persistMediaConfig(nextConfig);
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
        ref={fileRef}
        type="file"
        accept="image/*,audio/*,video/*"
        className="hidden"
        onChange={(ev) => void onPickFile(ev)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Media">
          <button
            type="button"
            disabled={uploading || !canPersist}
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-outline-variant/30 p-8 text-center text-outline bg-surface-container-lowest hover:bg-surface-container-lowest/80 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 mx-auto mb-2" />
            )}
            <p className="text-xs font-bold uppercase">Upload Media</p>
            {mediaUrl ? (
              <p className="text-[10px] mt-2 break-all opacity-80">{mediaUrl}</p>
            ) : null}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-outline rounded-none uppercase text-xs font-bold"
              disabled={uploading || !canPersist}
              onClick={() => fileRef.current?.click()}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-outline rounded-none uppercase text-xs font-bold text-destructive"
              disabled={deleting || !mediaUrl || !canPersist}
              onClick={() => void onDeleteMedia()}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
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
                <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />
              </Control>
              <Control label="Loop">
                <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />
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
          rightContent={
            <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />
          }
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
              <Switch className="data-[state=checked]:bg-black data-[state=unchecked]:bg-amber-100 border border-primary [&_[role=thumb]]:rounded-full [&_[role=thumb]]:bg-primary" />
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
