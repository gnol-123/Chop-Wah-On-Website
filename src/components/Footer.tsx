import { type Dict } from "~/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="px-4 py-6 text-center text-sm text-ink-soft">
      <p className="font-bold text-brand">{t.brand}</p>
      <p>{t.footer}</p>
    </footer>
  );
}
