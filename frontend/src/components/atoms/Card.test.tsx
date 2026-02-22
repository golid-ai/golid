import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./Card";

test("renders children", () => {
  render(() => <Card>Card Content</Card>);
  expect(screen.getByText("Card Content")).toBeInTheDocument();
});

test("applies custom class", () => {
  const { container } = render(() => <Card class="my-custom">Text</Card>);
  const div = container.firstElementChild as HTMLElement;
  expect(div.className).toContain("my-custom");
});

test("static card renders as div", () => {
  const { container } = render(() => <Card static>Static Card</Card>);
  const el = container.firstElementChild;
  expect(el?.tagName).toBe("DIV");
});

test("card with onClick renders as button", async () => {
  const onClick = vi.fn();
  const { container } = render(() => <Card onClick={onClick}>Click me</Card>);
  const el = container.firstElementChild as HTMLElement;
  expect(el.tagName).toBe("BUTTON");
  await fireEvent.click(el);
  expect(onClick).toHaveBeenCalledOnce();
});

test("liftable card has hover classes", () => {
  const { container } = render(() => <Card liftable>Hoverable</Card>);
  const el = container.firstElementChild as HTMLElement;
  expect(el.className).toContain("hover:");
});

test("renders CardHeader", () => {
  render(() => <CardHeader>Header</CardHeader>);
  expect(screen.getByText("Header")).toBeInTheDocument();
});

test("renders CardTitle as h3", () => {
  render(() => <CardTitle>Title</CardTitle>);
  expect(screen.getByText("Title").tagName).toBe("H3");
});

test("renders CardContent", () => {
  render(() => <CardContent>Body</CardContent>);
  expect(screen.getByText("Body")).toBeInTheDocument();
});

test("renders CardFooter", () => {
  render(() => <CardFooter>Footer</CardFooter>);
  expect(screen.getByText("Footer")).toBeInTheDocument();
});
