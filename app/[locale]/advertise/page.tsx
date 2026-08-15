import type { Metadata } from "next";
import AdInquiryForm from "@/components/advertise/AdInquiryForm";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Advertising · Inquiries" : "광고 안내·문의" };
}

const RULES = ["rule1", "rule3", "rule4"];

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const t = await getTranslations('Advertise');
  const rules = RULES;
  const validSlots = ["broker", "feed", "other"];
  const sp = await searchParams;
  const slot = validSlots.includes(sp.slot ?? "") ? (sp.slot as string) : "other";
  return (
    <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">{t('title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">{t('lead')}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          {/* STEP 795 §11: 구 광고 상품(종목 리스트·정보 피드·리딩방 슬롯)은 현행 5면에 없는 파킹 지면이라
              "판매 중" 카드를 내리고 "지면 준비 중 — 문의는 받습니다"로 축소(신뢰 리스크 제거). 문의 폼은 유지. */}
          <h2 className="mb-3 text-sm font-bold text-unjong-primary">{t('slotsHeading')}</h2>
          <div className="rounded-xl border border-unjong-border bg-unjong-surface p-4">
            <p className="text-sm leading-relaxed text-unjong-muted">{t('slotsPreparing')}</p>
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-unjong-primary">{t('rulesHeading')}</h2>
          <ul className="space-y-2 rounded-xl border border-unjong-border bg-unjong-background p-4">
            {rules.map((r, i) => (
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
