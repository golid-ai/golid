import {
  createSignal,
  createMemo,
  onMount,
  onCleanup,
  Show,
  type Component,
  type JSX,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";
import { Calendar, type DateRange } from "~/components/atoms/Calendar";

// ============================================================================
// TYPES
// ============================================================================

export type DateRangePickerSize = "sm" | "default" | "lg";

export interface DateRangePickerProps {
  /** Current selected date range */
  value?: DateRange | null;
  /** Called when date range changes */
  onChange?: (range: DateRange | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: DateRangePickerSize;
  /** Additional class */
  class?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label for the date range picker */
  label?: string;
  /** Custom trigger element - receives open state and toggle function */
  trigger?: (props: { open: boolean; toggle: () => void; displayValue: string }) => JSX.Element;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DateRangePicker: Component<DateRangePickerProps> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [direction, setDirection] = createSignal<"up" | "down">("down");

  let containerRef: HTMLDivElement | undefined;
  let isMouseDownInside = false;

  const calculateDirection = () => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const navHeight = 80;
    const menuHeight = 380;
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

  const handleSelect = (date: Date | DateRange | null, shouldClose = true) => {
    if (date === null) {
      props.onChange?.(null);
    } else if (!(date instanceof Date)) {
      props.onChange?.(date);
      // Close when range is complete (both start and end selected)
      if (shouldClose && date.start && date.end) {
        close();
      }
    }
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const formattedRange = createMemo(() => {
    if (!props.value?.start) return "";
    if (!props.value.end) return formatDate(props.value.start) + " - ...";
    return `${formatDate(props.value.start)} - ${formatDate(props.value.end)}`;
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
            onKeyDown={(e) => {
              if (!open() && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                toggle();
              }
            }}
            disabled={props.disabled}
            class={cn(
              "flex w-full items-center justify-between rounded-sm border border-input bg-transparent text-left text-sm ring-offset-background transition-all",
              "hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[props.size || "default"],
              !props.value?.start && "text-muted-foreground",
              props.class
            )}
            aria-haspopup="dialog"
            aria-expanded={open()}
            aria-label={props.label}
          >
            <span class="truncate">
              {formattedRange() || props.placeholder || "Select dates..."}
            </span>
            <Icon
              name="date_range"
              size={18}
              class={cn("ml-2 opacity-50 transition-all", open() && "opacity-100 text-primary")}
            />
          </button>
        }
      >
        {props.trigger?.({ open: open(), toggle, displayValue: formattedRange() })}
      </Show>

      {/* Content - absolute positioning like Select/MultiSelect */}
      <div
        class={cn(
          "absolute z-[60] w-[280px] rounded-sm border border-foreground/10 dark:border-white/10 bg-background dark:bg-card shadow-2xl overflow-hidden",
          direction() === "up" ? "bottom-full mb-2 origin-bottom" : "mt-2 origin-top",
          open() ? "animate-in fade-in-0 zoom-in-95" : "hidden"
        )}
      >
        <Calendar
          value={props.value}
          mode="range"
          onSelect={handleSelect}
          autoFocus={open()}
          class="border-none shadow-none bg-transparent"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
