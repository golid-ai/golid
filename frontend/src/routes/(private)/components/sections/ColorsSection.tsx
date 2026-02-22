import { For, Show, onMount } from "solid-js";
import { cn, rgbToHex } from "./utils";
import { Tooltip } from "~/components/atoms/Tooltip";

// =============================================================================
// SWATCH COMPONENT
// =============================================================================

interface SwatchProps {
  name: string;
  id: string;
  bg: string;
  activeBg?: string;
  tooltip: string;
  italic?: boolean;
  colorMap: Record<string, { rest: string; active?: string }>;
  onColorDetect: (id: string, color: string, isActive?: boolean) => void;
  onCopy: (text: string | undefined, name: string) => void;
}

function Swatch(props: SwatchProps) {
  let swatchRef: HTMLDivElement | undefined;
  let activeRef: HTMLDivElement | undefined;

  onMount(() => {
    setTimeout(() => {
      if (swatchRef) {
        const color = rgbToHex(window.getComputedStyle(swatchRef).backgroundColor);
        if (color) props.onColorDetect(props.id, color, false);
      }
      if (activeRef && props.activeBg) {
        const color = rgbToHex(window.getComputedStyle(activeRef).backgroundColor);
        if (color) props.onColorDetect(props.id, color, true);
      }
    }, 100);
  });

  return (
    <div class="group/swatch w-full max-w-[120px] mx-auto">
      <Tooltip message={props.tooltip} position="top">
        <div
          ref={swatchRef}
          class={cn(
            "h-24 w-full rounded-xl border border-white/10 shadow-inner transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/20 cursor-pointer block",
            props.bg
          )}
        />
      </Tooltip>
      <Show when={props.activeBg}>
        <div ref={activeRef} class={`invisible absolute h-0 w-0 -z-10 ${props.activeBg}`} />
      </Show>

      <div class="text-center w-full">
        <p
          class={cn(
            "text-[10px] font-black text-foreground/90 uppercase tracking-[0.15em] truncate px-1 leading-tight mt-2",
            props.italic && "italic"
          )}
        >
          {props.name}
        </p>
        <div class="flex flex-row justify-center items-center">
          <button
            onClick={() => props.onCopy(props.colorMap[props.id]?.rest, props.name)}
            class="text-[11px] py-1 px-[5px] font-mono font-bold text-foreground/80 hover:text-foreground hover:bg-foreground/10 rounded transition-all uppercase tracking-tight cursor-copy active:scale-95 leading-tight"
            title="Click to copy hex"
          >
            {props.colorMap[props.id]?.rest ?? "..."}
          </button>
          <Show when={props.colorMap[props.id]?.active}>
            <button
              onClick={() => props.onCopy(props.colorMap[props.id]?.active, `${props.name} (Active)`)}
              class="text-[11px] py-1 px-[5px] font-mono font-bold text-muted-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all uppercase tracking-tight cursor-copy active:scale-95 leading-tight"
              title="Click to copy active hex"
            >
              ({props.colorMap[props.id]?.active})
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COLORS SECTION
// =============================================================================

export interface ColorsSectionProps {
  colorMap: Record<string, { rest: string; active?: string }>;
  onColorDetect: (id: string, color: string, isActive?: boolean) => void;
  onCopy: (text: string | undefined, name: string) => void;
}

export function ColorsSection(props: ColorsSectionProps) {
  const coreNeutrals = [
    { name: "Midnight", id: "midnight", bg: "bg-midnight", tooltip: "Primary background in Dark Mode / Primary text in Light Mode." },
    { name: "Moonlight", id: "moonlight", bg: "bg-moonlight", tooltip: "Surface elevation, deep shadows, and secondary backgrounds." },
    { name: "Twilight", id: "twilight", bg: "bg-twilight", tooltip: "Muted surfaces, secondary text, and soft dark borders." },
    { name: "Dusk", id: "dusk", bg: "bg-dusk", tooltip: "Medium neutral for icons, placeholders, and inactive states." },
    { name: "Granite", id: "granite", bg: "bg-granite", tooltip: "Accent neutral for subtle highlights and component surfaces." },
    { name: "Steel", id: "steel", bg: "bg-steel", tooltip: "Standard borders, dividers, and light UI accenting." },
    { name: "Dawn", id: "dawn", bg: "bg-dawn", tooltip: "Subtle light mode shadows and soft UI highlights." },
    { name: "Bright", id: "bright", bg: "bg-bright", tooltip: "Secondary backgrounds and soft surfaces in Light Mode." },
    { name: "Mist", id: "mist", bg: "bg-mist", tooltip: "Primary text in Dark Mode / Highlight background in Light Mode." },
    { name: "White", id: "white", bg: "bg-white", tooltip: "Pure high-contrast foundation for text and light backgrounds." },
  ];

  const accentPalette = [
    { name: "Green", id: "green", bg: "bg-green", activeBg: "bg-active-green", tooltip: "Primary brand color. Used for success and primary actions." },
    { name: "Teal", id: "teal", bg: "bg-teal", activeBg: "bg-active-teal", tooltip: "Secondary brand accent. Professional teal for data and UI elements." },
    { name: "Blue", id: "blue", bg: "bg-blue", activeBg: "bg-active-blue", tooltip: "Information, primary links, and secondary branding." },
    { name: "Indigo", id: "indigo", bg: "bg-indigo", activeBg: "bg-active-indigo", tooltip: "Premium professional accent for advanced features and deep UI depth." },
    { name: "Violet", id: "violet", bg: "bg-violet", activeBg: "bg-active-violet", tooltip: "Creative and AI-driven feature accenting." },
    { name: "Pink", id: "pink", bg: "bg-pink", activeBg: "bg-active-pink", tooltip: "Vibrant secondary accent for social or high-energy components." },
    { name: "Red", id: "red", bg: "bg-red", activeBg: "bg-active-red", tooltip: "Standard error states, danger warnings, and critical alerts." },
    { name: "Orange", id: "orange", bg: "bg-orange", activeBg: "bg-active-orange", tooltip: "Vibrant warning and creative secondary accent." },
    { name: "Gold", id: "gold", bg: "bg-gold", activeBg: "bg-active-gold", tooltip: "Warnings, pending states, and attention-grabbing UI." },
    { name: "Lime", id: "lime", bg: "bg-lime", activeBg: "bg-active-lime", tooltip: "Fresh high-contrast accent for growth and positive trends." },
  ];

  const neonPalette = [
    { name: "Neon Green", id: "neon-green", bg: "bg-neon-green", activeBg: "bg-neon-green-active", tooltip: "High-intensity luminous green for active dark mode success states." },
    { name: "Neon Teal", id: "neon-teal", bg: "bg-neon-teal", activeBg: "bg-neon-teal-active", tooltip: "Electric teal accent for specialized interactive dark mode elements." },
    { name: "Neon Blue", id: "neon-blue", bg: "bg-neon-blue", activeBg: "bg-neon-blue-active", tooltip: "Self-illuminated electric blue for secondary actions and links." },
    { name: "Neon Indigo", id: "neon-indigo", bg: "bg-neon-indigo", activeBg: "bg-neon-indigo-active", tooltip: "Deep electric indigo for high-tech premium accents." },
    { name: "Neon Violet", id: "neon-violet", bg: "bg-neon-violet", activeBg: "bg-neon-violet-active", tooltip: "Luminous high-vibrancy violet for AI and creative features." },
    { name: "Neon Pink", id: "neon-pink", bg: "bg-neon-pink", activeBg: "bg-neon-pink-active", tooltip: "High-intensity electric pink for social and energetic UI cues." },
    { name: "Neon Red", id: "neon-red", bg: "bg-neon-red", activeBg: "bg-neon-red-active", tooltip: "Critical high-vibrancy neon red for dangerous or urgent alerts." },
    { name: "Neon Orange", id: "neon-orange", bg: "bg-neon-orange", activeBg: "bg-neon-orange-active", tooltip: "Luminous electric orange for specialized dark mode warnings." },
    { name: "Neon Gold", id: "neon-gold", bg: "bg-neon-gold", activeBg: "bg-neon-gold-active", tooltip: "High-intensity self-illuminated gold for active attention states." },
    { name: "Neon Lime", id: "neon-lime", bg: "bg-neon-lime", activeBg: "bg-neon-lime-active", tooltip: "Vibrant luminous lime for specialized growth metrics." },
  ];

  return (
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 border-b border-brand-white/20 pb-2 text-brand-light">
        Colors
      </h2>

      <div class="space-y-6">
        <div>
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
            Core Neutrals
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-x-6 gap-y-12 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
            <For each={coreNeutrals}>
              {(swatch) => (
                <Swatch
                  {...swatch}
                  colorMap={props.colorMap}
                  onColorDetect={props.onColorDetect}
                  onCopy={props.onCopy}
                />
              )}
            </For>
          </div>
        </div>

        <div>
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
            Accent Palette
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-x-6 gap-y-12 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
            <For each={accentPalette}>
              {(swatch) => (
                <Swatch
                  {...swatch}
                  colorMap={props.colorMap}
                  onColorDetect={props.onColorDetect}
                  onCopy={props.onCopy}
                />
              )}
            </For>
          </div>
        </div>

        <div>
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3 italic">
            Neon Palette (Dark Only)
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-x-6 gap-y-12 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
            <For each={neonPalette}>
              {(swatch) => (
                <Swatch
                  {...swatch}
                  italic
                  colorMap={props.colorMap}
                  onColorDetect={props.onColorDetect}
                  onCopy={props.onCopy}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  );
}
