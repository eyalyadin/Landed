import type { Metadata } from "next";
import { Press_Start_2P, VT323, Rubik } from "next/font/google";
import "./globals.css";

// Latin pixel heading font — Press Start 2P
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Retro number/date/currency font — VT323
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt",
  display: "swap",
});

// Hebrew + Latin body font — Rubik (bilingual, bold for chunky pixel feel)
const rubik = Rubik({
  weight: ["400", "600", "700"],
  subsets: ["latin", "hebrew"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ניהול שוכרים | Tenant Manager",
  description:
    "כלי לניהול תקשורת, תחזוקה ושכר דירה מול שוכרים — Landlord ↔ Tenant Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`h-full antialiased ${pressStart.variable} ${vt323.variable} ${rubik.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
