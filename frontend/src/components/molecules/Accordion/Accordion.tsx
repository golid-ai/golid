import {
  createContext,
  useContext,
  type ParentProps,
  type Component,
  splitProps,
  Show,
} from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/atoms/Icon";

// ============================================================================
// TYPES
// ============================================================================

export type AccordionType = "single" | "multiple";

export interface AccordionProps extends ParentProps {
  /** Single = one panel at a time, Multiple = many can be open */
  type?: AccordionType;
  /** Currently open panel(s). String for single, string[] for multiple. */
  value: string | string[] | undefined;
  /** Callback when value changes */
  onValueChange: (value: string | string[] | undefined) => void;
  /** Whether panels can be fully collapsed in single mode (default: true) */
  collapsible?: boolean;
  /** Additional class */
  class?: string;
}

export interface AccordionItemProps extends ParentProps {
  /** Unique value identifying this panel */
  value: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class */
  class?: string;
}

export interface AccordionTriggerProps extends ParentProps {
  /** Title text */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** Show chevron icon (default: true) */
  showChevron?: boolean;
  /** Additional class */
  class?: string;
}

export interface AccordionContentProps extends ParentProps {
  /** Additional class */
  class?: string;
}

// ============================================================================
// ID GENERATION
// ============================================================================

let accordionIdCounter = 0;

// ============================================================================
// CONTEXT
// ============================================================================

interface AccordionContextValue {
  type: AccordionType;
  collapsible: boolean;
  accordionId: string;
  toggle: (val: string) => void;
  isOpen: (val: string) => boolean;
}

interface AccordionItemContextValue {
  value: string;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionContext = createContext<AccordionContextValue>();
const AccordionItemContext = createContext<AccordionItemContextValue>();

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used within Accordion");
  return ctx;
}

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error("AccordionTrigger/Content must be used within AccordionItem");
  return ctx;
}

// ============================================================================
// ACCORDION (root container)
// Manages open state, single/multiple modes
// ============================================================================

export const Accordion: Component<AccordionProps> = (props) => {
  const [local] = splitProps(props, [
    "type",
    "value",
    "onValueChange",
    "collapsible",
    "class",
    "children",
  ]);

  const type = () => local.type ?? "multiple";
  const collapsible = () => local.collapsible ?? true;
  const accordionId = `accordion-${++accordionIdCounter}`;

  function toggle(val: string) {
    if (type() === "single") {
      if (local.value === val) {
        if (collapsible()) local.onValueChange(undefined);
      } else {
        local.onValueChange(val);
      }
    } else {
      const arr = Array.isArray(local.value) ? [...local.value] : [];
      const index = arr.indexOf(val);
      if (index > -1) {
        arr.splice(index, 1);
      } else {
        arr.push(val);
      }
      local.onValueChange(arr);
    }
  }

  function isOpen(val: string): boolean {
    if (type() === "single") {
      return local.value === val;
    }
    return Array.isArray(local.value) && local.value.includes(val);
  }

  const ctx: AccordionContextValue = {
    get type() { return type(); },
    get collapsible() { return collapsible(); },
    accordionId,
    toggle,
    isOpen,
  };

  return (
    <AccordionContext.Provider value={ctx}>
      <div
        class={cn(
          "divide-y divide-foreground/5 border border-foreground/10 bg-foreground/[0.005] dark:bg-foreground/[0.02] rounded-2xl overflow-hidden shadow-sm",
          local.class
        )}
      >
        {local.children}
      </div>
    </AccordionContext.Provider>
  );
};

// ============================================================================
// ACCORDION ITEM (panel wrapper)
// ============================================================================

export const AccordionItem: Component<AccordionItemProps> = (props) => {
  const [local] = splitProps(props, [
    "value",
    "disabled",
    "class",
    "children",
  ]);

  const ctx = useAccordionContext();

  const itemCtx: AccordionItemContextValue = {
    get value() { return local.value; },
    get disabled() { return local.disabled ?? false; },
    get triggerId() { return `${ctx.accordionId}-trigger-${local.value}`; },
    get contentId() { return `${ctx.accordionId}-content-${local.value}`; },
  };

  return (
    <AccordionItemContext.Provider value={itemCtx}>
      <div class={cn("group/item", local.class)}>
        {local.children}
      </div>
    </AccordionItemContext.Provider>
  );
};

// ============================================================================
// ACCORDION TRIGGER (clickable header)
// Title + subtitle + chevron with rotation
// ============================================================================

export const AccordionTrigger: Component<AccordionTriggerProps> = (props) => {
  const [local] = splitProps(props, [
    "title",
    "subtitle",
    "showChevron",
    "class",
    "children",
  ]);

  const ctx = useAccordionContext();
  const item = useAccordionItemContext();

  const open = () => ctx.isOpen(item.value);
  const showChevron = () => local.showChevron ?? true;
  const isNonCollapsibleActive = () =>
    ctx.type === "single" && !ctx.collapsible && open();

  function handleClick() {
    if (!item.disabled) {
      ctx.toggle(item.value);
    }
  }

  return (
    <button
      type="button"
      id={item.triggerId}
      aria-expanded={open()}
      aria-controls={item.contentId}
      aria-disabled={isNonCollapsibleActive()}
      onClick={handleClick}
      class={cn(
        "flex w-full items-center justify-between px-6 py-4 text-left transition-all",
        "hover:bg-foreground/[0.02]",
        "focus-visible:outline-none focus-visible:bg-foreground/[0.05] z-10",
        open() && "bg-foreground/[0.01]",
        item.disabled && "cursor-not-allowed opacity-50",
        isNonCollapsibleActive() && "cursor-default",
        local.class
      )}
    >
      <div class="flex flex-1 items-center gap-4">
        <Show when={local.title}>
          <span class="text-sm font-bold text-foreground">{local.title}</span>
        </Show>

        <Show when={local.subtitle}>
          <span
            class={cn(
              "text-sm font-medium text-muted-foreground ml-auto pr-4 transition-colors duration-300",
              open() && "text-foreground opacity-90"
            )}
          >
            {local.subtitle}
          </span>
        </Show>

        {local.children}
      </div>

      <Show when={showChevron()}>
        <Icon
          name="expand_more"
          size={28}
          filled
          class={cn(
            "opacity-50 transition-all",
            open() && "rotate-180 opacity-100 text-primary"
          )}
        />
      </Show>
    </button>
  );
};

// ============================================================================
// ACCORDION CONTENT (collapsible body)
// Uses CSS grid-template-rows for smooth animation
// ============================================================================

export const AccordionContent: Component<AccordionContentProps> = (props) => {
  const [local] = splitProps(props, ["class", "children"]);

  const ctx = useAccordionContext();
  const item = useAccordionItemContext();

  const open = () => ctx.isOpen(item.value);

  return (
    <div
      id={item.contentId}
      role="region"
      aria-labelledby={item.triggerId}
      class={cn(
        "grid transition-[grid-template-rows] duration-300 ease-in-out",
        open() ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div class="overflow-hidden">
        <div
          class={cn(
            "px-6 py-4 text-sm text-muted-foreground leading-relaxed border-t border-foreground/5",
            local.class
          )}
        >
          {local.children}
        </div>
      </div>
    </div>
  );
};
