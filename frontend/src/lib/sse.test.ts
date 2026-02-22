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

const mockPost = vi.mocked(post);
const mockTokens = tokens as any;

class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners: Record<string, ((e: any) => void)[]> = {};
  readyState = 1;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.onopen?.(), 0);
  }

  addEventListener(name: string, fn: (e: any) => void) {
    if (!this.listeners[name]) this.listeners[name] = [];
    this.listeners[name].push(fn);
  }

  close() {
    this.readyState = 2;
  }
}

describe("onSSEEvent", () => {
  beforeEach(() => {
    disconnectSSE();
    vi.clearAllMocks();
  });

  it("registers a handler and returns unsubscribe function", () => {
    const handler = () => {};
    const unsub = onSSEEvent("evt1", handler);
    expect(typeof unsub).toBe("function");
  });

  it("unsubscribe removes the handler", () => {
    let called = false;
    const unsub = onSSEEvent("evt2", () => { called = true; });
    unsub();
    expect(called).toBe(false);
  });

  it("supports multiple handlers for same event", () => {
    let count = 0;
    onSSEEvent("evt3", () => { count++; });
    onSSEEvent("evt3", () => { count++; });
    expect(count).toBe(0);
  });

  it("unsubscribing one handler doesn't affect others", () => {
    const unsub1 = onSSEEvent("evt4", () => {});
    onSSEEvent("evt4", () => {});
    unsub1();
  });
});

describe("connectSSE", () => {
  let savedEventSource: any;

  beforeEach(() => {
    disconnectSSE();
    vi.clearAllMocks();
    savedEventSource = (globalThis as any).EventSource;
    (globalThis as any).EventSource = MockEventSource;
    mockTokens.access = "";
    mockTokens.refresh = "";
  });

  afterEach(() => {
    disconnectSSE();
    (globalThis as any).EventSource = savedEventSource;
  });

  it("skips connection when no access token", async () => {
    mockTokens.access = "";
    await connectSSE();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("requests ticket and creates EventSource when token exists", async () => {
    mockTokens.access = "test-access-token";
    mockPost.mockResolvedValueOnce({ ticket: "one-time-ticket" } as any);
    await connectSSE();
    expect(mockPost).toHaveBeenCalledWith("/events/ticket");
  });

  it("skips duplicate connection", async () => {
    mockTokens.access = "test-access-token";
    mockPost.mockResolvedValue({ ticket: "ticket" } as any);
    await connectSSE();
    await connectSSE();
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("registers existing handlers on new connection", async () => {
    onSSEEvent("pre-registered", () => {});
    mockTokens.access = "test-access-token";
    mockPost.mockResolvedValueOnce({ ticket: "ticket" } as any);
    await connectSSE();
    expect(mockPost).toHaveBeenCalled();
  });

  it("schedules reconnect on ticket fetch failure", async () => {
    mockTokens.access = "test-access-token";
    mockPost.mockRejectedValueOnce(new Error("network error"));
    await connectSSE();
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
    const savedES = (globalThis as any).EventSource;
    (globalThis as any).EventSource = MockEventSource;
    mockTokens.access = "token";
    vi.clearAllMocks();

    mockPost.mockResolvedValueOnce({ ticket: "t1" } as any);
    await connectSSE();
    disconnectSSE();

    mockPost.mockResolvedValueOnce({ ticket: "t2" } as any);
    await connectSSE();
    expect(mockPost).toHaveBeenCalledTimes(2);

    disconnectSSE();
    (globalThis as any).EventSource = savedES;
  });
});
