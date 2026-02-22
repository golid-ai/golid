import { type Component, createMemo, createSignal, Show, createEffect } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";

export interface TreeGraphProps {
  data: Record<string, unknown>[];
  path: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  caption?: string;
  options?: Plot.PlotOptions;
  class?: string;
}

export const TreeGraph: Component<TreeGraphProps> = (props) => {
  const [hoveredLabel, setHoveredLabel] = createSignal<string | null>(null);
  const [tooltipPos, setTooltipPos] = createSignal({ x: 0, y: 0 });
  let containerRef: HTMLDivElement | undefined;

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    return withTheme({
      marginRight: 120,
      marginLeft: 40,
      marginBottom: 30,
      ...opts,
      axis: null,
      marks: [
        Plot.tree(props.data, {
          path: props.path,
          dot: true,
          stroke: "#0891b2",
          strokeWidth: 1.5,
          strokeOpacity: 0.6,
          fill: "#0891b2",
          r: 3,
          textStroke: "var(--background)",
          fontSize: 11,
          fontWeight: 600,
        }),
      ],
    });
  });

  // Post-render: attach hover to SVG circles
  createEffect(() => {
    // Track options to re-run when chart re-renders
    mergedOptions();

    if (!containerRef) return;
    // Wait for PlotGraph to render
    requestAnimationFrame(() => {
      const circles = containerRef!.querySelectorAll("circle");
      const texts = containerRef!.querySelectorAll("text");

      circles.forEach((circle, i) => {
        (circle as unknown as HTMLElement).style.cursor = "pointer";

        circle.addEventListener("mouseenter", (e: Event) => {
          const me = e as MouseEvent;
          // Find nearest text label
          const nearestText = texts[i]?.textContent || `Node ${i}`;
          setHoveredLabel(nearestText);
          const rect = containerRef!.getBoundingClientRect();
          setTooltipPos({ x: me.clientX - rect.left, y: me.clientY - rect.top });

          // Visual feedback
          circle.setAttribute("r", "5");
          circle.setAttribute("fill", "hsl(var(--foreground))");
        });

        circle.addEventListener("mousemove", (e: Event) => {
          const me = e as MouseEvent;
          const rect = containerRef!.getBoundingClientRect();
          setTooltipPos({ x: me.clientX - rect.left, y: me.clientY - rect.top });
        });

        circle.addEventListener("mouseleave", () => {
          setHoveredLabel(null);
          circle.setAttribute("r", "3");
          circle.setAttribute("fill", "#0891b2");
        });
      });
    });
  });

  return (
    <div class="relative group w-full h-full" ref={containerRef}>
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle}
        icon={props.icon} caption={props.caption} class={props.class} />
      <Show when={hoveredLabel()}>
        <div role="tooltip" class="absolute pointer-events-none z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[80px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">Node</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{hoveredLabel()}</div>
        </div>
      </Show>
    </div>
  );
};
