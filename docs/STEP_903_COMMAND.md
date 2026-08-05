# STEP 903 — DoD 3 종결(🅿️ 도메인 상한) 적용 · 조건: 화면에 검증 부재 명시

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_903_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `bf0d76e`(STEP 902 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` **604×4**(08-04 신규 · 정규 크론) · `us_market_cap` 5,888
**DoD**: 1✅ 2✅ 3🔶 4✅ 5✅ 6✅ 7🔶(보류) 8✅ 9❌(보류)

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **보류 항목(DoD 7·9 노출·베타·국가탭·7렌즈 깊이)에 손대지 말 것** — 902가 899·901의 침범을 기록했다.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 장은태 승인 (2026-08-05)

`docs/DECISION_902_DOD3.md` 권고안 **승인**:

> **DoD 3 = 🅿️ 도메인 상한을 최종 상태로 받아들이고 예외 각주와 함께 종결.**

**승인 근거**(902 조사 + 장은태 판단):
- DoD 3 요건 = *"외부 독립 출처 대조 **최소 3종목**"*. 외부 GAP 공개처는 **원전(도미노 1건·2020) · Mauboussin-Johnson 1997 · NC(비공개)** 셋뿐이고 **우리는 2026년 값을 낸다** → 전부 재현 불가.
- 🔑 **7렌즈가 통과한 것은 기준이 느슨해서가 아니라 지표가 흔해서다** — 12개월 수익률·연변동성은 Investing·Morningstar에 널려 있다. **역DCF의 GAP은 계산해 공개하는 곳이 사실상 3곳뿐이다. 기준을 낮추는 게 아니라 도메인이 다르다.**
- 재탐색은 **비권고** — 864 조사가 **3일 전**(2026-08-02)이다(902가 "2년 전"이라는 Cowork 오기를 `git log`로 정정).

### 🔴 승인 조건 (§1)

> **그 사실이 화면에 있어야 한다** — *"이 값은 외부에서 검증된 적이 없다"*에 해당하는 문구.

🔴 **§1을 먼저 하고 §2를 한다. 조건이 안 채워지면 §2를 하지 말고 보고한다.**

## §1 — 🔴 조건 확인: 화면에 검증 부재가 있는가

**Cowork은 확인하지 않았다. 추정하지 않는다.** 실제로 연다.

1. `messages/ko.json`·`en.json`의 `RevDcf`·`RevDcfMethod` **전 키**와 `/revdcf` 페이지·`RevDcfSection`을 열어 **"외부 검증이 없다"는 취지의 문구가 이미 있는지** 확인한다.
   - 인접 문구는 이미 있다(*"예측도 추천도 아닙니다"* · *"하나의 숫자로 읽지 마십시오"* · *"애널리스트 전망이 아닙니다"*). 🔴 **이것들은 "검증 부재"와 다른 말이다.** 있는 것으로 치지 말 것.
   - `RevDcfMethod.repro`가 **원전 재현**을 말하는데, 🔑 **"원전 1건을 재현했다"와 "외부에서 검증됐다"는 다르다.** 오히려 **재현 문구가 검증된 것처럼 읽힐 위험**이 있는지 함께 본다.
2. **있으면**: 그 문구를 인용하고 **조건 충족**으로 적는다. 🔴 **문구를 고치지 말 것.**
3. **없으면**: **추가한다.**
   - 🔴 **889가 추출·적용한 원칙으로 쓴다** — 상대적·서술적 · 원인 정확 · **미확인 원인 단정 금지** · 판단어 금지.
   - 🔴 **`BRAND_IDENTITY §4`** — *"약한 신호를 숨기지 않는다 · 불확실성을 드러낸다 · 과장·확신하지 않는다"*. 🔑 **이 문구는 그 가드레일의 직접 적용이다.**
   - 🔴 **사실만 적는다.** *"세상에 비교 대상이 없다"*·*"그래서 더 신뢰할 수 있다"* 같은 서술 금지. **무엇이 검증됐고(원전 1건 재현) 무엇이 안 됐는지(우리가 내는 값과 대조할 동시점 외부 출처)만.**
   - 🔴 **위치**: 방법론 페이지 · 🔴 종목 카드에도 필요한지 판단하고 **이유를 적는다**(카드는 공간이 좁다 — 링크로 충분한지).
   - 🔴 **ko/en 동시** · `messages.test.ts` **패리티 통과** · en은 축약형 금지(`BRAND_IDENTITY §5`).

## §2 — DoD 3 종결 적용 (🔴 §1 충족 후)

- `docs/LENS_COMPLETION_STANDARD.md`:
  - **완성 현황표** 역DCF 행의 `3값` 칸: `🔶` → **`🅿️`**. 🔴 **✅로 적지 말 것.**
  - **DoD 3 절**에 예외 각주. 🔴 **기존 서술을 지우지 말고 취소선/부기**로. 담을 것: 요건 원문 · 왜 도달 불가인가(§0 근거) · **무엇은 됐는가**(손계산·도미노 재현·분포 관찰 3·방법 3원 확인·범위 대조) · **무엇은 영구히 안 되는가**(동시점 개별 종목 값 대조) · **재개 조건**(외부에 동시점 GAP을 공개하는 출처가 생기면).
  - 🔴 **`🅿️`가 이 표에서 처음이 아니다** — 887이 모집단(제품 전제)·데이터출처(제약)에 썼다. **같은 기호를 쓰되 뜻이 다르므로**(거긴 "되돌림 불가", 여긴 "도달 불가") 🔴 **범례에 둘을 구분해 적는다.**
- `docs/REVDCF_SPEC.md` §10 — DoD 3 관련 미결 **소진 표시** · 🔴 **"우리 GAP은 외부 검증된 적 없음"을 상시 사실로 §11에 등재**(미결이 아니라 성질이다)
- `docs/DECISION_902_DOD3.md` 머리에 **"✅ 2026-08-05 장은태 승인 · 903 적용"** + 조건(§1) 처리 결과. 🔴 **본문은 그대로.**

## §3 — 🔴 "모델 완성" 상태 정리 (판정하지 말 것 · 기록만)

§2 후 DoD는 **1✅ 2✅ 3🅿️ 4✅ 5✅ 6✅ 7🔶(보류) 8✅ 9❌(보류)**가 된다.

🔑 **그런데 STATE 보류 목록이 *"항목 7·9 — 모델 완성 전 재개 금지"*라고 적혀 있다. 7·9가 보류인 채로 나머지가 다 닫히면, "모델 완성"의 정의가 무엇인지가 열린 질문이 된다.**

🔴 **이 STEP은 이것을 판정하지 않는다.** 🔴 **STATE "▶ 다음"에 사실만 적는다**:
- DoD 9항목 중 **7·9를 제외한 7개가 전부 닫혔다**(✅ 6 + 🅿️ 1)
- 🔴 **7·9는 `REVDCF_ENABLED` ON이 전제이고 그것은 장은태 승인 사항**이다
- 🔴 **"모델 완성 = 7개 닫힘"인지 "9개 전부"인지는 장은태 결정 대기**로 남긴다

🔴 **보류를 스스로 풀지 말 것. 다음 STEP을 제안하지 말 것.**

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test          # 🔴 ko/en 패리티 포함
git diff --stat HEAD -- lib/ app/api/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                  # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §1 결과(문구가 이미 있었는가 / 추가했는가)에 맞게 실행 측이 고쳐 쓴다**(894 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 903: close the value-check item at the ceiling of what this domain allows, and say so on the page

- the item asks for three companies checked against an outside source; three places in the
  world publish this figure at all, one of them for a single company in 2020 and one of them
  not publicly, while we produce figures for today
- the seven lenses cleared the same item because their measures are common, not because the
  bar was lower; this is a difference of domain and it is recorded as one
- the condition attached to closing it is that the page says the figure has never been checked
  against anything outside, in the same plain terms the rest of the copy uses
- reproducing the source once is not the same as being verified, and the wording keeps them apart
- the item is marked as a ceiling reached, not as passed"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 🔴 "외부 검증 부재" 문구가 이미 있었는가 — 인용 또는 신설 내용
   🔴 인접 문구(예측·추천 아님 / 하나의 숫자 아님)와 구분했는가
   🔴 repro 문구가 "검증됨"으로 오독될 위험 판단
   위치(방법론만 / 카드도) + 이유 · ko/en 패리티 결과
§2 완성 현황표 3값 = 🅿️ · 예외 각주 내용 · 🔴 범례에 🅿️ 두 뜻 구분
   SPEC §10 소진 · §11에 "외부 검증 없음" 상시 사실 등재
   DECISION_902 승인 표시
§3 🔴 STATE에 적은 사실 3줄(7개 닫힘 · 7·9는 플래그 전제 · 모델완성 정의는 결정 대기)
무변경: lib/app/api/data/.github diff 0 · 🔴 DoD 7·9 판정 칸 불변 · 보류 목록 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **§1 조건이 안 채워지면 §2를 하지 말고 보고. DoD 3을 ✅로 적지 말 것. 보류 항목에 손대지 말 것. 모델 완성 여부를 판정하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
