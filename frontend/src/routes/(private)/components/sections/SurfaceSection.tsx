import { For } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Widget } from "~/components/molecules/Widget";

// ============================================================================
// TYPES
// ============================================================================

export interface SurfaceSectionProps {}

// ============================================================================
// COMPONENT
// ============================================================================

export function SurfaceSection(_props: SurfaceSectionProps) {
  const dashboardNodes = ["Discovery", "Validation", "Payment", "Support"];

  return (
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
        Surfaces
      </h2>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Left Column: Atmosphere + Loading States */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Atmosphere */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Atmosphere
            </h3>
            <div class="space-y-4">
              {/* Glassmorphism */}
              <div class="relative h-24 w-full rounded-2xl overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]">
                {/* Vibrant "Bokeh" background to demonstrate blur */}
                <div class="absolute inset-0 bg-blue-grad opacity-40" />
                <div class="absolute -inset-4 bg-gradient-to-tr from-pink/20 via-violet/20 to-teal/20 blur-2xl opacity-50" />

                <div class="absolute inset-0 glass flex items-center justify-center border border-white/10">
                  <span class="text-foreground font-bold tracking-tight">
                    Glassmorphism
                  </span>
                </div>
              </div>

              {/* Modern Elevation */}
              <div class="h-24 w-full bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 shadow-elevated flex items-center justify-center transition-all hover:shadow-2xl hover:-translate-y-1">
                <span class="text-foreground font-bold tracking-tight">
                  Modern Elevation
                </span>
              </div>
            </div>
          </div>

          {/* Loading States (Skeleton) */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Loading States
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 space-y-4 shadow-elevated">
              {/* Skeleton: Avatar + Name */}
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-foreground/10" />
                <div class="space-y-2 flex-1">
                  <div class="h-3 w-24 bg-foreground/10 rounded" />
                  <div class="h-2 w-16 bg-foreground/10 rounded" />
                </div>
              </div>
              {/* Skeleton: Text Lines */}
              <div class="space-y-2 pt-2">
                <div class="h-2 w-full bg-foreground/5 rounded" />
                <div class="h-2 w-[90%] bg-foreground/5 rounded" />
                <div class="h-2 w-[40%] bg-foreground/5 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Widget */}
        <div class="space-y-3">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            System Widgets
          </h3>
          <Widget
            title="Example Widget"
            class="w-full"
            headerActions={
              <div class="flex gap-2 items-center opacity-40">
                <span class="text-[9px] font-bold tracking-widest uppercase">
                  Sync: 14ms
                </span>
              </div>
            }
          >
            <div class="space-y-6">
              {/* Metrics Row */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5 space-y-1">
                  <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    User Activity
                  </span>
                  <div class="text-xl font-mono font-bold text-foreground tracking-tight">
                    1.2 GB/s
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5 space-y-1 text-right">
                  <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Accuracy
                  </span>
                  <div class="text-xl font-mono font-bold text-primary tracking-tight">
                    99.98%
                  </div>
                </div>
              </div>

              {/* Node Control Sub-Section */}
              <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-foreground/5 pb-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                    Dashboard Controls
                  </span>
                  <span class="text-[9px] font-mono text-muted-foreground">
                    System Operational
                  </span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <For each={dashboardNodes}>
                    {(node, i) => (
                      <Button
                        size="xs"
                        variant={i() === 0 ? "neutral" : "ghost"}
                        class="transition-all duration-300"
                      >
                        {node}
                      </Button>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Widget>
        </div>
      </div>
    </section>
  );
}
