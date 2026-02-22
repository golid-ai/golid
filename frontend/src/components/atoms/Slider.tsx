import { createSignal, createMemo, For, Index, Show, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface SliderProps {
  /** Unique ID for the slider */
  id?: string;
  /** Additional class */
  class?: string;
  /** Current value (single number or [min, max] for range) */
  value?: number | [number, number];
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Show step notches */
  showSteps?: boolean;
  /** Show value tooltip on hover */
  showValue?: boolean;
  /** Aria labels for thumbs */
  ariaLabels?: string[];
  /** Change handler */
  onChange?: (value: number | [number, number]) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Slider: Component<SliderProps> = (props) => {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;

  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [flipTooltip, setFlipTooltip] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;

  const values = createMemo(() => {
    const v = props.value ?? 50;
    return Array.isArray(v) ? v : [v];
  });

  const isRange = () => Array.isArray(props.value);

  const getPercentage = (val: number) => ((val - min()) / (max() - min())) * 100;

  const trackStyle = createMemo(() => {
    if (isRange()) {
      const vals = values();
      const start = Math.min(...vals);
      const end = Math.max(...vals);
      const left = getPercentage(start);
      const width = getPercentage(end) - left;
      return { left: `${left}%`, width: `${width}%` };
    } else {
      return { left: "0%", width: `${getPercentage(values()[0])}%` };
    }
  });

  const ticks = createMemo(() => {
    if (!props.showSteps || step() <= 0) return [];
    const count = Math.floor((max() - min()) / step());
    if (count > 50) return [];
    return Array.from({ length: count + 1 }, (_, i) => min() + i * step());
  });

  const checkTooltipPosition = () => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    setFlipTooltip(rect.top < 150);
  };

  const handleInput = (e: Event, index: number) => {
    const target = e.target as HTMLInputElement;
    const val = parseFloat(target.value);

    if (isRange()) {
      const newValues = [...values()] as [number, number];
      newValues[index] = val;
      props.onChange?.(newValues);
    } else {
      props.onChange?.(val);
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isRange() || !containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    const pointerValue = min() + ((max() - min()) * percentage) / 100;

    // Find closest thumb
    let closestIndex = 0;
    let minDistance = Math.abs(values()[0] - pointerValue);

    for (let i = 1; i < values().length; i++) {
      const distance = Math.abs(values()[i] - pointerValue);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    setActiveIndex(closestIndex);
  };

  const isInRange = (tick: number) => {
    if (isRange()) {
      const vals = values();
      return tick >= Math.min(...vals) && tick <= Math.max(...vals);
    }
    return tick <= values()[0];
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={checkTooltipPosition}
      onFocusIn={checkTooltipPosition}
      onPointerMove={handlePointerMove}
      class={cn(
        "relative flex h-10 w-full items-center touch-none select-none group/slider",
        props.class
      )}
    >
      {/* Track Container */}
      <div class="relative h-1.5 w-full grow rounded-full bg-muted overflow-visible z-0">
        {/* Filled Range */}
        <div
          class="absolute h-full rounded-full bg-primary transition-all duration-75 ease-out"
          style={{ left: trackStyle().left, width: trackStyle().width }}
        />

        {/* Step Notches */}
        <Show when={props.showSteps}>
          <div class="absolute inset-0 flex items-center justify-between px-[1px] pointer-events-none">
            <For each={ticks()}>
              {(tick) => (
                <div
                  class={cn(
                    "h-1 w-1 rounded-full transition-colors duration-200 z-10",
                    isInRange(tick) ? "bg-background/40" : "bg-foreground/10"
                  )}
                />
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Range Inputs - use Index instead of For to avoid recreating elements */}
      <Index each={values()}>
        {(val, i) => (
          <>
            <input
              id={i === 0 ? props.id : `${props.id}-max`}
              type="range"
              min={min()}
              max={max()}
              step={step()}
              value={val()}
              aria-label={
                props.ariaLabels?.[i] ||
                (isRange() ? (i === 0 ? "Minimum value" : "Maximum value") : "Value")
              }
              onInput={(e) => handleInput(e, i)}
              onFocus={() => setActiveIndex(i)}
              class={cn(
                "slider-input absolute left-0 w-full h-10 top-1/2 -translate-y-1/2 appearance-none bg-transparent focus:outline-none cursor-pointer pointer-events-none",
                activeIndex() === i ? "z-30" : "z-20"
              )}
            />

            {/* Value Tooltip */}
            <Show when={props.showValue}>
              <div
                class={cn(
                  "absolute flex flex-col items-center transition-all duration-75 ease-out z-40 pointer-events-none opacity-0 group-hover/slider:opacity-100 group-focus-within/slider:opacity-100",
                  flipTooltip() ? "top-[48px]" : "top-[-40px]"
                )}
                style={{
                  left: `calc(14px + (100% - 28px) * ${getPercentage(val())} / 100)`,
                  transform: "translateX(-50%)",
                }}
              >
                <div class="bg-foreground text-background text-[11px] font-bold px-3 py-1 rounded-lg shadow-xl whitespace-nowrap border border-background/10">
                  {val()}
                </div>
              </div>
            </Show>
          </>
        )}
      </Index>
    </div>
  );
};

export default Slider;
