<!-- 2026-07-14 -->
# STEP 724 — Tier 3: 공시요약(R1) 영어 · 나머지 5개국 (kr·jp·cn·gb·vn)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(723 패턴을 5개 라우트에 복제 + 5개 클라 + 각 영어 프롬프트. KR byte 동일. `/clear` 후.)
**목표:** `/en`에서 KR·JP·CN·GB·VN 종목의 공시요약도 **영어 생성 + `filing_summaries.summary_en`**. ko 경로 불변. **이걸로 Tier 3 완결** → `/en` 로고 빼고 100% 영어.
**전제:** STEP 723(`9329993`). `filing_summaries.summary_ko` nullable·`summary_en` 존재(공유 테이블·**마이그레이션 없음**). 723이 US로 패턴 확립.
**대상:** `app/api/{kr,jp,cn,gb,vn}-events/summary/route.ts` (5) + 각 공시요약 클라 컴포넌트 (5).

---

## 🔒 절대 규칙 (723과 동일)
- **KR byte 동일**: 각 라우트 ko 경로 = `summary_ko` read/write·ko 프롬프트 전부 현행.
- **캐시 컬럼 분리**: en=`summary_en`, ko=`summary_ko`(accession 전역 키·컬럼만 분기). upsert payload엔 해당 로케일 컬럼만.
- **원문 소스는 자국어**(DART 한국어·EDINET 일본어·cninfo 중국어·RNS 영어·VN 뉴스) — **요약만 영어**.

## 작업 — 5개 라우트 각각 (723과 동일 패턴)
각 `route.ts`에:
1. `const locale = ...('lang')==='en' ? 'en' : 'ko';`
2. 캐시 컬럼 `col = locale==='en'?'summary_en':'summary_ko'` → select/read `hit?.[col]`.
3. 프롬프트 `locale==='en'`이면 EN(아래 템플릿), 아니면 현행 ko(불변).
4. upsert `{ accession, symbol, [col]: summary, model }` onConflict 'accession'.
> 각 라우트의 **기존 ko 프롬프트를 읽고** 아래 템플릿으로 영어화(라우트별 소스·통화·특이사항 보존). 캐시/LLM/원문fetch 로직은 불변.

### 🔒 EN 프롬프트 템플릿 (가드레일 잠금 — 723과 대칭)
system(각 라우트 소스에 맞게 `{SOURCE}`·`{DOC}`만 교체):
```
You are an analyst conveying {SOURCE} to individual investors — facts only. Summarize only what is actually written in the {DOC}, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the {DOC}. (3) Only "what happened" — facts. (4) Keep numbers and currency exactly as in the source (do not convert). (5) Plain professional English, no filler.
```
| 라우트 | {SOURCE} | {DOC} | 비고 |
|---|---|---|---|
| `kr-events/summary` | Korean DART disclosures | filing | 통화 원(₩) 유지 |
| `jp-events/summary` | Japanese EDINET disclosures | filing | 통화 엔(¥) 유지 |
| `cn-events/summary` | Chinese CNINFO / HKEX disclosures | filing | 위안(¥)/HK$ 유지 |
| `gb-events/summary` | UK RNS regulatory announcements | announcement | 파운드(£) 유지 |
| `vn-events/summary` | Vietnamese company news | article | **공시 아닌 뉴스**(VN 특성)·동(₫) 유지 |
- user 프롬프트도 각 라우트 ko판을 영어로(원문 텍스트 주고 "2-3 English sentences of fact").

## 2. 클라 fetch에 `&lang` (5곳)
- `grep -rn "kr-events/summary\|jp-events/summary\|cn-events/summary\|gb-events/summary\|vn-events/summary" components app` 로 확정 → 각 `<Xx>FilingSummary` 컴포넌트 fetch에 `&lang=${locale}`(`useLocale()`). (723의 AiFilingSummary와 동형.)

## ⚠️ 함정
- 5개 라우트가 구조는 같아도 **원문 fetch 방식이 다름**(PDF·HTML·뉴스) — 캐시/프롬프트만 손대고 **fetch 로직 불변**.
- 각 upsert가 반대 컬럼 null 안 만드는지(컬럼 분리·721~723 교훈).
- VN은 공시 아니라 뉴스요약 — 기존 ko 동작 그대로 두고 언어만.
- Turbopack → `NEXT_DIST_DIR=.next-verify npm run build`.

## 검증 (양쪽·3중)
1. `tsc` 0 · `NEXT_DIST_DIR=.next-verify npm run build` · vitest.
2. **KR 무회귀**(dev): KR/JP/CN/GB/VN 종목 공시요약을 **ko**에서 = 한국어(기존 캐시 히트·현행 동일).
3. **en 신규**: `/en/stock/{각국 공시 있는 종목}`(예 KR 005930·JP 7203.T·GB SHEL.L 등) 공시 펼쳐 = **영어** 요약 생성·`cached:true` 재확인·가드레일. `summary_en` 채워지고 `summary_ko` 독립.
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(Tier3·R1 5개국): kr/jp/cn/gb/vn-events/summary 영어 공시요약(723 패턴 복제·영어 프롬프트+summary_en·KR byte 동일·컬럼 분리)" && git push
```

## 다음 = 🎉 Tier 3 완결 → 문서 동기화(Cowork)
- `/en` = 로고 워드마크(의도적) 외 **한국어 0**(정적 UI + 결정론 데이터 + LLM 생성물 전부 영어). US 영어 시장 제품 완성.
- Cowork 세션 정리: 문서 4종+상태문서 + `LENS_DEV_PLAYBOOK` Tier 3 교훈(en-first INSERT·`*_ko` NOT NULL 함정·컬럼 독립·on-demand per-locale 캐시·swallowed upsert=조용한 LLM 누수).
- 잔여(선택): US 통화기호 title-case · 빈 뉴스 명시상태 UX · OAuth 로케일 쿠키 · 다크 폴리시 D · 클로즈드 베타.
