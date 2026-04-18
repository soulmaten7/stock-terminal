import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PartnerLandingClient from '@/components/partners/PartnerLandingClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PartnerLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from('partners')
    .select('slug, name, logo_url, hero_image_url, description, category, cta_text, cta_url, features, country')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!partner) notFound();

  const utm = {
    source: String(sp.utm_source ?? ''),
    medium: String(sp.utm_medium ?? ''),
    campaign: String(sp.utm_campaign ?? ''),
  };

  return <PartnerLandingClient partner={partner} utm={utm} />;
}
