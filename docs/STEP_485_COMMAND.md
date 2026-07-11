<!-- 2026-07-01 -->
# STEP 485 — 피드 제목 번역 (비공식 구글번역 + translation_cache)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_485_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`app/api/news/feed/route.ts` 1파일)
우리 화면에서 내보내는 **피드 기사 제목을 UI 언어(현재 한국어)로 서버에서 번역**. 리스트 이름(사이트·증권사·종목)은 번역 X — 갖고오는 콘텐츠(제목)만.
- 엔진 = **비공식 구글번역**(키리스, 프로토타입). `translation_cache` 테이블로 재번역 최소화. **실패/동일 시 원문 유지**(안 깨짐).
- 적용 = US(영문)·JP(일본어) 분기 → ko. KR은 이미 한국어라 제외.
- ⚠️ **`translation_cache` 테이블은 이미 생성됨**(Cowork MCP). API 라우트라 클린 재시작 필요.
> 나중에 언어 스위처 붙으면 `"ko"` 자리에 UI 언어를 넣으면 각 언어권 번역으로 자동 확장.

---

## 1) 최상단 import 추가
**찾을 것:**
```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
```
**바꿀 것:**
```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createAdminClient } from "@/lib/supabase/admin";
```

## 2) `googleNews` 함수 **닫는 `}` 다음**(현재 124번째 줄), `export async function GET` **앞에** 번역 헬퍼 추가
```ts

// ── 번역(비공식 구글번역·키리스) + translation_cache ──
async function translateOne(text: string, target: string): Promise<string | null> {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
      target + "&dt=t&q=" + encodeURIComponent(text);
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const j = (await res.json()) as [Array<[string]>];
    const out = (j[0] || []).map((s) => (s && s[0]) || "").join("");
    return out || null;
  } catch {
    return null;
  }
}

async function transMapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>): Promise<void> {
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
}

// 기사 제목을 target 언어로 번역(캐시 우선). 실패/동일 시 원문 유지.
async function translateTitles(items: NewsItem[], target: string): Promise<NewsItem[]> {
  if (!items.length) return items;
  try {
    const sb = createAdminClient();
    const titles = [...new Set(items.map((i) => i.title).filter(Boolean))];
    const map = new Map<string, string>();
    const { data: cached } = await sb
      .from("translation_cache")
      .select("src_text,translated")
      .eq("target_lang", target)
      .in("src_text", titles);
    for (const c of (cached || []) as { src_text: string; translated: string }[]) map.set(c.src_text, c.translated);
    const misses = titles.filter((t) => !map.has(t));
    const newRows: { target_lang: string; src_text: string; translated: string }[] = [];
    await transMapLimit(misses, 8, async (t) => {
      const tr = await translateOne(t, target);
      if (tr && tr !== t) { map.set(t, tr); newRows.push({ target_lang: target, src_text: t, translated: tr }); }
    });
    if (newRows.length) {
      try { await sb.from("translation_cache").upsert(newRows, { onConflict: "target_lang,src_text" }); } catch {}
    }
    return items.map((i) => ({ ...i, title: map.get(i.title) || i.title }));
  } catch {
    return items;
  }
}
```

## 3) US 토픽 분기 — 제목 번역
**찾을 것:**
```ts
        const items = await googleNews(q, "en-US", "US", "US:en");
        const data = { items };
```
**바꿀 것:**
```ts
        const items = await googleNews(q, "en-US", "US", "US:en");
        const data = { items: await translateTitles(items, "ko") };
```

## 4) US 메인 뉴스 분기 — 제목 번역
**찾을 것:**
```ts
      const items = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];
      const data = { items };
```
**바꿀 것:**
```ts
      const items = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];
      const data = { items: await translateTitles(items, "ko") };
```

## 5) JP 분기 — 제목 번역
**찾을 것:**
```ts
      const items = await googleNews(q || "日経平均 株式市場 日本株", "ja", "JP", "JP:ja");
      const data = { items };
```
**바꿀 것:**
```ts
      const items = await googleNews(q || "日経平均 株式市場 日本株", "ja", "JP", "JP:ja");
      const data = { items: await translateTitles(items, "ko") };
```

---

## 6) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 7) 검증 (localhost:3333)
- [ ] 🇯🇵 일본 → 뉴스: 최신뉴스 제목이 **한국어로 번역**되어 표시(예: "닛케이 평균, 속신으로…"). 소스·시간·링크는 그대로, 클릭은 원문.
- [ ] 🇺🇸 미국 → 뉴스/리포트: 영문 제목이 한국어로.
- [ ] 🇰🇷 한국: 그대로(원래 한국어).
- [ ] 링크 리스트 이름(日本経済新聞 등)은 **번역 안 됨**(의도대로).
- [ ] 두 번째 로딩부터 빠름(캐시). 번역 실패해도 원문 표시(안 깨짐).

## 8) 커밋 (배포는 사용자 판단)
```bash
git add app/api/news/feed/route.ts && git commit -m "feat: 피드 기사 제목 번역(비공식 구글번역+translation_cache) → UI 언어(ko). 실패 시 원문 유지 (STEP 485)"
```

## ⚠️ 노트
- 비공식 엔드포인트라 prod(Vercel IP)에서 간혹 막힐 수 있음 → 그 경우 원문 표시(graceful). 안정화 원하면 나중에 공식 API(구글/DeepL)로 `translateOne`만 교체.
- 지금은 뉴스형 피드(제목)만. 공시(SEC)·거시(FRED) 피드 번역은 후속(원하면).
