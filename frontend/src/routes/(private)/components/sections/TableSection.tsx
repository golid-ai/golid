import { createSignal, createMemo, For, lazy, Suspense } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { Link } from "~/components/atoms/Link";
import { Pagination } from "~/components/molecules/Pagination/Pagination";

const AgGrid = lazy(() => import("~/components/atoms/AgGrid/AgGrid").then(m => ({ default: m.AgGrid })));

// =============================================================================
// MOCK DATA (hoisted, never re-evaluated)
// =============================================================================

const mockData = [
  { id: "1", name: "Acme Corp", status: "Active", category: "Enterprise", volume: "1.2TB", lastSync: "2m ago" },
  { id: "2", name: "Global Tech", status: "Pending", category: "Mid-Market", volume: "450GB", lastSync: "1h ago" },
  { id: "3", name: "Nexus Solutions", status: "Active", category: "Enterprise", volume: "2.8TB", lastSync: "15m ago" },
  { id: "4", name: "Vertex Systems", status: "Error", category: "Startup", volume: "120GB", lastSync: "3d ago" },
  { id: "5", name: "Horizon Labs", status: "Inactive", category: "Research", volume: "890GB", lastSync: "5h ago" },
  { id: "6", name: "Solaris Data", status: "Active", category: "Enterprise", volume: "4.1TB", lastSync: "10m ago" },
  { id: "7", name: "Cyberdyne", status: "Pending", category: "Defense", volume: "12.5TB", lastSync: "30m ago" },
  { id: "8", name: "Initech", status: "Error", category: "Services", volume: "2.1TB", lastSync: "1d ago" },
  { id: "9", name: "Umbrella Corp", status: "Active", category: "Bio-Tech", volume: "8.4TB", lastSync: "45m ago" },
  { id: "10", name: "Stark Ind.", status: "Active", category: "Defense", volume: "15.2TB", lastSync: "12m ago" },
  { id: "11", name: "Wayne Ent.", status: "Pending", category: "Enterprise", volume: "9.1TB", lastSync: "1h ago" },
  { id: "12", name: "Oscorp", status: "Inactive", category: "Chemical", volume: "3.6TB", lastSync: "2d ago" },
];

// =============================================================================
// AG GRID CONFIG
// =============================================================================

const columnDefs = [
  { field: "id", headerName: "ID", maxWidth: 140 },
  { field: "name", headerName: "Company" },
  { field: "status", headerName: "Status" },
  { field: "category", headerName: "Category" },
  { field: "volume", headerName: "Volume" },
  { field: "lastSync", headerName: "Last Sync" },
];

const gridOptions = {
  rowData: mockData,
  columnDefs,
  defaultColDef: {
    filter: true,
    sortable: true,
    resizable: true,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function getChipClasses(status: string): string {
  const base =
    "inline-flex items-center justify-center px-2.5 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-widest select-none";
  switch (status.toLowerCase()) {
    case "active":
      return `${base} bg-cta-green text-cta-green-foreground`;
    case "pending":
      return `${base} bg-cta-blue text-cta-blue-foreground`;
    case "error":
      return `${base} bg-danger text-danger-foreground`;
    case "inactive":
      return `${base} bg-neutral text-neutral-foreground`;
    default:
      return `${base} bg-neutral text-neutral-foreground`;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TableSection() {
  const [currentPage, setCurrentPage] = createSignal(1);
  const pageSize = 6;

  const paginatedData = createMemo(() =>
    mockData.slice((currentPage() - 1) * pageSize, currentPage() * pageSize)
  );

  return (
    <section class="mb-12 space-y-6">
      <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
        Tables
      </h2>

      {/* ================================================================
          STATIC TABLE (from-scratch HTML)
          ================================================================ */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            Static Table
          </h3>
        </div>

        <div class="rounded-xl border border-foreground/5 bg-card/50 overflow-hidden shadow-sm h-[400px] flex flex-col">
          <div class="overflow-auto flex-grow">
            <table class="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr class="bg-foreground/[0.03] border-b border-foreground/5">
                  <For each={["Name", "Status", "Organization", "Activity", "Last Active", "Actions"]}>
                    {(header) => (
                      <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-black text-muted-foreground/80">
                        {header}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody class="divide-y divide-foreground/[0.03]">
                <For each={paginatedData()}>
                  {(row) => (
                    <tr
                      tabindex="0"
                      class="hover:bg-foreground/[0.02] group outline-none focus-visible:bg-foreground/[0.04]"
                    >
                      {/* Name with avatar initial */}
                      <td class="px-4 py-2.5">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {row.name.charAt(0)}
                          </div>
                          <span class="text-sm font-semibold text-foreground">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      {/* Status chip */}
                      <td class="px-4 py-2.5">
                        <div class={getChipClasses(row.status)}>
                          {row.status}
                        </div>
                      </td>
                      {/* Category */}
                      <td class="px-4 py-2.5">
                        <span class="text-xs text-muted-foreground font-medium">
                          {row.category}
                        </span>
                      </td>
                      {/* Matches */}
                      <td class="px-4 py-2.5">
                        <span class="text-xs font-mono text-foreground/80">
                          {row.id}
                        </span>
                      </td>
                      {/* Last Active */}
                      <td class="px-4 py-2.5">
                        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon name="history" size={16} class="opacity-50" />
                          {row.lastSync}
                        </div>
                      </td>
                      {/* Actions (hover reveal) */}
                      <td class="px-4 py-2.5">
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="xs-icon" variant="ghost">
                            <Icon name="edit" size={16} />
                          </Button>
                          <Button
                            size="xs-icon"
                            variant="ghost"
                            class="text-danger hover:bg-danger/10"
                          >
                            <Icon name="delete" size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage()}
            pageSize={pageSize}
            totalItems={mockData.length}
            onPageChange={setCurrentPage}
            label="records"
          />
        </div>
      </div>

      {/* ================================================================
          AG GRID (Enterprise, custom themed)
          ================================================================ */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            High Performance Grid
          </h3>
          <Link
            href="https://www.ag-grid.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[10px] font-mono font-bold uppercase tracking-widest transition-colors"
            variant="blue"
          >
            AG-Grid
          </Link>
        </div>

        <div class="rounded-xl border border-foreground/5 bg-card/50 overflow-hidden shadow-sm h-[400px]">
          <Suspense>
            <AgGrid gridOptions={gridOptions} />
          </Suspense>
        </div>
      </div>

      {/* ================================================================
          EMPTY STATES
          ================================================================ */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* No Results */}
        <div class="space-y-3">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            No Results
          </h3>
          <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-dashed border-foreground/10 h-[300px] flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 rounded-full bg-foreground/[0.03] flex items-center justify-center mb-6">
              <Icon name="database" size={30} class="text-muted-foreground/40" />
            </div>
            <h4 class="text-lg font-bold text-foreground mb-2">
              No data found
            </h4>
            <p class="text-sm text-muted-foreground max-w-xs mb-8">
              We couldn't find any results matching your current filters. Try
              adjusting your search criteria.
            </p>
            <Button variant="neutral" size="sm">
              <Icon name="filter_list" size={16} class="mr-2" />
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Zero Listings */}
        <div class="space-y-3">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            Zero Listings
          </h3>
          <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 h-[300px] flex flex-col items-center justify-center text-center">
            <div class="relative mb-6">
              <div class="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Icon name="search" size={36} class="text-primary/40" />
              </div>
              <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-card flex items-center justify-center text-danger">
                <Icon name="close" size={18} />
              </div>
            </div>
            <h4 class="text-lg font-bold text-foreground mb-1">
              Zero Results
            </h4>
            <p class="text-sm text-muted-foreground mb-6">
              Your search for{" "}
              <span class="text-foreground font-mono bg-foreground/5 px-1 rounded">
                "unfindable_query"
              </span>{" "}
              returned nothing.
            </p>
            <div class="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Go Back
              </Button>
              <Button variant="default" size="sm">
                New Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
