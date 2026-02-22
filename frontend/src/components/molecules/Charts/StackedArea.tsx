import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { Chip } from "~/components/atoms/Chip";
import { createChartTooltip } from "./chart-tooltip";

export interface StackedAreaProps {
  data: Record<string, unknown>[]; x: string; y: string; z?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
  stages?: string[]; stageColors?: string[]; valueLabel?: string;
}

export const StackedArea: Component<StackedAreaProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    return withTheme({ ...opts,
      x: { label: null, ...opts.x }, y: { grid: true, label: null, ...opts.y },
      color: { domain: props.stages ?? ["Stage 1", "Stage 2", "Stage 3", "Stage 4"], range: props.stageColors ?? ["#22d3ee", "#f472b6", "#fbbf24", "#34d399"], ...opts.color },
      marks: [
        Plot.areaY(props.data, { x: props.x, y: props.y, fill: props.z || "stage", curve: "catmull-rom", fillOpacity: 0.6, tip: false }),
        // Invisible dots for hover hit targets
        Plot.dot(props.data, { x: props.x, y: props.y, r: 4, fill: "transparent", stroke: "transparent", tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, props.data[index[i]], ctx));
            return g;
          },
        }),
        // Highlight overlay
        ...(_hovered ? [Plot.dot([_hovered], { x: props.x, y: props.y, fill: "hsl(var(--foreground))", stroke: "hsl(var(--foreground))", r: 6, strokeWidth: 2, pointerEvents: "none" })] : []),
      ],
    });
  });

  const legend = createMemo(() => {
    const colors = props.stageColors ?? ["#22d3ee", "#f472b6", "#fbbf24", "#34d399"];
    const labels = props.stages ?? ["Stage 1", "Stage 2", "Stage 3", "Stage 4"];
    return <div class="flex flex-wrap gap-2">{labels.map((item, i) => (
      <Chip variant="neutral" size="xs" class="font-mono text-[9px] uppercase tracking-widest border-0" style={{ "background-color": `${colors[i]}15`, color: colors[i] }}>{item}</Chip>
    ))}</div>;
  });

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle} icon={props.icon} caption={props.caption} legend={legend()} class={props.class} />
      <Show when={hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[120px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.[props.z ?? "stage"] ?? "")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.[props.y] ?? "")} {props.valueLabel ?? "count"}</div>
        </div>
      </Show>
    </div>
  );
};
