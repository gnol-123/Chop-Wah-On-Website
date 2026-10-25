import type { Locale } from "~/i18n";

/** Full name is `name + nameEmphasis`; the emphasis suffix is set bold blue. */
export type ProductText = { name: string; nameEmphasis?: string; short: string; long: string };
export type Product = {
  id: string;
  model: { high: string; low: string };
  displayScale: number;
  sizes: string[];
  text: Record<Locale, ProductText>;
};

const ph = {
  km: { short: "[placeholder] ការពិពណ៌នាខ្លី", long: "[placeholder] ការពិពណ៌នាវែង" },
  en: { short: "[placeholder] Short description", long: "[placeholder] Long description" },
};

export const products: Product[] = [
  {
    id: "crocodile-oil",
    model: { high: "/models/crocodile-oil-46ml.glb", low: "/models/crocodile-oil-46ml.low.glb" },
    displayScale: 8.4,
    sizes: ["25ml", "46ml"],
    text: {
      km: { name: "ប្រេង", nameEmphasis: "ក្រពើ", ...ph.km },
      en: { name: "Crocodile ", nameEmphasis: "Oil", ...ph.en },
    },
  },
  {
    id: "miracle-lady",
    model: { high: "/models/miracle-lady-cream-jar.glb", low: "/models/miracle-lady-cream-jar.low.glb" },
    displayScale: 14,
    sizes: ["3g", "30g"],
    text: {
      km: { name: "គ្រីម", nameEmphasis: "គុជខ្យង", ...ph.km },
      en: { name: "Miracle Lady ", nameEmphasis: "Cream", ...ph.en },
    },
  },
];
