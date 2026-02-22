import { describe, it, expect } from "vitest";
import { formatDate, formatShortDate, formatDateRange, formatDateTime } from "./format";

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-01-05");
    expect(result).toContain("Jan");
    expect(result).toContain("5");
    expect(result).toContain("2026");
  });

  it("formats timestamp with T separator", () => {
    const result = formatDate("2026-03-15T12:00:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("formats Postgres text cast with space separator", () => {
    const result = formatDate("2026-07-20 14:30:00+00");
    expect(result).toContain("Jul");
    expect(result).toContain("20");
    expect(result).toContain("2026");
  });

  it("returns empty string for empty input", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("formatShortDate", () => {
  it("formats date without year", () => {
    const result = formatShortDate("2026-01-05");
    expect(result).toContain("Jan");
    expect(result).toContain("5");
    expect(result).not.toContain("2026");
  });

  it("returns empty string for empty input", () => {
    expect(formatShortDate("")).toBe("");
  });

  it("handles ISO timestamp", () => {
    const result = formatShortDate("2026-12-25T12:00:00Z");
    expect(result).toContain("Dec");
    expect(result).toContain("25");
  });
});

describe("formatDateRange", () => {
  it("formats a date range with en-dash", () => {
    const result = formatDateRange("2026-01-05", "2026-01-18");
    expect(result).toContain("Jan");
    expect(result).toContain("–");
  });

  it("handles cross-month ranges", () => {
    const result = formatDateRange("2026-01-28", "2026-02-10");
    expect(result).toContain("Jan");
    expect(result).toContain("Feb");
  });
});

describe("formatDateTime", () => {
  it("formats date with time", () => {
    const result = formatDateTime("2026-01-05T14:30:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("at");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateTime("")).toBe("");
  });

  it("handles Postgres text cast", () => {
    const result = formatDateTime("2026-06-15 09:15:00+00");
    expect(result).toContain("Jun");
    expect(result).toContain("at");
  });
});
