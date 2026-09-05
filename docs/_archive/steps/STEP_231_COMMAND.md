<!-- 2026-06-09 -->
# STEP 231 — 속보: 대표 이미지를 '왼쪽 열 안'에만 (2열 흐름 유지)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_231_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시 — 재수정)
이전엔 대표 이미지를 **양쪽 열 위에 가로로** 펼쳐서 틀림. 올바른 형태:
- **2열(1:1) 유지.**
- **왼쪽 열**: 맨 위 = 대표 기사 **이미지(왼쪽 열 폭만)** + 제목 → 그 아래로 헤드라인(밑에 2개+ 보이게).
- **오른쪽 열**: 헤드라인만.
- → 왼쪽 위 이미지 → 왼쪽 헤드라인 → 오른쪽 헤드라인으로 쭉 읽히는 흐름.

## 전제 상태
- HEAD: STEP 230 + Claude Code 자체 수정(`63cc7b0`) 상태
- 변경 1파일: `components/home-v6/HomeBreakingNews.tsx`(전체 교체)
- DB 변경 0

---

## 작업 1/1 — `components/home-v6/HomeBreakingNews.tsx` (파일 전체 교체)

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
  const rest = items.filter((it) => it !== featured);
  const leftRest = rest.slice(0, 4);    // 왼쪽 열: 대표 아래 헤드라인
  const rightRest = rest.slice(4, 13);  // 오른쪽 열: 헤드라인

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
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            {/* 왼쪽 열: 대표(이미지, 열 폭만) + 헤드라인 */}
            <div>
              <a href={featured.link} target="_blank" rel="noopener noreferrer" className="group mb-1 block">
                {featured.image && (
                  <div className="mb-1.5 overflow-hidden rounded-lg border border-unjong-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.image}
                      alt=""
                      className="h-28 w-full object-cover"
                      onError={(e) => { const el = e.currentTarget.parentElement; if (el) el.style.display = "none"; }}
                    />
                  </div>
                )}
                <p className="line-clamp-2 text-sm font-bold text-unjong-primary group-hover:text-unjong-accent">{featured.title}</p>
                <p className="mt-0.5 text-[11px] text-unjong-muted">{featured.publisher} · {timeAgo(featured.publishedAt)}</p>
              </a>
              <ul className="space-y-0.5">{leftRest.map((n, i) => <Row key={`l${i}`} n={n} />)}</ul>
            </div>

            {/* 오른쪽 열: 헤드라인만 */}
            <ul className="space-y-0.5">{rightRest.map((n, i) => <Row key={`r${i}`} n={n} />)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}
```

> 핵심: 대표 이미지가 **왼쪽 열 `<div>` 안**에만 있음(`w-full`=왼쪽 열 폭, 전체폭 X). 왼쪽 열 = 대표+이미지 다음에 헤드라인 4개, 오른쪽 열 = 헤드라인. `h-[46vh]`(채팅과 동일 높이) 유지·넘치면 내부 스크롤.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeBreakingNews.tsx && git commit -m "fix(v7): 속보 대표 이미지를 왼쪽 열 안에만(2열 흐름) (STEP 231)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 속보 **왼쪽 열** 맨 위에 대표 이미지(열 폭만, 전체폭 아님)+제목, 그 아래 헤드라인
- [ ] **오른쪽 열**은 헤드라인만
- [ ] 이미지가 양쪽 위로 가로로 펼쳐지지 **않음**
- [ ] 높이는 실시간채팅과 동일(`h-[46vh]`)
- ⚠️ 클라이언트 컴포넌트 → 하드 새로고침이면 반영.

## 주의·예상 이슈
- 이미지 없으면 왼쪽 열 대표가 텍스트(제목)로만(정상).
- 왼쪽(대표+4) / 오른쪽(헤드라인 9) 비율은 `slice` 숫자로 조절 가능.
- **문서 TODO**(다음 갱신): STEP 228~231.

---
> STEP 231 = 속보 대표 이미지 왼쪽 열 안에만. 전제 STEP 230. 다음 = 리딩방/채널 구조. 문서 묶어 갱신.
