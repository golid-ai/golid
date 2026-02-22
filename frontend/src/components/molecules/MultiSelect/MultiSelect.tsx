import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
  type ParentProps,
  type Component,
  type Accessor,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";
import { Chip } from "~/components/atoms/Chip";

// ============================================================================
// CONTEXT
// ============================================================================

interface MultiSelectItem {
  id: string;
  value: string | number;
  label?: string;
}

interface MultiSelectContextValue {
  open: Accessor<boolean>;
  direction: Accessor<"up" | "down">;
  values: Accessor<(string | number)[]>;
  activeIndex: Accessor<number>;
  listboxId: string;
  items: Accessor<MultiSelectItem[]>;
  toggle: () => void;
  close: () => void;
  select: (value: string | number) => void;
  areEqual: (a: string | number, b: string | number) => boolean;
  registerItem: (item: MultiSelectItem) => () => void;
  handleKeydown: (e: KeyboardEvent) => void;
  activeDescendantId: Accessor<string | undefined>;
}

const MultiSelectContext = createContext<MultiSelectContextValue>();

function useMultiSelect() {
  const ctx = useContext(MultiSelectContext);
  if (!ctx) throw new Error("MultiSelect components must be used within a MultiSelect");
  return ctx;
}

// ============================================================================
// MULTI SELECT ROOT
// ============================================================================

export type MultiSelectSize = "sm" | "default" | "lg";

export interface MultiSelectProps<T extends string | number = string | number> extends ParentProps {
  /** Current selected values */
  value?: T[];
  /** Called when values change */
  onChange?: (values: T[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: MultiSelectSize;
  /** Maximum chips to display before "+X more" */
  maxChips?: number;
  /** Trigger class */
  triggerClass?: string;
  /** Content class */
  contentClass?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label for the multi-select */
  label?: string;
}

let multiSelectIdCounter = 0;

export function MultiSelect<T extends string | number = string | number>(props: MultiSelectProps<T>) {
  const [open, setOpen] = createSignal(false);
  const [direction, setDirection] = createSignal<"up" | "down">("down");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [items, setItems] = createSignal<MultiSelectItem[]>([]);

  let containerRef: HTMLDivElement | undefined;
  let isMouseDownInside = false;
  const listboxId = `multiselect-listbox-${++multiSelectIdCounter}`;

  const areEqual = (a: string | number, b: string | number): boolean => {
    return a === b;
  };

  const toggle = () => {
    if (props.disabled) return;

    if (!open() && containerRef) {
      const rect = containerRef.getBoundingClientRect();
      const navHeight = 80;
      const menuHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top - navHeight;
      setDirection(spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down");
    }
    setOpen(!open());
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const select = (itemValue: string | number) => {
    const currentValues = props.value || [];
    const isSelected = currentValues.some((v) => areEqual(v as string | number, itemValue));

    if (isSelected) {
      props.onChange?.(currentValues.filter((v) => !areEqual(v as string | number, itemValue)) as T[]);
    } else {
      props.onChange?.([...currentValues, itemValue] as T[]);
    }
  };

  const registerItem = (item: MultiSelectItem) => {
    setItems((prev) => [...prev, item]);
    return () => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    };
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (!open()) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        if (containerRef) {
          const rect = containerRef.getBoundingClientRect();
          const navHeight = 80;
          const menuHeight = 320;
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top - navHeight;
          setDirection(spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down");
        }
        setOpen(true);
        if (e.key === "ArrowDown") setActiveIndex(0);
        if (e.key === "ArrowUp") setActiveIndex(items().length - 1);
      }
      return;
    }

    const itemList = items();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % itemList.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + itemList.length) % itemList.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const idx = activeIndex();
      if (idx !== -1 && itemList[idx]) {
        select(itemList[idx].value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(items().length - 1);
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

  // Compute active descendant ID for aria-activedescendant
  const activeDescendantId = () => {
    const idx = activeIndex();
    if (idx === -1) return undefined;
    const itemList = items();
    if (idx >= 0 && idx < itemList.length) {
      return itemList[idx].id;
    }
    return undefined;
  };

  const contextValue: MultiSelectContextValue = {
    open,
    direction,
    values: () => (props.value || []) as (string | number)[],
    activeIndex,
    listboxId,
    items,
    toggle,
    close,
    select,
    areEqual,
    registerItem,
    handleKeydown,
    activeDescendantId,
  };

  const maxChips = () => props.maxChips ?? 3;
  const displayedValues = () => (props.value || []).slice(0, maxChips());
  const remainingCount = () => Math.max(0, (props.value || []).length - maxChips());

  const getItemLabel = (value: string | number) => {
    const item = items().find((i) => areEqual(i.value, value));
    return item?.label || String(value);
  };

  const removeValue = (e: MouseEvent, itemValue: string | number) => {
    e.stopPropagation();
    select(itemValue);
  };

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        class="relative w-full"
        onFocusOut={handleFocusOut}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Trigger */}
        <div
          role="combobox"
          tabindex="0"
          aria-haspopup="listbox"
          aria-expanded={open()}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId()}
          aria-label={props.label}
          onClick={toggle}
          onKeyDown={handleKeydown}
          class={cn(
            "flex w-full items-center justify-between rounded-sm border border-input bg-transparent px-3 py-1 text-sm ring-offset-background transition-all",
            "hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            props.size === "sm" && "min-h-9 py-0.5",
            props.size === "lg" && "min-h-11 py-1.5",
            (!props.size || props.size === "default") && "min-h-10",
            props.triggerClass
          )}
        >
          <div class="flex flex-wrap gap-1.5 py-0.5">
            <Show
              when={(props.value || []).length > 0}
              fallback={<span class="text-muted-foreground">{props.placeholder ?? "Select..."}</span>}
            >
              <For each={displayedValues()}>
                {(itemValue) => (
                  <Chip
                    variant="default"
                    size="sm"
                    class="gap-1 pr-1 h-5 transition-all rounded-[3px] shadow-sm"
                  >
                    <span class="truncate max-w-[150px] font-bold px-0.5 text-[9px] uppercase tracking-wider">
                      {getItemLabel(itemValue)}
                    </span>
                    <button
                      tabindex="-1"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => removeValue(e, itemValue)}
                      class="flex items-center justify-center rounded-sm hover:bg-white/20 p-0.5 transition-colors"
                    >
                      <Icon name="close" size={9} />
                    </button>
                  </Chip>
                )}
              </For>
              <Show when={remainingCount() > 0}>
                <Chip
                  variant="neutral"
                  size="sm"
                  class="h-5 px-1.5 rounded-[3px] shadow-sm bg-foreground/10 text-[9px] font-bold uppercase tracking-wider border-none"
                >
                  +{remainingCount()} more
                </Chip>
              </Show>
            </Show>
          </div>
          <Icon
            name="expand_more"
            size={28}
            class={cn(
              "flex items-center justify-center opacity-50 transition-all duration-300 relative top-px ml-2",
              open() && "rotate-180 opacity-100 text-primary"
            )}
          />
        </div>

        {/* Content - always render children for item registration, but only show visually when open */}
        <div
          class={cn(
            "absolute z-[60] w-full rounded-sm border border-foreground/10 dark:border-white/10 backdrop-blur-lg text-popover-foreground p-2 max-h-[244px] overflow-y-auto shadow-2xl",
            "bg-background/95 dark:bg-card/95",
            direction() === "up" ? "bottom-full mb-2 origin-bottom" : "mt-2 origin-top",
            open() ? "animate-in fade-in-0 zoom-in-95" : "hidden",
            props.contentClass
          )}
          role="listbox"
          aria-multiselectable="true"
          id={listboxId}
        >
          {props.children}
        </div>
      </div>
    </MultiSelectContext.Provider>
  );
}

// ============================================================================
// MULTI SELECT ITEM
// ============================================================================

export interface MultiSelectItemProps extends ParentProps {
  /** Item value */
  value: string | number;
  /** Display label (used in trigger chips when selected) */
  label?: string;
  /** Additional class */
  class?: string;
}

let multiSelectItemIdCounter = 0;

export const MultiSelectItem: Component<MultiSelectItemProps> = (props) => {
  const ctx = useMultiSelect();
  const id = `multiselect-item-${++multiSelectItemIdCounter}`;
  let itemRef: HTMLDivElement | undefined;

  onMount(() => {
    const unregister = ctx.registerItem({
      id,
      value: props.value,
      label: props.label,
    });
    onCleanup(unregister);
  });

  const isSelected = () => ctx.values().some((v) => ctx.areEqual(v, props.value));
  const index = () => ctx.items().findIndex((i) => i.id === id);
  const isActive = () => ctx.activeIndex() === index();

  // Scroll into view when active
  createEffect(() => {
    if (isActive() && itemRef) {
      itemRef.scrollIntoView({ block: "nearest" });
    }
  });

  return (
    <div
      ref={itemRef}
      id={id}
      class={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-10 pr-2 text-sm font-medium outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "hover:bg-foreground/[0.05] transition-colors",
        isActive() && "bg-foreground/[0.08]",
        props.class
      )}
      onClick={() => ctx.select(props.value)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          ctx.select(props.value);
        }
      }}
      role="option"
      aria-selected={isSelected()}
      tabindex={isActive() ? 0 : -1}
    >
      <Show when={isSelected()}>
        <span class="absolute left-2.5 flex items-center justify-center">
          <Icon name="check" class="text-xl text-primary" />
        </span>
      </Show>
      <span class={cn("transition-all ml-1", isSelected() && "text-primary font-semibold")}>
        {props.children}
      </span>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { useMultiSelect };
