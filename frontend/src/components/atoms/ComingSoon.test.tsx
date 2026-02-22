import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { ComingSoon } from "./ComingSoon";

describe("ComingSoon", () => {
  test("renders title", () => {
    render(() => <ComingSoon title="New Feature" icon="rocket" />);
    expect(screen.getByText("New Feature")).toBeInTheDocument();
  });

  test("renders description text", () => {
    render(() => <ComingSoon title="Analytics" icon="analytics" />);
    expect(screen.getByText("This section is under development. Check back soon.")).toBeInTheDocument();
  });
});
