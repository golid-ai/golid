import { splitProps, Show, type ParentProps, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./Icon";

// ============================================================================
// TYPES
// ============================================================================

export type ChipVariant =
  | "default"
  | "neutral"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "violet"
  | "pink"
  | "destructive"
  | "orange"
  | "amber"
  | "lime"
  | "outline";

export type ChipSize = "xs" | "sm" | "default" | "lg";

export interface ChipProps extends ParentProps {
  /** Visual variant */
  variant?: ChipVariant;
  /** Size variant */
  size?: ChipSize;
  /** Whether the chip is clickable */
  clickable?: boolean;
  /** Active state (for clickable chips) */
  active?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Show check icon when active */
  indicator?: boolean;
  /** Additional class */
  class?: string;
  /** Inline styles */
  style?: JSX.CSSProperties;
  /** Click handler */
  onClick?: JSX.EventHandler<HTMLButtonElement | HTMLDivElement, MouseEvent>;
}

// ============================================================================
// STYLES
// ============================================================================

const variantStyles: Record<ChipVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-moonlight dark:hover:bg-bright",
  neutral: "border-transparent bg-neutral text-neutral-foreground",
  green: "border-transparent bg-cta-green text-cta-green-foreground",
  teal: "border-transparent bg-cta-teal text-cta-teal-foreground",
  blue: "border-transparent bg-cta-blue text-cta-blue-foreground",
  indigo: "border-transparent bg-cta-indigo text-cta-indigo-foreground",
  violet: "border-transparent bg-cta-violet text-cta-violet-foreground",
  pink: "border-transparent bg-cta-pink text-cta-pink-foreground",
  destructive: "border-transparent bg-danger text-danger-foreground",
  orange: "border-transparent bg-cta-orange text-cta-orange-foreground",
  amber: "border-transparent bg-cta-gold text-cta-gold-foreground",
  lime: "border-transparent bg-cta-lime text-cta-lime-foreground",
  outline: "text-foreground border-foreground/20",
};

const sizeStyles: Record<ChipSize, string> = {
  xs: "h-5 px-2 text-[9px] rounded-[3px]",
  sm: "h-[22px] px-2.5 text-[10px]",
  default: "h-6 px-3.5 text-[12px]",
  lg: "h-7 px-4 text-[14px]",
};

const checkIconSize: Record<ChipSize, number> = {
  xs: 12,
  sm: 14,
  default: 16,
  lg: 18,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Chip: Component<ChipProps> = (props) => {
  const [local] = splitProps(props, [
    "variant",
    "size",
    "clickable",
    "active",
    "disabled",
    "indicator",
    "class",
    "style",
    "children",
    "onClick",
  ]);

  const variant = () => local.variant || "default";
  const size = () => local.size || "default";

  const baseClass = () =>
    cn(
      "inline-flex items-center justify-center select-none rounded-[4px] border uppercase tracking-widest font-bold transition-all whitespace-nowrap leading-none",
      variantStyles[variant()],
      sizeStyles[size()],
      "hover:brightness-110 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      local.class
    );

  return (
    <Show when={local.clickable} fallback={
      <div
        onClick={local.onClick as JSX.EventHandler<HTMLDivElement, MouseEvent>}
        style={local.style}
        class={baseClass()}
      >
        {local.children}
      </div>
    }>
      <button
        type="button"
        disabled={local.disabled}
        onClick={local.onClick as JSX.EventHandler<HTMLButtonElement, MouseEvent>}
        style={local.style}
        class={cn(
          baseClass(),
          "cursor-pointer active:scale-95 gap-1",
          !local.active && !local.disabled && "opacity-40 hover:opacity-100 focus-visible:opacity-100",
          local.disabled && "opacity-30 cursor-not-allowed !active:scale-100"
        )}
      >
        <Show when={local.active && local.indicator !== false}>
          <Icon name="check" size={checkIconSize[size()]} class="-ml-0.5" />
        </Show>
        {local.children}
      </button>
    </Show>
  );
};

export default Chip;
