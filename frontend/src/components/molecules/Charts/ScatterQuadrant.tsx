import { type Component, createMemo, onCleanup, Show } from "solid-js";
import * as Plot from "@observablehq/plot";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { createChartTooltip } from "./chart-tooltip";

export interface ScatterQuadrantProps {
  data: Record<string, unknown>[]; x: string; y: string; label?: string; xLabel?: string; yLabel?: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
  quadrantLabels?: [string, string, string, string];
}

export const ScatterQuadrant: Component<ScatterQuadrantProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const d = props.data;
    const _hovered = hoveredData();
    const xVals = d.map((item) => item[props.x] as number).sort((a, b) => a - b);
    const yVals = d.map((item) => item[props.y] as number).sort((a, b) => a - b);
    const medianX = xVals[Math.floor(xVals.length / 2)] as number;
    const medianY = yVals[Math.floor(yVals.length / 2)] as number;
    const qLabels = props.quadrantLabels ?? ["Top Right", "Bottom Right", "Top Left", "Bottom Left"];
    const colored = d.map((item) => ({ ...item,
      quadrant: (item[props.x] as number) >= medianX && (item[props.y] as number) >= medianY ? qLabels[0]
        : (item[props.x] as number) >= medianX ? qLabels[1] : (item[props.y] as number) >= medianY ? qLabels[2] : qLabels[3],
    }));

    return withTheme({ ...opts,
      x: { grid: true, label: props.xLabel ?? "X Axis", ...opts.x },
      y: { grid: true, label: props.yLabel ?? "Y Axis", ...opts.y },
      color: { domain: qLabels, range: ["#34d399", "#22d3ee", "#a78bfa", "#64748b"], ...opts.color },
      marks: [
        Plot.ruleX([medianX], { stroke: "currentColor", strokeOpacity: 0.2, strokeDasharray: "4,4" }),
        Plot.ruleY([medianY], { stroke: "currentColor", strokeOpacity: 0.2, strokeDasharray: "4,4" }),
        Plot.dot(colored, { x: props.x, y: props.y, fill: "quadrant" as string, r: 5, fillOpacity: 0.7, tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, colored[index[i]], ctx));
            return g;
          },
        }),
        ...(_hovered ? [Plot.dot([_hovered], { x: props.x, y: props.y, fill: "hsl(var(--foreground))", r: 7, strokeWidth: 2, stroke: "hsl(var(--foreground))", pointerEvents: "none" })] : []),
      ],
    });
  });

  return (
    <div class="relative group w-full h-full">
      <PlotGraph options={mergedOptions()} title={props.title} subtitle={props.subtitle} icon={props.icon} caption={props.caption} class={props.class} />
      <Show when={hoveredData()}>
        <div role="tooltip" class="absolute pointer-events-auto z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[120px]"
          style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y + 28}px`, transform: "translate(-50%, -100%)" }}
          onMouseEnter={tooltipEnter} onMouseLeave={tooltipLeave}>
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">{String(hoveredData()?.quadrant ?? "")}</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">{String(hoveredData()?.name ?? "Item")}</div>
          <div class="text-[10px] text-slate-400 font-mono whitespace-nowrap">{props.x}: {(hoveredData()?.[props.x] as number)?.toFixed?.(1)} | {props.y}: {(hoveredData()?.[props.y] as number)?.toFixed?.(1)}</div>
        </div>
      </Show>
    </div>
  );
};
