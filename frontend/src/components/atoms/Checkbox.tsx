import { splitProps, Show, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./Icon";

// ============================================================================
// TYPES
// ============================================================================

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Size variant */
  size?: CheckboxSize;
  /** Checked state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Accessible label for screen readers */
  label: string;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<CheckboxSize, { box: string; iconSize: number }> = {
  sm: { box: "h-5 w-5 rounded-[4px]", iconSize: 14 },
  md: { box: "h-6 w-6 rounded-[6px]", iconSize: 16 },
  lg: { box: "h-7 w-7 rounded-sm", iconSize: 20 },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Checkbox: Component<CheckboxProps> = (props) => {
  const [local, buttonProps] = splitProps(props, [
    "size",
    "checked",
    "onChange",
    "class",
    "onClick",
    "label",
  ]);

  const size = () => local.size || "md";

  const handleClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (e) => {
    const newChecked = !local.checked;
    local.onChange?.(newChecked);
    if (typeof local.onClick === "function") {
      local.onClick(e);
    }
  };

  return (
    <button
      {...buttonProps}
      type="button"
      role="checkbox"
      aria-checked={local.checked}
      aria-label={local.label}
      onClick={handleClick}
      class={cn(
        // Base styles
        "peer flex items-center justify-center",
        "border border-muted-foreground/30",
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary transition-colors",
        // Size
        sizeStyles[size()].box,
        // Checked state
        local.checked && "bg-primary text-primary-foreground border-primary",
        local.class
      )}
    >
      <Show when={local.checked}>
        <Icon
          name="check"
          size={sizeStyles[size()].iconSize}
          weight={800}
        />
      </Show>
    </button>
  );
};

export default Checkbox;
