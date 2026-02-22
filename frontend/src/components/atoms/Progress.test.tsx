import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Progress } from "./Progress";

describe("Progress", () => {
  test("renders with progressbar role", () => {
    render(() => <Progress value={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("sets aria-valuenow", () => {
    render(() => <Progress value={75} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("75");
  });

  test("renders indeterminate without value", () => {
    render(() => <Progress value={null} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
