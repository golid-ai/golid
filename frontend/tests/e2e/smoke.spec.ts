import { test, expect } from "@playwright/test";

/**
 * Full-stack smoke test — proves the entire stack works:
 * Go API + PostgreSQL + SolidJS + auth flow + SSR.
 *
 * Requires: docker compose up -d (full stack + seeded DB)
 * Run: cd frontend && npx playwright test tests/e2e/smoke.spec.ts
 */

test("register -> login -> dashboard -> settings -> logout", async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`;
  const password = "password123";

  // Register
  await page.goto("/signup");
  await page.fill('[placeholder="John"]', "Smoke");
  await page.fill('[placeholder="Doe"]', "Test");
  await page.fill('[placeholder="you@example.com"]', email);
  await page.fill('[placeholder="Create a password"]', password);
  await page.fill('[placeholder="Confirm your password"]', password);

  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5000 });
  await page.click('button[type="submit"]');
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20000 });

  // Dashboard shows welcome with user's first name
  await expect(page.getByText("Welcome, Smoke")).toBeVisible();

  // Navigate to settings
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#email")).toHaveValue(email);

  // Update profile
  const firstNameInput = page.locator("#first_name");
  await firstNameInput.clear();
  await firstNameInput.fill("Updated");
  await page.click("text=Save Changes");
  await page.waitForTimeout(1000);

  // Logout
  const logoutBtn = page.getByRole("button", { name: /logout/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
  await expect(page.getByRole("link", { name: /get started/i })).toBeVisible({ timeout: 5000 });

  // Re-login with the new account
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });

  // Verify profile update persisted
  await expect(page.getByText("Welcome, Updated")).toBeVisible();
});
