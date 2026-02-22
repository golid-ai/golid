import { createMemo, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type ProgressVariant = "default" | "buffer" | "query";

export interface ProgressProps {
  /** Additional class */
  class?: string;
  /** Current progress value (0-100). null = indeterminate */
  value?: number | null;
  /** Maximum value */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Progress: Component<ProgressProps> = (props) => {
  const max = () => props.max ?? 100;
  const variant = () => props.variant ?? "default";

  const isIndeterminate = () => props.value === null || props.value === undefined;
  const progress = createMemo(() => {
    if (isIndeterminate()) return 0;
    return ((props.value as number) / max()) * 100;
  });

  return (
    <div
      role="progressbar"
      aria-valuenow={props.value ?? undefined}
      aria-valuemin={0}
      aria-valuemax={max()}
      class={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full",
        variant() !== "buffer" && "bg-muted",
        props.class
      )}
    >
      {/* Buffer/Query animated background */}
      {(variant() === "buffer" || variant() === "query") && (
        <div
          class={cn(
            "absolute inset-0 w-full h-full opacity-20",
            variant() === "buffer" ? "animate-buffer" : "animate-query-dots"
          )}
          style={{
            "background-image":
              variant() === "buffer"
                ? "radial-gradient(circle at center, currentColor 3px, transparent 3px)"
                : "radial-gradient(circle at center, currentColor 2px, transparent 2px)",
            "background-size": variant() === "buffer" ? "16px 100%" : "12px 100%",
          }}
        />
      )}

      {/* Primary Bar */}
      {(!isIndeterminate() || variant() !== "buffer") && (
        <div
          class={cn(
            "h-full transition-all relative z-10 rounded-full",
            variant() === "query" ? "bg-steel dark:bg-mist" : "bg-primary",
            isIndeterminate() && variant() !== "query" && "absolute origin-left w-[20%] animate-indeterminate",
            isIndeterminate() && variant() === "query" && "absolute top-0 bottom-0 w-[20%] animate-query-reverse"
          )}
          style={!isIndeterminate() ? { width: `${progress()}%` } : undefined}
        />
      )}
    </div>
  );
};

export default Progress;
