import { render, screen } from "@solidjs/testing-library";
import { NumberInput } from "./NumberInput";

test("renders with label", () => {
  render(() => <NumberInput label="Quantity" />);
  expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
});

test("renders with placeholder", () => {
  render(() => <NumberInput placeholder="Enter amount" />);
  expect(screen.getByPlaceholderText("Enter amount")).toBeInTheDocument();
});

test("renders prefix and suffix", () => {
  render(() => <NumberInput prefix="$" suffix="/hr" label="Rate" />);
  expect(screen.getByText("$")).toBeInTheDocument();
  expect(screen.getByText("/hr")).toBeInTheDocument();
});

test("shows error message", () => {
  render(() => <NumberInput label="Amount" errorMessage="Required" />);
  expect(screen.getByText("Required")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toBeInTheDocument();
});

test("sets aria-invalid on error", () => {
  render(() => <NumberInput label="Amount" error />);
  const input = screen.getByLabelText("Amount");
  expect(input).toHaveAttribute("aria-invalid", "true");
});

test("disables input when disabled prop set", () => {
  render(() => <NumberInput label="Amount" disabled />);
  expect(screen.getByLabelText("Amount")).toBeDisabled();
});

test("uses numeric inputMode by default", () => {
  render(() => <NumberInput label="Count" />);
  expect(screen.getByLabelText("Count")).toHaveAttribute("inputMode", "numeric");
});

test("uses decimal inputMode when allowDecimal", () => {
  render(() => <NumberInput label="Price" allowDecimal />);
  expect(screen.getByLabelText("Price")).toHaveAttribute("inputMode", "decimal");
});
