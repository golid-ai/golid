import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { createChartTooltip } from "./chart-tooltip";

export interface TimelineGraphProps {
  data: Record<string, unknown>[]; x1: string; x2: string; y: string; fill?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
}

export const TimelineGraph: Component<TimelineGraphProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    return withTheme({ ...opts,
      x: { label: null, ...opts.x }, y: { label: null, ...opts.y },
      color: { domain: ["Active", "Completed"], range: ["#22d3ee", "#fbbf24"], ...opts.color },
      marks: [
        Plot.barX(props.data, { x1: props.x1, x2: props.x2, y: props.y, fill: props.fill || "status", rx: 4, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("rect").forEach((el: Element, i: number) => attachHover(el, props.data[index[i]], ctx));
            return g;
          },
        }),
        ...(_hovered ? [Plot.barX([_hovered], { x1: props.x1, x2: props.x2, y: props.y, fill: "hsl(var(--foreground))", stroke: "hsl(var(--foreground))", strokeWidth: 2, rx: 4, pointerEvents: "none" })] : []),
      ],
    });
  });

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle} icon={props.icon} caption={props.caption} class={props.class} />
      <Show when={!!hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[120px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.[props.fill ?? "status"] ?? "")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.[props.y] ?? "")}</div>
        </div>
      </Show>
    </div>
  );
};
