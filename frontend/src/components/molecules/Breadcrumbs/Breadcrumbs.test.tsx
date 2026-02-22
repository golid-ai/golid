import { render, screen } from "@solidjs/testing-library";
import { Breadcrumbs } from "./Breadcrumbs";

test("renders breadcrumb items", () => {
  render(() => (
    <Breadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Profile" },
      ]}
    />
  ));
  expect(screen.getByText("Home")).toBeInTheDocument();
  expect(screen.getByText("Settings")).toBeInTheDocument();
  expect(screen.getByText("Profile")).toBeInTheDocument();
});

test("marks last item as current page", () => {
  render(() => (
    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Current" }]} />
  ));
  const current = screen.getByText("Current").closest("[aria-current]");
  expect(current).toHaveAttribute("aria-current", "page");
});

test("renders navigation landmark", () => {
  render(() => <Breadcrumbs items={[{ label: "Home" }]} />);
  expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
});

test("renders links for non-last items with href", () => {
  render(() => (
    <Breadcrumbs
      items={[{ label: "Home", href: "/" }, { label: "Page" }]}
    />
  ));
  const link = screen.getByText("Home").closest("a");
  expect(link).toHaveAttribute("href", "/");
});
