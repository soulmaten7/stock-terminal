# STEP 902 — 🔴 보류 항목 침범 기록 · 887 이관분 반영 확인 · DoD 3 판정서

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_902_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `21eb227`(STEP 901 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887
**DoD**: 1✅ 2✅ 3🔶 4✅ 5✅ 6✅ 7🔶 8✅ 9❌

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork이 지침을 어겼다 (기록이 목적)

**`docs/STATE.md` "▶ 다음" 절 마지막 줄**:

> 🅿️ **보류: 항목 7·9(노출) · 베타 · 국가탭 확대 · 7렌즈 깊이 확장 — 모델 완성 전 재개 금지**

**같은 절 §8**:

> 🔴 **DoD 3 판정 = 장은태 결정 대기(독립 항목)**

🔴 **그런데 Cowork이 899·901을 제안했다.** 899는 화면 표면 일치(DoD 7 영역), 901은 **DoD 7 판정 그 자체**다. **둘 다 "모델 완성 전 재개 금지" 항목이다.**

🔑 **`CLAUDE.md:60`의 위반 사례가 그대로 재현됐다** — 거기 적힌 것은 *"STATE에 DoD 순서를 적어두어 차이 9행이 목록에서 사라졌다. **표류의 출처는 STATE를 그렇게 쓴 Cowork이었다.**"* 이번엔 차이 9행이 887에 끝난 뒤 Cowork이 **DoD 4 → 5 → 8 → 7**로 흘러갔고, STATE §7이 허용한 **5·8을 넘어 보류 항목까지** 갔다.

### 🔴 처리 방침

- **되돌리지 않는다.** 901 판정은 🔶 **유지**라 DoD 표가 바뀌지 않았고, 899의 `isLossMaking()` 통합은 **중복 제거라 해가 없다.**
- 🔴 **대신 "보류 중 수행됨"으로 표시한다.** 지우면 이력이 사라지고, 그냥 두면 다음 세션이 **허가된 작업으로 오인**한다.

### 플레이북 신규

> 🔑 **STEP을 제안하기 전에 `STATE.md`의 "▶ 다음" 절과 **보류 목록**을 먼저 읽는다.** 직전 STEP의 보고서에서 다음 할 일을 유추하지 않는다 — 보고서는 그 STEP이 무엇을 했는지 말할 뿐, **무엇을 해도 되는지는 STATE가 말한다.**
> **이력**: 899·901(Cowork이 STATE를 다시 읽지 않고 DoD 순서를 따라감 · `CLAUDE.md:60` 위반 사례의 재현).

## §1 — 표시 작업 (🔴 삭제 금지)

1. `docs/LENS_COMPLETION_STANDARD.md` **DoD 7 판정문**(901) 머리에 표시:
   > 🔴 **보류 중 수행됨(902 확인)** — `STATE.md`가 항목 7을 *"모델 완성 전 재개 금지"*로 두고 있었다. 판정은 🔶 **유지**라 상태 변화는 없다. 🔴 **보류가 풀린 뒤 재판정 대상이다.**
2. `docs/CHANGELOG.md`의 899·901 항목에 같은 취지 한 줄. 🔴 **본문은 고치지 말고 부기만.**
3. 🔴 **899의 코드 변경(`lib/revdcf/lossMaking.ts`)은 되돌리지 않는다.** 🔴 **왜 남기는지 이유를 SPEC §10에 적는다**(중복 제거·divergence 방지·기능 추가 아님).

## §2 — 🔴 887 이관분이 DoD 3에 반영됐는가

887이 **검증사례(대조표 9행)를 DoD 값검증으로 이관**했다(STATE §2~6-3 · `DECISION_884` 안건 2).

🔴 **그런데 `LENS_COMPLETION_STANDARD.md`의 DoD 3 서술이 그 이관을 반영했는지 확인되지 않았다.** 현재 DoD 3 서술은 890 이전 상태로 보인다(🔴 **Cowork 추정 — 실제로 열어서 확인할 것**).

- **DoD 3 서술을 연다.** 887 이관분(*"도미노 재현 + 분포 관찰 3"*)이 들어가 있는가.
- **없으면 반영한다.** 🔴 **이것은 새 판정이 아니라 887 판정의 적용 누락 보완이다** — 887이 승인받은 것을 문서에 옮기는 일이다.
- 🔴 **DoD 3의 🔶/✅ 상태는 건드리지 말 것.**
- 🔴 대조표 정본(§1)에 *"검증사례 → DoD 이관"* 포인터가 실제로 있는지도 확인한다(887 §1-3이 요구한 것).

## §3 — DoD 3 판정서 (`docs/DECISION_902_DOD3.md` 신설)

STATE §8이 *"장은태 결정 대기(독립 항목)"*라 적었다. **결정 가능한 한 장을 만든다**(884·890 선례).

🔴 **판정하지 말 것. 재료와 권고안만.**

### 담을 것

1. **DoD 3 정의 원문** — *"값 검증 — 손계산 + **외부 독립 출처** 대조(**최소 3종목**·자릿수 아니라 값). 차이 나면 원인 규명."*
2. **현재 상태를 문서에서 그대로 인용** — 손계산 ✅ / 분포 관찰 3(860) / 방법 3원 확인(864) / 범위 대조 정합 / **총 8곳 탐색 소진**(863 5 + 864 3) / **재현 가능한 동시점 개별 종목 대조 0건**
3. **887 이관분**(§2 결과) — 도미노 재현 + 분포 관찰이 이 항목으로 넘어왔다면 그것이 요건을 얼마나 채우는가
4. 🔴 **"최소 3종목"이 원리적으로 달성 가능한가** — 외부 GAP 공개처는 원전(도미노 1건·2020) · Mauboussin-Johnson 1997 · NC(비공개)뿐이고, **우리는 2026년 값을 낸다.** 🔴 **864의 8곳 탐색이 2년 전이라는 점**을 적고, **재탐색이 필요한지**를 권고안에 포함한다.
5. 🔴 **7렌즈가 DoD 3을 어떻게 통과했는지** — `docs/_archive/LENS_7_COMPLETED.md`에서 확인해 인용한다(삼성·AAPL 등 외부 출처 대조). **다른 기준을 적용하는 것이면 명시한다.**
6. **권고안 하나** + **근거 · 대가 · 불리한 사실 · 결정을 미룰 때의 비용**
   - 후보(참고): ✅ 상향 / 🔶 유지 / 🅿️ **달성 불가로 종결**(7·8행을 제품전제·제약으로 처리한 선례) / **재탐색 후 재판정**
7. 🔴 **"도메인 상한"** — STATE §8이 쓴 표현이다. 🔴 **무슨 뜻인지 문서에서 확인하고, 확인 안 되면 "표현 미상 — 장은태 확인 필요"라고 적는다.** 추정으로 해석하지 말 것.

## §4 — `STATE.md` 정정

🔴 **STATE는 "다음 뭐 할까"의 유일한 정본**이다(파일 머리 선언). **지금 상태와 맞춰야 다음 세션이 표류하지 않는다.**

- **완료 반영**: DoD 5(895·896·897) · DoD 8(900) ✅
- 🔴 **899·901이 보류 항목이었다는 사실**을 "▶ 다음"에 한 줄
- 🔴 **남은 것을 정확히 적는다** — Cowork이 읽기로는 **DoD 3(장은태 결정 대기) 하나**이고 7·9는 보류다. 🔴 **실제로 그런지 STATE 전체를 읽고 확인한 뒤 적는다.** 다른 미완이 있으면 그것도 적는다.
- 🔴 **142줄 상한 유지** · 미측정·못 한 것 목록 보존

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 902: mark the two steps that worked on a parked item, and put the last open item on one page

- the state file parks surface and live-exposure work until the model is finished, and two of
  the last three steps worked on exactly that; the verdict they produced changed nothing, so
  nothing is reverted, but they are marked as done while parked rather than left looking allowed
- the shared helper one of them extracted stays, with the reason written down: it removed a
  duplicate rather than adding anything
- an earlier decision moved the validation row into the value-checking item, and whether that
  move ever reached the document is checked and completed
- the one item still open goes onto a decision page with what the definition asks for, what
  exists, and whether the missing part can be obtained at all
- the state file is brought back in line, since it is what the next session reads"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 플레이북 신규(STEP 제안 전 STATE 보류 목록 확인)
§1 DoD 7 판정문·CHANGELOG 부기 · 🔴 899 코드 잔존 사유 SPEC 등재
§2 🔴 887 이관분이 DoD 3에 반영돼 있었는가 · 없었으면 반영 내용
   대조표 §1의 "검증사례 → DoD 이관" 포인터 유무
§3 DECISION_902 신설 — 권고안 1개 + 근거·대가·불리한사실·미룰때비용
   🔴 "최소 3종목" 원리적 달성 가능성 · 864 탐색이 2년 전인 점
   🔴 7렌즈 DoD 3 통과 기준 인용 · 🔴 "도메인 상한" 표현 확인 결과
§4 STATE 정정 — 완료 반영 · 보류 위반 기록 · 🔴 남은 항목 정확히(전체 읽고 확인)
무변경: 코드 diff 0 · DoD 판정 칸 전부 불변 · REVDCF_ENABLED Production OFF
       크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **DoD를 하나도 판정하지 말 것. 899·901을 되돌리지 말 것. 보류 항목(7·9)에 새 작업을 하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
