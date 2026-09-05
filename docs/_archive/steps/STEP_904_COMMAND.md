# STEP 904 — `SPEC §10` 미결 33건 전수 감사 (🔴 완성 판정의 전제)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_904_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `8534245`(STEP 903 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888
**DoD**: 1✅ 2✅ 3🅿️ 4✅ 5✅ 6✅ 7🔶(보류) 8✅ 9❌(보류)

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **보류 항목(DoD 7·9 노출·베타·국가탭·7렌즈 깊이)에 손대지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 왜 지금 이것인가

**대조표 차이 9행은 887에 전부 닫혔고, DoD는 7·9를 뺀 일곱 개가 닫혔다.** 남은 결정은 *"모델 완성"의 정의*이고 그건 장은태 몫이다.

🔑 **그런데 완성 여부를 판정하려면 "무엇이 미완인가"가 정확해야 한다. 지금 그것이 정확하지 않다.**

### 🔴 Cowork 사전 실측

`docs/REVDCF_SPEC.md` §10: **총 76건 · 소진/해소 표시 없는 것 33건**

```
6 · 17 · 19 · 37 · 38 · 39 · 22 · 23 · 24 · 26 · 27 · 28 · 29 · 33 · 31 · 32
9 · 10 · 11 · 40 · 41 · 42 · 43 · 44 · 45 · 46 · 48 · 60 · 54 · 62 · 70 · 71 · 74
```

**Cowork이 코드로 확인한 3건 — 셋이 서로 다른 유형이다**(🔴 **재확인 대상이지 결론이 아니다**):

| # | 내용 | 확인 |
|---|---|---|
| **26** | *"수집 경로를 frames → companyfacts로 변경"* | 🔑 **이미 됐다** — `app/api/cron/revdcf/route.ts:56`이 `data.sec.gov/api/xbrl/**companyfacts**/CIK…`를 호출한다. **해소인데 표시 누락.** |
| **33** | *"driver 6 구속조건 — 업종 WACC 차용 불가·구성요소 조립 필수"* | 🔑 **이미 됐다** — `lib/revdcf/compute.ts` `assembleWacc`. 849 배선·881 판정. **해소인데 표시 누락.** |
| **22** | *"적용 밖 종목 화면 문구 구현(**은행·리츠·보험·자산운용 4종**)"* | 🔑 **이제 무효** — 825가 *"은행이라 단정 안 함"*을 원칙으로 세웠다. 업종을 명시하는 이 요구는 **현 원칙과 충돌**한다. |

🔑 **세 유형이 다 나왔다: 해소·표시누락 / 해소·표시누락 / 무효.** 33건 중 실제 미해소가 몇인지 아무도 모른다.

### 🔴 못 한 축 (명시)

**검색 축은 하지 않았다.** 이 판단은 **우리 문서·코드 내부 감사**라 외부 출처가 개입할 자리가 없다. 🔴 **§2에서 개별 항목이 외부 사실을 요구하면 그때 검색한다**(예: #38 Russell 3기준·#45 원전 책 page 92).

## §1 — 성격

- 🔴 **문서 감사다. 코드·DB 변경 0.** 항목이 *"구현하라"*고 해도 **이 STEP에서 구현하지 않는다.**
- 🔴 **DoD·완성 여부를 판정하지 말 것.**
- 🔴 **항목을 삭제하지 말 것** — 상태만 바꾼다(886 정본 원칙·이력 보존).

## §2 — 전수 감사 (33건 · 🔴 하나도 빠뜨리지 말 것)

각 항목을 **네 갈래 중 하나**로 판정한다. 🔴 **"아마 됐을 것"** 금지 — **코드·문서·DB로 확인**한다(플레이북 #10: 현상 ≠ 원인 · #82: grep 매칭 ≠ 내용).

| 판정 | 뜻 | 요구 |
|---|---|---|
| **✅ 해소** | 이미 됐는데 표시 누락 | 🔴 **어디서 됐는지**(파일:행 또는 STEP 번호) |
| **🔴 미해소** | 진짜 남아 있음 | 🔴 **무엇이 남았는지 한 줄** · 보류 항목인지 표시 |
| **⛔ 무효** | 이제 성립 안 함 | 🔴 **왜 무효인지**(원칙 변경·설계 변경·상위 결정) |
| **↗ 이관** | 다른 문서가 정본 | 🔴 **어디로**(886 정본 배정표) |

🔴 **Cowork이 확인한 3건(#26·#33·#22)도 직접 재확인**한다 — 남의 grep 결과를 내용 증거로 쓰지 않는다.

🔴 **개별 항목이 외부 사실을 요구하면 그때 검색한다.** 안 하면 *"검색 안 함"*으로 적는다.

🔴 **판단이 안 서는 항목은 `❓ 판단 불가`로 두고 왜 그런지 적는다.** 억지로 넷 중 하나에 넣지 말 것.

## §3 — 적용

- `docs/REVDCF_SPEC.md` §10 각 행에 판정 표시. 🔴 **행을 지우지 말고 상태만.** ✅/⛔/↗는 **근거를 같은 칸에.**
- 🔴 **감사표를 `docs/AUDIT_904_OPEN_ITEMS.md`로 따로 낸다** — §10은 76행이라 이미 길다. 🔴 **§10 정본 원칙은 유지**(§10이 정본·감사표는 판정 근거 모음).
- 🔴 **보류 항목에 속하는 미해소는 그렇게 표시**한다(예: #74는 DoD 7 영역 = 보류).

## §4 — 결과 정리 (🔴 판정 아님 · 사실만)

감사 후 **실제 미해소가 몇 건이고 어떤 성격인지** STATE에 적는다.

- 🔴 **분류**: 보류 항목 / 노출 후에만 가능 / 지금 가능 / 원리적 불가
- 🔑 **"지금 가능"이 몇 건인지가 다음 작업의 실제 목록**이다. 🔴 **그것이 0이면 0이라고 적는다** — 그게 완성 판정의 재료다.
- 🔴 **"모델 완성"을 판정하지 말 것.** 재료만 놓는다.
- `docs/STATE.md` 🔴 142줄 상한 유지

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **감사 전후로 §10 행 수가 같은지 확인**한다(76행 → 76행). 줄면 삭제한 것이니 되돌린다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 904: find out how many of the open items are actually still open

- thirty-three entries carry no resolution mark, and three checked at random came out three
  different ways: two had been done long ago without anyone marking them, and one asks for
  something a later principle forbids
- so every one of them is checked against the code, the documents or the database, and marked
  as resolved, still open, void, or moved, with where that was decided written next to it
- nothing is deleted and nothing is implemented here; an entry that asks for work stays open
  and says so
- what remains is then sorted by whether it is parked, needs exposure first, is possible now,
  or cannot be done at all, because the count of the third kind is what the next decision needs"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§2 33건 전수 판정표 — ✅해소 N / 🔴미해소 N / ⛔무효 N / ↗이관 N / ❓판단불가 N
   🔴 Cowork 확인 3건(#26·#33·#22) 재확인 결과 — 다르면 다르다고
   🔴 검색한 항목과 안 한 항목
§3 SPEC §10 표시 적용 · AUDIT_904 신설 · 🔴 행 수 76 → 76 확인
§4 미해소 분류 — 보류 / 노출 후 / 🔴 지금 가능 N건 / 원리적 불가
   🔴 "지금 가능"이 0이면 0이라고 적었는가
무변경: lib/app/components/messages/data/.github diff 0 · DoD 판정 칸 전부 불변
       보류 목록 불변 · REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **구현하지 말 것. 항목을 삭제하지 말 것. DoD·완성 여부를 판정하지 말 것. 보류 항목에 작업하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
