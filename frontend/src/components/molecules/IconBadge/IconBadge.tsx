import { splitProps, Show, createSignal, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";
import { Button, type ButtonVariant, type ButtonSize } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { Badge, type BadgeVariant, type BadgeSize } from "~/components/atoms/Badge";

// ============================================================================
// TYPES
// ============================================================================

export interface IconBadgeProps {
  /** Name of the icon to display */
  icon?: string;
  /** Optional text label */
  label?: string;
  /** Numeric or string value for the badge notification */
  value?: number | string;
  /** Maximum value before truncation (e.g. 99+) */
  max?: number;
  /** Visual variant for the notification badge */
  badgeVariant?: BadgeVariant;
  /** Size of the notification badge */
  badgeSize?: BadgeSize;
  /** Visual variant for the base button (includes 'pure' for zero-chrome) */
  variant?: ButtonVariant | "pure";
  /** Size of the base button */
  size?: ButtonSize;
  /** Physical shape of the button container */
  shape?: "square" | "circle";
  /** Whether to illuminate the icon with the badge color on hover */
  fillOnHover?: boolean;
  /** Whether to enable the radial pulse animation on the badge */
  pulse?: boolean;
  /** Additional CSS classes for the root wrapper */
  class?: string;
  /** Internal class override for the base button */
  buttonClass?: string;
  /** Internal class override for the icon element */
  iconClass?: string;
  /** Internal class override for the badge component */
  badgeClass?: string;
  /** Primary click handler */
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
  /** Children content */
  children?: JSX.Element;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const IconBadge: Component<IconBadgeProps> = (props) => {
  const [local] = splitProps(props, [
    "icon",
    "label",
    "value",
    "max",
    "badgeVariant",
    "badgeSize",
    "variant",
    "size",
    "shape",
    "fillOnHover",
    "pulse",
    "class",
    "buttonClass",
    "iconClass",
    "badgeClass",
    "onClick",
    "children",
  ]);

  const [isHovered, setIsHovered] = createSignal(false);

  const isPure = () => local.variant === "pure";
  const isCircle = () => local.shape === "circle" || isPure();
  const isIconButton = () => !local.label && !local.children;

  // Icon sizes: pure mode scales visually since there's no button chrome.
  // Non-pure modes use the standard 24px icon inside all button containers.
  const pureIconSizes: Record<string, number> = {
    "xxl-icon": 32, "xxl": 32,
    "xl-icon": 28, "xl": 28,
    "lg-icon": 26, "lg": 26,
    "icon": 24, "default": 24,
    "sm-icon": 22, "sm": 22,
    "xs-icon": 20, "xs": 20,
  };

  // Badge offsets per size and shape
  const badgeOffsets: Record<string, { pure: string; circle: string; square: string }> = {
    "xxl-icon": { pure: "-top-2 -right-1", circle: "-top-3 -right-3", square: "-top-4 -right-4" },
    "xxl":     { pure: "-top-2 -right-1", circle: "-top-3 -right-3", square: "-top-4 -right-4" },
    "xl-icon": { pure: "-top-2 -right-1.5", circle: "-top-3 -right-3", square: "-top-4 -right-4" },
    "xl":      { pure: "-top-2 -right-1.5", circle: "-top-3 -right-3", square: "-top-4 -right-4" },
    "lg-icon": { pure: "-top-2 -right-1", circle: "-top-2.5 -right-2.5", square: "-top-3.5 -right-3.5" },
    "lg":      { pure: "-top-2 -right-1", circle: "-top-2.5 -right-2.5", square: "-top-3.5 -right-3.5" },
    "icon":    { pure: "-top-2.5 -right-1", circle: "-top-2.5 -right-2.5", square: "-top-3.5 -right-3.5" },
    "default": { pure: "-top-2.5 -right-1", circle: "-top-2.5 -right-2.5", square: "-top-3.5 -right-3.5" },
    "sm-icon": { pure: "-top-2 -right-2.5", circle: "-top-2 -right-2", square: "-top-3 -right-3" },
    "sm":      { pure: "-top-2 -right-2.5", circle: "-top-2 -right-2", square: "-top-3 -right-3" },
    "xs-icon": { pure: "-top-2 -right-2.5", circle: "-top-2 -right-2", square: "-top-3 -right-3" },
    "xs":      { pure: "-top-2 -right-2.5", circle: "-top-2 -right-2", square: "-top-3 -right-3" },
  };

  const scaleAdjustments = () => {
    const s = local.size || (isIconButton() ? "icon" : "default");
    const pure = isPure();
    const circle = isCircle();

    const iconSize = pure ? (pureIconSizes[s] ?? 24) : 24;
    const offsets = badgeOffsets[s] ?? badgeOffsets["default"];
    const offset = pure ? offsets.pure : circle ? offsets.circle : offsets.square;

    return { iconSize, offset };
  };

  const hoverFillColor = () => {
    const fillOnHover = local.fillOnHover !== false;
    if (!fillOnHover || !isHovered()) return "";
    if (!isPure()) return "text-inherit";

    switch (local.badgeVariant || "destructive") {
      case "destructive":
        return "text-danger";
      case "warning":
        return "text-cta-gold";
      case "success":
        return "text-cta-green";
      case "blue":
        return "text-cta-blue";
      case "neutral":
        return "text-muted-foreground";
      default:
        return "text-primary";
    }
  };

  const iconColorClass = () => {
    if (isHovered() && isPure()) return hoverFillColor();
    if (isPure()) return "text-foreground/60";
    return "text-inherit";
  };

  return (
    <div class={cn("relative inline-flex shrink-0 isolation-isolate", local.class)}>
      <Button
        variant={isPure() ? "transparent" : (local.variant as ButtonVariant)}
        size={local.size}
        rounded={isCircle()}
        onClick={local.onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        class={cn(
          isPure() && "p-0 bg-transparent hover:bg-transparent text-foreground rounded-full",
          local.variant === "outline" && !isCircle() && "rounded-xl",
          local.variant === "ghost" && !isCircle() && "rounded-xl",
          local.buttonClass
        )}
      >
        <Show when={local.icon}>
          <Icon
            name={local.icon!}
            size={scaleAdjustments().iconSize}
            filled={isHovered() && local.fillOnHover !== false}
            class={cn(
              "transition-colors duration-300",
              iconColorClass(),
              !isIconButton() && "mr-2",
              local.iconClass
            )}
          />
        </Show>

        <Show when={local.label}>
          <span>{local.label}</span>
        </Show>

        {local.children}
      </Button>

      <Badge
        value={local.value}
        max={local.max ?? 99}
        variant={local.badgeVariant || "destructive"}
        size={local.badgeSize || "sm"}
        pulse={local.pulse}
        class={cn(
          "absolute pointer-events-none transition-all duration-300",
          scaleAdjustments().offset,
          local.badgeClass
        )}
      />
    </div>
  );
};

export default IconBadge;
