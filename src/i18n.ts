export const locales = ["km", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "km";

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}

export type Dict = {
  brand: string;
  dragHint: string;
  loading: string;
  sizes: string;
  order: string;
  orderSoon: string;
  back: string;
  products: string;
  footer: string;
  webglFallback: string;
};

export const dict: Record<Locale, Dict> = {
  km: {
    brand: "[placeholder] ជប់វ៉ាអន",
    dragHint: "[placeholder] អូសដើម្បីបង្វិល",
    loading: "[placeholder] កំពុងផ្ទុក",
    sizes: "[placeholder] ទំហំ",
    order: "[placeholder] បញ្ជាទិញ",
    orderSoon: "[placeholder] ឆាប់ៗនេះ",
    back: "[placeholder] ត្រឡប់ក្រោយ",
    products: "[placeholder] ផលិតផល",
    footer: "[placeholder] រក្សាសិទ្ធិគ្រប់យ៉ាង",
    webglFallback: "[placeholder] ឧបករណ៍នេះមិនអាចបង្ហាញ 3D បានទេ",
  },
  en: {
    brand: "[placeholder] Chop Wah On",
    dragHint: "[placeholder] Drag to turn",
    loading: "[placeholder] Loading",
    sizes: "[placeholder] Sizes",
    order: "[placeholder] Order",
    orderSoon: "[placeholder] Coming soon",
    back: "[placeholder] Back",
    products: "[placeholder] Products",
    footer: "[placeholder] All rights reserved",
    webglFallback: "[placeholder] This device can't show 3D",
  },
};
