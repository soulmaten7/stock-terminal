<!-- 2026-07-14 -->
# STEP 721 — Tier 3: 브리핑(R2) 영어 (`/api/brief`)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(유료 LLM 프롬프트 + DB 캐시 컬럼 정확성 + **KR byte 동일** + 가드레일. `/clear` 후.)
**목표:** `/en`에서 종목 브리핑을 **영어로 생성 + `brief_en` 컬럼에 on-demand 캐시**. ko 경로(프롬프트·`brief_ko`·facts)는 **완전 불변**.
**전제:** STEP 720(마이그레이션 라이브·`stock_briefings.brief_en` 존재·기록 `2645cf9`). 설계 `docs/TIER3_LLM_I18N_DESIGN.md`.
**대상:** `app/api/brief/route.ts`(주) + 클라 fetch 2곳.

---

## 🔒 절대 규칙
- **KR byte 동일**: ko 경로 = `brief_ko` read/write·ko 프롬프트·ko facts 전부 현재 그대로. `computeSymbolLenses(symbol, 'ko')`는 기본값과 동일 출력.
- **캐시 컬럼 분리 = 충돌 차단**: 로케일별로 `brief_ko`/`brief_en` **각각** read/write. **upsert payload엔 해당 로케일 컬럼만** 넣어 반대 로케일 안 지움(Supabase upsert는 payload 키만 UPDATE).
- **on-demand**: en 첫 조회 시만 생성. 기존 ko 캐시 무손상.

## 작업
### 1. `app/api/brief/route.ts`
- **lang 수용**: `const locale = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko';`
- **캐시 컬럼**: `const col = locale === 'en' ? 'brief_en' : 'brief_ko';` → `.select(col).eq('symbol',...).eq('as_of',...)`, `if (hit?.[col]) return {brief: hit[col], cached:true}`.
- **렌즈 로케일**: `computeSymbolLenses(symbol, locale)`(715에서 lens 이중언어). → `l.name`·`l.grade`·`l.verdict.phrase`·`l.headline`이 로케일 반영.
- **facts 라벨 로케일화**(현재 한국어 리터럴):
  - `H` 맵: `locale==='en' ? {short:'Short',mid:'Mid',long:'Long'} : {short:'단기',mid:'중기',long:'장기'}`
  - F-Score 줄: en `- F-Score (long-term · financial health): ${fsc.score}/${fsc.max} (${fsc.grade})` / ko 현행.
  - 이벤트 fallback `(최근 중대 공시 없음)`→ en `(No recent material filings)`. 8-K 줄의 `※재무 렌즈 근거 갱신 가능`→ en `※ may refresh the financial-lens basis`(8-K label은 716서 이미 이중언어라 `e.defs[0].label`은 로케일 반영 — `fetchMaterial8K`에 lang 넘기는지 확인·안 넘어가면 en label 안 나옴).
  - facts 헤더: en `Stock: ${symbol}` / `[Proven-method verdicts]` / `[Recent material filings]` · ko 현행.
- **시스템 프롬프트**: `locale==='en' ? BRIEF_SYSTEM_EN : BRIEF_SYSTEM`(ko 불변). 유저 프롬프트도 en: `Below are our deterministic methods' verdicts and recent filing facts for this stock. Write a briefing based on them:\n\n${facts}`.
- **upsert**: `{ symbol, as_of, [col]: brief, model:'gpt-4o-mini' }` (계산된 키 `[col]`로 해당 로케일 컬럼만). onConflict 그대로.

### 🔒 BRIEF_SYSTEM_EN (그대로 — 가드레일·톤 잠금)
```
You are an analyst briefing a stock to individual investors. Write a 3-4 sentence English briefing based ONLY on the given "proven-method verdicts" and "recent filing facts."
Rules (must): (1) No forecasts, outlook, or investment recommendations — never say "will rise/fall, buy/sell, target price, opportunity, now is the time," etc. (2) The core is ⓐ pointing out the tension (divergence) across time horizons and methods, and ⓑ pointing to what to watch (observable catalysts/facts). (3) Do not add content or numbers not in the facts. "Recent material filings" are already-received past facts, so do not call them upcoming or expected. (4) Keep a stance of not judging direction (do not attach a disclaimer every time). (5) Plain professional English, no filler, one paragraph.
Example tone: "It runs hot in the short term while mid- and long-term read strong — the grain differs by time horizon. Financials and quality are favorable, but value is on the expensive side, so growth carries a premium here. A recent earnings filing may have refreshed the basis for the financial lens, so the cooling of the overheating and the next results are worth watching."
```

### 2. 클라 fetch에 `&lang`
- `components/toolbox/LensPreview.tsx`(brief fetch ~`:61`) + `app/[locale]/stock/[symbol]/StockLensClient.tsx`(brief fetch ~`:751`): `/api/brief?symbol=...` → `...&lang=${locale}`(`useLocale()` 이미 있음).

## ⚠️ 함정
- **upsert가 반대 컬럼 null 안 만드는지** 실측: en 생성 후 같은 종목 ko가 여전히 브리핑 나오는지(컬럼 독립).
- `fetchMaterial8K`/`fetchDartMaterial`에 lang 배선 필요 여부 확인 — 8-K label이 en으로 나오려면 lang 전달(716 참조). DART report_nm은 한국어 원문(정상·소스언어).
- LLM 키 없으면(`no_key`) 기존대로 500. 비용=on-demand.
- Turbopack API 라우트 변경 → 클린 재시작(`NEXT_DIST_DIR=.next-verify` 빌드).

## 검증 (양쪽·3중)
1. `tsc` 0 · `NEXT_DIST_DIR=.next-verify npm run build` · vitest.
2. **KR 무회귀**(dev): `/stock/005930` 브리핑 = 한국어(기존 `brief_ko` 캐시 히트라 재생성 0·현행 동일).
3. **en 신규**: `/en/stock/MU` 브리핑 = **영어** 생성(첫 조회)·재조회 시 `cached:true`(brief_en 히트)·예측/추천 문구 없음(가드레일). DB에 `brief_en` 채워지고 `brief_ko`는 그대로(컬럼 독립 확인).
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(Tier3·R2): /api/brief 영어 브리핑(영어 프롬프트+lang+brief_en on-demand+lens facts 로케일·KR byte 동일·컬럼 분리)" && git push
```

## 다음
- **722**: `/api/news-brief`(R3) 영어 — 영어 프롬프트+`summary_en`+**한국어 강제 후처리 en 게이팅**(비한국어→한국어 재번역·통화어 주입을 `locale==='ko'`로 감쌈).
- **723**: 공시요약(R1) 6라우트(`*-events/summary`) 영어 프롬프트+`filing_summaries.summary_en`.
