<!-- 2026-08-08 · Cowork 작성 · Claude Code 실행용 -->

# STEP 939 — Q0 구현 ③-1단계: **출처 정본화 ＋ 진짜 GICS 정답지 확보**

> **범위**: 외부 출처 2종을 **규칙 ⓪대로 원본 보존 ＋ `registry.ts` 좌표 등재** ＋ **정답지 대조 실측 재현**.
> 🔴 **DB 테이블 신설·적재는 이 STEP에 없다**(940). **`lib/sector.ts`도 고치지 않는다**(940).
> **정본**: `docs/USER_QUESTIONS_2026-08-08.md` §Q Q0 · 진행표 = `docs/STATE.md` ▶다음 0번 ③단계

---

## 🔑 이 STEP이 생긴 이유 — Cowork이 ⓪-5-B를 돌다가 정답지를 찾았다

`link_hub`의 **`etf` 카테고리**를 실제로 조회하다 **State Street SPDR 섹터 ETF holdings**가 나왔다. **11개 ETF의 구성종목 = S&P 500 종목의 진짜 GICS 섹터**이고 **무료**다.

🔴 **Cowork의 이전 주장 정정**: *"무료 소스는 진짜 GICS를 줄 수 없다"* → **전 종목은 못 주지만 S&P 500 구성종목은 준다.** `CLAUDE.md` ⓪-5-B와 `USER_QUESTIONS` §Q Q0 정의 공개표에 이 정정이 필요하다(🔴 **이 STEP에서 고치지 말 것** — 940 이후 별도 판정).

---

## ⓪-4 4×3 기록 (실행 순서 ③ → ① → ② → ④)

### ③ 자체 데이터 확인

| # | 열어본 것 | 결과 |
|:--:|---|---|
| 1 | `lib/revdcf/registry.ts` | `MATERIAL_SOURCES`에 damodaran·sec만 있음 — **나스닥·SPDR 미등재** |
| 2 | `data/sources/README.md` | `nasdaq/` 절은 938 이전에 신설됨. 🔴 **`spdr/` 없음** |
| 3 | `registry.ts` `damodaran.storage` | 버킷 `sources` · 경로 `damodaran/{as_of}/{file}` — **나스닥도 같은 규칙을 따른다** |
| 4 | `app/api/yahoo/us-etf-performance/route.ts:41` | 🔑 **XLY 등 섹터 ETF가 이미 코드에 있다**(성과 표시용) — 티커 목록 재활용 가능 |
| 5 | Supabase 직접 조회 | `damodaran_industry` `is_us_listed=true` 중 SPDR 겹침 **490종목** |

### ① 3번 검색 ＋ ⓪-5-B (link_hub 병행 조회 — **실제 수행함**)

```
필요한 데이터 : 미국 종목의 「진짜 GICS 섹터」 + 나스닥 스크리너의 갱신 특성
link_hub 후보 : etf(State Street SPDR · iShares · Vanguard · ETF.com · VettaFi)
                exchange(Nasdaq) · analysis(Stock Analysis · FMP)
실제 조회     : 🟢 되는 곳  — SPDR 11/11 xlsx 취득 성공(515종목·`As of 06-Aug-2026`)
                             Nasdaq 스크리너 7,127행 재조회 성공
                🔴 안 되는 곳 — iShares IVV holdings CSV = HTML 반환(차단)
                🔴 키 필요   — FMP(401)
직접 웹검색   : GICS 라이선스 확인(S&P DJI·MSCI 공동 소유)
```

### ② 3번 검증 — 실측 (Cowork 수행 · **이 STEP에서 재현할 것**)

| 검증 | 결과 |
|---|---|
| **나스닥 갱신 특성** | 🔴 응답의 **`data.asOf = None`** — API가 기준일을 안 준다. 같은 날 재조회 시 7,127행 **sector·industry 변경 0건**. → **우리가 `as_of`를 직접 찍어야 한다**(Damodaran과 동일 구조) |
| 🔑 **정답지 대조** | **Damodaran `primary_sector` vs SPDR 진짜 GICS = 488/490 = 99.6% 일치.** 불일치 **2건**: `APP`(Damodaran=IT / GICS=Communication Services) · `DD`(Damodaran=Materials / GICS=Industrials) |
| 🔑 **형제-우선 규칙 독립 확인** | 미매핑 219 중 SPDR에 **10종목** 존재 — `GOOG`→**Communication Services** ✅(나스닥·SEC SIC는 둘 다 Technology로 오답) · `FOX`·`NWS`·`BRK-B`·`BF-B` 등도 형제 규칙과 일치 |

🔑 **이 실측이 Q0 설계 전체를 뒷받침한다** — 1순위 출처(Damodaran 802)가 **정답지 대비 99.6%**임이 처음으로 확인됐다.

### ④ 3번 검수 (자기 공격)

1. 🔴 **SPDR holdings에 정상 종목이 아닌 줄이 섞인다.** 실측에서 `2602335D`·`IXAU6`·`IXCU6`·`XARU6`·`Q`·`ECHO`·`FDXF`·`HONA`·`MRSH`·`PSKY`·`SNDK` 같은 티커가 관측됐다(현금/선물/분할·when-issued 추정). → **정답지에 넣기 전에 걸러야 한다.** 판단 근거를 만들지 말고 **거른 목록을 그대로 기록**할 것.
2. 🔴 **SPDR은 S&P 500만 커버한다**(515종목). 우리 1,021 중 절반이고 **미매핑 219는 10건만** 걸린다. **커버리지 해결책이 아니라 「정답지」다.** 이 STEP에서 출처 우선순위를 바꾸지 말 것 — 940에서 판정.
3. 🔴 **SPDR holdings는 지수 리밸런싱마다 바뀐다.** `as_of`를 반드시 함께 보존한다.

---

## 실행 지시

### 1. SPDR 원본 취득 스크립트 ＋ 보존

`scripts/fetch_spdr_sectors.ts` (또는 프로젝트 관행에 맞는 위치) 신설.

```
대상 11개 (ETF 티커 → GICS 섹터)
  XLK→Information Technology  XLF→Financials      XLV→Health Care
  XLE→Energy                  XLI→Industrials     XLY→Consumer Discretionary
  XLP→Consumer Staples        XLU→Utilities       XLB→Materials
  XLRE→Real Estate            XLC→Communication Services

URL 패턴 (실측 검증됨)
  https://www.ssga.com/us/en/intermediary/library-content/products/fund-data/etfs/us/holdings-daily-us-en-{소문자티커}.xlsx
  🔴 User-Agent 없으면 실패할 수 있음 — 브라우저 UA 헤더 필요

xlsx 구조 (실측)
  3행: "Holdings:" | "As of 06-Aug-2026"      ← as_of 여기서 파싱
  헤더행: Name | Ticker | Identifier | SEDOL | Weight | Sector | Shares Held | Local Currency
          🔴 헤더 위치를 고정 숫자로 박지 말고 첫 열이 "Name"인 행을 찾을 것
  본문: Ticker 열이 종목코드. 🔴 "Sector" 열은 "-"라 쓸 수 없다 — 섹터는 ETF 티커가 결정한다

저장
  data/sources/spdr/spdr_sector_holdings_{as_of}.json
  형식: { "_meta": { source, acquired, asOf, etfCount, rows }, "data": [ {ticker, name, etf, sector} ] }
  🔴 걸러낸 비정상 티커는 버리지 말고 "_meta.excluded" 에 목록으로 남길 것
```

**필터 규칙(명시적으로 코드에 적고, 근거를 주석으로)**
- 티커가 없거나 `-`인 줄 제외
- 🔴 그 외 무엇을 제외할지는 **임의로 정하지 말 것.** 위 검수 ①의 관측 목록을 **그대로 `excluded`에 남기고, 제외 여부는 940에서 판정**한다. 이 STEP에서는 **관측·보존까지**.

### 2. 나스닥 원본 Supabase Storage 업로드

```
버킷: sources      (registry.ts damodaran.storage와 동일 관행)
경로: nasdaq/2026-08-08/nasdaq_screener_20260808.json
로컬: data/sources/nasdaq/nasdaq_screener_20260808.json  (이미 존재 · git 제외됨)

SPDR도 같은 방식으로: spdr/{as_of}/{파일명}
🔴 버킷이 없으면 만들지 말고 멈추고 보고할 것.
```

### 3. `lib/revdcf/registry.ts`에 좌표 등재

🔴 **값이 아니라 좌표를 적는다**(파일 머리 규칙 1). `MATERIAL_SOURCES`에 두 항목 추가:

```
nasdaq:  base/endpoint URL · 필드 목록 · 🔴 "asOf 없음 — 우리가 as_of를 찍는다" ·
         storage 경로 규칙 · 🔴 "분류 체계가 GICS 아님(12개·Communication Services 없음)"
spdr:    URL 패턴 · 11개 ETF↔섹터 대응 · xlsx 구조 · storage 경로 규칙 ·
         🔴 "S&P 500만 커버(약 515) — 커버리지 아니라 정답지 용도"
```

### 4. 정답지 대조 실측 **재현** (판정 아님 · 사실 기록)

`scripts/probe_939_gics_truth.ts` 신설. 아래를 **직접 계산**해 결과를 출력하고 `docs/probe_939_gics_truth.json`에 저장:

1. SPDR 정답지 규모 · `as_of`
2. `damodaran_industry`(`is_us_listed=true`) `primary_sector` **vs** SPDR — **겹친 종목 수 · 일치 수 · 일치율 · 불일치 전건 목록**
3. **미매핑 219** 중 SPDR에 있는 종목과 그 섹터
4. 🔴 티커 정규화는 **구두점 제거 후 대문자**로 통일(`BRK.B`·`BRK-B`→`BRKB`)

**Cowork 실측값(대조용 · 이 값이 나와야 정상)**

| 항목 | 기대값 |
|---|---|
| SPDR 구성종목 | **515** (as of 2026-08-06) |
| Damodaran과 겹침 | **490** |
| 🔑 일치 | **488 / 490 = 99.6%** |
| 불일치 | **2건** — `APP` · `DD` |
| 미매핑 219 중 SPDR 존재 | **10건** (`GOOG`·`FOX`·`NWS`·`BRK-B`·`BF-B`·`BNY`·`MRSH`·`ECHO`·`FDXF`·`HONA`) |

🔴 **숫자가 다르면 멈추고 보고할 것.** SPDR `as_of`가 갱신됐다면 그 사실과 함께 새 값을 보고한다 — **기대값에 맞추려고 필터를 조정하지 말 것.**

### 5. 문서

- `data/sources/README.md` — **`spdr/` 절 신설**(URL 패턴·xlsx 구조·11개 대응표·🔴 S&P 500 한정) ＋ `nasdaq/` 절에 **`asOf=None` 실측** 추가
- `.gitignore` — SPDR 원본 크기를 보고 판단. **1MB 미만이면 git 포함**(정답지라 이력이 있는 게 낫다), 이상이면 제외 후 Storage
- `docs/CHANGELOG.md` **(95) STEP 939** — 🔑 **정답지 발견 경위(⓪-5-B 실행 중 나옴)와 99.6% 실측**을 반드시 포함
- `docs/STATE.md` ▶다음 0번 ③단계 상태 갱신
- `docs/STEP_LEDGER.md` 등재

🔴 **`CLAUDE.md` · `docs/USER_QUESTIONS_2026-08-08.md` · `docs/LENS_COMPLETION_STANDARD.md`는 고치지 않는다.** *"무료로는 진짜 GICS 불가"* 정정과 **출처 우선순위 변경(SPDR을 0순위로 올릴지)**은 **장은태 판정 사항**이다.

---

## 🔴 금지 (전부 불변)

- **DB 테이블 신설·마이그레이션 — 이 STEP에서 금지**(940)
- `lib/sector.ts` — **수정 금지**(940)
- `REVDCF_ENABLED` · `data/us_symbols.json` · `.github/workflows/**` · `vercel.json` — 불변
- `revdcf_results` · `us_market_cap` · `lens_scores` · `lens_cuts` — **쓰기 금지**
- 크론 수동 실행 — **금지**(특히 `email-brief`)
- `probe_*` 기존 11개 — 불변
- KR 관련(`ACTIVE_MARKETS` · KR 크론 3개 · `messages/ko.json` · `messages.test.ts` 패리티) — **끄지 않는다**
- 🔴 **API 키·비밀번호를 어떤 필드에도 입력하지 않는다**

## 성공 기준

1. SPDR 11/11 취득 성공 · `data/sources/spdr/`에 `as_of` 포함 보존
2. Storage `sources` 버킷에 나스닥·SPDR 업로드 완료 (경로 보고)
3. `registry.ts`에 두 출처 좌표 등재 · `npx tsc --noEmit` 통과 · `npm test` 통과
4. 🔑 **정답지 대조 재현** — 위 기대값과 일치(다르면 보고)
5. `git diff` 상 **금지 경로 diff 0**

## 🔴 막히면

**추측해서 진행하지 말고 멈추고 보고할 것.** 특히 ① SPDR URL이 404/차단 ② Storage 버킷 부재 ③ 대조 숫자 불일치 — 이 셋은 **반드시 멈춘다.**
