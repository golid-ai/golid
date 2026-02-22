import { splitProps, type Component, createMemo } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Label for the items being paginated (e.g. "profiles", "entries") */
  label?: string;
  /** Additional class names */
  class?: string;
}

// ============================================================================
// COMPONENT
// Industrial-style pagination bar
// ============================================================================

export const Pagination: Component<PaginationProps> = (props) => {
  const [local] = splitProps(props, [
    "page",
    "pageSize",
    "totalItems",
    "onPageChange",
    "label",
    "class",
  ]);

  const totalPages = createMemo(() =>
    Math.max(1, Math.ceil(local.totalItems / local.pageSize))
  );

  const startItem = createMemo(() =>
    local.totalItems === 0 ? 0 : (local.page - 1) * local.pageSize + 1
  );

  const endItem = createMemo(() =>
    Math.min(local.page * local.pageSize, local.totalItems)
  );

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages() && newPage !== local.page) {
      local.onPageChange(newPage);
    }
  }

  return (
    <div
      class={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-3 sm:py-2.5 bg-foreground/[0.01] border-t border-foreground/5",
        local.class
      )}
    >
      {/* Left: Item count */}
      <div class="flex items-center gap-4">
        <span class="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Showing{" "}
          <span class="text-foreground font-bold">
            {startItem()}-{endItem()}
          </span>{" "}
          of{" "}
          <span class="text-foreground font-bold">{local.totalItems}</span>{" "}
          {local.label ?? "items"}
        </span>
      </div>

      {/* Right: Page indicator + navigation */}
      <div class="flex flex-col items-end sm:flex-row sm:items-center gap-3 sm:gap-2 w-full sm:w-auto">
        {/* Page indicator pill */}
        <div class="flex items-center h-8 px-3 rounded-md bg-foreground/[0.02] border border-foreground/5 shrink-0">
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mr-3">
            Page
          </span>
          <div class="flex items-center font-mono text-[11px] font-bold tracking-tight">
            <span class="text-primary leading-none">{local.page}</span>
            <span class="mx-2 text-muted-foreground/20 font-medium leading-none">
              /
            </span>
            <span class="text-muted-foreground/60 leading-none">
              {totalPages()}
            </span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div class="flex items-center gap-1">
          <Button
            size="xs-icon"
            variant="neutral"
            disabled={local.page <= 1}
            onClick={() => goToPage(1)}
            aria-label="First page"
          >
            <Icon name="first_page" size={16} />
          </Button>
          <Button
            size="xs"
            variant="neutral"
            disabled={local.page <= 1}
            onClick={() => goToPage(local.page - 1)}
            class="px-3"
          >
            Prev
          </Button>
          <Button
            size="xs"
            variant="neutral"
            disabled={local.page >= totalPages()}
            onClick={() => goToPage(local.page + 1)}
            class="px-3"
          >
            Next
          </Button>
          <Button
            size="xs-icon"
            variant="neutral"
            disabled={local.page >= totalPages()}
            onClick={() => goToPage(totalPages())}
            aria-label="Last page"
          >
            <Icon name="last_page" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
