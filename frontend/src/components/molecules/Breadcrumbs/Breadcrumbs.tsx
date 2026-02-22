import { For, Show, splitProps, type Component } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export type BreadcrumbSize = 10 | 12 | 14 | 16;

export interface BreadcrumbsProps {
  /** Breadcrumb items (last item renders as current page) */
  items: BreadcrumbItem[];
  /** Text size scale (10, 12, 14, 16) */
  size?: BreadcrumbSize;
  /** Additional class */
  class?: string;
}

// ============================================================================
// SIZE CONFIG
// Size-driven classes for text, chevron, icon
// ============================================================================

const sizeClasses: Record<BreadcrumbSize, {
  text: string;
  chevron: string;
  chevronSize: number;
  icon: string;
  iconSize: number;
  gap: string;
  iconOpacity: string;
}> = {
  10: {
    text: "text-[10px]",
    chevron: "mx-1",
    chevronSize: 14,
    icon: "text-[12px]",
    iconSize: 12,
    gap: "gap-1",
    iconOpacity: "opacity-40",
  },
  12: {
    text: "text-[12px]",
    chevron: "mx-1.5",
    chevronSize: 16,
    icon: "text-[14px]",
    iconSize: 14,
    gap: "gap-1",
    iconOpacity: "opacity-50",
  },
  14: {
    text: "text-[14px]",
    chevron: "mx-2.5",
    chevronSize: 20,
    icon: "text-[16px]",
    iconSize: 16,
    gap: "gap-2",
    iconOpacity: "opacity-60",
  },
  16: {
    text: "text-[16px]",
    chevron: "mx-3",
    chevronSize: 24,
    icon: "text-[18px]",
    iconSize: 18,
    gap: "gap-2.5",
    iconOpacity: "opacity-70",
  },
};

// ============================================================================
// COMPONENT
// Multi-size breadcrumb with icon support
// ============================================================================

export const Breadcrumbs: Component<BreadcrumbsProps> = (props) => {
  const [local] = splitProps(props, ["items", "size", "class"]);

  const s = () => sizeClasses[local.size ?? 14];

  return (
    <nav aria-label="Breadcrumb" class={cn("flex", local.class)}>
      <ol class={cn("flex items-center flex-wrap leading-none transition-all", s().text)}>
        <For each={local.items}>
          {(item, i) => {
            const isLast = () => i() === local.items.length - 1;

            return (
              <li class="flex items-center">
                {/* Chevron separator (not on first item) */}
                <Show when={i() > 0}>
                  <Icon
                    name="chevron_right"
                    size={s().chevronSize}
                    class={cn("text-muted-foreground/20 shrink-0 select-none", s().chevron)}
                  />
                </Show>

                {/* Link (non-last items with href) */}
                <Show
                  when={item.href && !isLast()}
                  fallback={
                    <span
                      class={cn(
                        "flex items-center text-foreground font-semibold py-1",
                        s().gap
                      )}
                      aria-current={isLast() ? "page" : undefined}
                    >
                      <Show when={item.icon}>
                        <Icon name={item.icon!} size={s().iconSize} class="shrink-0" />
                      </Show>
                      <span class="truncate max-w-[150px] sm:max-w-none">{item.label}</span>
                    </span>
                  }
                >
                  <a
                    href={item.href}
                    class={cn(
                      "flex items-center text-muted-foreground hover:text-foreground transition-all duration-200 font-medium group py-1",
                      s().gap
                    )}
                  >
                    <Show when={item.icon}>
                      <Icon
                        name={item.icon!}
                        size={s().iconSize}
                        class={cn(
                          "transition-opacity shrink-0",
                          s().iconOpacity,
                          "group-hover:opacity-100"
                        )}
                      />
                    </Show>
                    <span class="truncate max-w-[120px] sm:max-w-none">{item.label}</span>
                  </a>
                </Show>
              </li>
            );
          }}
        </For>
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
