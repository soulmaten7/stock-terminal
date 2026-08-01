# STEP 852 — 🔴 화면 나가기 전 데이터 품질 마감 (자본집약도 아티팩트 + skipped 회수)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(편향-분산 판단 · 태그 탐색)

**전제 상태**: STEP 851 커밋 `aa0035d` 이후 HEAD · 트리 클린

**착수 전 필독**: `docs/REVDCF_SPEC.md` §B-4(driver 4·5) · `lib/revdcf/drivers.ts` · `data/sources/expectations-investing/T5.xlsx` · `CLAUDE.md` ⓪-2

---

## 0. 왜 화면보다 이게 먼저인가

851 §못한것 3: *"수준형 자본집약도가 설비 무거운 성숙기업의 증분투자를 **과대추정** — `value_destroying`의 일부는 이 방법론 아티팩트일 수 있음."*

🔴 **"가치훼손"은 강한 낙인이고 130종목(22%)에 붙는다.** 아티팩트일 가능성을 알면서 화면에 내보내면 우리 원칙(정확한 정보·거짓 금지)을 어긴다.
🔴 **화면 구현은 다음 STEP.** 이번엔 판정의 신뢰도를 마감한다.

---

## §1 — 🔴 자본집약도: 편향 vs 분산

**현행(844·850)**: 수준형 `PP&E ÷ 매출` 5년 평균 × Δ매출 — 변동 2.34%p(안정) · 🔴 **성숙 설비기업 과대 가능**
**원전(T5)**: 한계형 `(설비투자+자본화SW+기타투자+인수 − 감가상각) ÷ Δ매출` — 변동 53%p · 편향 낮음

🔴 **어느 쪽이 "맞다"고 단정하지 말 것. 편향-분산 트레이드오프다.**

### 실측할 것

1. **두 방식 모두 산출**해 `revdcf_results`에 나란히 저장(`fixed_capital_rate_level`, `fixed_capital_rate_marginal`).
   - 한계형은 **5년 누적** 기준(원전 T5 방식: 5년 누적 순고정투자 ÷ 5년 누적 Δ매출). 연도별 1년 한계형은 쓰지 말 것.
   - 847 §3 실측 = 원전 방식 커버리지 **449(74%)**. 두 방식 다 되는 종목 수 보고.
2. 🔴 **판정이 갈리는 종목 수**: 수준형에서 `value_destroying`인데 한계형에서 `years`로 바뀌는(또는 반대) 종목이 몇 개인가.
   - **이 숫자가 이 STEP의 핵심 출력이다.**
3. **두 비율의 차이 분포** — 어느 업종에서 크게 갈리나(가설: 유틸리티·통신·철도 등 설비 무거운 업종).
4. 🔴 **도미노 대조**: 원전 T8은 15%. 수준형 우리 값 vs 한계형 우리 값 중 **어느 쪽이 15%에 가까운가**. (847 실측: 한계형 11.6%)

### 결정 (근거와 함께)

| 안 | 방식 |
|---|---|
| A | 수준형 유지 · 한계형은 참고 표시 |
| B | 한계형으로 교체 |
| ✅ **C(권장 검토)** | **둘 다 계산 · 판정이 갈리면 화면에 표시** — "투자 강도 산정 방법에 따라 판정이 달라집니다" |

🔴 **C를 택할 경우 기본값을 무엇으로 할지도 정할 것.** 갈리지 않는 종목엔 아무 영향 없고, 갈리는 종목만 다르게 표시된다(5년/10년 마진 병기와 같은 패턴).
🔴 **어떤 안이든 방법론 페이지에 트레이드오프를 그대로 밝힌다.**

---

## §2 — `skipped` 161 회수 (851 내역: workingCapital 69 · OI 20 · PP&E 13 · shares 5)

목표: **27%를 얼마나 줄일 수 있나.** 태그 확장으로 되는 만큼만.

| 결측 | 건수 | 지시 |
|---|---|---|
| **workingCapital** | **69** 🔴 최대 | `AssetsCurrent`/`LiabilitiesCurrent` 결측 종목의 실제 태그를 **companyfacts에서 발견**. 🔴 유동/비유동 미구분(유동성배열법) 기업은 **금융 인접**일 수 있다 — 그렇다면 회수가 아니라 **`NOT_APPLICABLE_SECTOR`로 재분류**해야 한다. 둘을 구분할 것 |
| OI | 20 | Pretax+Interest 재구성 폴백이 왜 안 걸렸는지 확인 |
| PP&E | 13 | 844 잔여(GE·DE·URI 등 frames 아티팩트는 해소됨) — companyfacts에서 재확인 |
| shares | 5 | `dei` ↔ `us-gaap` 폴백 |

🔴 **회수 못 하는 것은 사유 코드를 정확히** 붙인다. `MISSING_TAG`로 뭉뚱그리지 말 것 — 화면 문구가 달라진다.

---

## §3 — 재실행 + 분포 갱신

1. `scripts/compute_revdcf_all.ts` 재실행(배치·resumable 유지).
2. **850 대비 분포 변화표**:

| verdict | 850 | 852 | 변화 |
|---|---|---|---|
| years | 195 (32%) | ? | |
| value_destroying | 130 (22%) | ? | |
| below_one | 70 (12%) | ? | |
| over_cap | 48 (8%) | ? | |
| skipped | 161 (27%) | ? | |

3. 🔴 **판정 갈림 종목 수**(§1-2)를 함께.
4. 🔴 **도미노 검산 유지**(850: 25년·WACC 7.07%) — 변하면 원인 규명.

---

## §4 — 851 잔여

1. **`over_cap`·`skipped` 상세 문구 en 국제화** (851에서 미완).
2. 목업의 문구를 `messages/ko.json`·`en.json` 키로 정리(화면 구현 STEP에서 바로 쓰게).

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **프로덕션 화면 변경 0**
3. §1 **두 방식 비교 + 판정 갈림 수 + 도미노 대조** + 🔴 **채택안과 근거**
4. §2 회수 내역 (회수 / `NOT_APPLICABLE_SECTOR` 재분류 / 잔여 각 몇 건)
5. §3 **분포 변화표** + 도미노 검산
6. 🔴 **3중 점검 블록**
7. `docs/REVDCF_SPEC.md` §B-4 driver 5 갱신(트레이드오프 명시) · §9 정정(있으면) · §11 실측 원장
8. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
9. 커밋:
   ```bash
   git add lib/ scripts/ supabase/ docs/ messages/
   git commit -m "STEP 852: dual capital-intensity estimation to expose method-dependent verdicts, recover skipped universe, refresh distribution"
   git push
   ```

## 완료 보고 → Cowork에게

- 🔴 **판정 갈림 종목 수** + 채택안
- 도미노 15% 대조 (수준형 vs 한계형)
- `skipped` 회수 결과
- **분포 변화표**
- 🔴 못 한 것과 이유
