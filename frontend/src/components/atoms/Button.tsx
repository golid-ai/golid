import { tv, type VariantProps } from "tailwind-variants";
import { splitProps, Show, Switch, Match, For, createSignal, type ParentProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

// =============================================================================
// BUTTON VARIANTS
// =============================================================================

export const buttonVariants = tv({
  base: [
    // Base
    "group relative overflow-hidden inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors cursor-pointer",
    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // A11y
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  ],
  variants: {
    variant: {
      // Default uses theme-aware primary with visible hover states
      default: "bg-primary text-primary-foreground hover:bg-moonlight dark:hover:bg-bright",
      neutral: "bg-neutral text-neutral-foreground hover:bg-steel/30",
      // CTA colors - use cta-* tokens for proper light/dark mode switching
      green: "bg-cta-green text-cta-green-foreground hover:bg-cta-green-active",
      teal: "bg-cta-teal text-cta-teal-foreground hover:bg-cta-teal-active",
      blue: "bg-cta-blue text-cta-blue-foreground hover:bg-cta-blue-active",
      indigo: "bg-cta-indigo text-cta-indigo-foreground hover:bg-cta-indigo-active",
      violet: "bg-cta-violet text-cta-violet-foreground hover:bg-cta-violet-active",
      pink: "bg-cta-pink text-cta-pink-foreground hover:bg-cta-pink-active",
      destructive: "bg-danger text-danger-foreground hover:bg-danger-active dark:hover:text-midnight",
      orange: "bg-cta-orange text-cta-orange-foreground hover:bg-cta-orange-active",
      amber: "bg-cta-gold text-cta-gold-foreground hover:bg-cta-gold-active",
      lime: "bg-cta-lime text-cta-lime-foreground hover:bg-cta-lime-active",
      outline: "border border-input bg-background hover:bg-muted/30 text-foreground",
      ghost: "hover:bg-muted/30 text-foreground focus-visible:bg-muted/30 border-transparent focus-visible:border-transparent",
      link: "text-active-blue dark:text-cta-blue underline-offset-4 hover:underline hover:text-cta-blue",
      transparent: "hover:bg-transparent",
    },
    size: {
      xs: "h-8 px-4 text-xs",
      sm: "h-9 px-5 text-sm",
      default: "h-10 px-7 py-2",
      lg: "h-11 px-8",
      xl: "h-12 px-9",
      xxl: "h-[52px] px-10 text-base",
      icon: "h-10 w-10",
      "xs-icon": "h-8 w-8",
      "sm-icon": "h-9 w-9",
      "lg-icon": "h-11 w-11",
      "xl-icon": "h-12 w-12",
      "xxl-icon": "h-[52px] w-[52px]",
    },
    rounded: {
      true: "rounded-full",
      false: "rounded-sm",
    },
    startIcon: {
      true: "",
    },
    endIcon: {
      true: "",
    },
  },
  compoundVariants: [
    { size: "xxl", startIcon: true, class: "pl-8" },
    { size: "xxl", endIcon: true, class: "pr-8" },
    { size: "xl", startIcon: true, class: "pl-7" },
    { size: "xl", endIcon: true, class: "pr-7" },
    { size: "lg", startIcon: true, class: "pl-6" },
    { size: "lg", endIcon: true, class: "pr-6" },
    { size: "default", startIcon: true, class: "pl-5" },
    { size: "default", endIcon: true, class: "pr-5" },
    { size: "sm", startIcon: true, class: "pl-3" },
    { size: "sm", endIcon: true, class: "pr-3" },
    { size: "xs", startIcon: true, class: "pl-2" },
    { size: "xs", endIcon: true, class: "pr-2" },
  ],
  defaultVariants: {
    variant: "default",
    size: "default",
    rounded: false,
    startIcon: false,
    endIcon: false,
  },
});

// =============================================================================
// RIPPLE TYPE
// =============================================================================

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

// =============================================================================
// SPINNER (inline for Button loading state)
// =============================================================================

function Spinner(props: { size?: "xs" | "sm" | "md"; class?: string }) {
  const sizeClasses = {
    xs: "h-4 w-4 border-[1.5px]",
    sm: "h-5 w-5 border-2",
    md: "h-6 w-6 border-2",
  };

  return (
    <div
      class={cn(
        "animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[props.size || "sm"],
        props.class
      )}
    />
  );
}

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

export interface ButtonProps extends ParentProps<Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "type">> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: boolean;
  startIcon?: boolean;
  endIcon?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  class?: string;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  href?: string;
}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "rounded",
    "startIcon",
    "endIcon",
    "loading",
    "disabled",
    "fullWidth",
    "type",
    "class",
    "children",
    "onClick",
    "href",
  ]);

  // Ripple effect state
  const [ripples, setRipples] = createSignal<Ripple[]>([]);
  let nextId = 0;

  const handleRipple = (event: MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: Ripple = { id: nextId++, x, y, size };
    setRipples((prev) => [...prev, newRipple]);
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const spinnerSize = () => {
    const s = local.size || "default";
    if (s.includes("xxl")) return "md";
    if (s.includes("xl") || s.includes("lg")) return "sm";
    return "xs";
  };

  const buttonClass = () =>
    cn(
      buttonVariants({
        variant: local.variant,
        size: local.size,
        rounded: local.rounded,
        startIcon: local.startIcon,
        endIcon: local.endIcon,
      }),
      local.fullWidth && "w-full",
      local.class
    );

  const handleClick = (e: MouseEvent) => {
    handleRipple(e);
    if (typeof local.onClick === "function") {
      (local.onClick as (e: MouseEvent) => void)(e);
    }
  };

  return (
    <Show when={!local.href} fallback={
      <a href={local.href} class={buttonClass()}>
        {local.children}
      </a>
    }>
    <button
      type={local.type || "button"}
      disabled={local.loading || local.disabled}
      class={buttonClass()}
      onClick={handleClick}
      aria-busy={local.loading}
      aria-live="polite"
      {...others}
    >
      <Switch>
        <Match when={local.loading}>
          <div class="absolute inset-0 flex items-center justify-center">
            <Spinner size={spinnerSize()} />
          </div>
          <div class="invisible flex items-center justify-center">{local.children}</div>
        </Match>
        <Match when={!local.loading}>{local.children}</Match>
      </Switch>

      {/* Ripple effects */}
      <For each={ripples()}>
        {(ripple) => (
          <span
            class="absolute rounded-full bg-current opacity-10 pointer-events-none animate-ripple"
            style={{
              width: `${ripple.size}px`,
              height: `${ripple.size}px`,
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
            }}
            onAnimationEnd={() => removeRipple(ripple.id)}
          />
        )}
      </For>
    </button>
    </Show>
  );
}
