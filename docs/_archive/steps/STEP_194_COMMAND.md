<!-- 2026-06-06 -->
# STEP 194 — [D] 국내 투자자 동향 3열 (외국인 ｜ 기관 ｜ 개인 준비중)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_194_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (토스 8·9번 캡쳐 분석 → 적용)
'국내 투자자 동향'을 토스처럼 **3열(외국인 ｜ 기관 ｜ 개인)**.
- 각 행: 순위 + 로고 + 종목명 + 현재가/등락% + 금액(억). 순매수/순매도 토글.
- **외국인·기관**: 기존 KIS investor-rank 실데이터.
- **개인**: KIS가 개인 종목별 순매수를 **미제공** → 칼럼은 두되 "준비 중 — KIS 미제공" 정직 표기(가짜 X).
- 토글은 STEP 191 라운드스퀘어 칩 스타일로 통일.

## 전제 상태
- HEAD: STEP 193 적용된 상태
- 변경: `components/home-v6/InvestorTrend.tsx`(전면 교체) 1파일

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

function Col({ title, sub, items, valueKey }: { title: string; sub: string; items: Item[]; valueKey: "foreignBuy" | "institutionBuy" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex items-baseline gap-2 border-b border-unjong-border bg-unjong-background px-4 py-3">
        <span className="text-sm font-bold text-unjong-primary">{title}</span>
        <span className="text-xs text-unjong-muted">{sub}</span>
      </div>
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
                    <span className={up ? "text-[#F04452]" : "text-[#3182F6]"}>
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

function PlaceholderCol({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex items-baseline gap-2 border-b border-unjong-border bg-unjong-background px-4 py-3">
        <span className="text-sm font-bold text-unjong-primary">{title}</span>
        <span className="text-xs text-unjong-muted">{sub}</span>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-2 text-2xl">🧑‍💻</span>
        <p className="text-sm text-unjong-muted">개인 종목별 순매수는 준비 중이에요</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">KIS가 개인 종목별 데이터를 제공하지 않아<br />외국인·기관만 우선 지원해요</p>
      </div>
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
      {/* 순매수/순매도 토글 (토스식 라운드스퀘어) */}
      <div className="mb-3 flex items-center gap-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              sort === s ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
            }`}
          >
            {s === "buy" ? "순매수" : "순매도"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Col title="외국인" sub={`${label} 상위`} items={data.foreignTop} valueKey="foreignBuy" />
          <Col title="기관" sub={`${label} 상위`} items={data.institutionTop} valueKey="institutionBuy" />
          <PlaceholderCol title="개인" sub={`${label} 상위`} />
        </div>
      )}
    </div>
  );
}
```

> 2열 → 3열. 외국인·기관은 실데이터, 개인은 준비중 칼럼(정직). 토글 라운드스퀘어로 통일.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/InvestorTrend.tsx && git commit -m "feat(v7): [D] 국내 투자자 동향 3열(외국인·기관 실데이터 ｜ 개인 준비중) 토스 레이아웃 (STEP 194)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] '국내 투자자 동향' 탭이 **3열(외국인 ｜ 기관 ｜ 개인)**
- [ ] 외국인·기관 칼럼: 순위·로고·종목명·현재가/등락%(빨강/파랑)·금액(억) 정상
- [ ] 개인 칼럼: "준비 중 — KIS 미제공" 안내(빈 채로 두지 않고 설명)
- [ ] 순매수/순매도 토글 동작 + 라운드스퀘어 스타일
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 개인 종목별은 KIS 한계. 추후 KRX 공식 OpenAPI(STEP 162 키 승인 시) 또는 다른 소스로 채우면 PlaceholderCol → Col 로 교체.
- 3열이라 좁은 화면은 세로로 쌓임(md 미만 1열).
- **A~D 완료** → 다음: 문서 일괄 갱신(STEP 169~194) + 인기토론 홈(지수 티커 고정 + 인기토론 2열 라이브) 묶음.

---
> STEP 194 = [D] 투자자동향 3열. 전제 STEP 193. A~D 완료. 다음: 문서 갱신 + 인기토론 홈. 문서 묶어 갱신.
