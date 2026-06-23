import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app';
  const now = new Date();
  const routes: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1, freq: 'daily' },
    { path: '/coin', priority: 0.6, freq: 'weekly' },
    { path: '/about', priority: 0.5, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'monthly' },
    { path: '/privacy', priority: 0.3, freq: 'monthly' },
  ];
  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
