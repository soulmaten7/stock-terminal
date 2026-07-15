import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessHub from "@/components/business/BusinessHub";
import { getLocale, getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "Advisory registration · management" : "리딩방 등록·관리 — 트릴리언" };
}

export default async function BusinessPage() {
  const t = await getTranslations('Business');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/auth/login", locale });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">{t('title')}</h1>
      <p className="mb-6 text-sm leading-relaxed text-unjong-muted">
        {t('desc')}
      </p>
      <BusinessHub />
    </div>
  );
}
