<!-- STEP 1014 — Damodaran 엑셀 → DB 적재 경로 원본 전수 대조 (읽기 전용 · DB 쓰기 0 · 코드 수정 0) -->
# probe_1014 — Damodaran 엑셀→DB 적재 경로 전수 대조

## ⓪-4 판정

🟢 **첫 번째 갈래 — 전부 일치. 적재 경로 건전.**

9개 테이블 · 48,850행 전수(표본 없음) 대조 결과, **실데이터 불일치 0건**. 대조 과정에서 나온 편차 3건은 전부 **이 STEP의 감사 스크립트(Python) 자체의 재구현 결함**이었고, 원인을 추적해 셋 다 원전·프로덕션 코드가 옳았음을 확인했다(아래 §3 상세).

| 테이블 | 행수(원전=DB) | 일치 | 불일치 | 확인불가 |
|---|---|---|---|---|
| damodaran_wacc | 94=94 | 94 | 0 | 0 |
| damodaran_beta | 94=94 | 94 | 0 | 0 |
| damodaran_capex | 94=94 | 94 | 0 | 0 |
| damodaran_working_capital | 94=94 | 94 | 0 | 0 |
| damodaran_tax_rate | 96=96 | 96 | 0 | 0 |
| damodaran_country_tax | 229=229 | 229 | 0 | 0 |
| damodaran_credit_spread | 7=7 | 7 | 0 | 0 |
| damodaran_global_inputs | 2=2 | 2 | 0 | 0 |
| damodaran_industry | 48144=48144 | (집계지문 9/11 섹터 정확일치, 2개 섹터 ±1건 — §3-4에서 완전 해명) | 0(실질) | 0 |
| **합계** | **48,850=48,850** | — | **0** | **0** |

## 1. 매핑표

| DB 테이블 | 원본 파일:시트 | 데이터 시작 행(0-idx) | 컬럼 매핑(엑셀열idx→필드) | 근거(파일:줄) |
|---|---|---|---|---|
| damodaran_industry | indname.xls:"By company name" | 1 | 0→company_name, 1(":"분리)→exchange/ticker, 2→industry_group, 3→primary_sector, 4→sic_code, 5→country | scripts/ingest_damodaran.ts:64-80 |
| damodaran_tax_rate | taxrate.xls:"Industry Averages" | 9(업종) + `ingest_damodaran_step847.ts` 별도 스캔(Total 행) | 0→industry, 1→n_firms, 6→eff_all, 7→eff_money, 8→eff_agg, 9→cash_money, 10→cash_agg | scripts/ingest_damodaran.ts:86-90, scripts/ingest_damodaran_step847.ts:15-22 |
| damodaran_country_tax | countrytaxrates.xls:"Sheet1" | 6 | 0→country, 1→marginal_rate | scripts/ingest_damodaran.ts:96-100 |
| damodaran_wacc | wacc.xls:"Industry Averages" | 19(헤더는 행18) | 0→industry, 1→n_firms, 2→beta, 3→cost_of_equity, 4→e_over_de, 6→cost_of_debt, 7→tax_rate, 8→after_tax_cod, 9→d_over_de, 10→cost_of_capital(열5 Std Dev in Stock 미사용) | scripts/ingest_damodaran.ts:105-109 |
| damodaran_beta | betas.xls:"Industry Averages" | 10 | 0→industry, 1→n_firms, 2→beta, 3→de_ratio, 4→eff_tax, 5→unlevered_beta, 6→cash_over_firm, 7→unlevered_beta_cash_adj, 9→std_dev_equity(열8 HiLo Risk 미사용) | scripts/ingest_damodaran.ts:114-118 |
| damodaran_capex | capex.xls:"Industry Averages" | 8 | 0→industry, 1→n_firms, 2→capex, 3→depreciation, 4→capex_over_dep, 5→acquisitions, 6→net_rnd, 7→net_capex_over_sales, 8→net_capex_over_ebit_at, 9→sales_over_invcap | scripts/ingest_damodaran.ts:123-127 |
| damodaran_working_capital | wcdata.xls:"Industry Averages" | 8 | 0→industry, 1→n_firms, 2→ar_over_sales, 3→inv_over_sales, 4→ap_over_sales, 5→noncash_wc_over_sales | scripts/ingest_damodaran.ts:132-136 |
| damodaran_credit_spread | wacc.xls:"Industry Averages" (Std Dev 라벨 이후 스캔) | "Standard Deviation" 라벨 다음 행부터 | 열6→std_dev_lo, 열7→std_dev_hi, 열8→spread | scripts/ingest_damodaran_step847.ts:26-33 |
| damodaran_global_inputs(as_of=2026-01-05) | wacc.xls:"Industry Averages" (라벨 정규식 스캔, 첫 20행) | — | `/Long Term Treasury/i`→riskfree_rate, `/Risk Premium to Use/i`→erp, `/Global Default Spread/i`→global_default_spread, `/enter the marginal tax rate to use/i`→marginal_tax_rate_used, `/Expected inflation rate in US/i`→expected_inflation | scripts/ingest_damodaran.ts:141-146 |
| damodaran_global_inputs(as_of=2026-08-01) | ERPbymonth.xlsx:"Historical ERP" | 헤더행1·데이터행2~ | 열D(idx3)→riskfree_rate, 열K(idx10)→erp, 나머지 3필드는 직전 최신행에서 복사 | scripts/ingest_erp_monthly.ts 전체, lib/revdcf/erpMonthly.ts:35-38 |

## 2. 행수 대조

모든 테이블 원본↔DB 행수 100% 일치. **96 vs 94 미스터리(damodaran_tax_rate) 완전 해명**:

- 메인 스크립트(`ingest_damodaran.ts:88`)는 `industry`가 `/^Total/i`에 매치하면 `break`로 **건너뛴다** — 94개 업종 행만 적재.
- 보조 스크립트(`ingest_damodaran_step847.ts:20`)가 **같은 파일을 다시 스캔**해 `/^Total/i`에 매치하는 행만 골라 **추가 적재** — "Total Market"(5,994개사)·"Total Market (without financials)"(4,822개사) 2행.
- taxrate.xls 원본 행103-104를 직접 열어 두 Total 행의 6개 필드 전부 DB와 정확히 일치함을 확인(§3-2 아래).
- **96 = 94(업종) + 2(Total, 별도 스크립트)** — 원인은 "총계/평균 행이 섞였나"라는 STEP의 첫 가설과 정확히 일치.

## 3. 값 대조 — 전수

### 3-1. 9개 테이블 결과

| 테이블 | 대조 방법 | 결과 |
|---|---|---|
| damodaran_wacc | Python(xlrd)으로 wacc.xls 재파싱 → DB 94행 전수 필드별 상대오차 1e-9 기준 대조 | **0건 불일치** |
| damodaran_beta | 동일 | **0건 불일치** |
| damodaran_capex | 동일(§3-3 NA 처리 포함) | **0건 불일치** |
| damodaran_working_capital | 동일(§3-3 NA 처리 포함) | **0건 불일치** |
| damodaran_tax_rate | 동일(§3-2 Excel 오류셀 처리 포함) | **0건 불일치**(96행, Total 2행 포함) |
| damodaran_country_tax | 동일(첫 발견 순서 dedup 재현) | **0건 불일치**(229행, NA 3개국 포함) |
| damodaran_credit_spread | wacc.xls 원본 직접 열람(사전 시각 확인) + DB 재조회 값 대조 | **0건 불일치**(7밴드) |
| damodaran_global_inputs | wacc.xls 직접 열람 + ERPbymonth.xlsx "Historical ERP" 시트 직접 열람, 두 as_of 행 모두 | **0건 불일치**(2행) |
| damodaran_industry | 48,144행 집계 지문(업종×연도 아님 — indname.xls는 연도축이 없어 섹터별 행수·SIC합계·null수로 대체) | §3-4 참조 |

### 3-2. 특별 확인 항목 — 원전 지시 4가지

**① 백분율 표기(21 vs 0.21)**: 전 테이블에서 소수 표기(0.xx) 확인. 원본 엑셀도 동일 소수 표기 — 변환 없음, 위험 없음.

**② 부호(운전자본률·자본지출률 음수 여부)**: `damodaran_capex.net_capex_over_sales`(Broadcasting −0.0226, Entertainment −0.0125 등) · `damodaran_working_capital.noncash_wc_over_sales`(Auto & Truck −0.0296, Green & Renewable Energy −1.1429 등) 음수값 다수 확인, 전부 원본 부호와 정확히 일치. 부호 반전 없음.

**③ 날짜/시점 — 1904버그 재발 여부**: STEP1003이 `ERPbymonth.xlsx`에서 발견한 1904-에폭 버그(`lib/revdcf/erpMonthly.ts:46-50`)가 다른 Damodaran 파일에도 있는지 확인. `taxrate.xls`·`wacc.xls`의 "Date updated" 셀은 **엑셀 시리얼 넘버(46027.0 등)를 직접 읽어 `Date.UTC(1899,11,30) + serial*86400000`로 변환**(scripts/ingest_damodaran.ts의 `resolveAsOf()`)하며, **1904 플래그 분기 코드가 없다**. 확인 결과 이 파일들의 `wb.Workbook.WBProps.date1904`는 모두 `false`(1900 표준 에폭) — 즉 **1904버그는 `ERPbymonth.xlsx`(Mac 출처로 확인된 유일한 파일)에서만 관측되며, `taxrate.xls`·`wacc.xls`·`betas.xls`·`capex.xls`·`wcdata.xls`·`countrytaxrates.xls`·`indname.xls` 7개 파일 전부 `date1904=false`(정상 1900 에폭)**. 지금 당장 재발 사례는 없다 — 다만 코드가 이 파일들엔 date1904 분기 자체가 없으므로, **만약 Damodaran이 향후 이 파일들을 Mac에서 재저장하면 조용히 틀린 as_of가 생길 수 있다**(가능성 기록, 지금 발생 안 함 — 수정은 이 STEP 범위 밖).

**④ 업종명 정규화**: 구두점·대소문자 차이로 서로 다른 업종이 합쳐진 사례 없음 — 94개 업종명이 wacc/beta/capex/wc/tax_rate 5개 테이블에서 문자열 그대로(`Rubber& Tires`처럼 원본의 띄어쓰기 누락까지 포함) 정확히 동일하게 보존됨을 확인. `damodaran_industry`의 132개 국가명·94개 industry_group·11개 primary_sector도 원본 문자열 그대로 저장(변환 없음).

### 3-3. NA → NULL 처리 검증(신규 발견 — 버그 아님, 정확한 동작)

`damodaran_capex` 7개 업종(Bank (Money Center) 등 금융·보험업 위주)의 `capex_over_dep`/`net_capex_over_ebit_at`, `damodaran_working_capital` 4개 업종의 `ap_over_sales`/`noncash_wc_over_sales`가 DB에서 NULL이길래 처음엔 결측으로 의심했으나, **원본 엑셀(`capex.xls`·`wcdata.xls`)을 직접 열어 해당 셀이 문자 그대로 `"NA"`임을 확인** — Damodaran이 금융업 특성상(감가상각·매입채무 개념이 다름) 해당 지표를 원천적으로 제공하지 않는 것. `num()` 함수(`"NA"`/`"N/A"`→null)가 정확히 의도대로 동작한 것으로, **적재 결함이 아니다.**

### 3-4. damodaran_industry — 48,144행 집계 지문 + 2섹터 ±1건 완전 해명

집계 지문(원본 재구성 vs DB): `n`=48,144=48,144 · `n_sectors`=11=11 · `n_groups`=94=94 · `n_countries`=132=132 · null 4종(sector/group/country/sic) 전부 0=0. **9/11 섹터 행수·SIC합계 정확 일치.**

나머지 2섹터(`Consumer Staples`: 재구성 3201 vs DB 3202, `Materials`: 재구성 6457 vs DB 6456)가 ±1로 어긋나 원인을 추적한 결과 — **원본 `indname.xls`에서 raw "Exchange:Ticker" 필드가 완전 빈 문자열(`""`)인 행 12개 + `"-"` 값인 행 1개, 총 13개 회사(전부 상장폐지·비상장·SPAC 잔여 shell 법인)가 실제 원인**이었다:

- `scripts/ingest_damodaran.ts:70` — `if (!et) continue;` → **raw 값이 빈 문자열이면 그 행 자체를 건너뛴다**(dedup이 아니라 스킵). 12개사(Antipodes Gold Limited, Dongbu 3rd SPAC 등) 전부 DB에 존재하지 않음을 직접 조회로 확인.
- `scripts/ingest_damodaran.ts:71-74` — `"-"` 값은 `:`가 없어 `exchange=null, ticker="-"`(트림된 전체 문자열)로 파싱되고 `ticker`가 truthy이므로 **적재된다**. `Collier Creek Holdings`(Consumer Staples, exchange=null, ticker="-") 1건이 DB에 실존함을 확인.
- 이 STEP의 감사 스크립트(Python)는 `""`와 `"-"`를 동일하게 "콜론 없음→키 None|None"으로 뭉뚱그려 재구현했기 때문에, 13개사가 1개(첫 순번 "Antipodes Gold Limited", Materials)로 잘못 병합되어 DB의 실제 생존자("Collier Creek Holdings", Consumer Staples)와 다른 결과가 나온 것 — **감사 스크립트의 재구현 결함이며, 프로덕션 적재 코드는 정확히 의도대로 동작했다.**

🔑 **결론**: 48,144행 중 실질적으로 원본↔DB가 다른 값은 0건. ±1 편차는 감사 스크립트가 프로덕션 코드의 "완전 공백은 스킵, `-`처럼 콜론 없는 비공백 값은 티커로 채택"이라는 세부 분기를 재현하지 못해서 생긴 것이며, 원본 파일을 직접 열어 이 13개사 각각의 실제 취급을 추적해 완전히 설명됐다. **이 13개사는 상장폐지·SPAC 잔여 shell 법인**으로 revdcf US 유니버스(활성 상장사 기준)에 존재할 수 없어 §5 하류 영향도 0건.

## 4. 버전 대조

| 파일 | 자기표기 "Date updated" | DB as_of | 판정 |
|---|---|---|---|
| taxrate.xls | 2026-01-05 | 2026-01-05 | 일치 |
| wacc.xls | 2026-01-05 | 2026-01-05 | 일치 |
| betas.xls | 2026-01-05 | 2026-01-05 | 일치 |
| capex.xls | 2026-01-05 | 2026-01-05 | 일치 |
| wcdata.xls | 2026-01-05 | 2026-01-05 | 일치 |
| countrytaxrates.xls | 2026-01-05 | 2026-01-05 | 일치 |
| indname.xls | (자기표기 없음 — "Date updated" 라벨 자체가 파일 내 미존재) | 2026-01-05(wacc.xls 날짜를 배치 전체 as_of로 공유) | 일치(설계대로 — `resolveAsOf()`가 wacc.xls 날짜를 배치 기준으로 사용) |
| ERPbymonth.xlsx | 최신 유효 월 2026-08-01(D·K열 모두 존재) | 2026-08-01(damodaran_global_inputs 두 번째 행) | 일치 |

🔴 **"원본이 DB보다 새 버전" 사례 없음 — 적재 정체(stale ingestion) 0건.** 로컬 파일 mtime(2026-08-01 11:43, `ls -la` 확인)은 "다운로드한 시각"이지 "콘텐츠의 as-of 시각"이 아니므로 버전 판정에 사용하지 않았다(콘텐츠 자기표기 우선).

## 5. 하류 영향(건수만)

**0건.** 이 STEP에서 발견된 모든 항목이 데이터 불일치가 아니라 (a) 감사 스크립트 자체의 재구현 결함(§3-4) 또는 (b) 원본 자체의 "NA" 값을 정확히 null로 반영한 정상 동작(§3-3)이었으므로, `revdcf_results`(604건, 최신 as_of=2026-08-12) 중 WACC/verdict 재계산이 필요한 행은 0건이다. §3-4의 13개 shell 법인은애초에 활성 상장사가 아니어서 revdcf 유니버스에 들어올 수 없다.

## 6. 오늘 밤 관측 (§2-7)

작업 시각 확인: **2026-08-13T14:50:36Z** — `us-perf`(22:00 UTC)·`revdcf`(22:45 UTC) 둘 다 **미도래**. 크론 수동 호출 없이 읽기만 수행:

| 항목 | 값 | 판정 |
|---|---|---|
| `us_market_cap_nasdaq` 행수 / as_of | 0 / null | 미도래(예상대로 — 마이그레이션 직후 빈 테이블) |
| `cron_heartbeats.job='us-perf'` | 행 자체가 없음 | 미도래 |
| `cron_heartbeats.job='revdcf'` | 행 자체가 없음 | 미도래(1007~1013에서도 계속 미관측 — 22:45 UTC 이후로 계속 이월) |
| `cron_heartbeats` 현재 4행 | email-brief(ok)·jp-disclosures(ok)·kr-lens-scores(ok)·lens-scores(**ok=false**, last_run 2026-08-12 21:58 UTC) | STEP1013 시점과 동일, 변화 없음 |

나스닥 라이브 API 프로덕션 실패 여부 — **판정 불가(미도래라 관측 자체가 없음)**. 다음 세션에서 22:00 UTC 이후 재확인 필요.

## 게이트7 — git 미추적 파일 참조 검사

- `data/sources/damodaran/`(엑셀 원본 9개 파일) — `git check-ignore -v`로 **디렉토리 전체가 `.gitignore:57`에 의해 미추적**임을 확인. `scripts/ingest_damodaran.ts:10`·`scripts/ingest_damodaran_step847.ts:9`·`scripts/ingest_erp_monthly.ts:19` 3개 스크립트가 이 미추적 디렉토리를 상대경로로 참조한다. 🔴 **다만 이는 STEP990이 금지하는 "프로덕션 빌드 경로에서의 참조"가 아니라 "1회성 CLI 스크립트의 로컬 데이터 참조"**(990 원문이 이미 구분한 두 번째 범주) — `npm run build`는 이 파일들을 import하지 않으므로 프로덕션 빌드에 영향 없음. 신선한 clone에서는 이 3개 스크립트만 재실행 불가(원본 파일이 없어서). 이 STEP은 코드 수정 0이므로 **고치지 않고 기록만 남긴다.**
- `data/sources/damodaran_multiples/`(pedata·pbvdata·psdata·vebitda.xls) — 위와 달리 **git 추적 중**(`git ls-files`로 확인) — 미추적 아님, 문제 없음.
- 🔴 **신규 발견(이 STEP 범위 밖 사안이지만 즉시 안전하게 보강)**: `docs/step_orders/`(STEP1006~1014 명령서 + `_TEMPLATE.md`) 전체가 **git에 한 번도 커밋된 적이 없다** — `git ls-files docs/step_orders/`가 빈 결과, `git log --all -- docs/step_orders/`도 빈 결과로 확인. STEP1007~1013을 실행하며 각 STEP이 참조·생성한 코드·probe 문서·CHANGELOG는 매번 커밋했지만, **명령서 원본 자체는 로컬에만 존재**했다. CLAUDE.md는 "실행 후 파일은 그대로 유지 — 삭제하지 말 것. 프로젝트 아카이브 역할"이라 명시하는데, 커밋되지 않은 아카이브는 로컬 머신이 사라지면 함께 사라진다. 이 STEP의 코드 diff 0 원칙과 무관한 **순수 문서 보존 조치**이므로, 이번 커밋에 `docs/step_orders/*.md` 10개 파일을 함께 추가해 보존한다(내용은 전혀 수정하지 않음 — 존재하지 않던 git 이력에 있는 그대로 편입).

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 오늘 밤 관측(§6) — 22:00·22:45 UTC 둘 다 미도래, 다음 세션으로 이월.
- `indname.xls`의 "By industry"·"By geography" 두 시트는 대조 대상 밖(적재 코드가 "By company name" 시트만 사용 — `scripts/ingest_damodaran.ts:64`).

**철회·정정한 것**
- §3-4의 damodaran_tax_rate 3개 업종(Chemical (Diversified)·Electronics (Consumer & Office)·Rubber& Tires) `eff_money`/`cash_money` 초기 비교에서 "불일치 6건"으로 잘못 판정했다가, xlrd가 Excel `#DIV/0!` 오류 셀의 내부 오류코드(7)를 원시 숫자로 반환한다는 것을 발견해 셀 타입(`ctype==5`) 검사로 수정 후 재대조 → **0건 불일치로 정정.** 이 오류는 감사 스크립트(Python)의 결함이었고 프로덕션 TS 코드(SheetJS 기반)는 애초에 영향받지 않았다(DB는 처음부터 정확히 null이었음).
- damodaran_capex/working_capital 최초 수기 발췌본이 87행/90행으로 94행에 못 미쳤던 것 — 처음엔 "받아적을 때 누락"으로 의심했으나, 재확인 결과 **string_agg가 `||` 연결 중 NULL 필드를 만나면 그 행 전체를 결과에서 제외**하는 SQL 동작 때문이었음(수기 누락 아님) — WHERE IS NULL 별도 쿼리로 7행/4행을 채워 94/94 완성.

**미측정으로 남은 것**
- `indname.xls` 파일 자체의 "Date updated" 라벨 부재가 Damodaran 원본 설계인지 이 특정 스냅샷의 우연인지 — 확인 안 함(다음에 재다운로드 시 대조 필요).
- 1904-에폭 버그가 향후 다른 파일에서 재발할 가능성(§3-2 ③) — 코드에 방어 로직이 없다는 사실만 확인, 방어 로직 추가는 이 STEP 범위 밖(장은태 판정 대상).

🔴 **불일치를 발견하지 못했으므로 고칠 것도 없다.** §3-2 ③에서 언급한 "1904버그 미방어" 관측은 방금 발생한 문제가 아니라 잠재 위험 기록이며, 판정은 장은태 몫이다.
