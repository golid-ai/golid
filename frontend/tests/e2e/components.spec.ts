import { test, expect } from "@playwright/test";

/**
 * Component showcase smoke tests — requires dev_seed.sql applied and full stack running.
 * Logs in as admin (components page is admin-only), navigates to /components,
 * and verifies each section renders without JS errors.
 *
 * Run manually:
 *   docker compose up -d
 *   cd frontend && npx playwright test tests/e2e/components.spec.ts
 */

test.describe("Component Showcase", () => {
  test("renders all sections without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });

    await page.goto("/components");
    await expect(page.getByRole("heading", { name: "Components" })).toBeVisible({ timeout: 10000 });

    const sections = ["Colors", "Types", "Icons", "Buttons", "Inputs"];
    for (const section of sections) {
      const tab = page.getByRole("button", { name: section, exact: true });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
      }
    }

    expect(errors).toEqual([]);
  });

  test("redirects non-admin users away from components page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "user@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });

    await page.goto("/components");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
  });
});
