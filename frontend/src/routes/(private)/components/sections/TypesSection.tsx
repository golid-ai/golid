import { For, Show } from "solid-js";
import { cn } from "./utils";
import { Chip } from "~/components/atoms/Chip";
import { Link } from "~/components/atoms/Link";

export interface TypesSectionProps {
  onCopy: (text: string, name: string) => void;
}

export function TypesSection(props: TypesSectionProps) {
  const alphabet = "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz";
  const symbols = "1234567890 !@#$%^&*()";

  const fonts = [
    {
      title: "Primary Font (Headings)",
      name: "Montserrat",
      fontClass: "font-montserrat",
      description: "Used for all headings, brand elements, and high-impact UI components.",
      googleUrl: "https://fonts.google.com/specimen/Montserrat",
    },
    {
      title: "Secondary Font (Interface)",
      name: "Inter",
      fontClass: "font-sans",
      description: "Used for body text, form elements, data tables, and general interface utility.",
      googleUrl: "https://fonts.google.com/specimen/Inter",
    },
    {
      title: "Brand Font (Marketing)",
      name: "Nunito",
      fontClass: "font-nunito",
      description: "Rarely used brand font for marketing, specialized logo treatments, and brand moments.",
      googleUrl: "https://fonts.google.com/specimen/Nunito",
    },
    {
      title: "Monospace Font (Data)",
      name: "UI Mono",
      fontClass: "font-mono",
      description: "Used for hex codes, technical data, and terminal-style information displays.",
    },
  ];

  const headingSpecs = [
    { name: "Display Heading", classes: "text-7xl font-bold font-montserrat tracking-tighter", tag: "h1" },
    { name: "Page Title", classes: "text-4xl font-bold font-montserrat", tag: "h1" },
    { name: "Section Header", classes: "text-2xl font-semibold font-montserrat", tag: "h2" },
    { name: "Sub Header", classes: "text-xl font-semibold font-montserrat", tag: "h3" },
    { name: "Minor Header", classes: "text-lg font-semibold font-montserrat", tag: "h4" },
  ];

  const bodySpecs = [
    { name: "Intro Text", classes: "text-lg font-sans leading-relaxed text-foreground", tag: "p" },
    { name: "Body Text", classes: "text-base font-sans leading-relaxed text-muted-foreground", tag: "p" },
    { name: "UI Label", classes: "text-sm font-bold font-montserrat uppercase tracking-wider text-primary", tag: "span" },
    { name: "Interactive Link", classes: "text-base font-medium text-blue hover:text-active-blue underline underline-offset-4 cursor-pointer transition-colors", tag: "a", sample: "View detailed analytics report" },
    { name: "Muted Caption", classes: "text-sm font-sans text-muted-foreground/60", tag: "span" },
    { name: "Small Detail", classes: "text-xs font-mono font-medium tracking-tight text-brand-taupe", tag: "code" },
    { name: "Overline", classes: "text-[10px] font-bold font-montserrat uppercase tracking-[0.2em] text-primary", tag: "span", sample: "SYSTEM TELEMETRY" },
  ];

  return (
    <section class="mb-16">
      <h2 class="text-2xl font-semibold mb-6 border-b border-brand-white/20 pb-2 text-brand-light">
        Types
      </h2>

      {/* Font Cards */}
      <div class="grid sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-8 mb-12 gap-y-12 gap-x-10">
        <For each={fonts}>
          {(font) => (
            <div class="space-y-3 min-w-0">
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 truncate">
                  {font.title}
                </h3>
                <Show when={font.googleUrl}>
                  <Link
                    href={font.googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[10px] font-mono font-bold uppercase tracking-widest shrink-0"
                  >
                    Google Font
                  </Link>
                </Show>
              </div>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 h-full flex flex-col overflow-hidden min-w-0 w-full max-w-full">
                <p class={`text-4xl sm:text-5xl font-bold ${font.fontClass} mb-2 text-foreground truncate w-full`}>
                  {font.name}
                </p>
                <p class="text-sm text-muted-foreground leading-relaxed flex-grow break-words mb-4 w-full">
                  {font.description}
                </p>
                <div class="pt-2 border-t border-foreground/10 min-w-0 w-full overflow-hidden">
                  <p class="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">
                    Character Set
                  </p>
                  <p class={`text-[13px] ${font.fontClass} text-muted-foreground/60 leading-relaxed truncate w-full overflow-hidden`}>
                    {alphabet}
                  </p>
                  <p class={`text-[15px] ${font.fontClass} text-muted-foreground/60 leading-relaxed opacity-80 mt-2 truncate w-full overflow-hidden`}>
                    {symbols}
                  </p>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Text Hierarchy */}
      <div class="space-y-3 w-full mt-12">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Text Hierarchy
        </h3>
        <div class="flex flex-col md:flex-row gap-10 w-full">
          <div class="md:w-[60%] min-w-0 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10">
            <For each={headingSpecs}>
              {(spec) => (
                <div class="group/type py-4 border-b border-foreground/5 last:border-0 w-full">
                  <div class="flex flex-col gap-2 w-full">
                    <div class="flex items-center justify-between gap-4 w-full">
                      <Chip variant="neutral" size="sm">{spec.name}</Chip>
                      <button
                        onClick={() => props.onCopy(spec.classes, spec.name)}
                        class="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-foreground/10 px-2 py-0.5 rounded transition-colors cursor-copy active:scale-95 truncate"
                      >
                        {spec.classes}
                      </button>
                    </div>
                    <div class={cn(spec.classes, "block leading-tight w-full")}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="md:w-[40%] min-w-0 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10">
            <For each={bodySpecs}>
              {(spec) => (
                <div class="group/type py-4 border-b border-foreground/5 last:border-0 w-full">
                  <div class="flex flex-col gap-2 w-full">
                    <div class="flex items-center justify-between gap-4 w-full">
                      <Chip variant="neutral" size="sm">{spec.name}</Chip>
                      <button
                        onClick={() => props.onCopy(spec.classes, spec.name)}
                        class="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-foreground/10 px-2 py-0.5 rounded transition-colors cursor-copy active:scale-95 truncate"
                      >
                        {spec.classes}
                      </button>
                    </div>
                    <div class={cn(spec.classes, "block leading-tight w-full")}>
                      {spec.sample || "The quick brown fox jumps over the lazy dog"}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  );
}
