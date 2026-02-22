import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  onMount,
  onCleanup,
  Show,
  type ParentProps,
  type Component,
  type Accessor,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";

// ============================================================================
// CONTEXT
// ============================================================================

interface SelectItem {
  id: string;
  value: string | number;
  label?: string;
}

interface SelectContextValue {
  open: Accessor<boolean>;
  direction: Accessor<"up" | "down">;
  selectedValue: Accessor<string | number | undefined>;
  activeIndex: Accessor<number>;
  listboxId: string;
  items: Accessor<SelectItem[]>;
  toggle: () => void;
  close: () => void;
  select: (value: string | number) => void;
  registerItem: (item: SelectItem) => () => void;
  handleKeydown: (e: KeyboardEvent) => void;
  activeDescendantId: Accessor<string | undefined>;
}

const SelectContext = createContext<SelectContextValue>();

function useSelect() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within a Select");
  return ctx;
}

// ============================================================================
// SELECT ROOT
// ============================================================================

export type SelectSize = "sm" | "default" | "lg";

export interface SelectProps<T extends string | number = string | number> extends ParentProps {
  /** Current selected value */
  value?: T;
  /** Called when value changes */
  onChange?: (value: T) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: SelectSize;
  /** Trigger class */
  triggerClass?: string;
  /** Content class */
  contentClass?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label for the select */
  label?: string;
}

let selectIdCounter = 0;

export function Select<T extends string | number = string | number>(props: SelectProps<T>) {
  const [open, setOpen] = createSignal(false);
  const [direction, setDirection] = createSignal<"up" | "down">("down");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [items, setItems] = createSignal<SelectItem[]>([]);
  
  let selectRef: HTMLDivElement | undefined;
  let isMouseDownInside = false;
  const selectId = `select-${++selectIdCounter}`;
  const listboxId = `${selectId}-listbox`;

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

  const toggle = () => {
    if (props.disabled) return;
    
    if (!open() && selectRef) {
      const rect = selectRef.getBoundingClientRect();
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

  const select = (value: string | number) => {
    props.onChange?.(value as T);
    close();
  };

  const registerItem = (item: SelectItem) => {
    setItems((prev) => [...prev, item]);
    return () => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    };
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (!open()) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        if (selectRef) {
          const rect = selectRef.getBoundingClientRect();
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
      close();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(itemList.length - 1);
    }
  };

  // Click outside handler
  const handleClickOutside = (e: MouseEvent) => {
    if (open() && selectRef && !selectRef.contains(e.target as Node)) {
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
      if (!selectRef?.contains(document.activeElement)) {
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

  const contextValue: SelectContextValue = {
    open,
    direction,
    selectedValue: () => props.value,
    activeIndex,
    listboxId,
    items,
    toggle,
    close,
    select,
    registerItem,
    handleKeydown,
    activeDescendantId,
  };

  // Get display label
  const displayLabel = (): string | null => {
    const val = props.value;
    if (val === undefined || val === null) return null;
    
    const item = items().find((i) => i.value === val);
    
    if (item?.label) return item.label;
    return String(val);
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div
        ref={selectRef}
        class="relative w-full"
        onFocusOut={handleFocusOut}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Trigger */}
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open()}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId()}
          aria-label={props.label}
          disabled={props.disabled}
          onClick={toggle}
          onKeyDown={handleKeydown}
          class={cn(
            "flex w-full items-center justify-between rounded-sm border border-input bg-transparent px-3 py-1 text-sm ring-offset-background transition-all",
            "hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            props.size === "sm" && "h-9 px-3",
            props.size === "lg" && "h-11 px-4",
            (!props.size || props.size === "default") && "h-10 px-3",
            props.triggerClass
          )}
        >
          <span class="truncate">
            <Show when={displayLabel()} fallback={
              <span class="text-muted-foreground">{props.placeholder ?? "Select..."}</span>
            }>
              {displayLabel()}
            </Show>
          </span>
          <Icon
            name="expand_more"
            size={28}
            class={cn(
              "flex items-center justify-center opacity-50 transition-all transform-origin-center relative top-px",
              open() && "rotate-180 opacity-100 text-primary"
            )}
          />
        </button>

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
          id={listboxId}
        >
          {props.children}
        </div>
      </div>
    </SelectContext.Provider>
  );
}

// ============================================================================
// SELECT ITEM
// ============================================================================

export interface SelectItemProps extends ParentProps {
  /** Item value */
  value: string | number;
  /** Display label (used in trigger when selected) */
  label?: string;
  /** Additional class */
  class?: string;
}

let itemIdCounter = 0;

export const SelectItem: Component<SelectItemProps> = (props) => {
  const ctx = useSelect();
  const id = `select-item-${++itemIdCounter}`;
  let itemRef: HTMLDivElement | undefined;

  onMount(() => {
    const unregister = ctx.registerItem({
      id,
      value: props.value,
      label: props.label,
    });
    onCleanup(unregister);
  });

  const isSelected = () => {
    const sv = ctx.selectedValue();
    if (sv === undefined) return false;
    return sv === props.value;
  };

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

export { useSelect };
