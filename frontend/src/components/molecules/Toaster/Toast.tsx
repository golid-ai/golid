import { type Component } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";
import type { ToastType } from "~/lib/stores/toast";

// ============================================================================
// TYPES
// ============================================================================

export interface ToastProps {
  type: ToastType;
  message: string;
  text?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const icons: Record<ToastType, string> = {
  success: "check_circle",
  info: "info",
  warning: "warning",
  error: "cancel",
};

const variants: Record<ToastType, string> = {
  success: "bg-cta-green/80 text-midnight dark:bg-neon-green/80",
  info: "bg-cta-blue/80 text-midnight dark:bg-neon-blue/80",
  warning: "bg-gold/80 text-midnight dark:bg-neon-gold/80",
  error: "bg-danger/80 text-white dark:bg-neon-red/80 dark:text-midnight",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Toast: Component<ToastProps> = (props) => {
  return (
    <div
      class={cn(
        "grid grid-cols-[32px_1fr] items-start w-[380px] max-w-[calc(100dvw-56px)] p-4 px-6 rounded-xl shadow-2xl border border-white/10 select-none transition-all gap-x-4",
        variants[props.type]
      )}
    >
      <div class="flex items-start justify-center pt-0.5">
        <Icon name={icons[props.type]} class="text-[32px]" />
      </div>
      <div class="flex flex-col">
        <span class="font-bold text-lg leading-tight">{props.message}</span>
        {props.text && (
          <div class="mt-0.5 text-sm font-medium opacity-90 leading-tight">
            {props.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
