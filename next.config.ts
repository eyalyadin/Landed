import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Temporarily keep ignoreBuildErrors while pages are being wired up.
  // Remove this flag after all pages are connected to real data.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
