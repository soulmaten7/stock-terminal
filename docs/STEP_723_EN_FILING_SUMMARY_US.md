<!-- 2026-07-14 -->
# STEP 723 — Tier 3: 공시요약(R1) 영어 · US 8-K (`/api/events/summary`)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(LLM 프롬프트 + 캐시 컬럼 + KR byte 동일. `/clear` 후. 721·722와 동일 패턴.)
**목표:** `/en`에서 US 8-K 공시요약을 **영어 생성 + `filing_summaries.summary_en`에 캐시**(accession 전역 키). ko 경로 불변. **US = /en 주 케이스**(패턴 확립·검증).
**전제:** STEP 722(`60d5d8b`). **`filing_summaries.summary_ko` NOT NULL 이미 제거**(MCP 라이브·en-first 벽). Claude Code는 기록 파일만.
**대상:** `app/api/events/summary/route.ts` + US 공시요약 클라 1곳.
**범위 밖:** 나머지 5개국(`kr/jp/cn/gb/vn-events/summary`)=**724**(같은 패턴 복제).

---

## 0. 스키마 기록 (이미 라이브·파일만)
`supabase/migrations/20260714_filing_summaries_ko_nullable.sql`:
```sql
-- Tier 3 R1: en-first INSERT는 {accession, summary_en}만 → summary_ko NULL 허용.
ALTER TABLE public.filing_summaries ALTER COLUMN summary_ko DROP NOT NULL;
-- (라이브 적용됨 via Supabase MCP · 이 파일 = repo 기록.)
```

## 🔒 절대 규칙
- **KR byte 동일**: ko 경로 = `summary_ko` read/write·ko 프롬프트 전부 현행.
- **캐시 컬럼 분리**: en=`summary_en`, ko=`summary_ko`(accession 전역 키 동일·컬럼만 분기). upsert payload엔 해당 로케일 컬럼만(반대 안 지움).
- **on-demand**: en 첫 조회만 생성. `filing_summaries`는 as_of 없이 accession 영구 캐시(공시 내용 불변).

## 작업 — `app/api/events/summary/route.ts`
1. **lang 수용**: `const locale = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko';`
2. **캐시**: `const col = locale === 'en' ? 'summary_en' : 'summary_ko';` → `.select(col).eq('accession', acc)`, `if (hit?.[col]) return {summary: hit[col], cached:true}`.
3. **프롬프트**: `locale==='en'`이면 아래 EN system/user, 아니면 현행 ko(불변).
4. **upsert**: `{ accession: acc, symbol, [col]: summary, model }` onConflict 'accession'. (계산 키 `[col]`로 해당 로케일만.)
5. 반환 `{ summary, cached }`.

### 🔒 EN 프롬프트 (그대로 — 가드레일 잠금·한국어판과 대칭)
- system:
```
You are an analyst conveying US SEC filings to individual investors — facts only. Summarize only what is actually written in the filing, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the filing. (3) Only "what happened" — facts. (4) Keep numbers exactly as in the filing. (5) Plain professional English, no filler.
```
- user:
```
This is the text of an 8-K filing (item ${items || '?'}). In 2-3 English sentences, summarize the facts of what happened:

${text}
```

## 2. 클라 fetch에 `&lang`
- US 공시요약을 부르는 컴포넌트(`/api/events/summary?...` fetch — `grep -rn "events/summary" components app`로 확정·`AiFilingSummary` 계열)에 `&lang=${locale}`(`useLocale()`). **`/api/kr-events/summary` 등 다른 5개는 이번 X(724).**

## ⚠️ 함정
- SEC Archives SSRF 정규식·`fetchFilingText` 등 로직 **불변**(캐시/프롬프트만).
- upsert가 반대 컬럼 null 안 만드는지 실측(721·722 교훈).
- Turbopack API 변경 → `NEXT_DIST_DIR=.next-verify npm run build`.

## 검증 (양쪽·3중)
1. `tsc` 0 · `NEXT_DIST_DIR=.next-verify npm run build` · vitest.
2. **KR 무회귀**(dev): US 종목의 8-K를 **ko**에서 열면 한국어 요약(기존 `summary_ko` 히트·현행 동일).
3. **en 신규**: `/en/stock/{공시 있는 US 종목}`(예 최근 8-K 있는 종목)에서 공시 펼쳐 요약 = **영어** 생성·재조회 `cached:true`(summary_en)·가드레일(예측·목표가 없음). DB `filing_summaries`에 `summary_en` 채워지고 `summary_ko` 독립.
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(Tier3·R1 US): /api/events/summary 영어 공시요약(영어 프롬프트+summary_en+accession 전역 캐시·KR byte 동일·컬럼 분리)" && git push
```

## 다음
- **724**: 나머지 5개국 공시요약(`kr/jp/cn/gb/vn-events/summary`) — **723과 동일 패턴 복제**(lang+summary_en 컬럼+영어 프롬프트[각 소스=DART·EDINET·cninfo/HKEX·RNS·뉴스]+클라 5곳). 원문 소스는 자국어(요약만 영어).
- 그 후 = **Tier 3 완결** → `/en` 로고 빼고 100% 영어. 문서 동기화 + LENS_DEV_PLAYBOOK(Tier 3 교훈: en-first INSERT·NOT NULL·컬럼 독립).
