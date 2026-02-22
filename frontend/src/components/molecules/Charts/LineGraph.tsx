import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { Chip } from "~/components/atoms/Chip";
import { createChartTooltip } from "./chart-tooltip";

export interface LineGraphProps {
  data: Record<string, unknown>[]; x: string; y: string; stroke?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Omit<Plot.PlotOptions, "marks"> & { marks?: Record<string, unknown>[] }; class?: string;
}

export const LineGraph: Component<LineGraphProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    const extraMarks = (opts as Record<string, unknown>).marks ?? [];

    const processedExtraMarks = (extraMarks as Record<string, unknown>[]).map((m: Record<string, unknown>) => {
      if (m.plotMark === "areaY") {
        const mopts = m.options as Record<string, unknown> | undefined;
        return Plot.areaY((m.data as Record<string, unknown>[]) || props.data, { x: props.x, y: props.y, curve: "catmull-rom",
          fill: (mopts?.fill as string) || props.stroke || "currentColor", fillOpacity: (mopts?.fillOpacity as number) || 0.1, ...(m.options as object) });
      }
      const plotFn = (Plot as unknown as Record<string, (data: unknown[], opts: object) => unknown>)[m.plotMark as string];
      if (m.plotMark && typeof plotFn === "function")
        return plotFn((m.data as Record<string, unknown>[]) || props.data, { x: props.x, y: props.y, ...(m.options as object) });
      return m;
    }).filter((x): x is Plot.Markish => Boolean(x));

    return withTheme({ ...opts,
      x: { label: null, ...opts.x }, y: { grid: true, label: null, ...opts.y },
      marks: [
        Plot.gridY({ stroke: "currentColor", strokeOpacity: 0.08 }),
        ...processedExtraMarks,
        Plot.lineY(props.data, { x: props.x, y: props.y, stroke: props.stroke || "currentColor", curve: "catmull-rom", strokeWidth: 2.5 }),
        Plot.dot(props.data, { x: props.x, y: props.y, stroke: props.stroke || "currentColor", fill: "var(--background)", r: 4, strokeWidth: 2, tip: false,
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
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[140px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.[props.stroke ?? ""] ?? "Value")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.[props.y] ?? "")}</div>
          <Show when={hoveredData()?.[props.x] !== undefined}>
            <div class="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{String(hoveredData()?.[props.x] ?? "")}</div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default LineGraph;
