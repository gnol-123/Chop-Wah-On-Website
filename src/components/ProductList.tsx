import { dict, type Locale } from "~/i18n";
import { products, type ProductText } from "~/products";

/** Thin grey word plus bold blue word. */
export function ProductName({ t }: { t: ProductText }) {
  return (
    <>
      <span className="font-light text-ink">{t.name}</span>
      {t.nameEmphasis && <span className="font-bold text-brand">{t.nameEmphasis}</span>}
    </>
  );
}

/** Plain list for screen readers and search engines; shown when 3D can't run. */
export function ProductList({ lang, visible }: { lang: Locale; visible: boolean }) {
  const t = dict[lang];
  return (
    <section
      data-testid="product-list"
      data-visible={String(visible)}
      className={visible ? "absolute inset-0 z-[5] overflow-y-auto px-4 pb-8 pt-20 [overflow-wrap:anywhere]" : "sr-only"}
    >
      {visible && <p className="mb-4 text-sm text-ink">{t.webglFallback}</p>}
      <h2 className="mb-2 text-xl font-bold text-brand">{t.products}</h2>
      <ul className="space-y-4">
        {products.map((p) => (
          <li key={p.id} className="rounded-2xl bg-white/60 p-4 backdrop-blur">
            <h3 className="text-lg">
              <ProductName t={p.text[lang]} />
            </h3>
            <p className="text-sm">{p.sizes.join(" · ")}</p>
            <p className="text-sm">{p.text[lang].long}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
