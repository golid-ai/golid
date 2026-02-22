import {
  createContext,
  useContext,
  type ParentProps,
  type Component,
  type Accessor,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";

// ============================================================================
// TYPES
// ============================================================================

export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupVariant = "default" | "secondary" | "outline";
export type ToggleGroupSize = "default" | "xs" | "sm" | "lg" | "icon";

export interface ToggleGroupProps extends ParentProps {
  /** Selection type */
  type?: ToggleGroupType;
  /** Current value (string for single, string[] for multiple) */
  value?: string | string[] | null;
  /** Size of toggle items */
  size?: ToggleGroupSize;
  /** Visual variant */
  variant?: ToggleGroupVariant;
  /** Additional class */
  class?: string;
  /** Accessible label for the toggle group */
  label?: string;
  /** Change handler */
  onChange?: (value: string | string[] | null) => void;
}

export interface ToggleGroupItemProps extends ParentProps {
  /** Item value */
  value: string;
  /** Aria label */
  ariaLabel?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show check icon when selected */
  indicator?: boolean;
  /** Additional class */
  class?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ToggleGroupContextValue {
  value: Accessor<string | string[] | null | undefined>;
  size: Accessor<ToggleGroupSize>;
  variant: Accessor<ToggleGroupVariant>;
  updateValue: (itemValue: string) => void;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>();

const useToggleGroup = () => {
  const ctx = useContext(ToggleGroupContext);
  if (!ctx) throw new Error("ToggleGroupItem must be used within ToggleGroup");
  return ctx;
};

// ============================================================================
// TOGGLE GROUP
// ============================================================================

export const ToggleGroup: Component<ToggleGroupProps> = (props) => {
  const type = () => props.type ?? "single";
  const size = () => props.size ?? "default";
  const variant = () => props.variant ?? "default";

  const updateValue = (itemValue: string) => {
    if (type() === "single") {
      // Toggle logic for single
      if (props.value === itemValue) {
        props.onChange?.(null);
      } else {
        props.onChange?.(itemValue);
      }
    } else {
      // Multiple
      const current = Array.isArray(props.value) ? props.value : [];
      if (current.includes(itemValue)) {
        props.onChange?.(current.filter((v) => v !== itemValue));
      } else {
        props.onChange?.([...current, itemValue]);
      }
    }
  };

  const contextValue: ToggleGroupContextValue = {
    value: () => props.value,
    size,
    variant,
    updateValue,
  };

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <div
        class={cn(
          "inline-flex -space-x-px rounded-sm shadow-sm isolate overflow-x-auto max-w-full",
          props.class
        )}
        role="group"
        aria-label={props.label}
        style={{ "scrollbar-width": "none" }}
      >
        {props.children}
      </div>
    </ToggleGroupContext.Provider>
  );
};

// ============================================================================
// TOGGLE GROUP ITEM
// ============================================================================

const variantStyles = {
  default: {
    selected: "bg-cta-blue/10 text-cta-blue z-10 hover:bg-cta-blue/20",
    unselected: "hover:bg-muted/50",
    focus: "focus-visible:bg-neutral focus-visible:text-neutral-foreground",
  },
  secondary: {
    selected: "bg-danger/10 text-danger z-10 hover:bg-danger/20",
    unselected: "hover:bg-muted/50",
    focus: "focus-visible:bg-neutral focus-visible:text-neutral-foreground",
  },
  outline: {
    selected: "bg-muted text-foreground z-10",
    unselected: "hover:bg-muted/50",
    focus: "focus-visible:bg-neutral focus-visible:text-neutral-foreground",
  },
};

export const ToggleGroupItem: Component<ToggleGroupItemProps> = (props) => {
  const ctx = useToggleGroup();
  const indicator = () => props.indicator ?? true;

  const isSelected = () => {
    const v = ctx.value();
    if (Array.isArray(v)) {
      return v.includes(props.value);
    }
    return v === props.value;
  };

  const currentStyles = () =>
    variantStyles[ctx.variant()] || variantStyles.default;

  // Map ToggleGroup sizes to Button sizes
  const buttonSize = () => {
    const s = ctx.size();
    if (s === "icon") return "sm-icon";
    if (s === "xs") return "xs";
    if (s === "sm") return "sm";
    if (s === "lg") return "lg";
    return "default";
  };

  return (
    <Button
      variant="outline"
      size={buttonSize()}
      class={cn(
        "rounded-none first:rounded-l-sm last:rounded-r-sm focus:z-20 shrink-0 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        isSelected() ? currentStyles().selected : currentStyles().unselected,
        currentStyles().focus,
        props.class
      )}
      onClick={() => ctx.updateValue(props.value)}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      aria-pressed={isSelected()}
    >
      {isSelected() && indicator() && (
        <Icon name="check" class="mr-2 text-lg" />
      )}
      {props.children}
    </Button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ToggleGroup;
