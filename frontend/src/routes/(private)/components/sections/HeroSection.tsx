import { For } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Widget } from "~/components/molecules/Widget/Widget";

export interface HeroSectionProps {
  showSections: Record<string, boolean>;
  sectionLabels: Record<string, string>;
  onToggle: (key: string) => void;
  onToggleAll: (val: boolean) => void;
}

export function HeroSection(props: HeroSectionProps) {
  return (
    <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-10 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Components</h1>
        <p class="text-muted-foreground mt-1 max-w-xl">
          70+ production-ready components built with{" "}
          <a href="https://solidjs.com/" target="_blank" rel="noopener noreferrer" class="text-foreground/80 underline hover:text-foreground transition-colors">
            SolidJS
          </a>{" "}
          and{" "}
          <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" class="text-foreground/80 underline hover:text-foreground transition-colors">
            Tailwind CSS
          </a>
          . Dark mode, accessibility, and responsive design included.
        </p>
      </div>

      <Widget
        title="Component Sections"
        class="xl:w-[560px]"
        headerActions={
          <div class="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => props.onToggleAll(false)}
              class="text-muted-foreground hover:text-red"
            >
              None
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => props.onToggleAll(true)}
              class="text-muted-foreground hover:text-green"
            >
              All
            </Button>
          </div>
        }
      >
        <div class="flex flex-wrap gap-2">
          <For each={Object.entries(props.showSections)}>
            {([id, visible]) => (
              <Button
                variant={visible ? "neutral" : "ghost"}
                size="xs"
                onClick={() => props.onToggle(id)}
                class={
                  visible
                    ? ""
                    : "opacity-40 hover:opacity-100 text-muted-foreground"
                }
              >
                {props.sectionLabels[id]}
              </Button>
            )}
          </For>
        </div>
      </Widget>
    </div>
  );
}
