import { Show, For, createMemo } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";
import { auth } from "~/lib/auth";
import { ui } from "~/lib/stores/ui";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

export interface SidebarProps {
  class?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Settings", href: "/settings", icon: "settings" },
  { label: "Components", href: "/components", icon: "extension", adminOnly: true },
];

export function Sidebar(props: SidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => location.pathname.startsWith(href);

  const visibleItems = createMemo(() =>
    navItems.filter((item) => !item.adminOnly || auth.isAdmin)
  );

  const displayName = createMemo(() => {
    const u = auth.user;
    if (!u) return "Account";
    return u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : "Account";
  });

  return (
    <>
      {/* MOBILE: Full-screen overlay */}
      <Show when={ui.subscribeMobile()}>
        <div
          class={cn(
            "fixed inset-0 top-16 z-50 transition-all duration-200",
            props.collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <button
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={props.onToggle}
            aria-label="Close menu"
          />

          <aside class="absolute inset-x-4 top-4 bottom-4 bg-white dark:bg-midnight rounded-2xl shadow-2xl border border-foreground/10 flex flex-col overflow-hidden select-none">
            <div class="flex items-center justify-between p-4 border-b border-foreground/10">
              <A href="/settings" onClick={props.onToggle} class="flex items-center gap-3 min-w-0">
                <Icon name="account_circle" size={32} class="text-muted-foreground" />
                <p class="font-medium text-lg truncate">{displayName()}</p>
              </A>
              <button
                onClick={props.onToggle}
                class="p-2 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
                aria-label="Close menu"
              >
                <Icon name="close" size={28} />
              </button>
            </div>

            <nav class="flex-1 p-4 overflow-y-auto overflow-x-hidden grid grid-cols-2 gap-3 content-start">
              <For each={visibleItems()}>
                {(item) => (
                  <A
                    href={item.href}
                    onClick={props.onToggle}
                    class={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200",
                      isActive(item.href)
                        ? "bg-active-green/10 dark:bg-neon-green/10 border-active-green/30 dark:border-neon-green/30 text-active-green dark:text-neon-green"
                        : "bg-foreground/[0.02] border-foreground/5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    <Icon
                      name={item.icon}
                      size={32}
                      filled={isActive(item.href)}
                      class={cn(isActive(item.href) && "text-active-green dark:text-neon-green")}
                    />
                    <span class="text-xs font-bold uppercase tracking-wide">{item.label}</span>
                  </A>
                )}
              </For>
            </nav>

            <div class="p-4 border-t border-foreground/10">
              <button
                onClick={async () => {
                  await auth.logout();
                  window.location.href = "/";
                }}
                class="flex w-full items-center justify-center gap-3 p-4 rounded-xl text-danger bg-danger/5 hover:bg-danger/10 transition-colors"
              >
                <Icon name="logout" size={24} />
                <span class="font-bold uppercase tracking-wider">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      </Show>

      {/* DESKTOP: Fixed sidebar */}
      <aside
        class={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-64px)] border-r border-foreground/10 bg-white/80 dark:bg-midnight/80 backdrop-blur-lg flex flex-col overflow-hidden select-none transition-all duration-300",
          ui.subscribeMobile() ? "-translate-x-full" : "translate-x-0",
          props.class
        )}
        style={{ width: `${props.collapsed ? 80 : 256}px` }}
      >
        {/* Collapse toggle */}
        <div class="px-4 pt-4 pb-2 shrink-0 overflow-hidden">
          <button
            onClick={props.onToggle}
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground transition-all duration-200 group w-full"
            aria-label={props.collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Icon
              name="keyboard_double_arrow_left"
              size={22}
              class={cn(
                "transition-transform duration-300 shrink-0",
                props.collapsed ? "rotate-180" : "rotate-0"
              )}
            />
            <Show when={!props.collapsed}>
              <span class="text-xs font-semibold uppercase tracking-widest opacity-60 whitespace-nowrap">
                Collapse
              </span>
            </Show>
          </button>
          <div class="mt-2 border-b border-foreground/10" />
        </div>

        {/* Nav links */}
        <nav class="px-4 pb-4 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1">
          <A
            href="/settings"
            class={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group relative",
              isActive("/settings")
                ? "bg-foreground/5 text-foreground font-medium"
                : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
            )}
            title={props.collapsed ? displayName() : ""}
          >
            <Icon
              name="account_circle"
              size={22}
              filled={isActive("/settings")}
              class={cn(
                "transition-colors duration-200 shrink-0",
                isActive("/settings") ? "text-active-green dark:text-neon-green" : "group-hover:text-foreground"
              )}
            />
            <Show when={!props.collapsed}>
              <span class={cn(
                "text-sm whitespace-nowrap truncate",
                isActive("/settings") ? "text-active-green dark:text-neon-green" : ""
              )}>
                {displayName()}
              </span>
            </Show>
            <Show when={isActive("/settings")}>
              <div class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-active-green dark:bg-neon-green" />
            </Show>
          </A>

          <For each={visibleItems().filter(i => i.href !== "/settings")}>
            {(item) => (
              <A
                href={item.href}
                class={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group relative",
                  isActive(item.href)
                    ? "bg-foreground/5 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                )}
                title={props.collapsed ? item.label : ""}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  filled={isActive(item.href)}
                  class={cn(
                    "transition-colors duration-200 shrink-0",
                    isActive(item.href) ? "text-active-green dark:text-neon-green" : "group-hover:text-foreground"
                  )}
                />

                <Show when={!props.collapsed}>
                  <span
                    class={cn(
                      "text-sm whitespace-nowrap",
                      isActive(item.href) ? "text-active-green dark:text-neon-green" : ""
                    )}
                  >
                    {item.label}
                  </span>
                </Show>

                <Show when={isActive(item.href)}>
                  <div class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-active-green dark:bg-neon-green" />
                </Show>
              </A>
            )}
          </For>
        </nav>
      </aside>
    </>
  );
}
