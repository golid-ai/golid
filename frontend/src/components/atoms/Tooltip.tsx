import {
  createSignal,
  type ParentProps,
  type Component,
} from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends ParentProps {
  /** The tooltip message to display */
  message: string;
  /** Position preference (will auto-flip if not enough space) */
  position?: TooltipPosition;
  /** Additional class for the container */
  class?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 mb-2 origin-bottom",
  bottom: "top-full left-1/2 mt-2 origin-top",
  left: "right-full top-1/2 mr-2 origin-right",
  right: "left-full top-1/2 ml-2 origin-left",
};

// ============================================================================
// ID GENERATION
// ============================================================================

let tooltipIdCounter = 0;

// ============================================================================
// COMPONENT
// ============================================================================

export const Tooltip: Component<TooltipProps> = (props) => {
  const [activePosition, setActivePosition] = createSignal<TooltipPosition>(
    props.position || "top"
  );
  const [nudgeX, setNudgeX] = createSignal(0);
  const [nudgeY, setNudgeY] = createSignal(0);

  let containerEl: HTMLDivElement | undefined;
  let tooltipEl: HTMLDivElement | undefined;
  const tooltipId = `tooltip-${++tooltipIdCounter}`;

  function calculateDirection() {
    if (!containerEl || !tooltipEl) return;

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;

    const triggerRect = containerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    const navHeight = 80;
    const padding = 12;

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top - navHeight;
    const spaceRight = viewportWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;

    // Determine Direction Flip
    const preferredPos = props.position || "top";
    let newPos = preferredPos;

    if (preferredPos === "top" && spaceAbove < tooltipRect.height && spaceBelow > spaceAbove) {
      newPos = "bottom";
    } else if (preferredPos === "bottom" && spaceBelow < tooltipRect.height && spaceAbove > spaceBelow) {
      newPos = "top";
    } else if (preferredPos === "right" && spaceRight < tooltipRect.width && spaceLeft > spaceRight) {
      newPos = "left";
    } else if (preferredPos === "left" && spaceLeft < tooltipRect.width && spaceRight > spaceLeft) {
      newPos = "right";
    }
    setActivePosition(newPos);

    // Determine Nudging
    let nx = 0;
    let ny = 0;

    if (newPos === "top" || newPos === "bottom") {
      const expectedCenterX = triggerRect.left + triggerRect.width / 2;
      const leftEdge = expectedCenterX - tooltipRect.width / 2;
      const rightEdge = expectedCenterX + tooltipRect.width / 2;

      if (leftEdge < padding) {
        nx = padding - leftEdge;
      } else if (rightEdge > viewportWidth - padding) {
        nx = viewportWidth - padding - rightEdge;
      }
    } else {
      // Left/Right vertical nudging
      const expectedCenterY = triggerRect.top + triggerRect.height / 2;
      const topEdge = expectedCenterY - tooltipRect.height / 2;
      const bottomEdge = expectedCenterY + tooltipRect.height / 2;

      if (topEdge < navHeight + padding) {
        ny = navHeight + padding - topEdge;
      } else if (bottomEdge > viewportHeight - padding) {
        ny = viewportHeight - padding - bottomEdge;
      }
    }

    setNudgeX(nx);
    setNudgeY(ny);
  }

  const transformStyle = () => {
    const pos = activePosition();
    if (pos === "top" || pos === "bottom") {
      return `translateX(calc(-50% + ${nudgeX()}px))`;
    } else {
      return `translateY(calc(-50% + ${nudgeY()}px))`;
    }
  };

  return (
    <div
      ref={containerEl}
      class={cn("group relative", props.class)}
      onMouseEnter={calculateDirection}
      onFocusIn={calculateDirection}
      aria-describedby={tooltipId}
    >
      <div
        ref={tooltipEl}
        id={tooltipId}
        role="tooltip"
        class={cn(
          "pointer-events-none absolute z-50 w-max max-w-[260px] break-words rounded-md px-3 py-2 text-xs font-bold shadow-xl transition-[opacity,transform] duration-200 scale-95 group-hover:opacity-100 group-hover:scale-100 opacity-0",
          "bg-midnight text-white border border-white/10",
          "dark:bg-white dark:text-midnight dark:border-midnight/10",
          "group-focus-within:opacity-100 group-focus-within:scale-100",
          positionClasses[activePosition()]
        )}
        style={{ transform: transformStyle() }}
      >
        {props.message}
      </div>
      {props.children}
    </div>
  );
};

export default Tooltip;
