<!-- 2026-06-15 -->
# STEP 259 — 펀드 디렉토리 탭 연결 + 탭 유지(새로고침)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_259_COMMAND.md 파일 내용대로 실행해줘`

## 목표
1. **펀드 탭 = 실데이터 디렉토리** ('준비 중' → 실제). `fndTp` 유형 필터 됨(확인), `fndNm`은 정확일치만 → **유형 필터 + 더보기 + 불러온 목록 내 검색 + 네이버 폴백**.
2. **탭 유지**: 홈 랭킹 탭(주식/ETF/ETN/펀드/리츠/리딩방)이 **새로고침하면 주식으로 돌아가던 것** → URL `?tab=`으로 현재 탭 유지.

## 전제 상태
- 현재 HEAD: STEP 258 적용 후(`804c015`). `/api/fund`가 `type`(유형)·`page`·`rows` 지원(확인).
- 변경 **2파일**:
  - `components/home-v6/HomeFundDirectory.tsx` (**신규**)
  - `components/home-v6/HomeRankingTabs.tsx` (import + fund 연결 + 탭 유지)

---

## 작업 1/2 — `components/home-v6/HomeFundDirectory.tsx` (신규)

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Fund = { code: string; stdCode: string; name: string; type: string; setupDate: string };

const TYPES = ["전체", "주식형", "채권형", "혼합형", "단기금융", "부동산", "재간접", "특별자산"];

function fmtDate(s: string): string {
  if (!s || s.length !== 8) return "—";
  return `${s.slice(0, 4)}.${s.slice(4, 6)}`;
}
function typeBadge(t: string): string {
  if (t.includes("주식")) return "bg-[#F04452]/10 text-[#F04452]";
  if (t.includes("채권")) return "bg-[#3182F6]/10 text-[#3182F6]";
  if (t.includes("혼합")) return "bg-[#7C3AED]/10 text-[#7C3AED]";
  if (t.includes("단기") || t.includes("금융") || t.includes("MMF")) return "bg-[#12B886]/10 text-[#12B886]";
  if (t.includes("부동산") || t.includes("특별")) return "bg-[#F59F00]/10 text-[#F59F00]";
  return "bg-unjong-background text-unjong-muted";
}
const naverFund = (name: string) =>
  `https://search.naver.com/search.naver?query=${encodeURIComponent(name + " 펀드 기준가")}`;

export default function HomeFundDirectory() {
  const [type, setType] = useState("전체");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Fund[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 유형 변경 → 초기화 후 1페이지
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setPage(1);
    (async () => {
      try {
        const p = new URLSearchParams({ page: "1", rows: "100" });
        if (type !== "전체") p.set("type", type);
        const j = await (await fetch(`/api/fund?${p.toString()}`)).json();
        if (!cancelled) {
          setItems((j.funds ?? []) as Fund[]);
          setTotalCount(Number(j.totalCount ?? 0));
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  async function loadMore() {
    const next = page + 1;
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(next), rows: "100" });
      if (type !== "전체") p.set("type", type);
      const j = await (await fetch(`/api/fund?${p.toString()}`)).json();
      setItems((prev) => [...prev, ...((j.funds ?? []) as Fund[])]);
      setPage(next);
    } catch {
      /* keep */
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((f) => f.name.includes(q));
  }, [items, query]);

  const hasMore = items.length < totalCount;

  return (
    <div>
      {/* 검색 + 유형 필터 */}
      <div className="mb-3 space-y-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="펀드명 검색 (불러온 목록에서)"
          className="w-full rounded-xl border border-unjong-border bg-unjong-surface px-4 py-2.5 text-sm text-unjong-primary outline-none focus:border-unjong-primary"
        />
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                type === t ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
              }`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-unjong-muted">
            {type} {totalCount.toLocaleString()}개 · 불러옴 {items.length.toLocaleString()}
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {loading && items.length === 0 ? (
          <div className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-unjong-muted">불러온 목록에 “{query}” 없음.</p>
            {query.trim() && (
              <a
                href={naverFund(query)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-unjong-primary underline"
              >
                네이버 금융에서 “{query}” 펀드 검색 →
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="px-4 py-2.5 text-left font-medium">펀드명</th>
                  <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">유형</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">설정일</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">상세</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((f) => (
                  <tr key={f.code + f.stdCode} className="border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="px-4 py-3">
                      <span className="font-medium text-unjong-primary">{f.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${typeBadge(f.type)}`}>{f.type || "기타"}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-unjong-muted">{fmtDate(f.setupDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={naverFund(f.name)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-unjong-primary hover:underline">
                        기준가 →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && !query.trim() && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="w-full border-t border-unjong-border py-3 text-sm font-medium text-unjong-muted hover:bg-unjong-background disabled:opacity-50"
              >
                {loading ? "불러오는 중…" : "더 보기"}
              </button>
            )}
          </div>
        )}
      </section>

      <p className="mt-2 px-1 text-[11px] text-unjong-muted">
        운종은 국내 공모펀드를 유형별로 모아 보여줘요. 기준가·수익률 상세는{" "}
        <a href="https://fund.kofia.or.kr" target="_blank" rel="noopener noreferrer" className="underline">
          KOFIA 펀드정보
        </a>{" "}
        또는 각 행 ‘기준가→’에서. (금융위 공공데이터 · 영업일+1 갱신)
      </p>
    </div>
  );
}
```

---

## 작업 2/2 — `components/home-v6/HomeRankingTabs.tsx` (3곳)

**① import — 찾기:**
```tsx
import { useState, Fragment, type ReactNode } from "react";
```
**바꾸기:**
```tsx
import { useState, useEffect, Fragment, type ReactNode } from "react";
```

**② import 추가 — 찾기:**
```tsx
import HomeEtnRanking from "./HomeEtnRanking";
```
**바꾸기:**
```tsx
import HomeEtnRanking from "./HomeEtnRanking";
import HomeFundDirectory from "./HomeFundDirectory";
```

**③ 탭 상태 + 유지 로직 + fund 연결 — 찾기:**
```tsx
  const [tab, setTab] = useState<TabKey>("stock");

  return (
```
**바꾸기:**
```tsx
  const [tab, setTab] = useState<TabKey>("stock");

  // 새로고침해도 현재 탭 유지 (URL ?tab=)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.key === t)) setTab(t as TabKey);
  }, []);

  function selectTab(k: TabKey) {
    setTab(k);
    const p = new URLSearchParams(window.location.search);
    p.set("tab", k);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }

  return (
```

**④ 탭 클릭 → selectTab — 찾기:**
```tsx
              onClick={() => setTab(t.key)}
```
**바꾸기:**
```tsx
              onClick={() => selectTab(t.key)}
```

**⑤ fund 탭 연결 — 찾기:**
```tsx
      {tab === "fund" && <HomeEtfRanking fixedAsset="fund" />}
```
**바꾸기:**
```tsx
      {tab === "fund" && <HomeFundDirectory />}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeFundDirectory.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 펀드 디렉토리 탭(유형 필터·더보기·검색) + 탭 새로고침 유지(?tab=) (STEP 259)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작 + 홈 펀드 탭** → '준비 중' 대신 **펀드 목록**(유형 필터·더보기·검색·기준가 링크)
- [ ] **펀드 탭에서 새로고침** → 주식으로 안 튀고 **펀드 탭 유지**(URL `?tab=fund`)
- [ ] 다른 탭(ETF·ETN·리츠 등)도 새로고침 유지 확인

## 주의·예상 이슈
- `HomeEtfRanking`의 `fixedAsset="fund"` 분기는 이제 미사용(무해) — 그대로 둠.
- 검색은 '불러온 목록' 기준(클라 필터) — 못 찾으면 네이버 링크. 전체 키워드 검색은 후속(Supabase) 과제.
- 새로고침 직후 1프레임 '주식'이 비쳤다가 해당 탭으로 전환될 수 있음(정상).
- **문서 TODO**(다음 갱신): STEP 254~259.

---
> STEP 259 = 펀드 디렉토리 + 탭 유지. 전제 STEP 258(`804c015`).
> 이걸로 주식·ETF·ETN·리츠·미국 + **펀드(디렉토리)** 까지 탭 전부 실데이터.
