"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type Sector = { code: string; name: string; index: number; changePercent: number };

// 업종/섹터명 → 이모지 (키워드 매칭)
function sectorEmoji(name: string): string {
  const n = name;
  if (/에너지|석유|정유/.test(n)) return "🛢️";
  if (/은행|금융|증권|보험/.test(n)) return "🏦";
  if (/화학/.test(n)) return "🧪";
  if (/의약|제약|바이오|헬스/.test(n)) return "💊";
  if (/전기전자|반도체|기술|IT/.test(n)) return "🔌";
  if (/철강|금속|소재/.test(n)) return "🏭";
  if (/기계|산업/.test(n)) return "⚙️";
  if (/운수장비|자동차|운송/.test(n)) return "🚗";
  if (/건설/.test(n)) return "🏗️";
  if (/통신|커뮤니/.test(n)) return "📡";
  if (/유통|소비/.test(n)) return "🛒";
  if (/음식료|식품/.test(n)) return "🍱";
  if (/섬유|의복/.test(n)) return "👕";
  if (/전기가스|유틸/.test(n)) return "💡";
  if (/창고|운수/.test(n)) return "🚚";
  if (/부동산/.test(n)) return "🏢";
  if (/서비스/.test(n)) return "🛎️";
  if (/의료정밀|정밀/.test(n)) return "🔬";
  if (/종이|목재/.test(n)) return "🪵";
  return "📊";
}

function Column({ title, asof, sectors, loading }: { title: string; asof: string; sectors: Sector[]; loading: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <h3 className="text-sm font-bold text-unjong-primary">{title}</h3>
        <span className="text-xs text-unjong-muted">{asof}</span>
      </div>
      {loading ? (
        <LoadingState className="py-8" />
      ) : sectors.length === 0 ? (
        <p className="rounded-xl bg-unjong-background px-4 py-6 text-center text-xs text-unjong-muted">데이터 준비 중</p>
      ) : (
        <ul className="space-y-0.5">
          {sectors.slice(0, 9).map((s, i) => {
            const up = s.changePercent >= 0;
            return (
              <li key={s.code} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-unjong-background">
                <span className="w-4 text-center text-sm font-bold tabular-nums text-unjong-muted">{i + 1}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-unjong-background text-lg">{sectorEmoji(s.name)}</span>
                <span className="flex-1 truncate font-medium text-unjong-primary">{s.name}</span>
                <span className={`text-sm font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                  {up ? "+" : ""}{s.changePercent.toFixed(2)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SectorRanking() {
  const [kr, setKr] = useState<Sector[]>([]);
  const [us, setUs] = useState<Sector[]>([]);
  const [loadingKr, setLoadingKr] = useState(true);
  const [loadingUs, setLoadingUs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/kis/sector-rank")).json();
        if (!cancelled) setKr(j.sectors ?? []);
      } finally {
        if (!cancelled) setLoadingKr(false);
      }
    })();
    (async () => {
      try {
        const j = await (await fetch("/api/yahoo/sector-etf")).json();
        if (!cancelled) setUs(j.sectors ?? []);
      } finally {
        if (!cancelled) setLoadingUs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 국내: 집계행(종합·대형주 등) 제외 — 실제 업종만
  const krFiltered = kr.filter((s) => !/종합|대형주|중형주|소형주|제조업/.test(s.name));
  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  return (
    <section className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <Column title="국내" asof={`${today} 기준`} sectors={krFiltered} loading={loadingKr} />
        <Column title="해외" asof="미국 섹터 ETF" sectors={us} loading={loadingUs} />
      </div>
      <p className="mt-3 px-1 text-[11px] text-unjong-muted">국내=KRX 업종 · 해외=미국 SPDR 섹터 ETF 기준 (토스 테마분류와 다름)</p>
    </section>
  );
}
