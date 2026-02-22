import {
  createSignal,
  createContext,
  useContext,
  onMount,
  onCleanup,
  createEffect,
  type ParentProps,
  type JSX,
  type Accessor,
} from "solid-js";

// ============================================================================
// TYPES
// ============================================================================

export type MenuPosition = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export interface MenuItem {
  id: string;
  element: HTMLElement;
}

export interface MenuContextValue {
  open: Accessor<boolean>;
  vDirection: Accessor<"top" | "bottom">;
  hFlip: Accessor<boolean>;
  activeIndex: Accessor<number>;
  items: Accessor<MenuItem[]>;
  position: MenuPosition;
  menuId: string;
  toggle: () => void;
  close: () => void;
  registerItem: (item: MenuItem) => () => void;
  handleKeydown: (e: KeyboardEvent) => void;
}

export interface SubmenuContextValue {
  open: Accessor<boolean>;
  vDirection: Accessor<"up" | "down">;
  hDirection: Accessor<"left" | "right">;
  activeIndex: Accessor<number>;
  items: Accessor<MenuItem[]>;
  menuId: string;
  toggle: () => void;
  openMenu: () => void;
  close: () => void;
  delayedClose: () => void;
  registerItem: (item: MenuItem) => () => void;
  handleKeydown: (e: KeyboardEvent) => void;
}

// ============================================================================
// CONTEXTS
// ============================================================================

const MenuContext = createContext<MenuContextValue>();
const SubmenuContext = createContext<SubmenuContextValue>();
const ParentMenuContext = createContext<MenuContextValue>();

export const useMenu = () => useContext(MenuContext);
export const useSubmenu = () => useContext(SubmenuContext);
export const useParentMenu = () => useContext(ParentMenuContext);

// ============================================================================
// UTILITY
// ============================================================================

let idCounter = 0;
const generateId = () => `menu-${++idCounter}`;

// ============================================================================
// MENU (Root)
// ============================================================================

export interface MenuProps extends ParentProps {
  position?: MenuPosition;
}

export function Menu(props: MenuProps) {
  const position = props.position || "bottom-start";
  const menuId = generateId();
  
  const [open, setOpen] = createSignal(false);
  const [vDirection, setVDirection] = createSignal<"top" | "bottom">("bottom");
  const [hFlip, setHFlip] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [items, setItems] = createSignal<MenuItem[]>([]);
  
  let menuEl: HTMLDivElement | undefined;
  let lastOpenTime = 0;
  let isMouseDownInside = false;

  function calculateDirection() {
    if (!menuEl) return;
    
    const rect = menuEl.getBoundingClientRect();
    const navHeight = 80;
    const menuHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top - navHeight;
    const spaceRight = window.innerWidth - rect.left;
    const spaceLeft = rect.right;

    const baseV = position.startsWith("bottom") ? "bottom" : "top";

    if (baseV === "bottom") {
      setVDirection(spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom");
    } else {
      setVDirection(spaceAbove < menuHeight && spaceBelow > spaceAbove ? "bottom" : "top");
    }

    // Horizontal collision detection
    const menuWidth = 224;
    const isStart = position.endsWith("-start");
    const isEnd = position.endsWith("-end");

    setHFlip(false);
    if (isStart && spaceRight < menuWidth && spaceLeft > spaceRight) {
      setHFlip(true);
    } else if (isEnd && spaceLeft < menuWidth && spaceRight > spaceLeft) {
      setHFlip(true);
    }
  }

  function toggle() {
    const now = Date.now();
    if (now - lastOpenTime < 300 && open()) {
      return;
    }
    if (!open()) {
      calculateDirection();
      lastOpenTime = now;
    }
    setOpen(!open());
  }

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function registerItem(item: MenuItem) {
    setItems((prev) => [...prev, item]);
    return () => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    };
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open()) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        calculateDirection();
        setOpen(true);
        if (e.key === "ArrowDown") setActiveIndex(0);
        if (e.key === "ArrowUp") setActiveIndex(items().length - 1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items().length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items().length) % items().length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const idx = activeIndex();
      if (idx !== -1) {
        items()[idx].element.click();
      }
      close();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function handleFocusOut(_e: FocusEvent) {
    if (isMouseDownInside) return;
    setTimeout(() => {
      if (!menuEl?.contains(document.activeElement)) {
        close();
      }
    }, 0);
  }

  function handleClickOutside(e: MouseEvent) {
    if (open() && menuEl && !menuEl.contains(e.target as Node)) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  const contextValue: MenuContextValue = {
    open,
    vDirection,
    hFlip,
    activeIndex,
    items,
    position,
    menuId,
    toggle,
    close,
    registerItem,
    handleKeydown,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      <div
        ref={menuEl}
        class="relative"
        onFocusOut={handleFocusOut}
        onMouseDown={() => { isMouseDownInside = true; }}
        onMouseUp={() => { setTimeout(() => { isMouseDownInside = false; }, 0); }}
      >
        {props.children}
      </div>
    </MenuContext.Provider>
  );
}

// ============================================================================
// MENU TRIGGER
// ============================================================================

export interface MenuTriggerProps {
  children: (props: {
    "aria-haspopup": "true";
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
  }) => JSX.Element;
}

export function MenuTrigger(props: MenuTriggerProps) {
  const menu = useMenu()!;

  return props.children({
    "aria-haspopup": "true",
    "aria-expanded": menu.open(),
    "aria-controls": menu.menuId,
    onClick: menu.toggle,
    onKeyDown: menu.handleKeydown,
  });
}

// ============================================================================
// MENU CONTENT
// ============================================================================

export interface MenuContentProps extends ParentProps {
  class?: string;
}

import { Show } from "solid-js";
import { cn } from "~/lib/utils";

export function MenuContent(props: MenuContentProps) {
  const menu = useMenu()!;

  const activePosition = () => {
    const base = menu.position;
    const h = menu.hFlip()
      ? base.endsWith("-start")
        ? "end"
        : "start"
      : base.endsWith("-start")
      ? "start"
      : "end";

    return `${menu.vDirection()}-${h}`;
  };

  const positionClasses: Record<string, string> = {
    "bottom-start": "left-0 mt-3 origin-top",
    "bottom-end": "right-0 mt-3 origin-top",
    "top-start": "left-0 bottom-full mb-3 origin-bottom",
    "top-end": "right-0 bottom-full mb-3 origin-bottom",
  };

  return (
    <Show when={menu.open()}>
      <div
        class={cn(
          "absolute z-[60] w-56 rounded-sm border border-foreground/10 dark:border-white/10 backdrop-blur-lg text-popover-foreground p-2 shadow-2xl",
          "bg-[#E8F0F4] dark:bg-[#1A2633]",
          "animate-in fade-in-0 zoom-in-95",
          positionClasses[activePosition()],
          props.class
        )}
        role="menu"
        id={menu.menuId}
        aria-orientation="vertical"
      >
        {props.children}
      </div>
    </Show>
  );
}

// ============================================================================
// MENU ITEM
// ============================================================================

export interface MenuItemProps extends ParentProps {
  class?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function MenuItem(props: MenuItemProps) {
  const menu = useMenu()!;
  const id = generateId();
  let el: HTMLDivElement | undefined;

  onMount(() => {
    if (el) {
      const unregister = menu.registerItem({ id, element: el });
      onCleanup(unregister);
    }
  });

  const index = () => menu.items().findIndex((i) => i.id === id);
  const active = () => menu.activeIndex() === index();

  createEffect(() => {
    if (active() && el) {
      el.scrollIntoView({ block: "nearest" });
      el.focus();
    }
  });

  function handleClick() {
    if (props.disabled) return;
    if (props.onClick) {
      props.onClick();
    }
    menu.close();
  }

  return (
    <div
      ref={el}
      class={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
        "hover:bg-foreground/[0.05]",
        active() && "bg-foreground/[0.08]",
        props.disabled && "pointer-events-none opacity-50",
        props.class
      )}
      role="menuitem"
      tabIndex={active() ? 0 : -1}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Escape") {
          menu.handleKeydown(e);
        } else if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleClick();
        }
      }}
      data-disabled={props.disabled ? "" : undefined}
    >
      {props.children}
    </div>
  );
}

// ============================================================================
// SUBMENU
// ============================================================================

export interface SubmenuProps extends ParentProps {}

export function Submenu(props: SubmenuProps) {
  const parentMenu = useMenu()!;
  const menuId = generateId();

  const [open, setOpen] = createSignal(false);
  const [vDirection, setVDirection] = createSignal<"up" | "down">("down");
  const [hDirection, setHDirection] = createSignal<"left" | "right">("right");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [items, setItems] = createSignal<MenuItem[]>([]);

  let containerEl: HTMLDivElement | undefined;
  let closeTimer: ReturnType<typeof setTimeout>;
  let lastOpenTime = 0;

  function calculateDirection() {
    if (!containerEl) return;

    const rect = containerEl.getBoundingClientRect();
    const navHeight = 80;
    const menuHeight = 320;
    const spaceBelow = window.innerHeight - rect.top;
    const spaceAbove = rect.bottom - navHeight;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    setVDirection(spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down");
    setHDirection(spaceRight < 240 && spaceLeft > spaceRight ? "left" : "right");
  }

  function toggle() {
    const now = Date.now();
    if (now - lastOpenTime < 300 && open()) {
      return;
    }
    if (!open()) {
      calculateDirection();
      lastOpenTime = now;
    }
    setOpen(!open());
  }

  function openMenu() {
    clearTimeout(closeTimer);
    if (!open()) {
      calculateDirection();
      lastOpenTime = Date.now();
    }
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function delayedClose() {
    closeTimer = setTimeout(() => {
      close();
    }, 150);
  }

  function registerItem(item: MenuItem) {
    setItems((prev) => [...prev, item]);
    return () => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    };
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open()) {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        calculateDirection();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items().length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items().length) % items().length);
    } else if (e.key === "ArrowLeft" || e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const idx = activeIndex();
      if (idx !== -1) {
        items()[idx].element.click();
      }
      close();
      parentMenu.close();
    }
  }

  const submenuContext: SubmenuContextValue = {
    open,
    vDirection,
    hDirection,
    activeIndex,
    items,
    menuId,
    toggle,
    openMenu,
    close,
    delayedClose,
    registerItem,
    handleKeydown,
  };

  // Submenu items need a menu context too
  const menuContextForItems: MenuContextValue = {
    open,
    vDirection: () => vDirection() === "down" ? "bottom" : "top",
    hFlip: () => hDirection() === "left",
    activeIndex,
    items,
    position: "bottom-start",
    menuId,
    toggle,
    close: () => {
      close();
      parentMenu.close();
    },
    registerItem,
    handleKeydown,
  };

  return (
    <SubmenuContext.Provider value={submenuContext}>
      <ParentMenuContext.Provider value={parentMenu}>
        <MenuContext.Provider value={menuContextForItems}>
          <div ref={containerEl} class="relative group/submenu">
            {props.children}
          </div>
        </MenuContext.Provider>
      </ParentMenuContext.Provider>
    </SubmenuContext.Provider>
  );
}

// ============================================================================
// SUBMENU TRIGGER
// ============================================================================

import { Icon } from "~/components/atoms/Icon";

export interface SubmenuTriggerProps extends ParentProps {
  class?: string;
}

export function SubmenuTrigger(props: SubmenuTriggerProps) {
  const parentMenu = useParentMenu()!;
  const submenu = useSubmenu()!;
  const id = generateId();
  let el: HTMLDivElement | undefined;

  onMount(() => {
    if (el) {
      const unregister = parentMenu.registerItem({ id, element: el });
      onCleanup(unregister);
    }
  });

  const index = () => parentMenu.items().findIndex((i) => i.id === id);
  const active = () => parentMenu.activeIndex() === index();

  createEffect(() => {
    if (active() && el) {
      el.scrollIntoView({ block: "nearest" });
      el.focus();
    }
  });

  return (
    <div
      ref={el}
      class={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
        "hover:bg-foreground/[0.05]",
        (active() || submenu.open()) && "bg-foreground/[0.08]",
        props.class
      )}
      role="menuitem"
      aria-haspopup="true"
      aria-expanded={submenu.open()}
      tabIndex={active() ? 0 : -1}
      onClick={submenu.toggle}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          parentMenu.handleKeydown(e);
        } else {
          submenu.handleKeydown(e);
        }
      }}
      onMouseEnter={submenu.openMenu}
      onMouseLeave={submenu.delayedClose}
    >
      <div class="flex items-center gap-2">{props.children}</div>
      <Icon name="chevron_right" class="text-xl opacity-70 ml-2" />
    </div>
  );
}

// ============================================================================
// SUBMENU CONTENT
// ============================================================================

export interface SubmenuContentProps extends ParentProps {
  class?: string;
}

export function SubmenuContent(props: SubmenuContentProps) {
  const submenu = useSubmenu()!;

  return (
    <Show when={submenu.open()}>
      <div
        class={cn(
          "absolute z-[65] w-56 rounded-sm border border-foreground/10 dark:border-white/10 backdrop-blur-lg text-popover-foreground p-2 shadow-2xl",
          "bg-[#E8F0F4] dark:bg-[#1A2633]",
          "animate-in fade-in-0 zoom-in-95",
          // Horizontal Positioning
          submenu.hDirection() === "left" ? "right-full mr-4 origin-right" : "left-full ml-4 origin-left",
          // Vertical Alignment
          submenu.vDirection() === "up" ? "bottom-[-8px]" : "top-[-8px]",
          props.class
        )}
        role="menu"
        tabIndex={-1}
        id={submenu.menuId}
        aria-orientation="vertical"
        onMouseEnter={submenu.openMenu}
        onMouseLeave={submenu.delayedClose}
      >
        {props.children}
      </div>
    </Show>
  );
}

// ============================================================================
// MENU SEPARATOR
// ============================================================================

export function MenuSeparator() {
  return <div class="h-px my-1 bg-foreground/10" />;
}
