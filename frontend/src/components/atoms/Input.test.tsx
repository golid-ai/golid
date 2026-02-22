import { render, screen, fireEvent } from "@solidjs/testing-library";
import axe from "axe-core";
import { Input } from "./Input";

test("renders with placeholder", () => {
  render(() => <Input placeholder="Enter name" />);
  expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
});

test("displays value", () => {
  render(() => <Input value="John" />);
  expect(screen.getByDisplayValue("John")).toBeInTheDocument();
});

test("fires onInput event", async () => {
  const handler = vi.fn();
  render(() => <Input onInput={handler} />);
  const input = screen.getByRole("textbox");
  await fireEvent.input(input, { target: { value: "test" } });
  expect(handler).toHaveBeenCalled();
});

test("has no a11y violations", async () => {
  const { container } = render(() => <Input placeholder="Accessible input" />);
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
});
