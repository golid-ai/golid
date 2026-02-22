import { splitProps, type Component, type JSX, Show } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface WidgetProps {
  title: string;
  headerActions?: JSX.Element;
  children: JSX.Element;
  class?: string;
  contentClass?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Widget: Component<WidgetProps> = (props) => {
  const [local] = splitProps(props, [
    "title",
    "headerActions",
    "children",
    "class",
    "contentClass",
  ]);

  return (
    <div
      class={cn(
        "bg-foreground/[0.02] p-1 rounded-2xl border border-foreground/10 w-full flex flex-col",
        local.class
      )}
    >
      {/* Header */}
      <div class="px-5 py-3 border-b border-foreground/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 select-none">
            {local.title}
          </span>
        </div>

        <Show when={local.headerActions}>
          <div class="flex items-center gap-2">{local.headerActions}</div>
        </Show>
      </div>

      {/* Content */}
      <div class={cn("p-4 flex-1", local.contentClass)}>
        {local.children}
      </div>
    </div>
  );
};

export default Widget;
