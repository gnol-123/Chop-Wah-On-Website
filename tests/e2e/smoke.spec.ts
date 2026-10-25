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

// Movement. Hero mirrors its state onto data-* attributes, so these don't depend on WebGL picking.
const LOAD = { timeout: 15_000 };

test("faces first product on load", async ({ page }) => {
  await page.goto("/km");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
});

test("arrow turns to next product", async ({ page }) => {
  await page.goto("/km");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await page.keyboard.press("ArrowRight");
  await expect(hero).toHaveAttribute("data-faced", "1");
});

test("enter opens and escape closes", async ({ page }) => {
  await page.goto("/km");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-selected", "0");
  await expect(page).toHaveURL(/\/km#crocodile-oil$/);
  await page.keyboard.press("Escape");
  await expect(hero).toHaveAttribute("data-selected", "");
  await expect(page).toHaveURL(/\/km$/);
});

test("back button closes product view", async ({ page }) => {
  await page.goto("/km");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-selected", "0");
  await page.goBack();
  await expect(page).toHaveURL(/\/km$/);
  await expect(hero).toHaveAttribute("data-selected", "");
});

test("reduced motion disables transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/km");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-reduced-motion", "true", LOAD);
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await page.keyboard.press("ArrowRight");
  await expect(hero).toHaveAttribute("data-faced", "1", { timeout: 100 });
});
