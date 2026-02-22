import { createSignal, createEffect, type Component } from "solid-js";
import { Modal } from "~/components/atoms/Modal";
import { Input } from "~/components/atoms/Input";
import { Button } from "~/components/atoms/Button";

// ============================================================================
// TYPES
// ============================================================================

export interface InputModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  label?: string;
  initialValue?: string | number | null;
  onConfirm?: (value: string | number | null) => void;
  onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InputModal: Component<InputModalProps> = (props) => {
  const [value, setValue] = createSignal<string | number | null>(
    props.initialValue ?? ""
  );

  createEffect(() => {
    if (props.open) {
      setValue(props.initialValue ?? "");
      requestAnimationFrame(() => document.getElementById("edit-input")?.focus());
    }
  });

  const handleConfirm = () => {
    props.onConfirm?.(value());
    props.onOpenChange?.(false);
  };

  const handleCancel = () => {
    props.onCancel?.();
    props.onOpenChange?.(false);
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title || "Edit Value"}
      hideDefaultFooter
      onCancel={handleCancel}
    >
      <div class="space-y-4">
        <label
          class="block text-sm font-medium text-muted-foreground uppercase tracking-widest"
          for="edit-input"
        >
          {props.label || "New Value"}
        </label>
        <Input
          id="edit-input"
          value={String(value() ?? "")}
          onInput={(e) => setValue(e.currentTarget.value)}
        />
      </div>

      <div class="flex justify-end gap-3 mt-8">
        <Button variant="neutral" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm}>Save Changes</Button>
      </div>
    </Modal>
  );
};

export default InputModal;
