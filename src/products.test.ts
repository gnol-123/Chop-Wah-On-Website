import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { locales } from "~/i18n";
import { products } from "~/products";

const size = (url: string) => fs.statSync("public" + url).size;

describe("products", () => {
  it("every product has text in every locale", () => {
    for (const p of products)
      for (const l of locales) {
        const t = p.text[l];
        expect(t.name).not.toBe("");
        expect(t.short).not.toBe("");
        expect(t.long).not.toBe("");
      }
  });
  it("model files exist", () => {
    for (const p of products) {
      expect(fs.existsSync("public" + p.model.high)).toBe(true);
      expect(fs.existsSync("public" + p.model.low)).toBe(true);
    }
  });
  it("low models are smaller", () => {
    for (const p of products) expect(size(p.model.low)).toBeLessThan(size(p.model.high));
  });
  it("ids are unique", () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
  });
});
