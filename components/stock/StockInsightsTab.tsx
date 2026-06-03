"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { formatKRW, formatPct } from "@/lib/format";

type Fin = {
  period: string; periodType: string; year: number;
  revenue: number | null; operatingIncome: number | null; netIncome: number | null;
  opMargin: number | null; netMargin: number | null;
  totalLiabilities: number | null; totalEquity: number | null;
};
type Investor = { date: string; foreignBuy: number; institutionBuy: number; individualBuy: number };
type Sector = { name: string; changePct: number; status: "up" | "down" };

const roe = (f: Fin) => (f.netIncome !== null && f.totalEquity ? (f.netIncome / f.totalEquity) * 100 : null);
const debtRatio = (f: Fin) => (f.totalLiabilities !== null && f.totalEquity ? (f.totalLiabilities / f.totalEquity) * 100 : null);

export default function StockInsightsTab({ symbol }: { symbol: string }) {
  const isKr = /^\d{6}$/.test(symbol);
  const [annual, setAnnual] = useState<Fin[]>([]);
  const [finNote, setFinNote] = useState<string | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [earn, inv, sec] = await Promise.all([
          fetch(`/api/stocks/earnings?symbol=${symbol}`).then((r) => r.json()).catch(() => null),
          isKr ? fetch(`/api/kis/investor?symbol=${symbol}`).then((r) => r.json()).catch(() => null) : null,
          isKr ? fetch(`/api/kis/sector`).then((r) => r.json()).catch(() => null) : null,
        ]);
        if (cancelled) return;
        if (earn) {
          setAnnual((earn.annual || []).slice(-4));
          if ((!earn.annual || earn.annual.length === 0) && earn.fallbackReason) setFinNote(earn.fallbackReason);
        }
        if (inv?.investors) setInvestors(inv.investors.slice(0, 7));
        if (sec?.items) setSectors(sec.items);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [symbol, isKr]);

  if (loading) return <LoadingState title="인사이트 로딩 중..." />;

  return (
    <div className="space-y-6">
      {/* 1) 기업실적분석 */}
      <section>
        <h3 className="text-base font-bold text-unjong-primary mb-3">기업실적분석 <span className="text-xs text-unjong-muted font-normal">연간 · 출처 DART</span></h3>
        {annual.length === 0 ? (
          <EmptyState icon="📊" title="재무 데이터 없음" description={finNote ?? "DART 정기공시 미확인 종목"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                  <th className="text-left py-2">항목</th>
                  {annual.map((f) => <th key={f.period} className="text-right px-2">{f.year}</th>)}
                </tr>
              </thead>
              <tbody>
                {([
                  ["매출액", (f: Fin) => formatKRW(f.revenue)],
                  ["영업이익", (f: Fin) => formatKRW(f.operatingIncome)],
                  ["당기순이익", (f: Fin) => formatKRW(f.netIncome)],
                  ["영업이익률", (f: Fin) => formatPct(f.opMargin)],
                  ["순이익률", (f: Fin) => formatPct(f.netMargin)],
                  ["ROE", (f: Fin) => formatPct(roe(f))],
                  ["부채비율", (f: Fin) => formatPct(debtRatio(f))],
                ] as const).map(([label, fn]) => (
                  <tr key={label} className="border-b border-unjong-border/50">
                    <td className="py-2 text-unjong-muted">{label}</td>
                    {annual.map((f) => <td key={f.period} className="text-right px-2 font-mono text-unjong-primary">{fn(f)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-unjong-muted mt-2">더 깊은 재무 분석은 <a href={`https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?gicode=A${symbol}`} target="_blank" rel="noopener noreferrer" className="text-unjong-accent hover:underline">FnGuide ↗</a></p>
          </div>
        )}
      </section>

      {/* 2) 투자자별 매매동향 (한국) */}
      {isKr && (
        <section>
          <h3 className="text-base font-bold text-unjong-primary mb-3">투자자별 매매동향 <span className="text-xs text-unjong-muted font-normal">일별 순매수(주) · 출처 KIS</span></h3>
          {investors.length === 0 ? <EmptyState title="수급 데이터 없음" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-unjong-muted border-b border-unjong-border">
                <th className="text-left py-1">일자</th><th className="text-right">외국인</th><th className="text-right">기관</th><th className="text-right">개인</th>
              </tr></thead>
              <tbody>
                {investors.map((v, i) => {
                  const cell = (n: number) => <td className={`text-right font-mono ${n > 0 ? "text-[#F04452]" : n < 0 ? "text-[#1AC267]" : "text-unjong-muted"}`}>{n > 0 ? "+" : ""}{n.toLocaleString()}</td>;
                  const d = v.date?.length === 8 ? `${v.date.slice(4, 6)}.${v.date.slice(6, 8)}` : v.date;
                  return <tr key={i} className="border-b border-unjong-border/50"><td className="py-1 text-unjong-muted font-mono text-xs">{d}</td>{cell(v.foreignBuy)}{cell(v.institutionBuy)}{cell(v.individualBuy)}</tr>;
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* 3) 동종업종 등락률 (한국) */}
      {isKr && sectors.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-unjong-primary mb-3">업종 등락률 <span className="text-xs text-unjong-muted font-normal">출처 KIS</span></h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sectors.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg bg-unjong-background px-3 py-2">
                <span className="text-sm text-unjong-primary truncate">{s.name}</span>
                <span className={`text-sm font-semibold ${s.status === "up" ? "text-[#F04452]" : "text-[#1AC267]"}`}>{s.changePct > 0 ? "+" : ""}{s.changePct}%</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
