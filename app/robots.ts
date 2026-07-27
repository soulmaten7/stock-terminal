import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/mypage', '/auth', '/coin'], // /coin=숨긴 준비중 페이지 — 사이트맵서 뺐고 크롤도 차단(STEP 798 §8)
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
