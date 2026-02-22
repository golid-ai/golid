import { test, expect } from "@playwright/test";

/**
 * Signup flow E2E tests.
 *
 * Note: Golid allows login immediately after registration. Email verification
 * is tracked via the `email_verified` flag but does not block access.
 * The verification email is sent asynchronously (best-effort).
 *
 * Requires: docker compose up -d (full stack + seeded DB)
 */

test.describe("Signup Flow", () => {
  test("successful registration redirects to dashboard", async ({ page }) => {
    const email = `signup-${Date.now()}@example.com`;

    await page.goto("/signup");
    await page.fill('[placeholder="John"]', "E2E");
    await page.fill('[placeholder="Doe"]', "Test");
    await page.fill('[placeholder="you@example.com"]', email);
    await page.fill('[placeholder="Create a password"]', "password123");
    await page.fill('[placeholder="Confirm your password"]', "password123");

    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5000 });
    await page.click('button[type="submit"]');

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20000 });
  });

  test("duplicate email shows error", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('[placeholder="John"]', "Dupe");
    await page.fill('[placeholder="Doe"]', "Test");
    await page.fill('[placeholder="you@example.com"]', "user@example.com");
    await page.fill('[placeholder="Create a password"]', "password123");
    await page.fill('[placeholder="Confirm your password"]', "password123");

    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5000 });
    await page.click('button[type="submit"]');

    await expect(page.getByText(/already registered/i)).toBeVisible({ timeout: 10000 });
  });

  test("password mismatch disables submit button", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('[placeholder="John"]', "Mismatch");
    await page.fill('[placeholder="Doe"]', "Test");
    await page.fill('[placeholder="you@example.com"]', `mismatch-${Date.now()}@example.com`);
    await page.fill('[placeholder="Create a password"]', "password123");
    await page.fill('[placeholder="Confirm your password"]', "differentpassword");

    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test("signup page has all required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('[placeholder="John"]')).toBeVisible();
    await expect(page.locator('[placeholder="Doe"]')).toBeVisible();
    await expect(page.locator('[placeholder="you@example.com"]')).toBeVisible();
    await expect(page.locator('[placeholder="Create a password"]')).toBeVisible();
    await expect(page.locator('[placeholder="Confirm your password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
