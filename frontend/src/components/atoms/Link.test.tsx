import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Link } from "./Link";

describe("Link", () => {
  test("renders as anchor", () => {
    render(() => <Link href="/about">About</Link>);
    const link = screen.getByText("About");
    expect(link.tagName).toBe("A");
  });

  test("applies href", () => {
    render(() => <Link href="https://example.com">External</Link>);
    const link = screen.getByText("External");
    expect(link.getAttribute("href")).toBe("https://example.com");
  });
});
