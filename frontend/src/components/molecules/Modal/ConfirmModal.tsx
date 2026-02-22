import { type Component } from "solid-js";
import { Modal } from "~/components/atoms/Modal";

// ============================================================================
// TYPES
// ============================================================================

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ConfirmModal: Component<ConfirmModalProps> = (props) => {
  const handleConfirm = () => {
    props.onConfirm?.();
    props.onOpenChange?.(false);
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title || "Are you sure?"}
      message={
        props.message ||
        "Please confirm you would like to proceed with this operation. This will apply the selected changes to your current session."
      }
      confirmText={props.confirmText || "Confirm"}
      cancelText={props.cancelText || "Cancel"}
      onConfirm={handleConfirm}
      icon={props.icon || "help"}
      maxWidth="max-w-[500px]"
    />
  );
};

export default ConfirmModal;
