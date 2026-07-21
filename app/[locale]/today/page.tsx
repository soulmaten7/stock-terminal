import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

// 오늘 콘텐츠가 루트('/')로 이동(STEP 767b 필드 대전환) — 기존 /today 링크 보호.
// next-intl의 redirect는 locale이 필수(로케일 유지) — /en/today → /en, /today → /
export default async function TodayRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/", locale });
}
