import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { InputModal } from "./InputModal";

describe("InputModal", () => {
  it("renders title and label when open", () => {
    render(() => <InputModal open={true} title="Edit Name" label="Full Name" />);
    expect(screen.getByText("Edit Name")).toBeInTheDocument();
    expect(screen.getByText("Full Name")).toBeInTheDocument();
  });

  it("renders default title and label", () => {
    render(() => <InputModal open={true} />);
    expect(screen.getByText("Edit Value")).toBeInTheDocument();
    expect(screen.getByText("New Value")).toBeInTheDocument();
  });

  it("renders input with initial value", () => {
    render(() => <InputModal open={true} initialValue="hello" />);
    const input = screen.getByDisplayValue("hello");
    expect(input).toBeInTheDocument();
  });

  it("calls onConfirm with value on save", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <InputModal open={true} onConfirm={onConfirm} onOpenChange={onOpenChange} initialValue="test" />
    ));
    await fireEvent.click(screen.getByText("Save Changes"));
    expect(onConfirm).toHaveBeenCalledWith("test");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onCancel on cancel click", async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <InputModal open={true} onCancel={onCancel} onOpenChange={onOpenChange} />
    ));
    await fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
