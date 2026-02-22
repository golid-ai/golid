import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "./toast";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("crypto", { randomUUID: () => "test-id-" + Math.random().toString(36).slice(2, 8) });
  // Clear any leftover toasts
  while (toast.toasts.length > 0) {
    toast.remove(toast.toasts[0].id);
  }
});

afterEach(() => {
  while (toast.toasts.length > 0) {
    toast.remove(toast.toasts[0].id);
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("toast.add", () => {
  it("adds a toast to the list", () => {
    toast.add("success", "It worked");
    expect(toast.toasts.length).toBe(1);
    expect(toast.toasts[0].type).toBe("success");
    expect(toast.toasts[0].message).toBe("It worked");
  });

  it("adds new toasts at the beginning", () => {
    toast.add("success", "First");
    toast.add("error", "Second");
    expect(toast.toasts[0].message).toBe("Second");
    expect(toast.toasts[1].message).toBe("First");
  });

  it("includes optional text", () => {
    toast.add("info", "Title", "Description text");
    expect(toast.toasts[0].text).toBe("Description text");
  });
});

describe("toast convenience methods", () => {
  it("success() creates success toast", () => {
    toast.success("Done");
    expect(toast.toasts[0].type).toBe("success");
  });

  it("error() creates error toast", () => {
    toast.error("Failed");
    expect(toast.toasts[0].type).toBe("error");
  });

  it("info() creates info toast", () => {
    toast.info("FYI");
    expect(toast.toasts[0].type).toBe("info");
  });

  it("warning() creates warning toast", () => {
    toast.warning("Watch out");
    expect(toast.toasts[0].type).toBe("warning");
  });
});

describe("toast.dismiss", () => {
  it("marks toast as exiting then removes after animation", () => {
    toast.add("success", "Going away");
    const id = toast.toasts[0].id;

    toast.dismiss(id);
    expect(toast.toasts[0].exiting).toBe(true);

    vi.advanceTimersByTime(400);
    expect(toast.toasts.length).toBe(0);
  });
});

describe("toast.remove", () => {
  it("removes toast immediately without animation", () => {
    toast.add("success", "Gone");
    const id = toast.toasts[0].id;

    toast.remove(id);
    expect(toast.toasts.length).toBe(0);
  });
});

describe("toast auto-dismiss", () => {
  it("auto-dismisses after 6 seconds", () => {
    toast.add("info", "Temporary");
    expect(toast.toasts.length).toBe(1);

    vi.advanceTimersByTime(6000);
    expect(toast.toasts[0]?.exiting).toBe(true);

    vi.advanceTimersByTime(400);
    expect(toast.toasts.length).toBe(0);
  });

  it("marks toast as entered after 400ms", () => {
    toast.add("info", "Entering");
    expect(toast.toasts[0].entered).toBe(false);

    vi.advanceTimersByTime(400);
    expect(toast.toasts[0].entered).toBe(true);
  });
});

describe("toast.subscribe", () => {
  it("is a reactive accessor", () => {
    expect(typeof toast.subscribe).toBe("function");
    expect(toast.subscribe()).toEqual([]);

    toast.add("info", "Test");
    expect(toast.subscribe().length).toBe(1);
  });
});
