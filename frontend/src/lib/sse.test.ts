import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./api", () => ({
  post: vi.fn(),
  tokens: { access: "", refresh: "", set: vi.fn(), clear: vi.fn() },
}));

vi.mock("./stores", () => ({
  toast: { info: vi.fn() },
}));

import { onSSEEvent, connectSSE, disconnectSSE } from "./sse";
import { post, tokens } from "./api";
import { toast } from "./stores";

const mockPost = vi.mocked(post);
const mockTokens = tokens as unknown as {
  access: string;
  refresh: string;
  set: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};
const mockToast = vi.mocked(toast);

let lastEventSource: MockEventSource | null = null;
let nativeEventSource: typeof EventSource | undefined;

function trackEventSource(source: MockEventSource) {
  lastEventSource = source;
}

function installMockEventSource() {
  nativeEventSource = globalThis.EventSource;
  globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
}

function restoreEventSource() {
  if (nativeEventSource) {
    globalThis.EventSource = nativeEventSource;
  }
}

class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {};
  readyState = 1;

  constructor(url: string) {
    this.url = url;
    trackEventSource(this);
    setTimeout(() => this.onopen?.(), 0);
  }

  addEventListener(name: string, fn: (e: MessageEvent) => void) {
    if (!this.listeners[name]) this.listeners[name] = [];
    this.listeners[name].push(fn);
  }

  close() {
    this.readyState = 2;
  }

  emit(eventName: string, data: unknown) {
    const payload = { data: JSON.stringify(data) } as MessageEvent;
    for (const fn of this.listeners[eventName] ?? []) {
      fn(payload);
    }
  }
}

describe("onSSEEvent", () => {
  beforeEach(() => {
    disconnectSSE();
    vi.clearAllMocks();
    lastEventSource = null;
  });

  it("registers a handler and returns unsubscribe function", () => {
    const handler = () => {};
    const unsub = onSSEEvent("evt1", handler);
    expect(typeof unsub).toBe("function");
  });

  it("unsubscribe removes the handler", () => {
    let called = false;
    const unsub = onSSEEvent("evt2", () => {
      called = true;
    });
    unsub();
    expect(called).toBe(false);
  });

  it("supports multiple handlers for same event", async () => {
    let count = 0;
    onSSEEvent("evt3", () => {
      count++;
    });
    onSSEEvent("evt3", () => {
      count++;
    });

    mockTokens.access = "token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);
    installMockEventSource();

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.emit("evt3", { ok: true });
    expect(count).toBe(2);

    disconnectSSE();
    restoreEventSource();
  });

  it("unsubscribing one handler doesn't affect others", async () => {
    let count = 0;
    const unsub1 = onSSEEvent("evt4", () => {
      count++;
    });
    onSSEEvent("evt4", () => {
      count++;
    });
    unsub1();

    mockTokens.access = "token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);
    installMockEventSource();

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.emit("evt4", { ok: true });
    expect(count).toBe(1);

    disconnectSSE();
    restoreEventSource();
  });

  it("attaches listener immediately when registering new event on open connection", async () => {
    mockTokens.access = "token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);
    installMockEventSource();

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());

    let called = false;
    onSSEEvent("late-event", () => {
      called = true;
    });
    lastEventSource!.emit("late-event", { ok: true });
    expect(called).toBe(true);

    disconnectSSE();
    restoreEventSource();
  });
});

describe("connectSSE", () => {
  beforeEach(() => {
    disconnectSSE();
    vi.clearAllMocks();
    lastEventSource = null;
    installMockEventSource();
    mockTokens.access = "";
    mockTokens.refresh = "";
  });

  afterEach(() => {
    disconnectSSE();
    restoreEventSource();
    vi.useRealTimers();
  });

  it("skips connection when no access token", async () => {
    mockTokens.access = "";
    await connectSSE();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("requests ticket and creates EventSource when token exists", async () => {
    mockTokens.access = "test-access-token";
    mockPost.mockResolvedValueOnce({ ticket: "one-time-ticket" } as never);
    await connectSSE();
    expect(mockPost).toHaveBeenCalledWith("/events/ticket");
    expect(lastEventSource?.url).toContain("ticket=one-time-ticket");
  });

  it("skips duplicate connection", async () => {
    mockTokens.access = "test-access-token";
    mockPost.mockResolvedValue({ ticket: "ticket" } as never);
    await connectSSE();
    await connectSSE();
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("registers existing handlers on new connection", async () => {
    const handler = vi.fn();
    onSSEEvent("pre-registered", handler);
    mockTokens.access = "test-access-token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);
    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.emit("pre-registered", { hello: "world" });
    expect(handler).toHaveBeenCalledWith({ hello: "world" });
  });

  it("schedules reconnect on ticket fetch failure", async () => {
    vi.useFakeTimers();
    mockTokens.access = "test-access-token";
    mockPost.mockRejectedValueOnce(new Error("network error"));

    await connectSSE();
    expect(mockPost).toHaveBeenCalledTimes(1);

    mockPost.mockResolvedValueOnce({ ticket: "retry-ticket" } as never);
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it("reconnects after EventSource error with exponential backoff", async () => {
    vi.useFakeTimers();
    mockTokens.access = "token";
    mockPost.mockResolvedValue({ ticket: "ticket" } as never);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());

    lastEventSource!.onerror?.();
    expect(lastEventSource?.readyState).toBe(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockPost).toHaveBeenCalledTimes(2);

    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.onerror?.();
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  it("does not schedule another reconnect after max consecutive errors", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    mockTokens.access = "token";
    mockPost.mockResolvedValue({ ticket: "ticket" } as never);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());

    for (let i = 0; i < 4; i++) {
      lastEventSource!.onerror?.();
    }

    setTimeoutSpy.mockClear();
    lastEventSource!.onerror?.();
    expect(setTimeoutSpy).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });

  it("retries reconnect when refresh request fails with a network error", async () => {
    vi.useFakeTimers();
    mockTokens.access = "token";
    mockTokens.refresh = "refresh-token";
    mockPost.mockResolvedValue({ ticket: "ticket" } as never);

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "new-access", refresh_token: "new-refresh" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.onerror?.();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });

  it("refreshes token before reconnecting when refresh token exists", async () => {
    vi.useFakeTimers();
    mockTokens.access = "token";
    mockTokens.refresh = "refresh-token";
    mockPost.mockResolvedValue({ ticket: "ticket" } as never);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "new-access", refresh_token: "new-refresh" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.onerror?.();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockTokens.set).toHaveBeenCalledWith("new-access", "new-refresh");

    vi.unstubAllGlobals();
  });

  it("ignores malformed JSON event payloads", async () => {
    const handler = vi.fn();
    onSSEEvent("bad-json", handler);
    mockTokens.access = "token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());

    for (const fn of lastEventSource!.listeners["bad-json"] ?? []) {
      fn({ data: "not-json" } as MessageEvent);
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it("shows toast for built-in notification events", async () => {
    mockTokens.access = "token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    lastEventSource!.emit("notification", {
      message: "Hello from SSE",
      timestamp: "2026-01-01T00:00:00Z",
    });

    expect(mockToast.info).toHaveBeenCalledWith("Hello from SSE");
  });
});

describe("disconnectSSE", () => {
  it("can be called without prior connection", () => {
    expect(() => disconnectSSE()).not.toThrow();
  });

  it("can be called multiple times", () => {
    disconnectSSE();
    disconnectSSE();
  });

  it("allows reconnection after disconnect", async () => {
    installMockEventSource();
    mockTokens.access = "token";
    vi.clearAllMocks();

    mockPost.mockResolvedValueOnce({ ticket: "t1" } as never);
    await connectSSE();
    disconnectSSE();

    mockPost.mockResolvedValueOnce({ ticket: "t2" } as never);
    await connectSSE();
    expect(mockPost).toHaveBeenCalledTimes(2);

    disconnectSSE();
    restoreEventSource();
  });

  it("closes an active EventSource", async () => {
    installMockEventSource();
    mockTokens.access = "token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as never);

    await connectSSE();
    await vi.waitFor(() => expect(lastEventSource).not.toBeNull());
    disconnectSSE();
    expect(lastEventSource?.readyState).toBe(2);

    restoreEventSource();
  });
});
