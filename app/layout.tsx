import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
