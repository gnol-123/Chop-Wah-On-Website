import { notFound } from "next/navigation";

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
    <main className="relative h-dvh">
      <h1 className="sr-only">{dict[lang].brand}</h1>
      <Hero lang={lang} />
    </main>
  );
}
