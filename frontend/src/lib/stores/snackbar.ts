// Snackbar — Material Design-style bottom notification with optional action button.
// For simple success/error feedback, prefer toast (~/lib/stores/toast).
// Both systems are available; use snackbar when you need an action button or undo.

import { createSignal } from "solid-js";

// ============================================================================
// TYPES
// ============================================================================

export interface SnackbarMessage {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  entered?: boolean;
  exiting?: boolean;
}

export interface SnackbarOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EXIT_ANIMATION_DURATION = 400; // ms - matches CSS animation duration

// ============================================================================
// STORE
// ============================================================================

const [snackbars, setSnackbars] = createSignal<SnackbarMessage[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>[]>();

function show(message: string, options: SnackbarOptions = {}) {
  const id = crypto.randomUUID();
  const snack: SnackbarMessage = {
    id,
    message,
    actionLabel: options.actionLabel,
    onAction: options.onAction,
    duration: options.duration ?? 5000,
    entered: false,
    exiting: false,
  };

  setSnackbars((prev) => [...prev, snack]);
  const ids: ReturnType<typeof setTimeout>[] = [];

  // Mark as entered after animation completes (prevents re-animation on index shift)
  ids.push(setTimeout(() => {
    setSnackbars((prev) =>
      prev.map((s) => (s.id === id ? { ...s, entered: true } : s))
    );
  }, 400));

  // Auto-remove after duration (unless duration is 0 = sticky)
  if (snack.duration && snack.duration > 0) {
    ids.push(setTimeout(() => {
      dismiss(id);
    }, snack.duration));
  }

  timers.set(id, ids);
}

// Start exit animation, then remove after animation completes
function dismiss(id: string) {
  // Mark as exiting to trigger exit animation
  setSnackbars((prev) =>
    prev.map((s) => (s.id === id ? { ...s, exiting: true } : s))
  );

  // Remove from DOM after animation completes
  setTimeout(() => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, EXIT_ANIMATION_DURATION);
}

// Immediate remove (no animation)
function remove(id: string) {
  // Clear any pending timers for this snackbar
  timers.get(id)?.forEach(clearTimeout);
  timers.delete(id);
  setSnackbars((prev) => prev.filter((s) => s.id !== id));
}

export const snackbar = {
  get snackbars() {
    return snackbars();
  },
  subscribe: snackbars,
  show,
  dismiss,
  remove,
  notify: (message: string, actionLabel?: string, onAction?: () => void) => {
    show(message, { actionLabel, onAction });
  },
};
