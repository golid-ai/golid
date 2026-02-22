import { type Component, type JSX } from "solid-js";
import { Modal } from "~/components/atoms/Modal";

// ============================================================================
// TYPES
// ============================================================================

export interface DestructiveModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
  isConfirming?: boolean;
  title?: string;
  message?: string | JSX.Element;
  confirmText?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DestructiveModal: Component<DestructiveModalProps> = (props) => {
  const handleConfirm = () => {
    props.onConfirm?.();
    props.onOpenChange?.(false);
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      variant="destructive"
      title={props.title || "Destructive Action"}
      confirmText={props.isConfirming ? "Processing..." : (props.confirmText || "Delete Permanently")}
      onConfirm={handleConfirm}
      icon="warning"
      maxWidth="max-w-[500px]"
    >
      <div class="text-muted-foreground text-base leading-relaxed">
        {props.message || (
          <p>
            This action is{" "}
            <span class="text-danger font-bold">irreversible</span>. All
            associated data will be permanently removed from the system. Are you
            absolutely sure you want to proceed?
          </p>
        )}
      </div>
    </Modal>
  );
};

export default DestructiveModal;
