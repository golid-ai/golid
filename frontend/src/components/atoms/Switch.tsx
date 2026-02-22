import { splitProps, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type SwitchSize = "sm" | "md" | "lg";
export type SwitchColor = "default" | "destructive";

export interface SwitchProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Size variant */
  size?: SwitchSize;
  /** Color variant */
  color?: SwitchColor;
  /** Checked state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Accessible label describing what this switch controls (required for screen readers) */
  label: string;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<SwitchSize, { track: string; thumb: string; translateOn: string; translateOff: string }> = {
  sm: {
    track: "h-6 w-12",
    thumb: "h-4 w-4",
    translateOn: "translate-x-[26px]",
    translateOff: "translate-x-[2px]",
  },
  md: {
    track: "h-7 w-14",
    thumb: "h-5 w-5",
    translateOn: "translate-x-[30px]",
    translateOff: "translate-x-[2px]",
  },
  lg: {
    track: "h-8 w-16",
    thumb: "h-6 w-6",
    translateOn: "translate-x-[34px]",
    translateOff: "translate-x-[2px]",
  },
};

const colorStyles: Record<SwitchColor, string> = {
  default: "bg-primary dark:bg-steel",
  destructive: "bg-danger",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Switch: Component<SwitchProps> = (props) => {
  const [local, buttonProps] = splitProps(props, [
    "size",
    "color",
    "checked",
    "onChange",
    "class",
    "onClick",
    "label",
  ]);

  const size = () => local.size || "md";
  const color = () => local.color || "default";

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
      role="switch"
      aria-checked={local.checked}
      aria-label={local.label}
      onClick={handleClick}
      class={cn(
        // Base styles
        "group peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Size
        sizeStyles[size()].track,
        // Color (only when checked)
        local.checked ? colorStyles[color()] : "bg-muted",
        local.class
      )}
    >
      <span
        class={cn(
          // Thumb base styles
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform",
          "group-hover:ring-4 group-hover:ring-primary/20",
          // Size
          sizeStyles[size()].thumb,
          // Position
          local.checked ? sizeStyles[size()].translateOn : sizeStyles[size()].translateOff
        )}
      />
    </button>
  );
};

export default Switch;
