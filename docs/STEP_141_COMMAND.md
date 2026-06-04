<!-- 2026-06-03 -->
# STEP 141 — 종목 공시(DART·SEC) 탭 추가

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
호출법: `@docs/STEP_141_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표

종목 페이지에 네이버 "전자공시" 대응 **공시 탭**을 추가한다. **신규 데이터·마이그레이션 0** — 이미 있는 `/api/stocks/disclosures` 연결.

이 API 는 **한국(DART)·미국(SEC EDGAR) 둘 다** 자동 지원하고, **공시 유형 분류**(유상증자·CB발행·대주주변동·정기보고 등)까지 해준다. 운종 신뢰 정체성상 **"주의가 필요한 공시"(유상증자·CB·대주주변동)를 시각 강조**해 사용자가 위험 신호를 빨리 포착하게 한다.

---

## 📌 전제 상태

- **이전 HEAD**: `0fb0307` (STEP 140 — 종목 토론 추천/비추천, 마이그레이션 022 적용 완료). *시작 전 `git log --oneline -1` 확인.*
- **마이그레이션 없음 · DB 변경 없음.**
- 확정된 API 응답:
```
GET /api/stocks/disclosures?symbol=005930&months=6&limit=50   (한국: DART)
GET /api/stocks/disclosures?symbol=AAPL                        (미국: SEC EDGAR 자동)
응답 KR: { corp_name, total_count, items:[{ rcept_no, report_name, disclosure_type, filer_name, published_at, remark, source_url }], meta }
응답 US: { corp_name, total_count, items:[{ report_name, published_at, disclosure_type, source_url }], source:"SEC EDGAR" }
에러: { error, items:[] }   // DART 키/코드 없음·SEC CIK 없음 등
```
> disclosure_type 값(KR): 유상증자·무상증자·자사주·CB발행·대주주변동·합병분할·정기보고·감사·재무·주요사항·IR·기타.

---

## 🔢 작업 순서

### STEP 1 — `StockDisclosuresTab.tsx` 신규

`components/stock/StockDisclosuresTab.tsx`:

```tsx
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
  if (CAUTION.has(type)) return "bg-[#F04452]/10 text-[#F04452]";       // 주의 = 레드
  if (type === "정기보고" || type === "감사·재무") return "bg-blue-50 text-blue-700";
  if (type === "IR" || type === "자사주" || type === "무상증자") return "bg-[#1AC267]/10 text-[#1AC267]";
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
```

> 주의 유형 = 레드 뱃지 + 하단 안내(운종 신뢰 — 위험 신호 인지). 외부 원문은 DART/SEC 새창.

---

### STEP 2 — `StockTabs.tsx` 공시 탭 추가

탭 배열·타입·렌더에 "공시" 추가 (뉴스와 인사이트 사이).

```tsx
import { LineChart, MessageSquare, Newspaper, FileText, BarChart3 } from "lucide-react";
import StockDisclosuresTab from "./StockDisclosuresTab";

type Tab = "chart" | "discussion" | "news" | "disclosure" | "insights";

const TABS: Array<{ id: Tab; label: string; icon: typeof LineChart }> = [
  { id: "chart", label: "차트·시세", icon: LineChart },
  { id: "discussion", label: "토론", icon: MessageSquare },
  { id: "news", label: "뉴스", icon: Newspaper },
  { id: "disclosure", label: "공시", icon: FileText },
  { id: "insights", label: "인사이트", icon: BarChart3 },
];
// 렌더 분기에 추가:
{active === "disclosure" && <StockDisclosuresTab symbol={symbol} />}
```

> 기존 탭 순서·기본 탭("discussion")은 유지.

---

### STEP 3 — 빌드 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
✓ exit 0 · `console.log` 금지.

```bash
cd ~/stock-terminal && git add components/stock/StockDisclosuresTab.tsx components/stock/StockTabs.tsx \
  && git commit -m "feat(v6): 종목 공시 탭 추가 — DART/SEC 연결 + 주의 공시(유상증자·CB·대주주변동) 강조 (STEP 141)" \
  && git push
```

---

### STEP 4 — 문서 갱신

오늘(2026-06-03):
- `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` 헤더 + STEP 141 블록
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD 갱신 · 종목 페이지 탭 5개로 갱신: 차트·시세/토론/뉴스/공시/인사이트)
- `docs/SESSION_KICKOFF.md` (현재 커밋)

---

## ✅ 완료 기준 (DoD)

1. 종목 페이지에 "공시" 탭 추가 (5개 탭).
2. 한국 종목 → DART 공시, 미국 → SEC 공시 자동 표시.
3. 공시 유형 뱃지 + 주의 유형(유상증자·CB·대주주변동·합병분할) 레드 강조 + 하단 안내.
4. 데이터 없음/에러 시 EmptyState 안내.
5. `npm run build` ✓ exit 0 + push.
6. 6개 문서 갱신.

## ⚠️ 주의

- 마이그레이션·DB 변경 ❌ — 기존 API 연결만.
- `/api/stocks/disclosures` 는 **수정 금지**(이미 동작) — 연결만.
- `components/stocks/*`(구 V3, 고아 후보)의 공시 컴포넌트는 **재사용·import 금지** — 새 `components/stock/StockDisclosuresTab.tsx` 사용.
- DART 호출은 종목 진입 시 1회 — 폴링 ❌ (DART 일 10,000 제한 여유 위해).

---

> **STEP 141 = 종목 페이지에 공시(전자공시) 탭.** 이로써 종목 페이지 탭 5종(차트·시세/토론/뉴스/공시/인사이트) = 네이버 종목 페이지 핵심 커버. 다음 후보: 외국인보유율·상장주식수 메타 · 평가 시드 데이터 투입 · Sponsored 분리 UI.
