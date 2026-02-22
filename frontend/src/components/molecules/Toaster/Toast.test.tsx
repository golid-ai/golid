import { render, screen } from "@solidjs/testing-library";
import { Toast } from "./Toast";

test("renders success toast with message", () => {
  render(() => <Toast type="success" message="Saved!" />);
  expect(screen.getByText("Saved!")).toBeInTheDocument();
  expect(screen.getByText("check_circle")).toBeInTheDocument();
});

test("renders error toast with icon", () => {
  render(() => <Toast type="error" message="Failed" />);
  expect(screen.getByText("Failed")).toBeInTheDocument();
  expect(screen.getByText("cancel")).toBeInTheDocument();
});

test("renders info toast", () => {
  render(() => <Toast type="info" message="FYI" />);
  expect(screen.getByText("info")).toBeInTheDocument();
});

test("renders warning toast", () => {
  render(() => <Toast type="warning" message="Watch out" />);
  expect(screen.getByText("warning")).toBeInTheDocument();
});

test("renders optional description text", () => {
  render(() => <Toast type="success" message="Done" text="All items saved" />);
  expect(screen.getByText("All items saved")).toBeInTheDocument();
});
