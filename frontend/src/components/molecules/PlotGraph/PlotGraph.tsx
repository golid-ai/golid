import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  type Component,
  type JSX,
} from "solid-js";
import * as Plot from "@observablehq/plot";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface PlotGraphProps {
  /** Observable Plot options (marks, scales, etc.) */
  options: Plot.PlotOptions;
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Material icon name */
  icon?: string;
  /** Caption text */
  caption?: string;
  /** Legend JSX element */
  legend?: JSX.Element;
  /** Additional class */
  class?: string;
}

// ============================================================================
// COMPONENT
// Responsive wrapper for Observable Plot. Mounts SVG to a div,
// re-renders on options or size change. Same vanilla JS mount
// pattern as AG Grid.
// ============================================================================

export const PlotGraph: Component<PlotGraphProps> = (props) => {
  const [containerWidth, setContainerWidth] = createSignal(0);
  const [containerHeight, setContainerHeight] = createSignal(0);
  const [isMeasured, setIsMeasured] = createSignal(false);

  let measureRef: HTMLDivElement | undefined;
  let renderRef: HTMLDivElement | undefined;
  let mounted = false;

  // 1. Monitor available space
  onMount(() => {
    mounted = true;

    if (!measureRef) return;
    let rafId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      // Debounce via rAF to avoid "ResizeObserver loop" warnings
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width);
          const h = Math.round(entry.contentRect.height);
          if (w > 0 && h > 0) {
            if (Math.abs(containerWidth() - w) > 1 || Math.abs(containerHeight() - h) > 1) {
              setContainerWidth(w);
              setContainerHeight(h);
              setIsMeasured(true);
            }
          }
        }
        rafId = null;
      });
    });
    observer.observe(measureRef);
    onCleanup(() => { observer.disconnect(); if (rafId) cancelAnimationFrame(rafId); });
  });

  // 2. Render Plot when options or dimensions change
  createEffect(() => {
    if (typeof window === "undefined" || !renderRef || !isMeasured() || !mounted) return;

    const plotOptions: Plot.PlotOptions = {
      margin: 0,
      ...props.options,
      width: containerWidth(),
      height: Math.max(containerHeight(), 200),
      style: {
        background: "transparent",
        fontFamily: "Montserrat, sans-serif",
        ...(props.options.style as Record<string, string> | undefined),
      },
    };

    const container = renderRef;
    container.innerHTML = "";
    const plot = Plot.plot(plotOptions);
    container.appendChild(plot);
  });

  return (
    <figure class={cn("relative group flex flex-col overflow-visible h-full", props.class)}>
      {/* Header */}
      <Show when={props.title || props.icon || props.legend}>
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <Show when={props.title || props.icon}>
            <div class="flex items-center gap-3">
              <Show when={props.icon}>
                <div class="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 flex items-center justify-center shadow-lg shrink-0">
                  <Icon name={props.icon!} size={18} class="text-foreground/70" />
                </div>
              </Show>
              <div class="min-w-0">
                <Show when={props.title}>
                  <h4 class="text-xs font-bold text-foreground/90 uppercase tracking-wider truncate">
                    {props.title}
                  </h4>
                </Show>
                <Show when={props.subtitle}>
                  <span class="text-[10px] text-muted-foreground font-medium block leading-tight truncate">
                    {props.subtitle}
                  </span>
                </Show>
              </div>
            </div>
          </Show>

          <Show when={props.legend}>
            <div class="flex flex-wrap gap-2 sm:justify-end">
              {props.legend}
            </div>
          </Show>
        </div>
      </Show>

      {/* Render Surface */}
      <div class="w-full flex-grow mb-4 relative min-h-[240px]" ref={measureRef}>
        <div
          ref={renderRef}
          class={cn(
            "golid-plot-graph absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500",
            isMeasured() ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Caption */}
      <Show when={props.caption}>
        <figcaption class="mt-auto text-xs text-muted-foreground italic text-center w-full pb-2">
          {props.caption}
        </figcaption>
      </Show>
    </figure>
  );
};

export default PlotGraph;
