import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Sentry: NEXT_PUBLIC_SENTRY_DSN 이 있을 때만 래핑(소스맵 업로드 등). 없으면 무동작 → 빌드·런타임 정상.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN, // 소스맵 업로드용(비밀 · Vercel/CI env에만)
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
