/**
 * Contract WebSocket widget OBS (server → client & client → server).
 * Ping/pong giữ kết nối xử lý riêng trong useWidgetWebSocket.
 */

/** Server → client: donation alert */
export type WidgetWsDonationPayload = {
  alertId: string;
  streamerId?: string;
  donorName?: string;
  amount?: number;
  currency?: string;
  message?: string;
  timestamp?: string;
};

/** Server → client: match pool đạt mục tiêu */
export type WidgetWsMatchTargetPayload = {
  alertId: string;
  streamerId?: string;
  matchId?: string;
  matchTitle?: string;
  poolTotal?: number;
  currency?: string;
  timestamp?: string;
};

export type WidgetWsInboundMessage =
  | { type: "donation"; data: WidgetWsDonationPayload }
  | { type: "match_target_reached"; data: WidgetWsMatchTargetPayload };

/** Client → server: báo đã hiển thị xong một alert */
export type WidgetWsAlertCompletedMessage = {
  type: "alert_completed";
  data: { alertId: string };
};
