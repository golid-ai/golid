import { Index, type Component } from "solid-js";
import { toast } from "~/lib/stores/toast";
import { Toast } from "./Toast";

// ============================================================================
// COMPONENT
// ============================================================================

export const Toaster: Component = () => {
  return (
    <div
      id="flashMessages"
      class="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none pt-6 gap-2"
    >
      <Index each={toast.subscribe()}>
        {(t) => (
          <div
            class={`pointer-events-auto backdrop-blur-xl rounded-xl ${
              t().exiting ? "toast-exit" : t().entered ? "" : "toast-enter"
            }`}
          >
            <Toast type={t().type} message={t().message} text={t().text} />
          </div>
        )}
      </Index>
    </div>
  );
};

export default Toaster;
