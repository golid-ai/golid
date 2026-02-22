import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Snackbar } from "./Snackbar";

test("renders message", () => {
  render(() => <Snackbar id="1" message="Item deleted" />);
  expect(screen.getByText("Item deleted")).toBeInTheDocument();
});

test("renders action button when label provided", () => {
  const onAction = vi.fn();
  render(() => (
    <Snackbar id="1" message="Deleted" actionLabel="Undo" onAction={onAction} />
  ));
  expect(screen.getByText("Undo")).toBeInTheDocument();
});

test("calls onAction and dismisses when action clicked", async () => {
  const onAction = vi.fn();
  render(() => (
    <Snackbar id="1" message="Deleted" actionLabel="Undo" onAction={onAction} />
  ));
  await fireEvent.click(screen.getByText("Undo"));
  expect(onAction).toHaveBeenCalledOnce();
});

test("hides action button when no label", () => {
  render(() => <Snackbar id="1" message="Simple notice" />);
  expect(screen.queryByRole("button")).toBeNull();
});
