# STEP 909 — 안건 1 결정 재료 보완: 부호 반전 실측 · 안건 4 논리 정리

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_909_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a89cec5`(STEP 908 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 왜 이 STEP인가

`docs/DECISION_908_PENDING.md` 안건 1(운전자본 정의)의 재료에 **빠진 숫자가 있다.**

**906이 낸 것**: 도미노에서 이자부 제외 = **0.501%**(원전 `I31` 정확 일치) / 현행 = **−2.135%**(**부호 반전**).
🔴 **515사에서 부호가 뒤집히는 종목이 몇인지는 재지 않았다.**

🔑 **906의 다른 숫자가 반대 방향을 가리킨다** — 비교 가능한 246사에서 **판정 이동이 유출 2·유입 0**뿐이다. 부호 반전이 흔하다면 그보다 훨씬 많이 움직였어야 한다.

🔴 **도미노는 차입이 매우 많은 회사다. 예외 사례일 수 있다.** 🔑 **1건으로 방향을 정하면 872가 CKL의 `0.5ⁿ`을 발견으로 오독했던 것과 같은 자리다.**

- 🔴 **측정만 한다. 코드 변경 0 · DB 쓰기 0.**
- 🔴 **안건 1을 판정하지 말 것.** 재료만 채운다.
- 🔴 **안건 2·3에 손대지 말 것.**

## §1 — 부호 반전 실측 (🔴 읽기만)

906의 프로브(`scripts/probe_906_wc_debt.ts`)를 재사용하거나 같은 산식으로 확장한다. 🔴 **906 값이 재현되는지 먼저 확인**하고, 안 되면 **중단하고 보고**한다.

### 잴 것

1. 🔴 **부호 반전 종목 수** — 비교 가능 246사 중 **현행(음수) → 이자부제외(양수)** 또는 그 반대가 **몇 건인가.**
2. **부호별 분포** — 현행 기준 음수 몇 사 / 이자부제외 기준 음수 몇 사. 🔑 **운전자본율이 음수면 "매출이 늘 때 현금이 풀린다"는 뜻**이라 방향 자체가 다른 이야기다.
3. 🔴 **부호 반전 종목의 성격** — 차입비율(D/E)·업종이 몰려 있는가. 🔑 **도미노처럼 차입 많은 기업에 몰린다면 "예외적 구조"이고, 고르게 퍼지면 "구조적 결함"이다.** 🔴 **이 구분이 안건 1의 답을 가른다.**
4. **부호 반전 종목의 GAP·판정 이동** — 전체 246사 이동(유출 2·유입 0)과 대조. 🔑 **부호가 뒤집혔는데 판정이 안 바뀌었다면 왜인가**(운전자본이 GAP에 미치는 영향이 작아서인지).
5. 🔴 **도미노가 어느 쪽에 속하는가** — 반전 종목군의 분포에서 도미노의 위치(백분위). 🔑 **예외인지 대표인지를 숫자로 답한다.**

🔴 **"부호 반전이 0건"이면 0건이라고 적는다.** 그러면 도미노는 재현 불가능한 특수 사례이고 안건 1의 성격이 달라진다.

## §2 — 안건 4 논리 정리 (🔴 판정 아님 · 사실 확인)

`docs/LENS_COMPLETION_STANDARD.md`의 DoD 절 머리를 **직접 열어** 원문을 확인한다.

- Cowork이 읽기로는 **"완성 9항목 (전부 통과해야 '완성')"**이다. 🔴 **실제 문구를 인용**한다.
- 🔴 **그런데 DoD 3은 903에서 🅿️로 닫혔다 — ✅가 아니다.** 🔑 **그러면 "9항목 전부 ✅"는 이미 달성 불가**다.
- 🔴 **이것이 사실인지 확인**하고, 사실이면 **안건 4의 선택지가 실제로 몇 개인지** `DECISION_908`에 사실로 추가한다.
  - *"9개 전부 ✅"* → **불가**(DoD 3 🅿️)
  - *"3을 🅿️로 인정하고 나머지 8개 ✅"* → DoD 7·9를 닫아야 함 → **플래그 ON 필요** → 🔑 **903 §3이 지적한 순환**
  - *"7·9를 뺀 7개 닫힘"* → 현재 상태
- 🔴 **판정하지 말 것.** 🔴 **"그러니 이것뿐이다"라고 쓰지 말 것** — 선택지와 각각의 성립 여부만 사실로 적는다. 🔴 **DoD 정의를 고치지 말 것**(그건 장은태 몫이다).

## §3 — 산출

- `docs/REVDCF_SPEC.md` §11 — §1 실측 등재 · §10 `#46` 재료 보완 표시
- `docs/DECISION_907_WC_DEF.md` — 🔴 **본문 고치지 말고** 실측 블록 **추가**(907 권고안은 그대로). 🔑 **부호 반전 결과가 권고를 흔들면 그 사실을 적되 권고를 고치지 말 것** — 907의 판단은 907의 것이다.
- `docs/DECISION_908_PENDING.md` — 안건 1 재료 보완 표시 · 안건 4에 §2 사실 추가
- `docs/LENS_COMPLETION_STANDARD.md` — driver 4 각주에 실측 추가. 🔴 **③판정 칸 불변**
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_909_wc_sign.ts` + `docs/probe_909_wc_sign.json` — 🔴 **스크립트를 같은 커밋에**(#78) · 🔴 **906 재현 확인 결과를 주석에**

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **커밋 메시지는 실측 결과에 맞게 실행 측이 고쳐 쓴다**(894·908 교훈 — 아래는 결과를 단정하지 않는 초안).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 909: count how often the sign actually flips, before deciding on one case that it does

- the source case reverses sign under our definition, which reads as a direction error rather
  than a precision one, but the same measurement moved only two verdicts across every company
  it could be computed for, and those two facts point opposite ways
- so the flips are counted, and what kind of company they land on is checked: concentrated among
  heavily indebted firms would make the source case exceptional, spread evenly would make it
  representative
- the company the source used is heavily indebted, and where it sits in that distribution is
  the number the decision turns on
- separately, the completion criterion says all nine items must pass, and one of them was closed
  at a ceiling rather than passed; what that leaves as possible readings is recorded, not decided"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 906 재현 확인 · 부호 반전 종목 수 · 부호별 분포
   🔴 반전 종목이 차입 많은 기업에 몰리는가 고르게 퍼지는가
   반전 종목의 GAP·판정 이동 vs 전체 · 🔴 도미노의 백분위 위치
   🔴 0건이면 0건
§2 DoD 원문 인용 · 🔴 "9항목 전부 ✅"가 이미 불가인지 확인 결과
   선택지 3개와 각각의 성립 여부(🔴 판정 없이)
§3 DECISION_907 실측 블록 추가(🔴 권고 본문 불변) · DECISION_908 보완
무변경: 코드 diff 0 · DoD 판정 칸 전부 불변 · 보류 목록 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **안건 1을 판정하지 말 것. 907 권고 본문을 고치지 말 것. DoD 정의를 고치지 말 것. 안건 2·3에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
