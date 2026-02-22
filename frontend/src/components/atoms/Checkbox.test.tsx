import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  test("renders with aria-label", () => {
    render(() => <Checkbox label="Accept terms" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-label", "Accept terms");
  });

  test("has checkbox role", () => {
    render(() => <Checkbox label="Check me" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  test("toggles on click", async () => {
    const onChange = vi.fn();
    render(() => <Checkbox label="Toggle" onChange={onChange} />);
    await fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
