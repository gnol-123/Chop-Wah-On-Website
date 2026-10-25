import { notFound } from "next/navigation";

import { dict, isLocale, locales } from "~/i18n";
import { ShowroomMount } from "./ShowroomMount";

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
    <main className="relative h-svh">
      <h1 className="sr-only">{dict[lang].brand}</h1>
      <div className="absolute inset-0">
        <ShowroomMount />
      </div>
    </main>
  );
}
