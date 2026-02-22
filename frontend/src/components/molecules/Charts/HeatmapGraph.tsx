import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { createChartTooltip } from "./chart-tooltip";

export interface HeatmapGraphProps {
  data: Record<string, unknown>[];
  dateKey?: string;
  valueKey?: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  caption?: string;
  options?: Plot.PlotOptions;
  class?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const HeatmapGraph: Component<HeatmapGraphProps> = (props) => {
  const dateKey = () => props.dateKey ?? "date";
  const valueKey = () => props.valueKey ?? "value";
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const processedData = createMemo(() =>
    props.data.map((d) => {
      const date = new Date(d[dateKey()] as string | number | Date);
      const startOfWeekMs = date.getTime() - date.getDay() * 86400000;
      const weekId = new Date(startOfWeekMs).setHours(0, 0, 0, 0);
      return { ...d, __date: date, __day: DAYS[date.getDay()], __week: weekId };
    })
  );

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const processed = processedData();
    const _hovered = hoveredData();

    return withTheme({
      ...opts,
      padding: 0,
      marginTop: (opts.marginTop ?? 0) + 40,
      x: { axis: "top", label: null, padding: 0.15, tickFormat: () => "", ...opts.x },
      y: { label: null, padding: 0.15, domain: DAYS, ...opts.y },
      color: { scheme: "Greens", label: null, ...opts.color },
      marks: [
        // Month labels at top
        Plot.text(processed, Plot.selectFirst({
          x: "__week", y: () => "Sun",
          text: (d: Record<string, unknown>) => (d.__date as Date).toLocaleDateString(undefined, { month: "short" }),
          dy: -35, z: (d: Record<string, unknown>) => (d.__date as Date).getMonth(),
          fontWeight: 800, fontSize: 10, fill: "currentColor", fillOpacity: 0.4, textAnchor: "start",
        })),
        // Cells
        Plot.cell(processed, {
          x: "__week", y: "__day", fill: valueKey(), inset: 0, rx: 3, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("rect").forEach((el: Element, i: number) => attachHover(el, processed[index[i]], ctx));
            return g;
          },
        }),
        // Values inside cells
        Plot.text(processed, {
          x: "__week", y: "__day", text: valueKey(),
          fill: (d: Record<string, unknown>) => (d[valueKey()] as number) > 15 ? "white" : "black",
          fontWeight: 700, fontSize: 9, pointerEvents: "none",
        }),
        // Highlight overlay
        ...(_hovered ? [
          Plot.cell([_hovered], { x: "__week", y: "__day", fill: "hsl(var(--foreground))", stroke: "hsl(var(--foreground))", strokeWidth: 2, rx: 3, inset: 0, pointerEvents: "none" }),
          Plot.text([_hovered], { x: "__week", y: "__day", text: valueKey(), fill: "hsl(var(--background))", fontWeight: 700, fontSize: 9, pointerEvents: "none" }),
        ] : []),
      ],
    });
  });

  const legend = () => (
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-bold uppercase tracking-widest opacity-40">Less</span>
      <div class="flex gap-1">
        <div class="h-2 w-2 rounded-[1px] bg-[#f7fcf5] border border-foreground/5 shadow-inner opacity-20" />
        <div class="h-2 w-2 rounded-[1px] bg-[#c7e9c0] border border-foreground/5 shadow-inner" />
        <div class="h-2 w-2 rounded-[1px] bg-[#74c476] border border-foreground/5 shadow-inner" />
        <div class="h-2 w-2 rounded-[1px] bg-[#238b45] border border-foreground/5 shadow-inner" />
        <div class="h-2 w-2 rounded-[1px] bg-[#00441b] border border-foreground/5 shadow-inner" />
      </div>
      <span class="text-[9px] font-bold uppercase tracking-widest opacity-40">More</span>
    </div>
  );

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle}
        icon={props.icon} caption={props.caption} legend={legend()} class={props.class} />
      <Show when={hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[140px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">
            {(hoveredData()?.__date as Date)?.toLocaleDateString(undefined, { weekday: "long" })}
          </div>
          <div class="text-xs font-bold text-white whitespace-nowrap">
            {String(hoveredData()?.[props.valueKey ?? "value"] ?? "")} Tasks Completed
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
            {(hoveredData()?.__date as Date)?.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </Show>
    </div>
  );
};
