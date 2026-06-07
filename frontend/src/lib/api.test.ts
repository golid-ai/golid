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

  it("isAuthenticated returns true with access token", () => {
    tokens.set("access-123", "refresh-456");
    expect(tokens.isAuthenticated).toBe(true);
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

  it("handles HTML response without doctype as server unreachable", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      headers: new Headers({ "content-type": "text/html" }),
      text: async () => "<html><body>502</body></html>",
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

  it("omits body for GET requests", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    });

    const { get } = await import("./api");
    await get("/health", { skipAuth: true });

    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].method).toBe("GET");
    expect(callArgs[1].body).toBeUndefined();
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

  it("prefers ApiError over generic Error shape", () => {
    const err = { message: "Forbidden", code: "FORBIDDEN", status: 403 };
    expect(getErrorMessage(err, "fallback")).toBe("Forbidden");
  });
});

describe("401 token refresh", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    tokens.clear();
    vi.restoreAllMocks();
  });

  it("retries request after successful token refresh", async () => {
    tokens.set("expired-access", "valid-refresh");

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "new-access", refresh_token: "new-refresh" }),
        headers: new Headers({ "content-type": "application/json" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "1" }),
        headers: new Headers({ "content-type": "application/json" }),
      });

    const { api } = await import("./api");
    const result = await api<{ id: string }>("/me");

    expect(result.id).toBe("1");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    expect(tokens.access).toBe("new-access");
  });

  it("returns false when refresh network throws", async () => {
    tokens.set("expired-access", "valid-refresh");

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers(),
      })
      .mockRejectedValueOnce(new Error("network down"));

    const { api } = await import("./api");
    await expect(api("/me")).rejects.toBeDefined();
    expect(tokens.access).toBeNull();
  });

  it("clears tokens and dispatches session-expired when refresh fails", async () => {
    tokens.set("expired-access", "invalid-refresh");
    const sessionExpired = vi.fn();
    window.addEventListener("auth:session-expired", sessionExpired);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers(),
        text: async () => "",
      });

    const { api } = await import("./api");
    await expect(api("/me")).rejects.toBeDefined();
    expect(tokens.access).toBeNull();
    expect(sessionExpired).toHaveBeenCalled();

    window.removeEventListener("auth:session-expired", sessionExpired);
  });

  it("skips refresh retry when already retried", async () => {
    tokens.set("expired-access", "valid-refresh");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers(),
      text: async () => '{"message":"Unauthorized","code":"UNAUTHORIZED"}',
    });

    const { api } = await import("./api");
    await expect(api("/me", { _retried: true })).rejects.toBeDefined();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("clears tokens on 401 without refresh token", async () => {
    localStorageMock.clear();
    localStorageMock.setItem("golid_access_token", "expired-access");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers(),
      text: async () => "",
    });

    const { api } = await import("./api");
    await expect(api("/me")).rejects.toBeDefined();
    expect(tokens.access).toBeNull();
  });
});

describe("parseError edge cases", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses data.error when message is absent", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '{"error":"Invalid payload"}',
    });

    const { api } = await import("./api");
    try {
      await api("/test", { skipAuth: true });
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as { message: string };
      expect(e.message).toBe("Invalid payload");
    }
  });

  it("uses server_unreachable when parse throws and statusText is empty", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 0,
      statusText: "",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => {
        throw new Error("read failed");
      },
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

  it("keeps statusText when JSON content-type has empty body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => "",
    });

    const { api } = await import("./api");
    try {
      await api("/test", { skipAuth: true });
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as { message: string };
      expect(e.message).toContain("Internal Server Error");
    }
  });
});
