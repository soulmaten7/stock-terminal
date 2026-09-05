<!-- 2026-06-09 -->
# STEP 230 — 속보 카드(높이 맞춤+대표 이미지) + 실시간차트 정리(지연문구·투자위험 제거)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_230_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
1. **🔴 실시간 속보 카드 높이 = 실시간채팅 카드(`h-[46vh]`)와 동일**(상단 정렬).
2. 속보에서 **대표(첫) 뉴스는 이미지 포함** — 이미지 아래 추가 뉴스 2개+가 보일 크기(이어서 보이는 느낌). 이미지 있는 최신 뉴스를 대표로.
3. 실시간차트의 **"국내 시세 KRX 공식 · 일별(장 마감) 기준 (실시간 아님)" 문구 제거**(실시간 화면에 모순).
4. 실시간차트 우측 **"투자위험 숨기기" 토글 제거**.

## 전제 상태
- HEAD: STEP 229 상태
- 변경 3파일: `app/api/news/market/route.ts`(이미지 추출) · `components/home-v6/HomeBreakingNews.tsx`(전체 교체) · `components/market/MarketClient.tsx`(제거 6곳)
- DB 변경 0

---

## 작업 1/3 — `app/api/news/market/route.ts` 이미지 추출 추가

**찾기 (타입):**
```ts
type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};
```
**바꾸기:**
```ts
type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  image?: string;
};
```

**찾기 (parseRSS 앞 — 이미지 헬퍼 추가):**
```ts
function parseRSS(xml: string, publisher: string): NewsItem[] {
```
**바꾸기:**
```ts
function extractImage(itemXml: string): string | undefined {
  let m = itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
  if (m) return m[1];
  m = itemXml.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i);
  if (m) return m[1];
  m = itemXml.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (m) return m[1];
  return undefined;
}

function parseRSS(xml: string, publisher: string): NewsItem[] {
```

**찾기 (push 에 image 추가):**
```ts
        publisher,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
```
**바꾸기:**
```ts
        publisher,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        image: extractImage(itemXml),
      });
```

> enclosure → media:content/thumbnail → description 내 img 순으로 best-effort. 없으면 undefined(텍스트만).

---

## 작업 2/3 — `components/home-v6/HomeBreakingNews.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type NewsItem = { title: string; link: string; publisher: string; publishedAt: string; image?: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Row({ n }: { n: NewsItem }) {
  return (
    <li>
      <a
        href={n.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-baseline gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-unjong-background"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{n.title}</span>
        <span className="shrink-0 text-[11px] text-unjong-muted">{n.publisher} · {timeAgo(n.publishedAt)}</span>
      </a>
    </li>
  );
}

export default function HomeBreakingNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/news/market");
        const j = await r.json();
        if (!cancelled) setItems((j.items as NewsItem[]) || []);
      } catch {
        /* 무시 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const featured = items.find((it) => it.image) ?? items[0];
  const rest = items.filter((it) => it !== featured).slice(0, 15);

  return (
    <section className="flex h-[46vh] flex-col overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex shrink-0 items-baseline justify-between px-5 pb-3 pt-5">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-unjong-primary">
          🔴 실시간 속보 <span className="text-xs font-normal text-unjong-muted">시장 헤드라인</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-unjong-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04452]" /> 실시간
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {loading ? (
          <LoadingState className="py-8" />
        ) : !featured ? (
          <p className="py-8 text-center text-sm text-unjong-muted">속보를 불러오는 중이에요.</p>
        ) : (
          <>
            {/* 대표 뉴스 (이미지 있으면 이미지 포함) */}
            <a href={featured.link} target="_blank" rel="noopener noreferrer" className="group block">
              {featured.image && (
                <div className="mb-2 overflow-hidden rounded-lg border border-unjong-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.image}
                    alt=""
                    className="h-32 w-full object-cover"
                    onError={(e) => { const el = e.currentTarget.parentElement; if (el) el.style.display = "none"; }}
                  />
                </div>
              )}
              <p className="line-clamp-2 text-sm font-bold text-unjong-primary group-hover:text-unjong-accent">{featured.title}</p>
              <p className="mt-0.5 text-[11px] text-unjong-muted">{featured.publisher} · {timeAgo(featured.publishedAt)}</p>
            </a>

            {/* 나머지 헤드라인 */}
            <ul className="mt-3 space-y-0.5 border-t border-unjong-border pt-2">
              {rest.map((n, i) => <Row key={i} n={n} />)}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
```

> `h-[46vh]`로 실시간채팅과 동일 높이·상단 정렬. 대표 뉴스 이미지(`h-32`) 아래로 헤드라인이 이어짐(넘치면 카드 내부 스크롤). 이미지 없으면 텍스트 대표.

---

## 작업 3/3 — `components/market/MarketClient.tsx` 지연문구·투자위험 토글 제거

**① 찾기 (삭제 — leverageInfo import):**
```tsx
import { leverageInfo } from "@/lib/avatar";
```
**바꾸기:** (이 줄 삭제)

**② 찾기 (삭제 — hideRisk state):**
```tsx
  const [hideRisk, setHideRisk] = useState(false);
```
**바꾸기:** (이 줄 삭제)

**③ 찾기 (shownRows 단순화):**
```tsx
  const shownRows = hideRisk ? rows.filter((r) => !leverageInfo(r.name)) : rows;
```
**바꾸기:**
```tsx
  const shownRows = rows;
```

**④ 찾기 (주석):**
```tsx
        {/* 기간 + 투자위험 토글 (오른쪽). 실시간만 동작, 나머지 준비 중 */}
```
**바꾸기:**
```tsx
        {/* 기간 (오른쪽). 실시간만 동작, 나머지 준비 중 */}
```

**⑤ 찾기 (삭제 — 구분선 + 투자위험 버튼):**
```tsx
            <span className="mx-1 h-5 w-px bg-unjong-border" />
            <button
              type="button"
              onClick={() => setHideRisk((v) => !v)}
              title="레버리지·인버스 ETF 숨기기"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                hideRisk ? "text-unjong-primary" : "text-unjong-muted hover:bg-unjong-background"
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded text-[10px] leading-none ${hideRisk ? "bg-[#3182F6] text-white" : "border border-unjong-border text-transparent"}`}>✓</span>
              투자위험 숨기기
            </button>
```
**바꾸기:** (블록 전체 삭제)

**⑥ 찾기 (삭제 — 지연 문구):**
```tsx
          {country === "kr" && (
            <p className="text-xs text-unjong-muted mb-2">국내 시세 KRX 공식 · 일별(장 마감) 기준 (실시간 아님)</p>
          )}
```
**바꾸기:** (블록 전체 삭제)

> `leverageInfo`·`hideRisk`·버튼 모두 제거 → 미사용 변수/임포트 없음(빌드 안전). 기간 칩만 우측에 남고, 지연 문구 사라짐.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/news/market/route.ts components/home-v6/HomeBreakingNews.tsx components/market/MarketClient.tsx && git commit -m "feat(v7): 속보 카드 높이 맞춤+대표 이미지, 실시간차트 지연문구·투자위험 토글 제거 (STEP 230)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (미사용 import 에러 없음) / 커밋·push
- [ ] 🔴 실시간 속보 카드가 **실시간채팅과 같은 높이**(`h-[46vh]`), 위 정렬
- [ ] 속보 **대표 뉴스에 이미지**(있을 때), 아래로 헤드라인 이어짐 + 내부 스크롤
- [ ] 실시간차트 **"…일별(장 마감) 기준 (실시간 아님)" 문구 사라짐**
- [ ] 실시간차트 우측 **"투자위험 숨기기" 토글 사라짐**, 기간 칩만 남음
- ⚠️ 하드 새로고침. 이미지는 RSS에 있을 때만(없으면 텍스트 대표 — 정상).

## 주의·예상 이슈
- RSS 이미지 추출은 best-effort — 피드별로 있을 수도/없을 수도. 깨진 이미지는 `onError`로 숨김.
- 속보 12~16개라 `h-[46vh]` 넘치면 카드 내부 스크롤(의도).
- **문서 TODO**(다음 갱신): STEP 228·229·230.

---
> STEP 230 = 속보 높이·이미지 + 실시간차트 정리. 전제 STEP 229. 다음 = 리딩방/채널 구조. 문서 묶어 갱신.
