<!-- 2026-08-08 · Cowork 작성 · Claude Code 실행용 -->

# STEP 940 — Q0 구현 ③-2 ＋ ①-2단계: **나스닥 적재 ＋ `sector` 모드 신설(4순위 해석기)**

> **범위**: 나스닥 스크리너 테이블 신설·적재 ＋ SPDR 정답지 테이블 ＋ `lib/sector.ts`에 **`sector` 모드**(0~4순위 해석) 추가 ＋ 실측 리포트.
> 🔴 **화면(⑤)은 이 STEP에 없다** — `USER_QUESTIONS` §7 **ⓕ**(어휘 충돌)·**ⓖ**(모집단) 판정이 먼저다.
> **정본**: `docs/USER_QUESTIONS_2026-08-08.md` §Q Q0 · 진행표 = `docs/STATE.md` ▶다음 0번

---

## 🔴 이 STEP 전에 확정된 판정 2건 (2026-08-08 장은태)

| | 판정 |
|---|---|
| **ⓘ** | **SPDR을 출처 0순위로 올린다.** 근거 = 유일하게 검증된 진짜 GICS · 얻는 것(불일치 2건 정정 ＋ 미매핑 10건 회수) > 잃는 것(없음 — S&P 500 편출 종목은 1순위로 자동 하강) |
| **ⓙ** | **이상 티커 12건(E-mini 선물 11 ＋ CONTRA 1)을 제외하되 `excluded`에 남긴다.** 🔴 `ECHO`·`FDXF`·`HONA`·`MRSH`는 **Damodaran 미등재일 뿐 회사이므로 제외 대상이 아니다** |

**확정된 출처 순서**

| 순 | 출처 | 규모 | 성격 |
|:--:|---|:--:|---|
| **0** | **SPDR 섹터 ETF holdings** | ~503 | 🔑 **진짜 GICS** |
| **1** | Damodaran `indname.xls` 티커 직접 | 802 | 정답지 대비 **99.6%** 검증됨 |
| **2** | Damodaran 형제 주식클래스 / 구두점 정규화 | ~13 | 같은 회사라 틀릴 수 없음 |
| **3** | **Nasdaq ∩ SEC SIC 「합의」** | ~149 | 두 출처가 같은 답일 때만 |
| **4** | 그 외 | ~57 | 🔴 **「미분류」** |

---

## ⓪-4 4×3 기록 (실행 순서 ③ → ① → ② → ④)

### ③ 자체 데이터 확인 (Cowork 수행)

| # | 열어본 것 | 결과 |
|:--:|---|---|
| 1 | `lib/sector.ts` (938 신설) | `fetchSectorMap(sb, {field:"industryGroup", source:"damodaran"})` → `{byTicker, rows, source}` |
| 2 | `lib/revdcf/registry.ts` (939 갱신) | `nasdaq`·`spdr` 좌표 등재됨 |
| 3 | `damodaran_industry` 스키마 | `as_of`·`exchange`·`ticker`·`ticker_norm`·`is_us_listed` 등 — **`as_of`로 스냅샷을 쌓는 구조** |
| 4 | 나스닥 응답 | 🔴 **`asOf` 없음** → 우리가 `as_of`를 찍어야 한다 |
| 5 | `data/sources/sec/sec_sic_missing219_20260808.json` | 219건 CIK·SIC (938 이전 보존) |

### ① 3번 검색 ＋ ⓪-5-B

```
필요한 데이터 : 없음 — 939에서 취득한 원본을 DB로 옮기는 STEP
link_hub 후보 : 해당 없음 (939에서 이미 조회·기록 완료)
실제 조회     : 미실시 (939 결과 재사용)
직접 웹검색   : 미실시
```
🔴 **못 한 축으로 명시.** 새 외부 출처를 들이지 않으므로 재조회 불요.

### ② 3번 검증

1. **적재 정확성** — 나스닥 원본 JSON 행 수와 DB 행 수가 **정확히 일치**해야 한다
2. **해석기 정확성** — `sector` 모드 결과를 **SPDR 정답지로 채점**한다(0순위를 뺀 상태로 채점해야 의미가 있다 → 아래 4번 지시)
3. **회귀** — 🔴 `industryGroup` 모드와 역DCF 경로는 **완전 불변**

### ④ 3번 검수 (자기 공격)

1. 🔴 **0순위를 넣고 정답지로 채점하면 100%가 나온다 — 무의미하다.** 채점은 **0순위를 제외한 1~3순위 결과 vs SPDR**로 한다.
2. 🔴 **`as_of`를 오늘 날짜로 찍으면 원본의 실제 기준일과 어긋난다.** 나스닥은 `asOf`가 없으니 **취득일**을 쓰되 컬럼명·의미를 문서에 명시한다. SPDR은 **xlsx의 `As of`를 그대로** 쓴다(취득일 아님).
3. 🔴 **`sector` 모드가 `industryGroup` 모드를 건드리면 604 모집단이 변한다.** 두 모드는 **완전히 분리**되어야 한다.

---

## 실행 지시

### 1. 테이블 2개 신설 (마이그레이션)

```
us_sector_nasdaq   as_of(date) · symbol(text) · sector · industry · country · ipo_year · market_cap
                   PK (as_of, symbol) · 🔴 as_of = 취득일(나스닥이 기준일을 주지 않음)

us_sector_gics     as_of(date) · symbol(text) · sector · etf(text)
                   PK (as_of, symbol) · 🔴 as_of = SPDR xlsx의 "As of" 값(취득일 아님)
```

🔴 **RLS 정책은 기존 `damodaran_*` 테이블과 동일하게 맞춘다**(읽기 공개·쓰기 서비스키). 다르면 멈추고 보고.
🔴 **기존 테이블은 하나도 건드리지 않는다.**

### 2. 적재 스크립트

`scripts/ingest_us_sector.ts` — `data/sources/nasdaq/`·`data/sources/spdr/`의 **로컬 원본에서** 읽어 적재한다(🔴 **재취득하지 말 것** — 939가 보존한 스냅샷과 DB가 일치해야 한다).

- 나스닥: `_meta.rows`와 적재 행 수 **일치 확인**. `sector`가 빈 문자열이면 `null`로 적재(712건 예상)
- SPDR: **ⓙ 판정대로 이상 티커 12건 제외**하고 적재. 🔴 제외 목록을 **로그와 리포트에 그대로 출력**
- 재실행 안전(같은 `as_of`면 upsert)

### 3. `lib/sector.ts`에 `sector` 모드 추가

```
🔴 기존 industryGroup 모드·시그니처·동작을 바꾸지 말 것. 추가만 한다.

resolveSector(sb, { asOf? }) → Map<symbol, { sector, source, agreed }>

출처 순서 (앞에서 붙으면 뒤는 시도하지 않는다)
 0. us_sector_gics                          source="spdr"       ← 진짜 GICS
 1. damodaran_industry.primary_sector        source="damodaran"
    (is_us_listed=true · ticker_norm 직접)
 2. damodaran_industry.primary_sector        source="damodaran-sibling"
    🔴 구두점 제거 후 대문자로 대조 + 클래스 접미사 형제 탐색
       (BRK-B→BRKB→BRKA · GOOG→GOOGL · FOX→FOXA · NWS→NWSA · MOG-A→MOGA)
    🔴 형제 후보가 2개 이상이면 붙이지 말고 미분류로 넘긴다(임의 선택 금지)
 3. us_sector_nasdaq ∩ SEC SIC 「합의」        source="consensus"  agreed=true
    🔴 나스닥 12분류를 GICS 11로 옮기는 대응표가 필요하다.
       확정 대응: Finance→Financials · Basic Materials→Materials ·
                 Technology→Information Technology · Telecommunications→Communication Services ·
                 (나머지 동명 그대로)
       🔴 Miscellaneous → 매핑하지 않는다(미분류로 흘린다)
       🔴 SEC SIC→섹터는 damodaran_industry의 sic_code별 최빈 섹터를 쓰고,
          최빈 비중 70% 미만이면 이 단계에서 탈락시킨다(미분류)
 4. 미분류                                    source=null

🔴 반환에 반드시 source를 담는다(규칙 5-2 ④). 화면 표기의 재료다.
```

### 4. 실측 리포트 (`scripts/probe_940_sector_resolve.ts`)

결과를 출력하고 `docs/probe_940_sector_resolve.json`에 저장:

1. **출처별 건수** — 0/1/2/3/4순위 각각 몇 건인지 · 합계와 `lens_scores` US 종목 수(1,021) 대비 커버리지
2. 🔑 **채점** — 🔴 **0순위를 뺀 상태**로 1~3순위 결과를 만들어 **SPDR 정답지와 대조**. 순위별 정확도를 따로 낼 것
3. **3순위 합의 실패 건수** — 나스닥·SIC 불일치 · SIC 최빈 70% 미만 탈락 · `Miscellaneous`
4. **미분류 목록 전건** (심볼 + 각 출처에서 무엇이 나왔는지)
5. **섹터별 종목 수** — 🔴 하위 섹터가 몇 개까지 올라왔는지(섹터 내 컷 가능 여부 판단 재료 · ④단계 입력)

**Cowork 사전 추정(대조용 · 🔴 맞추려 하지 말 것 · 다르면 그대로 보고)**

| 항목 | 추정 |
|---|---|
| 0순위(SPDR) | ~500 |
| 1순위(Damodaran 직접) | ~450 (0순위와 겹치는 만큼 줄어듦) |
| 2순위(형제) | ~10 |
| 3순위(합의) | ~140 |
| 미분류 | ~50 |
| 커버리지 | **약 94~96%** |

🔴 **추정과 크게 다르면 원인을 규명해 보고하되, 숫자를 맞추려고 규칙을 바꾸지 말 것.** STEP 939에서 Cowork의 기대값(490/488)이 틀리고 실제(494/492)가 맞았던 전례가 있다.

### 5. 테스트 (`lib/sector.test.ts`에 추가)

1. 0순위 우선: SPDR과 Damodaran이 다를 때 **SPDR이 이긴다**
2. 형제 규칙: `GOOG` → `GOOGL`의 섹터 · `BRK-B` → `BRKA`의 섹터
3. 🔴 **형제 후보 2개 이상이면 미분류**
4. 합의: 나스닥·SIC 일치 → 채택 / 불일치 → 미분류
5. 🔴 `Miscellaneous`는 매핑되지 않는다
6. 🔴 **회귀**: `industryGroup` 모드 기존 테스트 3건 **그대로 통과**

### 6. 문서

- `docs/CHANGELOG.md` **(97) STEP 940** — 출처별 건수·채점 결과·미분류 건수를 반드시 수치로
- `docs/STATE.md` ▶다음 0번 ①·③단계 상태 갱신 · **④(섹터 컷)이 다음임을 명시**
- `data/sources/README.md` — 적재 테이블명 추가
- `lib/revdcf/registry.ts` — 두 테이블명 등재
- `docs/STEP_LEDGER.md` 등재

🔴 **`CLAUDE.md` · `docs/USER_QUESTIONS_2026-08-08.md` · `docs/LENS_COMPLETION_STANDARD.md`는 고치지 않는다.**

---

## 🔴 금지 (전부 불변)

- **기존 테이블 수정·삭제 금지** (신규 2개만 생성)
- `revdcf_results` · `us_market_cap` · `lens_scores` · `lens_cuts` — **쓰기 금지**
- `lib/sector.ts`의 **`industryGroup` 모드·시그니처 — 불변**
- `REVDCF_ENABLED` · `data/us_symbols.json` · `.github/workflows/**` · `vercel.json` — 불변
- 크론 수동 실행 — **금지**(특히 `email-brief`)
- 화면·UI 코드 — **이 STEP에서 손대지 않는다**
- `probe_*` 기존 파일 — 불변
- KR 관련(`ACTIVE_MARKETS` · KR 크론 3개 · `messages/ko.json` · `messages.test.ts` 패리티) — **끄지 않는다**
- 🔴 **API 키·비밀번호를 어떤 필드에도 입력하지 않는다**

## 성공 기준

1. 테이블 2개 생성 · 로컬 원본과 **행 수 일치** 적재
2. `resolveSector`가 0~4순위로 동작 · **반환에 `source` 포함**
3. `npm test` 전체 통과 (신규 6건 + 기존 3건 회귀 포함) · `npx tsc --noEmit` 통과
4. 🔑 **실측 리포트 5항목 산출** — 특히 **0순위 제외 채점**과 **미분류 전건 목록**
5. 역DCF 경로 diff 0 · 금지 경로 diff 0

## 🔴 막히면

**추측해서 진행하지 말고 멈추고 보고할 것.** 특히 ① RLS 정책이 기존과 다름 ② 적재 행 수 불일치 ③ 형제 후보 다중 ④ 채점 정확도가 90% 미만 — 이 넷은 **반드시 멈춘다.**
