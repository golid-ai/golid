import { For, Show, type Component } from "solid-js";
import { cn } from "~/lib/utils";

export interface StarRatingProps {
  /** Current value (0-5, supports decimals for display) */
  value: number;
  /** Callback when user clicks a star (makes it interactive) */
  onChange?: (value: number) => void;
  /** Display size */
  size?: "sm" | "md" | "lg";
  /** Additional class */
  class?: string;
  /** Show numeric value next to stars */
  showValue?: boolean;
  /** Review count to display e.g. "(12 reviews)" */
  reviewCount?: number;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const StarRating: Component<StarRatingProps> = (props) => {
  const starSize = () => sizeMap[props.size || "md"];
  const isInteractive = () => !!props.onChange;
  const value = () => Math.max(0, Math.min(5, props.value));

  const handleClick = (starIndex: number) => {
    if (props.onChange) {
      props.onChange(starIndex);
    }
  };

  return (
    <div class={cn("flex items-center gap-1", props.class)}>
      <div class={cn("flex items-center", isInteractive() ? "gap-0.5" : "gap-px")}>
        <For each={[1, 2, 3, 4, 5]}>
          {(star) => {
            const filled = () => value() >= star;
            const halfFilled = () => !filled() && value() >= star - 0.5;

            return (
              <button
                type="button"
                onClick={() => handleClick(star)}
                disabled={!isInteractive()}
                class={cn(
                  "relative inline-flex items-center justify-center",
                  isInteractive()
                    ? "cursor-pointer hover:scale-110 transition-transform"
                    : "cursor-default"
                )}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                {/* Background star (empty) */}
                <svg
                  width={starSize()}
                  height={starSize()}
                  viewBox="0 0 24 24"
                  fill="none"
                  class="text-foreground/10"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="currentColor"
                  />
                </svg>

                {/* Filled star overlay */}
                <Show when={filled() || halfFilled()}>
                  <svg
                    width={starSize()}
                    height={starSize()}
                    viewBox="0 0 24 24"
                    fill="none"
                    class="absolute inset-0 text-cta-gold"
                    style={halfFilled() ? { "clip-path": "inset(0 50% 0 0)" } : undefined}
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill="currentColor"
                    />
                  </svg>
                </Show>
              </button>
            );
          }}
        </For>
      </div>

      <Show when={props.showValue && value() > 0}>
        <span class={cn(
          "font-semibold text-foreground tabular-nums",
          props.size === "sm" ? "text-xs" : props.size === "lg" ? "text-base" : "text-sm"
        )}>
          {value().toFixed(1)}
        </span>
      </Show>

      <Show when={props.reviewCount !== undefined && props.reviewCount > 0}>
        <span class={cn(
          "text-muted-foreground",
          props.size === "sm" ? "text-[10px]" : "text-xs"
        )}>
          ({props.reviewCount} review{props.reviewCount !== 1 ? "s" : ""})
        </span>
      </Show>
    </div>
  );
};

export default StarRating;
