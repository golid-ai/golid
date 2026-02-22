import { Show, type Component } from "solid-js";
import { cn } from "~/lib/utils";
import { Button } from "~/components/atoms/Button";
import { snackbar as snackbarStore } from "~/lib/stores/snackbar";

// ============================================================================
// TYPES
// ============================================================================

export interface SnackbarProps {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Snackbar: Component<SnackbarProps> = (props) => {
  function handleAction() {
    if (props.onAction) props.onAction();
    snackbarStore.dismiss(props.id);
  }

  return (
    <div
      class={cn(
        "flex items-center gap-4 min-w-[200px] w-max max-w-[calc(100dvw-32px)] bg-[#1A1A1A]/95 dark:bg-[#0A0A0A]/95 text-white p-2.5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 select-none transition-all",
        !props.actionLabel ? "justify-center text-center px-8" : "justify-between px-5"
      )}
    >
      <div
        class={cn(
          "text-[13px] font-medium leading-tight py-1",
          props.actionLabel && "pr-4"
        )}
      >
        {props.message}
      </div>
      <Show when={props.actionLabel}>
        <Button
          variant="ghost"
          size="xs"
          class="text-cta-blue hover:text-cta-blue-active hover:bg-white/[0.08] font-black uppercase tracking-[0.15em] text-[11px] h-auto px-3 py-2 -mr-2 rounded-md transition-all active:scale-95"
          onClick={handleAction}
        >
          {props.actionLabel}
        </Button>
      </Show>
    </div>
  );
};

export default Snackbar;
