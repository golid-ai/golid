import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { snackbar } from "./snackbar";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("crypto", { randomUUID: () => "snack-id-" + Math.random().toString(36).slice(2, 8) });
  while (snackbar.snackbars.length > 0) {
    snackbar.remove(snackbar.snackbars[0].id);
  }
});

afterEach(() => {
  while (snackbar.snackbars.length > 0) {
    snackbar.remove(snackbar.snackbars[0].id);
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("snackbar.show", () => {
  it("adds a snackbar to the list", () => {
    snackbar.show("Action completed");
    expect(snackbar.snackbars.length).toBe(1);
    expect(snackbar.snackbars[0].message).toBe("Action completed");
  });

  it("appends new snackbars at the end", () => {
    snackbar.show("First");
    snackbar.show("Second");
    expect(snackbar.snackbars[0].message).toBe("First");
    expect(snackbar.snackbars[1].message).toBe("Second");
  });

  it("accepts action label and callback", () => {
    const onAction = vi.fn();
    snackbar.show("Undo?", { actionLabel: "Undo", onAction });
    expect(snackbar.snackbars[0].actionLabel).toBe("Undo");
    expect(snackbar.snackbars[0].onAction).toBe(onAction);
  });

  it("defaults duration to 5000ms", () => {
    snackbar.show("Default duration");
    expect(snackbar.snackbars[0].duration).toBe(5000);
  });

  it("respects custom duration", () => {
    snackbar.show("Custom", { duration: 10000 });
    expect(snackbar.snackbars[0].duration).toBe(10000);
  });
});

describe("snackbar.notify", () => {
  it("creates a snackbar via convenience method", () => {
    const onAction = vi.fn();
    snackbar.notify("Deleted", "Undo", onAction);
    expect(snackbar.snackbars[0].message).toBe("Deleted");
    expect(snackbar.snackbars[0].actionLabel).toBe("Undo");
  });
});

describe("snackbar.dismiss", () => {
  it("marks snackbar as exiting then removes after animation", () => {
    snackbar.show("Going away");
    const id = snackbar.snackbars[0].id;

    snackbar.dismiss(id);
    expect(snackbar.snackbars[0].exiting).toBe(true);

    vi.advanceTimersByTime(400);
    expect(snackbar.snackbars.length).toBe(0);
  });
});

describe("snackbar.remove", () => {
  it("removes snackbar immediately", () => {
    snackbar.show("Gone");
    const id = snackbar.snackbars[0].id;

    snackbar.remove(id);
    expect(snackbar.snackbars.length).toBe(0);
  });
});

describe("snackbar auto-dismiss", () => {
  it("auto-dismisses after default 5 seconds", () => {
    snackbar.show("Temporary");
    expect(snackbar.snackbars.length).toBe(1);

    vi.advanceTimersByTime(5000);
    expect(snackbar.snackbars[0]?.exiting).toBe(true);

    vi.advanceTimersByTime(400);
    expect(snackbar.snackbars.length).toBe(0);
  });

  it("marks snackbar as entered after 400ms", () => {
    snackbar.show("Entering");
    expect(snackbar.snackbars[0].entered).toBe(false);

    vi.advanceTimersByTime(400);
    expect(snackbar.snackbars[0].entered).toBe(true);
  });

  it("does not auto-dismiss with duration 0", () => {
    snackbar.show("Sticky", { duration: 0 });
    vi.advanceTimersByTime(60000);
    expect(snackbar.snackbars.length).toBe(1);
  });
});

describe("snackbar.subscribe", () => {
  it("is a reactive accessor", () => {
    expect(typeof snackbar.subscribe).toBe("function");
    expect(snackbar.subscribe()).toEqual([]);
  });
});
