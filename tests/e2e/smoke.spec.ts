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
  await page.waitForFunction((p) => document.elementFromPoint(p.x, p.y)?.tagName === "CANVAS", { x, y }, { timeout: 45_000 });
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 10 });
  await page.mouse.up();
}

test("turning stops where you let go, away from products", async ({ page }) => {
  test.setTimeout(90_000);
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
  test.setTimeout(90_000); // two drags on a software renderer
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  // Out past the facing threshold (0.6 rad), then back to 0.23 rad off: unfaced, but inside the magnet.
  await drag(page, 172);
  await expect(hero).toHaveAttribute("data-faced", "", LOAD);
  await page.waitForTimeout(1500); // let the smoothed heading settle
  await drag(page, -105);
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
});

// On-screen text
const fullName = (i: number, lang: "km" | "en") => products[i]!.text[lang].name + (products[i]!.text[lang].nameEmphasis ?? "");

for (const lang of ["km", "en"] as const) {
  test(`callout shows product name and text (${lang})`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const hero = page.getByTestId("hero");
    await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
    await expect(page.getByTestId("callout")).toContainText(fullName(0, lang), LOAD);
    await expect(page.getByTestId("callout-left")).toContainText(products[0]!.text[lang].short);
  });
}

test("callout follows the faced product", async ({ page }) => {
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  const callout = page.getByTestId("callout");
  const left = page.getByTestId("callout-left");
  await expect(callout).toHaveCount(1, LOAD);
  await expect(callout).toContainText(fullName(0, "en"));
  await expect(left).toContainText(products[0]!.text.en.short);
  await page.keyboard.press("ArrowRight");
  await expect(hero).toHaveAttribute("data-faced", "1", LOAD);
  await expect(callout).toContainText(fullName(1, "en"), LOAD);
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

test("dragging from the callout does not open the product", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  const box = (await page.getByTestId("callout").boundingBox(LOAD))!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  // The model loader fades out over the callout.
  await page.waitForFunction((p) => document.elementFromPoint(p.x, p.y)?.closest("[data-testid=callout]"), { x, y }, { timeout: 45_000 });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await expect(hero).toHaveAttribute("data-selected", "");
});

// Long Khmer in both descriptions: name under the drag hint, each panel on screen, under the name and above the footer.
const LONG_KM = "ការពិពណ៌នា ".repeat(12);
for (const [width, height] of [[360, 640], [390, 844], [768, 1024], [1280, 720], [844, 390]] as const) {
  for (const i of [0, 1]) {
    test(`callout fits at ${width}x${height} on product ${i} in km`, async ({ page }) => {
      // Reduced motion: no pop/emerge transforms in flight while measuring.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height });
      await page.goto("/km");
      const hero = page.getByTestId("hero");
      await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
      if (i) {
        await page.keyboard.press("ArrowRight");
        await expect(hero).toHaveAttribute("data-faced", String(i), LOAD);
      }
      await expect(page.getByTestId("callout")).toContainText(fullName(i, "km"), LOAD);
      for (const id of ["callout-left", "callout-right"])
        await page.getByTestId(id).evaluate((el, text) => (el.textContent = text), LONG_KM);
      // The hint sits under the header, or in its row on landscape phones.
      const hint = (await page.getByTestId("drag-hint").boundingBox())!;
      const footer = (await page.locator("footer").boundingBox())!;
      // Html follows the camera a frame behind: measure until it holds.
      await expect(async () => {
        const name = (await page.getByTestId("callout").boundingBox())!;
        expect(name.x).toBeGreaterThanOrEqual(0);
        expect(name.x + name.width).toBeLessThanOrEqual(width);
        expect(name.y).toBeGreaterThanOrEqual(hint.y + hint.height);
        for (const id of ["callout-left", "callout-right"]) {
          const box = (await page.getByTestId(id).boundingBox())!;
          expect(box.x, id).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, id).toBeLessThanOrEqual(width);
          expect(box.y, id).toBeGreaterThanOrEqual(name.y + name.height);
          expect(box.y + box.height, id).toBeLessThanOrEqual(footer.y);
        }
      }).toPass({ timeout: 5_000 });
    });
  }
}

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
