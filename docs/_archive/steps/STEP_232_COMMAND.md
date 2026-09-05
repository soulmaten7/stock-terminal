<!-- 2026-06-09 -->
# STEP 232 — 속보: 박스 꽉 채움 + 대표 이미지 크게 + 왼쪽 열 헤드라인 2개

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_232_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시 — 재수정)
1. 속보 박스 **하단 여백 제거 → 콘텐츠로 꽉 채움**.
2. **왼쪽 열**: 대표 기사 밑 헤드라인 **2개만**. 대신 **대표 이미지를 크게**(남는 공간을 이미지가 채우게).
3. **오른쪽 열**: 헤드라인 더 넣어 박스 채움.

## 전제 상태
- HEAD: STEP 231 상태
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
  const leftRest = rest.slice(0, 2);     // 왼쪽 열: 대표 밑 헤드라인 2개
  const rightRest = rest.slice(2, 16);   // 오른쪽 열: 헤드라인 (박스 채움)

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

      <div className="min-h-0 flex-1 overflow-hidden px-5 pb-5">
        {loading ? (
          <LoadingState className="py-8" />
        ) : !featured ? (
          <p className="py-8 text-center text-sm text-unjong-muted">속보를 불러오는 중이에요.</p>
        ) : (
          <div className="grid h-full grid-cols-1 gap-x-6 md:grid-cols-2">
            {/* 왼쪽 열: 대표(이미지 크게, 공간 채움) + 헤드라인 2개 */}
            <div className="flex min-h-0 flex-col">
              <a
                href={featured.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {featured.image && (
                  <div className="mb-2 min-h-0 flex-1 overflow-hidden rounded-lg border border-unjong-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.image}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { const el = e.currentTarget.parentElement; if (el) el.style.display = "none"; }}
                    />
                  </div>
                )}
                <p className="line-clamp-2 shrink-0 text-sm font-bold text-unjong-primary group-hover:text-unjong-accent">{featured.title}</p>
                <p className="mt-0.5 shrink-0 text-[11px] text-unjong-muted">{featured.publisher} · {timeAgo(featured.publishedAt)}</p>
              </a>
              <ul className="mt-2 shrink-0 space-y-0.5">{leftRest.map((n, i) => <Row key={`l${i}`} n={n} />)}</ul>
            </div>

            {/* 오른쪽 열: 헤드라인 (넘치면 스크롤) */}
            <ul className="min-h-0 space-y-0.5 overflow-y-auto">{rightRest.map((n, i) => <Row key={`r${i}`} n={n} />)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}
```

> 핵심: 본문 `flex-1 overflow-hidden`(고정 높이) + 그리드 `h-full`. **왼쪽 열** = `flex-col`에서 대표 `<a>`가 `flex-1`, 그 안 이미지가 `flex-1` → **이미지가 남는 공간을 꽉 채움**(크게). 제목·출처·헤드라인 2개는 `shrink-0`로 밑에 고정. **오른쪽 열** = 헤드라인 14개(`overflow-y-auto`로 넘치면 스크롤). 양쪽 다 박스 높이를 채워 **여백 없음**.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeBreakingNews.tsx && git commit -m "fix(v7): 속보 박스 꽉 채움+대표 이미지 크게(flex)+왼쪽 헤드라인 2개 (STEP 232)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 속보 박스 **하단 여백 사라짐**(콘텐츠로 꽉 참)
- [ ] **왼쪽 열 대표 이미지가 큼**(남는 공간 채움), 그 밑 제목·출처 → 헤드라인 **2개**
- [ ] **오른쪽 열 헤드라인이 박스 높이를 채움**(많으면 그 열만 스크롤)
- [ ] 높이는 실시간채팅과 동일(`h-[46vh]`)
- ⚠️ 클라이언트 → 하드 새로고침이면 반영.

## 주의·예상 이슈
- 이미지 없는 대표(드묾)면 왼쪽 `<a>`가 텍스트만 → 약간 빌 수 있음(이미지 있으면 꽉 참).
- 오른쪽 헤드라인 수(14)는 `rest.slice(2, 16)` 숫자로 조절.
- **문서 TODO**(다음 갱신): STEP 228~232.

---
> STEP 232 = 속보 박스 채움·이미지 크게·왼쪽 2개. 전제 STEP 231. 다음 = 리딩방/채널 구조. 문서 묶어 갱신.
