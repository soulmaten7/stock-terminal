<!-- 2026-08-08 · Cowork 작성 · Claude Code 실행용 -->

# STEP 938 — Q0 구현 ①단계: 업종 조회를 함수로 모은다 (순수 리팩터 · **동작 diff 0**)

> **범위**: `lib/sector.ts` 신설 ＋ **운영 경로 2곳만** 교체 ＋ 유닛테스트 ＋ 동작 불변 검증.
> 🔴 **이 STEP에서 나스닥·SEC 보강은 넣지 않는다.** 보강은 939 이후. 여기서는 **동작이 바뀌면 실패**다.
> **정본**: `docs/USER_QUESTIONS_2026-08-08.md` §Q Q0 · 진행표 = `docs/STATE.md` ▶다음 0번 ①단계

---

## ⓪-4 4×3 기록 (실행 순서 ③ → ① → ② → ④)

### ③ 자체 데이터 확인 (3회 이상 · 직접 열람)

| # | 무엇을 열었나 | 결과 |
|:--:|---|---|
| 1 | `lib/revdcf/registry.ts` | `indname.xls` → `damodaran_industry`, **매칭키 = `is_us_listed` ＋ `ticker_norm`** 등재됨. `sec.endpoints.submissions`에 *"SIC·form·거래소"* 기등재 |
| 2 | `app/api/cron/revdcf/route.ts:44-68` | `damodaran_beta.industry` ← **`industry_group`으로 조인**. 매칭 실패 시 `skip_reason: "NO_INDUSTRY"` |
| 3 | `grep -rn primary_sector lib app scripts` | 🔴 **코드 사용처 0건** — `scripts/ingest_damodaran.ts:78`에서 **적재만** 하고 읽는 곳이 없다 |
| 4 | `grep -rl 'from("damodaran_industry")'` | **13개 파일**. 그중 `select("ticker_norm, industry_group")` 동일형 12곳, `probe_866_universe.ts:279`만 `exchange` 추가 변형 |
| 5 | `scripts/compute_revdcf_all.ts:1-2` | *"매일 크론 전제 · 재실행 안전"* → **운영 경로** |
| 6 | `package.json` | 테스트 = **vitest** (`npm test` = `vitest run`) |
| 7 | Supabase 직접 조회 | `damodaran_industry` 48,144행 · `is_us_listed=true` **6,937** · US 내부 `ticker_norm` **중복 0건** |

### 🔴 ③에서 나온 것 — **설계가 바뀐다**

**두 용도가 서로 다르다.**

| 용도 | 반환 | 보강 가능한가 |
|---|---|---|
| **역DCF 입력 조달** | `industry_group` (84~94개) | 🔴 **불가.** `damodaran_beta`·`wacc`·`tax_rate`·`capex`·`working_capital` **5개 테이블이 이 이름을 키로 쓴다.** 다른 출처의 업종명은 그 표에 없다 |
| **Q0 화면 표시** | `primary_sector` (11개) | 🟢 가능 (나스닥·SEC 보강 대상) |

🔑 **그래서 하나의 함수에 「무엇을 반환할지」를 파라미터로 둔다**(규칙 5-2 `y = f(x)`). **이 STEP은 `industryGroup` 모드만 만든다.**

### 🔴 ③에서 나온 것 — **「13곳」의 성격이 갈린다 (정정)**

| 구분 | 파일 | 이 STEP에서 |
|---|---|---|
| **운영·재실행** | `app/api/cron/revdcf/route.ts` · `scripts/compute_revdcf_all.ts` | ✅ **교체 (2곳)** |
| **1회성 조사 기록** | `probe_851` · `866` · `866c` · `871` · `874` · `876` · `878` · `879` · `906_growth_fit` · `906_wc_debt` · `909` (11곳) | 🔴 **손대지 않는다** — 과거 STEP의 **재현 기록**이라 고치면 그 STEP 결과의 재현성이 깨진다 |

🔴 **CLAUDE.md 규칙 5-2 §1의 「13곳」 표현 정정 필요**: 중복은 13곳이 맞으나 **실제로 고쳐야 하는 운영 경로는 2곳**이다. 규칙의 취지(*"출처를 추가할 때 여러 곳을 고쳐야 하는 상태"*)는 유효하다 — **앞으로 만드는 probe가 또 복붙할 것이기 때문**이다. **이 정정은 939 이후 별도 판정으로 반영한다(이 STEP에서 CLAUDE.md를 고치지 않는다).**

### ① 3번 검색 ＋ ⓪-5-B (link_hub 병행 조회)

```
필요한 데이터 : 없음 — 이 STEP은 외부 데이터를 새로 들이지 않는 내부 리팩터다
link_hub 후보 : 해당 없음 (조회 대상이 외부 데이터가 아님)
실제 조회     : 미실시
직접 웹검색   : 미실시
```

🔴 **못 한 축으로 명시**: 외부 검색·link_hub 조회를 **하지 않았다.** 사유 = 이 STEP의 대상이 **저장소 내부 구조**뿐이며, 외부 출처(나스닥·SEC)는 939 이후에 들어온다. 🔴 **939에서는 반드시 ⓪-5-B 4단계를 돈다.**

### ② 3번 검증 — **동작 불변을 무엇으로 증명하나**

| # | 검증 | 방법 |
|:--:|---|---|
| 1 | **입력→출력 동등** | 같은 `damodaran_industry` 행 집합에 대해 **기존 인라인 코드와 새 함수가 동일한 `Map`을 만든다** — 유닛테스트로 고정 |
| 2 | **skip 동작 동등** | `NO_INDUSTRY` 발생 조건이 그대로여야 한다. 🔴 **여기가 깨지면 604 모집단이 변한다** |
| 3 | **반대 증거 탐색** | 🔴 `probe_866_universe.ts`가 `exchange`를 추가로 select한다 — **운영 2곳은 그 필드를 안 쓰므로** 함수 시그니처에 넣지 않는다. 넣으면 쓰지도 않을 파라미터가 생긴다(규칙 5-2 ③ 위반) |

### ④ 3번 검수 (자기 공격)

1. 🔴 *"함수만 만들고 안 쓰면 죽은 코드"* → 그래서 **운영 2곳 교체까지 이 STEP에 포함**했다.
2. 🔴 *"페이지네이션 루프를 잘못 옮기면 6,937행 중 일부가 누락된다"* → 함수가 **행 수를 반환**하게 하고, 테스트에서 **1,000행 경계**(range 페이징)를 검증한다.
3. 🔴 *"`toUpperCase()` 위치가 바뀌면 매칭이 달라진다"* → 기존 코드는 **조회 시점엔 정규화 없음, 사용 시점에 `symbol.toUpperCase()`**(route.ts:67)다. **이 STEP에서 정규화 규칙을 바꾸지 않는다**(구두점 정규화는 939).

---

## 실행 지시

### 1. `lib/sector.ts` 신설

```
목적: damodaran_industry 조회를 한 곳으로 모은다.
🔴 이 STEP에서는 Damodaran 단일 출처 · industryGroup 모드만 구현한다.

요구 사항
 - 함수 하나. 출처와 반환 필드를 인자로 받는다 (규칙 5-2 ①·③).
 - 반환에 값과 함께 「출처」를 담는다 (규칙 5-2 ④).
 - 조회 결과 행 수를 함께 반환한다 (검수 ②).
 - 🔴 Supabase 클라이언트는 인자로 주입받는다. 함수 안에서 만들지 않는다.
 - 🔴 페이지네이션(range 1000단위 루프)은 기존 route.ts:46과 동일하게 유지한다.
 - 🔴 티커 정규화·대소문자 처리는 이 STEP에서 추가하지 않는다 (939).

시그니처는 아래 뜻이 지켜지면 이름·형태는 재량:
 - 입력: (sb, { field: "industryGroup", source: "damodaran" })
 - 출력: { byTicker: Map<string, string>, rows: number, source: "damodaran" }
```

### 2. 운영 경로 2곳 교체 — **🔴 동작 불변**

| 파일 | 위치 | 바꿀 것 |
|---|---|---|
| `app/api/cron/revdcf/route.ts` | `:45-47` | 인라인 루프 → `lib/sector.ts` 함수 호출. `:67`의 `indByT.get(...)`·`:68`의 `NO_INDUSTRY` **분기는 그대로** |
| `scripts/compute_revdcf_all.ts` | 동일 블록 | 같은 방식 |

🔴 **`probe_*` 11개는 건드리지 않는다.**

### 3. 테스트 (`lib/sector.test.ts` 신설 · vitest)

1. 정상: 3행 mock → `Map` 3건 · `rows: 3` · `source: "damodaran"`
2. 🔴 **페이징 경계**: 1,000행 + 1행을 두 번에 나눠 주는 mock → **1,001건 전부** 수집되는지
3. 빈 결과: 0행 → 빈 `Map` · `rows: 0` (예외 아님)
4. 🔴 **`NO_INDUSTRY` 회귀**: route 테스트(`route.branches.test.ts:97`)가 **그대로 통과**하는지 — 이 파일은 **수정하지 않는다**

### 4. 검증 (실행하고 결과를 보고할 것)

```
npm test                                  # 전체 통과 · 특히 route.test.ts · route.branches.test.ts
npx tsc --noEmit                          # 타입 통과
git diff --stat                           # 변경 파일이 3개(신규2 + 수정2)인지
```

🔴 **크론을 수동 실행하지 말 것.** 동작 불변은 **다음 정규 크론 실행 후** `revdcf_results` 최신 `as_of` 행 수(**604**)와 `skip_reason` 분포로 확인한다. 이 STEP에서는 **테스트·타입 통과까지만**이 성공 기준이다.

### 5. 문서

- `docs/CHANGELOG.md`에 **(94) STEP 938** 엔트리 — 위 ③에서 나온 **설계 변경 2건**(용도 분리 · 「13곳」 성격 정정)을 반드시 포함
- `docs/STATE.md` ▶다음 0번 표의 **①단계 상태 갱신**
- 🔴 **`CLAUDE.md`·`docs/USER_QUESTIONS_2026-08-08.md`·`docs/LENS_COMPLETION_STANDARD.md`는 이 STEP에서 고치지 않는다**

---

## 🔴 금지 (전부 불변)

- `REVDCF_ENABLED` 환경변수 — **손대지 않는다**
- `data/us_symbols.json` · `.github/workflows/**` · `vercel.json` — **수정 금지**
- `revdcf_results` · `us_market_cap` · `lens_scores` · `lens_cuts` — **쓰기 금지**
- 크론 수동 실행 — **금지**(특히 `email-brief`)
- `RETRY_MAX` · `RETRY_MS` · 게이트 · 임계값 · `maxDuration` — **불변**
- `probe_*` 11개 파일 — **불변**
- KR 관련(`ACTIVE_MARKETS` · KR 크론 3개 · `messages/ko.json` · `messages.test.ts` 패리티) — **끄지 않는다**

## 성공 기준

1. `npm test` 전체 통과 (신규 테스트 4건 포함)
2. `npx tsc --noEmit` 통과
3. `git diff` 상 **로직 변경 0** — 조회 코드가 이동했을 뿐임이 육안으로 확인됨
4. 변경 파일 4개: `lib/sector.ts`(신규) · `lib/sector.test.ts`(신규) · `route.ts` · `compute_revdcf_all.ts`
5. 🔴 **판정 불변은 이 STEP에서 확정하지 않는다** — 다음 정규 크론 후 별도 확인

## 🔴 막히면

**추측해서 진행하지 말고 멈추고 보고할 것.** 특히 `NO_INDUSTRY` 분기나 페이징에서 기존과 다른 동작이 나오면 **되돌리고 보고**한다.
