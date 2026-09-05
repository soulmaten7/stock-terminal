<!-- 2026-06-21 -->
# STEP 337 — [신규] 공시·신용 탭 우측 피드: DART 최신 전자공시

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_337_COMMAND.md 파일 내용대로 실행해줘
```

- **선행**: `DART_API_KEY`는 이미 `.env.local`에 있음(40자, 확인 완료). 발급 불필요 — 새 라우트 반영 위해 **dev 서버 재시작만** 하면 됨.

---

## 🎯 목표
공시·신용(disclosure) 탭을 **좌:큐레이션 링크 / 우:DART 최신 공시**로. 우측 = 금감원 DART 공식 API로 상장사 최신 전자공시 20건(회사명·보고서명·제출인·날짜, 클릭 시 DART 원문).

> 신규 2파일(API·컴포넌트) + `ToolboxClient.tsx`. 뉴스 피드 패턴과 동일 구조. 공시는 이미지 없음(목록형).

---

## 📄 파일 1 (신규) — `app/api/dart/feed/route.ts`

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DartItem = {
  corp: string;
  title: string;
  cls: string;
  stockCode: string;
  filer: string;
  date: string;
  rcpNo: string;
  link: string;
};

let cache: { at: number; data: unknown } | null = null;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
const CLS: Record<string, string> = { Y: "코스피", K: "코스닥", N: "코넥스", E: "기타" };

export async function GET() {
  const key = (process.env.DART_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });

  if (cache && Date.now() - cache.at < 10 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const now = new Date();
    const end = ymd(now);
    const begin = ymd(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000));
    const url =
      `https://opendart.fss.or.kr/api/list.json?crtfc_key=${key}` +
      `&bgn_de=${begin}&end_de=${end}&page_no=1&page_count=100&sort=date&sort_mth=desc`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ items: [], error: "dart_" + res.status });
    const j = await res.json();
    if (j.status !== "000") return NextResponse.json({ items: [], error: "dart_" + j.status });

    const items: DartItem[] = ((j.list ?? []) as Record<string, string>[])
      .filter((r) => (r.stock_code || "").trim()) // 상장사만
      .slice(0, 20)
      .map((r) => {
        const rcpNo = (r.rcept_no || "").trim();
        return {
          corp: (r.corp_name || "").trim(),
          title: (r.report_nm || "").trim(),
          cls: CLS[r.corp_cls] || "",
          stockCode: (r.stock_code || "").trim(),
          filer: (r.flr_nm || "").trim(),
          date: (r.rcept_dt || "").trim(),
          rcpNo,
          link: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rcpNo}`,
        };
      });

    const data = { items };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/DartFeed.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

type DartItem = {
  corp: string; title: string; cls: string; stockCode: string;
  filer: string; date: string; rcpNo: string; link: string;
};

function dateLabel(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6), d = +yyyymmdd.slice(6, 8);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff <= 0) return '오늘';
  if (diff === 1) return '어제';
  return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
}

export default function DartFeed() {
  const [items, setItems] = useState<DartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dart/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">최신 공시 불러오는 중…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">공시를 불러오지 못했습니다.</p>;

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">최신 공시</p>
      <ul>
        {items.map((it) => (
          <li key={it.rcpNo}>
            <a href={it.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 border-b border-unjong-border py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{it.corp}</span>
                  {it.cls ? <span className="shrink-0 rounded bg-unjong-background px-1 py-0.5 text-[10px] text-unjong-muted">{it.cls}</span> : null}
                </div>
                <p className="line-clamp-2 text-[13px] text-unjong-primary">{it.title}</p>
                <p className="mt-0.5 text-xs text-unjong-muted">{it.filer} · {dateLabel(it.date)}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 금융감독원 전자공시시스템(DART). 클릭 시 DART 원문으로 연결됩니다.</p>
    </div>
  );
}
```

---

## 📄 파일 3 (수정 2곳) — `components/toolbox/ToolboxClient.tsx`

### 1 — import 추가
**찾기:**
```tsx
import NewsFeed from './NewsFeed';
```
**바꾸기:**
```tsx
import NewsFeed from './NewsFeed';
import DartFeed from './DartFeed';
```

### 2 — 디스패처: 뉴스·공시는 피드 포함 레이아웃으로 (링크 없어도 피드 표시)
**찾기:**
```tsx
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {catLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isLoggedIn={isLoggedIn}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
            {activeTab === 'news' && country === 'KR' ? (
              <aside className="hidden w-96 shrink-0 lg:block">
                <NewsFeed />
              </aside>
            ) : null}
          </div>
        )}
```
**바꾸기:**
```tsx
        ) : (activeTab === 'news' || activeTab === 'disclosure') && country === 'KR' ? (
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {catLinks.length > 0 ? (
                catLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    isLoggedIn={isLoggedIn}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))
              ) : (
                <p className="py-10 text-center text-sm text-unjong-muted">큐레이션 링크 준비 중</p>
              )}
            </div>
            <aside className="hidden w-96 shrink-0 lg:block">
              {activeTab === 'news' ? <NewsFeed /> : <DartFeed />}
            </aside>
          </div>
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {catLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isLoggedIn={isLoggedIn}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        )}
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ dev 서버 완전 재시작 (env + 라우트 갱신)
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```

### 확인
1. **공시·신용 탭** → 좌측 링크, **우측에 최신 공시 20건**(회사명·보고서명·제출인·날짜).
2. 공시 클릭 → DART 원문 뷰어 새 탭.
3. 콘솔: `fetch('/api/dart/feed').then(r=>r.json()).then(j=>console.log(j.items?.length, j.error))` → 20, undefined.

> 키 없으면 `no_key`, DART 한도 초과면 `dart_020` — `.env.local` 확인 + 재시작.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/dart/feed/route.ts components/toolbox/DartFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(disclosure): 공시·신용 탭 우측 DART 최신 전자공시 피드 (STEP 337)" && git push
```

---

> **한 줄 요약**: 공시·신용 탭에 DART 공식 API로 상장사 최신 전자공시 20건 우측 피드 추가. 피드 파일럿 2탄(공식 데이터).
