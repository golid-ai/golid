import { test, expect } from "vitest";
import { render } from "@solidjs/testing-library";
import axe from "axe-core";
import { DestructiveModal } from "./DestructiveModal";

test("has no a11y violations", async () => {
  const { container } = render(() => (
    <DestructiveModal
      open={true}
      onOpenChange={() => {}}
      onConfirm={() => {}}
      title="Delete?"
      message="Are you sure?"
    />
  ));
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
});
