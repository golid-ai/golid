import { splitProps, type ParentProps, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type LinkVariant = "default" | "blue";

export interface LinkProps extends ParentProps<JSX.AnchorHTMLAttributes<HTMLAnchorElement>> {
  variant?: LinkVariant;
  class?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const baseStyles =
  "transition-colors underline underline-offset-4 decoration-foreground/20 hover:decoration-current focus-visible:outline-none";

const variantStyles: Record<LinkVariant, string> = {
  default: "text-blue hover:text-active-blue",
  blue: "text-blue hover:text-active-blue",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Link: Component<LinkProps> = (props) => {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);

  const variant = () => local.variant || "default";

  return (
    <a class={cn(baseStyles, variantStyles[variant()], local.class)} {...rest}>
      {local.children}
    </a>
  );
};

export default Link;
