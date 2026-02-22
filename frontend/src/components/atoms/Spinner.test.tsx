import { render } from "@solidjs/testing-library";
import { Spinner } from "./Spinner";

test("renders an SVG element", () => {
  const { container } = render(() => <Spinner />);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("renders with size prop", () => {
  const { container } = render(() => <Spinner size="lg" />);
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
});

test("renders xs size", () => {
  const { container } = render(() => <Spinner size="xs" />);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("renders xl size", () => {
  const { container } = render(() => <Spinner size="xl" />);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("renders multi variant", () => {
  const { container } = render(() => <Spinner variant="multi" />);
  const circles = container.querySelectorAll("circle");
  expect(circles.length).toBeGreaterThan(1);
});

test("applies custom class", () => {
  const { container } = render(() => <Spinner class="my-spinner" />);
  const wrapper = container.firstElementChild as HTMLElement;
  expect(wrapper.className).toContain("my-spinner");
});

test("renders green color variant", () => {
  const { container } = render(() => <Spinner color="green" />);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("renders danger color variant", () => {
  const { container } = render(() => <Spinner color="danger" />);
  expect(container.querySelector("svg")).not.toBeNull();
});
