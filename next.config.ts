import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    scrollRestoration: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  async redirects() {
    // 옛 버전 잔재 라우트 → 홈 (현재 게이트웨이 미사용 · 옛 디자인/브랜드 노출 차단)
    const legacy = [
      "/scalper", "/longterm",
      "/market", "/room", "/rooms",
      "/news", "/products", "/product",
      "/discussion", "/calendar", "/global",
    ];
    return legacy.flatMap((p) => [
      { source: p, destination: "/", permanent: false },
      { source: `${p}/:path*`, destination: "/", permanent: false },
    ]);
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
