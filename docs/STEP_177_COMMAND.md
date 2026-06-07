<!-- 2026-06-06 -->
# STEP 177 — 국내 투자자 동향 토스식 (순매수/순매도 토글 + 로고 + 가격·등락)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_177_COMMAND.md 파일 내용대로 실행해줘`

## 목표
'국내 투자자 동향' 탭을 토스처럼:
- **순매수/순매도 토글** (기존 `/api/kis/investor-rank?sort=buy|sell` 재사용)
- 각 행에 **로고 + 종목명 + 현재가·등락% + 순매수 금액(억)** (지금은 이름+금액만)
- 외국인·기관 2열 (개인은 KIS에 종목별 랭킹 없음 → 다음에 KRX 키로 추가)

## 전제 상태
- HEAD: STEP 176 적용된 상태(랭킹 3탭). `/api/kis/investor-rank` 응답에 price·changePercent 이미 포함
- 변경: `components/home-v6/InvestorTrend.tsx`(전체 교체) 1파일

---

## 작업 1/1 — `components/home-v6/InvestorTrend.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState } from "@/components/ui/State";

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
};

function Col({ title, items, valueKey }: { title: string; items: Item[]; valueKey: "foreignBuy" | "institutionBuy" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="border-b border-unjong-border bg-unjong-background px-4 py-3 text-sm font-bold text-unjong-primary">{title}</div>
      <ul className="divide-y divide-unjong-border">
        {items.slice(0, 10).map((it, i) => {
          const v = it[valueKey];
          const up = it.changePercent >= 0;
          return (
            <li key={it.symbol}>
              <Link href={`/stock/${it.symbol}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-unjong-background">
                <span className="w-4 text-sm font-semibold tabular-nums text-unjong-muted">{i + 1}</span>
                <StockLogo code={it.symbol} name={it.name} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-unjong-primary">{it.name}</p>
                  <p className="text-xs tabular-nums text-unjong-muted">
                    {it.price.toLocaleString()}원{" "}
                    <span className={up ? "text-[#1AC267]" : "text-[#F04452]"}>
                      {up ? "+" : ""}{it.changePercent.toFixed(2)}%
                    </span>
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums text-unjong-primary">{Math.abs(v).toLocaleString()}억</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function InvestorTrend() {
  const [sort, setSort] = useState<"buy" | "sell">("buy");
  const [data, setData] = useState<{ foreignTop: Item[]; institutionTop: Item[] }>({ foreignTop: [], institutionTop: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch(`/api/kis/investor-rank?market=all&sort=${sort}`)).json();
        if (!cancelled) setData({ foreignTop: j.foreignTop ?? [], institutionTop: j.institutionTop ?? [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sort]);

  const label = sort === "buy" ? "순매수" : "순매도";

  return (
    <div>
      {/* 순매수/순매도 토글 */}
      <div className="mb-3 flex items-center gap-1.5">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === s ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
            }`}
          >
            {s === "buy" ? "순매수" : "순매도"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Col title={`외국인 ${label} 상위`} items={data.foreignTop} valueKey="foreignBuy" />
          <Col title={`기관 ${label} 상위`} items={data.institutionTop} valueKey="institutionBuy" />
        </div>
      )}
    </div>
  );
}
```

> 변경점: 순매수/순매도 토글 + 행마다 로고·종목·현재가·등락%·금액(억). 외국인/기관 2열(개인 = KIS 미지원).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/InvestorTrend.tsx && git commit -m "feat(v7): 국내 투자자 동향 토스식 — 순매수/순매도 토글 + 로고·현재가·등락·금액 (STEP 177)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] '국내 투자자 동향' 탭에 **순매수/순매도 토글** + 각 행 **로고·종목·현재가·등락%·금액(억)** 보이는지
- [ ] 토글 누르면 외국인/기관 둘 다 바뀌는지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 개인 열은 KIS 종목별 랭킹 없음 → 외국인/기관만. 개인까지는 KRX 공식 OpenAPI(키 대기) 또는 별도 소스.
- 다음 토스화 순서: ② 상세 패널 캔들차트 · ③ 랭킹 ♥ · ④ 미국 탭 "데이터 없음" 버그 수정 · ⑤ 카테고리 레이아웃 정리.

---
> STEP 177 = 투자자 동향 토스식. 전제 STEP 176. 다음: 상세 캔들 · 랭킹 ♥ · 미국탭 버그 · 카테고리. 문서 묶어 갱신.
