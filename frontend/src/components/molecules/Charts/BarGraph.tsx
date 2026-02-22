import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { Chip } from "~/components/atoms/Chip";
import { createChartTooltip } from "./chart-tooltip";

export interface BarGraphProps {
  data: Record<string, unknown>[]; x: string; y: string; color?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
}

export const BarGraph: Component<BarGraphProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    return withTheme({ ...opts,
      x: { label: null, padding: 0.3, axis: null, type: "band", ...opts.x },
      y: { grid: true, label: null, ...opts.y },
      color: { ...(opts.color ?? {}) },
      marks: [
        Plot.barY(props.data, { x: props.x, y: props.y, fill: props.color || "currentColor", rx: 4, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("rect").forEach((el: Element, i: number) => attachHover(el, props.data[index[i]], ctx));
            return g;
          },
        }),
        Plot.ruleY([0]),
        ...(_hovered ? [Plot.barY([_hovered], { x: props.x, y: props.y, fill: "hsl(var(--foreground))", stroke: "hsl(var(--foreground))", strokeWidth: 2, rx: 4, pointerEvents: "none" })] : []),
      ],
    });
  });

  const legend = createMemo(() => {
    const c = (props.options?.color ?? {}) as Record<string, unknown>;
    if (!c?.domain || !c?.range) return undefined;
    const range = c.range as string[];
    return <div class="flex flex-wrap gap-2">{(c.domain as string[]).map((item: string, i: number) => (
      <Chip variant="neutral" size="xs" class="font-mono text-[9px] uppercase tracking-widest border-0" style={{ "background-color": `${range[i]}15`, color: range[i] }}>{item}</Chip>
    ))}</div>;
  });

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle} icon={props.icon} caption={props.caption} legend={legend()} class={props.class} />
      <Show when={hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[120px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.[props.x] ?? "Details")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.[props.y] ?? "")}</div>
        </div>
      </Show>
    </div>
  );
};

export default BarGraph;
