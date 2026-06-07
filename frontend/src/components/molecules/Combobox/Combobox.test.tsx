import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Combobox } from "./Combobox";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

const items = [
  { label: "React", value: "react" },
  { label: "SolidJS", value: "solid" },
  { label: "Vue", value: "vue" },
];

function ComboboxHarness(props: { initial?: string; disabled?: boolean }) {
  const [value, setValue] = createSignal<string | undefined>(props.initial);
  return (
    <>
      <Combobox
        items={items}
        value={value()}
        onChange={setValue}
        placeholder="Search..."
        disabled={props.disabled}
      />
      <span data-testid="selected-value">{value() ?? "none"}</span>
    </>
  );
}

describe("Combobox", () => {
  it("renders input with placeholder", () => {
    render(() => <ComboboxHarness />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders combobox role", () => {
    render(() => <ComboboxHarness />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("opens listbox on focus and shows all items", async () => {
    render(() => <ComboboxHarness />);
    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeVisible();
      expect(screen.getByRole("option", { name: "React" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "SolidJS" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Vue" })).toBeInTheDocument();
    });
  });

  it("filters items while typing", async () => {
    render(() => <ComboboxHarness />);
    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "sol" } });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "SolidJS" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "React" })).toBeNull();
      expect(screen.queryByRole("option", { name: "Vue" })).toBeNull();
    });
  });

  it("shows empty state when filter matches nothing", async () => {
    render(() => <ComboboxHarness />);
    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: "angular" } });

    await waitFor(() => {
      expect(screen.getByText("No items found.")).toBeInTheDocument();
    });
  });

  it("selects an item on click", async () => {
    render(() => <ComboboxHarness />);
    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    await fireEvent.click(screen.getByRole("option", { name: "Vue" }));

    await waitFor(() => {
      expect(screen.getByTestId("selected-value")).toHaveTextContent("vue");
      expect(input).toHaveValue("Vue");
    });
  });

  it("clears query when menu opens for typeahead", async () => {
    render(() => <ComboboxHarness initial="react" />);
    const input = screen.getByRole("combobox") as HTMLInputElement;
    expect(input.value).toBe("React");

    await fireEvent.focus(input);
    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("selects with keyboard navigation", async () => {
    render(() => <ComboboxHarness />);
    const input = screen.getByRole("combobox");
    input.focus();

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("selected-value")).toHaveTextContent("solid");
      expect(input).toHaveValue("SolidJS");
    });
  });

  it("closes on Escape", async () => {
    render(() => <ComboboxHarness />);
    const input = screen.getByRole("combobox");
    await fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");

    await fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("does not open or accept input when disabled", async () => {
    render(() => <ComboboxHarness disabled />);
    const input = screen.getByRole("combobox");
    expect(input).toBeDisabled();

    await fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});
