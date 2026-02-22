import { For, Show, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface StepConfig {
  label: string;
}

export interface RegistrationStepperProps {
  /** Step definitions */
  steps: StepConfig[];
  /** Current active step (1-indexed) */
  currentStep: number;
  /** Additional class */
  class?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RegistrationStepper: Component<RegistrationStepperProps> = (props) => {
  const isCompleted = (stepIndex: number) => stepIndex + 1 < props.currentStep;
  const isActive = (stepIndex: number) => stepIndex + 1 === props.currentStep;
  const isUpcoming = (stepIndex: number) => stepIndex + 1 > props.currentStep;

  return (
    <div class={cn("flex flex-col items-center gap-2", props.class)}>
      {/* Step circles + connectors */}
      <div class="flex items-center justify-center">
        <For each={props.steps}>
          {(step, index) => (
            <div class="flex items-center">
              {/* Step circle + label */}
              <div class="flex items-center gap-2">
                <div
                  class={cn(
                    "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0",
                    isCompleted(index())
                      && "bg-cta-green text-midnight",
                    isActive(index())
                      && "bg-foreground text-background",
                    isUpcoming(index())
                      && "border-2 border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted(index()) ? (
                    <span class="material-symbols-rounded text-base sm:text-lg" style={{ "font-variation-settings": "'wght' 700" }}>check</span>
                  ) : (
                    index() + 1
                  )}
                </div>
                {/* Labels hidden on mobile, shown on sm+ */}
                <span
                  class={cn(
                    "hidden sm:inline text-sm font-medium whitespace-nowrap",
                    isCompleted(index()) && "text-foreground",
                    isActive(index()) && "text-foreground font-semibold",
                    isUpcoming(index()) && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {index() < props.steps.length - 1 && (
                <div
                  class={cn(
                    "w-10 sm:w-24 h-0.5 mx-2 sm:mx-4 transition-colors",
                    isCompleted(index()) ? "bg-foreground" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          )}
        </For>
      </div>

      {/* Active step label on mobile only */}
      <Show when={props.steps[props.currentStep - 1]}>
        <span class="sm:hidden text-xs font-semibold text-foreground">
          {props.steps[props.currentStep - 1].label}
        </span>
      </Show>
    </div>
  );
};

export default RegistrationStepper;
