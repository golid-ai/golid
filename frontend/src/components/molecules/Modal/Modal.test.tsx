import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ConfirmModal } from "./ConfirmModal";
import { DestructiveModal } from "./DestructiveModal";

describe("ConfirmModal", () => {
  it("renders title and message when open", () => {
    render(() => (
      <ConfirmModal
        open={true}
        title="Confirm Action"
        message="Are you sure about this?"
      />
    ));
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure about this?")).toBeInTheDocument();
  });

  it("renders default title when none provided", () => {
    render(() => <ConfirmModal open={true} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onConfirm and closes on confirm click", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <ConfirmModal
        open={true}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    ));
    await fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses custom button text", () => {
    render(() => (
      <ConfirmModal open={true} confirmText="Yes, proceed" cancelText="No, go back" />
    ));
    expect(screen.getByText("Yes, proceed")).toBeInTheDocument();
    expect(screen.getByText("No, go back")).toBeInTheDocument();
  });
});

describe("DestructiveModal", () => {
  it("renders destructive variant title", () => {
    render(() => <DestructiveModal open={true} title="Delete Item" />);
    expect(screen.getByText("Delete Item")).toBeInTheDocument();
  });

  it("renders default destructive title", () => {
    render(() => <DestructiveModal open={true} />);
    expect(screen.getByText("Destructive Action")).toBeInTheDocument();
  });

  it("shows Processing text when confirming", () => {
    render(() => <DestructiveModal open={true} isConfirming />);
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("calls onConfirm on button click", async () => {
    const onConfirm = vi.fn();
    render(() => (
      <DestructiveModal open={true} onConfirm={onConfirm} />
    ));
    await fireEvent.click(screen.getByText("Delete Permanently"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("renders custom message", () => {
    render(() => (
      <DestructiveModal open={true} message="This will remove all data." />
    ));
    expect(screen.getByText("This will remove all data.")).toBeInTheDocument();
  });
});
