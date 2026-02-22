import { createSignal, For } from "solid-js";
import { Button, type ButtonVariant } from "~/components/atoms/Button";
import { Chip, type ChipVariant } from "~/components/atoms/Chip";
import { Badge } from "~/components/atoms/Badge";
import { IconBadge } from "~/components/molecules/IconBadge";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Submenu,
  SubmenuTrigger,
  SubmenuContent,
} from "~/components/molecules/Menu";

export interface ButtonsSectionProps {
  // No props needed for now
}

export function ButtonsSection() {
  // Chip state for clickable demos
  const [chipActive, setChipActive] = createSignal<string>("insert");
  const [multiActive, setMultiActive] = createSignal<string[]>(["typescript"]);

  const toggleMulti = (value: string) => {
    setMultiActive((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const chipVariants: ChipVariant[] = [
    "default",
    "neutral",
    "green",
    "teal",
    "blue",
    "indigo",
    "violet",
    "pink",
    "orange",
    "amber",
    "lime",
    "destructive",
    "outline",
  ];

  const variants: ButtonVariant[] = [
    "default",
    "neutral",
    "green",
    "blue",
    "destructive",
    "outline",
    "ghost",
    "link",
  ];

  const allVariants: ButtonVariant[] = [
    "default",
    "neutral",
    "green",
    "teal",
    "blue",
    "indigo",
    "violet",
    "pink",
    "destructive",
    "orange",
    "amber",
    "lime",
    "outline",
    "ghost",
    "link",
  ];

  return (
    <>
      {/* Buttons Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Buttons
        </h2>
        <div class="space-y-12">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {/* Primary Scales (52px - 44px) */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Sizes: 52px — 44px
              </h3>
              <div class="space-y-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="space-y-4">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    XXL (52px)
                  </span>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button size="xxl">Default</Button>
                    <Button size="xxl" rounded>Rounded</Button>
                    <Button size="xxl" startIcon>
                      <span class="material-symbol mr-2">home</span>
                      <span>Icon</span>
                    </Button>
                    <For each={variants.slice(1, 8)}>
                      {(variant) => (
                        <Button size="xxl" variant={variant}>
                          {variant!.charAt(0).toUpperCase() + variant!.slice(1)}
                        </Button>
                      )}
                    </For>
                    <Button size="xxl" disabled>Locked</Button>
                  </div>
                </div>
                <div class="space-y-4 pt-4 border-t border-foreground/5">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    XL (48px)
                  </span>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button size="xl">Default</Button>
                    <Button size="xl" rounded>Rounded</Button>
                    <Button size="xl" startIcon><span class="material-symbol mr-2">home</span><span>Icon</span></Button>
                    <Button size="xl" variant="neutral">Neutral</Button>
                    <Button size="xl" variant="green">Green</Button>
                    <Button size="xl" variant="blue">Blue</Button>
                    <Button size="xl" variant="destructive">Danger</Button>
                    <Button size="xl" variant="outline">Outline</Button>
                    <Button size="xl" variant="ghost">Ghost</Button>
                  </div>
                </div>
                <div class="space-y-4 pt-4 border-t border-foreground/5">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Large (44px)
                  </span>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button size="lg">Default</Button>
                    <Button size="lg" rounded>Rounded</Button>
                    <Button size="lg" startIcon><span class="material-symbol mr-2">home</span><span>Icon</span></Button>
                    <Button size="lg" variant="neutral">Neutral</Button>
                    <Button size="lg" variant="green">Green</Button>
                    <Button size="lg" variant="blue">Blue</Button>
                    <Button size="lg" variant="destructive">Danger</Button>
                    <Button size="lg" variant="outline">Outline</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Auxiliary Scales (40px - 32px) */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Sizes: 40px — 32px
              </h3>
              <div class="space-y-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="space-y-4">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Medium (40px)
                  </span>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button>Default</Button>
                    <Button rounded>Rounded</Button>
                    <Button startIcon><span class="material-symbol mr-2">home</span><span>Icon</span></Button>
                    <Button variant="neutral">Neutral</Button>
                    <Button variant="green">Green</Button>
                    <Button variant="blue">Blue</Button>
                    <Button variant="destructive">Danger</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </div>
                <div class="space-y-4 pt-4 border-t border-foreground/5">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Small (36px)
                  </span>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button size="sm">Default</Button>
                    <Button size="sm" rounded>Rounded</Button>
                    <Button size="sm" startIcon><span class="material-symbol mr-1.5">home</span><span>Icon</span></Button>
                    <Button size="sm" variant="neutral">Neutral</Button>
                    <Button size="sm" variant="green">Green</Button>
                    <Button size="sm" variant="blue">Blue</Button>
                    <Button size="sm" variant="destructive">Danger</Button>
                    <Button size="sm" variant="outline">Outline</Button>
                  </div>
                </div>
                <div class="space-y-4 pt-4 border-t border-foreground/5">
                  <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Extra Small (32px)
                  </span>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button size="xs">Default</Button>
                    <Button size="xs" rounded>Rounded</Button>
                    <Button size="xs" startIcon><span class="material-symbol mr-1">home</span><span>Icon</span></Button>
                    <Button size="xs" variant="neutral">Neutral</Button>
                    <Button size="xs" variant="green">Green</Button>
                    <Button size="xs" variant="blue">Blue</Button>
                    <Button size="xs" variant="destructive">Danger</Button>
                    <Button size="xs" variant="outline">Outline</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Icon Buttons Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Icon Buttons
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Icon Sizes: 52px — 44px
            </h3>
            <div class="space-y-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-4">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  XXL (52px)
                </span>
                <div class="flex flex-wrap items-center gap-3">
                  <Button size="xxl-icon"><span class="material-symbol">home</span></Button>
                  <Button size="xxl-icon" variant="neutral"><span class="material-symbol">settings</span></Button>
                  <Button size="xxl-icon" variant="green"><span class="material-symbol">check</span></Button>
                  <Button size="xxl-icon" variant="blue"><span class="material-symbol">info</span></Button>
                  <Button size="xxl-icon" variant="destructive"><span class="material-symbol">delete</span></Button>
                  <Button size="xxl-icon" variant="ghost"><span class="material-symbol">notifications</span></Button>
                </div>
              </div>
              <div class="space-y-4 pt-4 border-t border-foreground/5">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  XL (48px)
                </span>
                <div class="flex flex-wrap items-center gap-3">
                  <Button size="xl-icon"><span class="material-symbol">home</span></Button>
                  <Button size="xl-icon" variant="neutral"><span class="material-symbol">settings</span></Button>
                  <Button size="xl-icon" variant="green"><span class="material-symbol">check</span></Button>
                  <Button size="xl-icon" variant="blue"><span class="material-symbol">info</span></Button>
                  <Button size="xl-icon" variant="destructive"><span class="material-symbol">delete</span></Button>
                </div>
              </div>
              <div class="space-y-4 pt-4 border-t border-foreground/5">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Large (44px)
                </span>
                <div class="flex flex-wrap items-center gap-3">
                  <Button size="lg-icon"><span class="material-symbol">home</span></Button>
                  <Button size="lg-icon" variant="neutral"><span class="material-symbol">settings</span></Button>
                  <Button size="lg-icon" variant="green"><span class="material-symbol">check</span></Button>
                  <Button size="lg-icon" variant="blue"><span class="material-symbol">info</span></Button>
                  <Button size="lg-icon" variant="destructive"><span class="material-symbol">delete</span></Button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Icon Sizes: 40px — 32px
            </h3>
            <div class="space-y-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-4">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Medium (40px)
                </span>
                <div class="flex flex-wrap items-center gap-3">
                  <Button size="icon"><span class="material-symbol">home</span></Button>
                  <Button size="icon" variant="neutral"><span class="material-symbol">settings</span></Button>
                  <Button size="icon" variant="green"><span class="material-symbol">check</span></Button>
                  <Button size="icon" variant="blue"><span class="material-symbol">info</span></Button>
                  <Button size="icon" variant="destructive"><span class="material-symbol">delete</span></Button>
                </div>
              </div>
              <div class="space-y-4 pt-4 border-t border-foreground/5">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Small (36px)
                </span>
                <div class="flex flex-wrap items-center gap-3">
                  <Button size="sm-icon"><span class="material-symbol">home</span></Button>
                  <Button size="sm-icon" variant="neutral"><span class="material-symbol">settings</span></Button>
                  <Button size="sm-icon" variant="green"><span class="material-symbol">check</span></Button>
                  <Button size="sm-icon" variant="blue"><span class="material-symbol">info</span></Button>
                  <Button size="sm-icon" variant="destructive"><span class="material-symbol">delete</span></Button>
                </div>
              </div>
              <div class="space-y-4 pt-4 border-t border-foreground/5">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Extra Small (32px)
                </span>
                <div class="flex flex-wrap items-center gap-3">
                  <Button size="xs-icon"><span class="material-symbol">home</span></Button>
                  <Button size="xs-icon" variant="neutral"><span class="material-symbol">settings</span></Button>
                  <Button size="xs-icon" variant="green"><span class="material-symbol">check</span></Button>
                  <Button size="xs-icon" variant="blue"><span class="material-symbol">info</span></Button>
                  <Button size="xs-icon" variant="destructive"><span class="material-symbol">delete</span></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading States Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Loading States
        </h2>
        <div class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Standard Buttons Loading
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-4">
                  <Button size="xl" loading>Confirming Order</Button>
                  <Button size="lg" variant="green" loading>Processing Data</Button>
                  <Button variant="destructive" loading>Deleting Item</Button>
                  <Button size="sm" variant="neutral" loading>Loading Logs</Button>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Icon Buttons Loading
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-4">
                  <Button size="xxl-icon" loading><span class="material-symbol">sync</span></Button>
                  <Button size="xl-icon" variant="green" loading><span class="material-symbol">check</span></Button>
                  <Button size="lg-icon" variant="destructive" loading><span class="material-symbol">delete</span></Button>
                  <Button size="icon" variant="blue" loading><span class="material-symbol">refresh</span></Button>
                  <Button size="sm-icon" variant="outline" loading><span class="material-symbol">settings</span></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Variant Spectrum */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Full Variant Spectrum
        </h2>
        <div class="space-y-3">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            All Color Variants
          </h3>
          <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
            <div class="flex flex-wrap items-center gap-3">
              <For each={allVariants}>
                {(variant) => (
                  <Button variant={variant}>
                    {variant!.charAt(0).toUpperCase() + variant!.slice(1)}
                  </Button>
                )}
              </For>
            </div>
          </div>
        </div>
      </section>

      {/* Chips Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Chips
        </h2>
        <div class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {/* Geometric Scales */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Geometric Scales
              </h3>
              <div class="flex flex-wrap items-center gap-4 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <Chip size="xs">Extra Small</Chip>
                <Chip size="sm">Small</Chip>
                <Chip size="default">Default</Chip>
                <Chip size="lg">Large</Chip>
              </div>
            </div>

            {/* Spectral Variants */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Spectral Variants
              </h3>
              <div class="flex flex-wrap items-center gap-3 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <For each={chipVariants}>
                  {(variant) => (
                    <Chip variant={variant}>
                      {variant.charAt(0).toUpperCase() + variant.slice(1)}
                    </Chip>
                  )}
                </For>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {/* Clickable Radios */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Clickable Radios
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-3">
                  <Chip
                    variant="blue"
                    size="default"
                    clickable
                    active={chipActive() === "insert"}
                    onClick={() => setChipActive("insert")}
                  >
                    Insert Mode
                  </Chip>
                  <Chip
                    variant="destructive"
                    size="default"
                    clickable
                    active={chipActive() === "swap"}
                    onClick={() => setChipActive("swap")}
                  >
                    Swap Mode
                  </Chip>
                  <Chip
                    variant="neutral"
                    size="default"
                    clickable
                    disabled
                  >
                    Disabled
                  </Chip>
                </div>
              </div>
            </div>

            {/* Clickable Multi (Checkboxes) */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Clickable Multi (Checkboxes)
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-3">
                  <Chip
                    variant="teal"
                    size="default"
                    clickable
                    active={multiActive().includes("typescript")}
                    onClick={() => toggleMulti("typescript")}
                  >
                    TypeScript
                  </Chip>
                  <Chip
                    variant="orange"
                    size="default"
                    clickable
                    active={multiActive().includes("solidjs")}
                    onClick={() => toggleMulti("solidjs")}
                  >
                    SolidJS
                  </Chip>
                  <Chip
                    variant="indigo"
                    size="default"
                    clickable
                    active={multiActive().includes("tailwind")}
                    onClick={() => toggleMulti("tailwind")}
                  >
                    Tailwind
                  </Chip>
                  <Chip
                    variant="violet"
                    size="default"
                    clickable
                    active={multiActive().includes("vite")}
                    onClick={() => toggleMulti("vite")}
                  >
                    Vite
                  </Chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Badges
        </h2>
        <div class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {/* Badge Scales */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Notification Scales
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-end justify-center gap-6">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                      <Badge value={3} size="xs" class="static translate-x-0 translate-y-0" />
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-foreground/40">XS</span>
                  </div>
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-14 h-14 rounded-xl bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                      <Badge value={12} size="sm" class="static translate-x-0 translate-y-0" />
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-foreground/40">SM</span>
                  </div>
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 rounded-xl bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                      <Badge value={99} size="default" class="static translate-x-0 translate-y-0" />
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Default</span>
                  </div>
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-[72px] h-[72px] rounded-xl bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                      <Badge value="!" size="lg" class="static translate-x-0 translate-y-0" />
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-foreground/40">LG</span>
                  </div>
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-20 h-20 rounded-xl bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                      <Badge value="99+" size="xl" class="static translate-x-0 translate-y-0" />
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-foreground/40">XL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Icon Buttons (Square) */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Badge Icon Buttons (Square)
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-4">
                  <IconBadge size="xxl-icon" icon="home" value={12} variant="default" />
                  <IconBadge size="xl-icon" icon="settings" value={5} variant="neutral" badgeVariant="blue" />
                  <IconBadge size="lg-icon" icon="check" value="✓" variant="green" badgeVariant="success" />
                  <IconBadge size="icon" icon="info" value={3} variant="blue" badgeVariant="blue" />
                  <IconBadge size="sm-icon" icon="delete" value="!" variant="destructive" badgeVariant="warning" />
                  <IconBadge size="xs-icon" icon="notifications" value={99} variant="ghost" class="text-neutral-foreground hover:bg-neutral" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {/* Badge Icon Buttons (Circular) */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Badge Icon Buttons (Circular)
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-4">
                  <IconBadge size="xxl-icon" icon="home" value={12} variant="default" shape="circle" />
                  <IconBadge size="xl-icon" icon="settings" value={5} variant="neutral" badgeVariant="blue" shape="circle" />
                  <IconBadge size="lg-icon" icon="check" value="✓" variant="green" badgeVariant="success" shape="circle" />
                  <IconBadge size="icon" icon="info" value={3} variant="blue" badgeVariant="blue" shape="circle" />
                  <IconBadge size="sm-icon" icon="delete" value="!" variant="destructive" badgeVariant="warning" shape="circle" />
                  <IconBadge size="xs-icon" icon="notifications" value={99} variant="ghost" shape="circle" class="text-neutral-foreground hover:bg-neutral rounded-full" />
                </div>
              </div>
            </div>

            {/* Badge Labeled Buttons */}
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Badge Labeled Buttons (Scales)
              </h3>
              <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <div class="flex flex-wrap items-center gap-4">
                  <IconBadge size="xxl" variant="default" icon="home" label="Home" value={12} />
                  <IconBadge size="xl" variant="neutral" icon="settings" label="Settings" value={5} badgeVariant="blue" />
                  <IconBadge size="lg" variant="green" icon="check" label="Verified" value="✓" badgeVariant="success" />
                  <IconBadge size="default" variant="blue" icon="shopping_cart" label="Checkout" value={3} badgeVariant="blue" />
                  <IconBadge size="sm" variant="destructive" icon="delete" label="Delete" value="!" badgeVariant="warning" />
                  <IconBadge size="xs" variant="ghost" icon="notifications" label="Alerts" value={99} badgeVariant="neutral" />
                </div>
              </div>
            </div>
          </div>

          {/* Pure Mode */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Pure Mode (Zero Chrome)
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="flex flex-wrap items-center gap-6">
                <IconBadge size="xxl-icon" icon="notifications" value={12} variant="pure" />
                <IconBadge size="xl-icon" icon="settings" value={5} badgeVariant="blue" variant="pure" />
                <IconBadge size="lg-icon" icon="warning" value="!" badgeVariant="warning" variant="pure" />
                <IconBadge size="icon" icon="verified" value="✓" badgeVariant="success" variant="pure" />
                <IconBadge size="sm-icon" icon="mail" value={99} variant="pure" badgeVariant="neutral" />
                <IconBadge size="xs-icon" icon="shopping_cart" value={3} variant="pure" badgeSize="xs" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Menus Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          System Menus
        </h2>
        <div class="space-y-3">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            Hierarchy & Smart Positioning
          </h3>
          <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
            <div class="flex flex-wrap items-center gap-4">
              {/* Double Nested Menu */}
              <Menu position="bottom-start">
                <MenuTrigger>
                  {(props) => (
                    <Button variant="outline" {...props}>
                      Double Nested Menu
                    </Button>
                  )}
                </MenuTrigger>
                <MenuContent>
                  <MenuItem>Root Action</MenuItem>
                  <Submenu>
                    <SubmenuTrigger>Enterprise Access</SubmenuTrigger>
                    <SubmenuContent>
                      <MenuItem>Level 2 Action</MenuItem>
                      <Submenu>
                        <SubmenuTrigger>Contract Settings</SubmenuTrigger>
                        <SubmenuContent>
                          <MenuItem>Standard Unit</MenuItem>
                          <MenuItem>Active Unit</MenuItem>
                          <MenuItem>Danger Unit</MenuItem>
                        </SubmenuContent>
                      </Submenu>
                      <MenuItem>Level 2 Return</MenuItem>
                    </SubmenuContent>
                  </Submenu>
                  <MenuItem>Finalize Contract</MenuItem>
                </MenuContent>
              </Menu>

              <div class="w-px h-8 bg-foreground/10 mx-2" />

              {/* Position Demos */}
              <Menu position="bottom-start">
                <MenuTrigger>
                  {(props) => (
                    <Button variant="outline" {...props}>
                      Bottom Start
                    </Button>
                  )}
                </MenuTrigger>
                <MenuContent>
                  <MenuItem>Profile</MenuItem>
                  <MenuItem>Billing</MenuItem>
                  <MenuItem>Settings</MenuItem>
                </MenuContent>
              </Menu>

              <Menu position="bottom-end">
                <MenuTrigger>
                  {(props) => (
                    <Button variant="outline" {...props}>
                      Bottom End
                    </Button>
                  )}
                </MenuTrigger>
                <MenuContent>
                  <MenuItem>Profile</MenuItem>
                  <MenuItem>Billing</MenuItem>
                  <MenuItem>Settings</MenuItem>
                </MenuContent>
              </Menu>

              <Menu position="top-start">
                <MenuTrigger>
                  {(props) => (
                    <Button variant="outline" {...props}>
                      Top Start
                    </Button>
                  )}
                </MenuTrigger>
                <MenuContent>
                  <MenuItem>Profile</MenuItem>
                  <MenuItem>Billing</MenuItem>
                  <MenuItem>Settings</MenuItem>
                </MenuContent>
              </Menu>

              <Menu position="top-end">
                <MenuTrigger>
                  {(props) => (
                    <Button variant="outline" {...props}>
                      Top End
                    </Button>
                  )}
                </MenuTrigger>
                <MenuContent>
                  <MenuItem>Profile</MenuItem>
                  <MenuItem>Billing</MenuItem>
                  <MenuItem>Settings</MenuItem>
                </MenuContent>
              </Menu>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
