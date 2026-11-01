import { type Dict } from "~/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="px-4 py-1 text-center text-xs text-ink-soft [overflow-wrap:anywhere]">
      {t.brand} · {t.footer}
    </footer>
  );
}
