# STEP 905 — "지금 가능 11건" 재확인 · 우선순위 판정서 (🔴 작업 착수 아님)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_905_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `4fb852f`(STEP 904 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888
**DoD**: 1✅ 2✅ 3🅿️ 4✅ 5✅ 6✅ 7🔶(보류) 8✅ 9❌(보류)

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **보류 항목(#70·71·74 및 DoD 7·9 영역)에 손대지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 성격 · 왜 지금

904가 미해소를 넷으로 갈랐고 **"지금 가능" 11건**(`#17·29·32·36·37·40·41·42·43·46·67`)이 남았다. **STATE에 순서·우선순위 없이 적혀 있다**(904가 판정하지 않았다 — 옳은 처리다).

🔴 **904가 스스로 밝힌 약점**:
> *"35건 각각의 재확인 깊이가 균일하지 않다 — **결정형 항목(#17·#37·#43)은 '그런 기능이 없다'는 grep 부재 확인 정도로 상대적으로 가볍게 처리**했다."*

🔑 **그 셋이 하필 "지금 가능 11건"에 들어 있다. 11이라는 숫자의 신뢰도가 균일하지 않다.**

### 🔴 이 STEP이 하는 것 / 안 하는 것

- **한다**: ① 얕게 본 3건 재확인 ② 11건 성격 분류 ③ **우선순위 판정서 제출**
- 🔴 **안 한다**: **11건 중 어느 것도 착수하지 않는다.** 구현·측정·문서정정 **전부 금지**. 🔴 **STATE가 "장은태 지시 후에만"이라 적었고 순서는 장은태 몫이다.**
- 🔴 **DoD·모델 완성 여부를 판정하지 말 것.**

## §1 — 얕게 본 3건 재확인

`#17`(driver 3 병기용 폴백) · `#37`("판정 불가" 라벨 체계) · `#43`(원전 "범위" 저/기준/고를 어떻게 만들 것인가)

🔴 **904가 grep 부재 확인으로 처리한 것을 제대로 본다**:
1. **항목이 지금도 유효한가** — 866~904 사이에 다른 판정으로 **대체되거나 무효화되지 않았는가**(#22가 825 원칙에 무효화된 선례).
2. **"지금 가능"이 맞는가** — 🔴 실제로 **무엇을 하면 닫히는지 한 줄로 쓸 수 있어야** 한다. 못 쓰면 *"지금 가능"이 아니다.*
3. **결정형인가 작업형인가** — 🔑 **결정형이면 장은태 몫이고 Claude Code가 할 일이 없다.** 그 구분을 명확히 한다.

🔴 **재분류가 필요하면 904의 판정을 고친다**(무효·보류·원리적 불가 등). 🔴 **고쳤으면 그 사실을 보고한다.**

## §2 — 11건 성격 분류 (🔴 우선순위 아님)

`docs/AUDIT_904_OPEN_ITEMS.md`가 정본이다. **거기서 11건을 읽어** 아래로 나눈다:

| 성격 | 뜻 | 예상(🔴 확인 대상) |
|---|---|---|
| **계산** | 모델이 내는 값이 바뀜 | `#42`(매출성장 끝점 2개만) · `#46`(운전자본에 단기차입금 혼입) |
| **관측** | 값은 그대로·보이게만 함 | `#67`(retryBudgetHit 로그값) |
| **화면** | 문구·표시 | `#29`·`#40`·`#41` |
| **문서** | 기록 정정 | `#32` |
| **결정** | 🔴 장은태 몫·Claude Code 할 일 없음 | `#17`·`#37`·`#43` |

🔴 **각 항목에 다음을 붙인다**:
- **되돌릴 수 있는가**(문서·측정=쉬움 / 계산·DB=어려움)
- **보류에 걸리는가** — 🔴 **`#29`·`#40`·`#41`이 DoD 7 영역인지 판단한다.** 🔑 **889가 문구를 고친 것은 DoD 6(주장 정합)이라 허용됐다. 새 표시를 만드는 것은 다를 수 있다.** 걸리면 **보류로 옮긴다.**
- **다른 항목의 전제인가** — 예: `#46`은 875 driver 4 판정의 **재검토 조건 그 자체**다(*"단기차입금 혼입의 크기를 재고 유의미하면 다시 연다"*). 🔴 **판정을 다시 열 수 있는 항목인지 표시한다.**

## §3 — 🔴 우선순위 판정서 (`docs/DECISION_905_NEXT.md` 신설)

**장은태가 순서를 정할 수 있는 한 장.** 884·890·902 선례.

담을 것:
1. **11건 각각** — 한 줄 설명 · 성격 · 되돌림 · 보류 여부 · **닫으려면 무엇을 해야 하는가**
2. 🔴 **판정을 다시 열 수 있는 항목**을 따로 표시 — 🔑 **`#46`이 그렇다면 그것은 "미결 처리"가 아니라 "driver 4 재검토"다.** 무게가 다르다.
3. 🔴 **권고안 하나** — 어떤 순서인지, **왜 그 순서인지**. 🔴 선택지 나열 금지(#79).
   - 🔑 **권고 근거는 오늘 확립된 원칙에 걸어라**: 되돌리기 어려운 것은 늦게·판정을 흔드는 것은 먼저·결정형은 장은태가 먼저 처리해야 나머지가 풀리는가.
4. **🔴 대가 · 🔴 불리한 사실 · 🔴 결정을 미룰 때의 비용**
5. 🔴 **"아무것도 안 하고 지금 상태로 둔다"도 선택지에 포함**한다 — 11건이 전부 *"안 하면 모델이 틀리는 것"*인지, *"있으면 더 좋은 것"*인지 구분해 적는다. 🔑 **이 구분이 "모델 완성" 판정의 실질이다.**

## §4 — 문서 · 검증 · 커밋

- `docs/DECISION_905_NEXT.md` 신설
- `docs/AUDIT_904_OPEN_ITEMS.md` — §1 재확인 결과 반영(🔴 정본 유지)
- `docs/REVDCF_SPEC.md` §10 — §1에서 재분류된 항목만 표시 갱신
- `docs/STATE.md` — 11건 성격 분류와 판정서 포인터. 🔴 **순서를 적지 말 것**(장은태 결정 전) · 🔴 142줄 상한
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **코드 diff가 하나라도 나오면 이 STEP이 착수한 것이다 — 되돌리고 보고한다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 905: sort the eleven remaining items so the order can be chosen, and check the three that were checked lightly

- the audit that produced the eleven said its own depth was uneven, and the three it treated
  most lightly are all in that eleven, so those are opened properly first
- an item only counts as possible now if what would close it can be written in one line; the
  ones that cannot are reclassified
- each is marked by what it changes, whether it can be undone, whether it falls under the
  parked work, and whether closing it would reopen a verdict rather than merely tick a box
- one of them is the condition a verdict was closed under, which makes it heavier than the rest
- doing none of them is listed as an option, with each item marked as either something that
  makes the model wrong or something that would merely make it better"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 #17·#37·#43 재확인 — 유효한가 · "지금 가능"이 맞는가(닫는 방법 한 줄) · 결정형인가
   🔴 904 판정을 고쳤으면 무엇을 어떻게
§2 11건 성격 분류표 — 계산/관측/화면/문서/결정 · 되돌림 · 보류 여부 · 판정 재개방 여부
   🔴 #29·#40·#41이 DoD 7 보류에 걸리는지 판단 결과
§3 DECISION_905 신설 — 권고 순서 1개 + 근거·대가·불리한사실·미룰때비용
   🔴 "안 하면 모델이 틀리는 것" vs "있으면 더 좋은 것" 구분 결과
§4 STATE 반영 · 🔴 순서를 적지 않았는지
무변경: 코드 diff 0 · DoD 판정 칸 전부 불변 · 보류 목록 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **11건 중 어느 것도 착수하지 말 것. 코드를 고치지 말 것. DoD·완성 여부를 판정하지 말 것. STATE에 순서를 적지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
