import { createSignal } from "solid-js";

/**
 * Shared tooltip state and event handlers for chart components.
 * Each chart creates its own instance via createChartTooltip().
 */
export function createChartTooltip() {
  const [hoveredData, setHoveredData] = createSignal<Record<string, unknown> | null>(null);
  const [tooltipPos, setTooltipPos] = createSignal({ x: 0, y: 0 });
  let isHoveringTooltip = false;
  let closeTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastClientPos = { x: 0, y: 0 };

  // Aggressive cleanup: if mouse moves far from the last hover point, clear immediately
  function handleGlobalMove(e: MouseEvent) {
    if (!hoveredData()) return;
    if (isHoveringTooltip) return;
    
    const dx = Math.abs(e.clientX - lastClientPos.x);
    const dy = Math.abs(e.clientY - lastClientPos.y);
    // If mouse moved more than 60px from the last data point, clear immediately
    if (dx > 60 || dy > 60) {
      clearTooltip();
    }
  }

  function clearTooltip() {
    if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
    setHoveredData(null);
    document.removeEventListener("mousemove", handleGlobalMove);
  }

  function attachHover(
    element: Element,
    data: Record<string, unknown>,
    context: Element | { ownerSVGElement?: SVGSVGElement | null; parentElement?: Element | null }
  ) {
    (element as HTMLElement).style.cursor = "pointer";
    const getContainer = () => {
      const ctx = context as { ownerSVGElement?: SVGSVGElement | null };
      return ctx.ownerSVGElement ?? context;
    };

    element.addEventListener("mouseenter", (e: Event) => {
      const me = e as MouseEvent;
      if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
      const containerRect = getContainer()?.parentElement?.getBoundingClientRect();
      if (containerRect) {
        setHoveredData(data);
        setTooltipPos({ x: me.clientX - containerRect.left, y: me.clientY - containerRect.top });
        lastClientPos = { x: me.clientX, y: me.clientY };
        // Start tracking global mouse for aggressive cleanup
        document.addEventListener("mousemove", handleGlobalMove);
      }
    });

    element.addEventListener("mousemove", (e: Event) => {
      const me = e as MouseEvent;
      const containerRect = getContainer()?.parentElement?.getBoundingClientRect();
      if (containerRect) {
        setTooltipPos({ x: me.clientX - containerRect.left, y: me.clientY - containerRect.top });
        lastClientPos = { x: me.clientX, y: me.clientY };
      }
    });

    element.addEventListener("mouseleave", () => {
      if (!isHoveringTooltip && !closeTimeout) {
        closeTimeout = setTimeout(() => {
          if (!isHoveringTooltip) {
            setHoveredData(null);
            document.removeEventListener("mousemove", handleGlobalMove);
          }
          closeTimeout = null;
        }, 50); // Reduced from 100ms to 50ms
      }
    });
  }

  function tooltipEnter() {
    isHoveringTooltip = true;
    if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
  }

  function tooltipLeave() {
    isHoveringTooltip = false;
    closeTimeout = setTimeout(() => {
      setHoveredData(null);
      document.removeEventListener("mousemove", handleGlobalMove);
    }, 50);
  }

  return {
    hoveredData,
    setHoveredData,
    tooltipPos,
    attachHover,
    tooltipEnter,
    tooltipLeave,
    clearTooltip,
  };
}
