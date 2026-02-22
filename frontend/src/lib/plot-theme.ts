import type { PlotOptions } from "@observablehq/plot";

/**
 * Shared Industrial Design Constants for Observable Plot
 */
export const PLOT_THEME = {
  fontFamily: "Montserrat, sans-serif",
  monoFont: "JetBrains Mono, monospace",
  colors: {
    accent: "#22d3ee",   // Cyan-400
    success: "#34d399",  // Emerald-400
    warning: "#fbbf24",  // Amber-400
    danger: "#f472b6",   // Pink-400
    indigo: "#a78bfa",   // Violet-400
    background: "#020617", // Slate-950
    muted: "rgba(255,255,255,0.5)",
  },
  margins: {
    left: 55,
    right: 20,
    top: 10,
    bottom: 30,
  },
};

/**
 * Merges standard Golid defaults with provided Plot options
 */
export function withTheme(options: PlotOptions): PlotOptions {
  return {
    marginLeft: PLOT_THEME.margins.left,
    marginRight: PLOT_THEME.margins.right,
    marginTop: PLOT_THEME.margins.top,
    marginBottom: PLOT_THEME.margins.bottom,
    style: {
      background: "transparent",
      fontFamily: PLOT_THEME.fontFamily,
      ...(options.style as Record<string, string> | undefined),
    },
    ...options,
  };
}
