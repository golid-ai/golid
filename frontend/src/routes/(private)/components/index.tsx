import { Title } from "@solidjs/meta";
import { useSearchParams, useNavigate } from "@solidjs/router";
import { createSignal, createEffect, on, onMount, onCleanup, Show } from "solid-js";
import { auth } from "~/lib/auth";
import { snackbar } from "~/lib/stores/snackbar";
import {
  ColorsSection,
  TypesSection,
  IconsSection,
  HeroSection,
  ButtonsSection,
  LayoutSection,
  InputsSection,
  ControlSection,
  AlertsSection,
  SurfaceSection,
  CardSection,
  TableSection,
  MiscSection,
} from "./sections";

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type SectionKey = "colors" | "types" | "icons" | "layout" | "buttons" | "inputs" | "controls" | "alerts" | "surfaces" | "cards" | "tables" | "misc";

const ALL_SECTION_KEYS: SectionKey[] = [
  "colors", "types", "icons", "layout", "buttons", "inputs",
  "controls", "alerts", "surfaces", "cards", "tables", "misc"
];

const sectionLabels: Record<SectionKey, string> = {
  colors: "Colors",
  types: "Types",
  icons: "Icons",
  layout: "Layout",
  buttons: "Buttons",
  inputs: "Inputs",
  controls: "Controls",
  alerts: "Alerts",
  surfaces: "Surfaces",
  cards: "Cards",
  tables: "Tables",
  misc: "Misc",
};

// =============================================================================
// HELPERS
// =============================================================================

/** Parse URL param into section state */
function parseSectionsParam(param: string | undefined): Record<SectionKey, boolean> {
  // No param = all sections enabled (clean URL)
  if (param === undefined || param === null) {
    const allEnabled = {} as Record<SectionKey, boolean>;
    ALL_SECTION_KEYS.forEach((key) => { allEnabled[key] = true; });
    return allEnabled;
  }

  // Explicit "none" = all off
  if (param === "none") {
    const allDisabled = {} as Record<SectionKey, boolean>;
    ALL_SECTION_KEYS.forEach((key) => { allDisabled[key] = false; });
    return allDisabled;
  }

  // CSV list = only those sections enabled
  const enabled = param.split(",").filter((k): k is SectionKey =>
    ALL_SECTION_KEYS.includes(k as SectionKey)
  );
  const result = {} as Record<SectionKey, boolean>;
  ALL_SECTION_KEYS.forEach((key) => { result[key] = enabled.includes(key); });
  return result;
}

/** Convert section state to URL param (undefined = all, "none" = none, csv = some) */
function sectionsToParam(sections: Record<SectionKey, boolean>): string | undefined {
  const active = ALL_SECTION_KEYS.filter((key) => sections[key]);
  // All selected → remove param entirely (clean URL)
  if (active.length === ALL_SECTION_KEYS.length) return undefined;
  // None selected → explicit "none" so it survives refresh
  if (active.length === 0) return "none";
  // Some selected → CSV
  return active.join(",");
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ComponentsPage() {
  const navigate = useNavigate();

  createEffect(on(
    () => [auth.initialized, auth.isAdmin] as const,
    ([initialized, isAdmin]) => {
      if (initialized && !isAdmin) {
        navigate("/dashboard", { replace: true });
      }
    }
  ));

  const [searchParams, setSearchParams] = useSearchParams();
  const [colorMap, setColorMap] = createSignal<Record<string, { rest: string; active?: string }>>({});
  const [mounted, setMounted] = createSignal(false);

  // Initialize from URL params
  const [showSections, setShowSections] = createSignal<Record<SectionKey, boolean>>(
    parseSectionsParam(searchParams.sections as string | undefined)
  );

  onMount(() => {
    setMounted(true);
  });

  // Sync URL when sections change (after mount)
  createEffect(() => {
    if (!mounted()) return;
    
    const sections = showSections();
    const param = sectionsToParam(sections);
    
    // Only update if different from current
    const currentParam = searchParams.sections as string | undefined;
    
    if (currentParam !== param) {
      setSearchParams({ sections: param }, { replace: true });
    }
  });

  function handleColorDetect(id: string, color: string, isActive?: boolean) {
    setColorMap((prev) => {
      const current = prev[id] || { rest: "..." };
      if (isActive) {
        return { ...prev, [id]: { ...current, active: color } };
      }
      return { ...prev, [id]: { ...current, rest: color } };
    });
  }

  async function copyToClipboard(text: string | undefined, _name: string) {
    if (!text || text === "...") return;
    try {
      await navigator.clipboard.writeText(text);
      snackbar.show(`${text} copied`, { duration: 2000 });
    } catch {
      // Clipboard API may fail in some contexts
    }
  }

  function toggleSection(key: string) {
    setShowSections((prev) => ({ ...prev, [key]: !prev[key as SectionKey] }));
  }

  function toggleAll(val: boolean) {
    setShowSections(() => {
      const updated: Record<SectionKey, boolean> = {} as Record<SectionKey, boolean>;
      ALL_SECTION_KEYS.forEach((k) => {
        updated[k] = val;
      });
      return updated;
    });
  }

  // Re-detect colors on theme change
  createEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      // Colors are detected on mount; theme change would require re-mount
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    onCleanup(() => observer.disconnect());
  });

  return (
    <div class="flex-1 bg-background p-8">
      <Title>Components | Golid</Title>

      <div class="max-w-7xl mx-auto">
        <HeroSection
          showSections={showSections()}
          sectionLabels={sectionLabels}
          onToggle={toggleSection}
          onToggleAll={toggleAll}
        />

        <Show when={showSections().colors}>
          <ColorsSection
            colorMap={colorMap()}
            onColorDetect={handleColorDetect}
            onCopy={copyToClipboard}
          />
        </Show>

        <Show when={showSections().types}>
          <TypesSection onCopy={copyToClipboard} />
        </Show>

        <Show when={showSections().icons}>
          <IconsSection onCopy={copyToClipboard} />
        </Show>

        <Show when={showSections().layout}>
          <LayoutSection copyToClipboard={copyToClipboard} />
        </Show>

        <Show when={showSections().buttons}>
          <ButtonsSection />
        </Show>

        <Show when={showSections().inputs}>
          <InputsSection />
        </Show>

        <Show when={showSections().controls}>
          <ControlSection />
        </Show>

        <Show when={showSections().alerts}>
          <AlertsSection />
        </Show>

        <Show when={showSections().surfaces}>
          <SurfaceSection />
        </Show>

        <Show when={showSections().cards}>
          <CardSection />
        </Show>

        <Show when={showSections().tables}>
          <TableSection />
        </Show>

        <Show when={showSections().misc}>
          <MiscSection />
        </Show>
      </div>
    </div>
  );
}
