import { render, screen } from "@solidjs/testing-library";
import { Alert, AlertTitle, AlertDescription } from "./Alert";

test("renders with default variant and role=alert", () => {
  render(() => (
    <Alert>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Something happened</AlertDescription>
    </Alert>
  ));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("Heads up")).toBeInTheDocument();
  expect(screen.getByText("Something happened")).toBeInTheDocument();
});

test("renders destructive variant", () => {
  render(() => (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
    </Alert>
  ));
  const alert = screen.getByRole("alert");
  expect(alert.className).toContain("danger");
});

test("renders success variant", () => {
  render(() => (
    <Alert variant="success">
      <AlertTitle>Done</AlertTitle>
    </Alert>
  ));
  const alert = screen.getByRole("alert");
  expect(alert.className).toContain("green");
});

test("renders icon when provided", () => {
  render(() => (
    <Alert icon="info">
      <AlertTitle>Info</AlertTitle>
    </Alert>
  ));
  expect(screen.getByText("info")).toBeInTheDocument();
});
