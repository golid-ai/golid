import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Combobox } from "./Combobox";

const items = [
  { label: "React", value: "react" },
  { label: "SolidJS", value: "solid" },
  { label: "Vue", value: "vue" },
];

describe("Combobox", () => {
  it("renders input with placeholder", () => {
    render(() => <Combobox items={items} placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders combobox role", () => {
    render(() => <Combobox items={items} placeholder="Pick one" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders listbox", () => {
    render(() => <Combobox items={items} />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
