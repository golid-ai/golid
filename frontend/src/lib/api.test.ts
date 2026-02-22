import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage before importing api module
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  length: 0,
  key: () => null,
};
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

import { tokens, isApiError, getErrorMessage } from "./api";

describe("tokens", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("returns null when no tokens stored", () => {
    expect(tokens.access).toBeNull();
    expect(tokens.refresh).toBeNull();
  });

  it("stores and retrieves tokens", () => {
    tokens.set("access-123", "refresh-456");
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
  });

  it("clears tokens", () => {
    tokens.set("access-123", "refresh-456");
    tokens.clear();
    expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
  });

  it("isAuthenticated returns false without token", () => {
    expect(tokens.isAuthenticated).toBe(false);
  });
});

describe("isApiError", () => {
  it("returns true for ApiError-shaped objects", () => {
    const err = { message: "bad", code: "BAD_REQUEST", status: 400 };
    expect(isApiError(err)).toBe(true);
  });

  it("returns false for regular Error", () => {
    expect(isApiError(new Error("oops"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isApiError(null)).toBe(false);
  });

  it("returns false for string", () => {
    expect(isApiError("error")).toBe(false);
  });

  it("returns false for object without status", () => {
    expect(isApiError({ message: "hi" })).toBe(false);
  });
});

describe("parseError behavior", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("handles HTML response body as server unreachable", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      headers: new Headers({ "content-type": "text/html" }),
      text: async () => "<!DOCTYPE html><html><body>502</body></html>",
    });

    const { api } = await import("./api");
    try {
      await api("/test", { skipAuth: true });
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as { message: string; code: string };
      expect(e.message).toBe("Unable to reach the server. Please try again later.");
      expect(e.code).toBe("server_unreachable");
    }
  });

  it("handles empty JSON error body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '{"message":"Something broke","code":"INTERNAL"}',
    });

    const { api } = await import("./api");
    try {
      await api("/test", { skipAuth: true });
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as { message: string; code: string };
      expect(e.message).toBe("Something broke");
      expect(e.code).toBe("INTERNAL");
    }
  });

  it("falls back to statusText for non-JSON non-HTML errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({ "content-type": "text/plain" }),
      text: async () => "maintenance mode",
    });

    const { api } = await import("./api");
    try {
      await api("/test", { skipAuth: true });
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as { message: string };
      expect(e.message).toContain("Service Unavailable");
    }
  });
});

describe("api function", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    tokens.clear();
  });

  it("handles 204 No Content response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const { api } = await import("./api");
    const result = await api("/test", { skipAuth: true });
    expect(result).toBeUndefined();
  });

  it("adds Authorization header when tokens exist", async () => {
    tokens.set("my-access-token", "my-refresh-token");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: "ok" }),
      headers: new Headers(),
    });

    const { api } = await import("./api");
    await api("/test");

    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].headers["Authorization"]).toBe("Bearer my-access-token");
  });

  it("skips Authorization header with skipAuth", async () => {
    tokens.set("my-access-token", "my-refresh-token");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: "ok" }),
      headers: new Headers(),
    });

    const { api } = await import("./api");
    await api("/test", { skipAuth: true });

    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].headers["Authorization"]).toBeUndefined();
  });

  it("sends JSON body for POST requests", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
      headers: new Headers(),
    });

    const { post } = await import("./api");
    await post("/items", { name: "test" }, { skipAuth: true });

    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].body).toBe('{"name":"test"}');
  });
});

describe("getErrorMessage", () => {
  it("extracts message from ApiError", () => {
    const err = { message: "Not found", code: "NOT_FOUND", status: 404 };
    expect(getErrorMessage(err)).toBe("Not found");
  });

  it("extracts message from Error", () => {
    expect(getErrorMessage(new Error("broken"))).toBe("broken");
  });

  it("returns fallback for unknown types", () => {
    expect(getErrorMessage(42)).toBe("Something went wrong");
  });

  it("returns custom fallback", () => {
    expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });
});
