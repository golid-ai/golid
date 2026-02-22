import { splitProps, Show, type JSX, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type InputSize = "sm" | "default" | "lg";
export type InputVariant = "default" | "error";

export interface InputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Input size variant */
  size?: InputSize;
  /** Visual variant (default or error) */
  variant?: InputVariant;
  /** Floating label text */
  label?: string;
  /** Enable floating label behavior */
  floating?: boolean;
  /** Left icon slot */
  leftIcon?: JSX.Element;
  /** Right icon slot */
  rightIcon?: JSX.Element;
  /** Container class */
  containerClass?: string;
  /** Error message text (also sets aria-describedby for screen readers) */
  errorMessage?: string;
  /** ID of an external error element to link via aria-describedby */
  errorId?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<InputSize, string> = {
  sm: "h-9 px-3",
  default: "h-10 px-3",
  lg: "h-11 px-4",
};

const variantStyles: Record<InputVariant, string> = {
  default: "border-input text-foreground hover:border-foreground/30",
  error: "border-danger text-danger",
};

// ============================================================================
// ID GENERATION
// ============================================================================

let inputIdCounter = 0;

// ============================================================================
// COMPONENT
// ============================================================================

export const Input: Component<InputProps> = (props) => {
  const [local, inputProps] = splitProps(props, [
    "size",
    "variant",
    "label",
    "floating",
    "leftIcon",
    "rightIcon",
    "containerClass",
    "class",
    "placeholder",
    "id",
    "errorMessage",
    "errorId",
  ]);

  const size = () => local.size || "default";
  const variant = () => local.variant || "default";
  const isFloating = () => local.floating && local.label;

  // Generate a stable ID if none provided (needed for label association)
  const inputId = local.id || `input-${++inputIdCounter}`;
  const generatedErrorId = `${inputId}-error`;
  const effectiveErrorId = () => local.errorId || (local.errorMessage ? generatedErrorId : undefined);

  // Use space as placeholder for floating labels (enables peer selectors)
  const activePlaceholder = () => (isFloating() ? " " : local.placeholder);

  return (
    // Wrapper div with focus-within for consistent focus ring around icons
    <div class={cn("flex flex-col gap-1", local.containerClass)}>
      {/* Traditional (non-floating) label above the input */}
      <Show when={local.label && !isFloating()}>
        <label for={inputId} class="text-sm font-medium text-foreground">
          {local.label}
        </label>
      </Show>
      <div
        class={cn(
          // Base wrapper styles
          "relative flex w-full items-center gap-2 rounded-sm border bg-transparent text-sm ring-offset-background transition-all",
          // Focus state on wrapper (includes icons in focus ring)
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          // Disabled state
          "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
          // Size
          sizeStyles[size()],
          // Variant
          variantStyles[variant()],
          // Floating label needs more height
          isFloating() && "h-12",
          local.class
        )}
      >
        {/* Left Icon - always vertically centered */}
        <Show when={local.leftIcon}>
          <div class="flex items-center justify-center shrink-0">
            {local.leftIcon}
          </div>
        </Show>

        {/* Input container */}
        <div class="relative flex-1 h-full flex flex-col justify-center">
          <input
            id={inputId}
            placeholder={activePlaceholder()}
            {...inputProps}
            class={cn(
              // Base input styles (transparent, no border - wrapper handles it)
              "peer w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/90 focus:outline-none disabled:cursor-not-allowed transition-all",
              isFloating() ? "h-auto pt-4 pb-0.5" : "h-full",
              isFloating() && "placeholder:opacity-0"
            )}
            aria-invalid={variant() === "error" || undefined}
            aria-describedby={effectiveErrorId()}
            aria-required={inputProps.required || undefined}
          />

          {/* Floating Label */}
          <Show when={isFloating()}>
            <label
              for={inputId}
              class={cn(
                "absolute left-0 pointer-events-none transition-all duration-200 ease-out",
                // Resting state
                "text-sm text-muted-foreground/90 top-1/2 -translate-y-1/2",
                // Floating state (when has value via peer-placeholder-shown)
                "peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-muted-foreground/70",
                // Focus state
                "peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:font-bold peer-focus:!text-foreground peer-focus:!opacity-100"
              )}
            >
              {local.label}
            </label>
          </Show>
        </div>

        {/* Right Icon - always vertically centered */}
        <Show when={local.rightIcon}>
          <div class="flex items-center justify-center shrink-0">
            {local.rightIcon}
          </div>
        </Show>
      </div>

      {/* Inline error message (linked via aria-describedby) */}
      <Show when={local.errorMessage}>
        <p id={generatedErrorId} class="text-xs text-danger" role="alert">
          {local.errorMessage}
        </p>
      </Show>
    </div>
  );
};

export default Input;
