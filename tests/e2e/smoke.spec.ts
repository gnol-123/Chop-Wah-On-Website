import { expect, test } from "@playwright/test";

test("home responds", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBeLessThan(400);
});
