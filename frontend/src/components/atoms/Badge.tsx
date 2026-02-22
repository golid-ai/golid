import { splitProps, Show, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type BadgeVariant =
  | "default"
  | "neutral"
  | "destructive"
  | "blue"
  | "success"
  | "warning";

export type BadgeSize = "xs" | "sm" | "default" | "lg" | "xl";

export interface BadgeProps {
  /** Numeric or string value to display */
  value?: number | string;
  /** Maximum value before truncation (e.g. 99+) */
  max?: number;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Whether to show pulse animation */
  pulse?: boolean;
  /** Additional class */
  class?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  neutral: "bg-neutral text-neutral-foreground",
  destructive: "bg-danger text-danger-foreground",
  blue: "bg-cta-blue text-cta-blue-foreground",
  success: "bg-cta-green text-cta-green-foreground",
  warning: "bg-cta-gold text-cta-gold-foreground",
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: "min-w-[20px] h-[20px] px-1.5 text-[10px]",
  sm: "min-w-[24px] h-[24px] px-2 text-[11px]",
  default: "min-w-[28px] h-[28px] px-2 text-[12px]",
  lg: "min-w-[32px] h-[32px] px-2.5 text-[13px]",
  xl: "min-w-[36px] h-[36px] px-3 text-[14px]",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Badge: Component<BadgeProps> = (props) => {
  const [local] = splitProps(props, [
    "value",
    "max",
    "variant",
    "size",
    "pulse",
    "class",
  ]);

  const variant = () => local.variant || "destructive";
  const size = () => local.size || "default";
  const max = () => local.max ?? 99;

  const displayValue = () => {
    const val = local.value;
    if (typeof val === "number" && val > max()) {
      return `${max()}+`;
    }
    return val;
  };

  return (
    <Show when={local.value !== undefined && local.value !== null}>
      <div
        class={cn(
          "absolute -top-2 -right-2 flex items-center justify-center rounded-full font-black leading-none ring-2 ring-background transition-all duration-300 shadow-sm whitespace-nowrap",
          variantStyles[variant()],
          sizeStyles[size()],
          local.pulse && "animate-pulse",
          local.class
        )}
      >
        {displayValue()}
      </div>
    </Show>
  );
};

export default Badge;
