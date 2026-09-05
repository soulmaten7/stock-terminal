# STEP 866 — 역DCF 모집단 실측 (측정 전용 · 프로덕션 무변경)

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그다음 붙여넣기:

```
@docs/STEP_866_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a15959d` (`docs: reopen universe layer (A-9)...`) · 코드 HEAD `9c5185b`(STEP 865) · working tree clean · tsc 0 · vitest 151/151 · `REVDCF_ENABLED` OFF

**목표**: "물려받은 1,000"이 아니라 **실제 모집단** 위에서, **컷 없이 전수 계산**했을 때 몇 개가 산출되고 분포가 현행 604와 어떻게 다른지 **잰다.**

---

## 🔴 금지사항 — 어기면 STEP 실패

| # | 금지 |
|---|---|
| 1 | `lib/revdcf/**` 수정 (engine·drivers·compute 전부) — **import만** |
| 2 | `revdcf_results` 테이블에 INSERT / UPDATE / UPSERT / DELETE — **읽기만** |
| 3 | `app/**` 수정 · 피처 플래그 변경 · 화면 변경 |
| 4 | `docs/probe_survivors.json` 덮어쓰기 (7/31 고정본 · 현행 유니버스 원본) |
| 5 | 컷 제안 · 채택 권고 · "이렇게 하는 게 좋겠다" — **숫자와 사유만 보고** |
| 6 | `git push` — 커밋까지만. push는 장은태 확인 후 |
| 7 | 유동성(FALR) 컷 적용 — **폐기 후보**다. 계산에 넣지 말 것 |

**🔴 2번이 왜 절대 금지인가 (반드시 읽을 것)**
`app/api/cron/revdcf/route.ts:23` 주석 = *"유니버스 = 직전 as_of의 CIK 집합"*.
크론은 **어제 행을 읽어 오늘 유니버스를 만든다.** 866이 확대 유니버스를 새 as_of로 저장하면 **다음 크론이 그것을 영구히 상속**한다. 되돌리려면 DB를 손으로 지워야 한다. 866 산출물은 **`docs/probe_866_*.json` 파일로만** 남긴다.

---

## 1단계 — 원본 저장 (규칙 ⓪)

`data/sources/sec/` 디렉터리를 만들고 아래를 **원본 그대로** 저장한다. 요약본 금지.

```bash
mkdir -p data/sources/sec
UA="Trillion Research admin@onetrillion.app"

curl -sL -A "$UA" -o data/sources/sec/sec_reporting_issuers_20260630.xlsx \
  "https://www.sec.gov/files/sec-stats-reporting-issuers-20260630.xlsx"

curl -sL -A "$UA" -o data/sources/sec/company_tickers_exchange_20260802.json \
  "https://www.sec.gov/files/company_tickers_exchange.json"

ls -la data/sources/sec/
```

`data/sources/README.md`에 두 파일 항목 추가:

| 파일 | 무엇을 정의하나 | 갱신 주기 | 좌표 |
|---|---|---|---|
| `sec_reporting_issuers_20260630.xlsx` | SEC 공식 제출사 수 (모집단 상한의 공식 근거) | 연 1회 (직전 갱신 2026-06-30) | `Stats Table` 시트 · `2025` 행 · `U.S. domiciled exchange listed companies` 열 |
| `company_tickers_exchange_20260802.json` | CIK ↔ ticker ↔ exchange 전수 매핑 | SEC 미명시 | `fields` / `data` 배열 |

**🔴 확인 사항**: `company_tickers_exchange.json`은 SEC EDGAR API 공식 문서에 **언급이 없다**(로컬 원본 `data/sources/text/sec_edgar_api.html` 확인 완료). 파일 페이지에도 스키마·갱신주기 설명이 없다. → README에 **"SEC 문서에 스코프·갱신주기 서술 없음"** 이라고 적을 것. 이유를 지어내지 말 것.

---

## 2단계 — 모집단 사다리 실측

**신규 파일**: `scripts/probe_866_universe.ts` (측정 전용)

**재사용할 것** (새로 만들지 말 것):
- `scripts/probe_839_reverify.ts`의 `secGet()` · `throttle()` · `mapLimit()` · `frames()` — 그대로 복사
- 컷 로직은 `probe_839_reverify.ts:88-89` 그대로: SIC `6000~6999` 제외 · `6798` 제외 · `6770` 제외 · `annualForm`이 `20-F`/`40-F` 이면 제외 · 매출 태그 없으면 제외

**바뀌는 것 단 하나**: 시작점이 `us_market_cap` 상위 1,000이 아니라 **`company_tickers_exchange.json` 전수**다.

산출: `docs/probe_866_ladder.json`

```
{
  "probedAt": "...",
  "ladder": {
    "tickersExchangeTotal":  ?,   // company_tickers_exchange.json 전체 엔트리
    "uniqueCik":             ?,   // 중복 티커 제거 후 CIK 수
    "hasAnnualForm":         ?,   // 10-K/20-F/40-F 중 하나라도 제출
    "afterForeignCut":       ?,   // 20-F·40-F 제외 (= 10-K 제출사)
    "afterSicFinancialCut":  ?,   // SIC 6000~6999 제외
    "afterReitSpacCut":      ?,   // 6798·6770 제외
    "afterRevenueCut":       ?,   // 매출 태그 있음
    "final":                 ?
  },
  "droppedBy": { "foreign": ?, "sicFinancial": ?, "reit": ?, "spac": ?, "noRevenue": ?, "noAnnualForm": ? },
  "secOfficial": {
    "source": "data/sources/sec/sec_reporting_issuers_20260630.xlsx",
    "cy2025_usDomiciledExchangeListed": 3714,
    "cy2025_usDomiciledExchangeListed_nonShell": 3692,
    "ttm2025Q2_2026Q1_usDomiciled": 3600,
    "ttm2025Q2_2026Q1_usDomiciled_nonShell": 3589
  },
  "gapVsOfficial": "우리 final − 3692 = ? · 차이 사유 서술"
}
```

**🔴 `secOfficial` 숫자는 1단계에서 내려받은 xlsx를 스크립트가 직접 읽어서 채운다.** 위 값은 대조용 기대치이고, **파일에서 읽은 값과 다르면 파일 값을 쓰고 불일치를 기록**한다.

**🔴 정의 차이를 반드시 기록할 것**: SEC의 "미국 소재 거래소 상장 비셸 3,692"에는 **금융업이 포함**돼 있고, 우리는 SIC 6000~6999를 뺀다. 따라서 3,692는 **상한**이지 목표치가 아니다. 두 수가 다른 게 정상이고, **얼마나 왜 다른지**가 866의 산출물이다.

---

## 3단계 — 컷 없이 전수 계산

같은 스크립트 안에서, 2단계 `final` 집합 전체에 대해 **기존 엔진을 그대로 호출**한다.

```ts
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import { runRevDcf } from "../lib/revdcf/engine";
```

조립 순서·파라미터는 `app/api/cron/revdcf/route.ts`의 `processOne()`을 **그대로 따라간다**(`maxYears: 25` 포함). 참조 데이터(`damodaran_*`)도 동일하게 DB에서 읽는다. **값을 코드에 박지 말 것.**

### 데이터 조달 — companyfacts

🔴 **개별 호출 4,000회 전에 벌크를 먼저 검토한다.** SEC 공식 문서(`data/sources/text/sec_edgar_api.html`) 원문:

> *"The most efficient means to fetch large amounts of API data is the bulk archive ZIP files, which are recompiled nightly."*
> `https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip`

**절차**:
1. `curl -sIL -A "$UA" <companyfacts.zip>` 로 **`Content-Length` 먼저 확인** → 콘솔에 출력
2. 디스크 여유가 그 2배 이상이면 **벌크 사용** (다운로드 → 필요한 CIK만 추출 → 원본 zip 삭제)
3. 여유가 없으면 **개별 호출 + 로컬 캐시**(`/tmp/866_cf/CIK##########.json`)로 폴백. 재실행 시 캐시 히트
4. 🔴 **어느 경로를 썼는지 산출물에 기록**한다

**🔴 크기를 추측해서 적지 말 것.** 실제 헤더 값만 쓴다.

### 결과 3분류 — 절대 합치지 말 것

| 버킷 | 정의 | 하위 태그 |
|---|---|---|
| **(a) 산출됨** | `verdict = years` | `gap_years` 값 |
| **(b) 판정 불가** | 계산은 됐으나 연수가 안 나옴 | `value_destroying` / `over_cap` / `below_one` |
| **(c) 입력 부족** | 계산 자체가 불가 | `INSUFFICIENT_HISTORY` · `MISSING_TAG` · `NOT_APPLICABLE_SECTOR` · `MULTI_CLASS_SHARES` · `NO_INDUSTRY` · `NO_MARKETCAP` · `HTTP_*` · `EX` |

🔴 **(b)와 (c)를 한 칸에 넣지 말 것.** *"계산했는데 감춤"*과 *"계산 못 함"*은 다른 것이다(REVDCF_SPEC A-9 ③-3).

🔴 **(c) 안에서 "우리 탓"과 "회사 탓"을 나눌 것.**
- `NO_MARKETCAP` · `NO_INDUSTRY` = **우리 조달 실패** (`us_market_cap` 5,886행 · `damodaran_industry` 커버리지 한계). 회사가 공시를 안 한 게 아니다.
- `INSUFFICIENT_HISTORY` · `MISSING_TAG` = **회사 공시 부재**
- 이 둘의 개수를 따로 세고, `NO_MARKETCAP`이 지배적이면 **그 사실을 그대로 보고**한다. 해결책은 제안하지 말 것.

---

## 4단계 — 604 대비 분포 변화

산출: `docs/probe_866_output.json`

**기준선** (Cowork이 2026-08-02 Supabase MCP로 실측 · `as_of = 2026-08-03`):

```
604 = 산출 515 + 스킵 89
  years            177  (34.4% · 중앙 11년 · 범위 1~24)
  value_destroying 149  (28.9%)
  over_cap         102  (19.8% · 중앙 explained_pct 0.546)
  below_one         87  (16.9%)
스킵 89:
  INSUFFICIENT_HISTORY 39 · MISSING_TAG 31 · NO_INDUSTRY 10 ·
  MULTI_CLASS_SHARES 5 · NOT_APPLICABLE_SECTOR 4
  (NO_MARKETCAP · HTTP_* · EX = 0건)
```

**비교 항목** (전수 vs 604 나란히):

| 항목 | 604 | 전수 |
|---|---|---|
| 모집단 N | 604 | ? |
| 산출률 = (a)÷N | 29.3% | ? |
| GAP 중앙값 | 11년 | ? |
| GAP p25 / p75 | ? | ? |
| `over_cap` 비율 | 16.9% | ? |
| `value_destroying` 비율 | 24.7% | ? |
| 잔여가치 비중 중앙값 | ? | ? |
| 업종 군집 ICC | 0.195 (기록값) | ? |

🔴 604 쪽 빈칸도 같은 스크립트가 DB에서 읽어 채운다. **Cowork이 준 숫자를 그대로 베끼지 말고 재조회해서 일치하는지 확인**하고, 다르면 **다르다고 기록**한다.

🔴 **시총 구간별로 쪼개서 볼 것**: 전수에 들어온 신규 종목이 어느 시총대에 몰리는지, 그 구간의 산출률이 604 구간과 다른지. 이게 "컷이 필요한가"의 재료다. **재료만 만들고 판단은 하지 말 것.**

---

## 5단계 — 문서 정정 2건 (코드 0)

**(1) `data/sources/text/EXTERNAL_UNIVERSE_QUOTES.md`**
Morningstar 절의 *"🔴 원본 PDF 미저장 (텍스트만 취득)"* → **삭제하고** 실제 경로로 교체:
`data/sources/external/morningstar_quant_methodology_2024-12-02.pdf` (813KB · 2026-08-02 확보)

**(2) `docs/REVDCF_SPEC.md` A-9 ②**
"SEC 영업이익 보고 기업(천장) 4,998(CY2024) — `frames` 기반이라 하한이다" 행을 아래로 교체:

> 🔴 **정정(2026-08-02)**: 4,998은 **하한이 아니라 다른 모집단**이다. `frames/OperatingIncomeLoss CY2024`는 그 태그를 보고한 **모든 filer**를 센다 — OTC 1,537 · 외국 소재 937 · ADR 394 포함(SEC 공식 분류). 우리 유니버스(미국 소재·거래소 상장·10-K)와 **같은 자로 잰 수가 아니다.**
> **대조 기준을 SEC 공식 통계로 교체한다**: 미국 소재 거래소 상장 **3,714**(CY2025) · 그중 비셸 **3,692** · 직전 4분기(2025:Q2~2026:Q1) **3,600 / 비셸 3,589**. 출처 = `data/sources/sec/sec_reporting_issuers_20260630.xlsx`.
> 🔴 단 이 수에는 **금융업이 포함**돼 있으므로 우리 목표치가 아니라 **상한**이다.
> 참고: Morningstar Quant "미국 4,379" > SEC "미국 상장 3,929"(CY2024)이므로 모닝스타 집합에는 OTC가 섞여 있다. **604와 4,379를 직접 비교하면 안 된다.**

---

## 6단계 — 검증 후 멈춘다

```bash
npx tsc --noEmit          # 0
npx vitest run            # 151/151
git status --short        # revdcf_results 관련 변경 없어야 함
```

**DB 무변경 확인** (필수):

```bash
# 866 실행 전후로 아래 결과가 동일해야 한다
psql 대신 Supabase 대시보드 또는:
#   select as_of, count(*) from revdcf_results group by as_of order by as_of desc;
# 기대: 2026-08-03 / 08-02 / 08-01 각 604 — 새 as_of가 생기면 실패다
```

**커밋** (push는 하지 말 것):

```bash
git add scripts/probe_866_universe.ts docs/probe_866_ladder.json docs/probe_866_output.json \
        data/sources/sec/ data/sources/README.md \
        data/sources/text/EXTERNAL_UNIVERSE_QUOTES.md docs/REVDCF_SPEC.md
git commit -m "STEP 866: measure true US population and full-universe yield without cuts (measurement only)

- data/sources/sec/: SEC official reporting-issuers stats + company tickers/exchange (rule 0)
- probe_866_universe.ts: population ladder from company_tickers_exchange.json, existing cuts reused
- full-universe run with no liquidity cut, 3-way tagging (computed / undecidable / insufficient input)
- distribution delta vs inherited 604
- fix: frames 4,998 was a different population, not a lower bound; replace with SEC official figures
- no code changes to lib/revdcf, no writes to revdcf_results, flag unchanged"
```

## 🔴 마지막 — 다음 항목 제안 금지

실행이 끝나면 **결과 숫자만 보고하고 멈춘다.**
"다음은 컷을 정하시죠" · "DoD 4로 넘어가죠" 같은 말을 붙이지 말 것. 판정은 장은태가 한다.

**보고 형식**:
```
모집단 사다리: (각 단계 수)
전수 계산: N = ? → 산출 ? / 판정불가 ? / 입력부족 ?
604 대비: 산출률 ?% → ?% · GAP 중앙 11년 → ?년
입력부족 내역: 우리 조달 실패 ? / 회사 공시 부재 ?
companyfacts 조달 경로: (벌크 / 개별+캐시) · Content-Length 실측값
tsc 0 · vitest ?/? · revdcf_results 무변경 확인
```
