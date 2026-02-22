import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  createMemo,
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

// ============================================================================
// TYPES
// ============================================================================

export interface ComboboxItem {
  label: string;
  value: string | number;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ComboboxContextValue {
  open: Accessor<boolean>;
  direction: Accessor<"up" | "down">;
  query: Accessor<string>;
  filtered: Accessor<ComboboxItem[]>;
  selectedValue: Accessor<string | number | undefined>;
  activeIndex: Accessor<number>;
  listboxId: string;
  toggle: () => void;
  close: () => void;
  openMenu: () => void;
  setQuery: (value: string) => void;
  select: (value: string | number) => void;
  handleKeydown: (e: KeyboardEvent) => void;
}

const ComboboxContext = createContext<ComboboxContextValue>();

function useCombobox() {
  const ctx = useContext(ComboboxContext);
  if (!ctx) throw new Error("Combobox components must be used within a Combobox");
  return ctx;
}

// ============================================================================
// COMBOBOX ROOT
// ============================================================================

export type ComboboxSize = "sm" | "default" | "lg";

export interface ComboboxProps<T extends string | number = string | number> {
  /** List of items to search through */
  items: ComboboxItem[];
  /** Current selected value */
  value?: T;
  /** Called when value changes */
  onChange?: (value: T) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: ComboboxSize;
  /** Additional class for the trigger */
  class?: string;
  /** Disabled state */
  disabled?: boolean;
}

let comboboxIdCounter = 0;

export function Combobox<T extends string | number = string | number>(props: ComboboxProps<T>) {
  const [open, setOpen] = createSignal(false);
  const [direction, setDirection] = createSignal<"up" | "down">("down");
  const [query, setQuerySignal] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(-1);

  let comboboxRef: HTMLDivElement | undefined;
  let isMouseDownInside = false;
  const listboxId = `combobox-listbox-${++comboboxIdCounter}`;

  // Filter items based on query
  const filtered = createMemo(() => {
    const q = query().toLowerCase();
    if (q === "") return props.items || [];
    return (props.items || []).filter((item) =>
      item.label.toLowerCase().includes(q)
    );
  });

  // Reset active index when filtered items change
  createEffect(() => {
    filtered();
    setActiveIndex(-1);
  });

  // Sync query with selected value when closed
  createEffect(() => {
    if (open()) return;
    const selectedItem = (props.items || []).find((item) => item.value === props.value);
    if (selectedItem && selectedItem.value !== null) {
      setQuerySignal(selectedItem.label);
    } else {
      setQuerySignal("");
    }
  });

  const calculateDirection = () => {
    if (!comboboxRef) return;
    const rect = comboboxRef.getBoundingClientRect();
    const navHeight = 80;
    const menuHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top - navHeight;
    setDirection(spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down");
  };

  const toggle = () => {
    if (props.disabled) return;
    if (!open()) {
      calculateDirection();
      setQuerySignal("");
    }
    setOpen(!open());
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const openMenu = () => {
    if (props.disabled || open()) return;
    calculateDirection();
    setOpen(true);
    setQuerySignal("");
  };

  const setQuery = (value: string) => {
    setQuerySignal(value);
  };

  const select = (value: string | number) => {
    props.onChange?.(value as T);
    close();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const items = filtered();
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open()) openMenu();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open()) openMenu();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeIndex();
      if (idx >= 0 && items[idx]) {
        select(items[idx].value);
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  // Click outside handler
  const handleClickOutside = (e: MouseEvent) => {
    if (open() && comboboxRef && !comboboxRef.contains(e.target as Node)) {
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
      if (!comboboxRef?.contains(document.activeElement)) {
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

  const contextValue: ComboboxContextValue = {
    open,
    direction,
    query,
    filtered,
    selectedValue: () => props.value,
    activeIndex,
    listboxId,
    toggle,
    close,
    openMenu,
    setQuery,
    select,
    handleKeydown,
  };

  const handleInput = (e: Event) => {
    setQuery((e.target as HTMLInputElement).value);
    if (!open()) {
      openMenu();
    }
  };

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div
        ref={comboboxRef}
        class="relative w-full"
        onFocusOut={handleFocusOut}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Trigger/Input */}
        <label
          class={cn(
            "flex w-full items-center justify-between rounded-sm border border-input bg-transparent px-3 py-1 text-sm ring-offset-background transition-all",
            "hover:border-foreground/30 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            props.size === "sm" && "h-9 px-3",
            props.size === "lg" && "h-11 px-4",
            (!props.size || props.size === "default") && "h-10 px-3",
            props.class
          )}
        >
          <input
            type="text"
            value={query()}
            onInput={handleInput}
            onFocus={openMenu}
            onKeyDown={handleKeydown}
            placeholder={props.placeholder ?? "Search..."}
            disabled={props.disabled}
            class="w-full bg-transparent border-0 p-0 h-auto focus:outline-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground"
            spellcheck={false}
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={open()}
            aria-autocomplete="list"
            autocomplete="off"
          />
          <div class="flex items-center">
            <Icon
              name="expand_more"
              size={28}
              class={cn(
                "flex items-center justify-center opacity-50 transition-all transform-origin-center",
                open() && "rotate-180 opacity-100 text-primary"
              )}
            />
          </div>
        </label>

        {/* Content */}
        <div
          class={cn(
            "absolute z-[60] w-full rounded-sm border border-foreground/10 dark:border-white/10 backdrop-blur-lg text-popover-foreground p-2 max-h-[244px] overflow-y-auto shadow-2xl",
            "bg-background/95 dark:bg-card/95",
            direction() === "up" ? "bottom-full mb-2 origin-bottom" : "mt-2 origin-top",
            open() ? "animate-in fade-in-0 zoom-in-95" : "hidden"
          )}
          role="listbox"
          id={listboxId}
        >
          <Show
            when={filtered().length > 0}
            fallback={
              <div class="p-2 text-center text-sm text-muted-foreground">No items found.</div>
            }
          >
            <For each={filtered()}>
              {(item, index) => (
                <ComboboxItem value={item.value} index={index()}>
                  {item.label}
                </ComboboxItem>
              )}
            </For>
          </Show>
        </div>
      </div>
    </ComboboxContext.Provider>
  );
}

// ============================================================================
// COMBOBOX ITEM
// ============================================================================

interface ComboboxItemProps extends ParentProps {
  value: string | number;
  index: number;
  class?: string;
}

const ComboboxItem: Component<ComboboxItemProps> = (props) => {
  const ctx = useCombobox();
  let itemRef: HTMLDivElement | undefined;

  const isSelected = () => ctx.selectedValue() === props.value;
  const isActive = () => ctx.activeIndex() === props.index;

  // Scroll into view when active
  createEffect(() => {
    if (isActive() && itemRef) {
      itemRef.scrollIntoView({ block: "nearest" });
    }
  });

  return (
    <div
      ref={itemRef}
      class={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-10 pr-2 text-sm font-medium outline-none",
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

export { useCombobox };
