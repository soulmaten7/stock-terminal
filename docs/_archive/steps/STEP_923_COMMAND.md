# STEP 923 — 🟢 922 `years` 권고 승인 · 🔴 **DoD7은 닫지 않는다**(종목명 불일치 실측) · 진단만

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_923_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `8fef1a7`(STEP 922 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

## 🟢🔴 판정 (Cowork · 실측 근거 · 장은태 위임 2026-08-06)

> **922의 `years` 권고 = 승인.** 보드=숫자 / 카드=배지+헤드라인의 비대칭은 **표별 최적화**로 인정한다.
> 🔴 **그러나 DoD7은 ✅로 닫지 않는다.** 🔑 **922의 다섯 표면 비교가 "판정 라벨"만 다뤘고 "종목명"을 안 봤는데, 종목명에서 실제 위반이 실측됐다.**

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED`를 켜지 말 것** · DB **쓰기 금지** · **크론 수동 실행 금지** · `lib/**` 수정 금지(산식·917 계측 불변) · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 진단만 한다. 수리 금지 · 코드 수정 0.** 🔑 **7렌즈는 라이브다 — 목록 화면을 고치면 실사용자가 보는 것이 바뀐다.**
🔴 **DoD 판정 칸을 바꾸지 말 것** · **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측).
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 육안 실측 3중 검증 (2026-08-06 · `localhost:3333`)

922가 *"카드·보드 두 표면의 실제 브라우저 렌더는 여전히 육안 검증 안 됨"*을 불리한 사실로 남겼다. Cowork이 봤다.

### 🟢 역DCF 카드 (`/stock/NVDA`) = 정상

「기대 해독」 배지 + *"시장은 5년의 초과성장을 요구합니다"* 헤드라인 · 자본비용 3점 밴드(9.7%→5년 / **10.7% 기준→5년** / 11.7%→6년) · *"기대가 낮은 편 · 이 기법 성립 131개 중 97번째로 긴 기간"* · 드라이버 6개 · 각주 3줄. 🔑 **922가 코드로 읽은 2단 구성이 화면에서 그대로 확인됨.** 레이아웃 정상 · 어절 갈림 없음.

🔴 **보드 배지(`RevDcfBadge.tsx`)는 못 봤다** — US 탐색 목록에 역DCF 배지가 나오지 않는다. 🔴 **어느 화면에 렌더되는지 Cowork이 확인하지 못했다.**

### 🔴 종목명 불일치 (US 탐색 목록 `/explore?market=US`)

| 관측 | 검증 방법 | 결과 |
|---|---|---|
| 「Alphabet Inc.」 2행 | `read_page` 링크 | `/stock/GOOGL` · `/stock/GOOG` — **다른 클래스인데 이름 동일 · 티커 미표시로 구분 불가** |
| 「Mo」 $68.44 | `read_page` 링크 | `/stock/MO` — **티커를 회사명 자리에** |
| 「Hst」 $25.13 | `read_page` 링크 | `/stock/HST` — 동일 |
| 「Suncor Energy Inc.」 | 대조군 | `/stock/SU` — **정상**(회사명 있음) |
| 「모멘텀 모멘텀 상위권」 | 육안 | **단어 중복** |

**외부 검증**(웹): MO = **Altria Group, Inc.** · HST = **Host Hotels & Resorts** — 정식 회사명이 존재한다.

🔴 **결정적 대조**: **`/stock/MO` 상세 페이지는 「Altria Group, Inc. MO」로 정상 표시된다.**
🔑 **데이터 결손이 아니다. 상세는 이름을 알고 있고 목록 경로만 못 가져온다.** 🔑 **같은 앱·같은 순간에 목록은 「Mo」, 카드는 「Altria Group, Inc.」다.**

🔴 **또 하나**: 목록 = 「NVIDIA Corporation」(영문 정식명·티커 없음) vs 상세 = 「엔비디아 **NVDA**」(한글명+티커). 🔴 **이것이 결함인지 의도된 현지화인지는 Cowork이 판단하지 않는다** — §2가 답한다.

## §1 — 🔴 922 승인 적용

- `docs/DECISION_922_BADGE.md` — 머리에 **`years` 권고 승인 기록**(위임 근거·일자). 🔴 **본문 권고는 고치지 말 것**(907 전례).
- 🔴 **DoD7 ③판정 칸은 🔶 그대로 둔다.** 🔴 **§0 실측을 이유로 각주에 기록**한다: *"922의 다섯 표면 비교는 판정 라벨 기준이었고 종목명은 대상이 아니었다. 923 실측에서 종목명 불일치가 확인돼 DoD7은 미결 유지."*
- `docs/LENS_COMPLETION_STANDARD.md` — 🔴 **DoD7 요구 문구의 "같은 이름"이 무엇의 이름인지 원문으로 확인**한다. 🔑 **판정 라벨인가 종목명인가 둘 다인가.** 🔴 **원문이 모호하면 "모호함"으로 적고 해석을 단정하지 말 것** — 그 해석이 DoD7의 성패를 가른다.
- `docs/DECISION_908_PENDING.md` — 🔴 **안건 3만 대기 유지.**

## §2 — 🔴 종목명 일관성 전수 진단 (수리 금지)

🔑 **DoD7이 요구하는 다섯 표면 전부에서 종목명이 어떻게 나오는지 코드로 확인한다.**

1. **다섯 표면 각각**(카드·목록·변화피드·이메일·브리핑)이 **종목명을 어느 필드에서 가져오는지** 코드로 따라간다. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 열어서 본다.
2. 🔴 **표로 정리한다**: 표면 / 사용 필드 / 폴백 규칙 / 티커 표시 여부.
3. 🔑 **`/stock/MO` 상세는 정상인데 목록은 아니다** — 🔴 **두 경로가 쓰는 필드가 다른지, 같은데 폴백이 다른지** 확인한다.
4. 🔴 **폴백이 티커를 title-case 하는 코드를 찾는다**(「Mo」·「Hst」의 출처). 🔴 **못 찾으면 "못 찾음"으로 적는다.**
5. **영향 범위** — 🔴 **목록 경로에서 회사명이 비어 폴백을 타는 종목이 몇 개인지 DB로 센다**(🔴 읽기만). 🔑 **2개인지 200개인지가 처방을 가른다.**
6. **「Alphabet Inc.」 중복** — 🔴 **목록이 티커를 안 보여주는 것이 설계인지 누락인지** 코드로 확인한다.
7. **「모멘텀 모멘텀 상위권」** — 🔴 **라벨 조립 경로를 찾아 중복 원인을 적는다.** 🔴 **고치지 말 것.**

🔴 **전부 진단이다. 코드 수정 0.**

## §3 — 🔴 보류 목록과의 관계 (명시할 것)

`STATE.md` 보류: *"7렌즈 깊이 확장 — 모델 완성 전 재개 금지."*

🔑 **이 STEP의 성격**: 🔴 **깊이 확장이 아니라 DoD7 검증이다.** DoD7은 **역DCF 완성의 필요조건**(승인된 정의: DoD9 제외 8항목)이므로 **확인은 범위 안**이다.
🔴 **그러나 수리는 다르다** — 목록 화면 코드를 고치면 **7렌즈 라이브 표시가 바뀐다.** 🔴 **수리는 별도 승인이다. 이 STEP에서 하지 말 것.**
🔴 **이 구분을 `STATE.md`에 기록**한다. 🔑 **899·901에서 보류를 넘어 잡힌 전례가 있다 — 경계를 문서로 남긴다.**

## §4 — 판정서 (`docs/DECISION_923_NAMING.md` 신설)

- **§0 실측** · **§2 진단 결과**(표면별 필드·폴백·영향 종목 수)
- 🔴 **DoD7 상태 = 미결 유지** · 🔴 **그 이유**(922 비교가 종목명을 안 다뤘음 · 실측 위반 확인)
- 🔴 **`years` 권고는 승인됨**을 함께 적어 **두 사안이 별개임을 분명히** 한다. 🔑 **922 권고가 기각된 게 아니다.**
- 🔴 **수리 선택지와 각각의 대가** — 🔴 **권고까지만. 실행은 승인 후.** 🔑 **7렌즈 라이브를 건드리는 비용을 반드시 적는다.**
- 🔴 **완성까지 남은 것 갱신** — 921/922 기준 `#70`·`#71`·`#74` + 🔴 **DoD7(종목명)이 추가됐다는 사실.**
- 🔴 **승인은 장은태 것임을 명시.**

## §5 — 문서 · 검증 · 커밋

- `docs/DECISION_923_NAMING.md` 신설 · `docs/DECISION_922_BADGE.md`(승인 기록) · `docs/REVDCF_SPEC.md` §11 실측
- `docs/STATE.md` — 🔴 142줄 상한 · 🔴 **§3 경계 기록** · 🔴 **22:45 UTC 크론 관측 대기 유지**
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **"다섯 표면이 일치하는가"를 코드로 비교할 때, 무엇을 비교 대상에 넣었는지 적는다.** 922는 판정 라벨만 비교하고 *"이름은 `years`만 미대칭"*으로 닫았는데, **종목명은 대상이 아니었고 거기서 실제 위반이 나왔다.** 🔴 **비교 범위를 명시하지 않은 일치 판정은 그 범위 밖을 보증하지 않는다.**
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **어느 코드 경로에든 diff가 나오면 수리한 것이다 — 되돌리고 보고한다.**
🔴 **커밋 메시지는 §2 진단 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 923: accept how the badge shows a number, and reopen item seven because the names do not match

- a browser was pointed at the list and two rows read as a ticker where a company name belongs,
  while the detail page for the same ticker shows the full name, so nothing is missing from the
  data and only one of the two paths fails to reach it
- the previous step compared the surfaces on their verdict labels and concluded they agree; the
  company name was not among the things compared, and that is where the disagreement is
- so the recommendation about the number stands and the item stays open, which are separate
  findings and are recorded separately
- where each surface reads the name from is traced and how many rows fall back to the ticker is
  counted, because two is a different problem from two hundred
- nothing is repaired: these lists are live, and correcting them changes what people are shown"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 922 years 권고 승인 기록 · 🔴 DoD7 ③판정 칸 🔶 유지 확인
   🔴 DoD7 원문의 "같은 이름"이 무엇의 이름인지(모호하면 "모호함")
§2 🔴 다섯 표면 × 사용 필드 · 폴백 규칙 · 티커 표시 여부 표
   🔴 상세와 목록이 다른 필드인가 같은 필드 다른 폴백인가
   🔴 티커 title-case 폴백 코드 위치(못 찾으면 "못 찾음")
   🔴 폴백 타는 종목 수(DB · 읽기만) · Alphabet 티커 미표시가 설계인가 누락인가
   🔴 "모멘텀 모멘텀" 중복 원인 · 🔴 전부 진단만 했는지
§3 🔴 보류 경계 기록 — 검증은 범위 안 / 수리는 별도 승인
§4 DECISION_923 — DoD7 미결 사유 · years 승인과 별개임 · 수리 선택지와 대가
   🔴 완성까지 남은 것 갱신(#70·#71·#74 + DoD7)
무변경: 🔴 코드 diff 0(수리 없음) · REVDCF_ENABLED Production OFF
       lib/ diff 0(산식·917 계측) · DoD 판정 칸 전부 불변
       ②단계 미착수 · 안건 3 대기 불변 · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것(진단만). 7렌즈 목록 코드를 건드리지 말 것. DoD 판정 칸을 바꾸지 말 것. `REVDCF_ENABLED`를 켜지 말 것. ②단계를 시작하지 말 것. 안건 3에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
