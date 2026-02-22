import { splitProps, createSignal, createEffect, onMount, onCleanup, Show, type JSX, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type TextareaSize = "sm" | "md" | "lg";
export type TextareaVariant = "default" | "error";

export interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Size variant */
  size?: TextareaSize;
  /** Visual variant */
  variant?: TextareaVariant;
  /** Enable auto-growing behavior */
  autoGrow?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<TextareaSize, string> = {
  sm: "min-h-[80px]",
  md: "min-h-[120px]",
  lg: "min-h-[160px]",
};

// For auto-grow, use smaller min heights
const autoGrowSizeStyles: Record<TextareaSize, string> = {
  sm: "min-h-[38px]",
  md: "min-h-[80px]",
  lg: "min-h-[120px]",
};

const variantStyles: Record<TextareaVariant, string> = {
  default: "border-input text-foreground hover:border-foreground/30",
  error: "border-danger text-danger",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Textarea: Component<TextareaProps> = (props) => {
  const [local, textareaProps] = splitProps(props, [
    "size",
    "variant",
    "autoGrow",
    "class",
  ]);

  let textareaRef: HTMLTextAreaElement | undefined;
  const [isResizing, setIsResizing] = createSignal(false);
  let startY = 0;
  let startHeight = 0;

  const size = () => local.size || "sm";
  const variant = () => local.variant || "default";

  // Auto-resize logic
  const adjustHeight = () => {
    if (!textareaRef || !local.autoGrow) return;
    
    // Reset height to auto to get the correct scrollHeight
    textareaRef.style.height = "auto";
    textareaRef.style.height = `${textareaRef.scrollHeight}px`;
  };

  // Initial resize on mount
  onMount(() => {
    if (local.autoGrow) {
      adjustHeight();
    }
  });

  // Re-adjust when value changes externally
  createEffect(() => {
    if (local.autoGrow) {
      adjustHeight();
    }
  });

  const handleInput: JSX.InputEventHandler<HTMLTextAreaElement, InputEvent> = (e) => {
    if (local.autoGrow) {
      adjustHeight();
    }
    if (typeof textareaProps.onInput === "function") {
      textareaProps.onInput(e);
    }
  };

  // Touch resize handlers for mobile
  const handleTouchStart = (e: TouchEvent) => {
    if (!textareaRef) return;
    setIsResizing(true);
    startY = e.touches[0].clientY;
    startHeight = textareaRef.offsetHeight;
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isResizing() || !textareaRef) return;
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    textareaRef.style.height = `${startHeight + diff}px`;
  };

  const handleTouchEnd = () => {
    setIsResizing(false);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  };

  // Cleanup event listeners on unmount (prevents memory leaks)
  onCleanup(() => {
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  });

  return (
    <div class="relative w-full">
      <textarea
        ref={textareaRef}
        rows={local.autoGrow ? 1 : undefined}
        {...textareaProps}
        onInput={handleInput}
        class={cn(
          // Base styles
          "flex w-full rounded-sm border bg-transparent px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow]",
          // Variant
          variantStyles[variant()],
          // Size (use auto-grow sizes if autoGrow is enabled)
          local.autoGrow ? autoGrowSizeStyles[size()] : sizeStyles[size()],
          // Auto-grow specific styles
          local.autoGrow && "resize-none overflow-hidden",
          // Custom resize handle class (non-autogrow)
          !local.autoGrow && "textarea-resize",
          local.class
        )}
      />

      {/* Mobile/Touch Resizer Handle (only for non-autogrow) */}
      <Show when={!local.autoGrow}>
        <div
          class="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center cursor-ns-resize md:hidden"
          onTouchStart={handleTouchStart}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            class="opacity-40"
          >
            <path d="M 6 9 L 9 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M 7 13 L 13 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M 11 14 L 14 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
      </Show>
    </div>
  );
};

export default Textarea;
