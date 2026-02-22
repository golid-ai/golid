import { createSignal } from "solid-js";

// ============================================================================
// TYPES
// ============================================================================

export type Theme = "light" | "dark";

// ============================================================================
// FAVICON
// ============================================================================

function updateFavicon(isDark: boolean) {
  const favicon = document.getElementById("favicon") as HTMLLinkElement | null;
  if (favicon) {
    favicon.href = isDark
      ? "/images/favicon-dark/favicon.svg"
      : "/images/favicon-light/favicon.svg";
  }
}

// ============================================================================
// STORE
// ============================================================================

const [isLoading, setIsLoading] = createSignal(false);
const [loadingMessage, setLoadingMessage] = createSignal("");
const [sidebarCollapsed, setSidebarCollapsed] = createSignal(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("sidebarCollapsed") !== "false"
    : true
);
const [isMobile, setIsMobileSignal] = createSignal(false);

export const ui = {
  // Loading
  get isLoading() { return isLoading(); },
  get loadingMessage() { return loadingMessage(); },
  subscribeLoading: isLoading,
  subscribeMessage: loadingMessage,
  setLoading: (visible: boolean, message: string = "") => {
    setIsLoading(visible);
    setLoadingMessage(message);
  },

  // Theme
  toggleTheme: () => {
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateFavicon(isDark);
    }
  },
  setTheme: (theme: Theme) => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
      updateFavicon(theme === "dark");
    }
  },

  // Sidebar
  get sidebarCollapsed() { return sidebarCollapsed(); },
  subscribeSidebar: sidebarCollapsed,
  toggleSidebar: () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("sidebarCollapsed", String(next));
      }
      return next;
    });
  },
  setSidebarCollapsed: (val: boolean) => {
    setSidebarCollapsed(val);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(val));
    }
  },

  // Mobile
  get isMobile() { return isMobile(); },
  subscribeMobile: isMobile,
  setIsMobile: (val: boolean) => {
    setIsMobileSignal(val);
    // Auto-collapse sidebar on mobile
    if (val && !sidebarCollapsed()) {
      setSidebarCollapsed(true);
    }
  },
};
