import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Tabs, TabList, Tab, TabPanel } from "./Tabs";

function TabsHarness(props: { withSuccess?: boolean } = {}) {
  const [active, setActive] = createSignal("overview");
  return (
    <Tabs activeTab={active()} onTabChange={setActive} label="Sections">
      <TabList>
        <Tab name="overview">Overview</Tab>
        <Tab name="details">Details</Tab>
        <Tab name="disabled" disabled>Disabled</Tab>
        {props.withSuccess ? <Tab name="success" success>Success</Tab> : null}
      </TabList>
      <TabPanel name="overview">Overview content</TabPanel>
      <TabPanel name="details">Details content</TabPanel>
      <TabPanel name="disabled">Disabled content</TabPanel>
      {props.withSuccess ? <TabPanel name="success">Success content</TabPanel> : null}
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

  it("does not switch to disabled tab on click", async () => {
    render(() => <TabsHarness />);
    await fireEvent.click(screen.getByRole("tab", { name: "Disabled" }));
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Disabled content")).toBeNull();
  });

  it("navigates tabs with arrow keys", async () => {
    render(() => <TabsHarness />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();

    await fireEvent.keyDown(overview, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Details content")).toBeInTheDocument();

    const details = screen.getByRole("tab", { name: "Details" });
    await fireEvent.keyDown(details, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to first and last enabled tabs with Home and End", async () => {
    render(() => <TabsHarness />);
    const details = screen.getByRole("tab", { name: "Details" });
    details.focus();

    await fireEvent.keyDown(details, { key: "Home" });
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");

    await fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
  });

  it("skips disabled tab when jumping to last enabled tab", async () => {
    render(() => <TabsHarness />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();

    await fireEvent.keyDown(overview, { key: "End" });
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Disabled" })).toHaveAttribute("aria-selected", "false");
  });

  it("renders success tab styling when active", async () => {
    render(() => <TabsHarness withSuccess />);
    const successTab = screen.getByRole("tab", { name: "Success" });
    await fireEvent.click(successTab);
    expect(successTab.className).toContain("text-primary");
    expect(screen.getByText("Success content")).toBeInTheDocument();
  });

  it("links tabpanel to tab via aria-labelledby", () => {
    render(() => <TabsHarness />);
    const panel = screen.getByRole("tabpanel");
    const tab = screen.getByRole("tab", { name: "Overview" });
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
  });
});
