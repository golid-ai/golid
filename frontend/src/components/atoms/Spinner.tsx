import { splitProps, For, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "default" | "multi";
export type SpinnerColor = "primary" | "green" | "danger" | "neutral" | "current";

export interface SpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Visual variant */
  variant?: SpinnerVariant;
  /** Stroke thickness (overrides default for size) */
  thickness?: number;
  /** Color variant */
  color?: SpinnerColor;
  /** Additional class */
  class?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const dimensions: Record<SpinnerSize, number> = {
  xs: 16,
  sm: 24,
  md: 36,
  lg: 48,
  xl: 64,
};

const defaultThickness: Record<SpinnerSize, number> = {
  xs: 2.5,
  sm: 3.5,
  md: 4.5,
  lg: 6,
  xl: 8,
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: "text-primary",
  green: "text-green dark:text-neon-green",
  danger: "text-danger",
  neutral: "text-foreground/40",
  current: "text-current",
};

// Multi-arc configuration (concentric rings)
const arcs = [
  { id: "big", radiusScale: 1.0, thicknessScale: 1.0, speed: "2.1s", delay: "0s", dash: 0.6 },
  { id: "med", radiusScale: 0.65, thicknessScale: 0.9, speed: "2s", delay: "-0.4s", dash: 0.45 },
  { id: "small", radiusScale: 0.35, thicknessScale: 0.8, speed: "3s", delay: "-0.8s", dash: 0.35 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const Spinner: Component<SpinnerProps> = (props) => {
  const [local] = splitProps(props, ["size", "variant", "thickness", "color", "class"]);

  const size = () => local.size || "md";
  const variant = () => local.variant || "default";
  const color = () => local.color || "primary";

  const d = () => dimensions[size()];
  const baseT = () => local.thickness ?? defaultThickness[size()];
  const center = () => d() / 2;

  const getRadius = (scale: number, arcThickness: number) => {
    const maxRadius = (d() - arcThickness) / 2;
    return maxRadius * scale;
  };

  const getCircumference = (r: number) => 2 * Math.PI * r;

  return (
    <div
      class={cn(
        "relative inline-flex items-center justify-center overflow-visible",
        local.class
      )}
      role="status"
      aria-live="polite"
      style={{ width: `${d()}px`, height: `${d()}px` }}
    >
      <svg
        viewBox={`0 0 ${d()} ${d()}`}
        class="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {variant() === "multi" ? (
          <For each={arcs}>
            {(arc) => {
              const arcT = baseT() * arc.thicknessScale;
              const r = getRadius(arc.radiusScale, arcT);
              const c = getCircumference(r);

              return (
                <>
                  {/* Track for each arc */}
                  <circle
                    cx={center()}
                    cy={center()}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    stroke-width={arcT}
                    class="text-foreground/[0.08] dark:text-white/[0.08]"
                  />
                  {/* Concentric Arc */}
                  <circle
                    cx={center()}
                    cy={center()}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    stroke-width={arcT}
                    stroke-dasharray={`${c * arc.dash} ${c * (1 - arc.dash)}`}
                    class={cn(colorClasses[color()], "spinner-organic")}
                    style={{
                      "animation-duration": arc.speed,
                      "animation-delay": arc.delay,
                    }}
                    stroke-linecap="round"
                  />
                </>
              );
            }}
          </For>
        ) : (
          (() => {
            const r = (d() - baseT()) / 2;
            const c = 2 * Math.PI * r;

            return (
              <>
                {/* Standard Single Arc Track */}
                <circle
                  cx={center()}
                  cy={center()}
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  stroke-width={baseT()}
                  class="text-foreground/[0.1] dark:text-white/[0.1]"
                />
                {/* Standard Single Arc */}
                <circle
                  cx={center()}
                  cy={center()}
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  stroke-width={baseT()}
                  stroke-dasharray={`${c * 0.45} ${c * 0.55}`}
                  class={cn(colorClasses[color()], "spinner-standard")}
                  stroke-linecap="round"
                />
              </>
            );
          })()
        )}
      </svg>
      <span class="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
