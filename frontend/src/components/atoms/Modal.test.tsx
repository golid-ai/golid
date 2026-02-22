import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import axe from "axe-core";
import { Modal } from "./Modal";

describe("Modal", () => {
  test("renders content when open", () => {
    render(() => <Modal open title="Test Modal"><p>Modal content</p></Modal>);
    expect(screen.getByText("Modal content")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(() => <Modal open={false} title="Hidden"><p>Hidden content</p></Modal>);
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  test("has dialog role", () => {
    render(() => <Modal open title="Dialog Test"><p>Content</p></Modal>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("calls onCancel on escape key", async () => {
    const onCancel = vi.fn();
    render(() => <Modal open title="Escape" onCancel={onCancel}><p>Content</p></Modal>);
    const dialog = screen.getByRole("dialog");
    await fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  test("has no a11y violations", async () => {
    const { container } = render(() => <Modal open={true} onOpenChange={() => {}} title="Accessible Modal"><p>Modal content</p></Modal>);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
