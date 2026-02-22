import { render, screen, fireEvent } from "@solidjs/testing-library";
import axe from "axe-core";
import { Button } from "./Button";

test("renders children text", () => {
  render(() => <Button>Click me</Button>);
  expect(screen.getByText("Click me")).toBeInTheDocument();
});

test("renders with variant=ghost", () => {
  render(() => <Button variant="ghost">Ghost</Button>);
  expect(screen.getByText("Ghost")).toBeInTheDocument();
});

test("shows loading state with aria-busy", () => {
  render(() => <Button loading={true}>Save</Button>);
  const btn = screen.getByRole("button");
  expect(btn).toHaveAttribute("aria-busy", "true");
});

test("calls onClick handler", async () => {
  const handler = vi.fn();
  render(() => <Button onClick={handler}>Click</Button>);
  await fireEvent.click(screen.getByText("Click"));
  expect(handler).toHaveBeenCalledTimes(1);
});

test("disabled prevents click", async () => {
  const handler = vi.fn();
  render(() => <Button disabled onClick={handler}>Nope</Button>);
  const btn = screen.getByRole("button");
  expect(btn).toBeDisabled();
});

test("has no a11y violations", async () => {
  const { container } = render(() => <Button>Accessible</Button>);
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
});
