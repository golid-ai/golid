import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Tabs, TabList, Tab, TabPanel } from "./Tabs";

function TabsHarness() {
  const [active, setActive] = createSignal("overview");
  return (
    <Tabs activeTab={active()} onTabChange={setActive} label="Sections">
      <TabList>
        <Tab name="overview">Overview</Tab>
        <Tab name="details">Details</Tab>
        <Tab name="disabled" disabled>Disabled</Tab>
      </TabList>
      <TabPanel name="overview">Overview content</TabPanel>
      <TabPanel name="details">Details content</TabPanel>
      <TabPanel name="disabled">Disabled content</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders tab buttons", () => {
    render(() => <TabsHarness />);
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Details" })).toBeInTheDocument();
  });

  it("shows active panel content", () => {
    render(() => <TabsHarness />);
    expect(screen.getByText("Overview content")).toBeInTheDocument();
    expect(screen.queryByText("Details content")).toBeNull();
  });

  it("switches panel on tab click", async () => {
    render(() => <TabsHarness />);
    await fireEvent.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByText("Details content")).toBeInTheDocument();
    expect(screen.queryByText("Overview content")).toBeNull();
  });

  it("marks active tab with aria-selected", () => {
    render(() => <TabsHarness />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "false");
  });

  it("renders tablist with label", () => {
    render(() => <TabsHarness />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-label", "Sections");
  });

  it("renders tabpanel role", () => {
    render(() => <TabsHarness />);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("disables tab when disabled prop set", () => {
    render(() => <TabsHarness />);
    expect(screen.getByRole("tab", { name: "Disabled" })).toBeDisabled();
  });
});
