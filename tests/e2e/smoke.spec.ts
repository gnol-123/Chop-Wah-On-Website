import { expect, test, type Page } from "@playwright/test";
import { dict } from "~/i18n";
import { products } from "~/products";

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
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
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
  await expect(hero).toHaveAttribute("data-faced", "1", LOAD);
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

test("escape closes after clicking a size chip", async ({ page }) => {
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-selected", "0");
  await page.getByTestId("overlay").getByRole("button", { name: "46ml" }).click();
  await page.keyboard.press("Escape");
  await expect(hero).toHaveAttribute("data-selected", "");
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

// Free turning
async function drag(page: Page, dx: number) {
  const box = (await page.locator("canvas").boundingBox())!;
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  // The model loader covers the canvas until the models are in.
  await page.waitForFunction((p) => document.elementFromPoint(p.x, p.y)?.tagName === "CANVAS", { x, y }, LOAD);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 10 });
  await page.mouse.up();
}

test("turning stops where you let go, away from products", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await drag(page, 172);
  // Long enough for the old snap-to-nearest to have settled.
  await page.waitForTimeout(3000);
  await expect(hero).toHaveAttribute("data-faced", "");
});

test("letting go near a product settles onto it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  await drag(page, 29);
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
});

// On-screen text
const names = { km: products[0]!.text.km, en: products[0]!.text.en };

for (const lang of ["km", "en"] as const) {
  test(`callout shows product name and text (${lang})`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const hero = page.getByTestId("hero");
    await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
    // Scoped: the sr-only list also holds the names, and 1px elements count as visible.
    await expect(hero.getByText(names[lang].name, { exact: false }).first()).toBeVisible();
    await expect(hero.getByText(names[lang].short)).toBeVisible(LOAD);
  });
}

test("callout follows the faced product", async ({ page }) => {
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  const callout = page.getByTestId("callout");
  const left = page.getByTestId("callout-left");
  await expect(callout).toHaveCount(1, LOAD);
  await expect(left).toContainText(products[0]!.text.en.short);
  await page.keyboard.press("ArrowRight");
  await expect(hero).toHaveAttribute("data-faced", "1", LOAD);
  await expect(left).toContainText(products[1]!.text.en.short);
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-selected", "1");
  await expect(callout).toHaveCount(0);
});

test("tapping callout opens product", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  await page.getByTestId("callout").click();
  await expect(page.getByTestId("hero")).toHaveAttribute("data-selected", "0");
});

test("callout fits at 360px in km", async ({ page }) => {
  // Reduced motion: no pop/emerge transforms in flight while measuring.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/km");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  const header = (await page.locator("header").boundingBox())!;
  for (const id of ["callout", "callout-left", "callout-right"]) {
    await expect(page.getByTestId(id)).toBeVisible(LOAD);
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(box.y + box.height).toBeLessThanOrEqual(740);
  }
});

test("callout does not animate with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  const name = await page.getByTestId("callout").evaluate((e) => getComputedStyle(e).animationName);
  expect(name).toBe("none");
});

test("focus panel has sizes and disabled order", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  await page.keyboard.press("Enter");
  const overlay = page.getByTestId("overlay");
  await expect(overlay.getByRole("button", { name: "25ml" })).toBeVisible();
  await expect(overlay.getByRole("button", { name: "46ml" })).toBeVisible();
  await expect(overlay.getByRole("button", { name: dict.en.order })).toBeDisabled();
  await overlay.getByRole("button", { name: dict.en.back }).click();
  await expect(page.getByTestId("hero")).toHaveAttribute("data-selected", "");
});

test("no horizontal overflow at 360px in km", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/km");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  const fits = () =>
    page.evaluate(() => {
      const e = document.documentElement;
      return e.scrollWidth <= 360 && e.scrollHeight <= innerHeight;
    });
  expect(await fits()).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-selected", "0");
  expect(await fits()).toBe(true);
});

test("model load failure shows product list", async ({ page }) => {
  await page.route("**/*.glb", (r) => r.abort());
  await page.goto("/km");
  const list = page.getByTestId("product-list");
  await expect(list).toHaveAttribute("data-visible", "true", LOAD);
  for (const p of products) await expect(list).toContainText(p.text.km.name);
});
