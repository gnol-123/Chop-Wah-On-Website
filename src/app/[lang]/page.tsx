import { notFound } from "next/navigation";

import { Footer } from "~/components/Footer";
import { dict, isLocale, locales } from "~/i18n";
import { Hero } from "~/scene/Hero";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    // Footer in flow under the hero, so the canvas (and everything docked to it) ends above it.
    <main className="flex h-dvh flex-col">
      <h1 className="sr-only">{dict[lang].brand}</h1>
      <div className="relative min-h-0 flex-1">
        <Hero lang={lang} />
      </div>
      <Footer t={dict[lang]} />
    </main>
  );
}
