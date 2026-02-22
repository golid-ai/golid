import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Switch } from "./Switch";

describe("Switch", () => {
  test("renders with aria-label", () => {
    render(() => <Switch label="Dark mode" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Dark mode");
  });

  test("has switch role", () => {
    render(() => <Switch label="Toggle" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  test("toggles on click", async () => {
    const onChange = vi.fn();
    render(() => <Switch label="Toggle" onChange={onChange} />);
    await fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
