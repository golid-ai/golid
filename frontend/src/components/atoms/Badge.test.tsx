import { render, screen } from "@solidjs/testing-library";
import { Badge } from "./Badge";

test("renders with numeric value", () => {
  render(() => <Badge value={5} />);
  expect(screen.getByText("5")).toBeInTheDocument();
});

test("truncates at max with + suffix", () => {
  render(() => <Badge value={150} max={99} />);
  expect(screen.getByText("99+")).toBeInTheDocument();
});

test("renders with string value", () => {
  render(() => <Badge value="New" />);
  expect(screen.getByText("New")).toBeInTheDocument();
});
