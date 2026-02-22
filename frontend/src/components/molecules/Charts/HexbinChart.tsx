import { type Component, createMemo, onCleanup, Show } from "solid-js";
import type * as TopoJSON from "topojson-specification";
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { PlotGraph } from "~/components/molecules/PlotGraph/PlotGraph";
import { withTheme } from "~/lib/plot-theme";
import { createChartTooltip } from "./chart-tooltip";

import usData from "us-atlas/states-10m.json";

let _nation: ReturnType<typeof topojson.merge> | null = null;
let _stateMesh: ReturnType<typeof topojson.mesh> | null = null;

function getTopoFeatures() {
  if (!_nation) {
    const usTopo = usData as unknown as TopoJSON.Topology;
    _nation = topojson.merge(usTopo, (usTopo.objects.states as TopoJSON.GeometryCollection).geometries as TopoJSON.Polygon[]);
    _stateMesh = topojson.mesh(usTopo, usTopo.objects.states as TopoJSON.GeometryObject, (a: TopoJSON.GeometryObject, b: TopoJSON.GeometryObject) => a !== b);
  }
  return { nation: _nation!, stateMesh: _stateMesh! };
}

export interface HexbinChartProps {
  data: Record<string, unknown>[]; x: string; y: string;
  title?: string; subtitle?: string; icon?: string; caption?: string;
  options?: Plot.PlotOptions; class?: string;
}

export const HexbinChart: Component<HexbinChartProps> = (props) => {
  const { hoveredData, tooltipPos, attachHover, tooltipEnter, tooltipLeave, clearTooltip } = createChartTooltip();
  onCleanup(() => clearTooltip());

  const mergedOptions = createMemo(() => {
    const opts = props.options ?? {};
    const _hovered = hoveredData();
    const { nation, stateMesh } = getTopoFeatures();
    return withTheme({ projection: "albers-usa", ...opts,
      color: { scheme: "YlGnBu", label: null, ...opts.color },
      marks: [
        Plot.geo(nation, { fill: "currentColor", fillOpacity: 0.03, stroke: null }),
        Plot.geo(stateMesh, { stroke: "currentColor", strokeOpacity: 0.15, strokeWidth: 0.5, fill: "none" }),
        Plot.dot(props.data, Plot.hexbin({ fill: "count" }, { x: props.x, y: props.y, binWidth: 14, tip: false })),
        // Invisible dots as hover hit targets
        Plot.dot(props.data, { x: props.x, y: props.y, r: 6, fill: "transparent", stroke: "transparent", tip: false,
          render: (index, scales, values, dims, ctx, next) => {
            const g = next!(index, scales, values, dims, ctx);
            g!.querySelectorAll("circle").forEach((el: Element, i: number) => attachHover(el, props.data[index[i]], ctx));
            return g;
          },
        }),
        ...(_hovered ? [Plot.dot([_hovered], { x: props.x, y: props.y, fill: "hsl(var(--foreground))", stroke: "hsl(var(--foreground))", r: 8, strokeWidth: 2, pointerEvents: "none" })] : []),
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
          <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">Location</div>
          <div class="text-xs font-bold text-white whitespace-nowrap">
            {(() => {
              const x = hoveredData()?.[props.x];
              const y = hoveredData()?.[props.y];
              return `${typeof x === "number" ? x.toFixed(1) : x ?? ""}, ${typeof y === "number" ? y.toFixed(1) : y ?? ""}`;
            })()}
          </div>
        </div>
      </Show>
    </div>
  );
};
