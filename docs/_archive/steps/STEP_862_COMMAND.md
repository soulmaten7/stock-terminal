# STEP 862 — DoD **항목 2를 ✅로** (D&A 결측 회수 · 부채 결측 분리)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`

**전제 상태**: STEP 861 커밋 `3bc3699`(코드 HEAD `f9949d9`) 이후 HEAD · 트리 클린

**착수 전 필독**: 🔴 `CLAUDE.md` **🚫 창작 금지**·⓪-3 · `docs/LENS_COMPLETION_STANDARD.md` 역DCF `2) 입력 검증` · `data/sources/expectations-investing/T5.xlsx`

---

## 0. 성격

🔴 **항목 2만.** 861 판정이 **🔶(미달)** 이다. **✅가 될 때까지 다음 항목으로 가지 않는다.**
🔴 끝나면 멈추고 보고. **다음 항목 제안 금지.**
🔴 플래그 OFF 유지 · 화면 변경 0.
🔴 **⓪-3 준수.**

**861 미달 사유 2건**
1. **D&A(marginal) 결측 21.7%** → marginal 자본집약도 병기가 5분의 1에서 불가
2. **부채 결측 10.1%에 무차입(정상)이 섞임** → 진짜 결측과 구분 안 됨

---

## §1 — D&A 태그 회수

**Cowork 사전 실측 (SEC `frames` CY2024 · filer 수)**

| 태그 | filer | 성격 | 우리 |
|---|---|---|---|
| `Depreciation` | **3,750** | 감가상각만(분리) | ❌ |
| `AmortizationOfIntangibleAssets` | **3,103** | 무형상각만(분리) | ❌ |
| `DepreciationDepletionAndAmortization` | 3,024 | **합계** | ✅ |
| `DepreciationAndAmortization` | 1,942 | **합계** | ✅ |
| `DepreciationAmortizationAndDepletion` | 404 | 합계 | ❌ |
| `DepreciationAmortizationAndAccretionNet` | 356 | 합계(+Accretion) | ❌ |
| `DepreciationNonproduction` | 198 | 부분 | ❌ |

🔴 **단순 union 금지.** 합계 태그와 분리 태그를 섞으면 이중계상·누락이 난다.

**원전 근거**: T5는 현금흐름표의 **`Depreciation and amortization` 한 줄**을 쓴다(감가상각+무형상각 합계).

**지시**
1. **우선순위 체인**을 만든다: 합계 태그(4종) 중 하나 → 없으면 **`Depreciation` + `AmortizationOfIntangibleAssets` 합산** → 없으면 결측.
   - 🔴 합계 태그 간 우선순위와 **`AccretionNet` 포함 여부**를 판단하고 사유 기재.
   - 🔴 `DepreciationNonproduction`은 **부분값**이므로 쓸지 말지 판단.
2. 🔴 **검산**: 합계 태그와 분리 태그를 **둘 다 보고하는 종목**에서 `합계 ≈ Depreciation + Amortization` 인지 확인(허용오차 명시). 안 맞으면 체인을 고친다.
3. **회수 후 D&A 결측률** 보고 (현재 21.7%).
4. 🔴 **회수 불가분**은 사유 코드를 붙이고 **marginal 산출 대상에서 명시적으로 제외**(조용히 0 처리 금지).

---

## §2 — 부채 결측 분리

현재 "결측 10.1%"에 **무차입 기업(부채 0이 정상)**이 섞여 있다.

1. 부채 태그 union이 없는 종목에 대해 **정말 무차입인지** 확인:
   - `InterestExpense`(또는 `InterestPaidNet`)가 0/부재인가
   - `LiabilitiesCurrent`·`Liabilities` 대비 이자부 항목 흔적이 있는가
2. **두 갈래로 분리**해 수치 보고: **무차입(값 0) N사** vs **진짜 결측 M사**.
3. 🔴 무차입은 **결측이 아니라 값 0**으로 처리하고 결측률에서 뺀다.

---

## §3 — 재계산 + 재판정

1. `scripts/compute_revdcf_all.ts` 재실행(**새 `as_of`** · 기존 보존).
2. **852의 method-dependent 68사**가 D&A 회수로 몇 사로 바뀌는지 보고.
3. `docs/LENS_COMPLETION_STANDARD.md` 역DCF `2) 입력 검증` 표 **결측률 갱신**.
4. 🔴 **항목 2 재판정** — ✅ / 🔶 / ❌ + 사유.
   - 🔴 **여전히 🔶면 무엇이 남았는지 한 줄로** 적을 것. 낙관 금지.
   - 🔴 **이상치 처리는 항목 5(경계 처리) 소속**이므로 항목 2 판정에 넣지 말 것(861이 이걸 근거로 🔶를 준 부분은 재검토).

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 🔴 프로덕션 `/revdcf` 404 유지 · 화면 무변화
3. §1 **검산 결과**(합계 vs 분리 합) + 회수 후 결측률
4. §2 무차입 N사 / 진짜 결측 M사
5. §3 method-dependent 변화 + **항목 2 재판정과 사유**
6. 🔴 `[3중 점검]` ⓪ 줄 명시
7. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
8. 커밋(main):
   ```bash
   git add lib/ scripts/ docs/
   git commit -m "STEP 862: recover D&A via priority chain, separate zero-debt from missing, re-judge DoD item 2"
   git push && git push origin main:revdcf-preview
   ```

## 완료 보고 → Cowork에게

- §1 D&A 결측률 (21.7% → ?) + 검산 결과
- §2 무차입 vs 진짜 결측
- 🔴 §3 **항목 2 판정** — ✅면 근거, 🔶면 남은 것
- 🔴 못 한 것
- **여기서 멈춘다.**
