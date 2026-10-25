import { expect, test } from "@playwright/test";

test("root redirects to km", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/km$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "km");
});

test("en works", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("switch goes to en", async ({ page }) => {
  await page.goto("/km");
  await page.getByRole("link", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en$/);
});

test("unknown locale 404s", async ({ page }) => {
  const res = await page.goto("/fr");
  expect(res?.status()).toBe(404);
});

test("canvas renders", async ({ page }) => {
  await page.goto("/km");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
});
