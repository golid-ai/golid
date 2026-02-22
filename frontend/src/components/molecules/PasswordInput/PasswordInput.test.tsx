import { render, screen, fireEvent } from "@solidjs/testing-library";
import { PasswordInput } from "./PasswordInput";

test("renders as password input by default", () => {
  render(() => <PasswordInput label="Password" />);
  const input = screen.getByLabelText("Password");
  expect(input).toHaveAttribute("type", "password");
});

test("toggles visibility when button is clicked", async () => {
  render(() => <PasswordInput label="Password" />);
  const input = screen.getByLabelText("Password");
  const toggle = screen.getByRole("button", { name: /show password/i });

  expect(input).toHaveAttribute("type", "password");

  await fireEvent.click(toggle);
  expect(input).toHaveAttribute("type", "text");

  const hideToggle = screen.getByRole("button", { name: /hide password/i });
  await fireEvent.click(hideToggle);
  expect(input).toHaveAttribute("type", "password");
});

test("passes through input props", () => {
  render(() => <PasswordInput label="Secret" placeholder="Enter secret" />);
  const input = screen.getByPlaceholderText("Enter secret");
  expect(input).toBeInTheDocument();
});
