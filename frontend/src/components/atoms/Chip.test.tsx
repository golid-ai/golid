import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Chip } from "./Chip";

describe("Chip", () => {
  test("renders text", () => {
    render(() => <Chip>Active</Chip>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  test("fires onClick when clickable", async () => {
    const onClick = vi.fn();
    render(() => <Chip clickable onClick={onClick}>Click me</Chip>);
    await fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalled();
  });

  test("renders as button when clickable", () => {
    render(() => <Chip clickable>Tag</Chip>);
    const el = screen.getByText("Tag");
    expect(el.tagName).toBe("BUTTON");
  });
});
