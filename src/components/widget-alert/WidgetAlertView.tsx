import { API_URL } from "@/src/constants";
import {
  useWidgetWebSocket,
  type DonationAlert,
} from "@/src/hooks/useWidgetWebSocket";
import type {
  WidgetPublicInitData,
  WidgetSettingsData,
} from "@/src/redux/queries/public.api";
import { parseWidgetDonationLevelQuery } from "@/src/utils/appNavigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AlertOverlay, { type WidgetAlertSettings } from "./AlertOverlay";

export type WidgetAlertViewProps = {
  streamerId: string;
  token: string;
  /** Khớp `?donationLevelId=` trên URL — BE trả settings/init theo mức donation đó. */
  donationLevelId?: string | null;
};

const SETTINGS_STORAGE_KEY = "widget_settings";

/** Gộp cấu hình từ `donationLevels[].configuration` (và field trực tiếp trên row) — BE thường vẫn trả full DTO, không filter theo query. */
const WIDGET_LEVEL_CONFIG_KEYS = [
  "imageSettings",
  "soundSettings",
  "animationSettings",
  "styleSettings",
  "positionSettings",
  "displaySettings",
  "generalSettings",
  "layoutSettings",
] as const;

function resolveWidgetDonationLevelId(
  prop?: string | null,
): string | undefined {
  const p = typeof prop === "string" ? prop.trim() : "";
  if (p) return p;
  if (typeof window !== "undefined") {
    return parseWidgetDonationLevelQuery(window.location.search);
  }
  return undefined;
}

function donationLevelRowIds(row: Record<string, unknown>): string[] {
  return [row.levelId, row.id, row._id]
    .filter((x): x is string | number => x != null && String(x).trim() !== "")
    .map((x) => String(x).trim().toLowerCase());
}

function findDonationLevelRow(
  data: WidgetSettingsData,
  donationLevelId: string,
): Record<string, unknown> | undefined {
  const wanted = donationLevelId.trim().toLowerCase();
  if (!wanted) return undefined;
  const levels = data.donationLevels;
  if (!Array.isArray(levels)) return undefined;
  for (const raw of levels) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (donationLevelRowIds(row).includes(wanted)) return row;
  }
  return undefined;
}

function applyDonationLevelToWidgetSettings(
  base: WidgetSettingsData,
  donationLevelId: string,
): WidgetSettingsData {
  const row = findDonationLevelRow(base, donationLevelId);
  if (!row) return base;

  const cfgRaw = row.configuration;
  const cfg =
    cfgRaw && typeof cfgRaw === "object" && !Array.isArray(cfgRaw)
      ? (cfgRaw as Record<string, unknown>)
      : undefined;

  const out: Record<string, unknown> = { ...base };

  for (const key of WIDGET_LEVEL_CONFIG_KEYS) {
    const patches: Record<string, unknown>[] = [];
    const fromCfg = cfg?.[key];
    if (fromCfg && typeof fromCfg === "object" && !Array.isArray(fromCfg)) {
      patches.push(fromCfg as Record<string, unknown>);
    }
    const fromRow = row[key];
    if (fromRow && typeof fromRow === "object" && !Array.isArray(fromRow)) {
      patches.push(fromRow as Record<string, unknown>);
    }
    if (!patches.length) continue;
    const prev = out[key];
    const baseSlice =
      typeof prev === "object" && prev && !Array.isArray(prev)
        ? { ...(prev as Record<string, unknown>) }
        : {};
    out[key] = patches.reduce(
      (acc, patch) => ({ ...acc, ...patch }),
      baseSlice,
    );
  }
  return out as WidgetSettingsData;
}

function widgetSettingsQueryString(
  donationLevelId: string | undefined,
): string {
  if (!donationLevelId?.trim()) return "";
  const sp = new URLSearchParams();
  const id = donationLevelId.trim();
  sp.set("donationLevelId", id);
  sp.set("levelId", id);
  return `?${sp.toString()}`;
}

function settingsStorageKey(
  streamerId: string,
  donationLevelId?: string | null,
): string {
  const lid =
    typeof donationLevelId === "string" && donationLevelId.trim()
      ? donationLevelId.trim()
      : "";
  return lid
    ? `${SETTINGS_STORAGE_KEY}_${streamerId}_${encodeURIComponent(lid)}`
    : `${SETTINGS_STORAGE_KEY}_${streamerId}`;
}

function cacheSettings(
  streamerId: string,
  donationLevelId: string | null | undefined,
  data: WidgetSettingsData,
) {
  try {
    localStorage.setItem(
      settingsStorageKey(streamerId, donationLevelId),
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

function loadCachedSettings(
  streamerId: string,
  donationLevelId?: string | null,
): WidgetSettingsData | null {
  try {
    const raw = localStorage.getItem(
      settingsStorageKey(streamerId, donationLevelId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: WidgetSettingsData };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Trang preview widget (khớp x-scan-fe-v2 `app/widget/alert/[streamerId]/[token]`).
 * Nền trong suốt, chỉ overlay alert + WebSocket.
 */
export function WidgetAlertView({
  streamerId,
  token,
  donationLevelId: donationLevelIdProp,
}: WidgetAlertViewProps) {
  const donationLevelId = resolveWidgetDonationLevelId(donationLevelIdProp);

  const [widgetSettings, setWidgetSettings] =
    useState<WidgetSettingsData | null>(() =>
      loadCachedSettings(streamerId, donationLevelId),
    );
  const [initData, setInitData] = useState<WidgetPublicInitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAlert, setPreviewAlert] = useState<DonationAlert | null>(null);
  const previewFiredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    previewFiredRef.current = false;
    setLoading(true);
    setError(null);

    const qs = widgetSettingsQueryString(donationLevelId);

    async function bootstrap() {
      try {
        const settingsUrl = `${API_URL}/widget-public/settings/${encodeURIComponent(streamerId)}/${encodeURIComponent(token)}${qs}`;
        const settingsRes = await fetch(settingsUrl);
        const settingsJson = (await settingsRes.json()) as Record<
          string,
          unknown
        >;

        if (cancelled) return;

        if (settingsRes.ok && settingsJson.success !== false) {
          const sd = (settingsJson.data ?? settingsJson) as WidgetSettingsData;
          setWidgetSettings(sd);
          cacheSettings(streamerId, donationLevelId, sd);
        }

        const initUrl = `${API_URL}/widget-public/init/${encodeURIComponent(streamerId)}/${encodeURIComponent(token)}${qs}`;
        const initRes = await fetch(initUrl);
        const initJson = (await initRes.json()) as Record<string, unknown>;

        if (cancelled) return;

        if (!initRes.ok || initJson.success === false) {
          const msg =
            (initJson.message as string) ||
            (initJson.error as { message?: string } | undefined)?.message ||
            `HTTP ${initRes.status}`;
          setError(msg);
          return;
        }

        const id = (initJson.data ?? initJson) as WidgetPublicInitData;
        setInitData(id);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [streamerId, token, donationLevelId]);

  useEffect(() => {
    if (previewFiredRef.current || !widgetSettings || loading) return;
    previewFiredRef.current = true;

    let amount = 50_000;
    if (donationLevelId) {
      const row = findDonationLevelRow(widgetSettings, donationLevelId);
      const m = row?.minAmount;
      if (typeof m === "number" && Number.isFinite(m) && m > 0) amount = m;
    }

    const preview: DonationAlert = {
      id: "__preview__",
      kind: "donation",
      donorName: "Preview Alert",
      amount,
      currency: "VND",
      message: "Đây là alert preview — kiểm tra ảnh & âm thanh của bạn!",
      timestamp: new Date().toISOString(),
    };
    setPreviewAlert(preview);
  }, [widgetSettings, loading, donationLevelId]);

  const { status, alerts, dismissAlert, notifyAlertCompleted } =
    useWidgetWebSocket(initData?.websocketUrl);

  const handleDismiss = useCallback(
    (id: string) => {
      if (id === "__preview__") {
        setPreviewAlert(null);
        return;
      }
      notifyAlertCompleted(id);
      dismissAlert(id);
    },
    [dismissAlert, notifyAlertCompleted],
  );

  const mergedSettings: WidgetAlertSettings | undefined = useMemo(() => {
    const base = widgetSettings ?? initData?.settings;
    if (!base) return undefined;
    if (!donationLevelId) return base as WidgetAlertSettings;
    return applyDonationLevelToWidgetSettings(
      base as WidgetSettingsData,
      donationLevelId,
    ) as WidgetAlertSettings;
  }, [widgetSettings, initData?.settings, donationLevelId]);

  const donationLevels = mergedSettings?.donationLevels;
  const positionSettings = mergedSettings?.positionSettings;

  const anchorMap: Record<
    string,
    { alignItems: string; justifyContent: string }
  > = {
    "top-left": { alignItems: "flex-start", justifyContent: "flex-start" },
    "top-center": { alignItems: "flex-start", justifyContent: "center" },
    "top-right": { alignItems: "flex-start", justifyContent: "flex-end" },
    "middle-left": { alignItems: "center", justifyContent: "flex-start" },
    "middle-center": { alignItems: "center", justifyContent: "center" },
    "middle-right": { alignItems: "center", justifyContent: "flex-end" },
    "bottom-left": { alignItems: "flex-end", justifyContent: "flex-start" },
    "bottom-center": { alignItems: "flex-end", justifyContent: "center" },
    "bottom-right": { alignItems: "flex-end", justifyContent: "flex-end" },
  };
  const anchor = positionSettings?.anchor || "middle-center";
  const layout = anchorMap[anchor] || anchorMap["middle-center"];

  const activeAlerts: DonationAlert[] = [];
  if (previewAlert) activeAlerts.push(previewAlert);
  activeAlerts.push(...alerts);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F6BD2A] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-transparent">
        <div className="rounded-xl bg-red-900/80 px-6 py-4 text-center text-white">
          <div className="mb-1 text-sm font-bold">Widget Error</div>
          <div className="text-xs opacity-80">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden bg-transparent p-4"
      style={{
        background: "transparent",
        alignItems: layout.alignItems,
        justifyContent: layout.justifyContent,
        display: "flex",
        zIndex: positionSettings?.zIndex ?? 1000,
      }}
    >
      <div className="fixed left-2 top-2 z-9999">
        <div
          className={`h-2 w-2 rounded-full ${
            status === "connected"
              ? "bg-green-500"
              : status === "connecting"
                ? "animate-pulse bg-yellow-400"
                : "bg-red-500"
          }`}
          title={status}
        />
      </div>

      {activeAlerts.slice(0, 1).map((alert) => (
        <Fragment key={alert.id}>
          <AlertOverlay
            alert={alert}
            settings={mergedSettings}
            donationLevels={donationLevels}
            onDismiss={handleDismiss}
          />
        </Fragment>
      ))}
    </div>
  );
}
