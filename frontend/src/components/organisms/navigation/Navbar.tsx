import { createSignal, onMount, Show, Switch, Match } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";
import { auth } from "~/lib/auth";
import { ui } from "~/lib/stores/ui";

export interface NavbarProps {
  class?: string;
  showMenuButton?: boolean;
  onMenuToggle?: () => void;
}

export function Navbar(props: NavbarProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = createSignal(false);
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  const handleLogout = async () => {
    await auth.logout();
    navigate("/");
  };

  const navigateTo = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleMenuKeyDown = (e: KeyboardEvent) => {
    const menu = e.currentTarget as HTMLElement;
    const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const idx = items.indexOf(e.target as HTMLElement);

    switch (e.key) {
      case "Escape":
        setMobileMenuOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
        break;
    }
  };

  return (
    <header
      class={cn(
        "fixed top-0 z-[60] w-full border-b border-foreground/10 bg-white/80 dark:bg-midnight/80 backdrop-blur-lg transition-all duration-300",
        props.class
      )}
    >
      <div class="flex items-center justify-between px-6 py-3 w-full">
        {/* Left: Logo */}
        <div class="flex items-center gap-6">
          <A
            href="/"
            class="flex items-center space-x-2 group text-foreground outline-none"
            aria-label="Home"
          >
            <div class="px-1 py-1.5 rounded-lg transition-colors duration-300">
              <span class="text-lg font-bold tracking-tight text-midnight dark:text-mist group-hover:text-cta-green transition-colors duration-300">
                Golid
              </span>
            </div>
          </A>
        </div>

        {/* Right Side */}
        <nav class="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <Show when={mounted()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => ui.toggleTheme()}
              class="text-neutral-foreground hover:bg-neutral rounded-[6px] group transition-all duration-300"
              aria-label="Toggle theme"
            >
              <Icon
                name="light_mode"
                size={20}
                class={cn(
                  "absolute transition-opacity duration-200",
                  "opacity-100 group-hover:opacity-0 dark:opacity-0"
                )}
              />
              <Icon
                name="dark_mode"
                size={20}
                class={cn(
                  "absolute transition-opacity duration-200",
                  "opacity-0 group-hover:opacity-100 dark:opacity-100 dark:group-hover:opacity-0"
                )}
              />
              <Icon
                name="light_mode"
                size={20}
                filled
                class={cn(
                  "transition-opacity duration-200",
                  "opacity-0 dark:opacity-0 dark:group-hover:opacity-100"
                )}
              />
            </Button>
          </Show>

          {/* Auth buttons */}
          <Switch>
            <Match when={auth.initialized && auth.isAuthenticated}>
              <Button onClick={() => navigateTo("/dashboard")} variant="neutral" class="hidden sm:inline-flex">
                Dashboard
              </Button>
              <Button onClick={handleLogout} variant="outline" class="hidden md:inline-flex">
                Logout
              </Button>
              <Show when={props.showMenuButton}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={props.onMenuToggle}
                  class="text-muted-foreground hover:text-foreground"
                  aria-label="Toggle Sidebar"
                >
                  <Icon name="menu" />
                </Button>
              </Show>
            </Match>
            <Match when={auth.initialized && !auth.isAuthenticated}>
              <Button onClick={() => navigateTo("/login")} class="hidden sm:inline-flex">
                Login
              </Button>
              <Button onClick={() => navigateTo("/signup")} variant="neutral" class="hidden sm:inline-flex">
                Sign Up
              </Button>
            </Match>
          </Switch>

          {/* Mobile hamburger */}
          <Show when={!props.showMenuButton}>
            <div class="relative sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
                class="text-muted-foreground hover:text-foreground"
                aria-label="Menu"
                aria-expanded={mobileMenuOpen()}
                aria-haspopup="true"
              >
                <Icon name={mobileMenuOpen() ? "close" : "menu"} />
              </Button>

              <Show when={mobileMenuOpen()}>
                <button
                  class="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                />

                <div role="menu" onKeyDown={handleMenuKeyDown} class="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border border-foreground/10 bg-white dark:bg-midnight shadow-lg py-2">
                  <Switch>
                    <Match when={auth.initialized && auth.isAuthenticated}>
                      <button
                        role="menuitem"
                        onClick={() => navigateTo("/dashboard")}
                        class="w-full px-4 py-2.5 text-left text-sm hover:bg-foreground/5 flex items-center gap-3"
                      >
                        <Icon name="dashboard" size={20} />
                        Dashboard
                      </button>
                      <hr class="my-2 border-foreground/10" />
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        class="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-foreground/5 flex items-center gap-3"
                      >
                        <Icon name="logout" size={20} />
                        Logout
                      </button>
                    </Match>
                    <Match when={auth.initialized && !auth.isAuthenticated}>
                      <hr class="my-2 border-foreground/10" />
                      <button
                        role="menuitem"
                        onClick={() => navigateTo("/login")}
                        class="w-full px-4 py-2.5 text-left text-sm hover:bg-foreground/5 flex items-center gap-3"
                      >
                        <Icon name="login" size={20} />
                        Login
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => navigateTo("/signup")}
                        class="w-full px-4 py-2.5 text-left text-sm hover:bg-foreground/5 flex items-center gap-3"
                      >
                        <Icon name="person_add" size={20} />
                        Sign Up
                      </button>
                    </Match>
                  </Switch>
                </div>
              </Show>
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
}
