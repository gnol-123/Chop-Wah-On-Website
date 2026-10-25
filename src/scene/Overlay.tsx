"use client";

import { useState } from "react";

import { ProductName } from "~/components/ProductList";
import { dict, type Locale } from "~/i18n";
import { products } from "~/products";

const panel = "pointer-events-auto bg-white/70 backdrop-blur-md [overflow-wrap:anywhere]";
const chip = "rounded-full border border-brand px-3 py-0.5 text-sm";
/** Invisible 44px-tall hit area around a compact control. */
const hit = "relative before:absolute before:inset-x-0 before:top-1/2 before:h-11 before:-translate-y-1/2 before:content-['']";

type Props = {
  lang: Locale;
  selected: number | null;
  onBack: () => void;
  /** Show the drag hint (until the first drag). */
  hint?: boolean;
};

function Focus({ lang, index, onBack }: { lang: Locale; index: number; onBack: () => void }) {
  const t = dict[lang];
  const p = products[index]!;
  const [size, setSize] = useState(p.sizes[0]);
  return (
    <section
      aria-label={p.text[lang].name + (p.text[lang].nameEmphasis ?? "")}
      className={`${panel} absolute inset-x-0 bottom-0 flex max-h-[45dvh] flex-col gap-3 overflow-y-auto rounded-t-3xl p-5 md:inset-y-0 md:left-auto md:max-h-none md:w-96 md:justify-center md:rounded-none`}
    >
      <h2 className="text-2xl">
        <ProductName t={p.text[lang]} />
      </h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.sizes}>
        {p.sizes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === size}
            onClick={() => setSize(s)}
            className={`${chip} ${hit} ${s === size ? "bg-brand text-white" : "text-brand"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-base">{p.text[lang].long}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          aria-describedby="order-hint"
          className="rounded-full bg-brand px-5 py-2 text-white disabled:opacity-60"
        >
          {t.order}
        </button>
        <span id="order-hint" className="text-sm text-ink-soft">
          {t.orderSoon}
        </span>
      </div>
      <button type="button" onClick={onBack} className="min-h-11 min-w-11 self-start rounded-full px-1 text-brand underline underline-offset-4">
        {t.back}
      </button>
    </section>
  );
}

export function Overlay({ lang, selected, onBack, hint = false }: Props) {
  const t = dict[lang];
  return (
    <div data-testid="overlay" className="pointer-events-none absolute inset-0 z-[5]">
      {hint && selected === null && (
        <p className="absolute inset-x-0 top-20 px-4 text-center text-sm text-ink [overflow-wrap:anywhere]">{t.dragHint}</p>
      )}
      {selected !== null && <Focus key={selected} lang={lang} index={selected} onBack={onBack} />}
    </div>
  );
}
