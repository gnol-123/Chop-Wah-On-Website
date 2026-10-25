import "~/styles/globals.css";

import { type Metadata } from "next";
import { Kantumruy_Pro } from "next/font/google";
import { notFound } from "next/navigation";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { dict, isLocale } from "~/i18n";
import { TRPCReactProvider } from "~/trpc/react";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "700"],
  variable: "--font-kantumruy",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: dict[lang].brand, description: dict[lang].footer };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={kantumruy.variable}>
      <body className="relative min-h-screen">
        <TRPCReactProvider>
          <Header lang={lang} brand={dict[lang].brand} />
          {children}
          <Footer t={dict[lang]} />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
