/**
 * Shared utilities for component showcase
 */

// Re-export cn from the main utils
export { cn } from "~/lib/utils";

/**
 * Convert RGB color string to hex (for color detection)
 */
export function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb.includes("rgba(0, 0, 0, 0)")) return "";
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/);
  if (!match) return "";
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
