import {
  createSignal,
  createEffect,
  createMemo,
  For,
  Show,
  type Component,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export type CalendarMode = "single" | "range";

export interface CalendarProps {
  /** Selected value - single Date or DateRange */
  value?: Date | DateRange | null;
  /** Selection mode */
  mode?: CalendarMode;
  /** Additional class */
  class?: string;
  /** Callback when date is selected */
  onSelect?: (date: Date | DateRange | null, shouldClose?: boolean) => void;
  /** Auto-focus the calendar grid on mount for keyboard navigation */
  autoFocus?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ============================================================================
// COMPONENT
// ============================================================================

export const Calendar: Component<CalendarProps> = (props) => {
  const mode = () => props.mode || "single";

  // Get initial view date from value
  const getInitialViewDate = () => {
    if (mode() === "single" && props.value instanceof Date) return props.value;
    if (mode() === "range" && (props.value as DateRange)?.start) {
      return (props.value as DateRange).start!;
    }
    return new Date();
  };

  const [viewDate, setViewDate] = createSignal(getInitialViewDate());
  const [focusedDate, setFocusedDate] = createSignal<Date>(getInitialViewDate());
  const [showMonthSelector, setShowMonthSelector] = createSignal(false);
  const [showYearSelector, setShowYearSelector] = createSignal(false);

  let gridRef: HTMLDivElement | undefined;
  let monthSelectorRef: HTMLDivElement | undefined;
  let yearSelectorRef: HTMLDivElement | undefined;
  let monthButtonRef: HTMLButtonElement | undefined;
  let yearButtonRef: HTMLButtonElement | undefined;

  // Sync view date and focused date with value changes
  createEffect(() => {
    const initial = getInitialViewDate();
    setViewDate(initial);
    setFocusedDate(initial);
  });

  // Focus the current month button when month selector opens
  createEffect(() => {
    if (showMonthSelector() && monthSelectorRef) {
      requestAnimationFrame(() => {
        const selectedBtn = monthSelectorRef?.querySelector('[data-selected="true"]') as HTMLButtonElement;
        if (selectedBtn) {
          selectedBtn.focus();
        }
      });
    }
  });

  // Scroll to and focus the selected year when year selector opens
  createEffect(() => {
    if (showYearSelector() && yearSelectorRef) {
      requestAnimationFrame(() => {
        const selectedBtn = yearSelectorRef?.querySelector('[data-selected="true"]') as HTMLButtonElement;
        if (selectedBtn) {
          selectedBtn.scrollIntoView({ block: "center", behavior: "instant" });
          selectedBtn.focus();
        }
      });
    }
  });

  // Expose focus method for parent components
  const focusGrid = () => {
    requestAnimationFrame(() => {
      gridRef?.focus();
    });
  };

  // Auto-focus when autoFocus prop changes to true (used by DatePicker when opening)
  createEffect(() => {
    if (props.autoFocus) {
      focusGrid();
    }
  });

  const currentMonth = () => viewDate().getMonth();
  const currentYear = () => viewDate().getFullYear();

  // Generate years for selector (50 years before and after current)
  const years = createMemo(() => {
    const startYear = new Date().getFullYear() - 50;
    return Array.from({ length: 101 }, (_, i) => startYear + i);
  });

  // Generate calendar days
  const calendarDays = createMemo(() => {
    const year = currentYear();
    const month = currentMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: month - 1, year, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }

    // Next month days (fill to 42 total = 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
    }

    return days;
  });

  const nextMonth = () => setViewDate(new Date(currentYear(), currentMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(currentYear(), currentMonth() - 1, 1));

  const selectMonth = (month: number, e?: MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setViewDate(new Date(currentYear(), month, 1));
    setShowMonthSelector(false);
    // Refocus the month button to keep focus within the calendar
    requestAnimationFrame(() => {
      monthButtonRef?.focus();
    });
  };

  const selectYear = (year: number, e?: MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setViewDate(new Date(year, currentMonth(), 1));
    setShowYearSelector(false);
    // Refocus the year button to keep focus within the calendar
    requestAnimationFrame(() => {
      yearButtonRef?.focus();
    });
  };

  const selectDate = (day: number, month: number, year: number) => {
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);

    if (mode() === "single") {
      props.onSelect?.(clickedDate);
    } else {
      const range = (props.value as DateRange) || { start: null, end: null };
      if (!range.start || (range.start && range.end)) {
        props.onSelect?.({ start: clickedDate, end: null }, false);
      } else {
        const start = new Date(range.start);
        start.setHours(0, 0, 0, 0);
        if (clickedDate < start) {
          props.onSelect?.({ start: clickedDate, end: start });
        } else {
          props.onSelect?.({ start, end: clickedDate });
        }
      }
    }
  };

  const isSelected = (day: number, month: number, year: number) => {
    const d = new Date(year, month, day).toDateString();
    if (mode() === "single") {
      if (!(props.value instanceof Date)) return false;
      return props.value.toDateString() === d;
    } else {
      const range = props.value as DateRange;
      return range?.start?.toDateString() === d || range?.end?.toDateString() === d;
    }
  };

  const isInRange = (day: number, month: number, year: number) => {
    if (mode() !== "range") return false;
    const range = props.value as DateRange;
    if (!range?.start || !range?.end) return false;

    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const start = new Date(range.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);

    return d > start && d < end;
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const handleTodayClick = () => {
    const today = new Date();
    if (mode() === "single") {
      props.onSelect?.(today, false);
    } else {
      props.onSelect?.({ start: today, end: null }, false);
    }
    setViewDate(today);
  };

  const handleClearClick = () => {
    if (mode() === "single") {
      props.onSelect?.(null, false);
    } else {
      props.onSelect?.({ start: null, end: null }, false);
    }
  };

  const hasValue = () => {
    if (mode() === "single") return props.value instanceof Date;
    return (props.value as DateRange)?.start != null;
  };

  const isFocused = (day: number, month: number, year: number) => {
    const f = focusedDate();
    return f.getDate() === day && f.getMonth() === month && f.getFullYear() === year;
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (showMonthSelector() || showYearSelector()) return;

    const current = focusedDate();
    let newDate = new Date(current);

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newDate.setDate(current.getDate() - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        newDate.setDate(current.getDate() + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        newDate.setDate(current.getDate() - 7);
        break;
      case "ArrowDown":
        e.preventDefault();
        newDate.setDate(current.getDate() + 7);
        break;
      case "Home":
        e.preventDefault();
        newDate = new Date(current.getFullYear(), current.getMonth(), 1);
        break;
      case "End":
        e.preventDefault();
        newDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        break;
      case "PageUp":
        e.preventDefault();
        if (e.shiftKey) {
          newDate.setFullYear(current.getFullYear() - 1);
        } else {
          newDate.setMonth(current.getMonth() - 1);
        }
        break;
      case "PageDown":
        e.preventDefault();
        if (e.shiftKey) {
          newDate.setFullYear(current.getFullYear() + 1);
        } else {
          newDate.setMonth(current.getMonth() + 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectDate(current.getDate(), current.getMonth(), current.getFullYear());
        return;
      default:
        return;
    }

    setFocusedDate(newDate);
    // Update view if focused date is in a different month
    if (newDate.getMonth() !== currentMonth() || newDate.getFullYear() !== currentYear()) {
      setViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  return (
    <div class={cn("p-4 w-[280px] bg-transparent text-foreground select-none relative", props.class)}>
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-1">
          <Button
            ref={monthButtonRef}
            variant="ghost"
            size="sm"
            class={cn(
              "text-sm font-bold text-foreground hover:bg-foreground/5 px-1.5 py-0.5 h-auto transition-colors",
              showMonthSelector() && "bg-primary/10 text-primary"
            )}
            onClick={() => { setShowMonthSelector(!showMonthSelector()); setShowYearSelector(false); }}
          >
            {MONTH_NAMES[currentMonth()]}
          </Button>
          <Button
            ref={yearButtonRef}
            variant="ghost"
            size="sm"
            class={cn(
              "text-sm font-bold text-foreground hover:bg-foreground/5 px-1.5 py-0.5 h-auto transition-colors opacity-50",
              showYearSelector() && "bg-primary/10 text-primary opacity-100"
            )}
            onClick={() => { setShowYearSelector(!showYearSelector()); setShowMonthSelector(false); }}
          >
            {currentYear()}
          </Button>
        </div>
        <div class="flex gap-1">
          <Button size="sm-icon" variant="ghost" onClick={prevMonth} aria-label="Previous month">
            <Icon name="chevron_left" size={18} />
          </Button>
          <Button size="sm-icon" variant="ghost" onClick={nextMonth} aria-label="Next month">
            <Icon name="chevron_right" size={18} />
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Show when={showMonthSelector()}>
        <div
          ref={monthSelectorRef}
          class="absolute inset-0 z-30 bg-background/95 dark:bg-card/95 border border-foreground/10 dark:border-white/10 backdrop-blur-lg p-4 rounded-sm grid grid-cols-3 gap-2 overflow-hidden"
        >
          <For each={MONTH_NAMES}>
            {(month, i) => (
              <Button
                variant={currentMonth() === i() ? "default" : "ghost"}
                size="sm"
                data-selected={currentMonth() === i()}
                class={cn(
                  "aspect-square rounded-sm transition-all w-full h-auto flex flex-col items-center justify-center p-0",
                  currentMonth() !== i() && "!text-foreground/60"
                )}
                onClick={(e) => selectMonth(i(), e)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    selectMonth(i(), e);
                  }
                }}
              >
                {month.substring(0, 3)}
              </Button>
            )}
          </For>
        </div>
      </Show>

      {/* Year Selector */}
      <Show when={showYearSelector()}>
        <div
          ref={yearSelectorRef}
          class="absolute inset-0 z-30 bg-background/95 dark:bg-card/95 border border-foreground/10 dark:border-white/10 backdrop-blur-lg p-4 rounded-sm grid grid-cols-3 gap-3 overflow-y-auto overflow-x-hidden"
        >
          <For each={years()}>
            {(year) => (
              <Button
                variant={currentYear() === year ? "default" : "ghost"}
                size="sm"
                data-selected={currentYear() === year}
                class={cn(
                  "h-9 rounded-sm transition-all w-full text-[13px] flex flex-col items-center justify-center p-0",
                  currentYear() !== year && "!text-foreground/60"
                )}
                onClick={(e) => selectYear(year, e)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    selectYear(year, e);
                  }
                }}
              >
                {year}
              </Button>
            )}
          </For>
        </div>
      </Show>

      {/* Day headers */}
      <div class="grid grid-cols-7 mb-2">
        <For each={DAYS_OF_WEEK}>
          {(day) => (
            <div class="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center py-1">
              {day}
            </div>
          )}
        </For>
      </div>

      {/* Calendar grid */}
      <div 
        ref={gridRef}
        class="grid grid-cols-7 gap-y-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        tabindex="0"
        role="grid"
        aria-label="Calendar"
        onKeyDown={handleKeyDown}
      >
        <For each={calendarDays()}>
          {({ day, month, year, isCurrentMonth }) => (
            <div class="relative flex items-center justify-center h-8" role="gridcell">
              <Show when={isInRange(day, month, year)}>
                <div class="absolute inset-x-0 h-full bg-primary/10 -z-0" />
              </Show>
              <Button
                variant={isSelected(day, month, year) ? "default" : "ghost"}
                size="sm-icon"
                tabindex="-1"
                class={cn(
                  "h-8 w-8 text-xs flex items-center justify-center rounded-sm transition-all relative z-10",
                  !isSelected(day, month, year) && (isCurrentMonth ? "" : "opacity-30"),
                  isSelected(day, month, year) && "font-bold",
                  isFocused(day, month, year) && !isSelected(day, month, year) && "ring-2 ring-ring ring-offset-1",
                  isToday(day, month, year) && !isSelected(day, month, year) && 
                    "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                )}
                onClick={() => selectDate(day, month, year)}
                aria-selected={isSelected(day, month, year)}
              >
                {day}
              </Button>
            </div>
          )}
        </For>
      </div>

      {/* Footer */}
      <div class="mt-4 pt-4 border-t border-foreground/5 flex justify-between items-center px-0.5">
        <Button
          variant="ghost"
          size="sm"
          class="text-[10px] font-black uppercase tracking-[0.15em] text-primary px-2 h-7"
          onClick={handleTodayClick}
        >
          Today
        </Button>
        <Show when={hasValue()}>
          <Button
            variant="ghost"
            size="sm"
            class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-danger px-2 h-7"
            onClick={handleClearClick}
          >
            Clear
          </Button>
        </Show>
      </div>
    </div>
  );
};

export default Calendar;
