import { splitProps, Show, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type NumberInputSize = "sm" | "default" | "lg";

export interface NumberInputProps {
  /** Current value (string to allow empty state) */
  value?: string;
  /** Called on value change */
  onInput?: (value: string) => void;
  /** Label displayed above the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: NumberInputSize;
  /** Prefix text (e.g. "$") */
  prefix?: string;
  /** Suffix text (e.g. "/hr", "hrs", "wks") */
  suffix?: string;
  /** Allow decimal values */
  allowDecimal?: boolean;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class */
  class?: string;
  /** Additional input attributes */
  id?: string;
  /** Required field */
  required?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<NumberInputSize, { wrapper: string; text: string; label: string }> = {
  sm: { wrapper: "h-9", text: "text-sm", label: "text-xs" },
  default: { wrapper: "h-10", text: "text-sm", label: "text-sm" },
  lg: { wrapper: "h-11", text: "text-base", label: "text-sm" },
};

// ============================================================================
// ID GENERATION
// ============================================================================

let numberInputIdCounter = 0;

// ============================================================================
// COMPONENT
// ============================================================================

export const NumberInput: Component<NumberInputProps> = (props) => {
  const [local] = splitProps(props, [
    "value", "onInput", "label", "placeholder", "size", "prefix", "suffix",
    "allowDecimal", "min", "max", "error", "errorMessage", "disabled",
    "class", "id", "required",
  ]);

  const size = () => local.size || "default";
  const styles = () => sizeStyles[size()];
  const inputId = local.id || `number-input-${++numberInputIdCounter}`;
  const errorId = `${inputId}-error`;

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    const raw = e.currentTarget.value;

    // Allow empty
    if (raw === "") {
      local.onInput?.(raw);
      return;
    }

    // Allow only numbers (and optionally decimal point)
    const pattern = local.allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    if (!pattern.test(raw)) {
      // Revert to previous value
      e.currentTarget.value = local.value ?? "";
      return;
    }

    local.onInput?.(raw);
  };

  const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (e) => {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowed.includes(e.key)) return;

    // Allow ctrl/cmd + a, c, v, x
    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;

    // Allow decimal point
    if (local.allowDecimal && e.key === "." && !(local.value ?? "").includes(".")) return;

    // Allow minus at start
    if (e.key === "-" && e.currentTarget.selectionStart === 0 && !(local.value ?? "").includes("-")) return;

    // Block non-numeric
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div class={cn("flex flex-col gap-1.5", local.class)}>
      <Show when={local.label}>
        <label for={inputId} class={cn("font-medium text-foreground", styles().label)}>
          {local.label}
        </label>
      </Show>

      <div
        class={cn(
          "flex items-center rounded-sm border bg-transparent transition-all overflow-hidden min-w-0",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
          local.error || local.errorMessage ? "border-danger" : "border-input hover:border-foreground/30",
          local.disabled && "opacity-50 cursor-not-allowed",
          styles().wrapper,
        )}
      >
        <Show when={local.prefix}>
          <span class={cn("pl-3 text-muted-foreground select-none shrink-0", styles().text)}>
            {local.prefix}
          </span>
        </Show>

        <input
          id={inputId}
          type="text"
          inputMode={local.allowDecimal ? "decimal" : "numeric"}
          value={local.value ?? ""}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={local.placeholder}
          disabled={local.disabled}
          aria-invalid={local.error || !!local.errorMessage || undefined}
          aria-describedby={local.errorMessage ? errorId : undefined}
          aria-required={local.required || undefined}
          class={cn(
            "flex-1 min-w-0 bg-transparent px-3 focus:outline-none text-foreground placeholder:text-muted-foreground/90",
            local.prefix && "pl-1",
            local.suffix && "pr-1",
            styles().text,
          )}
        />

        <Show when={local.suffix}>
          <span class={cn("pr-3 text-muted-foreground select-none shrink-0", styles().text)}>
            {local.suffix}
          </span>
        </Show>
      </div>

      <Show when={local.errorMessage}>
        <p id={errorId} class="text-xs text-danger" role="alert">
          {local.errorMessage}
        </p>
      </Show>
    </div>
  );
};

export default NumberInput;
