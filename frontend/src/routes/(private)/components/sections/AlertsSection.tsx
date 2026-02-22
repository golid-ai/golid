import { createSignal } from "solid-js";
import { Alert, AlertTitle, AlertDescription } from "~/components/molecules/Alert";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { Spinner } from "~/components/atoms/Spinner";
import { Modal } from "~/components/atoms/Modal";
import { ConfirmModal, InputModal, DestructiveModal } from "~/components/molecules/Modal";
import { toast } from "~/lib/stores/toast";
import { snackbar } from "~/lib/stores/snackbar";
import { ui } from "~/lib/stores/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface AlertsSectionProps {}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AlertsSection(_props: AlertsSectionProps) {
  // Modal states
  const [basicModalOpen, setBasicModalOpen] = createSignal(false);
  const [confirmModalOpen, setConfirmModalOpen] = createSignal(false);
  const [inputModalOpen, setInputModalOpen] = createSignal(false);
  const [destructiveModalOpen, setDestructiveModalOpen] = createSignal(false);

  return (
    <>
      {/* Alerts Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Alerts
        </h2>

        <div class="space-y-6">
          {/* Inline Alerts */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Inline Alerts
            </h3>
            <div class="space-y-4">
              <Alert icon="terminal">
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  You can add components to your app using the CLI.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive" icon="error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Your session has expired. Please log in again.
                </AlertDescription>
              </Alert>
              <Alert variant="success" icon="check_circle">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your data has been successfully imported.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Toaster Lab */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Toaster Lab
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6">
                <Button
                  variant="green"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => toast.success("Success Notification", "System is performing at peak capacity.")}
                >
                  <Icon name="check_circle" class="mr-4 text-3xl" filled />
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger</div>
                    <div class="font-bold text-base">Success Toast</div>
                  </div>
                </Button>
                <Button
                  variant="blue"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => toast.info("System Update", "New telemetry data is available for review.")}
                >
                  <Icon name="info" class="mr-4 text-3xl" filled />
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger</div>
                    <div class="font-bold text-base">Info Toast</div>
                  </div>
                </Button>
                <Button
                  variant="neutral"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => toast.warning("Warning Issued", "High spectral density detected in Lime.")}
                >
                  <Icon name="warning" class="mr-4 text-3xl" filled />
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger</div>
                    <div class="font-bold text-base">Warning Toast</div>
                  </div>
                </Button>
                <Button
                  variant="destructive"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => toast.error("Critical Failure", "Authentication handshake timed out.")}
                >
                  <Icon name="error" class="mr-4 text-3xl" filled />
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger</div>
                    <div class="font-bold text-base">Error Toast</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Snackbar Lab */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Snackbar Lab
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6">
                <Button
                  variant="neutral"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => snackbar.show("File uploaded successfully.", { duration: 5000 })}
                >
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger (5s)</div>
                    <div class="font-bold text-base">Basic Snack</div>
                  </div>
                </Button>
                <Button
                  variant="neutral"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => snackbar.show("Network anomaly detected.", { actionLabel: "Acknowledge", onAction: () => {}, duration: 0 })}
                >
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger (Sticky)</div>
                    <div class="font-bold text-base">Action Snack</div>
                  </div>
                </Button>
                <Button
                  variant="neutral"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => snackbar.show("Extended system maintenance scheduled for 02:00 UTC tomorrow. Please save all work.", { duration: 10000 })}
                >
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger (10s)</div>
                    <div class="font-bold text-base">Longer Snack</div>
                  </div>
                </Button>
                <Button
                  variant="neutral"
                  class="h-16 flex items-center justify-start px-6"
                  onClick={() => snackbar.show("Theme updated.", { actionLabel: "Undo", onAction: () => { document.documentElement.classList.toggle("dark"); }, duration: 6000 })}
                >
                  <div class="text-left leading-tight">
                    <div class="text-[10px] opacity-70 font-bold uppercase tracking-widest">Trigger (6s)</div>
                    <div class="font-bold text-base">System Snack</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Screen Overlays Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Full-Screen Overlays
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              System Modals
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={() => setBasicModalOpen(true)}>
                  Basic Modal
                </Button>
                <Button size="sm" variant="blue" onClick={() => setConfirmModalOpen(true)}>
                  Confirm Modal
                </Button>
                <Button size="sm" variant="neutral" onClick={() => setInputModalOpen(true)}>
                  Input Modal
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDestructiveModalOpen(true)}>
                  Destructive Modal
                </Button>
              </div>
            </div>

            {/* Modal Instances */}
            <Modal
              open={basicModalOpen()}
              onOpenChange={setBasicModalOpen}
              title="Basic Modal"
              message="This is a simple modal dialog. You can use it to display information or request user confirmation."
              icon="info"
              confirmText="Got it"
              showCancel={false}
              onConfirm={() => {
                snackbar.show("Modal confirmed!");
                setBasicModalOpen(false);
              }}
            />

            <ConfirmModal
              open={confirmModalOpen()}
              onOpenChange={setConfirmModalOpen}
              title="Confirm Action"
              message="Are you sure you want to proceed? This will apply the changes to your session."
              icon="help"
              onConfirm={() => snackbar.show("Action confirmed!", { duration: 3000 })}
            />

            <InputModal
              open={inputModalOpen()}
              onOpenChange={setInputModalOpen}
              title="Enter Details"
              label="Your Name"
              initialValue=""
              onConfirm={(value) => snackbar.show(`You entered: ${value}`, { duration: 3000 })}
            />

            <DestructiveModal
              open={destructiveModalOpen()}
              onOpenChange={setDestructiveModalOpen}
              title="Delete Item"
              onConfirm={() => snackbar.show("Item deleted!", { duration: 3000 })}
            />
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Loading Overlays
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="green"
                  onClick={() => {
                    ui.setLoading(true);
                    setTimeout(() => ui.setLoading(false), 4000);
                  }}
                >
                  Funny Cycle
                </Button>
                <Button
                  size="sm"
                  variant="blue"
                  onClick={() => {
                    ui.setLoading(true, "Waking up the backend...");
                    setTimeout(() => ui.setLoading(false), 4000);
                  }}
                >
                  Static Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spinners Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Spinners
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6">
          {/* Multi-Arc Logic */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Multi-Arc Logic
            </h3>
            <div class="flex flex-wrap items-center justify-center gap-4 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 min-h-[140px]">
              <Spinner size="sm" variant="multi" />
              <Spinner size="md" variant="multi" />
              <Spinner size="lg" variant="multi" />
              <Spinner size="xl" variant="multi" />
            </div>
          </div>

          {/* Variable Thickness */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Variable Thickness
            </h3>
            <div class="flex flex-wrap items-center justify-center gap-4 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 min-h-[140px]">
              <Spinner size="lg" thickness={1} />
              <Spinner size="lg" thickness={2} />
              <Spinner size="lg" thickness={4} />
              <Spinner size="lg" thickness={8} />
            </div>
          </div>

          {/* Neon & Primary */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Neon & Primary
            </h3>
            <div class="flex items-center justify-center gap-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 min-h-[140px]">
              <div class="flex flex-col items-center gap-2">
                <Spinner size="lg" color="green" variant="multi" />
                <span class="text-[7px] font-bold opacity-30 tracking-widest uppercase">Multi</span>
              </div>
              <div class="flex flex-col items-center gap-2">
                <Spinner size="lg" color="green" thickness={6} />
                <span class="text-[7px] font-bold opacity-30 tracking-widest uppercase">Heavy</span>
              </div>
            </div>
          </div>

          {/* System Critical */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              System Critical
            </h3>
            <div class="flex items-center justify-center gap-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 min-h-[140px]">
              <div class="flex flex-col items-center gap-2">
                <Spinner size="lg" color="danger" variant="multi" />
                <span class="text-[7px] font-bold opacity-30 tracking-widest uppercase">Multi</span>
              </div>
              <div class="flex flex-col items-center gap-2">
                <Spinner size="lg" color="danger" thickness={6} />
                <span class="text-[7px] font-bold opacity-30 tracking-widest uppercase">Heavy</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
