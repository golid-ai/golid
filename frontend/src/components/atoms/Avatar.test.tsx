import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  test("renders initials fallback when no src", () => {
    render(() => <Avatar alt="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  test("renders single initial for single name", () => {
    render(() => <Avatar alt="Jane" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });
});
