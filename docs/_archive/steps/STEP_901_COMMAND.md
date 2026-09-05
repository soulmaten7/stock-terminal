# STEP 901 — DoD 7(화면 일관성): 표면 범위 판정 · 크로스 서피스 대조

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_901_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `1f636a1`(STEP 900 · `main`·`revdcf-preview` 동일) · tsc 0 · test **182/182** · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887
**DoD**: 1✅ 2✅ 3🔶 4✅ 5✅ 6✅ 7🔶 8✅ 9❌

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 성격: 판정 STEP · 코드 변경 최소

- 🔴 **§1·§2는 조사다. 고치는 것은 §3에서 판정이 요구할 때만.**
- 🔴 **새 표면을 만들지 말 것.** 역DCF를 브리핑·이메일에 **새로 넣는 것은 이 STEP의 범위가 아니다** — 그건 기능 추가이고 플래그·승인 문제다.
- 🔴 **DoD 3·9를 판정하지 말 것.**

### Cowork 관찰 (🔴 관찰이지 결론이 아니다 · 플레이북 #10)

로컬(플래그 ON) 홈 화면 브리핑에 *"어제 KOSPI +1.62% · **렌즈 상태 변화 111건**"*이 뜨는데 **역DCF 언급은 보이지 않았다.** 🔴 **이것이 설계인지 미구현인지 Cowork은 모른다.** §1이 코드로 확인한다.

## §1 — 표면 전수 열거 (🔴 코드 grep · 추정 금지)

899가 확인한 것(🔴 **재확인 대상**): `RevDcfBadge` 유일 소비처 = `components/toolbox/UsMarketBoard.tsx`(desktop `:520`·mobile `:555`). revdcf 참조 파일 **12개**. watchlist·briefing·email은 revdcf **미소비**.

**DoD 7 정의의 다섯 표면 각각에 대해** 역DCF가 있는지 코드로 확정한다:

| 표면 | 역DCF | 확인 방법 |
|---|---|---|
| **카드**(종목 상세) | ? | `RevDcfSection` 사용처 |
| **목록**(보드) | ? | `RevDcfBadge` 사용처 |
| **변화 피드** | ? | `lens_state_changes` 계열 — revdcf 상태 변화를 쌓는가 |
| **이메일** | ? | 발송 템플릿 grep |
| **브리핑** | ? | `stock_briefings`·`daily-brief` 크론 |

🔴 **각 칸에 "있음 / 없음 / 플래그 OFF라 안 보임"을 구분해 적는다.** 🔴 **`find()` 미스나 화면 부재를 근거로 "없다"고 적지 말 것 — 코드에서 확인한다**(플레이북 #10).

## §2 — 있는 표면끼리 대조

§1에서 **"있음"으로 나온 표면들** 사이의 일치를 확인한다. DoD 7 정의: *"같은 **이름**·**판정**·**단위**"*.

- **이름**: 섹션명·열 제목·배지 라벨이 표면 간 같은가
- **판정**: 같은 종목이 표면마다 같은 결론을 내는가 — 🔴 **899가 `lossMaking`은 확인했다.** 나머지 판정(`years`·`below_one`·`over_cap`·`invalid`)과 **스킵 12종**도 같은가
- **단위**: `년`·`%`·통화 표기가 같은가
- 🔴 **실제 종목으로 대조한다.** 판정별로 최소 1종목씩 DB에서 골라 **양쪽 표면의 렌더 코드 경로를 따라간다.** 🔴 브라우저가 없으므로 **코드 추적 + 유닛테스트**로 하고, **그 한계를 명시**한다(Cowork이 별도 육안 확인).

## §3 — 🔴 표면 범위 판정 (이 STEP의 핵심)

**7렌즈는 다섯 표면 전부에 나온다. 역DCF가 일부에만 있다면 그것이 미완성인가 설계인가.**

🔑 **883이 7·8·9행에 쓴 것과 같은 형태의 질문이다** — 거긴 *"되돌릴 수 있는 성격인가"*였고 여긴 *"있어야 하는가"*다.

각 부재 표면에 대해 **"없는 것이 옳은 이유"가 있는지** 판단한다. 예: 브리핑은 *"어제 대비 상태 변화"*를 말하는데 **역DCF 판정이 매일 바뀌는 성질인가**(882·885 실측: i·세율만 바꿔도 버킷이 크게 이동 — 🔴 **그 사실이 "브리핑에 넣으면 안 되는 이유"인지 판정한다**).

> **③판정**: ✅ / 🔶 유지 — 🔴 **하나만**
> **근거** · **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건**

🔴 **반드시 다룰 것**:
1. **부재 표면을 N/A로 볼 것인가, 미완성으로 볼 것인가.** 🔴 **N/A로 본다면 "왜 7렌즈와 다른 기준인가"를 적는다**(886 이후 아카이브 `docs/_archive/LENS_7_COMPLETED.md`에서 7렌즈가 이 항목을 어떻게 통과했는지 확인).
2. **`REVDCF_ENABLED` OFF가 판정에 미치는 영향** — 플래그가 켜지면 표면이 늘어나는가, 아니면 코드에 없어서 안 늘어나는가. 🔴 **이 둘은 다르다.**
3. 🔴 **브라우저 육안 검증을 Cowork이 별도로 한다는 사실**을 불리한 사실 또는 재검토 조건에 적는다 — 이 세션은 코드 추적까지다.

## §4 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` — DoD 7 판정 · **§1 표면 표를 각주에 그대로** 남긴다(다음 세션이 재조사 안 하게)
- `docs/REVDCF_SPEC.md` §10 — 부재 표면을 **미결로 등재할지 N/A로 닫을지** §3 판정대로
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 §3이 요구하지 않으면 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **코드 변경이 생기면 그 이유가 §3 판정에 적혀 있어야 한다.** 판정과 무관한 변경이 있으면 되돌린다.
🔴 **커밋 메시지는 §3 판정에 맞게 실행 측이 고쳐 쓴다**(894 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 901: decide whether the surfaces this model does not appear on are missing or deliberate

- the completion item asks for the same name, verdict and unit across five surfaces; the seven
  lenses appear on all five and this model appears on fewer
- which ones it appears on is settled from the code rather than from a page that did not show
  it, since a search that finds nothing is not evidence of absence
- for each surface it is absent from, the question is whether there is a reason it should be:
  a verdict that moves whenever an input is chosen differently may not belong in a daily
  digest, and that is decided from what was measured rather than asserted
- surfaces are not added here; that would be a feature behind a flag that is not ours to turn on"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 🔴 다섯 표면 표 — 있음/없음/플래그OFF라 안 보임 구분 · 각 칸의 코드 근거
   899의 "유일 소비처 UsMarketBoard" 재확인 결과
§2 있는 표면 간 이름·판정·단위 일치 — 판정별·스킵 12종 대조 결과
   🔴 코드 추적으로 한 것이며 육안 아님을 명시
§3 🔴 DoD 7 판정 + 근거·대가·불리한사실·재검토조건
   🔴 부재 표면 = N/A인가 미완성인가 · 7렌즈와 다른 기준이면 그 이유
   🔴 플래그 ON 시 표면이 늘어나는가(코드에 있는가) 
§4 표면 표를 각주에 남겼는가 · SPEC 등재 방식
무변경: 코드 diff 0(§3이 요구한 것 제외) · DoD 3·9 판정 칸 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **새 표면을 만들지 말 것. 플래그를 켜지 말 것. DoD 3·9를 판정하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
