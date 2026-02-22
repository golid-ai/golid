import { test, expect } from "@playwright/test";

/**
 * Password reset flow E2E tests.
 * Tests the forgot-password page UX (email sent message).
 * Full reset flow requires email infrastructure, so we test the UI states.
 *
 * Requires: docker compose up -d (full stack + seeded DB)
 */

test.describe("Password Reset Flow", () => {
  test("forgot password page shows form and accepts email", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot/i })).toBeVisible();

    await page.fill('input[type="email"]', "user@example.com");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/reset link/i)).toBeVisible({ timeout: 5000 });
  });

  test("forgot password page shows success for non-existent email (enumeration prevention)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', "nonexistent@example.com");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/reset link/i)).toBeVisible({ timeout: 5000 });
  });

  test("reset password page with no token shows error state", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /invalid reset link/i })).toBeVisible({ timeout: 5000 });
  });

  test("reset password page with invalid token shows expired state", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token-123");
    await expect(page.getByRole("heading", { name: /expired/i })).toBeVisible({ timeout: 5000 });
  });

  test("forgot password link exists on login page", async ({ page }) => {
    await page.goto("/login");
    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await page.waitForURL("**/forgot-password");
  });
});
