<!-- 2026-07-15 -->
# STEP 736 — 뉴스 피드 로케일별 번역 (`/en` 헤드라인 영어화 · lang 파라미터)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(라우트 분기별 소폭 수정 + 클라 2줄. Sonnet. `/clear` 후.)

**목표:** `/api/news/feed`가 지금 **무조건 한국어로 번역**(`translateTitles(items, "ko")`)이라, `/en`에서 US·JP·CN·VN 뉴스가 거꾸로 한글로 나오고 KR 뉴스는 한글 그대로. **`lang` 파라미터**로 로케일별 번역: en이면 KR/JP/CN/VN→영어, ko면 현행. **기존 무료 구글번역(키리스)+`translation_cache` 재사용 → 추가 비용 ≈ 0.** ko 동작 100% 보존.

**전제:** 735(`868c8a5`) 이후. `translation_cache(target_lang, src_text, translated)` 존재. `translateOne`/`translateTitles`(키리스 구글번역+캐시) 이미 있음.

**대상:** `app/api/news/feed/route.ts`(분기별 target화 + 인메모리 cache 키에 target) + `components/toolbox/NewsFeed.tsx`(클라 `&lang`).

---

## 파일 1 — `app/api/news/feed/route.ts`
### (a) GET 시작부: `lang`→`target` + cache 키 헬퍼
`export async function GET(req: Request) {` 직후, 기존 `const market = ...` 를 아래로 교체:
```ts
  const sp = new URL(req.url).searchParams;
  const market = (sp.get("market") || sp.get("country") || "").trim().toUpperCase();
  const target = sp.get("lang") === "en" ? "en" : "ko"; // 로케일별 번역 타깃(기본 ko)
  const ck = (k: string) => target + ":" + k;            // 인메모리 cache 키에 target 포함(ko/en 충돌 방지)
```
> 이후 `new URL(req.url).searchParams.get("q")`들은 그대로 둬도 되지만, 이미 만든 `sp`를 써도 됨(선택).

### (b) 각 분기: cache 키를 `ck(...)`로 감싸고 `translateTitles` target화
아래처럼 **각 분기의 cache.get/set 키 + translateTitles 호출**을 바꾼다. **키를 반드시 `ck()`로** (안 그러면 ko/en 캐시 충돌).

**US 분기** (q 있는 경우):
```ts
      const key = ck("US:" + q);
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < 15 * 60 * 1000) return NextResponse.json(hit.data);
      try {
        const items = await googleNews(q, "en-US", "US", "US:en");
        // US=영어 소스: en이면 그대로, ko면 한국어 번역(현행)
        const data = { items: target === "en" ? items : await translateTitles(items, "ko") };
        cache.set(key, { at: Date.now(), data });
        return NextResponse.json(data);
```
**US 분기** (메인 뉴스, q 없음): `cache.get("US")`/`cache.set("US"...)` → `ck("US")`, 그리고
```ts
      const data = { items: target === "en" ? items : await translateTitles(items, "ko") };
```

**JP 분기**: `const key = ck("JP:" + q);` (get/set 동일 key) + `const data = { items: await translateTitles(items, target) };`
**CN 분기**: `const key = ck("CN:" + q);` + `const data = { items: await translateTitles(items, target) };`
**VN 분기**: `const key = ck("VN:" + q);` + `const data = { items: await translateTitles(items, target) };`
**GB 분기**: `const key = ck("GB:" + q);` (영어 소스라 **번역 없음 유지**) + `const data = { items };` (그대로)
**KR 분기**(맨 끝·네이버): cache 키 `cache.get(q)`/`cache.set(q...)` → `cache.get(ck(q))`/`cache.set(ck(q)...)`. 그리고 최종 반환 직전:
```ts
    // KR=한국어 소스: en이면 영어 번역, ko면 그대로(현행)
    const data = { items: target === "en" ? await translateTitles(items, "en") : items };
    cache.set(ck(q), { at: Date.now(), data });
    return NextResponse.json(data);
```

**요지 표**:
| market | 소스 | ko(현행) | en(신규) |
|---|---|---|---|
| US | en | →ko 번역 | 그대로(en) |
| GB | en | 그대로(en·불변) | 그대로(en) |
| KR | ko | 그대로(ko) | →en 번역 |
| JP | ja | →ko | →en |
| CN | zh | →ko | →en |
| VN | vi | →ko | →en |

> `translateTitles`는 이미 `translation_cache`를 `target_lang`별로 캐시하므로 en/ko 캐시 분리·재번역 없음. `translateOne`은 소스==타깃이면 원문 유지(안전).

## 파일 2 — `components/toolbox/NewsFeed.tsx` (클라 `&lang` 전달)
1. import에 `useLocale` 추가: `import { useTranslations, useLocale } from 'next-intl';`(기존 useTranslations 옆).
2. 컴포넌트 상단(`const t = useTranslations('Feed');` 아래): `const locale = useLocale();`
3. `url` 조립 마지막에 `&lang` 부착 — 각 분기 문자열 끝에 붙이거나, 조립 후 한 줄로:
```ts
  const urlBase = /* 기존 삼항 url 로직 */;
  const url = urlBase + (urlBase.includes("?") ? "&" : "?") + "lang=" + locale;
```
   (기존 `const url = isGb ? ... : ...;` 를 `const urlBase = isGb ? ... : ...;` 로 바꾸고 위 한 줄 추가.)
4. `cacheKey`에 locale 포함: `const cacheKey = 'news:' + country + ':' + locale + ':' + (query ?? '');`

## ⚠️ 주의
- **ko 동작 100% 보존**: target=ko 경로는 기존과 동일(US→ko·JP/CN/VN→ko·KR 그대로·GB 그대로). 표로 확인.
- **비용**: OpenAI 아님 — 기존 **키리스 무료 구글번역**(`translateOne`)+캐시 재사용. 추가 비용 사실상 0.
- **cache 키 target 필수**: `ck()` 안 씌우면 ko/en 응답이 인메모리 캐시에서 섞임(정확성 버그).
- 링크(`link`)·이미지·소스는 불변, **title만** 번역. 원문 링크로 이동.
- 번역 품질: 구글번역이라 완벽친 않아도 헤드라인 이해엔 충분(기존 US→ko도 이 방식).

## 검증
1. `npx tsc --noEmit` → 0. 2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공. 3. `npx vitest run` 통과.
2. dev 실측:
   - `/api/news/feed?market=KR&q=증시&lang=en` → items title이 **영어**. `&lang=ko`(또는 lang 없이) → 한글(현행).
   - `/api/news/feed?market=US&q=IPO&lang=en` → **영어 원문**(번역 안 함). `&lang=ko` → 한글(현행).
   - `/api/news/feed?market=JP&lang=en` → 영어. `&lang=ko` → 한글.
3. 화면: `/en` KR·JP·CN·VN 시장 뉴스 피드 헤드라인 **영어**. `/ko` 전 시장 **현행 그대로**(US·JP·CN·VN→한글·KR 한글). `/en` US 뉴스=영어.

## 커밋
```bash
git add -A && git commit -m "i18n(736): 뉴스 피드 로케일별 번역 — /api/news/feed lang 파라미터(en=KR/JP/CN/VN→영어·US/GB 그대로·ko 현행 보존)+cache 키 target 분리+NewsFeed &lang·기존 무료 구글번역+translation_cache 재사용(추가비용≈0)" && git push
```

## 다음
- 배포 후 Cowork 라이브 실측(/en KR/JP/CN/VN 뉴스 영어·/ko 현행).
- **세션 문서 동기화**(730~736 + /about + link_hub) — 이번 라운드 다 끝난 뒤 한 번에.
