# STEP 906 — `#42`·`#46` 실측: 판정을 다시 열 수 있는 두 건 (🔴 재판정 금지 · 재료만)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_906_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `f499ba3`(STEP 905 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888
**DoD**: 1✅ 2✅ 3🅿️ 4✅ 5✅ 6✅ 7🔶(보류) 8✅ 9❌(보류)

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 성격 · 왜 이 둘인가

905 권고 순서 ①. 🔑 **11건 중 이 둘만 "판정을 다시 열 수 있는" 항목이다.**

- **`#46`** = 🔑 **875가 driver 4를 "현행 유지"로 닫으며 건 재검토 조건 그 자체다.** 각주 원문: *"우리는 **유동부채 전액**을 빼므로 **단기차입금이 운전자본에 섞인다.** 원전은 명시적으로 제외한다. 이는 차입이 많은 기업에서 운전자본을 과소평가한다. 🔴 **그 크기는 미측정.** … 재검토 조건: 위 '단기차입금 혼입'의 크기를 재고 **그것이 판정에 유의미하면 다시 연다.**"*
- **`#42`** = driver 1 재개방 가능성. `lib/revdcf/drivers.ts:163`이 5년 중 **끝점 2개만** 쓴다(872 발견·873 보강).

- 🔴 **측정만 한다. 코드 변경 0 · DB 쓰기 0.**
- 🔴 **driver 1·4를 재판정하지 말 것.** 🔑 **재검토 조건이 충족되는지는 측정이 답하고, 다시 열지는 장은태가 정한다.**
- 🔴 **다른 9건에 손대지 말 것.**

## §1 — 🔴 원본 먼저: 재검토 조건 원문 확인

**측정 설계 전에 판정 각주를 연다**(플레이북 — 기억으로 인용하지 않는다).

- `docs/LENS_COMPLETION_STANDARD.md` §1의 **driver 4 절**과 **driver 1 절**을 직접 읽는다.
- 🔴 **재검토 조건이 실제로 무엇이라 적혀 있는지 그대로 인용**한다. Cowork이 위에 옮긴 것과 다르면 **다르다고 적고 문서를 따른다.**
- 🔑 **측정은 그 조건에 답하는 형태여야 한다.** 조건이 *"유의미하면"*이라면 **무엇을 유의미로 볼지**가 문서에 있는지 확인하고, 없으면 🔴 **이 STEP이 정하지 말고 "기준 미정"으로 적고 숫자만 낸다.**

## §2 — `#46` 실측: 단기차입금 혼입 크기

**현행**: `drivers.ts:186` — `(assetsCur − cashOp − liabCur) / rev` 5년 평균. `liabCur` = **유동부채 전액**.
**원전**: 무이자 유동부채만 차감(`T4 Tutorial 4` B23 — *"non-interest bearing"*).

### 잴 것 (🔴 읽기만 · 최신 `as_of` 604 / 비교 모집단은 이전과 같게)

1. **혼입 규모** — 유동부채 중 **이자부(단기차입금·유동성 장기부채)** 비중. 🔴 **XBRL에서 조달 가능한 태그가 무엇인지 먼저 확인**하고, 조달 안 되면 **"조달 불가"로 적는다**(876이 driver 4 A안에서 겪은 것과 같은 벽일 수 있다).
2. **차감했을 때 운전자본율 변화** — 종목별 현행 vs 이자부 제외. 분포(중앙·p25/p75·최대).
3. **GAP·판정 이동** — 몇 사에서 GAP이 움직이고 몇 사에서 **버킷이 바뀌는가**. 🔴 **양 정의 병기**(비교가능만 / 산출불가 포함).
4. 🔴 **도미노 앵커** — T4 원본으로 현행식과 이자부제외식을 둘 다 돌려 **원전 `I31`(0.501%)에 어느 쪽이 가까운가.**
5. 🔴 **차입 많은 기업에 편향되는지** — 875가 *"차입이 많은 기업에서 과소평가"*라 했다. **부채비율과 변화폭의 관계**를 본다.

## §3 — `#42` 실측: 끝점 2개 vs 전체 5년

**현행**(`drivers.ts:163`): `(rev[lastY]/rev[firstY])**(1/nSpan) − 1` — **중간 3년 미사용.**

### 잴 것

1. **대안 추정** — 최소 **로그선형 회귀**(5년 전부 사용). 🔴 **다른 안을 추가할지는 판단하되, 추가하면 이유를 적는다.**
2. **차이 분포** — 종목별 현행 CAGR vs 회귀 기울기. 중앙·p25/p75·**부호가 갈리는 종목 수**.
3. **GAP·판정 이동** — §2와 같은 형식.
4. 🔴 **끝점이 이상치인 종목** — 🔑 **끝점 2개만 쓰면 그 두 해가 이상하면 전체가 흔들린다.** 5년 중 첫해·마지막해가 나머지와 크게 다른 종목이 몇이고, **그 종목들에서 차이가 특히 큰지** 본다. **이것이 이 항목의 핵심 질문이다.**
5. 🔴 **도미노 앵커** — 원전 도미노 매출 5년으로 두 방식을 돌려 **원전 값(7%)에 어느 쪽이 가까운가.** 🔴 **원전이 CAGR을 썼는지 다른 방식을 썼는지 T3에서 셀로 확인**한다(#76 — 서술 말고 셀).

## §4 — 산출 (🔴 판정 금지)

- `docs/LENS_COMPLETION_STANDARD.md` — driver 4·driver 1 각주에 **실측 블록 추가**. 🔴 **③판정 칸 불변** · 🔴 **기존 각주 한 글자도 고치지 말 것**(추가만).
- 🔴 **재검토 조건 충족 여부를 "판단"하지 말고, 조건이 묻는 숫자를 낸 뒤 "장은태 판단 대기"로 적는다.**
- `docs/REVDCF_SPEC.md` §10 — `#42`·`#46` 상태 갱신(측정 완료·판정 대기) · §11 실측 원장에 숫자
- `docs/AUDIT_904_OPEN_ITEMS.md`·`docs/DECISION_905_NEXT.md` 해당 행 갱신
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_906_wc_debt.ts`·`scripts/probe_906_growth_fit.ts` + `docs/probe_906_*.json` — 🔴 **스크립트를 같은 커밋에**(#78) · 🔴 **기대값·산식 출처를 주석에**(900 원칙)

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **`lib/revdcf/**`에 diff가 나오면 이 STEP이 구현한 것이다 — 되돌리고 보고한다.**
🔴 **커밋 메시지는 실측 결과에 맞게 실행 측이 고쳐 쓴다**(894 교훈 — 아래는 초안이며 결과를 단정하지 않는다).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 906: measure the two things that could reopen a verdict

- one verdict was closed on the condition that the size of a known contamination be measured
  later: working capital subtracts every current liability, including borrowings the source
  excludes on purpose, and how much that moves anything was never checked
- the other is that the growth rate reads only the first and last of five years, so the three
  in between never enter it; the question is whether the two it reads are unusual often enough
  to matter
- both are compared against the source case as well as across the universe, with verdict
  movement counted under both definitions
- no code changes and nothing is written; whether either condition is met is not decided here"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 재검토 조건 원문 인용(문서에서) · Cowork 인용과 다르면 그것 · "유의미" 기준이 문서에 있는가
§2 #46 — 이자부 유동부채 태그 조달 가능한가(불가면 불가) · 혼입 규모 · 운전자본율 변화 분포
   GAP·판정 이동(양 정의) · 도미노 앵커 어느 쪽이 원전에 가까운가 · 차입비율과의 관계
§3 #42 — 대안 추정 방식과 이유 · 차이 분포 · 부호 갈림 수 · GAP·판정 이동
   🔴 끝점이 이상치인 종목 수와 그 종목들의 차이 크기 · 도미노 앵커
   🔴 원전이 T3에서 무엇을 썼는지(셀로 확인)
§4 각주 실측 블록 추가 · 🔴 ③판정 칸 불변 · "장은태 판단 대기"로 적었는가
무변경: lib/app/components/messages/data/.github diff 0 · DoD 판정 칸 전부 불변
       보류 목록 불변 · REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **driver 1·4를 재판정하지 말 것. 코드를 구현하지 말 것. 나머지 9건에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
