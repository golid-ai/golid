import { test, expect } from "@playwright/test";

/**
 * Settings page E2E tests — profile updates, password changes.
 * Requires: docker compose up -d (full stack + seeded DB)
 */

async function loginAsSeededUser(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "user@example.com");
  await page.fill('input[type="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });
}

test.describe("Settings Page", () => {
  test("update profile fields and verify persistence", async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });

    const firstNameInput = page.locator("#first_name");
    const originalValue = await firstNameInput.inputValue();

    await firstNameInput.clear();
    await firstNameInput.fill("E2EUpdated");
    await page.click("text=Save Changes");

    await page.waitForTimeout(1500);

    await page.reload();
    await expect(page.locator("#first_name")).toHaveValue("E2EUpdated");

    // Restore original value
    await page.locator("#first_name").clear();
    await page.locator("#first_name").fill(originalValue || "Test");
    await page.click("text=Save Changes");
    await page.waitForTimeout(1000);
  });

  test("settings page shows user email", async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#email")).toHaveValue("user@example.com");
  });

  test("change password with wrong current password shows error", async ({ page }) => {
    await loginAsSeededUser(page);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });

    await page.fill("#current_password", "wrongpassword");
    await page.fill("#new_password", "newpassword123");
    await page.fill("#confirm_password", "newpassword123");
    await page.getByRole("button", { name: "Change Password" }).click();

    await expect(page.locator(".text-danger")).toBeVisible({ timeout: 10000 });
  });
});
