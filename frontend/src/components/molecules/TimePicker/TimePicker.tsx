import {
  createSignal,
  createEffect,
  createMemo,
  onMount,
  onCleanup,
  Show,
  type Component,
  type JSX,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";
import { Button } from "~/components/atoms/Button";

// ============================================================================
// TYPES
// ============================================================================

export type TimePickerSize = "sm" | "default" | "lg";

export interface TimePickerProps {
  /** Current time value in 24h format "HH:mm" */
  value?: string;
  /** Called when time changes */
  onChange?: (time: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: TimePickerSize;
  /** Additional class */
  class?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom trigger element - receives open state and toggle function */
  trigger?: (props: { open: boolean; toggle: () => void; displayValue: string }) => JSX.Element;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TimePicker: Component<TimePickerProps> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [direction, setDirection] = createSignal<"up" | "down">("down");
  const [typedHours, setTypedHours] = createSignal("");
  const [typedMinutes, setTypedMinutes] = createSignal("");

  let containerRef: HTMLDivElement | undefined;
  let isMouseDownInside = false;

  // Parse value into hours/minutes
  const hours24 = createMemo(() => {
    const val = props.value || "12:00";
    return parseInt(val.split(":")[0]) || 0;
  });

  const minutes = createMemo(() => {
    const val = props.value || "12:00";
    return parseInt(val.split(":")[1]) || 0;
  });

  const period = createMemo(() => (hours24() >= 12 ? "PM" : "AM"));
  const hours12 = createMemo(() => {
    const h = hours24() % 12;
    return h === 0 ? 12 : h;
  });

  const displayTime = createMemo(() => {
    if (!props.value) return props.placeholder || "Select time...";
    return `${String(hours12()).padStart(2, "0")}:${String(minutes()).padStart(2, "0")} ${period()}`;
  });

  // Sync typed values with actual value
  createEffect(() => {
    setTypedHours(String(hours12()).padStart(2, "0"));
    setTypedMinutes(String(minutes()).padStart(2, "0"));
  });

  const calculateDirection = () => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const navHeight = 80;
    const menuHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top - navHeight;
    setDirection(spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down");
  };

  const toggle = () => {
    if (props.disabled) return;
    if (!open()) {
      calculateDirection();
    }
    setOpen(!open());
  };

  const close = () => {
    setOpen(false);
  };

  const updateTime = (h24: number, m: number) => {
    const hStr = String(h24).padStart(2, "0");
    const mStr = String(m).padStart(2, "0");
    props.onChange?.(`${hStr}:${mStr}`);
  };

  const adjustHours = (delta: number) => {
    const newHours = (hours24() + delta + 24) % 24;
    updateTime(newHours, minutes());
  };

  const adjustMinutes = (delta: number) => {
    let newMinutes: number;
    const currentMinutes = minutes();
    
    if (currentMinutes % 5 !== 0) {
      // Snap to nearest 5 minute interval
      if (delta > 0) {
        newMinutes = Math.ceil(currentMinutes / 5) * 5;
      } else {
        newMinutes = Math.floor(currentMinutes / 5) * 5;
      }
      if (newMinutes >= 60) newMinutes = 0;
    } else {
      newMinutes = (currentMinutes + delta + 60) % 60;
    }
    updateTime(hours24(), newMinutes);
  };

  const setPeriod = (newPeriod: "AM" | "PM") => {
    if (period() === newPeriod) return;
    const newHours = (hours24() + 12) % 24;
    updateTime(newHours, minutes());
  };

  const handleHoursInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(-2);
    setTypedHours(val);

    const num = parseInt(val);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      let h24 = num;
      if (period() === "PM" && num < 12) h24 += 12;
      if (period() === "AM" && num === 12) h24 = 0;
      updateTime(h24, minutes());
    }
  };

  const handleMinutesInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(-2);
    setTypedMinutes(val);

    const num = parseInt(val);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      updateTime(hours24(), num);
    }
  };

  const handleBlur = () => {
    setTypedHours(String(hours12()).padStart(2, "0"));
    setTypedMinutes(String(minutes()).padStart(2, "0"));
  };

  const setCurrentTime = () => {
    const now = new Date();
    updateTime(now.getHours(), now.getMinutes());
  };

  // Click outside handler
  const handleClickOutside = (e: MouseEvent) => {
    if (open() && containerRef && !containerRef.contains(e.target as Node)) {
      close();
    }
  };

  // Track mouse state to prevent closing when clicking inside the dropdown
  const handleMouseDown = () => {
    isMouseDownInside = true;
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      isMouseDownInside = false;
    }, 0);
  };

  // Focus out handler - close when focus leaves the container (e.g., tabbing away)
  const handleFocusOut = () => {
    if (!open() || isMouseDownInside) return;
    setTimeout(() => {
      if (!containerRef?.contains(document.activeElement)) {
        close();
      }
    }, 0);
  };

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  const sizeClasses = {
    sm: "h-9 px-3",
    default: "h-10 px-3",
    lg: "h-11 px-4",
  };

  return (
    <div
      ref={containerRef}
      class="relative inline-block w-full"
      onFocusOut={handleFocusOut}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Custom trigger or default */}
      <Show
        when={props.trigger}
        fallback={
          <button
            type="button"
            onClick={toggle}
            disabled={props.disabled}
            class={cn(
              "flex w-full items-center justify-between rounded-sm border border-input bg-transparent px-3 py-1 text-sm ring-offset-background transition-all tracking-tight",
              "hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[props.size || "default"],
              open() && "ring-2 ring-ring ring-offset-2 border-foreground/30",
              props.class
            )}
            aria-haspopup="dialog"
            aria-expanded={open()}
          >
            <span>{displayTime()}</span>
            <Icon
              name="schedule"
              size={18}
              class={cn("ml-2 opacity-50 transition-all", open() && "opacity-100 text-primary")}
            />
          </button>
        }
      >
        {props.trigger?.({ open: open(), toggle, displayValue: displayTime() })}
      </Show>

      {/* Content - absolute positioning like Select/MultiSelect */}
      <div
        class={cn(
          "absolute z-[60] p-5 w-[260px] rounded-sm border border-foreground/10 dark:border-white/10 bg-background dark:bg-card shadow-2xl",
          direction() === "up" ? "bottom-full mb-2 origin-bottom" : "mt-2 origin-top",
          open() ? "animate-in fade-in-0 zoom-in-95" : "hidden"
        )}
      >
        {/* Header */}
        <div class="flex items-center justify-between gap-2 mb-4">
          <div class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
            Select Time
          </div>
          <div class="h-px flex-grow bg-foreground/5 mx-2" />
        </div>

        {/* Time Controls */}
        <div class="flex items-center justify-center gap-4 py-2" role="group" aria-label="Time selection">
          {/* Hours */}
          <div class="flex flex-col items-center gap-2">
            <Button size="sm-icon" variant="ghost" onClick={() => adjustHours(1)} aria-label="Increase hours">
              <Icon name="keyboard_arrow_up" size={18} />
            </Button>
            <div class="w-12 h-14 bg-foreground/[0.03] rounded-lg flex items-center justify-center border border-foreground/5">
              <input
                type="text"
                aria-label="Hours"
                class="w-full h-full bg-transparent text-center text-3xl font-bold text-foreground leading-none outline-none"
                value={typedHours()}
                onInput={handleHoursInput}
                onBlur={handleBlur}
                inputmode="numeric"
                style={{ "font-variant-numeric": "tabular-nums" }}
              />
            </div>
            <Button size="sm-icon" variant="ghost" onClick={() => adjustHours(-1)} aria-label="Decrease hours">
              <Icon name="keyboard_arrow_down" size={18} />
            </Button>
          </div>

          <span class="text-3xl font-bold opacity-20 mt-[-4px] animate-pulse" aria-hidden="true">:</span>

          {/* Minutes */}
          <div class="flex flex-col items-center gap-2">
            <Button size="sm-icon" variant="ghost" onClick={() => adjustMinutes(5)} aria-label="Increase minutes">
              <Icon name="keyboard_arrow_up" size={18} />
            </Button>
            <div class="w-12 h-14 bg-foreground/[0.03] rounded-lg flex items-center justify-center border border-foreground/5">
              <input
                type="text"
                aria-label="Minutes"
                class="w-full h-full bg-transparent text-center text-3xl font-bold text-foreground leading-none outline-none"
                value={typedMinutes()}
                onInput={handleMinutesInput}
                onBlur={handleBlur}
                inputmode="numeric"
                style={{ "font-variant-numeric": "tabular-nums" }}
              />
            </div>
            <Button size="sm-icon" variant="ghost" onClick={() => adjustMinutes(-5)} aria-label="Decrease minutes">
              <Icon name="keyboard_arrow_down" size={18} />
            </Button>
          </div>

          {/* AM/PM Toggle */}
          <div class="flex flex-col items-center gap-2 ml-2" role="radiogroup" aria-label="Time period">
            <Button
              class={cn(
                "w-12 h-[30px] rounded-lg flex flex-col items-center justify-center border transition-all text-[10px] font-black uppercase tracking-widest",
                period() === "AM"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-foreground/[0.03] text-muted-foreground border-foreground/5"
              )}
              onClick={() => setPeriod("AM")}
              variant={period() === "AM" ? "default" : "neutral"}
              size="sm"
              aria-pressed={period() === "AM"}
            >
              AM
            </Button>
            <Button
              class={cn(
                "w-12 h-[30px] rounded-lg flex flex-col items-center justify-center border transition-all text-[10px] font-black uppercase tracking-widest",
                period() === "PM"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-foreground/[0.03] text-muted-foreground border-foreground/5"
              )}
              onClick={() => setPeriod("PM")}
              variant={period() === "PM" ? "default" : "neutral"}
              size="sm"
              aria-pressed={period() === "PM"}
            >
              PM
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div class="mt-6 pt-4 border-t border-foreground/5 flex justify-between items-center px-1">
          <button
            type="button"
            class="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all flex items-center gap-1.5"
            onClick={setCurrentTime}
          >
            <Icon name="history" size={14} />
            Current
          </button>

          <button
            type="button"
            class="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
            onClick={close}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
