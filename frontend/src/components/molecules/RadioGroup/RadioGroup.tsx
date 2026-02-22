import {
  createContext,
  useContext,
  createSignal,
  onMount,
  onCleanup,
  Show,
  type ParentProps,
  type Component,
  type Accessor,
} from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// CONTEXT
// ============================================================================

interface RadioRegistration {
  value: string | number;
  disabled: boolean;
  element: HTMLButtonElement;
}

interface RadioGroupContextValue {
  selectedValue: Accessor<string | number | undefined>;
  select: (value: string | number) => void;
  registerRadio: (reg: RadioRegistration) => () => void;
  radios: Accessor<RadioRegistration[]>;
  handleKeyDown: (e: KeyboardEvent, value: string | number) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue>();

function useRadioGroup() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioGroupItem must be used within a RadioGroup");
  return ctx;
}

// ============================================================================
// RADIO GROUP
// ============================================================================

export interface RadioGroupProps<T extends string | number = string | number> extends ParentProps {
  /** Current selected value */
  value?: T;
  /** Called when value changes */
  onChange?: (value: T) => void;
  /** Accessible label for the radio group */
  label: string;
  /** Additional class */
  class?: string;
}

export function RadioGroup<T extends string | number = string | number>(props: RadioGroupProps<T>) {
  const [radios, setRadios] = createSignal<RadioRegistration[]>([]);

  const select = (value: string | number) => {
    props.onChange?.(value as T);
  };

  const registerRadio = (reg: RadioRegistration) => {
    setRadios((prev) => [...prev, reg]);
    return () => {
      setRadios((prev) => prev.filter((r) => r.element !== reg.element));
    };
  };

  /** WAI-ARIA radio group keyboard navigation */
  const handleKeyDown = (e: KeyboardEvent, currentValue: string | number) => {
    const allRadios = radios();
    const enabledRadios = allRadios.filter((r) => !r.disabled);
    const currentIndex = enabledRadios.findIndex((r) => r.value === currentValue);
    if (currentIndex === -1) return;

    let targetIndex: number | null = null;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % enabledRadios.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + enabledRadios.length) % enabledRadios.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = enabledRadios.length - 1;
    }

    if (targetIndex !== null) {
      const target = enabledRadios[targetIndex];
      select(target.value);
      target.element.focus();
    }
  };

  const contextValue: RadioGroupContextValue = {
    selectedValue: () => props.value,
    select,
    registerRadio,
    radios,
    handleKeyDown,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div role="radiogroup" aria-label={props.label} class={cn("grid gap-2", props.class)}>
        {props.children}
      </div>
    </RadioGroupContext.Provider>
  );
}

// ============================================================================
// RADIO GROUP ITEM
// ============================================================================

export type RadioGroupItemSize = "sm" | "md" | "lg";

export interface RadioGroupItemProps {
  /** Item value */
  value: string | number;
  /** Size variant */
  size?: RadioGroupItemSize;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label for this radio option */
  label?: string;
  /** Additional class */
  class?: string;
}

const sizeStyles: Record<RadioGroupItemSize, { button: string; indicator: string }> = {
  sm: { button: "h-5 w-5", indicator: "h-2.5 w-2.5" },
  md: { button: "h-6 w-6", indicator: "h-3 w-3" },
  lg: { button: "h-7 w-7", indicator: "h-3.5 w-3.5" },
};

export const RadioGroupItem: Component<RadioGroupItemProps> = (props) => {
  const ctx = useRadioGroup();
  let buttonRef!: HTMLButtonElement;

  const size = () => props.size || "md";
  const isSelected = () => ctx.selectedValue() === props.value;

  // Register this radio for arrow key navigation
  onMount(() => {
    const unregister = ctx.registerRadio({
      get value() { return props.value; },
      get disabled() { return props.disabled ?? false; },
      element: buttonRef,
    });
    onCleanup(unregister);
  });

  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={isSelected()}
      aria-label={props.label}
      tabIndex={isSelected() ? 0 : -1}
      disabled={props.disabled}
      onClick={() => ctx.select(props.value)}
      onKeyDown={(e) => ctx.handleKeyDown(e, props.value)}
      class={cn(
        // Base styles
        "flex items-center justify-center",
        "rounded-full border border-muted-foreground/30 text-primary",
        "ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary transition-colors",
        // Size
        sizeStyles[size()].button,
        props.class
      )}
    >
      <Show when={isSelected()}>
        <div class={cn("rounded-full bg-current", sizeStyles[size()].indicator)} />
      </Show>
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { useRadioGroup };
