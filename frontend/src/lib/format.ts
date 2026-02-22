/**
 * Shared formatting helpers used across pages.
 * Centralizes date and display formatting to prevent drift.
 */

/**
 * Format a date string as "Jan 5, 2026".
 * Handles ISO dates ("2026-01-05"), timestamps ("2026-01-05T12:00:00Z"),
 * and Postgres text casts ("2026-01-05 12:00:00+00").
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") || dateStr.includes(" ") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format a date string as "Jan 5" (no year).
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") || dateStr.includes(" ") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a date range as "Jan 5 – Jan 18".
 */
export function formatDateRange(start: string, end: string): string {
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

/**
 * Format a date string as "Jan 5 at 2:30 PM".
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") || dateStr.includes(" ") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
