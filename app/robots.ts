import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 🔴 STEP 830 §9: `/en/*` 로케일 접두 경로도 함께 차단 — en 전면 패리티라 /en/mypage·/en/admin·/en/auth가 크롤 가능했다.
      disallow: [
        '/admin', '/mypage', '/auth', '/coin', // /coin=숨긴 준비중 페이지 — 사이트맵서 뺐고 크롤도 차단(STEP 798 §8)
        '/en/admin', '/en/mypage', '/en/auth', '/en/coin',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
