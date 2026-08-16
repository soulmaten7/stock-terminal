# probe_1050 — `sectorSource` 조인 키 수정 + 기록 신뢰 복구

> STEP1050 실행 기록. 🟠 코드 변경 있음(읽는 쪽만) · 🔵 화면 노출 0(`Q1_ENABLED` OFF 유지) · DB 쓰기 0 · 플래그 무접촉.

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 확인 | 비고 |
|---|---|---|
| WHY | 조건3(왜 그런지 알 수 있어야) | 출처 표시가 그 조건의 실현 — 이번 수정으로 다시 실현됨 |
| HOW | H-7(창작의 경계 — 기만 금지) | "고의로 숨기는 게 아니라 결함으로 숨겨지는 것이라 더 위험하다"는 `probe_1042`의 진단이 오늘 해소됨 |
| WHAT | Layer C(모든 항목에 붙는 층) | 출처·방법론 공개 — 이번 수정의 대상 |
| 관문·순위 | F-4-4 켜기 전 필수② | 이 STEP이 그 ②를 없앰(2건→1건), `docs/ROADMAP_V2.md`·`roadmap_v2.html` 반영 완료 |
| 완성의 정의 | C-1 항목6(주장 정합)·C-3㉡ | 공개 주장과 실제의 어긋남을 없앰·"고쳤다"가 아니라 "값이 실제로 나온다"까지 확인(§1-3) |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인 — `ls`로 전수 확인

```
docs/PARKED_FIELD_SURFACES.md
docs/PARKED_HNX_VCI_ACTIVATION.md
docs/PARKED_KR_DIVIDEND_ACTIVATION.md
docs/PARKED_OAUTH_LOCALE_ACTIVATION.md
docs/PARKED_TERMS_PRIVACY_ACTIVATION.md
```

🔴 **5개다 — `_ACTIVATION`으로 끝나는 건 3개뿐이다.** STEP1048 명령서 ⓪-1b가 "`PARKED_*_ACTIVATION.md` 4종"이라 적었던 것 자체가 오분류였다(3종+`PARKED_FIELD_SURFACES.md`를 합쳐 "4종"이라 세면서도 이름 패턴 문구를 그대로 남겨, 다음 STEP이 그 패턴을 문자 그대로 읽고 `PARKED_FIELD_SURFACES.md`를 놓쳤다). 그 밖에 `probe_1042`·`probe_1049`·`STATE.md`(#27 포함)·`REVDCF_SPEC.md`를 확인했다. `SECTOR_RELATIVE_SPEC.md`는 존재하지 않는다(파일 없음 확인). `KNOWN_ANSWERS.md`에는 이 주제(sectorSource 침묵) 관련 기존 답 없음.

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: `probe_1042`(원인 최초 발견)·`probe_1044`(진단 정정 — 신선도가 아니라 조인 키)·`lib/sector.ts`의 `latestAsOf()`(STEP1004가 이미 만들어 둔 정답 헬퍼) — 새로 만들지 않고 재사용
- **A 원문**: 해당 없음(버그 수정, 원전 대조 아님)
- **B 실무**: 해당 없음
- **C 반대 증거**: 없음(진단이 이미 STEP1044에서 코드로 확정돼 있었음, 재검토 대상 아님)
- **검증**: 우리실측 — ① 코드 대조(크론과 규약 일치 확인) ② 실제 API 호출(real DB, 표본 4종목) — 아래 §1-3
- **검수**: 반박 시도("정말 조인 키였나" — DB 직접 조회로 `us_sector_wide.max(as_of)=2026-08-08` vs `us_valuation.max(as_of)=2026-08-15` 불일치 재확인, 다른 원인 없음) · 수치 출처(전부 오늘 Supabase MCP+로컬 스크립트 실측) · 이전 발언 대조(`STATE.md` #27 정정, 아래 §1-4) · 분기 비중(us_sector_wide 참조 지점 전수 §1-1에서 셈)
- 🔴 **미측정**: F-5 헤더의 "14건" 카운터(STEP1046 기준, STEP1049의 ⑬ 분리·이번 ③ 해소로 이미 갱신 필요하나 이 STEP 범위 밖 — 못 한 것에 별도 기재)

---

## 1-1. `us_sector_wide` 참조 전수

코드 전체(`app/`·`lib/`·`components/`·`scripts/`)에서 `us_sector_wide`를 참조하는 모든 지점을 grep으로 전수 수집했다. 규약별 분류:

### 최신 1건 규약(`.order("as_of",{ascending:false}).limit(1)`) — 정답 패턴

| 위치 | 비고 |
|---|---|
| `app/api/cron/revdcf/route.ts:111` | 크론의 정답 패턴(STEP973) |
| `lib/sector.ts:22-25` (`latestAsOf()`) | STEP1004가 이 패턴을 공용 함수로 추출·export |
| `scripts/verify_step974_local.ts:26` · `scripts/backfill_step973_sector_relative_20260809.ts:22` · `scripts/probe_1006_finally_timing.ts:64` | 검증/백필 스크립트가 이미 정답 패턴을 씀 |

### 정확일치(`.eq("as_of", X)`) — X의 출처로 세분

**X = 같은 함수 안에서 방금 구한 `us_sector_wide` 자신의 최신 as_of(자기참조, 정상)**:
- `app/api/cron/revdcf/route.ts:125`·`:157` — `sectorAsOf`는 `:111`의 결과. 자기 자신의 최신값으로 필터링 → **버그 아님**.
- `scripts/probe_952_sector_wide.ts:70-71`·`scripts/probe_955_sector_regen.ts:81` — 같은 스크립트 안에서 방금 만든 `asOf`로 검증 조회 → 버그 아님.

**X = 하드코딩된 과거 날짜 상수(`AS_OF = "2026-08-08"` 류, 일회성 백필/조사 스크립트)**:
- `scripts/backfill_step967_bank_revenue.ts:104`·`scripts/probe_964_residuals.ts:56`·`scripts/probe_963_impact.ts:43`·`scripts/backfill_step963_common_equity.ts:131`·`scripts/backfill_sector_relative.ts:20`·`scripts/backfill_step980_median_relative.ts:30`·`scripts/backfill_step969_debt.ts:142`·`scripts/fix_step969_scope_bug.ts:65`
- 🔴 **판단(1-2 요구사항)**: 이들은 **같은 결함이 아니다.** 특정 과거 시점(`us_sector_wide`가 그 as_of 하나뿐이던 때)을 겨냥한 1회성 백필·조사 스크립트이고, 전부 이미 실행 완료된 과거 STEP의 기록이다. 지금 고치면 그 STEP들의 재현성이 깨진다(`CLAUDE.md` 규칙 5-2 이력 — probe류는 재실행 대상이 아니라 기록). **함께 고치지 않는다 — 목록만 낸다.**

**X = 다른 테이블(`us_valuation`)의 as_of를 그대로 가져다 씀(진짜 결함)**:
- 🔴 **`app/api/q1/[symbol]/route.ts:42`(수정 전) — 유일한 실사용 버그.** `asOf`는 `us_valuation`의 최신 as_of(2026-08-15)인데 그걸로 `us_sector_wide`(고정 as_of=2026-08-08)를 조회 → 영구 불일치.

**차집합**: 정확일치를 쓰는 지점 12곳 중 **1곳만** 진짜 결함(`route.ts:42`)이었다. 나머지 11곳은 자기참조 또는 의도된 1회성 과거 시점 고정이었다.

---

## 1-2. 수정 — 읽는 쪽만

`app/api/q1/[symbol]/route.ts`:
- `import { latestAsOf } from "@/lib/sector"` 추가.
- `us_sector_wide` 조회를 `latestAsOf(sb, "us_sector_wide")`로 자신의 최신 `as_of`를 먼저 구한 뒤, 그 값으로 `.eq("as_of", wideAsOf)` 조회하도록 변경(크론 `route.ts:111`과 동일 규약, 새 패턴을 발명하지 않고 `lib/sector.ts`의 기존 export를 그대로 재사용 — STEP1004의 원래 의도).
- `us_sector_wide`가 완전히 비어 `latestAsOf`가 `null`을 반환하면 두 번째 조회 자체를 생략(`wideAsOf ? ... : null`) — 조회 낭비 없이 정직하게 `sectorSource: null`.
- **적재 로직(`app/api/cron/revdcf/route.ts`)은 한 글자도 건드리지 않았다** — `git diff --stat`으로 확인, 크론 파일은 diff 0.
- 1-1에서 나온 다른 정확일치 지점(스크립트 11곳)은 위 판단대로 **수정하지 않고 목록만 냈다.**

**회귀 방지 유닛테스트 2건 추가**(`app/api/q1/[symbol]/route.test.ts`):
1. `us_sector_wide`의 as_of가 `us_valuation`보다 뒤처져 있어도(2026-08-08 vs 2026-08-15) `sectorSource`가 채워지는지 — 이번 수정이 없으면 실패하도록 설계.
2. `us_sector_wide` 자체가 완전히 비어(`latestAsOf`가 null) 있으면 `sectorSource`가 정직하게 `null`인지(조인 실패로 오인하지 않게).

---

## 1-3. 🔑 검증 — 두 방법

### ① 코드 대조

수정 후 `app/api/q1/[symbol]/route.ts`의 `us_sector_wide` 조회 규약 = `latestAsOf()` 호출(`order+limit+maybeSingle`) → 그 결과로 `.eq()` — **`app/api/cron/revdcf/route.ts:111`의 크론 규약과 동일**. 코드 대조 통과.

### ② 실측 — 로컬에서 실제 API 호출(real DB)

`Q1_ENABLED=true`를 이 프로세스에만 env 오버라이드(`.env.local`·Production 무수정)하고 `app/api/q1/[symbol]/route.ts`의 `GET()`을 직접 호출하는 `scripts/verify_step1050_sector_source.ts`를 작성해 `npx tsx`로 실행했다(`probe_1042`가 쓴 표본 AAPL·AAOI·AAME·CTO 그대로). 실제 응답:

```
=== AAPL (status 200) ===
{ "asOf": "2026-08-15", "sector": "Information Technology", "sectorSource": "spdr", ... }
=== AAOI (status 200) ===
{ "asOf": "2026-08-15", "sector": "Information Technology", "sectorSource": "damodaran", ... }
=== AAME (status 200) ===
{ "asOf": "2026-08-15", "sector": "Financials", "sectorSource": "damodaran", ... }
=== CTO (status 200) ===
{ "asOf": "2026-08-15", "sector": "Real Estate", "sectorSource": "damodaran", ... }
```

🔴 **4종목 전부 `sectorSource`가 null이 아니다** — 수정 전(`probe_1042`)엔 4종목 전부 null이었던 것과 대비. **반증 조건(⓪-4) "수정 후 표본 4종목에서 sectorSource에 값이 실린다" 충족 — 완료.**

### `us_sector_wide.source` NULL 비율 실측

DB 직접 조회: `us_sector_wide` 전체 5,820행 중 `source IS NULL` = **1,135행(19.5%)**. 🔴 **이 비율은 이번 수정과 무관하게 남는다** — 조인이 고쳐져도 원본 `source` 컬럼 자체가 비어 있는 1,135종목은 `sectorSource: null`로 계속 나온다(§⓪-4 "source 값 자체가 비어 있는 행이 있다" 반증 조건 해당 — 조인 문제가 아니라 데이터 갭이므로 처방하지 않고 비율만 기록).

### tsc·테스트·화면 diff

- `npx tsc --noEmit`: 클린(사전 존재하는 `.gitignore` 처리 대상 `scripts/_probe_B_flows.ts`를 임시로 옮겨 재확인 — 이번 STEP과 무관, STEP1048·1049에서 이미 같은 방식으로 처리된 파일).
- `npx vitest run`: **34 파일·386개 테스트 전부 통과**(기존 384 + 신규 2).
- `npm run build`: 🔴 **의도적으로 생략** — 로컬 dev 서버(포트 3333)가 이미 라이브로 떠 있는 상태에서 `next build`를 돌리면 그 dev 서버의 `.next` 캐시를 덮어써 일시적으로 전 라우트가 깨질 수 있다(과거 세션에서 확인된 문제, 사용자 지시 "dev 서버 항상 유지"). 대신 **tsc(타입체크 — build의 핵심 검증 단계) + vitest(전체) + 실제 API 호출(§1-3②, real DB against 수정된 코드)**로 build가 잡을 수 있는 것 이상을 검증했다고 판단 — API 호출 자체가 라우트 파일을 실제로 import·실행하므로 구문·타입·런타임 오류가 있었다면 그 자리에서 즉시 드러났을 것이다.
- **화면 diff 0**: `git diff --stat` — 변경 파일은 `app/api/q1/[symbol]/route.ts`·`route.test.ts` 둘뿐(+54/-2줄), 컴포넌트·페이지 파일 0건. `Q1_ENABLED`는 Production에서 여전히 OFF이므로(`.env.local` 무수정, `git status`로 확인) 이 라우트는 `q1Enabled()` 체크에서 즉시 404를 반환해 어차피 화면에 아무것도 안 뜬다 — diff 0이 구조적으로 보장된다.

---

## 1-4. 기록 신뢰 복구

`docs/PARKED_*.md` 5개 전수(`ls docs/PARKED_*`로 확인, §⓪-1b) 각각의 핵심 주장을 오늘 코드·DB와 대조했다.

| 문서 | 대조 결과 | 조치 |
|---|---|---|
| `PARKED_FIELD_SURFACES.md` | `ToolboxClient` 렌더 진입점 0개(`:40`)는 **정확했다** — STEP1048이 "발견"이라 적었으나 이미 있던 사실이었다 | ✅ **옳았던 기록을 문서에 명시 추가**(헤더 바로 아래, "이 문서가 옳았던 기록" 블록) — 이번 STEP의 핵심 정정 |
| `PARKED_HNX_VCI_ACTIVATION.md` | "✅ HOSE는 정상(매일 야후 업데이트)"이 작성 시점(2026-07-09)엔 맞았으나, 이후 `PARKED_FIELD_SURFACES.md` §7(2026-07-28, VN 전체 제품표면 차단)로 더는 사실이 아니게 됨 — 상위 배너가 US단독 규칙만 언급하고 §7 선행 사건은 언급이 없었음 | ✅ **정정 — 발생 경로 한 줄**("§7이 이미 HOSE 노출도 덮어썼다") 배너에 추가, 원문 보존 |
| `PARKED_KR_DIVIDEND_ACTIVATION.md` | STEP1048이 같은 날 작성 — 현재 코드(`OfferingsFeed.tsx` 토글 유지+사유문구)와 대조 결과 일치 | 정정 없음 |
| `PARKED_OAUTH_LOCALE_ACTIVATION.md` | 문서 자체가 "✅ ACTIVATED — 완료(STEP 710E)"로 이미 해소 표기, 현재 `app/auth/callback/route.ts`·`lib/authRedirect.ts` 존재 확인 — 일치 | 정정 없음 |
| `PARKED_TERMS_PRIVACY_ACTIVATION.md` | "약관·개인정보처리방침이 삭제된 리딩방 기능을 여전히 서술한다"는 핵심 주장을 오늘 재확인(`app/[locale]/terms/page.tsx`·`privacy/page.tsx`에 "리딩방"·"유사투자자문" 문구 grep) — **여전히 사실** | 정정 없음(여전히 유효한 보류) |

`STATE.md` #27 정정: "us_sector_wide 신선도 상한 미설정"이 `sectorSource` 침묵의 원인으로 오지목되지 않도록, 이번 수정으로 해소된 것은 **읽는 쪽 규약**이지 신선도 상한 여부와 무관함을 명시(#27 자체 — 상한을 걸지 여부 — 는 여전히 판정 대기로 남김, 다른 질문이므로 억지로 해소 처리하지 않음).

---

## 1-5. `_TEMPLATE` 보강

`docs/step_orders/_TEMPLATE.md` ⓪-1b에 한 줄 추가 완료(주문서 원문 그대로): "문서 목록을 이름 패턴으로 만들지 않는다 — 디렉터리를 나열해 전수로 확인한다."

---

## before / after

| 항목 | before | after |
|---|---|---|
| `sectorSource`(AAPL) | `null`(`probe_1042`) | `"spdr"` |
| `sectorSource`(AAOI) | `null` | `"damodaran"` |
| `sectorSource`(AAME) | `null` | `"damodaran"` |
| `sectorSource`(CTO) | `null` | `"damodaran"` |
| F-4-4 켜기 전 필수 | 2건 | 1건(조건부 4칸만) |
| 유닛테스트 | 384 | 386 |
| `Q1_ENABLED`(Production) | false | false(무변경) |
| `us_sector_wide` 적재 로직 | 무변경 | 무변경(읽는 쪽만 수정) |

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 것**: `npm run build`(라이브 dev 서버 보호를 위해 의도적 생략, 대체 검증 §1-3 참고) · F-5 헤더의 "14건" 카운터 갱신(STEP1049의 ⑬ 분리 + 이번 ③ 해소로 실제 항목 수가 이미 달라졌으나 이번 STEP의 명시 범위(F-4-4)를 넘어서는 정리라 손대지 않음).
- **아직 안 함**: 조건부 4칸(405건) 화면 처리 — 장은태 판정 대기(이 STEP의 금지 사항, 손대지 않음).
- **철회·정정**: `STATE.md` #27의 원인 지목(신선도) 정정 · `PARKED_HNX_VCI_ACTIVATION.md`의 "HOSE 정상" 프레이밍이 §7로 이미 덮어써졌음을 명시 · `PARKED_FIELD_SURFACES.md`에 옳았던 기록 추가.
- **미측정**: `us_sector_wide.source` NULL 1,135행(19.5%)이 왜 비어 있는지(어느 종목군인지, 원본 데이터 갭의 원인) — 이번 STEP은 비율만 실측했고 원인 규명은 범위 밖.

🔴 **판정 금지 — 조건부 4칸(405건) 처리·F-5 카운터 정리·`us_sector_wide.source` NULL 원인 규명은 전부 다음 STEP·장은태 판정 대상.**
