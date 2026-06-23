import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/mypage', '/auth'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
