/**
 * SSE (Server-Sent Events) client with one-time ticket auth and auto-reconnect.
 *
 * Usage:
 *   connectSSE()         — called when user authenticates
 *   disconnectSSE()      — called on logout or cleanup
 *   onSSEEvent("name", (data) => { ... })  — register a typed event handler
 */

import { post, tokens } from "./api";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API_VERSION = "v1";
import { toast } from "./stores";

// ============================================================================
// Types
// ============================================================================

type SSEEventHandler<T = unknown> = (data: T) => void;

interface NotificationEvent {
  message: string;
  timestamp: string;
}

// ============================================================================
// State
// ============================================================================

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 1000;
const MAX_BACKOFF_MS = 30000;

const handlers = new Map<string, Set<SSEEventHandler>>();

// ============================================================================
// Public API
// ============================================================================

/**
 * Register a handler for a named SSE event. Returns an unsubscribe function.
 */
export function onSSEEvent<T = unknown>(
  eventName: string,
  handler: SSEEventHandler<T>
): () => void {
  const isNewEventName = !handlers.has(eventName);
  if (isNewEventName) {
    handlers.set(eventName, new Set());
  }
  handlers.get(eventName)!.add(handler as SSEEventHandler);

  // If a connection is already open and this is a new event type, attach the listener now.
  if (isNewEventName && eventSource) {
    addSourceListener(eventName);
  }

  return () => {
    handlers.get(eventName)?.delete(handler as SSEEventHandler);
  };
}

/**
 * Connect to the SSE stream. Gets a one-time ticket via POST, then opens EventSource.
 * Automatically reconnects with exponential backoff on disconnect.
 */
export async function connectSSE(): Promise<void> {
  if (typeof window === "undefined") return;
  if (eventSource) return;

  if (!tokens.access) return;

  try {
    const { ticket } = await post<{ ticket: string }>("/events/ticket");
    const url = `${API_BASE}/api/${API_VERSION}/events/stream?ticket=${encodeURIComponent(ticket)}`;

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      backoffMs = 1000;
    };

    eventSource.onerror = () => {
      cleanup();
      scheduleReconnect();
    };

    // Register all current handlers as EventSource listeners
    for (const [eventName] of handlers) {
      addSourceListener(eventName);
    }
  } catch {
    scheduleReconnect();
  }
}

/**
 * Disconnect from the SSE stream and stop reconnection attempts.
 */
export function disconnectSSE(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  cleanup();
  backoffMs = 1000;
}

// ============================================================================
// Internal
// ============================================================================

function cleanup() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

function addSourceListener(eventName: string) {
  if (!eventSource) return;
  eventSource.addEventListener(eventName, (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      const eventHandlers = handlers.get(eventName);
      if (eventHandlers) {
        for (const handler of eventHandlers) {
          handler(data);
        }
      }
    } catch {
      // Ignore malformed JSON
    }
  });
}

async function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    // Refresh the access token before reconnecting (it may have expired)
    if (tokens.refresh) {
      try {
        const response = await fetch(
          `${API_BASE}/api/${API_VERSION}/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: tokens.refresh }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          tokens.set(data.access_token, data.refresh_token);
        } else {
          // Refresh failed — user needs to re-login
          return;
        }
      } catch {
        // Network error — try again later
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        scheduleReconnect();
        return;
      }
    }

    await connectSSE();
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
  }, backoffMs);
}

// ============================================================================
// Built-in event handlers
// ============================================================================

onSSEEvent<NotificationEvent>("notification", (data) => {
  toast.info(data.message);
});
