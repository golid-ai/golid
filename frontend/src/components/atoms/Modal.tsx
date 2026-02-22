import {
  Show,
  createEffect,
  onCleanup,
  splitProps,
  type Component,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";

// ============================================================================
// ID GENERATION
// ============================================================================

let modalIdCounter = 0;

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  message?: string;
  icon?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  children?: JSX.Element;
  footer?: JSX.Element;
  hideDefaultFooter?: boolean;
  maxWidth?: string;
  showCancel?: boolean;
  /** Center the modal vertically (better for large modals) */
  centered?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Modal: Component<ModalProps> = (props) => {
  const [local] = splitProps(props, [
    "open",
    "onOpenChange",
    "title",
    "message",
    "icon",
    "onConfirm",
    "onCancel",
    "confirmText",
    "cancelText",
    "variant",
    "children",
    "footer",
    "hideDefaultFooter",
    "maxWidth",
    "showCancel",
    "centered",
  ]);

  let backdropRef: HTMLDivElement | undefined;
  let previouslyFocusedElement: HTMLElement | null = null;

  // Unique IDs per modal instance
  const modalId = `modal-${++modalIdCounter}`;
  const titleId = `${modalId}-title`;
  const descId = `${modalId}-desc`;

  const variant = () => local.variant || "default";
  const confirmText = () => local.confirmText || "Confirm";
  const cancelText = () => local.cancelText || "Cancel";
  const maxWidth = () => local.maxWidth || "max-w-[500px]";
  const showCancel = () => local.showCancel !== false;
  const hideDefaultFooter = () => local.hideDefaultFooter || false;

  const handleClose = () => {
    if (local.onCancel) {
      local.onCancel();
    } else if (local.onOpenChange) {
      local.onOpenChange(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
    // Focus trap: cycle tab within the modal
    if (e.key === "Tab" && backdropRef) {
      const focusable = backdropRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === backdropRef) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  // Focus management and body scroll lock
  createEffect(() => {
    if (local.open) {
      // Save the element that had focus before the modal opened
      previouslyFocusedElement = document.activeElement as HTMLElement | null;
      // Focus the backdrop for keyboard events
      backdropRef?.focus();
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Restore focus to the element that triggered the modal
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === "function") {
        // Use setTimeout to ensure the modal is unmounted before restoring focus
        setTimeout(() => {
          previouslyFocusedElement?.focus();
          previouslyFocusedElement = null;
        }, 0);
      }
    }
  });

  onCleanup(() => {
    document.body.style.overflow = "";
  });

  return (
    <Show when={local.open}>
      <Portal>
        <div
          ref={backdropRef}
          class={cn("modal-backdrop", local.centered && "modal-backdrop-centered")}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby={local.title ? titleId : undefined}
          aria-describedby={local.message ? descId : undefined}
          tabindex="-1"
        >
          <div
            class={cn(
              "bg-[#E8F0F4] dark:bg-[#1A2633] border border-foreground/10 rounded-xl shadow-elevated p-8 w-[calc(100vw-2rem)] sm:w-full relative z-10 modal-content-enter max-h-[90vh] overflow-y-auto",
              maxWidth()
            )}
          >
            {/* Header */}
            <div class={cn("flex items-center gap-4 mb-6", !local.icon && "block")}>
              <Show when={local.icon}>
                <div
                  class={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-inner",
                    variant() === "destructive"
                      ? "bg-danger/10 text-danger border-danger/10"
                      : "bg-primary/10 text-primary border-primary/10"
                  )}
                >
                  <Icon name={local.icon!} class="text-2xl" filled />
                </div>
              </Show>
              <Show when={local.title}>
                <h2
                  id={titleId}
                  class="text-2xl font-bold font-montserrat tracking-tight text-foreground"
                >
                  {local.title}
                </h2>
              </Show>
            </div>

            {/* Message */}
            <Show when={local.message}>
              <p id={descId} class="text-base text-muted-foreground leading-relaxed mb-8">
                {local.message}
              </p>
            </Show>

            {/* Children */}
            <Show when={local.children}>
              <div class={cn((!hideDefaultFooter() || local.footer) && "mb-8")}>
                {local.children}
              </div>
            </Show>

            {/* Footer */}
            <Show when={!hideDefaultFooter()}>
              <Show when={local.footer} fallback={
                <div class="flex justify-end gap-3">
                  <Show when={showCancel()}>
                    <Button variant="neutral" onClick={handleClose}>
                      {cancelText()}
                    </Button>
                  </Show>
                  <Button
                    variant={variant() === "destructive" ? "destructive" : "default"}
                    onClick={local.onConfirm}
                  >
                    {confirmText()}
                  </Button>
                </div>
              }>
                {local.footer}
              </Show>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default Modal;
