import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { Chip } from "~/components/atoms/Chip";
import { createChartTooltip } from "./chart-tooltip";

export interface ScatterGraphProps {
  data: Record<string, unknown>[]; x: string; y: string; fill?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Omit<Plot.PlotOptions, "marks"> & { marks?: Record<string, unknown>[] }; class?: string;
}

export const ScatterGraph: Component<ScatterGraphProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    const extraMarks = (opts as Record<string, unknown>).marks ?? [];
    const processed = (extraMarks as Record<string, unknown>[]).map((m: Record<string, unknown>) => {
      if (m.plotMark && typeof (Plot as unknown as Record<string, (data: unknown[], opts: object) => unknown>)[m.plotMark as string] === "function")
        return (Plot as unknown as Record<string, (data: unknown[], opts: object) => unknown>)[m.plotMark as string]((m.data as Record<string, unknown>[]) || props.data, { x: props.x, y: props.y, ...(m.options as object) });
      return m;
    }).filter((x): x is Plot.Markish => Boolean(x));

    return withTheme({ ...opts,
      x: { grid: true, label: null, ...opts.x }, y: { grid: true, label: null, ...opts.y },
      marks: [
        ...processed,
        Plot.dot(props.data, { x: props.x, y: props.y, fill: props.fill || "currentColor", r: 4, fillOpacity: 0.7, tip: false,
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
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[120px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.[props.fill ?? ""] ?? "Point")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{props.x}: {(hoveredData()?.[props.x] as number)?.toFixed?.(2) ?? String(hoveredData()?.[props.x] ?? "")}</div>
          <div class="text-[10px] text-slate-400 font-mono whitespace-nowrap">{props.y}: {(hoveredData()?.[props.y] as number)?.toFixed?.(1) ?? String(hoveredData()?.[props.y] ?? "")}</div>
        </div>
      </Show>
    </div>
  );
};
