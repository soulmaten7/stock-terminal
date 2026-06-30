import type { Metadata } from "next";
import AdInquiryForm from "@/components/advertise/AdInquiryForm";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "광고 안내·문의" };

const SLOTS = [
  { key: "broker", title: "증권사 슬롯", where: "종목·상품 탭 · 종목 표/증권사 리스트 10행마다", desc: "주식 정보를 찾는 사용자에게 계좌개설·이벤트를 노출합니다." },
  { key: "room", title: "리딩방 슬롯", where: "리딩방·검증 탭 · 리스트 상단/중간", desc: "유사투자자문 신고 + 운영자 인증을 마친 곳만 상단 노출이 가능합니다." },
  { key: "feed", title: "콘텐츠 피드 슬롯", where: "뉴스·공시·리포트·유튜브 등 정보 리스트 상단/중간", desc: "정보를 탐색하는 사용자에게 브랜드·콘텐츠를 자연스럽게 노출합니다." },
];

const RULES = [
  "광고는 '노출(순위)'일 뿐, 사실·안전·수익을 보증하지 않습니다.",
  "유사투자자문 신고 + 운영자 인증을 마친 곳만 유료 광고가 가능합니다.",
  "모든 광고에는 '광고' 라벨이 항상 표시됩니다.",
  "콘텐츠 가이드라인(과장 수익률·허위 표시 금지)을 통과해야 합니다.",
];

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const sp = await searchParams;
  const slot = ["broker", "room", "feed", "other"].includes(sp.slot ?? "") ? (sp.slot as string) : "other";
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">트릴리언 광고 안내</h1>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">흩어진 금융 정보를 한눈에 찾는 사용자에게, 가장 관련 높은 자리에서 정확히 노출하세요.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold text-unjong-primary">광고 가능 위치</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SLOTS.map((s) => (
              <div key={s.key} className="rounded-xl border border-unjong-border bg-unjong-surface p-4">
                <p className="text-sm font-bold text-unjong-primary">{s.title}</p>
                <p className="mt-0.5 text-[11px] font-medium text-unjong-accent">{s.where}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{s.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-unjong-primary">광고 원칙</h2>
          <ul className="space-y-2 rounded-xl border border-unjong-border bg-unjong-background p-4">
            {RULES.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-unjong-primary">
                <span className="shrink-0 text-unjong-accent">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-unjong-primary">광고 문의</h2>
          <AdInquiryForm defaultSlot={slot} />
        </div>
      </div>
    </div>
  );
}
