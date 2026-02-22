import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatCurrency, formatRelativeTime, truncate } from "./utils";

describe("cn", () => {
  it("combines multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active")).toBe("base active");
    expect(cn("base", false && "active")).toBe("base");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", null, undefined, "bar")).toBe("foo bar");
  });

  it("handles arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("handles complex combinations", () => {
    const result = cn(
      "base",
      { active: true, disabled: false },
      ["extra", "classes"],
      true && "conditional"
    );
    expect(result).toBe("base active extra classes conditional");
  });
});

describe("formatCurrency", () => {
  it("formats cents to dollars", () => {
    expect(formatCurrency(1000)).toBe("$10.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats single cents", () => {
    expect(formatCurrency(1)).toBe("$0.01");
  });

  it("formats large amounts with commas", () => {
    expect(formatCurrency(1000000)).toBe("$10,000.00");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$5.00");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Just now' for recent times", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("returns minutes ago", () => {
    const fiveMinutesAgo = new Date("2024-01-15T11:55:00Z");
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
  });

  it("returns singular minute", () => {
    const oneMinuteAgo = new Date("2024-01-15T11:59:00Z");
    expect(formatRelativeTime(oneMinuteAgo)).toBe("1 minute ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date("2024-01-15T09:00:00Z");
    expect(formatRelativeTime(threeHoursAgo)).toBe("3 hours ago");
  });

  it("returns singular hour", () => {
    const oneHourAgo = new Date("2024-01-15T11:00:00Z");
    expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date("2024-01-13T12:00:00Z");
    expect(formatRelativeTime(twoDaysAgo)).toBe("2 days ago");
  });

  it("returns singular day", () => {
    const oneDayAgo = new Date("2024-01-14T12:00:00Z");
    expect(formatRelativeTime(oneDayAgo)).toBe("1 day ago");
  });

  it("handles string date input", () => {
    const result = formatRelativeTime("2024-01-15T11:00:00Z");
    expect(result).toBe("1 hour ago");
  });
});

describe("truncate", () => {
  it("returns original text if shorter than maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns original text if equal to maxLength", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates with ellipsis if longer than maxLength", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("handles very short maxLength", () => {
    expect(truncate("hello", 4)).toBe("h...");
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("handles exact ellipsis boundary", () => {
    expect(truncate("hello", 3)).toBe("...");
  });
});
