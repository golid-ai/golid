import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ConfirmModal } from "./ConfirmModal";

describe("ConfirmModal", () => {
  test("renders title and message when open", () => {
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

  test("renders default title and message when none provided", () => {
    render(() => <ConfirmModal open={true} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(
      screen.getByText(/Please confirm you would like to proceed/)
    ).toBeInTheDocument();
  });

  test("does not render content when closed", () => {
    render(() => <ConfirmModal open={false} title="Hidden" />);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  test("calls onConfirm and onOpenChange(false) on confirm click", async () => {
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

  test("cancel button calls onOpenChange(false)", async () => {
    const onOpenChange = vi.fn();
    render(() => <ConfirmModal open={true} onOpenChange={onOpenChange} />);
    await fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("renders custom confirm and cancel text", () => {
    render(() => (
      <ConfirmModal
        open={true}
        confirmText="Yes, proceed"
        cancelText="No, go back"
      />
    ));
    expect(screen.getByText("Yes, proceed")).toBeInTheDocument();
    expect(screen.getByText("No, go back")).toBeInTheDocument();
  });

  test("modal has dialog role and aria-modal", () => {
    render(() => <ConfirmModal open={true} title="Test" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
