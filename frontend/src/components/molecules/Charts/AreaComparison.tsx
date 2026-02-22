import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { Chip } from "~/components/atoms/Chip";
import { createChartTooltip } from "./chart-tooltip";

export interface AreaComparisonProps {
  data: Record<string, unknown>[]; x: string; y1: string; y2: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
}

export const AreaComparison: Component<AreaComparisonProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    return withTheme({ ...opts,
      x: { label: null, ...opts.x }, y: { grid: true, label: null, ...opts.y },
      marks: [
        Plot.areaY(props.data, { x: props.x, y1: props.y1, y2: props.y2, fill: (d: Record<string, unknown>) => (d[props.y1] as number) >= (d[props.y2] as number) ? "#34d399" : "#f472b6", fillOpacity: 0.2, curve: "catmull-rom" }),
        Plot.lineY(props.data, { x: props.x, y: props.y1, stroke: "#34d399", strokeWidth: 2, curve: "catmull-rom" }),
        Plot.lineY(props.data, { x: props.x, y: props.y2, stroke: "#f472b6", strokeWidth: 2, curve: "catmull-rom" }),
        Plot.dot(props.data, { x: props.x, y: props.y1, fill: "#34d399", r: 3, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, { ...props.data[index[i]], _series: "supply" }, ctx));
            return g;
          },
        }),
        Plot.dot(props.data, { x: props.x, y: props.y2, fill: "#f472b6", r: 3, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, { ...props.data[index[i]], _series: "demand" }, ctx));
            return g;
          },
        }),
        ...(_hovered ? [Plot.dot([_hovered], { x: props.x, y: _hovered._series === "supply" ? props.y1 : props.y2, fill: "hsl(var(--foreground))", r: 6, strokeWidth: 2, stroke: "hsl(var(--foreground))", pointerEvents: "none" })] : []),
      ],
    });
  });

  const legend = () => (
    <div class="flex gap-2">
      <Chip variant="neutral" size="xs" class="font-mono text-[9px] uppercase tracking-widest border-0" style={{ "background-color": "#34d39915", color: "#34d399" }}>Supply</Chip>
      <Chip variant="neutral" size="xs" class="font-mono text-[9px] uppercase tracking-widest border-0" style={{ "background-color": "#f472b615", color: "#f472b6" }}>Demand</Chip>
    </div>
  );

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle} icon={props.icon} caption={props.caption} legend={legend()} class={props.class} />
      <Show when={hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[120px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{hoveredData()?._series === "supply" ? "Supply" : "Demand"}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{hoveredData()?._series === "supply" ? (hoveredData()?.[props.y1] as number)?.toFixed(1) : (hoveredData()?.[props.y2] as number)?.toFixed(1)}</div>
        </div>
      </Show>
    </div>
  );
};
