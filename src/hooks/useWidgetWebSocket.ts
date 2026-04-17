import { useCallback, useEffect, useRef, useState } from "react";
import type { WidgetWsAlertCompletedMessage } from "./widgetWebSocket.types";

export type {
  WidgetWsAlertCompletedMessage,
  WidgetWsDonationPayload,
  WidgetWsInboundMessage,
  WidgetWsMatchTargetPayload,
} from "./widgetWebSocket.types";

export type DonationAlertKind = "donation" | "match_target_reached";

export interface DonationAlert {
  id?: string;
  streamerId?: string;
  kind?: DonationAlertKind;
  donorName?: string;
  amount?: number;
  currency?: string;
  message?: string;
  userMediaUrl?: string;
  userSoundUrl?: string;
  timestamp?: string;
  matchId?: string;
  matchTitle?: string;
  poolTotal?: number;
  [key: string]: unknown;
}

type Status = "connecting" | "connected" | "disconnected" | "error";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
const PING_INTERVAL_MS = 30_000;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function isTypedDonation(raw: Record<string, unknown>): boolean {
  return raw.type === "donation";
}

function isMatchTargetReached(raw: Record<string, unknown>): boolean {
  return raw.type === "match_target_reached";
}

function isLegacyDonationShape(raw: Record<string, unknown>): boolean {
  return (
    raw.type === "alert" ||
    !!raw.donation ||
    (typeof raw.alertId === "string" && raw.type !== "match_target_reached")
  );
}

function extractInner(data: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["donation", "data", "payload", "alert"] as const) {
    const candidate = data[key];
    if (
      candidate &&
      typeof candidate === "object" &&
      "amount" in (candidate as object)
    ) {
      return candidate as Record<string, unknown>;
    }
  }
  return data;
}

function parseDonationPayload(
  inner: Record<string, unknown>,
  fallback: Record<string, unknown>,
): DonationAlert {
  const amount = Number(inner.amount ?? fallback.amount ?? 0);

  return {
    kind: "donation",
    id:
      (inner.alertId as string) ||
      (inner.id as string) ||
      (fallback.alertId as string) ||
      (fallback.id as string) ||
      `${Date.now()}-${Math.random()}`,
    streamerId:
      (inner.streamerId as string) ||
      (fallback.streamerId as string) ||
      undefined,
    donorName:
      (inner.donorName as string) || (fallback.donorName as string) || "Ẩn danh",
    amount: Number.isFinite(amount) ? amount : 0,
    currency:
      (inner.currency as string) ?? (fallback.currency as string) ?? "VND",
    message:
      (inner.message as string) ?? (fallback.message as string) ?? "",
    userMediaUrl:
      (inner.userMediaUrl as string) ||
      (fallback.userMediaUrl as string) ||
      undefined,
    userSoundUrl:
      (inner.userSoundUrl as string) ||
      (fallback.userSoundUrl as string) ||
      undefined,
    timestamp:
      (inner.timestamp as string) ||
      (fallback.timestamp as string) ||
      new Date().toISOString(),
  };
}

function parseDonationEnvelope(raw: Record<string, unknown>): DonationAlert {
  const data = asRecord(raw.data);
  const inner = data ?? extractInner(raw);
  return parseDonationPayload(inner, raw);
}

function parseMatchTargetEnvelope(raw: Record<string, unknown>): DonationAlert {
  const data = asRecord(raw.data) ?? {};
  const pool = Number(data.poolTotal ?? 0);
  return {
    kind: "match_target_reached",
    id:
      (data.alertId as string) ||
      (raw.alertId as string) ||
      `${Date.now()}-${Math.random()}`,
    streamerId:
      (data.streamerId as string) || (raw.streamerId as string) || undefined,
    matchId: (data.matchId as string) || undefined,
    matchTitle: (data.matchTitle as string) || "Match",
    poolTotal: Number.isFinite(pool) ? pool : 0,
    currency: (data.currency as string) ?? "VND",
    timestamp: (data.timestamp as string) || new Date().toISOString(),
    donorName: (data.matchTitle as string) || "Match",
    amount: Number.isFinite(pool) ? pool : 0,
  };
}

function parseLegacyDonation(raw: Record<string, unknown>): DonationAlert {
  const inner = extractInner(raw);
  const base = parseDonationPayload(inner, raw);
  if (!base.kind) base.kind = "donation";
  return base;
}

function parseInboundAlert(raw: Record<string, unknown>): DonationAlert | null {
  if (isTypedDonation(raw)) {
    return parseDonationEnvelope(raw);
  }
  if (isMatchTargetReached(raw)) {
    return parseMatchTargetEnvelope(raw);
  }
  if (isLegacyDonationShape(raw)) {
    return parseLegacyDonation(raw);
  }
  return null;
}

function buildAlertCompletedPayload(
  alertId: string,
): WidgetWsAlertCompletedMessage {
  return { type: "alert_completed", data: { alertId } };
}

export function useWidgetWebSocket(websocketUrl: string | undefined) {
  const [status, setStatus] = useState<Status>("disconnected");
  const [alerts, setAlerts] = useState<DonationAlert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const mountedRef = useRef(true);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const notifyAlertCompleted = useCallback((alertId: string) => {
    if (!alertId || alertId === "__preview__") return;
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(buildAlertCompletedPayload(alertId)));
    } catch {
      /* ignore */
    }
  }, []);

  const startPing = useCallback(() => {
    if (pingRef.current != null) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    pingRef.current = setInterval(() => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, PING_INTERVAL_MS);
  }, []);

  function stopPing() {
    if (pingRef.current != null) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  }

  const connect = useCallback(() => {
    if (!websocketUrl || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setStatus("connected");
      retryRef.current = 0;
      startPing();
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;

        if (data.type === "pong") return;

        const alert = parseInboundAlert(data);
        if (alert) {
          setAlerts((prev) => [...prev, alert]);
        }
      } catch {
        /* ignore non-JSON */
      }
    };

    ws.onclose = () => {
      stopPing();
      if (!mountedRef.current) return;
      setStatus("disconnected");
      const delay =
        RECONNECT_DELAYS[
          Math.min(retryRef.current, RECONNECT_DELAYS.length - 1)
        ];
      retryRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("error");
      ws.close();
    };
  }, [websocketUrl, startPing]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      stopPing();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { status, alerts, dismissAlert, notifyAlertCompleted };
}
