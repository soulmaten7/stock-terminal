# STEP 910 — 안건 1(`#46`) 판정: 현행 유지 + 한계 공개

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_910_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `08f80ab`(STEP 909 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 판정 (Cowork 권고 · 장은태 승인 대기 아님 — 아래 §5 참조)

> **안건 1 = 현행 유지(유동부채 전액 차감) + 한계를 화면에 공개.**
> 🔴 **907의 하이브리드 권고를 채택하지 않는다.**

### 근거 (전부 실측에 걸림)

1. 🔑 **세 안 중 어느 것도 판정을 바꾸지 않는다** — 906: 전체 246사에서 **유출 2·유입 0** / 909: 부호 반전 26사에서 **유출 0·유입 0**. **모델의 답이 같다.** → **계산 문제가 아니라 표시 문제다.**
2. **커버리지 대가가 근거에 비해 크다** — 전면 전환 시 **464 → 246(53.0%)**. 그 근거인 도미노 부호 반전은 **1건**이고, 🔴 **909에서 DPZ 자신이 태그 결측(2020~2023)으로 비교 표본에 없어 우리 데이터로는 재현조차 못 했다.**
3. **하이브리드는 비교 가능성을 깬다** — 태그 유무로 정의가 갈리면 `rankLine`(*"이 기법 성립 {total}개 중 {rank}번째"*)이 **서로 다른 자로 잰 값들의 순위**가 된다. 🔴 **907 권고가 이 축을 다루지 않았다.**
4. 🔑 **889가 같은 구조의 답을 이미 냈다** — driver 6에서 *"업종 평균 근사 편향은 515사 미측정"*을 **값은 안 바꾸고 화면에 공개**했다. **`SPEC §1048`**: *"단일 값은 거짓 정밀도"*.

### 🔴 대가

원전과 다른 값을 계속 낸다. **무이자만 빼는 원전 정의를 채택하지 않는다.**

### 🔴 불리한 사실 (반드시 문서에 남길 것)

- **도미노 사례에서 부호가 반대다** — 이자부 제외 **0.501%**(원전 `I31` 정확 일치) vs 현행 **−2.135%**.
- 🔴 **26사(10.6%)에서 체계적으로 한 방향으로 틀린다** — 909: **반대 방향 0건**. 무작위 오차가 아니다.
- 반전군은 레버리지 중앙 **0.196**(전체 0.128의 1.6배)이나 업종은 21개로 분산 — **"예외적 구조"로도 "구조적 결함"으로도 깔끔히 안 갈린다**(909).
- 🔴 **현행 기준 운전자본율 음수가 114/246(46.3%)** — 이자부 제외 기준 88(35.8%)보다 26 많다.

### 🔴 재검토 조건

**이자부 유동부채 태그 커버리지가 53.0%에서 유의하게 올라가면**(예: 85% 이상) **전면 전환을 다시 연다.** 🔴 **"유의하게"의 기준은 그때 정한다 — 이 STEP이 정하지 않는다.**

## §1 — 적용: 값 변경 0

- 🔴 **`lib/revdcf/**` diff 0.** 운전자본 산식을 **건드리지 않는다.**
- 🔴 **DB 쓰기 0.**
- `docs/LENS_COMPLETION_STANDARD.md` driver 4 각주 — **판정 블록 추가**(③판정 칸은 **✅ 현행 유지** 그대로 · 🔴 **칸 자체를 바꾸지 말 것**). §0의 근거·대가·불리한사실·재검토조건을 그대로.
- `docs/DECISION_907_WC_DEF.md` — 🔴 **본문 고치지 말고** 머리에 *"910: 하이브리드 권고 미채택 · 현행 유지 + 한계 공개로 결정"* + **미채택 사유**(§0 근거 3 — 비교 가능성 축을 907이 다루지 않았음).
- `docs/DECISION_908_PENDING.md` — 안건 1 **해소 표시** · 🔴 **안건 2·3·4는 그대로 대기.**
- `docs/REVDCF_SPEC.md` §10 `#46` **소진** · §11에 909 실측 등재

## §2 — 🔴 화면 공개 (이 판정의 조건)

🔑 **"현행 유지"는 "아무것도 안 함"이 아니다.** 한계를 공개하는 것이 이 판정의 조건이다.

**위치**: `/revdcf` 방법론 페이지의 **원장 표 `운전자본` 행**(이미 존재). 🔴 **새 절을 만들지 말 것.**

**담을 사실**(🔴 **889 원칙으로 쓴다** — 서술적·단정 금지·수치 출처 명시):
- 원전은 **무이자 유동부채만** 뺀다. 우리는 **전액** 뺀다.
- 🔴 **그 차이로 일부 종목에서 값의 부호가 갈린다**는 사실. 🔴 **숫자를 박지 말고 배선하거나 정성으로**(`CLAUDE.md §12 B분류` · 907 `#32` 판단 참조 — **화면은 배선 대상**이다).
- 🔴 **"판정에는 영향이 없었다"는 실측**을 함께 적는다 — 그게 이 판정의 근거이므로 **숨기면 안 된다.**
- 🔴 **ko/en 동시** · `messages.test.ts` 패리티 통과 · en 축약형 금지.

🔴 **`#29`·`#40`·`#41`(905 ④단계)에 손대지 말 것** — 그건 안건 2 결정 후다. **이 STEP은 driver 4 원장 행 하나만 건드린다.**

## §3 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test          # 🔴 ko/en 패리티 포함
git diff --stat HEAD -- lib/ app/api/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                  # 🔴 ?? 0건
```

🔴 **`lib/revdcf/`에 diff가 나오면 산식을 건드린 것이다 — 되돌리고 보고한다.**
🔴 **커밋 메시지는 §2 실제 문구에 맞게 실행 측이 고쳐 쓴다**(894·908·909 교훈 — **초안이 결과를 전제하지 않았는지 확인할 것**).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 910: keep the working capital definition and publish what it costs

- three options were on the table and none of them moves a verdict: two out of two hundred and
  forty-six under the first measurement, none at all among the companies whose sign flips
- so this is not a question about the number the model produces but about the number it shows,
  and the answer follows what was done for the cost of capital: leave the value, publish the gap
- switching wholesale would halve how many companies can be answered at all, on the strength of
  one case that our own data cannot even reproduce because that company is missing the tag
- the hybrid keeps coverage but computes different companies by different rules, which quietly
  breaks the ranking that is shown alongside
- the ledger row now says the source subtracts only non-interest-bearing liabilities, that the
  sign parts company for some, and that no verdict changed"
git push && git push origin main:revdcf-preview
```

## §4 — 보고 후 멈춘다

```
§0 판정 기록 — 근거 4·대가·불리한사실 4·재검토조건
§1 driver4 각주 판정 블록 · 🔴 ③판정 칸 불변 · DECISION_907 미채택 사유 · DECISION_908 안건1 해소
   🔴 안건 2·3·4 대기 상태 불변 확인
§2 화면 공개 문구 — 원장 운전자본 행 · 🔴 숫자 배선인가 정성인가와 이유
   🔴 "판정 영향 없음" 실측을 함께 적었는가 · ko/en 패리티
§3 🔴 lib/revdcf diff 0 확인 · 커밋 메시지가 결과를 전제하지 않았는지
무변경: lib/app/api/data/.github diff 0 · DoD 판정 칸 전부 불변 · 보류 목록 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

## §5 — 🔴 이 판정의 성격

**Cowork이 909 실측을 근거로 낸 판정이다.** 🔴 **장은태가 다르게 판단하면 되돌린다** — 값을 안 바꿨으므로 **되돌리는 비용은 문서 수정뿐**이다. 🔑 **그것이 이 안을 고른 이유의 일부다.**

🔴 **산식을 바꾸지 말 것. 안건 2·3·4에 손대지 말 것. 화면 3건(#29·#40·#41)에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
