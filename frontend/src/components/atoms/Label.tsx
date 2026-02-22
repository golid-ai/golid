import { splitProps, type ParentProps, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface LabelProps extends ParentProps<JSX.LabelHTMLAttributes<HTMLLabelElement>> {
  class?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Label: Component<LabelProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <label
      class={cn(
        "text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </label>
  );
};

export default Label;
