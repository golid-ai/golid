import { Index, type Component } from "solid-js";
import { snackbar } from "~/lib/stores/snackbar";
import { Snackbar } from "./Snackbar";

// ============================================================================
// COMPONENT
// ============================================================================

export const SnackbarManager: Component = () => {
  return (
    <div
      id="snackbarContainer"
      class="fixed bottom-8 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none gap-2 px-4"
    >
      <Index each={snackbar.subscribe()}>
        {(s) => (
          <div
            class={`pointer-events-auto backdrop-blur-md rounded-xl ${
              s().exiting ? "snack-exit" : s().entered ? "" : "snack-enter"
            }`}
          >
            <Snackbar
              id={s().id}
              message={s().message}
              actionLabel={s().actionLabel}
              onAction={s().onAction}
            />
          </div>
        )}
      </Index>
    </div>
  );
};

export default SnackbarManager;
