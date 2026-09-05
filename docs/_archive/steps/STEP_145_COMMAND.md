<!-- 2026-06-04 -->
# STEP 145 — 브리핑 overnight 안정화 (간밤 미국 지수 표기 신뢰화)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_145_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 "📰 시장 브리핑 → 간밤 미국 시장" 4개 지수(S&P 500·NASDAQ·DOW·VIX) 표기를 **신뢰성 있게** 만든다.
지금은 야후가 일부 심볼 값을 못 주면 `?? 0` 폴백 때문에 **"0.00 / +0.00%"가 초록(상승)** 으로 표시됨 — 가짜 데이터가 진짜처럼 보이는 문제(운종 신뢰 정체성에 정면 위배). (PLAYBOOK §11 P0)

## 전제 상태 (이 커밋 위에서 작업)
- HEAD: `a0cc3bf` (STEP 144 지수 스파크라인)
- 빌드: ✓ / 브랜치: `main`
- 변경 파일은 아래 2개뿐. 다른 파일 건드리지 말 것.

## 원인 진단
- `fetchUsIndices()` 에서 `Number(hit?.regularMarketPrice ?? 0)` → 누락 시 `price=0`.
- `up: pct >= 0` → `pct=0` 이면 `true` → **초록색 "+0.00%"** 로 렌더 (실데이터처럼 보임).
- 즉 "데이터 없음"과 "0% 보합"이 구분 안 됨. **신뢰 플랫폼에선 치명적.**

## 설계 (안정화 방식)
- 가격이 **양수 유한값**이고 등락률이 **유한값**일 때만 실데이터로 인정(`hasData`).
- 아니면 `val: '—', change: '—', hasData: false` — 4칸 그리드는 유지(레이아웃 안 흔들림), 색은 중립 회색.
- `regularMarketChangePercent` 필드는 그대로 사용 — 미국장 마감(간밤)엔 "직전 정규장 등락", 개장 중엔 "실시간 등락"으로 양쪽 상태 모두 올바름. 변경 불필요.
- 새 의존성·DB 변경 0. 순수 방어 로직 + 색상 분기.

---

## 작업 1/2 — API 수정: `app/api/home/briefing/route.ts`

아래 내용으로 **파일 전체를 교체**한다. (변경점: `fetchUsIndices()` 만. `formatKSTDate`·`fetchDartSchedule`·`GET` 은 기존과 동일)

```ts
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// 장전 브리핑 — 간밤 미증시(야후 라이브러리) + 최근 DART 주요 일정

function formatKSTDate(d: Date) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchUsIndices() {
  const SYMS = [
    { symbol: '^GSPC', label: 'S&P 500' },
    { symbol: '^IXIC', label: 'NASDAQ' },
    { symbol: '^DJI',  label: 'DOW' },
    { symbol: '^VIX',  label: 'VIX' },
  ];
  // 데이터 없을 때 안전 기본행 (가짜 0.00 대신 '—')
  const blank = SYMS.map((s) => ({ label: s.label, val: '—', change: '—', up: true, hasData: false }));
  try {
    const q = await yahooFinance.quote(SYMS.map((s) => s.symbol));
    const arr = (Array.isArray(q) ? q : [q]) as Array<Record<string, unknown>>;
    return SYMS.map((s) => {
      const hit = arr.find((x) => x.symbol === s.symbol);
      const price = Number(hit?.regularMarketPrice);
      const pct = Number(hit?.regularMarketChangePercent);
      // 가격이 양수 유한값 + 등락률이 유한값일 때만 실데이터로 인정
      const hasData = Number.isFinite(price) && price > 0 && Number.isFinite(pct);
      if (!hasData) {
        return { label: s.label, val: '—', change: '—', up: true, hasData: false };
      }
      return {
        label: s.label,
        val: price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(2),
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        up: pct >= 0,
        hasData: true,
      };
    });
  } catch {
    return blank;
  }
}

async function fetchDartSchedule() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || apiKey === 'your_dart_api_key') return [];
  // 최근 3일 범위 — 당일 공시 0건일 때 빈칸 방지
  const bgnDe = formatKSTDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  try {
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      bgn_de: bgnDe,
      page_no: '1',
      page_count: '30',
    });
    const res = await fetch(`https://opendart.fss.or.kr/api/list.json?${params}`, {
      next: { revalidate: 900 },
    });
    const data = await res.json();
    const KEYWORDS = ['실적', '어닝', '분기보고서', '사업보고서', '유상증자', '합병', '분할', '배당'];
    return (data.list || [])
      .filter((item: Record<string, string>) =>
        KEYWORDS.some((k) => item.report_nm?.includes(k))
      )
      .slice(0, 5)
      .map((item: Record<string, string>) => `${item.corp_name} — ${item.report_nm}`);
  } catch {
    return [];
  }
}

export async function GET() {
  const [overnight, schedule] = await Promise.all([fetchUsIndices(), fetchDartSchedule()]);
  return NextResponse.json(
    { overnight, schedule },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=120' } },
  );
}
```

---

## 작업 2/2 — 컴포넌트 수정: `components/home-v6/HomeBriefing.tsx`

아래 내용으로 **파일 전체를 교체**한다. (변경점: `Overnight` 타입에 `hasData?` 추가 · 등락률 색상 분기에 "데이터 없음=회색" 추가. 나머지는 기존과 동일)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Overnight = { label: string; val: string; change: string; up: boolean; hasData?: boolean };

export default function HomeBriefing() {
  const [overnight, setOvernight] = useState<Overnight[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    setStamp(new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/home/briefing")).json();
        if (cancelled) return;
        setOvernight(j.overnight || []);
        setSchedule(j.schedule || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-unjong-primary">📰 시장 브리핑</h2>
        {stamp && <span className="text-xs text-unjong-muted">{stamp} 기준</span>}
      </header>
      <p className="text-xs text-unjong-muted mb-4">본 요약은 참고용이며, 투자 판단·책임은 본인에게 있습니다.</p>

      {loading ? (
        <LoadingState />
      ) : overnight.length === 0 && schedule.length === 0 ? (
        <EmptyState title="브리핑 데이터 없음" description="간밤 지수·일정 데이터를 불러오지 못했습니다." />
      ) : (
        <div className="space-y-4">
          {overnight.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-unjong-primary mb-2">간밤 미국 시장</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {overnight.map((o) => (
                  <div key={o.label} className="rounded-lg bg-unjong-background px-3 py-2">
                    <p className="text-xs text-unjong-muted">{o.label}</p>
                    <p className="text-sm font-bold text-unjong-primary tabular-nums">{o.val}</p>
                    <p className={`text-xs font-semibold ${
                      o.hasData === false
                        ? "text-unjong-muted"
                        : o.up ? "text-[#1AC267]" : "text-[#F04452]"
                    }`}>{o.change}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {schedule.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-unjong-primary mb-2">오늘 주요 일정·공시</p>
              <ul className="space-y-1">
                {schedule.map((s, i) => (
                  <li key={i} className="text-sm text-unjong-primary flex items-start gap-1.5">
                    <span className="text-unjong-accent">·</span>
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
```

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

빌드가 성공해야만 커밋한다. (절대 규칙: 빌드 깨진 코드 push 금지)

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/home/briefing/route.ts components/home-v6/HomeBriefing.tsx && git commit -m "fix(v6): 브리핑 overnight 지수 신뢰화 — 누락·0·NaN 값을 가짜 0.00 대신 '—'(중립) 처리 (STEP 145)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부

## 주의·예상 이슈
- 빌드 영향 거의 없음 — 타입 1개 필드 추가 + 방어 로직 + className 분기뿐. 새 import·의존성·DB 변경 0.
- 야후가 정상일 땐 기존과 동일하게 실데이터 표시. 달라지는 건 "데이터 없을 때만" (초록 0.00 → 회색 '—').
- `text-unjong-muted` 는 같은 파일에서 이미 쓰는 검증된 클래스.

---
> STEP 145 = PLAYBOOK §11 P0 "브리핑 overnight 값 안정화". 전제 `a0cc3bf` → 이 STEP 코드 커밋 후 Cowork 이 STEP 144·145 묶어서 4개 문서 + PLAYBOOK 갱신.
