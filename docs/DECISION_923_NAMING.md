<!-- 2026-08-06 · STEP 923 · 진단 전용 문서 — 판정 없음, 승인은 장은태 것 -->
# DECISION 923 — DoD7 종목명 불일치 진단 (수리 금지)

> 이 문서는 **진단이지 수리가 아니다.** 코드 diff 0. 수리 선택지는 나열만 하고 실행하지 않는다.
> 🔴 **`years` 권고(922)는 승인됐다 — 이 문서는 그것과 별개의 새 발견을 다룬다.**

> ## 🟢 승인 기록 (924 — 본문은 고치지 않는다, 판단은 아래 §4의 것)
> **장은태 지시, 2026-08-06**: *"가장 베스트인거로 3번 생각하고 검색하고 검증하고 검수해서 진행해"* — Cowork/Claude Code 판단으로 **§4의 B안(표시 계층 통일)을 채택**, A안(근본수정)은 명시적으로 기각.
> **채택 근거**: ① 규모(348/998=34.9%, 소수 예외 아님) ② 상세 페이지가 이미 정답을 가진 별도 소스(`data/us_symbols.json`)가 존재 ③ A안은 `lensCompute.ts`/`lensPrecompute.ts`(917 계측과 같은 파일대)를 건드리고, 야후 quote가 실패한 개별 원인은 923이 미조사로 남겨 "원인 모르는 파이프라인을 고치는" 리스크가 있음 ④ DoD7은 "표면 간 이름이 같을 것"을 요구하지 "데이터 출처가 정규화될 것"을 요구하지 않는다 — B가 요구를 문자 그대로 충족.
> **적용**: `app/api/explore/lens-top/route.ts`·`lib/todayChanges.ts` 2곳에서 `lens_scores.name`/`lens_state_changes.name`이 티커와 같을 때만 `data/us_symbols.json` 원본으로 표시값을 대체(`lib/stockName.ts`의 `usSymbolRawName` 신설, DB는 안 씀). 348개 전수 대조 결과 **잔여 0**(전부 `us_symbols.json`에 존재). 모멘텀 이름 중복도 조립 로직(`lib/lensCopy.ts`의 `lensStateLine`)에서 함께 해소.
> **남는 것(대가, 아래 §4 B행 그대로)**: `lens_scores.name`/`lens_state_changes.name` 자체는 DB에 여전히 티커로 남아 있다 — 다른 소비처(예: 관심목록 폴백 등, 미전수조사)에 위험이 남을 수 있다. **DoD7 판정 칸은 이 승인·적용으로도 바뀌지 않는다** — §1의 "같은 이름"이 무엇을 뜻하는지 자체가 여전히 미정의라, 화면 증상이 없어졌다고 그 해석 문제가 풀린 게 아니기 때문이다.
> 상세 = `docs/CHANGELOG.md` STEP 924 블록 · `docs/probe_924_baseline.json`(348개 대조 원자료).

---

## §0 — Cowork 브라우저 3중 검증 (2026-08-06 · `localhost:3333`)

### 🟢 역DCF 카드(`/stock/NVDA`) = 정상

「기대 해독」 배지 + "시장은 5년의 초과성장을 요구합니다" 헤드라인 · 자본비용 3점 밴드(9.7%→5년 / 10.7%기준→5년 / 11.7%→6년) · "기대가 낮은 편 · 이 기법 성립 131개 중 97번째로 긴 기간" · 드라이버 6개 · 각주 3줄. **922가 코드로 읽은 2단 구성이 화면에서 그대로 확인됨.** 레이아웃 정상 · 어절 갈림 없음.

🔴 **보드 배지(`RevDcfBadge.tsx`)는 못 봤다** — US 탐색 목록에 역DCF 배지가 나오지 않는다. 어느 화면에 렌더되는지 Cowork이 확인하지 못했다.

### 🔴 종목명 불일치(US 탐색 목록 `/explore?market=US`)

| 관측 | 검증 방법 | 결과 |
|---|---|---|
| 「Alphabet Inc.」 2행 | `read_page` 링크 | `/stock/GOOGL` · `/stock/GOOG` — 다른 클래스인데 이름 동일·티커 미표시로 구분 불가 |
| 「Mo」 $68.44 | `read_page` 링크 | `/stock/MO` — 티커를 회사명 자리에 |
| 「Hst」 $25.13 | `read_page` 링크 | `/stock/HST` — 동일 |
| 「Suncor Energy Inc.」 | 대조군 | `/stock/SU` — 정상(회사명 있음) |
| 「모멘텀 모멘텀 상위권」 | 육안 | 단어 중복 |

외부 검증(웹): MO = **Altria Group, Inc.** · HST = **Host Hotels & Resorts** — 정식 회사명 실재.

🔴 **결정적 대조**: `/stock/MO` 상세 페이지는 「Altria Group, Inc. MO」로 정상 표시된다. **데이터 결손이 아니다 — 상세는 이름을 알고 있고 목록 경로만 못 가져온다.**

추가 관측: 목록 = 「NVIDIA Corporation」(영문·티커 없음) vs 상세 = 「엔비디아 **NVDA**」(한글+티커) — §2에서 판정.

---

## §1 — DoD7 "같은 이름"이 무엇의 이름인가

`docs/LENS_COMPLETION_STANDARD.md:24` 원문 그대로 인용: *"화면 일관성 — 카드·목록·변화 피드·이메일·브리핑에서 **같은 이름·판정·단위**."*

🔴 **원문은 "이름"이 무엇을 가리키는지 정의하지 않는다 — 모호함.** 문서 전체를 재검색해도 추가 정의가 없다. 두 가지 독립적 해석이 둘 다 문법적으로 가능하다:
- **해석 A(판정 라벨)**: "이름·판정·단위"를 판정 상태의 세 속성(이름=카테고리명, 판정=verdict, 단위=년/%)으로 읽는다 — 922·901이 실제로 쓴 해석.
- **해석 B(종목명)**: "이름"을 종목/회사명, "판정"을 그 종목에 대한 평가, "단위"를 수치 단위로 읽는다 — "누구에 대한 얘기인지·어떻게 평가했는지·얼마인지"의 3단 구조로, 7렌즈처럼 여러 종목을 다루는 화면에 더 자연스럽게 들어맞는다.

**단정하지 않는다.** 다만 해석 B를 취하면 §0의 종목명 불일치는 DoD7의 정중앙 위반이고, 해석 A를 고수해도 "화면 일관성"이라는 DoD7의 상위 의도(다섯 표면에서 사용자가 보는 정보가 서로 안 어긋나야 한다)에는 어느 해석으로도 걸린다.

---

## §2 — 종목명 일관성 전수 진단 (수리 금지)

### 다섯 표면 × 필드 · 폴백 · 티커 표시

| 표면 | 종목명 소스 | 폴백 규칙 | 티커 표시 |
|---|---|---|---|
| 목록 — Explore "강점이 많은 종목"(`/api/explore/lens-top`) | `lens_scores.name` → `resolveDisplayName(..., context:'list')` → `cleanUsName`(`ExploreClient.tsx:439,593`) | `lens_scores.name` 자체가 Yahoo quote 실패 시 티커로 초기화된 채 저장됨(아래 근본원인) → 그 값을 다시 title-case | **미표시**(설계 — `DotsRow`는 `name`만 렌더, `symbol`은 로고·링크·워치키 전용) |
| 목록 — `UsMarketBoard`(`/toolbox`, 별도 컴포넌트) | `data/us_symbols.json` NAME_MAP(`/api/yahoo/us-list`) — **다른 소스** | 정상 커버(이 STEP에서 결함 재현 안 됨) | (범위 밖) |
| 카드 — 종목상세 SEO(`h1`·`<title>`·JSON-LD) | `resolveStockName()`(`lib/stockName.ts`) → `data/us_symbols.json` 직접 조회 — **목록과 다른 소스** | 번들 JSON에 없으면 `null` → 클라이언트가 `data?.name`(아래와 같은 취약 경로)로 폴백 | 있음("엔비디아 NVDA") |
| 카드 — 클라이언트 렌더/워치리스트 등록명 | `data?.name`(`/api/lens`→`computeSymbolLenses`, `lens_scores`와 같은 근본 경로) | `initialName`(SEO 소스)이 우선이라 보통 안 쓰임 — **null일 때만 노출, 그 경우 워치리스트에도 영구 저장됨**(`StockLensClient.tsx:1404,1418`) | — |
| 변화피드·이메일·브리핑 | 901 확정대로 역DCF는 이 3표면 자체가 코드상 없음(N/A) | — | 해당 없음 |

### 상세와 목록이 다른 필드인가

**다르다.** 상세(SEO h1) = `data/us_symbols.json`(빌드타임 번들, 정적). 목록(Explore lens-top) = `lens_scores.name`(런타임 DB, Yahoo quote 경유). **물리적으로 다른 파이프라인이라 하나가 틀려도 다른 하나는 영향을 안 받는다** — MO/HST가 정확히 이 비대칭의 실물 증거다.

### title-case 폴백 코드 — 찾음

`lib/usNameFormat.ts:10-21`(`titleCaseUsName`), `lib/displayName.ts:27`(`cleanUsName`이 이를 호출, `resolveDisplayName`의 리스트 경로에서 사용). `rawName`이 전부 대문자(소문자 없음)면 단어별 title-case를 적용 — 티커가 들어오면 "MO"→"Mo"가 기계적으로 나온다.

### 영향 범위 — DB 실측

`lens_scores`(market='US') 직접 조회: **998행 중 348행(34.9%)이 `name = symbol`**(티커 그대로 저장) — 표본 15건 육안 확인(`AAL`·`ABNB`·`ADP`·`ADSK` 등 — 전부 실제 회사명이 있는 종목인데 티커만 저장됨, 우연한 일치 아님).

🔴 **2개가 아니라 348개다.** 이건 예외 처리 수준이 아니라 **구조적 문제**다.

**근본원인**: `lib/lensCompute.ts:139`(`computeSymbolLenses`) — `name`을 `symbol`(티커)로 기본 초기화하고, `:147`에서 Yahoo `quote()`가 `shortName`/`longName`을 반환할 때만 덮어쓴다. MO·HST 등 348종목은 이 덮어쓰기가 실패해 티커가 그대로 `lens_scores.name`에 영속화됐다(`lib/lensPrecompute.ts:387`, `name: r.name`).

🔑 **대조**: `data/us_symbols.json`(상세페이지 소스)은 같은 348개 티커에 대해서도 정상 이름을 갖고 있다(MO/HST 확인됨) — 두 소스가 서로 독립적이라 "목록만 틀리고 상세는 맞는" 비대칭이 구조적으로 발생한다.

### 「Alphabet Inc.」 중복 — 설계인가 누락인가

**설계다.** `DotsRow`(`ExploreClient.tsx:123-149`)는 `symbol`을 시각적 텍스트로 렌더한 적이 없다 — 로고 코드·링크·워치리스트 키로만 쓰인다(코드로 확인, 결함이 아니라 의도된 화면 구성). 다만 이 설계가 GOOGL/GOOG처럼 **회사명이 같은 복수클래스 종목에서 구분 불가**라는 부작용을 낳는다 — MO/HST(이름이 **틀림**)와는 다른 종류의 문제(이름이 **모호함**)다.

### 「NVIDIA Corporation」(영문) vs 「엔비디아 NVDA」(한글) — 설계인가 결함인가

**설계다.** `lib/displayName.ts`가 명문화한 규칙(STEP 775/776 주석 확인): `context:'list'`는 로케일과 무관하게 항상 `cleanUsName`(영문)을 쓰고, `context:'detail'`+`loc==='ko'`일 때만 `foreign_ko_names` 한글 오버라이드를 적용한다. "목록은 언어를 안 섞는다"는 명시적 규칙이 이미 있다 — Cowork이 판단을 유보한 지점의 답은 **의도된 현지화**다.

### 「모멘텀 모멘텀 상위권」 중복 원인 — 찾음

`ExploreClient.tsx:161` — `{lensDisplayName(loc, topLensKey)} {lensStateLabel(loc, topLensKey, topLensState)}`을 단순 연결. `lensStateLabel`이 반환하는 일부 phrase(모멘텀 `up`/`upNeg`, 퀄리티 `high` 등, `lib/lensCopy.ts`)가 **이미 렌즈 이름을 문구 안에 내장**하고 있어("모멘텀 상위권") 이름이 두 번 나온다. 조립 코드가 "phrase는 이름을 안 담고 있다"고 가정했는데 그 가정이 일부 phrase에서 깨진 것 — 종목명 문제와는 원인이 다른 별개의 조립 버그다.

**전부 진단만 했다 — 코드 수정 0.**

---

## §3 — 보류 목록과의 관계

`docs/STATE.md`에 명시적으로 기록됨(그대로 인용): *"923 경계 기록: DoD7 종목명 진단은 '7렌즈 깊이 확장'이 아니다 — 역DCF 완성의 필요조건(승인된 정의: DoD9 제외 8항목)이라 확인은 범위 안이다. 그러나 목록 화면(7렌즈 보드) 코드를 고치는 것은 별개 — 그 목록은 실사용자에게 나가는 라이브 화면이라 수리는 반드시 별도 승인 후."*

---

## §4 — 판정서

### DoD7 상태 = 미결 유지

**이유**: 922의 다섯 표면 비교는 판정 라벨(`badge.*`/`boardBadge.*`)만 비교 대상으로 삼았고 종목명은 대상이 아니었다. 923 실측에서 종목명 불일치(348/998=34.9%, 구조적)가 확인됐다 — §1에서 확인했듯 DoD7 "이름"의 두 가능한 해석 중 어느 쪽으로도 이 위반은 무시할 크기가 아니다.

### `years` 권고와는 별개 사안이다

🔴 **922의 `years` 권고(현행 유지)는 승인됐고, 기각된 게 아니다.** `boardBadge.years` 판단과 종목명 불일치는 서로 다른 발견이며, 하나가 다른 하나의 승인 여부에 영향을 주지 않는다.

### 수리 선택지와 대가 (권고까지만 — 실행은 승인 후)

| 선택지 | 내용 | 대가 |
|---|---|---|
| **A — 근본 수정** | `lensCompute.ts`/`lensPrecompute.ts`가 Yahoo quote 실패 시 `data/us_symbols.json`(이미 존재하는 정상 소스)으로 폴백하도록 배선 | 348건 전부 해결. 🔴 **7렌즈 계산 라이브 경로 수정**(`lib/lensCompute.ts`·`lib/lensPrecompute.ts`) — 917 계측과 같은 파일대, 다음 크론 재실행 전까진 반영 안 됨, **실사용자가 보는 Explore 화면이 바뀐다** → 별도 승인 필수 |
| **B — 표시만 통일** | `ExploreClient.tsx`가 `lens_scores.name` 대신 상세페이지와 같은 소스를 쓰도록 프론트만 변경 | `lens_scores.name` 자체는 계속 틀린 채로 남아 다른 소비처(워치리스트 폴백 등)엔 위험 지속. A보다 작은 변경이나 여전히 라이브 화면 변경 → 별도 승인 필요 |
| **C — 방치** | 아무것도 안 함 | 사용자가 계속 잘못된 이름을 봄(348/998=34.9% 영향권). DoD7 미완결 상태 지속 |
| **D — 모멘텀 중복(부수 발견)** | `ExploreClient.tsx:161`의 조립 로직에서 이름-내장 phrase 예외 처리 | 종목명 문제와 독립적인 별도의 작은 수정 — 이것도 라이브 화면 변경이라 별도 승인 필요 |

### 완성까지 남은 것 갱신 (921/922 기준)

**필요조건**: `#70`(Preview 유지/끄기) · `#71`(Preview 500 원인, 완성엔 영향 없음 확인됨) · `#74`(`boardBadge.years`, **승인 완료**) + 🔴 **DoD7(종목명) — 923이 추가한 새 필요조건.** `boardBadge.years`가 닫혀도 DoD7 자체는 종목명 문제가 해결(또는 "현행 유지"로 명시적 판정)되기 전까진 ✅가 안 된다.

**승인·수리 실행은 장은태 것이다.**
