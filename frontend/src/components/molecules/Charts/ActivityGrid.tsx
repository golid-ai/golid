import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { createChartTooltip } from "./chart-tooltip";

export interface ActivityGridProps {
  data: Record<string, unknown>[]; x: string; y: string; value?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
  valueLabel?: string;
}

export const ActivityGrid: Component<ActivityGridProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());
  const value = () => props.value ?? "count";

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    return withTheme({ ...opts,
      x: { grid: true, label: null, ...opts.x }, y: { label: null, ...opts.y },
      color: { scheme: "Greens", label: null, ...opts.color },
      marks: [
        Plot.dot(props.data, { x: props.x, y: props.y, r: value(), fill: value(), fillOpacity: 0.6, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, props.data[index[i]], ctx));
            return g;
          },
        }),
        ...(hoveredData() ? [Plot.dot([hoveredData()!], { x: props.x, y: props.y, r: (hoveredData()?.[value()] as number || 4) * 1.3, fill: "hsl(var(--foreground))", fillOpacity: 0.5, pointerEvents: "none" })] : []),
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
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.[props.y] ?? "")} {String(hoveredData()?.[props.x] ?? "")}:00</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.[value()] ?? "")} {props.valueLabel ?? "items"}</div>
        </div>
      </Show>
    </div>
  );
};
