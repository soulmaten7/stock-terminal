import type { Metadata } from "next";
import AdInquiryForm from "@/components/advertise/AdInquiryForm";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Advertising · Inquiries" : "광고 안내·문의" };
}

// 모듈 상수 → 값=ko.json 키. 렌더에서 t()로 해석.
const SLOTS = [
  { key: "broker", title: "slot.brokerTitle", where: "slot.brokerWhere", desc: "slot.brokerDesc" },
  { key: "room", title: "slot.roomTitle", where: "slot.roomWhere", desc: "slot.roomDesc" },
  { key: "feed", title: "slot.feedTitle", where: "slot.feedWhere", desc: "slot.feedDesc" },
];

const RULES = ["rule1", "rule2", "rule3", "rule4"];

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const t = await getTranslations('Advertise');
  const sp = await searchParams;
  const slot = ["broker", "room", "feed", "other"].includes(sp.slot ?? "") ? (sp.slot as string) : "other";
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">{t('title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">{t('lead')}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold text-unjong-primary">{t('slotsHeading')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SLOTS.map((s) => (
              <div key={s.key} className="rounded-xl border border-unjong-border bg-unjong-surface p-4">
                <p className="text-sm font-bold text-unjong-primary">{t(s.title)}</p>
                <p className="mt-0.5 text-[11px] font-medium text-unjong-accent">{t(s.where)}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{t(s.desc)}</p>
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-unjong-primary">{t('rulesHeading')}</h2>
          <ul className="space-y-2 rounded-xl border border-unjong-border bg-unjong-background p-4">
            {RULES.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-unjong-primary">
                <span className="shrink-0 text-unjong-accent">•</span><span>{t(r)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-unjong-primary">{t('inquiryHeading')}</h2>
          <AdInquiryForm defaultSlot={slot} />
        </div>
      </div>
    </div>
  );
}
