import { onMount, onCleanup, createSignal, Show, type Component } from "solid-js";
import type { GridApi, GridOptions } from "ag-grid-community";
import { Spinner } from "~/components/atoms/Spinner";
import { cn } from "~/lib/utils";

// ============================================================================
// AG GRID — Dynamically loaded for code splitting
// The 2MB+ ag-grid-community bundle is lazy-loaded when the component mounts.
// Enterprise is opt-in: npm install ag-grid-enterprise + set VITE_AG_GRID_LICENSE
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface AgGridProps {
  gridOptions: GridOptions;
  class?: string;
  onGridReady?: (api: GridApi) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AgGrid: Component<AgGridProps> = (props) => {
  let gridDiv: HTMLDivElement | undefined;
  let gridApi: GridApi | null = null;
  const [loading, setLoading] = createSignal(true);

  let alive = true;
  onCleanup(() => { alive = false; });

  onMount(async () => {
    if (!gridDiv) return;

    const {
      createGrid,
      themeQuartz,
      iconSetMaterial,
      ModuleRegistry,
      AllCommunityModule,
    } = await import("ag-grid-community");

    ModuleRegistry.registerModules([AllCommunityModule]);

    const industrialTheme = themeQuartz
      .withPart(iconSetMaterial)
      .withParams({
        backgroundColor: "transparent",
        foregroundColor: "hsl(var(--foreground))",
        accentColor: "var(--ag-accent-color)",
        borderColor: "hsl(var(--foreground) / 0.03)",
        fontFamily: "inherit",
        fontSize: 13,
        headerFontSize: 11,
        headerFontWeight: 900,
        headerTextColor: "hsl(var(--foreground) / 0.8)",
        spacing: 6,
        headerHeight: 42,
        rowHeight: 40,
        listItemHeight: 32,
        columnBorder: false,
        rowBorder: true,
        headerBackgroundColor: "hsl(var(--foreground) / 0.03)",
        chromeBackgroundColor: "transparent",
        inputFocusBorder: { color: "var(--ag-accent-color)" },
        inputBackgroundColor: "hsl(var(--card))",
        menuBackgroundColor: "hsl(var(--card))",
        panelBackgroundColor: "hsl(var(--card))",
        checkboxCheckedShapeColor: "var(--ag-check-color)",
        checkboxCheckedBackgroundColor: "var(--ag-accent-color)",
        checkboxCheckedBorderColor: "var(--ag-accent-color)",
        rowHoverColor: "hsl(var(--foreground) / 0.02)",
        selectedRowBackgroundColor: "var(--ag-accent-color-alpha)",
      });

    const baseGridOptions = {
      theme: industrialTheme,
      suppressScrollOnNewData: true,
      ensureDomOrder: true,
      suppressFocusAfterRefresh: true,
      suppressCellFocus: true,
      autoSizeStrategy: {
        type: "fitGridWidth" as const,
        defaultMinWidth: 100,
      },
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
      },
    };

    function deepMerge(base: Record<string, unknown>, override?: Record<string, unknown>): Record<string, unknown> {
      const merged = { ...base };
      if (!override) return merged;
      for (const key in override) {
        if (Object.prototype.hasOwnProperty.call(override, key)) {
          if (key === "theme") {
            merged[key] = override[key];
            continue;
          }
          const baseVal = merged[key];
          const overrideVal = override[key];
          if (
            baseVal && typeof baseVal === "object" && !Array.isArray(baseVal) &&
            overrideVal && typeof overrideVal === "object" && !Array.isArray(overrideVal)
          ) {
            merged[key] = deepMerge(baseVal as Record<string, unknown>, overrideVal as Record<string, unknown>);
          } else {
            merged[key] = overrideVal;
          }
        }
      }
      return merged;
    }

    if (!alive) return;

    const finalGridOptions = deepMerge(baseGridOptions as Record<string, unknown>, props.gridOptions as Record<string, unknown>) as GridOptions;
    gridApi = createGrid(gridDiv, finalGridOptions);
    setLoading(false);

    if (props.onGridReady && gridApi) {
      props.onGridReady(gridApi);
    }
  });

  onCleanup(() => {
    if (gridApi) {
      gridApi.destroy();
      gridApi = null;
    }
  });

  return (
    <div class={cn("relative flex-grow w-full h-full", props.class)}>
      <Show when={loading()}>
        <div class="absolute inset-0 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      </Show>
      <div ref={gridDiv} class="w-full h-full" tabindex="-1" />
    </div>
  );
};

export default AgGrid;
