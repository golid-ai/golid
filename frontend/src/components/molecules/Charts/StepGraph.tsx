import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { createChartTooltip } from "./chart-tooltip";

export interface StepGraphProps {
  data: Record<string, unknown>[]; x: string; y: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
}

export const StepGraph: Component<StepGraphProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    return withTheme({ ...opts,
      x: { label: null, ...opts.x }, y: { grid: true, label: null, ...opts.y },
      marks: [
        Plot.areaY(props.data, { x: props.x, y: props.y, curve: "step", fill: "#22d3ee", fillOpacity: 0.1, stroke: "#22d3ee", strokeWidth: 1.5, tip: false }),
        Plot.dot(props.data, { x: props.x, y: props.y, fill: "#22d3ee", r: 3, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, props.data[index[i]], ctx));
            return g;
          },
        }),
        ...(_hovered ? [Plot.dot([_hovered], { x: props.x, y: props.y, fill: "hsl(var(--foreground))", stroke: "hsl(var(--foreground))", r: 6, strokeWidth: 2, pointerEvents: "none" })] : []),
      ],
    });
  });

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle} icon={props.icon} caption={props.caption} class={props.class} />
      <Show when={hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[100px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">Day {String(hoveredData()?.[props.x] ?? "")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.[props.y] ?? "")} Load</div>
        </div>
      </Show>
    </div>
  );
};
