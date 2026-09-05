# STEP 846 — 원전·재료 원본 저장 배치 (Supabase 적재 + Storage + git 경량화)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

**전제 상태**: STEP 845 이후 HEAD · 트리 클린 (단 `data/sources/`가 미커밋 상태로 존재)

**착수 전 필독**: `CLAUDE.md` **규칙 ⓪ · ⓪-2** · `data/sources/README.md` · `lib/revdcf/registry.ts` · `docs/REVDCF_SPEC.md` §12

---

## 0. 성격

🔴 **프로덕션 화면 변경 0.** 데이터 배선 + 마이그레이션 + 스크립트만.
🔴 **값을 코드에 박지 말 것.** 전부 DB에서 읽는다 (§12 B분류).
🔴 이 STEP은 **역DCF 전용이 아니라 앞으로 모든 모델이 쓰는 공용 배선**이다.

---

## §1 — 목표

`data/sources/`(현재 24MB)를 세 곳으로 나눈다.

| 대상 | 목적지 | 크기 |
|---|---|---|
| 다모다란 **표 데이터** 7종 | **Postgres 테이블** (`as_of` 컬럼 필수) | — |
| 다모다란 **원본 xls** 8개 | **Supabase Storage 버킷 `sources`** | 22MB |
| 원전 스프레드시트 8개 + 원문 HTML 13개 | **git 유지** | 1.9MB |

결과: `.git` 증가분 **24MB → 1.9MB**

---

## §2 — Storage 버킷

1. 버킷 `sources` 생성 — **비공개**, 파일 상한 **50MB 이상**(기존 `business-docs`는 5MB라 못 씀).
2. `data/sources/damodaran/*.xls` 8개 업로드. 경로 = `damodaran/2026-01-05/{파일명}`.
   - 🔑 **날짜 폴더**로 두어 연 1회 갱신 시 과거본이 남게 한다.
3. 업로드 확인 후 `data/sources/damodaran/`을 **`.gitignore`에 추가**(파일은 로컬 유지).
   - 🔴 `data/sources/expectations-investing/`·`data/sources/text/`는 **git에 커밋**한다(작고 이력이 의미 있음).

---

## §3 — Postgres 테이블 (마이그레이션)

`supabase/migrations/20260801_damodaran_reference_data.sql`

모든 테이블에 **`as_of DATE NOT NULL`** + `(as_of, 키)` 유니크. 🔴 **덮어쓰지 말고 새 `as_of`로 쌓는다.**

| 테이블 | 소스 | 주요 컬럼 |
|---|---|---|
| `damodaran_industry` | `indname.xls` "By company name" | `as_of, ticker, exchange, company_name, industry_group, primary_sector, sic_code, country` |
| `damodaran_tax_rate` | `taxrate.xls` "Industry Averages"(header=8) | `as_of, industry, n_firms, eff_all, eff_money, eff_agg, cash_money, cash_agg` |
| `damodaran_country_tax` | `countrytaxrates.xls` | `as_of, country, marginal_rate` |
| `damodaran_wacc` | `wacc.xls` "Industry Averages"(header=18) | `as_of, industry, n_firms, beta, cost_of_equity, e_over_de, cost_of_debt, tax_rate, after_tax_cod, d_over_de, cost_of_capital` |
| `damodaran_beta` | `betas.xls` "Industry Averages"(header=9) | `as_of, industry, n_firms, beta, de_ratio, eff_tax, unlevered_beta, cash_over_firm, **unlevered_beta_cash_adj**, std_dev_equity` |
| `damodaran_capex` | `capex.xls`(header=7) | `as_of, industry, n_firms, capex, depreciation, capex_over_dep, acquisitions, net_rnd, net_capex_over_sales, net_capex_over_ebit_at, sales_over_invcap` |
| `damodaran_working_capital` | `wcdata.xls`(header=7) | `as_of, industry, n_firms, ar_over_sales, inv_over_sales, ap_over_sales, noncash_wc_over_sales` |
| `damodaran_global_inputs` | `wacc.xls` 상단 셀 | `as_of, riskfree_rate, erp, global_default_spread, marginal_tax_rate_used, expected_inflation` — 🔑 **스칼라 입력도 테이블로** |

**RLS**: 전부 `enable row level security` + anon `REVOKE`(읽기는 service-role만). 기존 `20260712_enable_rls_public_data_tables.sql` 패턴 따를 것.

---

## §4 — 적재 스크립트

`scripts/ingest_damodaran.ts` (신규 · 재실행 안전)

1. 인자로 `--as-of=YYYY-MM-DD` (기본 = 파일의 `Date updated:` 셀에서 읽기).
2. Storage에서 xls를 받거나 로컬 `data/sources/damodaran/` 사용(둘 다 지원).
3. 파싱 → upsert (`as_of` 포함 유니크).
4. 🔴 **행 수와 파싱 실패를 반드시 출력**. 조용한 실패 금지(로그 #31 전례 — swallowed upsert).
5. 🔴 **검산**: `damodaran_industry`의 미국 거래소(NYSE·NasdaqGS/CM/GM·NYSEAM·AMEX·BATS·OTCPK) 티커 수가 **약 6,937**인지 · `damodaran_tax_rate` 업종 수가 **94**인지 확인해 출력.

---

## §5 — 매칭 키를 DB에 고정

🔴 **오분류 전례**: `Country == 'United States'`로 매칭하면 `TEL`→루마니아 전력, `ET`→이탈리아 건설로 붙는다.

`damodaran_industry`에 **생성 컬럼** 추가:
```sql
ticker_norm text generated always as (upper(regexp_replace(ticker,'[^A-Za-z0-9]','','g'))) stored
is_us_listed boolean generated always as (exchange in ('NYSE','NasdaqGS','NasdaqCM','NasdaqGM','NYSEAM','AMEX','BATS','OTCPK')) stored
```
인덱스: `(as_of, is_us_listed, ticker_norm)`

---

## §6 — registry 갱신

`lib/revdcf/registry.ts`의 `MATERIAL_SOURCES.damodaran`에 **테이블명·Storage 경로**를 추가한다. 🔴 **값은 여전히 적지 않는다.**

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **프로덕션 화면 변경 0 증거** (`git diff --stat`에 `app/` 없음)
3. 마이그레이션 적용 후 **테이블별 행 수** 출력 (MCP 또는 스크립트)
4. §4-5 검산 2건 통과(미국 티커 ≈6,937 · 업종 94)
5. Storage 버킷에 8개 파일 존재 확인
6. `.git` 크기 증가분이 **2MB 이하**인지 확인
7. `docs/REVDCF_SPEC.md` §12 B분류 표의 "현재 상태" 열을 **🔴 미배선 → ✅ 배선**으로 갱신
8. `docs/CHANGELOG.md`·`docs/STATE.md` 갱신 (오늘 날짜)
9. 커밋:
   ```bash
   git add supabase/ scripts/ lib/ docs/ data/sources/expectations-investing data/sources/text data/sources/README.md .gitignore
   git commit -m "STEP 846: ingest Damodaran reference data into Postgres with as_of, store originals in Supabase Storage"
   git push
   ```

## 완료 보고 → Cowork에게

- 테이블별 행 수 + 검산 2건 결과
- Storage 업로드 확인
- `.git` 증가분
- 🔴 파싱 실패·컬럼 불일치가 있었다면 그 목록
