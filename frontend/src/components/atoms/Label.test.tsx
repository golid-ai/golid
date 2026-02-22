import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Label } from "./Label";

describe("Label", () => {
  test("renders text", () => {
    render(() => <Label>Email Address</Label>);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  test("renders as label element", () => {
    const { container } = render(() => <Label for="email">Email</Label>);
    const label = container.querySelector("label");
    expect(label).toBeTruthy();
  });
});
