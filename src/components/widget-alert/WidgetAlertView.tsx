import { API_URL } from "@/src/constants";
import {
  useWidgetWebSocket,
  type DonationAlert,
} from "@/src/hooks/useWidgetWebSocket";
import type {
  WidgetPublicInitData,
  WidgetSettingsData,
} from "@/src/redux/queries/public.api";
import { useCallback, useEffect, useRef, useState } from "react";
import AlertOverlay, { type WidgetAlertSettings } from "./AlertOverlay";

export type WidgetAlertViewProps = {
  streamerId: string;
  token: string;
};

const SETTINGS_STORAGE_KEY = "widget_settings";

function cacheSettings(streamerId: string, data: WidgetSettingsData) {
  try {
    localStorage.setItem(
      `${SETTINGS_STORAGE_KEY}_${streamerId}`,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

function loadCachedSettings(streamerId: string): WidgetSettingsData | null {
  try {
    const raw = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_${streamerId}`);
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
export function WidgetAlertView({ streamerId, token }: WidgetAlertViewProps) {
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettingsData | null>(
    () => loadCachedSettings(streamerId),
  );
  const [initData, setInitData] = useState<WidgetPublicInitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAlert, setPreviewAlert] = useState<DonationAlert | null>(null);
  const previewFiredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const settingsUrl = `${API_URL}/widget-public/settings/${encodeURIComponent(streamerId)}/${encodeURIComponent(token)}`;
        const settingsRes = await fetch(settingsUrl);
        const settingsJson = (await settingsRes.json()) as Record<
          string,
          unknown
        >;

        if (cancelled) return;

        if (settingsRes.ok && settingsJson.success !== false) {
          const sd = (settingsJson.data ?? settingsJson) as WidgetSettingsData;
          setWidgetSettings(sd);
          cacheSettings(streamerId, sd);
        }

        const initUrl = `${API_URL}/widget-public/init/${encodeURIComponent(streamerId)}/${encodeURIComponent(token)}`;
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
  }, [streamerId, token]);

  useEffect(() => {
    if (previewFiredRef.current || !widgetSettings || loading) return;
    previewFiredRef.current = true;

    const preview: DonationAlert = {
      id: "__preview__",
      kind: "donation",
      donorName: "Preview Alert",
      amount: 50000,
      currency: "VND",
      message:
        "Đây là alert preview — kiểm tra ảnh & âm thanh của bạn!",
      timestamp: new Date().toISOString(),
    };
    setPreviewAlert(preview);
  }, [widgetSettings, loading]);

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

  const mergedSettings: WidgetAlertSettings | undefined =
    widgetSettings || initData?.settings;
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
      <div className="fixed left-2 top-2 z-[9999]">
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
        <AlertOverlay
          key={alert.id}
          alert={alert}
          settings={mergedSettings}
          donationLevels={donationLevels}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
