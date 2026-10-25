import type { Locale } from "~/i18n";

export type ProductText = { name: string; short: string; long: string };
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
    displayScale: 4,
    sizes: ["25ml", "46ml"],
    text: {
      km: { name: "ប្រេងក្រពើ", ...ph.km },
      en: { name: "Crocodile Oil", ...ph.en },
    },
  },
  {
    id: "miracle-lady",
    model: { high: "/models/miracle-lady-cream-jar.glb", low: "/models/miracle-lady-cream-jar.low.glb" },
    displayScale: 6,
    sizes: ["3g", "30g"],
    text: {
      km: { name: "គ្រីមគុជខ្យង", ...ph.km },
      en: { name: "Miracle Lady Cream", ...ph.en },
    },
  },
];
