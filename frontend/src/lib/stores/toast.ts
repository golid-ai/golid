import { createSignal } from "solid-js";

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  text?: string;
  entered?: boolean;
  exiting?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EXIT_ANIMATION_DURATION = 400; // ms - matches CSS animation duration
const AUTO_DISMISS_DURATION = 6000; // ms

// ============================================================================
// STORE
// ============================================================================

const [toasts, setToasts] = createSignal<ToastMessage[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>[]>();

function add(type: ToastType, message: string, text?: string) {
  const id = crypto.randomUUID();
  const toastItem: ToastMessage = { id, type, message, text, entered: false, exiting: false };

  // Add to the beginning to show new toasts at the top
  setToasts((prev) => [toastItem, ...prev]);
  const ids: ReturnType<typeof setTimeout>[] = [];

  // Mark as entered after animation completes (prevents re-animation on index shift)
  ids.push(setTimeout(() => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, entered: true } : t))
    );
  }, 400));

  // Auto-remove after duration
  ids.push(setTimeout(() => {
    dismiss(id);
  }, AUTO_DISMISS_DURATION));

  timers.set(id, ids);
}

// Start exit animation, then remove after animation completes
function dismiss(id: string) {
  // Mark as exiting to trigger exit animation
  setToasts((prev) =>
    prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
  );

  // Remove from DOM after animation completes
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, EXIT_ANIMATION_DURATION);
}

// Immediate remove (no animation)
function remove(id: string) {
  timers.get(id)?.forEach(clearTimeout);
  timers.delete(id);
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

export const toast = {
  get toasts() {
    return toasts();
  },
  subscribe: toasts,
  add,
  dismiss,
  remove,
  success: (message: string, text?: string) => add("success", message, text),
  error: (message: string, text?: string) => add("error", message, text),
  info: (message: string, text?: string) => add("info", message, text),
  warning: (message: string, text?: string) => add("warning", message, text),
};
