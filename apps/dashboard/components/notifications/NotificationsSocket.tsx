"use client";

import { useEffect } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { useAuthStore } from "@edss/auth";
import { useRealtimeNotifications, type RealtimeNotification } from "./notifications-store";

/**
 * W-01: STOMP-over-WebSocket subscriber for real-time notifications.
 *
 * - Backend endpoint: {@code ${NEXT_PUBLIC_WS_BASE}/ws/v1} (STOMP over
 *   WebSocket, configured in Spring {@code WebSocketConfig}). Backend
 *   requires the JWT bearer token in the STOMP CONNECT frame's
 *   Authorization header — anonymous CONNECT is rejected.
 * - Subscription: {@code /user/queue/notifications} — Spring rewrites to
 *   {@code /user/{principal.name}/queue/notifications} where principal
 *   name is the JWT sub (user id).
 * - Reconnect + backoff: {@code @stomp/stompjs} handles this internally
 *   via {@code reconnectDelay}; capped at 30 s so a broken deploy does
 *   not hammer.
 * - Lifecycle: connect only when authenticated; disconnect on logout
 *   or when the access token becomes null.
 *
 * The parsed message is pushed into {@link useRealtimeNotifications} —
 * the drawer consumes the store for its live feed and the topbar bell
 * badge reads unreadCount.
 */

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE ?? "wss://api.edss.example";
const WS_URL = `${WS_BASE}/ws/v1`;

export function NotificationsSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const status = useAuthStore((s) => s.status);
  const push = useRealtimeNotifications((s) => s.push);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const client = new Client({
      brokerURL: WS_URL,
      // Backend WebSocketConfig.StompAuthInterceptor reads Authorization
      // from the CONNECT frame's native headers, not the WebSocket
      // Sec-WebSocket-Protocol header. @stomp/stompjs sends
      // connectHeaders as the STOMP frame headers.
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      // Cap the reconnect backoff so a broken deploy stops beating on it.
      reconnectDelay: 5_000,
      heartbeatIncoming: 30_000,
      heartbeatOutgoing: 30_000,
      // Silence the built-in debug output in production; if verbose
      // troubleshooting is needed a developer can flip this locally.
      debug: () => {},
    });

    client.onConnect = () => {
      client.subscribe("/user/queue/notifications", (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body) as RealtimeNotification;
          if (payload && typeof payload.id === "string") {
            push({ ...payload, read: payload.read ?? false });
          }
        } catch {
          // Malformed frame — ignore. Backend contract is JSON.
        }
      });
    };

    client.onStompError = (frame) => {
      // Server-side STOMP error frame (e.g. bad JWT). Do not surface a
      // toast — the drawer degrades to polled data. Silent by design.
      console.warn("[notifications-socket] STOMP error", frame.headers.message);
    };

    client.activate();

    return () => {
      void client.deactivate();
    };
  }, [status, accessToken, push]);

  return null;
}
