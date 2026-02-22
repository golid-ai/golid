import {
  createSignal,
  createMemo,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
  type Component,
} from "solid-js";
import { select } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal } from "d3-scale";
import { interpolateNumber } from "d3-interpolate";
import { easeLinear } from "d3-ease";
import "d3-transition";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface BarRaceProps {
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
  icon?: string;
  category?: string;
  value?: string;
  time?: string;
  k?: number;
  duration?: number;
  class?: string;
}

// ============================================================================
// COMPONENT
// Animated bar chart race using raw D3 transitions.
// ============================================================================

export const BarRace: Component<BarRaceProps> = (props) => {
  const cat = () => props.category ?? "name";
  const val = () => props.value ?? "value";
  const tim = () => props.time ?? "date";
  const k = () => props.k ?? 10;
  const dur = () => props.duration ?? 250;

  const [frame, setFrame] = createSignal(0);
  const [playing, setPlaying] = createSignal(false);
  const [width, setWidth] = createSignal(800);
  const [height, setHeight] = createSignal(500);
  const [isMeasured, setIsMeasured] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  let svgRef: SVGSVGElement | undefined;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const dates = createMemo(() => [...new Set(props.data.map((d) => d[tim()] as string | number))]);
  const maxFrame = createMemo(() => dates().length - 1);
  const currentDate = createMemo(() => dates()[frame()] || "");
  const names = createMemo(() => new Set(props.data.map((d) => d[cat()])));
  const maxValue = createMemo(() => Math.max(1, ...props.data.map((d) => d[val()] as number)) * 1.1);

  const colorScale = createMemo(() =>
    scaleOrdinal<string>()
      .domain(Array.from(names()) as string[])
      .range([
        "#0891b2", "#059669", "#b45309", "#be185d", "#6d28d9",
        "#4338ca", "#be123c", "#0f766e", "#1d4ed8", "#7e22ce",
      ])
  );

  const currentData = createMemo(() =>
    props.data
      .filter((d) => d[tim()] === currentDate())
      .sort((a, b) => (b[val()] as number) - (a[val()] as number))
      .slice(0, k())
  );

  const margin = { top: 40, right: 20, bottom: 20, left: 140 };

  function rank(dataAtDate: Record<string, unknown>[]) {
    const sorted = [...dataAtDate].sort((a, b) => (b[val()] as number) - (a[val()] as number));
    sorted.forEach((d, i) => { (d as Record<string, unknown>).rank = i; });
    return sorted;
  }

  // D3 render effect
  createEffect(() => {
    if (!svgRef || !currentData().length || !isMeasured()) return;

    const svgSelection = select(svgRef);
    const w = width();
    const h = height();

    const x = scaleLinear().domain([0, maxValue()]).range([margin.left, w - margin.right]);
    const y = scaleBand<number>()
      .domain(Array.from({ length: k() }, (_, i) => i))
      .rangeRound([margin.top, h - margin.bottom])
      .padding(0.1);

    let gRows = svgSelection.select<SVGGElement>(".rows-container");
    if (gRows.empty()) gRows = svgSelection.append("g").attr("class", "rows-container");

    const ranked = rank(currentData());
    const groups = gRows.selectAll<SVGGElement, Record<string, unknown>>(".race-row").data(ranked, (d: Record<string, unknown>) => d[cat()] as string);

    const exitTransition = groups.exit().transition("swap").duration(dur() / 2).ease(easeLinear);
    exitTransition.style("opacity", 0).attr("transform", `translate(0, ${h + 50})`).remove();

    // ENTER
    const enter = groups.enter().append("g")
      .attr("class", "race-row")
      .attr("transform", (d: Record<string, unknown>) => `translate(0, ${y(d.rank as number)})`)
      .style("opacity", 0);

    enter.append("rect").attr("class", "bar-rect").attr("x", margin.left).attr("rx", 2).attr("fill-opacity", 0.8);
    enter.append("text").attr("class", "category-label").attr("text-anchor", "end").attr("alignment-baseline", "middle").attr("fill", "currentColor").attr("x", margin.left - 8).style("font-size", "10px").style("font-weight", "bold").style("text-transform", "uppercase");
    enter.append("text").attr("class", "value-label").attr("alignment-baseline", "middle").attr("fill", "currentColor").style("font-size", "10px").style("font-family", "monospace").style("opacity", "0.8");

    // UPDATE
    const update = groups.merge(enter);

    const updateTransition = update.transition("swap").duration(dur() / 2).ease(easeLinear);
    updateTransition.attr("transform", (d: Record<string, unknown>) => `translate(0, ${y(d.rank as number)})`).style("opacity", 1);
    const rectTransition = update.select("rect").transition("growth").duration(dur()).ease(easeLinear);
    rectTransition.attr("fill", (d: Record<string, unknown>) => colorScale()(d[cat()] as string) as string).attr("width", (d: Record<string, unknown>) => Math.max(0, x(d[val()] as number) - margin.left)).attr("height", y.bandwidth());
    update.select(".category-label").attr("y", y.bandwidth() / 2).text((d: Record<string, unknown>) => d[cat()] as string);
    update.select(".value-label").transition("growth").duration(dur()).ease(easeLinear)
      .attr("x", (d: Record<string, unknown>) => x(d[val()] as number) + 8)
      .attr("y", y.bandwidth() / 2)
      .tween("text", function (d: Record<string, unknown>) {
        const el = this as unknown as SVGTextElement;
        const i = interpolateNumber(+(el.textContent?.replace(/,/g, "") || 0), d[val()] as number);
        return function (t: number) { el.textContent = Math.round(i(t)).toLocaleString(); };
      });

    // Date ticker
    const ticker = svgSelection.selectAll<SVGGElement, string>(".ticker-group").data([currentDate()]);
    const tickerEnter = ticker.enter().append("g").attr("class", "ticker-group").attr("transform", `translate(${w - 20}, ${h - 60})`);
    tickerEnter.append("text").attr("class", "week-text").attr("text-anchor", "end").style("font-size", "40px").style("font-weight", "900").style("fill", "currentColor").style("opacity", "0.08");
    ticker.merge(tickerEnter).select(".week-text").text(currentDate());
  });

  function togglePlay() {
    if (playing()) {
      setPlaying(false);
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    } else {
      setPlaying(true);
      intervalId = setInterval(() => {
        setFrame((f) => {
          if (f < maxFrame()) return f + 1;
          setPlaying(false);
          if (intervalId !== null) clearInterval(intervalId);
          intervalId = null;
          return f;
        });
      }, dur());
    }
  }

  function reset() {
    setPlaying(false);
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    setFrame(0);
  }

  // Resize (rAF debounced to prevent ResizeObserver loop warnings)
  onMount(() => {
    if (!containerRef) return;
    let resizeRaf: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width);
          setHeight(Math.min(600, Math.max(400, entry.contentRect.height)));
          setIsMeasured(true);
        }
        resizeRaf = null;
      });
    });
    observer.observe(containerRef);
    onCleanup(() => { observer.disconnect(); if (resizeRaf) cancelAnimationFrame(resizeRaf); if (intervalId) clearInterval(intervalId); });
  });

  // Grid ticks
  const gridTicks = () => [0, 0.25, 0.5, 0.75, 1].map((tick) => ({
    val: tick * maxValue(),
    x: margin.left + tick * (width() - margin.left - 20),
  }));

  return (
    <div class={cn("flex flex-col gap-6 h-full w-full", props.class)} ref={containerRef}>
      {/* Header */}
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <Show when={props.icon}>
            <div class="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Icon name={props.icon!} size={20} />
            </div>
          </Show>
          <div>
            <h3 class="text-lg font-bold font-montserrat tracking-tight text-foreground">
              {props.title ?? "Bar Chart Race"}
            </h3>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
              {props.subtitle ?? "Growth over time"}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-6 bg-foreground/[0.03] backdrop-blur-sm border border-foreground/5 rounded-2xl px-5 py-3">
          <div class="flex items-center gap-2 pr-4 border-r border-foreground/10">
            <button
              onClick={togglePlay}
              class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
            >
              <Icon name={playing() ? "pause" : "play_arrow"} size={18} />
            </button>
            <button
              onClick={reset}
              class="flex items-center justify-center w-8 h-8 rounded-full hover:bg-foreground/10 transition-all active:scale-95"
            >
              <Icon name="replay" size={18} />
            </button>
          </div>
          <div class="flex flex-col items-end min-w-[100px]">
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
              Active Week
            </span>
            <span class="text-xl font-mono font-black text-primary tabular-nums tracking-tighter">
              {currentDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div class="flex-grow relative min-h-[400px]">
        <svg ref={svgRef} width={width()} height={height()} class="overflow-visible" style={{"user-select":"none"}}>
          <For each={gridTicks()}>
            {(tick) => (
              <>
                <line
                  x1={tick.x} y1={margin.top} x2={tick.x} y2={height() - margin.bottom}
                  stroke="currentColor" stroke-opacity="0.1"
                />
                <text
                  x={tick.x} y={margin.top - 10}
                  text-anchor="middle"
                  class="text-[9px] fill-muted-foreground font-mono uppercase"
                >
                  {tick.val.toFixed(0)}
                </text>
              </>
            )}
          </For>
        </svg>
      </div>

      {/* Scrubber */}
      <div class="px-2 pt-4">
        <input
          type="range"
          min="0"
          max={maxFrame()}
          value={frame()}
          onInput={(e) => setFrame(parseInt(e.currentTarget.value))}
          class="w-full h-1.5 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-primary transition-all hover:h-2"
        />
      </div>
    </div>
  );
};

export default BarRace;
