# STEP 907 — `#46` 판정서(운전자본 정의) · 905 권고 ②단계(`#67`·`#36`·`#32`)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_907_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `d09101f`(STEP 906 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **보류 항목(#70·71·74)에 손대지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 성격

- **§1** = `#46` **판정서 작성**(장은태 결정용). 🔴 **판정하지 말 것.**
- **§2** = 905 권고 **②단계**(`#67`·`#36`·`#32`) — 저비용·독립·판정 대기와 무관.
- 🔴 **driver 1·4를 재판정하지 말 것.** 🔴 **운전자본 정의를 바꾸지 말 것**(코드 무변경).
- 🔴 **나머지 항목(#17·#37·#43·#29·#40·#41·#42)에 손대지 말 것.**

## §1 — 🔴 `#46` 판정서 (`docs/DECISION_907_WC_DEF.md` 신설)

906 실측이 875의 재검토 조건에 답했다. **결정 가능한 한 장으로 만든다.**

### 🔴 담을 것 — 906 결과를 `AUDIT`/`SPEC §11`에서 인용(다시 재지 말 것)

1. **질문을 정확히**: 🔑 **이것은 "수준형이냐 한계형이냐"가 아니다.** driver 4 판정(수준형 유지·875)은 그대로다. **수준형 안에서 유동부채를 전액 뺄 것인가, 원전처럼 무이자만 뺄 것인가**이다. 🔴 **두 축을 섞지 말 것.**
2. **원전 정합**: 이자부 제외 = **0.501%**로 T4 `I31`과 **정확 일치**(875 A_full 독립 재현) / 현행 = **−2.135%**(**부호 반전** · 2.636%p 괴리). 🔑 **현행식은 원전 사례에서 부호가 뒤집힌다.**
3. **대가**: 비교가능 **246/464(53.0%)** — 병목은 **100% 이자부채 태그 결측**(WACC 항목 결측 0건). 🔴 **바꾸면 계산 가능 종목이 줄어든다.**
4. **영향**: 혼입 규모 중앙 **+3.36%p**(p25 1.42 / p75 6.71) · 이자부+유동부채 중앙 **10.73%**(p90 26.91%) · GAP 판정 이동 **유출 2 / 유입 0**(비교가능) · **유출 67**(계산불가 포함) · 차입비율과 Δ 피어슨 **+0.221**(875 예상 방향과 일치)
5. 🔑 **847이 이미 같은 구조의 선택을 했다** — *"원전 정의는 재고·미지급 세부 태그가 희소해 604 중 **26%만** 확보(844식 91%보다 나쁨) → 844 수준형 유지."* 🔴 **그때는 26% vs 91%였고 지금은 53% vs 100%다.** **같은 판단이 같은 결론을 주는지, 숫자가 달라져 결론이 달라지는지**를 적는다.
6. 🔴 **권고안 하나** + **근거 · 대가 · 불리한 사실 · 결정을 미룰 때의 비용**. 🔴 **"현행 유지"도 후보에 포함**한다.
7. 🔴 **906 부수 발견을 함께 적는다**: 875가 `T4.xlsx` 전사 범위를 **2014~2017로 좁게 잡았고 실제는 2014~2019**였다(906 재개봉). 🔴 **875 판정을 되돌리지 않았음**을 명시. `REVDCF_SPEC:754(844)`의 선행수치 2.56%p가 875 서술과 모순인데 **844 스크립트 부재로 재검증 불가**라 906의 **3.36%p를 정본화**했다.

## §2 — 905 권고 ②단계 (🔴 저비용·독립 3건)

`docs/DECISION_905_NEXT.md`가 정본이다. **거기 적힌 대로** 처리한다.

### `#32` — 문서 정정
문서 ERP 값(4.17/4.45)을 `wacc.xls` 실제값 **4.46%**로 교체 · 무위험 3.95% 기록.
🔴 **`CLAUDE.md §12 B분류`**(*"외부·변동 값은 숫자를 적지 않고 배선"*)에 걸리는지 판단한다. 🔑 **문서의 참고 수치는 배선 대상이 아닐 수 있다** — 869가 고친 것은 **화면**이었다. **판단하고 이유를 적는다.**

### `#36` — 🔴 내용을 `AUDIT_904`에서 확인하고 처리
🔴 **Cowork은 이 항목의 내용을 모른다.** 정본에서 읽고 처리한다. 🔴 **저비용이 아니면 그렇게 적고 넘긴다.**

### `#67` — `retryBudgetHit` 실제 로그값
894가 관측 장치를 달았고 그 뒤 정규 크론이 여러 번 돌았다. **이제 로그에 값이 있을 수 있다.**
- 🔴 **`vercel logs` CLI로 조회 가능한지** 확인한다(904가 *"CLI가 과거 로그 조회를 지원하는지"*까지만 봤다).
- 🔴 **안 되면 "여전히 조회 불가"로 적고 무엇이 막는지 쓴다.** Vercel 대시보드는 장은태만 가능하므로 **권고만** 남긴다.
- 🔑 **값을 얻으면 892의 A안(조달 고치기)을 평가할 수 있다** — 🔴 **평가만 하고 A안을 적용하지 말 것.**

## §3 — 문서 · 검증 · 커밋

- `docs/DECISION_907_WC_DEF.md` 신설
- `docs/REVDCF_SPEC.md` §10 — `#32`·`#36`·`#67` 상태 갱신 · `#46`은 **판정 대기**로
- `docs/AUDIT_904_OPEN_ITEMS.md`·`docs/DECISION_905_NEXT.md` 해당 행 갱신
- `docs/LENS_COMPLETION_STANDARD.md` — 🔴 **driver 4 각주에 판정서 포인터만.** ③판정 칸 불변.
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **`#32`가 코드 변경을 요구하면 하지 말고 보고한다**(문서 정정 항목이다).
🔴 **커밋 메시지는 §2 결과에 맞게 실행 측이 고쳐 쓴다**(894 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 907: put the working capital definition up for decision, and clear three cheap items

- the measurement answered the condition a verdict was closed under: excluding interest-bearing
  current liabilities reproduces the source case exactly, while including them flips the sign
- the cost is coverage, and an earlier step made the same trade the other way at worse odds,
  so both numbers are put side by side rather than argued
- the question is narrowed on purpose: it is not level versus incremental, which is already
  settled, but what counts as a current liability inside the level form
- three items that do not depend on that decision are handled: a figure corrected in the
  documents, one read from the audit, and one that needed a log the instrument only started
  writing recently
- no code changes and no verdict is moved"
git push && git push origin main:revdcf-preview
```

## §4 — 보고 후 멈춘다

```
§1 DECISION_907 신설 — 권고안 1개 + 근거·대가·불리한사실·미룰때비용
   🔴 847 선례(26% vs 91%)와 지금(53% vs 100%) 비교 결과
   🔴 906 부수발견(875 범위 오류·844 재검증 불가·3.36%p 정본화) 기록
§2 #32 처리 — 🔴 B분류 배선 대상인지 판단과 이유
   #36 처리 — 🔴 내용·저비용 여부
   #67 — 🔴 로그값 얻었는가 / 여전히 불가면 무엇이 막는가 · A안 평가(적용 금지)
§3 SPEC·AUDIT·DECISION_905 갱신 · driver 4 각주 포인터 · ③판정 칸 불변
무변경: lib/app/components/messages/data/.github diff 0 · DoD 판정 칸 전부 불변
       보류 목록 불변 · REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **`#46`을 판정하지 말 것. 운전자본 정의를 바꾸지 말 것. 892 A안을 적용하지 말 것. 나머지 항목에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
