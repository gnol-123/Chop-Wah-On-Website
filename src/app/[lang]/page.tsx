import { notFound } from "next/navigation";

import { dict, isLocale, locales } from "~/i18n";

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
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-brand">{dict[lang].brand}</h1>
    </main>
  );
}
