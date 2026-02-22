import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ui } from "./ui";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  vi.spyOn(window.localStorage, "getItem").mockImplementation((key: string) => mockStorage[key] ?? null);
  vi.spyOn(window.localStorage, "setItem").mockImplementation((key: string, value: string) => {
    mockStorage[key] = value;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ui.setLoading", () => {
  it("sets loading state and message", () => {
    ui.setLoading(true, "Loading data...");
    expect(ui.isLoading).toBe(true);
    expect(ui.loadingMessage).toBe("Loading data...");
  });

  it("clears loading state", () => {
    ui.setLoading(true, "Working...");
    ui.setLoading(false);
    expect(ui.isLoading).toBe(false);
    expect(ui.loadingMessage).toBe("");
  });

  it("defaults message to empty string", () => {
    ui.setLoading(true);
    expect(ui.loadingMessage).toBe("");
  });
});

describe("ui.toggleTheme", () => {
  it("toggles dark class on documentElement", () => {
    const classList = document.documentElement.classList;
    const wasDark = classList.contains("dark");

    ui.toggleTheme();
    expect(classList.contains("dark")).toBe(!wasDark);
    expect(mockStorage["theme"]).toBe(!wasDark ? "dark" : "light");

    ui.toggleTheme();
    expect(classList.contains("dark")).toBe(wasDark);
  });
});

describe("ui.setTheme", () => {
  it("sets dark theme", () => {
    ui.setTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(mockStorage["theme"]).toBe("dark");
  });

  it("sets light theme", () => {
    ui.setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(mockStorage["theme"]).toBe("light");
  });
});

describe("ui.sidebar", () => {
  it("toggles sidebar collapsed state", () => {
    const initial = ui.sidebarCollapsed;
    ui.toggleSidebar();
    expect(ui.sidebarCollapsed).toBe(!initial);
  });

  it("persists sidebar state to localStorage", () => {
    ui.setSidebarCollapsed(false);
    expect(mockStorage["sidebarCollapsed"]).toBe("false");

    ui.setSidebarCollapsed(true);
    expect(mockStorage["sidebarCollapsed"]).toBe("true");
  });
});

describe("ui.mobile", () => {
  it("sets mobile state", () => {
    ui.setIsMobile(true);
    expect(ui.isMobile).toBe(true);

    ui.setIsMobile(false);
    expect(ui.isMobile).toBe(false);
  });

  it("auto-collapses sidebar when entering mobile", () => {
    ui.setSidebarCollapsed(false);
    ui.setIsMobile(true);
    expect(ui.sidebarCollapsed).toBe(true);
  });
});

describe("ui.subscribe accessors", () => {
  it("exposes reactive loading signal", () => {
    expect(typeof ui.subscribeLoading).toBe("function");
  });

  it("exposes reactive sidebar signal", () => {
    expect(typeof ui.subscribeSidebar).toBe("function");
  });

  it("exposes reactive mobile signal", () => {
    expect(typeof ui.subscribeMobile).toBe("function");
  });
});
