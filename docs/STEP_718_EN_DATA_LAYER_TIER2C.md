<!-- 2026-07-14 -->
# STEP 718 — 영어 데이터 레이어 · Tier 2c (렌즈 note 6개 + short/long)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(긴 백테스트 note **정확 번역**(수치·통계·레퍼런스 보존) + short/long 이중언어·KR byte 동일. `/clear` 후.)
**목표:** `/en` 렌즈 카드의 마지막 한국어 — **note("자세히" 백테스트 설명 6개)** 영어화 + **short/long 죽은 필드**(현 미렌더·landmine) 이중언어 정리. 이걸로 **결정론 데이터 레이어 100% 영어화 완결**(LLM 제외).
**전제:** STEP 717(`a9d9ad7`). Tier 1·2a·2b 완료.
**범위 밖(Tier 3·보류):** 브리핑·news-brief·공시 AI요약(LLM 생성물).

---

## 🔒 절대 규칙 — KR byte 동일
`lib/lenses.ts`·`momentum/lowvol/technical.ts`는 KR 공유. 변경 후 **`/stock/{KR}`의 note·short·long이 현재와 100% 동일**. 추가 영어는 `en`만. charac 테스트(717에서 38개)로 고정.

## 1. note 6개 → LENS_COPY 이중언어
- 현재 `lib/lenses.ts`에 각 렌즈 `note: "긴 한국어..."` 인라인 리터럴(momentum `:86`·technical `:129`·valuation `:161`·lowvol `:192`·quality `:226`·assetgrowth `:260`).
- `lib/lensCopy.ts` `LENS_COPY`의 각 렌즈에 **`note` 필드 추가**(ko/en). ko=**현재 리터럴 그대로**(오타·중점·괄호까지). en=**정확 번역**.
- `lib/lenses.ts`: `note: "..."` → `note: c.note`(`c = LENS_COPY[locale].<lens>` 이미 있음).
- **⚠️ en 번역 원칙(중요)**: 단순 직역 아님 — **모든 통계·수치·레퍼런스를 정확히 보존**: `t≈2.5`·`샤프 0.71`·`FF3`·`CAPM`·`βHML≈0.71`·`STEP559`·`양(+)의 달 67%`·`$5+`·백분율 전부 그대로. 톤=**멍거 건조·사실·회의적**(과장 금지·"보장 아님"류 정직 뉘앙스 유지). 학술 용어는 표준 영어(Gross Profitability·Jegadeesh-Titman·Novy-Marx·survivorship bias·turnover·long-short·alpha). 축약형 회피(ICU 아님이라 필수는 아니나 톤 일치). 3중 교차검증(`3중 교차검증`)=triple cross-validation 등 일관.
- (선택) note가 길어 en.json이 아니라 `lensCopy.ts`(TS)에 두는 게 맞음 — 이미 name/what/about이 거기.

## 2. short/long 이중언어 (죽은 필드·landmine 제거)
현 미렌더지만 한국어 하드코딩 → 나중 렌더 시 터짐. 이중언어로:
- **인라인 labs(`lib/lenses.ts`)**: momentum `lab` `강세/약세/중립`(`:66`) · valuation `peLab` `낮음/높음/보통`(`:141`) · quality `lab` `높음/낮음/보통`(`:206`) · assetgrowth `lab` `공격적/보수적/보통`(`:240`). → 상태값(state)은 그대로 두고 **표시 라벨만 이중언어 맵**(`lib/lensCopy.ts`에 `LEVEL_LABELS[locale]` 같은 작은 맵·ko=현재 정확). state→label을 locale로.
- **공유 라벨 함수**: `momentumLabel`(`lib/momentum.ts`)·`volLabel`(`lib/lowvol.ts`)·`rsiState`·`maTrend`(`lib/technical.ts`)가 한국어 반환. → **locale 인자 추가**하거나 state만 반환하고 lenses.ts에서 이중언어 라벨 적용. **⚠️ 이 함수들의 다른 호출부 grep 필수**(보드·미리보기 등서 쓰면 거기도 반영·KR 무회귀 확인).
- KR: ko 라벨 = 현재 정확히 동일.

## ⚠️ 함정
- `lib/*` 순수 모듈 — locale 인자로.
- note는 **길어서 번역 누락·수치 오타 위험** → 원문 대비 수치·레퍼런스 대조(아래 검증).
- short/long 라벨 함수 다른 호출부 놓치면 그 화면 깨짐 → grep 전수.
- Turbopack: `NEXT_DIST_DIR=.next-verify npm run build`(dev 보호). 빌드가 tsconfig에 `.next-verify` 주입하면 되돌리기(717 교훈).

## 검증 (양쪽·3중)
1. `tsc --noEmit` 0 · `npm test`(charac 38+·ko byte 동일) · `NEXT_DIST_DIR=.next-verify npm run build`.
2. **KR 무회귀**(dev): `/stock/005930` 렌즈 카드 "자세히" 펼쳐 — note 6개·short/long **현재와 100% 동일**(글자 단위).
3. **en 신규**: `/en/stock/MU` 카드 "details note" 펼쳐 — note 영어 + **수치·레퍼런스 원문과 일치**(t값·샤프·STEP번호·%). 
4. **잔여 한국어 최종 스캔**: `/en/stock/MU`·`/en/stock/AAPL` 카드 전개·이벤트·미리보기 훑어 **결정론 한국어 0** 확인(남으면 브리핑·공시요약=Tier3 LLM만). `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(데이터 Tier2c·완결): 렌즈 note 6개 영어 번역 + short/long 이중언어 (KR byte 동일·결정론 데이터 100% 영어화·LLM 제외)" && git push
```

## 다음 = 결정론 데이터 레이어 완결 🎉
- `/en`에서 **LLM 생성물(브리핑·news-brief·공시 AI요약)만 한국어** 남음 = Tier 3.
- **Tier 3 결정(별도)**: 영어 프롬프트 + per-locale 캐시(`*_en` 컬럼 or 키에 lang) + DB 마이그레이션 + LLM 2배 비용. 규모·비용 있어 사용자 확인 후.
- (선택 저우선) h1 영문명 대문자(MICRON TECHNOLOGY INC) 스마트 title-case or DB 정규화.
