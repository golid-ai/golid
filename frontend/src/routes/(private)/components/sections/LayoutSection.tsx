import { For, createSignal } from "solid-js";
import { cn } from "./utils";

// ============================================================================
// TYPES
// ============================================================================

export interface LayoutSectionProps {
  copyToClipboard?: (text: string, label: string) => void;
}

// ============================================================================
// DATA
// ============================================================================

const spacingUnits = [
  { name: "4xs", value: "0.5", tw: "0.5", px: "2px", class: "w-0.5" },
  { name: "3xs", value: "1", tw: "1", px: "4px", class: "w-1" },
  { name: "2xs", value: "2", tw: "2", px: "8px", class: "w-2" },
  { name: "xs", value: "3", tw: "3", px: "12px", class: "w-3" },
  { name: "sm", value: "4", tw: "4", px: "16px", class: "w-4" },
  { name: "md", value: "6", tw: "6", px: "24px", class: "w-6" },
  { name: "lg", value: "8", tw: "8", px: "32px", class: "w-8" },
  { name: "xl", value: "12", tw: "12", px: "48px", class: "w-12" },
  { name: "2xl", value: "16", tw: "16", px: "64px", class: "w-16" },
  { name: "3xl", value: "24", tw: "24", px: "96px", class: "w-24" },
  { name: "4xl", value: "32", tw: "32", px: "128px", class: "w-32" },
  { name: "5xl", value: "40", tw: "40", px: "160px", class: "w-40" },
  { name: "6xl", value: "48", tw: "48", px: "192px", class: "w-48" },
  { name: "7xl", value: "56", tw: "56", px: "224px", class: "w-56" },
];

const structuralConstraints = [
  { name: "Default Container", value: 100, label: "max-w-[1600px]", description: "Full-width dashboard containment" },
  { name: "Desktop Standard", value: 80, label: "max-w-6xl (1152px)", description: "Balanced content width for large screens" },
  { name: "Prose / Form Width", value: 48, label: "max-w-3xl (768px)", description: "Optimal reading length for text elements" },
  { name: "Modal Standard", value: 28, label: "max-w-md (448px)", description: "Standard interaction footprint" },
];

const commonLayouts = [
  {
    group: "Flexbox",
    items: [
      { label: "Center All", classes: "flex items-center justify-center" },
      { label: "Between", classes: "flex items-center justify-between" },
      { label: "Stack", classes: "flex flex-col gap-4" },
      { label: "Inline Group", classes: "flex items-center gap-2" },
    ],
  },
  {
    group: "Grid",
    items: [
      { label: "Standard 12", classes: "grid grid-cols-12 gap-6" },
      { label: "Auto-Grid", classes: "grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))]" },
      { label: "Quad", classes: "grid grid-cols-4 gap-4" },
      { label: "Side-Main", classes: "grid grid-cols-[280px_1fr]" },
    ],
  },
];

// ============================================================================
// SPACING ITEM COMPONENT
// ============================================================================

function SpacingItem(props: {
  unit: typeof spacingUnits[0];
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div class="flex items-start gap-3 group/item py-1 outline-none">
      {/* Label & Meta */}
      <div class="w-16 shrink-0 flex flex-col gap-1.5 pt-0.5">
        <span class="text-[14px] font-bold text-foreground group-hover/item:text-blue transition-colors leading-none">
          {props.unit.name}
        </span>
        <div class="flex flex-col gap-0.5 opacity-60 group-hover/item:opacity-100 transition-opacity">
          <span class="text-[12px] font-mono text-muted-foreground leading-none">{props.unit.px}</span>
          <span class="text-[11px] font-mono text-muted-foreground/70 leading-none">{props.unit.value}rem</span>
        </div>
      </div>

      {/* The Content (Bar + Chips Under) */}
      <div class="flex-1 min-w-0 relative pt-0.5 pb-8">
        <div
          class={cn(
            "h-3.5 bg-primary/20 border border-primary/10 rounded-[2px] transition-all",
            "group-hover/item:bg-blue group-hover/item:border-blue group-hover/item:shadow-[0_0_8px_rgba(59,130,246,0.25)]",
            "max-w-full",
            props.unit.class
          )}
        />

        {/* Action Chips (Absolutely Positioned Under Start of Bar) */}
        <div class="absolute top-[22px] left-0 flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all pointer-events-none group-hover/item:pointer-events-auto z-20">
          <button
            onClick={() => props.onCopy(`p-${props.unit.tw}`, `Padding (${props.unit.px})`)}
            class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue/20 text-blue border border-blue/30 rounded hover:bg-blue/30 transition-colors"
          >
            P
          </button>
          <button
            onClick={() => props.onCopy(`m-${props.unit.tw}`, `Margin (${props.unit.px})`)}
            class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo/20 text-indigo border border-indigo/30 rounded hover:bg-indigo/30 transition-colors"
          >
            M
          </button>
          <button
            onClick={() => props.onCopy(`gap-${props.unit.tw}`, `Gap (${props.unit.px})`)}
            class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet/20 text-violet border border-violet/30 rounded hover:bg-violet/30 transition-colors"
          >
            G
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LayoutSection(props: LayoutSectionProps) {
  const [copied, setCopied] = createSignal<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (props.copyToClipboard) {
      props.copyToClipboard(text, label);
    } else {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const minorScale = spacingUnits.slice(0, 7);
  const majorScale = spacingUnits.slice(7);

  return (
    <section class="mb-16">
      <h2 class="text-2xl font-semibold mb-6 border-b border-brand-white/20 pb-2 text-brand-light">
        Layout
      </h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-10 min-w-0 overflow-hidden">
        {/* Column 1: Scale & Snippets */}
        <div class="space-y-6 min-w-0 overflow-hidden">
          {/* Spacing Scale */}
          <div class="space-y-4 min-w-0 overflow-hidden">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Metric Spacing Scale
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 min-h-[520px] overflow-hidden">
              <div class="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-10 gap-y-10 relative h-full min-w-0">
                {/* Scale Reference Line */}
                <div class="absolute left-[180px] top-0 bottom-0 w-px bg-foreground/5 hidden md:block" />

                {/* Minor Scale */}
                <div class="space-y-6 min-w-0">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
                    Minor Scale
                  </span>
                  <For each={minorScale}>
                    {(unit) => <SpacingItem unit={unit} onCopy={handleCopy} />}
                  </For>
                </div>

                {/* Major Scale */}
                <div class="space-y-6 min-w-0">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
                    Major Scale
                  </span>
                  <For each={majorScale}>
                    {(unit) => <SpacingItem unit={unit} onCopy={handleCopy} />}
                  </For>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Snippets */}
          <div class="space-y-4 min-w-0 overflow-hidden">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Common Snippets
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 min-w-0 overflow-hidden">
              <For each={commonLayouts}>
                {(section) => (
                  <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-6 rounded-2xl border border-foreground/10 space-y-5 min-w-0 overflow-hidden">
                    <span class="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {section.group}
                    </span>
                    <div class="space-y-3 min-w-0 overflow-hidden">
                      <For each={section.items}>
                        {(item) => (
                          <button
                            onClick={() => handleCopy(item.classes, item.label)}
                            class="flex flex-col gap-1.5 group/snippet w-full text-left min-w-0 overflow-hidden outline-none focus-visible:ring-0"
                          >
                            <div class="flex items-center justify-between px-0.5 min-w-0 gap-4">
                              <span class="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover/snippet:opacity-100 group-hover/snippet:text-blue transition-all truncate">
                                {item.label}
                              </span>
                              <span class="text-[10px] font-mono text-muted-foreground/40 opacity-0 group-hover/snippet:opacity-100 transition-all uppercase tracking-widest shrink-0 ml-auto">
                                Copy
                              </span>
                            </div>
                            <div class="bg-black/10 dark:bg-white/5 p-2.5 rounded border border-foreground/5 group-hover/snippet:border-blue/40 group-hover/snippet:bg-blue/[0.04] transition-all overflow-hidden min-w-0 w-full">
                              <code class="text-[12px] sm:text-[13px] font-mono text-muted-foreground group-hover/snippet:text-foreground transition-colors truncate block w-full overflow-hidden">
                                {item.classes}
                              </code>
                            </div>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Column 2: Blueprints & Constraints */}
        <div class="space-y-6">
          {/* Grid Blueprints */}
          <div class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Grid Blueprints
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-6 sm:p-8 rounded-2xl border border-foreground/10 space-y-6">
              {/* 8-Column Grid (Responsive) */}
              <div class="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 select-none">
                <For each={Array(8).fill(0)}>
                  {(_, i) => (
                    <div
                      tabindex="0"
                      role="button"
                      aria-label={`Grid column ${i() + 1}`}
                      class="h-12 sm:h-16 bg-primary/20 border border-primary/40 rounded-md flex items-center justify-center group/col hover:bg-primary/30 hover:border-primary/60 transition-all cursor-pointer outline-none focus-visible:bg-primary/30 focus-visible:border-primary/60"
                    >
                      <span class="text-[14px] font-mono font-bold opacity-30 group-hover/col:opacity-100">
                        {i() + 1}
                      </span>
                    </div>
                  )}
                </For>
              </div>

              {/* 8-Column Split (Full & Half) */}
              <div class="grid grid-cols-1 sm:grid-cols-8 gap-4 select-none">
                <div
                  tabindex="0"
                  role="button"
                  class="sm:col-span-8 h-20 sm:h-28 bg-blue/20 border border-blue/40 rounded-xl flex flex-col items-center justify-center gap-1 group/panel hover:bg-blue/30 hover:border-blue/60 transition-all cursor-pointer p-4 text-center outline-none focus-visible:bg-blue/30 focus-visible:border-blue/60"
                >
                  <span class="text-[14px] font-bold text-blue opacity-80 font-montserrat uppercase tracking-widest">
                    Col-Span-8
                  </span>
                  <span class="text-[11px] text-blue/60 font-mono">Full-Width Dashboard Area</span>
                </div>
                <div
                  tabindex="0"
                  role="button"
                  class="sm:col-span-4 h-20 sm:h-28 bg-indigo/20 border border-indigo/40 rounded-xl flex flex-col items-center justify-center gap-1 group/panel hover:bg-indigo/30 hover:border-indigo/60 transition-all cursor-pointer p-4 text-center outline-none focus-visible:bg-indigo/30 focus-visible:border-indigo/60"
                >
                  <span class="text-[14px] font-bold text-indigo opacity-80 font-montserrat uppercase tracking-widest">
                    Col-Span-4
                  </span>
                  <span class="text-[11px] text-indigo/60 font-mono">Side Context Area</span>
                </div>
                <div
                  tabindex="0"
                  role="button"
                  class="sm:col-span-4 h-20 sm:h-28 bg-indigo/20 border border-indigo/40 rounded-xl flex flex-col items-center justify-center gap-1 group/panel hover:bg-indigo/30 hover:border-indigo/60 transition-all cursor-pointer p-4 text-center outline-none focus-visible:bg-indigo/30 focus-visible:border-indigo/60"
                >
                  <span class="text-[14px] font-bold text-indigo opacity-80 font-montserrat uppercase tracking-widest">
                    Col-Span-4
                  </span>
                  <span class="text-[11px] text-indigo/60 font-mono">Side Utility Area</span>
                </div>
              </div>

              {/* Quarter Split (4 x Col-2) */}
              <div class="grid grid-cols-2 sm:grid-cols-8 gap-4 select-none">
                <For each={Array(4).fill(0)}>
                  {() => (
                    <div
                      tabindex="0"
                      role="button"
                      class="sm:col-span-2 h-16 sm:h-24 bg-violet/20 border border-violet/40 rounded-xl flex items-center justify-center hover:bg-violet/30 hover:border-violet/60 transition-all cursor-pointer p-4 text-center outline-none focus-visible:bg-violet/30 focus-visible:border-violet/60"
                    >
                      <span class="text-[12px] font-bold text-violet opacity-80 font-montserrat uppercase tracking-widest">
                        Col-Span-2
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Structural Constraints */}
          <div class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Structural Constraints
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 space-y-8">
              <For each={structuralConstraints}>
                {(constraint) => (
                  <button
                    onClick={() => handleCopy(constraint.label.split(" ")[0], constraint.name)}
                    class="space-y-3 group/progress w-full text-left outline-none focus-visible:ring-0"
                  >
                    <div class="flex justify-between items-end">
                      <div class="space-y-1">
                        <span class="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover/progress:opacity-100 group-hover/progress:text-blue transition-all">
                          {constraint.name}
                        </span>
                        <p class="text-[13px] leading-relaxed text-muted-foreground/60">
                          {constraint.description}
                        </p>
                      </div>
                      <span class="text-[12px] font-mono opacity-30 group-hover/progress:opacity-100 group-hover/progress:text-blue transition-all">
                        {constraint.label}
                      </span>
                    </div>
                    <div class="relative h-2.5 w-full bg-muted rounded-full overflow-hidden group-hover/progress:bg-muted/80 transition-all">
                      <div
                        class="h-full bg-primary group-hover/progress:bg-blue transition-all relative z-10 rounded-full"
                        style={{ width: `${constraint.value}%` }}
                      />
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification for copy */}
      {copied() && (
        <div class="fixed bottom-4 right-4 bg-green text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          Copied: {copied()}
        </div>
      )}
    </section>
  );
}
