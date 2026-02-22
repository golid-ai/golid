import { describe, it, expect } from "vitest";
import { breakpoints } from "./use-breakpoint";

describe("breakpoints", () => {
  it("defines standard Tailwind breakpoints", () => {
    expect(breakpoints.sm).toBe(640);
    expect(breakpoints.md).toBe(768);
    expect(breakpoints.lg).toBe(1024);
    expect(breakpoints.xl).toBe(1280);
    expect(breakpoints["2xl"]).toBe(1536);
  });

  it("has all 5 breakpoint keys", () => {
    expect(Object.keys(breakpoints)).toEqual(["sm", "md", "lg", "xl", "2xl"]);
  });

  it("breakpoints are in ascending order", () => {
    const values = Object.values(breakpoints);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
