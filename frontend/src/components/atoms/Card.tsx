import { splitProps, Show, type Component, type ParentProps } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface CardProps extends ParentProps {
  class?: string;
  onClick?: (e: MouseEvent) => void;
  /** When true, renders as a static div instead of an interactive button */
  static?: boolean;
  /** When true, adds hover lift + shadow animation */
  liftable?: boolean;
}

export interface CardHeaderProps extends ParentProps {
  class?: string;
}

export interface CardTitleProps extends ParentProps {
  class?: string;
}

export interface CardContentProps extends ParentProps {
  class?: string;
}

export interface CardFooterProps extends ParentProps {
  class?: string;
}

// ============================================================================
// CARD (Root)
// ============================================================================

export const Card: Component<CardProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "onClick", "static", "liftable"]);

  const baseClass = "rounded-2xl border border-foreground/[0.1] bg-card text-card-foreground shadow-elevated transition-all duration-300 outline-none ring-offset-background text-left w-full block";
  const interactiveClass = "hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:-translate-y-1 focus-visible:shadow-2xl";
  const liftableClass = "hover:-translate-y-1 hover:shadow-2xl hover:border-primary/20";

  return (
    <Show when={!local.static && local.onClick} fallback={
      <div
        class={cn(baseClass, local.liftable && liftableClass, local.class)}
        {...rest}
      >
        {local.children}
      </div>
    }>
    <button
      type="button"
      class={cn(baseClass, interactiveClass, local.class)}
      onClick={local.onClick}
      {...rest}
    >
      {local.children}
    </button>
    </Show>
  );
};

// ============================================================================
// CARD HEADER
// ============================================================================

export const CardHeader: Component<CardHeaderProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div class={cn("flex flex-col p-6", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

// ============================================================================
// CARD TITLE
// ============================================================================

export const CardTitle: Component<CardTitleProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <h3
      class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)}
      {...rest}
    >
      {local.children}
    </h3>
  );
};

// ============================================================================
// CARD CONTENT
// ============================================================================

export const CardContent: Component<CardContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div class={cn("p-6 pt-0", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

// ============================================================================
// CARD FOOTER
// ============================================================================

export const CardFooter: Component<CardFooterProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div class={cn("flex items-center p-6 pt-0", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

export default Card;
