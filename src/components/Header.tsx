import Image from "next/image";

import { type Locale } from "~/i18n";
import { LangSwitch } from "./LangSwitch";

export function Header({ lang, brand }: { lang: Locale; brand: string }) {
  return (
    <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
      <Image src="/logo.png" alt={brand} width={44} height={44} priority />
      <LangSwitch lang={lang} />
    </header>
  );
}
