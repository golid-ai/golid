import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

function SingleToggleHarness() {
  const [value, setValue] = createSignal<string | null>("a");
  return (
    <ToggleGroup type="single" value={value()} onChange={setValue} label="View">
      <ToggleGroupItem value="a">List</ToggleGroupItem>
      <ToggleGroupItem value="b">Grid</ToggleGroupItem>
    </ToggleGroup>
  );
}

function MultiToggleHarness() {
  const [value, setValue] = createSignal<string[]>(["x"]);
  return (
    <ToggleGroup type="multiple" value={value()} onChange={setValue as any} label="Filters">
      <ToggleGroupItem value="x">Active</ToggleGroupItem>
      <ToggleGroupItem value="y">Archived</ToggleGroupItem>
    </ToggleGroup>
  );
}

describe("ToggleGroup single", () => {
  it("renders items", () => {
    render(() => <SingleToggleHarness />);
    expect(screen.getByText("List")).toBeInTheDocument();
    expect(screen.getByText("Grid")).toBeInTheDocument();
  });

  it("shows selected state", () => {
    render(() => <SingleToggleHarness />);
    const listBtn = screen.getByText("List").closest("button");
    expect(listBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("switches selection on click", async () => {
    render(() => <SingleToggleHarness />);
    const gridBtn = screen.getByText("Grid").closest("button")!;
    await fireEvent.click(gridBtn);
    expect(gridBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("has accessible group label", () => {
    render(() => <SingleToggleHarness />);
    expect(screen.getByRole("group")).toHaveAttribute("aria-label", "View");
  });
});

describe("ToggleGroup multiple", () => {
  it("allows multiple selections", async () => {
    render(() => <MultiToggleHarness />);
    const archivedBtn = screen.getByText("Archived").closest("button")!;
    await fireEvent.click(archivedBtn);
    expect(archivedBtn).toHaveAttribute("aria-pressed", "true");
    const activeBtn = screen.getByText("Active").closest("button")!;
    expect(activeBtn).toHaveAttribute("aria-pressed", "true");
  });
});
