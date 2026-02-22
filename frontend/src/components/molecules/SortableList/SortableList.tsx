import {
  createSignal,
  For,
  onCleanup,
  createEffect,
  type Component,
} from "solid-js";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface SortableItem {
  id: string | number;
  title: string;
}

export interface SortableListProps {
  /** Array of items to sort */
  items: SortableItem[];
  /** Callback when items are reordered */
  onReorder: (items: SortableItem[]) => void;
  /** Sort mode: insert (shift others) or swap (exchange positions) */
  mode?: "insert" | "swap";
  /** Additional class */
  class?: string;
}

// ============================================================================
// COMPONENT
// Pointer-based drag-and-drop reordering with FLIP animation.
// ============================================================================

export const SortableList: Component<SortableListProps> = (props) => {
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
  let originIndex: number | null = null;
  let containerRef: HTMLUListElement | undefined;
  const itemRects = new Map<number, DOMRect>();

  // Snapshot of item positions before reorder (for FLIP animation)
  const preReorderRects = new Map<string | number, DOMRect>();

  const isDragging = () => draggedIndex() !== null;
  const mode = () => props.mode ?? "insert";

  function updateRects() {
    if (!containerRef) return;
    itemRects.clear();
    Array.from(containerRef.children).forEach((child, i) => {
      itemRects.set(i, child.getBoundingClientRect());
    });
  }

  // Capture positions of all items before a reorder (the "First" in FLIP)
  function snapshotPositions() {
    if (!containerRef) return;
    preReorderRects.clear();
    const children = Array.from(containerRef.children) as HTMLElement[];
    props.items.forEach((item, i) => {
      if (children[i]) {
        preReorderRects.set(item.id, children[i].getBoundingClientRect());
      }
    });
  }

  // Animate items from old positions to new positions (the "Invert + Play" in FLIP)
  function animateFlip(newItems: SortableItem[]) {
    if (!containerRef) return;

    // Wait for DOM to update
    requestAnimationFrame(() => {
      const children = Array.from(containerRef!.children) as HTMLElement[];

      newItems.forEach((item, i) => {
        const child = children[i];
        if (!child) return;

        const oldRect = preReorderRects.get(item.id);
        if (!oldRect) return;

        const newRect = child.getBoundingClientRect();
        const deltaY = oldRect.top - newRect.top;

        // Skip animation for the dragged item (it stays in place visually)
        if (i === draggedIndex()) return;
        // Skip if no movement
        if (Math.abs(deltaY) < 1) return;

        // Invert: move to old position
        child.style.transform = `translateY(${deltaY}px)`;
        child.style.transition = "none";

        // Play: animate to new position
        requestAnimationFrame(() => {
          child.style.transform = "";
          child.style.transition = "transform 300ms ease-out";

          const cleanup = () => {
            child.style.transition = "";
            child.removeEventListener("transitionend", cleanup);
          };
          child.addEventListener("transitionend", cleanup);
        });
      });
    });
  }

  function reorder(from: number, to: number) {
    // Snapshot before reorder
    snapshotPositions();

    const newItems = [...props.items];
    if (mode() === "swap") {
      if (from !== originIndex) {
        [newItems[from], newItems[originIndex!]] = [newItems[originIndex!], newItems[from]];
      }
      [newItems[originIndex!], newItems[to]] = [newItems[to], newItems[originIndex!]];
    } else {
      const [item] = newItems.splice(from, 1);
      newItems.splice(to, 0, item);
    }

    props.onReorder(newItems);
    setDraggedIndex(to);
    updateRects();

    // FLIP animate after state update
    animateFlip(newItems);
  }

  function handlePointerDown(e: PointerEvent, index: number) {
    if (e.button !== 0) return;
    setDraggedIndex(index);
    originIndex = index;
    updateRects();
    containerRef?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (draggedIndex() === null || !containerRef) return;
    if (e.buttons === 0) return handlePointerUp();

    const { clientX: x, clientY: y } = e;
    const currentDragged = draggedIndex()!;

    for (const [i, rect] of itemRects.entries()) {
      if (i === currentDragged) continue;

      // Horizontal buffer — ignore if cursor is far outside the list
      const buffer = 200;
      if (x < rect.left - buffer || x > rect.right + buffer) continue;

      const midpoint = rect.top + rect.height / 2;
      if (
        (currentDragged < i && y > midpoint) ||
        (currentDragged > i && y < midpoint)
      ) {
        reorder(currentDragged, i);
        break;
      }
    }
  }

  function handlePointerUp() {
    setDraggedIndex(null);
    originIndex = null;
    itemRects.clear();
    preReorderRects.clear();
    // Blur active element to prevent lingering focus ring after click-and-release
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  // Focus the button inside the li at the given index
  function focusItemButton(index: number) {
    requestAnimationFrame(() => {
      const li = containerRef?.children[index] as HTMLElement | undefined;
      const btn = li?.querySelector("button") as HTMLButtonElement | undefined;
      btn?.focus();
    });
  }

  function handleKeyDown(e: KeyboardEvent, index: number) {
    const { key } = e;

    if (key === " " || key === "Enter") {
      e.preventDefault();
      if (draggedIndex() === null) {
        // Activate keyboard drag mode
        setDraggedIndex(index);
        originIndex = index;
        updateRects();
      } else {
        // Drop the item
        setDraggedIndex(null);
        originIndex = null;
        itemRects.clear();
        preReorderRects.clear();
        // Keep focus on current item
        focusItemButton(index);
      }
      return;
    }

    // Arrow keys during keyboard drag
    if (draggedIndex() !== null && (key === "ArrowUp" || key === "ArrowDown")) {
      e.preventDefault();
      e.stopPropagation();

      const to = key === "ArrowUp" ? index - 1 : index + 1;
      if (to >= 0 && to < props.items.length) {
        reorder(index, to);
        // Re-focus the button at the new position after DOM settles
        focusItemButton(to);
      }
      return;
    }

    if (draggedIndex() !== null && key === "Escape") {
      e.preventDefault();
      if (mode() === "swap" && draggedIndex() !== originIndex) {
        reorder(draggedIndex()!, originIndex!);
      }
      const returnTo = originIndex ?? 0;
      setDraggedIndex(null);
      originIndex = null;
      itemRects.clear();
      preReorderRects.clear();
      focusItemButton(returnTo);
      return;
    }
  }

  // Force grabbing cursor on body during drag
  createEffect(() => {
    if (isDragging()) {
      document.body.classList.add("is-grabbing");
      document.body.style.userSelect = "none";
      onCleanup(() => {
        document.body.classList.remove("is-grabbing");
        document.body.style.userSelect = "";
      });
    }
  });

  return (
    <ul
      ref={containerRef}
      class={cn(
        "space-y-2 relative list-none p-0 m-0",
        isDragging() ? "cursor-grabbing" : "cursor-default",
        props.class
      )}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      role="list"
      aria-label="Sortable list"
    >
      <For each={props.items}>
        {(item, i) => (
          <li
            role="listitem"
            class={cn(
              "touch-none outline-none rounded-xl group/sort-item overflow-hidden relative w-full text-left",
              // Only show focus ring when not actively dragging
              !isDragging() && "ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
              !isDragging() && "cursor-grab",
              draggedIndex() === i()
                ? "opacity-50 scale-[1.02] shadow-lg z-10 relative bg-primary/[0.08] is-dragging"
                : "z-0"
            )}
          >
            <button
              type="button"
              class="w-full h-full text-left outline-none bg-transparent border-none p-0 m-0"
              aria-grabbed={draggedIndex() === i()}
              aria-label={`Reorder ${item.title}`}
              onPointerDown={(e) => handlePointerDown(e, i())}
              onKeyDown={(e) => handleKeyDown(e, i())}
            >
              <div
                class={cn(
                  "flex items-center gap-4 px-5 py-3.5 bg-background border border-foreground/10 rounded-xl transition-all duration-300 shadow-sm",
                  "hover:border-foreground/20 hover:bg-foreground/[0.01] hover:shadow-md",
                  "group-[.is-dragging]/sort-item:bg-transparent group-[.is-dragging]/sort-item:border-transparent group-[.is-dragging]/sort-item:shadow-none",
                  "group/item relative"
                )}
              >
                <div class="text-foreground/30 group-hover/item:text-foreground/50 shrink-0 transition-colors flex items-center">
                  <Icon name="drag_indicator" size={20} />
                </div>
                <div class="flex-1 min-w-0 text-[13px] font-medium text-foreground/90 group-hover/item:text-foreground">
                  {item.title}
                </div>
              </div>
            </button>
          </li>
        )}
      </For>
    </ul>
  );
};

export default SortableList;
