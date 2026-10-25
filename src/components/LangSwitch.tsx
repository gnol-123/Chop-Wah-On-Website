"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales, type Locale } from "~/i18n";

const labels: Record<Locale, string> = { km: "ខ្មែរ", en: "EN" };

export function LangSwitch({ lang }: { lang: Locale }) {
  const rest = (usePathname() ?? "").split("/").slice(2).join("/");
  return (
    <nav className="flex gap-3 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}`}
          aria-current={l === lang ? "true" : undefined}
          className={l === lang ? "font-bold text-brand" : "text-ink-soft"}
        >
          {labels[l]}
        </Link>
      ))}
    </nav>
  );
}
