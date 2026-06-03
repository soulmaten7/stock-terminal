import { ShieldCheck } from "lucide-react";

export default function HomeBannerSlot({ fssCount }: { fssCount: number | null }) {
  return (
    <div className="rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-lg font-bold text-unjong-primary">투자상품에 속지 않게 돕는 곳</h1>
        <p className="text-sm text-unjong-muted mt-0.5">
          정확한 정보 + 솔직한 토론 + 검증된 신뢰 — 주식·상품·리딩방을 한곳에서 교차검증하세요.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-unjong-background px-4 py-2.5 flex-shrink-0">
        <ShieldCheck size={18} className="text-unjong-accent" />
        <div className="leading-tight">
          <p className="text-xs text-unjong-muted">금감원 신고업체 자동 대조</p>
          <p className="text-sm font-bold text-unjong-primary">
            {fssCount !== null ? `${fssCount.toLocaleString()}개 업체` : "대조 중…"}
          </p>
        </div>
      </div>
    </div>
  );
}
