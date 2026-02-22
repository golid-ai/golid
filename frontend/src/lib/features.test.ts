import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./api", () => ({
  get: vi.fn(),
}));

import { loadFeatures, isEnabled } from "./features";
import { get } from "./api";

const mockedGet = vi.mocked(get);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isEnabled", () => {
  it("returns false for unknown flags by default", () => {
    expect(isEnabled("nonexistent")).toBe(false);
  });
});

describe("loadFeatures", () => {
  it("loads flags from API", async () => {
    mockedGet.mockResolvedValueOnce({ dark_mode: true, beta: false } as never);
    await loadFeatures();
    expect(mockedGet).toHaveBeenCalledWith("/features", { skipAuth: true });
  });

  it("does not throw when API fails", async () => {
    mockedGet.mockRejectedValueOnce(new Error("Network error"));
    await expect(loadFeatures()).resolves.toBeUndefined();
  });

  it("updates isEnabled after successful load", async () => {
    mockedGet.mockResolvedValueOnce({ new_feature: true, old_feature: false } as never);
    await loadFeatures();
    expect(isEnabled("new_feature")).toBe(true);
    expect(isEnabled("old_feature")).toBe(false);
    expect(isEnabled("missing")).toBe(false);
  });
});
