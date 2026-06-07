import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildReloadParam,
  chunkReloadStorageKey,
  clearBuildReloadMarker,
  isChunkLoadError,
  reloadOnceForChunkError,
  reloadWithFreshBuild,
} from "./chunk-recovery";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const replaceSpy = vi.fn();
const historyReplaceSpy = vi.fn();
let sessionStorageMock: ReturnType<typeof storage>;
let target: {
  location: { href: string; replace: (url: string) => void };
  history: { replaceState: (data: unknown, unused: string, url?: string | URL | null) => void };
  sessionStorage: ReturnType<typeof storage>;
};

function mockTarget(url = "https://golid.ai/settings") {
  replaceSpy.mockClear();
  historyReplaceSpy.mockClear();
  sessionStorageMock = storage();
  target = {
    location: { href: url, replace: replaceSpy },
    history: { replaceState: historyReplaceSpy },
    sessionStorage: sessionStorageMock,
  };
}

describe("chunk recovery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T00:00:00Z"));
    mockTarget();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("recognizes common dynamic import and preload failures", () => {
    expect(isChunkLoadError(new Error("Failed to fetch dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed"))).toBe(true);
    expect(isChunkLoadError("error loading dynamically imported module")).toBe(true);
    expect(isChunkLoadError(new Error("NetworkError when attempting to fetch resource"))).toBe(true);
    expect(isChunkLoadError(new Error("Unable to preload CSS for /_build/assets/app.css"))).toBe(true);
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("cache-busts the current URL when reloading for a fresh build", () => {
    vi.setSystemTime(new Date("2026-05-21T00:00:12Z"));

    reloadWithFreshBuild(target);

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy.mock.calls[0][0]).toBe("https://golid.ai/settings?__build_reload=1779321612000");
  });

  it("blocks automatic reload loops within the cooldown", () => {
    vi.setSystemTime(new Date("2026-05-21T00:00:00Z"));

    reloadOnceForChunkError(target);
    reloadOnceForChunkError(target);

    expect(sessionStorageMock.getItem(chunkReloadStorageKey)).toBe("1779321600000");
    expect(replaceSpy).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-05-21T00:05:01Z"));
    reloadOnceForChunkError(target);

    expect(replaceSpy).toHaveBeenCalledTimes(2);
  });

  it("removes the build reload marker after successful boot", () => {
    mockTarget("https://golid.ai/settings?tab=profile&__build_reload=1779321600000");
    sessionStorageMock.setItem(chunkReloadStorageKey, "1779321600000");

    clearBuildReloadMarker(target);

    expect(historyReplaceSpy).toHaveBeenCalledWith({}, "", "https://golid.ai/settings?tab=profile");
    expect(sessionStorageMock.getItem(chunkReloadStorageKey)).toBeNull();
    expect(new URL(historyReplaceSpy.mock.calls[0][2] as string).searchParams.has(buildReloadParam)).toBe(false);
  });
});
