<!-- 2026-06-07 -->
# STEP 197 — 투자상품 탭 ① 인기 ETF (거래대금 순)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_197_COMMAND.md 파일 내용대로 실행해줘`

## 목표
랭킹 탭에 **'투자상품'** 추가(국내 투자자 동향 오른쪽) → 1차로 **인기 ETF(거래대금 순)**.
- 데이터 = 기존 KIS 거래대금 랭킹(`/api/kis/volume-rank?sort=amount`)을 **ETF 이름으로 필터**(KODEX·TIGER·KBSTAR…). 새 소스 없이 바로 됨.
- 표: 순위·종목명(로고)·현재가·등락%(한국식 색)·거래대금. 레버리지/인버스 ETF는 STEP 183 배지 그대로.
- 다음(STEP 198)에서 수익순(1·3·6·12개월) + 펀드(준비중) 하위구조 추가.

## 전제 상태
- HEAD: STEP 196 적용된 상태
- 변경: `components/home-v6/HomeEtfRanking.tsx`(신규) + `components/home-v6/HomeRankingTabs.tsx`(탭 추가)

---

## 작업 1/2 — 신규 `components/home-v6/HomeEtfRanking.tsx` (파일 생성)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Row = { symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

// ETF 식별 — 주요 운용사 브랜드 접두
const ETF_RE = /^(KODEX|TIGER|KBSTAR|RISE|ARIRANG|PLUS|ACE|KINDEX|SOL|HANARO|KOSEF|TIMEFOLIO|WOORI|KCGI|BNK|파워|TREX|FOCUS|히어로즈|네비게이터|마이티|WON|KIWOOM)/i;

function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
}

export default function HomeEtfRanking() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch("/api/kis/volume-rank?market=all&sort=amount&limit=100")).json();
        const raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
        const list: Row[] = raw
          .map((s) => ({
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
          }))
          .filter((r) => r.name && ETF_RE.test(r.name))
          .slice(0, 15);
        if (!cancelled) setRows(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex items-baseline gap-2 border-b border-unjong-border px-4 py-3">
        <h3 className="text-sm font-bold text-unjong-primary">인기 ETF</h3>
        <span className="text-xs text-unjong-muted">거래대금 순 · KRX (실시간 아님)</span>
      </div>
      {loading ? (
        <LoadingState className="py-10" />
      ) : rows.length === 0 ? (
        <EmptyState title="ETF 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-unjong-border text-xs text-unjong-muted">
              <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
              <th className="px-4 py-2.5 text-left font-medium">종목명</th>
              <th className="px-4 py-2.5 text-right font-medium">현재가</th>
              <th className="px-4 py-2.5 text-right font-medium">등락률</th>
              <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">거래대금</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = r.changePercent >= 0;
              return (
                <tr
                  key={r.symbol}
                  onClick={() => router.push(`/stock/${r.symbol}`)}
                  className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                >
                  <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <StockLogo code={r.symbol} name={r.name} size={28} />
                      <span className="font-medium text-unjong-primary">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.priceText}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                    {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-unjong-muted md:table-cell">{fmtAmount(r.tradeAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

## 작업 2/2 — `components/home-v6/HomeRankingTabs.tsx` (탭 추가)

**찾기:**
```tsx
import SectorRanking from "./SectorRanking";
import InvestorTrend from "./InvestorTrend";
```
**바꾸기:**
```tsx
import SectorRanking from "./SectorRanking";
import InvestorTrend from "./InvestorTrend";
import HomeEtfRanking from "./HomeEtfRanking";
```

**찾기:**
```tsx
  { key: "investor", label: "국내 투자자 동향" },
] as const;
```
**바꾸기:**
```tsx
  { key: "investor", label: "국내 투자자 동향" },
  { key: "etf", label: "투자상품" },
] as const;
```

**찾기:**
```tsx
      {tab === "investor" && <InvestorTrend />}
```
**바꾸기:**
```tsx
      {tab === "investor" && <InvestorTrend />}
      {tab === "etf" && <HomeEtfRanking />}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeEtfRanking.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 투자상품 탭 — 인기 ETF(거래대금 순) 랭킹 + 탭 추가 (STEP 197)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 랭킹 탭에 **'투자상품'** 추가(국내 투자자 동향 오른쪽), 클릭 시 **인기 ETF** 리스트
- [ ] ETF만 나오는지(KODEX·TIGER 등), 일반 주식 안 섞이는지 · 등락% 한국식 색
- [ ] 레버리지/인버스 ETF는 2x/3x/인버스 배지(STEP 183)
- [ ] 개수 확인: `curl -s "localhost:3333/api/kis/volume-rank?market=all&sort=amount&limit=100" | grep -o '"name"' | wc -l` 후 ETF 비율 감안(상위 거래대금 중 ETF만)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 거래대금 상위(KIS ~30)에서 ETF만 거르므로 처음엔 ~10개 안팎 — 정상(가장 인기 ETF). 전용 ETF 소스 붙이면 늘어남.
- ETF_RE에 안 잡히는 브랜드 있으면 한 줄 추가.
- 다음 STEP 198: 투자상품 탭에 **수익순(1·3·6·12개월)** + ETF/펀드 하위 토글(펀드 준비중).
- **문서 TODO**(다음 갱신 때): STEP 195~197 + "투자상품/리딩방 로드맵" + "광고는 사용자 지시 시에만(철칙도 그때 사용자가 정함)" 한 줄.

---
> STEP 197 = 투자상품 탭 ① 인기 ETF. 전제 STEP 196. 다음: ② 수익순. 문서 묶어 갱신.
