import { type Component, createMemo, createSignal, Show, For } from "solid-js";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

export interface RadarData {
  key: string;
  value: number;
}

export interface RadarGraphProps {
  data: RadarData[];
  color?: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  caption?: string;
  class?: string;
}

export const RadarGraph: Component<RadarGraphProps> = (props) => {
  const color = () => props.color ?? "#0891b2";
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);
  const [tooltipPos, setTooltipPos] = createSignal({ x: 0, y: 0 });

  const svgContent = createMemo(() => {
    const d = props.data;
    const n = d.length;
    if (n === 0) return null;

    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.35;

    const toXY = (value: number, i: number) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const r = (value / 100) * maxR;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    };

    return { size, cx, cy, maxR, toXY, d, n };
  });

  function handleDotEnter(e: MouseEvent, index: number) {
    setHoveredIndex(index);
    const svg = (e.currentTarget as SVGElement).closest("svg");
    const container = svg?.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  function handleDotMove(e: MouseEvent) {
    const svg = (e.currentTarget as SVGElement).closest("svg");
    const container = svg?.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  return (
    <figure class={cn("relative group flex flex-col overflow-visible h-full", props.class)}>
      {/* Header */}
      <Show when={props.title || props.icon}>
        <div class="flex items-center gap-3 mb-6">
          <Show when={props.icon}>
            <div class="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 flex items-center justify-center shadow-lg shrink-0">
              <Icon name={props.icon!} size={18} class="text-foreground/70" />
            </div>
          </Show>
          <div class="min-w-0">
            <Show when={props.title}>
              <h4 class="text-xs font-bold text-foreground/90 uppercase tracking-wider truncate">{props.title}</h4>
            </Show>
            <Show when={props.subtitle}>
              <span class="text-[10px] text-muted-foreground font-medium block leading-tight truncate">{props.subtitle}</span>
            </Show>
          </div>
        </div>
      </Show>

      {/* Radar SVG (square, centered) */}
      <div class="flex-grow flex items-center justify-center relative">
        <Show when={svgContent()}>
          {(ctx) => {
            const { size, cx, cy, maxR, toXY, d, n } = ctx();
            const gridPcts = [20, 40, 60, 80, 100];

            const polyPath = d.map((item: RadarData, i: number) => {
              const p = toXY(item.value, i);
              return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
            }).join(" ") + " Z";

            return (
              <svg viewBox={`0 0 ${size} ${size}`} class="w-full max-w-[300px] h-auto">
                <For each={gridPcts}>{(pct) => (
                  <circle cx={cx} cy={cy} r={(pct / 100) * maxR}
                    fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="1" />
                )}</For>
                {Array.from({ length: n }, (_, i) => {
                  const end = toXY(100, i);
                  return <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="currentColor" stroke-opacity="0.1" />;
                })}
                <path d={polyPath} fill={color()} fill-opacity="0.15" stroke={color()} stroke-width="2" />
                {/* Data dots with hover */}
                {d.map((item: RadarData, i: number) => {
                  const p = toXY(item.value, i);
                  const isHovered = hoveredIndex() === i;
                  return (
                    <>
                      {isHovered && (
                        <circle cx={p.x} cy={p.y} r="7" fill="hsl(var(--foreground))" fill-opacity="0.3" stroke="hsl(var(--foreground))" stroke-width="2" pointer-events="none" />
                      )}
                      <circle cx={p.x} cy={p.y} r={isHovered ? 6 : 4} fill={color()} stroke="var(--background)" stroke-width="2"
                        style={{"cursor":"pointer"}}
                        onMouseEnter={(e) => handleDotEnter(e, i)}
                        onMouseMove={handleDotMove}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    </>
                  );
                })}
                {/* Labels */}
                {d.map((item: RadarData, i: number) => {
                  const p = toXY(118, i);
                  return (
                    <text x={p.x} y={p.y} text-anchor="middle" dominant-baseline="middle"
                      fill="currentColor" fill-opacity="0.6" font-size="10" font-weight="700">
                      {item.key}
                    </text>
                  );
                })}
              </svg>
            );
          }}
        </Show>

        {/* Custom Tooltip */}
        <Show when={hoveredIndex() !== null}>
          <div role="tooltip" class="absolute pointer-events-none z-50 flex flex-col gap-1 bg-slate-900 border border-slate-800 shadow-xl rounded-md px-3 py-2 min-w-[100px]"
            style={{ left: `${tooltipPos().x}px`, top: `${tooltipPos().y - 16}px`, transform: "translate(-50%, -100%)" }}>
            <div class="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] whitespace-nowrap">
              {props.data[hoveredIndex()!]?.key}
            </div>
            <div class="text-xs font-bold text-white whitespace-nowrap">
              {props.data[hoveredIndex()!]?.value}%
            </div>
          </div>
        </Show>
      </div>

      <Show when={props.caption}>
        <figcaption class="mt-auto text-xs text-muted-foreground italic text-center w-full pb-2">
          {props.caption}
        </figcaption>
      </Show>
    </figure>
  );
};
