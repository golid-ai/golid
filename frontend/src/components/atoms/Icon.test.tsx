import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Icon } from "./Icon";

describe("Icon", () => {
  test("renders icon name", () => {
    render(() => <Icon name="home" />);
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  test("has aria-hidden", () => {
    render(() => <Icon name="settings" />);
    const el = screen.getByText("settings");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });
});
