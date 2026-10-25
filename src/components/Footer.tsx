import { type Dict } from "~/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-1 text-center text-xs text-ink-soft [overflow-wrap:anywhere]">
      {t.brand} · {t.footer}
    </footer>
  );
}
