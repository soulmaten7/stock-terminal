<!-- 2026-06-26 -->
# STEP 415 — US 공시 피드 (SEC EDGAR · flagship)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_415_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Trillion의 **간판 기능 = "흩어진 금융정보를 한눈에"**. 한국에는 이미 DART 공시 피드(공시·신용 탭, KR)가 붙어 있다. 이번 STEP은 그 **미국 짝(flagship)** 을 추가한다 → 미국 모드 공시 탭 우측에 **SEC EDGAR 실시간 8-K 공시** 피드.

- **검증된 소스**: SEC EDGAR `getcurrent` Atom 피드 (실시간 오늘자 제출분, HTTP 200 확인).
  `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&count=40&output=atom`
- **Atom 포맷**(RSS `<item>` 아님 → `<entry>`). 각 `<entry>` 안에 `<title>` `<updated>` `<link rel="alternate" href="…">` `<category term="8-K">`.
- **SEC는 User-Agent 선언 필수** — 없으면 403 차단. `process.env.SEC_USER_AGENT || 'Trillion/1.0 (contact@onetrillion.app)'`.
- 응답 shape는 **DART 피드(`/api/dart/feed`)와 동일** → 새 `SecFeed`가 `DartFeed`의 렌더 구조를 그대로 재사용.
- KR DART 동작은 **바이트 단위로 동일**(건드리지 않음). 기존 `app/api/sec/route.ts`(efts 풀텍스트 검색, 별개·미검증)도 손대지 않는다 — 신규 `/api/sec/feed`만 만든다.

## 전제
- 최신 main. 배포 X(배치) — 이 STEP은 **로컬 빌드 + 로컬 커밋만** (push X, vercel X).
- 신규 서버 라우트 1 + 신규 클라 컴포넌트 1 + ToolboxClient 2줄 수정. 빌드 타입검증.
- STEP 413·414 반영본(`FEED_COUNTRY_SUPPORT` / `feedSupports` / `feedFor` 존재) 기준.

---

## 1단계 — 신규 `app/api/sec/feed/route.ts` (전체 내용)

> 검증된 `news/feed` 라우트의 US 분기(정규식 블록 파싱 + `AbortSignal.timeout(8000)` + 인메모리 Map 캐시 + graceful fallback)를 그대로 차용하되, **Atom `<entry>`** 를 파싱한다. 응답 item 필드는 **DART와 동일**(`corp`/`title`/`cls`/`stockCode`/`filer`/`date`/`rcpNo`/`link`)로 맞춰 `SecFeed`가 `DartFeed` 렌더를 재사용하게 한다. (단, `date`는 SEC ISO 타임스탬프 원문을 그대로 담는다 — DART의 `yyyymmdd`와 달리 SecFeed가 자체 포맷팅.)

아래 내용으로 **새 파일** 생성:

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DART 피드(/api/dart/feed)와 동일한 item shape → SecFeed가 DartFeed 렌더를 재사용.
// 미국 매핑: corp=회사명, title=폼 라벨(예 "8-K 공시"), cls=폼 타입(8-K), filer="SEC EDGAR",
//           date=SEC <updated> ISO 원문, rcpNo=link(고유키 용), link=원문 href.
type SecItem = {
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

// SEC는 User-Agent 선언 필수(없으면 403). 연락처 포함 형식 권장.
const SEC_UA = process.env.SEC_USER_AGENT || "Trillion/1.0 (contact@onetrillion.app)";
const SEC_URL =
  "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&count=40&output=atom";

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .trim();
}

export async function GET() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(SEC_URL, {
      headers: { "User-Agent": SEC_UA, Accept: "application/atom+xml" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ items: [], error: "sec_" + res.status });
    const xml = await res.text();

    const items: SecItem[] = [];
    // Atom: <item> 아님 → <entry> 블록.
    const blocks = xml.match(/<entry\b[\s\S]*?<\/entry>/g) ?? [];
    for (const b of blocks) {
      const rawTitle = decode((b.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
      // 예: "8-K - XTI Aerospace, Inc. (0001529113) (Filer)"  → [form, ...rest]
      const dash = rawTitle.indexOf(" - ");
      const form = (dash >= 0 ? rawTitle.slice(0, dash) : rawTitle).trim();
      const rest = dash >= 0 ? rawTitle.slice(dash + 3) : "";
      // 끝의 "(CIK) (Filer)" 제거 → 회사명.
      const corp = rest.replace(/\s*\(\d+\)\s*\([^)]*\)\s*$/, "").trim();
      // 폼 타입: category term="…" 우선, 없으면 title 첫 토큰.
      const cls = ((b.match(/term="([^"]+)"/) ?? ["", form])[1]).trim();
      const date = ((b.match(/<updated>([\s\S]*?)<\/updated>/) ?? ["", ""])[1]).trim();
      // 원문 링크: <link rel="alternate" ... href="…">
      const link = ((b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) ?? ["", ""])[1]).trim();
      if (!corp || !link) continue;
      items.push({
        corp,
        title: `${form} 공시`,
        cls,
        stockCode: "",
        filer: "SEC EDGAR",
        date,
        rcpNo: link, // 고유키
        link,
      });
    }

    const data = { items: items.slice(0, 25) };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
```

---

## 2단계 — 신규 `components/toolbox/SecFeed.tsx` (전체 내용)

> `DartFeed.tsx` 구조(스켈레톤·`clientCache`·행 렌더)를 미러링. clientCache 키 `'sec'`, `fetch('/api/sec/feed')`. 행 = **회사명 · 폼타입(8-K) · 날짜 · 바로가기 링크**. 토큰/스타일은 DartFeed와 동일하게 유지. 날짜는 SEC ISO 타임스탬프(`<updated>`)를 받아 자체 라벨링(오늘/어제/MM.DD).

아래 내용으로 **새 파일** 생성:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';

type SecItem = {
  corp: string; title: string; cls: string; stockCode: string;
  filer: string; date: string; rcpNo: string; link: string;
};

// SEC <updated> ISO 타임스탬프 → 오늘/어제/MM.DD (DartFeed의 dateLabel과 동일 톤, ISO 입력만 다름)
function dateLabel(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso);
  if (isNaN(t.getTime())) return '';
  const date = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff <= 0) return '오늘';
  if (diff === 1) return '어제';
  return `${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')}`;
}

export default function SecFeed() {
  const [items, setItems] = useState<SecItem[]>(() => getCache<SecItem[]>('sec') ?? []);
  const [loading, setLoading] = useState(() => getCache('sec') === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sec/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('sec', list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
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
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: SEC EDGAR (최신 8-K 공시). 클릭 시 SEC 원문으로 연결됩니다.</p>
    </div>
  );
}
```

---

## 3단계 — `components/toolbox/ToolboxClient.tsx` 수정 (3곳)

### (A) import 추가
찾기:
```tsx
import DartFeed from './DartFeed';
```
바꾸기:
```tsx
import DartFeed from './DartFeed';
import SecFeed from './SecFeed';
```

### (B) 공시 피드 국가 지원에 US 추가
찾기:
```tsx
  news: ['KR', 'US'], disclosure: ['KR'], macro: ['KR', 'US'],
```
바꾸기:
```tsx
  news: ['KR', 'US'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
```

### (C) feedFor의 disclosure 분기 — 미국이면 SecFeed
찾기:
```tsx
    case 'disclosure': return <DartFeed />;
```
바꾸기:
```tsx
    case 'disclosure': return country === 'US' ? <SecFeed /> : <DartFeed />;
```

---

## 4단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add app/api/sec/feed/route.ts components/toolbox/SecFeed.tsx components/toolbox/ToolboxClient.tsx
git commit -m "feat(STEP 415): US 공시 피드 — SEC EDGAR 8-K(DART의 미국 짝, flagship)"
```
> ⚠️ **push 금지 · vercel 배포 금지** (배치 배포 — 다음 묶음에서 함께).

---

## 확인
- 빌드 통과(타입 OK).
- **US 모드 → 공시·신용 탭** → 우측 aside에 **SEC 최신 8-K 공시**: 회사명 · 폼타입(8-K) · 날짜(오늘/어제/MM.DD) · 바로가기(클릭 시 SEC 원문 새 탭). 헤더 출처 = "SEC EDGAR (최신 8-K 공시)".
- **KR 모드 → 공시·신용 탭** → 기존 DART 피드 **그대로**(바이트 동일, 변화 없음).
- 탭 전환 즉시 표시(clientCache `'sec'`), 10분 인메모리 캐시, 실패 시 "공시를 불러오지 못했습니다." graceful fallback.

## 스킵/보류 (이번 STEP 범위 외 — 후속)
- 공모주·배당·리포트·실적 피드의 US 버전 = 후속 STEP.
- 8-K 외 폼(10-K / 10-Q / S-1 등) 확장 = 후속 STEP. 이번엔 8-K(중대공시)만.
- `SEC_USER_AGENT` env 미설정 시 코드 기본값(`Trillion/1.0 (contact@onetrillion.app)`)으로 동작 — 운영 시 실제 연락처로 env 지정 권장.
