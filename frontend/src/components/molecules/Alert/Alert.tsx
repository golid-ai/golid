import {
  splitProps,
  createContext,
  type ParentProps,
  type Component,
  type Accessor,
  Show,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";

// ============================================================================
// TYPES
// ============================================================================

export type AlertVariant = "default" | "destructive" | "success";

export interface AlertProps extends ParentProps {
  /** Visual variant for the alert state */
  variant?: AlertVariant;
  /** Optional icon name to display on the left */
  icon?: string;
  /** Additional class */
  class?: string;
}

export interface AlertTitleProps extends ParentProps {
  class?: string;
}

export interface AlertDescriptionProps extends ParentProps {
  class?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface AlertContextValue {
  variant: Accessor<AlertVariant>;
}

const AlertContext = createContext<AlertContextValue>();

// ============================================================================
// STYLES
// ============================================================================

const variantStyles: Record<AlertVariant, string> = {
  default: "text-foreground border-foreground/10 bg-foreground/[0.04]",
  destructive: "border-danger/30 text-danger bg-danger/[0.06] [&_svg]:text-danger",
  success: "border-green/30 text-green bg-green/[0.06] [&_svg]:text-green",
};

// ============================================================================
// ALERT
// ============================================================================

export const Alert: Component<AlertProps> = (props) => {
  const [local, rest] = splitProps(props, ["variant", "icon", "class", "children"]);

  const variant = () => local.variant || "default";

  return (
    <AlertContext.Provider value={{ variant }}>
      <div
        class={cn(
          "relative w-full rounded-2xl border-2 p-5 transition-all",
          variantStyles[variant()],
          local.class
        )}
        role="alert"
        {...rest}
      >
        <div class="grid grid-cols-[auto,1fr] items-center gap-x-3">
          <Show when={local.icon}>
            <Icon
              name={local.icon!}
              class="text-4xl"
              weight={400}
            />
          </Show>
          <div class={local.icon ? "col-start-2" : "col-span-2"}>
            {local.children}
          </div>
        </div>
      </div>
    </AlertContext.Provider>
  );
};

// ============================================================================
// ALERT TITLE
// ============================================================================

export const AlertTitle: Component<AlertTitleProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <h5
      class={cn(
        "mb-1.5 font-bold font-montserrat leading-none tracking-tight text-lg",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </h5>
  );
};

// ============================================================================
// ALERT DESCRIPTION
// ============================================================================

export const AlertDescription: Component<AlertDescriptionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div class={cn("text-sm [&_p]:leading-relaxed", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

export default Alert;
