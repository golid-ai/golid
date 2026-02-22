import {
  createContext,
  useContext,
  createSignal,
  onMount,
  onCleanup,
  Show,
  type ParentProps,
  type Accessor,
  type Component,
  splitProps,
} from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// CONTEXT
// ============================================================================

interface TabRegistration {
  name: string;
  disabled: boolean;
}

interface TabsContextValue {
  activeTab: Accessor<string>;
  setActiveTab: (name: string) => void;
  tabsId: string;
  label?: string;
  registerTab: (tab: TabRegistration) => () => void;
  tabs: Accessor<TabRegistration[]>;
}

const TabsContext = createContext<TabsContextValue>();

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab/TabList/TabPanel must be used within a Tabs provider");
  return ctx;
}

// ============================================================================
// TYPES
// ============================================================================

export interface TabsProps extends ParentProps {
  /** Currently active tab name */
  activeTab: string;
  /** Callback when active tab changes */
  onTabChange: (name: string) => void;
  /** Additional class for the container */
  class?: string;
  /** Accessible label for the tab list */
  label?: string;
}

export interface TabListProps extends ParentProps {
  /** Additional class for the tab list container */
  class?: string;
}

export interface TabProps extends ParentProps {
  /** Unique tab identifier */
  name: string;
  /** Success variant (green styling) */
  success?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class */
  class?: string;
}

export interface TabPanelProps extends ParentProps {
  /** Must match the corresponding Tab's name */
  name: string;
  /** Additional class */
  class?: string;
}

// ============================================================================
// ID GENERATION
// ============================================================================

let tabsIdCounter = 0;

// ============================================================================
// TABS (context provider)
// Wraps TabList and TabPanel children, provides shared state
// ============================================================================

export const Tabs: Component<TabsProps> = (props) => {
  const [local] = splitProps(props, [
    "activeTab",
    "onTabChange",
    "class",
    "children",
    "label",
  ]);

  const tabsId = `tabs-${++tabsIdCounter}`;
  const [tabs, setTabs] = createSignal<TabRegistration[]>([]);

  const registerTab = (tab: TabRegistration) => {
    setTabs((prev) => [...prev, tab]);
    return () => {
      setTabs((prev) => prev.filter((t) => t.name !== tab.name));
    };
  };

  const ctx: TabsContextValue = {
    get activeTab() {
      return () => local.activeTab;
    },
    setActiveTab: (name: string) => local.onTabChange(name),
    tabsId,
    label: local.label,
    registerTab,
    tabs,
  };

  return (
    <TabsContext.Provider value={ctx}>
      {local.children}
    </TabsContext.Provider>
  );
};

// ============================================================================
// TAB LIST (the tablist bar)
// Border-bottom nav with scrollable overflow
// Contains Tab buttons only
// ============================================================================

export const TabList: Component<TabListProps> = (props) => {
  const [local] = splitProps(props, ["class", "children"]);
  const ctx = useTabsContext();

  return (
    <div class={cn("border-b border-foreground/10", local.class)}>
      <div
        class="-mb-[2px] flex overflow-x-auto gap-1 scrollbar-none"
        role="tablist"
        aria-label={ctx?.label || "Tabs"}
      >
        {local.children}
      </div>
    </div>
  );
};

// ============================================================================
// TAB (individual tab button)
// Border-bottom-2 indicator, hover bg, success/disabled variants
// Full WAI-ARIA tab role with arrow key navigation
// ============================================================================

export const Tab: Component<TabProps> = (props) => {
  const [local] = splitProps(props, [
    "name",
    "success",
    "disabled",
    "class",
    "children",
  ]);

  const ctx = useTabsContext();
  const isActive = () => ctx.activeTab() === local.name;

  // Register this tab for arrow key navigation
  onMount(() => {
    const unregister = ctx.registerTab({
      get name() { return local.name; },
      get disabled() { return local.disabled ?? false; },
    });
    onCleanup(unregister);
  });

  const tabId = () => `${ctx.tabsId}-tab-${local.name}`;
  const panelId = () => `${ctx.tabsId}-panel-${local.name}`;

  /** Arrow key navigation between tabs (WAI-ARIA Tabs pattern) */
  const handleKeyDown = (e: KeyboardEvent) => {
    const allTabs = ctx.tabs();
    const enabledTabs = allTabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.name === local.name);
    if (currentIndex === -1) return;

    let targetIndex: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = enabledTabs.length - 1;
    }

    if (targetIndex !== null) {
      const targetTab = enabledTabs[targetIndex];
      ctx.setActiveTab(targetTab.name);
      // Focus the target tab element
      const targetEl = document.getElementById(`${ctx.tabsId}-tab-${targetTab.name}`);
      targetEl?.focus();
    }
  };

  return (
    <button
      type="button"
      role="tab"
      id={tabId()}
      aria-selected={isActive()}
      aria-controls={panelId()}
      aria-disabled={local.disabled || undefined}
      tabIndex={isActive() ? 0 : -1}
      disabled={local.disabled}
      onClick={() => !local.disabled && ctx.setActiveTab(local.name)}
      onKeyDown={handleKeyDown}
      class={cn(
        // Base
        "whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium transition-colors duration-200 flex items-center gap-2 disabled:cursor-not-allowed",
        "outline-none focus-visible:bg-foreground/[0.08] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-t-lg",
        // Active (non-success)
        isActive() && !local.success && "text-foreground border-primary bg-foreground/[0.03]",
        // Active success
        local.success && isActive() && "text-primary border-primary bg-primary/[0.03]",
        // Inactive success
        local.success && !isActive() && "text-primary/60 border-transparent hover:text-primary hover:border-primary/20 hover:bg-foreground/[0.04]",
        // Inactive (non-success, non-disabled)
        !isActive() && !local.success && !local.disabled && "text-muted-foreground border-transparent hover:text-foreground hover:border-foreground/20 hover:bg-foreground/[0.04]",
        // Disabled
        local.disabled && "text-muted-foreground/40 border-transparent",
        local.class
      )}
    >
      {local.children || local.name}
    </button>
  );
};

// ============================================================================
// TAB PANEL (content area linked to a tab)
// Only visible when the corresponding tab is active
// ============================================================================

export const TabPanel: Component<TabPanelProps> = (props) => {
  const [local] = splitProps(props, ["name", "class", "children"]);

  const ctx = useTabsContext();
  const isActive = () => ctx.activeTab() === local.name;

  const panelId = () => `${ctx.tabsId}-panel-${local.name}`;
  const tabId = () => `${ctx.tabsId}-tab-${local.name}`;

  return (
    <Show when={isActive()}>
      <div
        role="tabpanel"
        id={panelId()}
        aria-labelledby={tabId()}
        tabIndex={0}
        class={local.class}
      >
        {local.children}
      </div>
    </Show>
  );
};
