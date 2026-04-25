import type { NextConfig } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-05200337-6681-4db4-9e64-b8ae99325756.space.z.ai",
    "*.space.z.ai",
  ],

  // Image Optimization with CDN Support
  images: {
    path: CDN_URL ? `${CDN_URL}/_next/image` : undefined,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },

  // CDN & Caching Headers
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        source: '/sdk/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=1800' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=1800' },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=1800' },
        ],
      },
      // Global security headers
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Powered-By', value: 'ZarinGold v3.0' },
        ],
      },
    ];
  },

  // CDN Rewrites for production
  async rewrites() {
    const rewrites: Array<{ source: string; destination: string }> = [];
    if (CDN_URL && process.env.NODE_ENV === 'production') {
      rewrites.push({
        source: '/fonts/:path*',
        destination: `${CDN_URL}/fonts/:path*`,
      });
    }
    return rewrites;
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {},

  // Server external packages - don't bundle on client
  serverExternalPackages: ['ioredis'],
};

export default nextConfig;
