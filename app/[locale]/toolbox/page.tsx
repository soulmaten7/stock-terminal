import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

// next-intl의 redirect는 locale이 필수(로케일 유지) — /en/toolbox → /en, /toolbox → /
export default async function ToolboxRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/", locale });
}
