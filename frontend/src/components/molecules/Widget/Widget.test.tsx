import { render, screen } from "@solidjs/testing-library";
import { Widget } from "./Widget";

test("renders title and children", () => {
  render(() => (
    <Widget title="Stats">
      <p>Content here</p>
    </Widget>
  ));
  expect(screen.getByText("Stats")).toBeInTheDocument();
  expect(screen.getByText("Content here")).toBeInTheDocument();
});

test("renders header actions when provided", () => {
  render(() => (
    <Widget title="Activity" headerActions={<button>Refresh</button>}>
      <p>Data</p>
    </Widget>
  ));
  expect(screen.getByText("Refresh")).toBeInTheDocument();
});

test("applies custom class", () => {
  const { container } = render(() => (
    <Widget title="Test" class="custom-class">
      <p>Body</p>
    </Widget>
  ));
  expect(container.querySelector(".custom-class")).toBeTruthy();
});
