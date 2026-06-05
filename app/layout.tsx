import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import { getDict, dirFor } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { I18nProvider } from "@/app/i18n-context";
import LanguageToggle from "@/app/components/LanguageToggle";
import "./globals.css";

// Latin / English font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Hebrew + Latin fallback font
const heebo = Heebo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDict(locale);
  return {
    title: t.app.title,
    description: t.app.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dict = getDict(locale);

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`h-full ${inter.variable} ${heebo.variable}`}
    >
      <body className="flex min-h-full flex-col antialiased" style={{ background: "var(--bg)" }}>
        <I18nProvider locale={locale} dict={dict}>
          {/* Slim top bar — language toggle always visible */}
          <div
            className="flex items-center justify-end gap-3 px-4 py-2"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <LanguageToggle />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
