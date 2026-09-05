# STEP 850 — 🔴 전 종목(604) driver 실배선 + 엔진 실행 + 분포 산출

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(대량 데이터 · 결측 판단 · 플래그 설계)

**전제 상태**: STEP 849 커밋 `2633acf` 이후 HEAD · 트리 클린

**착수 전 필독**: `lib/revdcf/engine.ts` · `lib/revdcf/compute.ts` · `lib/revdcf/registry.ts` · `docs/REVDCF_SPEC.md` §12 · `CLAUDE.md` ⓪-2

---

## 0. 성격 — 🔴 배치 파이프라인. 화면은 아직 아니다

🔴 **화면 변경 0.** 계산 모듈 + 배치 스크립트 + 저장 테이블 + 문서.
🔴 **엔진(848)·WACC 조립(849)은 손대지 않는다.** 이번은 **전 종목에 적용**하는 일.
🔴 **값을 코드에 박지 말 것.** 전부 `damodaran_*` + SEC.
🔴 **매일 돌 크론을 전제로** 만든다. 일회성 스크립트가 아니다.
🔴 **하드코딩 이상치 가드 절대 금지**(CLAUDE.md). 이상한 값은 **막지 말고 플래그를 달아 그대로 남긴다.**

---

## §1 — driver 산출 모듈

`lib/revdcf/drivers.ts` (신규) — `companyfacts` 원자료 → 7 driver

| driver | 확정 정의 (REVDCF_SPEC §B-4) |
|---|---|
| 1 매출성장 | 5년 CAGR · **항등식으로 선택된 매출 태그** · 🔴 forward 아님을 플래그 |
| 2 마진 | 영업이익 ÷ 매출 5년 평균 (+10년 병기) · 영업이익 결측 시 **Pretax+Interest 재구성 + 플래그** |
| 3 세율 | `damodaran_country_tax` US 한계세율 (병기: 업종 실효세율) |
| 4 운전자본율 | **(유동자산−현금)−유동부채 ÷ 매출** 5년 평균 (수준형) |
| 5 자본집약도 | **PP&E ÷ 매출** 5년 평균 (수준형) |
| 6 WACC | 849 `compute.ts` 조립 |
| 시작값 | 시작매출·시작마진 = 최근 회계연도 |

🔴 **태그 union은 844·847에서 확정된 목록을 쓴다.** 새로 추측하지 말 것. 없으면 registry를 갱신하고 사유를 남긴다.

**결측 정책** (🔴 조용히 0으로 채우지 말 것)
- 필수(매출·영업이익·PP&E·유동자산/부채·현금·주식수·부채) 중 **하나라도 5년 미확보 → 계산하지 않고 사유 코드**를 남긴다.
- 사유 코드는 화면 문구와 1:1: `INSUFFICIENT_HISTORY`(상장·분할 5년 미만) · `MISSING_TAG` · `NOT_APPLICABLE_SECTOR` 등.

---

## §2 — 전 종목 배치

`scripts/compute_revdcf_all.ts` (신규 · **재실행 안전 · 배치 단위 저장**)

🔴 **845의 교훈을 반영할 것**: 604 전수를 한 번에 돌리면 무음으로 죽는다.
- **배치 단위(예: 60)로 저장** · 진행 로그를 파일에 append · `AbortSignal` + **본문 파싱까지 감싸는 wall timeout**.
- 이미 처리한 CIK는 건너뛴다(resumable).

**흐름**: 604 발행사 → companyfacts → driver 산출 → 업종 매핑 → WACC 조립 → `computeGapWithSensitivity` 3점 → 저장.

---

## §3 — 저장 테이블

`supabase/migrations/20260801_revdcf_results.sql`

```
revdcf_results
  as_of date not null            -- 계산 기준일 (매일)
  cik bigint not null
  symbol text
  verdict text not null          -- years | below_one | over_cap | value_destroying | invalid | skipped
  gap_years int                  -- verdict=years 일 때만
  gap_wacc_minus1 int
  gap_wacc_plus1 int
  explained_pct numeric          -- verdict=over_cap 일 때 25년가치/주가
  threshold_margin numeric
  monotonic text                 -- up | down | mixed
  -- 입력 스냅샷 (재현성)
  sales_growth numeric, operating_margin numeric, starting_margin numeric,
  tax_rate numeric, fixed_capital_rate numeric, working_capital_rate numeric,
  wacc numeric, beta_unlevered numeric, de_ratio numeric,
  debt numeric, non_operating_assets numeric, shares numeric, share_price numeric,
  -- 🔴 플래그 (809 peBasis 전례)
  flags jsonb not null           -- {revenueTag, revenueBasis, revenueCheck, ebitSource, industryMatched, growthIsHistorical:true, ...}
  skip_reason text
  primary key (as_of, cik)
```

- **RLS on + anon REVOKE** (기존 `20260712_...` 패턴).
- 🔴 **덮어쓰지 말고 `as_of`로 쌓는다.** 과거 결과를 재현할 수 있어야 한다.
- 🔴 `damodaran_*`의 `as_of`도 `flags`에 기록(어느 빈티지 재료로 계산했는지).

---

## §4 — 🔴 분포 산출 (이번 STEP의 핵심 출력)

배치 완료 후 요약을 출력·기록한다. **이게 "실제 산출률"이고, 우리가 손으로 재던 것의 자동화다.**

| 항목 | 보고 |
|---|---|
| verdict 분포 | `years` / `below_one` / `over_cap` / `value_destroying` / `invalid` / `skipped` 각 몇 개·몇 % |
| `skipped` 사유별 | `INSUFFICIENT_HISTORY` 등 각 몇 개 |
| **GAP 분포** | 중앙·10%·25%·75%·90%분위 · 최소/최대 |
| 🔴 **밴드 폭 분포** | `gap_wacc_plus1 − gap_wacc_minus1` 의 중앙·90%분위 — **밴드가 너무 넓으면 D층 표현이 성립하지 않는다** |
| `monotonic='mixed'` | 🔴 **몇 건인가.** 0이어야 한다. 있으면 목록과 원인 |
| 업종 매핑 실패 | 몇 개 |
| GAP 상·하위 15종목 | 티커·GAP·WACC — **눈으로 말이 되는지 확인** |

🔴 **이상치를 지우지 말 것.** GAP 100년·below_one이 나와도 그대로 보고한다(2026-07-11 삼성전자 오진 전례).

---

## §5 — 849 잔여

1. 부채 태그에 **`LongTermDebtAndCapitalLeaseObligationsCurrent`** 추가(849에서 누락 → core 커버리지 과소). 커버리지 변화 보고.
2. 🔴 **`monotonic='mixed'` 발생 시 조사** — 드라이버 불변 설계에서는 나오면 안 된다.

---

## §6 — 검산 (조용한 실패 방지)

1. 🔴 **도미노(DPZ)가 배치 결과에 있고 849 수기 산출(23년·WACC 7.19%)과 일치**하는지. 불일치 시 배치 로직 오류.
2. 배치 저장 행 수 = 처리 시도 수. **누락 0** 확인.
3. 무작위 5종목을 **손으로 재계산**해 대조.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **프로덕션 화면 변경 0 증거** (`git diff --stat`에 `app/` 없음)
3. §4 **분포 전체** 보고
4. §6 검산 3건 통과
5. 배치 1회 **소요 시간**과 실패율 (크론 설계에 필요)
6. 🔴 **3중 점검 블록** 명시
7. `docs/REVDCF_SPEC.md` 갱신 — §7 D층 설계 입력으로 **밴드 폭 분포** 기록 · §11 실측 원장 · §10 미결 갱신
8. `docs/SYSTEM_MAP.md`에 새 테이블·배치 추가
9. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
10. 커밋:
    ```bash
    git add lib/ scripts/ supabase/ docs/
    git commit -m "STEP 850: compute reverse-DCF drivers and GAP for full US universe, persist with as_of and flags, report distribution"
    git push
    ```

## 완료 보고 → Cowork에게

- 🔴 **verdict 분포 + GAP 분포 + 밴드 폭 분포** (D층 설계의 입력)
- `mixed` 건수
- 도미노 대조 결과
- 배치 소요 시간
- 🔴 못 한 것과 이유
