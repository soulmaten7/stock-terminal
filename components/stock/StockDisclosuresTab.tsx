"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Disclosure = {
  rcept_no?: string;
  report_name: string;
  disclosure_type: string;
  filer_name?: string;
  published_at: string | null;
  source_url: string;
};

// 주의가 필요한 공시 유형 (운종 신뢰 — 위험 신호 강조)
const CAUTION = new Set(["유상증자", "CB발행", "대주주변동", "합병분할"]);

function badgeClass(type: string): string {
  if (CAUTION.has(type)) return "bg-[#3182F6]/10 text-[#3182F6]";       // 주의 = 레드
  if (type === "정기보고" || type === "감사·재무") return "bg-blue-50 text-blue-700";
  if (type === "IR" || type === "자사주" || type === "무상증자") return "bg-[#F04452]/10 text-[#F04452]";
  return "bg-slate-100 text-unjong-muted";
}

export default function StockDisclosuresTab({ symbol }: { symbol: string }) {
  const isKr = /^\d{6}$/.test(symbol);
  const [items, setItems] = useState<Disclosure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = isKr
          ? `/api/stocks/disclosures?symbol=${symbol}&months=6&limit=50`
          : `/api/stocks/disclosures?symbol=${symbol}`;
        const r = await fetch(url);
        const j = await r.json();
        if (cancelled) return;
        setItems(j.items || []);
        if ((!j.items || j.items.length === 0) && j.error) setError(j.error);
      } catch {
        if (!cancelled) setError("공시 조회 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, isKr]);

  if (loading) return <LoadingState title="공시 로딩 중..." />;
  if (items.length === 0) {
    return <EmptyState icon="📄" title="공시 내역 없음" description={error ?? "최근 6개월 신규 공시가 없습니다."} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-unjong-primary">
          공시 <span className="text-xs text-unjong-muted font-normal">{isKr ? "출처 DART · 최근 6개월" : "출처 SEC EDGAR"}</span>
        </h3>
        <span className="text-xs text-unjong-muted">총 {items.length}건</span>
      </div>
      <ul className="space-y-2">
        {items.map((d, i) => (
          <li key={d.rcept_no ?? i}>
            <a href={d.source_url} target="_blank" rel="noopener noreferrer"
              className="block bg-unjong-background rounded-lg p-3 hover:border-unjong-accent border border-transparent transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${badgeClass(d.disclosure_type)}`}>
                  {d.disclosure_type}
                </span>
                {d.published_at && (
                  <span className="text-xs text-unjong-muted">
                    {new Date(d.published_at).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })}
                  </span>
                )}
                {d.filer_name && <span className="text-xs text-unjong-muted truncate">· {d.filer_name}</span>}
              </div>
              <p className="text-sm text-unjong-primary leading-normal flex items-start gap-1">
                <span className="flex-1">{d.report_name}</span>
                <ExternalLink size={11} className="flex-shrink-0 mt-0.5 text-unjong-muted" />
              </p>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-unjong-muted mt-3">
        ⚠️ 빨강 뱃지(유상증자·CB발행·대주주변동·합병분할)는 주가에 영향이 큰 공시 — 클릭해 원문 확인 권장.
      </p>
    </div>
  );
}
