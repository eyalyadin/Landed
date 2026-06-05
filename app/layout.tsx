import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Landed - Property Management',
  description:
    'Professional property management platform for landlords. Manage properties, tenants, payments, and repairs in one place.',
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // lang="he" dir="rtl" for Hebrew; message bubbles use dir="auto" per tenant language
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-background`}
    >
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  )
}
