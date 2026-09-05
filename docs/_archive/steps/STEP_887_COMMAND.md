# STEP 887 — `DECISION_884` 적용: 대조표 재분류 (🔴 판정 내용 불변)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_887_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `7615b66`(STEP 886 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

🔴 **커밋 전 `docs/COMMIT_GATES.md`를 돌린다**(886 신설).

---

## §0 — 🔴 장은태 승인 (2026-08-03)

`docs/DECISION_884_TABLE_STRUCTURE.md` **세 안건 전부 원안 승인.** 보완 둘을 붙인다:

| 안건 | 승인 내용 | 보완 |
|---|---|---|
| 1 | 7행(모집단) → **제품 전제**로 이동 · 8행(데이터출처) → **차이에 잔류**, 판정 칸은 `🅿️ 제약(1인 운영)` | 8행에 **재검토 조건(팀 규모 확대)** 명시 |
| 2 | 9행(검증사례) → **DoD 검증축으로 이관** | 🔴 대조표에 **"→ DoD 검증축으로 이관" 포인터 한 줄**을 남긴다(*"그 행 어디 갔지"* 재발 방지) |
| 3 | driver3·driver6·인플레 → **"동일 식·값만 차이" 3행**으로 묶고 차이에서 뺌 | 🔴 **driver 6에 각주 필수**(아래) |

### 🔴 승인 근거 — 원전과 결과

1. **원전 자신의 구조**: `T8 Inputs` 시트가 세 범주에 라벨을 붙여놨다 — `B4 "Operating Value Drivers"`(C6 성장·C8 마진·C10 고정자본·C11 운전자본) / `B13 "Other Value Determinants"`(**C15 현금세율·C16 자본비용·C17 인플레**) / `B19 "Market Valuation Metrics"`. 🔑 **원전이 세율·자본비용·인플레를 한 범주로 묶어놓았다.**
2. **결과 재현**: 881의 5단계 분해 — 원전 그대로 `WACC 5.354%·GAP 7`(재현 ✅) → 시점만 현재로 **+2.12%p** → 방법을 전부 우리 것으로 **−0.29%p**. 🔑 **시점이 방법의 7배다.** driver 3은 885가 **359사**에서 재확인(A 시나리오 GAP 중앙 10→10 불변, 판정 갈림 7사·2.0%), 인플레는 882가 확인(GAP 영향 2차적).

### 🔴 driver 6 각주 (필수)

> 🔴 **미측정 단서**: 위 `−0.29%p`는 **도미노 한 종목**에서만 잰 것이다. **업종 평균 근사(베타·신용스프레드)가 회사 고유값 대비 얼마나 편향되는지는 515사 전체 미측정**(881 · `SPEC §10` 해당 번호). driver 3이 359사 뒷받침을 가진 것과 달리 driver 6에는 그런 뒷받침이 없다. **이 편향이 측정되어 크게 나오면 이 행의 분류를 다시 연다.**

### 🔴 Cowork 판단 이력 (기록할 것)

Cowork이 안건 3에 **반대 의견을 냈다가 철회**했다. 반대 근거는 다모다란이 bottom-up 베타를 *"method"*로 다룬다는 점과, *"같은 개념의 다른 값이면 값 차이, 다른 개념이면 방법 차이"*라는 **Cowork이 만든 판별 기준**이었다.
🔴 **철회 사유**: 그 기준은 **원전에도 결과에도 걸려 있지 않았다.** 원전(1차)이 스스로 세 항목을 한 범주에 묶어놓았고 결과 실측도 같은 방향인데, **2차 권위(다모다란)의 용어법을 1차보다 앞세웠다.**

### 플레이북 신규 항목

> 🔑 **범주·정의는 원전 구조와 결과 재현으로 가른다. 2차 권위의 용어법으로 가르지 않는다.**
> **이력**: 887 — Cowork이 다모다란의 "method" 표현으로 재분류를 반대했다가, `T8 Inputs`의 범주 라벨과 881 분해(시점 +2.12%p vs 방법 −0.29%p)로 철회.

## §1 — 적용 (🔴 판정 내용은 한 글자도 안 고친다)

### 1-1. 대조표 정의 (`LENS_COMPLETION_STANDARD.md:142` — 886 이후 위치)

현재:
> **행 수 = 22** · 동일 8행 + **동일 식·값만 차이 1행**(터미널=인플레 값) + **차이 9행**(driver1·3·4·5·6·인플레·모집단·데이터출처·검증사례) + 우리 추가물 4행

**아래로 교체**(🔴 취소선 보존):

| 범주 | 행 수 | 구성 |
|---|---|---|
| 동일 | 8 | 계산식·예측지평·해탐색·25+대체산출물·driver2·비영업자산·부채·주식수 |
| **동일 식·값만 차이** | **3** | **driver3(세율)·driver6(자본비용)·인플레** |
| **차이** | **4** | **driver1(매출성장)·driver4(운전자본)·driver5(고정자본)·데이터출처** |
| **제품 전제**(신설) | **1** | **모집단** |
| 우리 추가물 | 4 | 분포·민감도·유니버스·유동성 |
| **합계** | **20** | |
| *(표 밖)* | — | **검증사례 → DoD 검증축으로 이관**(§1-3) |

🔴 **산술을 실제로 세어 20이 맞는지 확인한다. 안 맞으면 고치지 말고 보고한다.**
🔴 **882가 :146에 적은 "구조 결함(장은태 판정 대기)" 기록은 삭제하지 말고 "✅ 887 해소"로 표시**한다.

### 1-2. 🔴 "차이 9행"이라는 고유명사 처리 — **일괄 치환 금지**

`grep -rn "차이 9행"` = **47곳 / 8파일**(`LENS_COMPLETION_STANDARD`·`CHANGELOG`·`LENS_DEV_PLAYBOOK`·`STATE`·`PRIMARY_SOURCE_MAP`·`REVDCF_SPEC`·`DECISION_884`·`CLAUDE.md`).

🔴 **기계적으로 바꾸면 이력이 왜곡된다** — 870에 붙은 이름이고, 당시엔 실제로 9행이었다.

**처리 방식**:
- **정의 한 곳**(대조표 정의 옆)에만 이렇게 적는다:
  > **"차이 9행"은 870에서 붙인 고유명사다. 887 재분류 후 **현재 구성은 4행**(driver1·4·5·데이터출처)이다. 이름은 이력 보존을 위해 유지한다.
- **이력 문서**(`CHANGELOG`·`LENS_DEV_PLAYBOOK`·`STEP_*_COMMAND.md`)는 **손대지 않는다.**
- **현재 상태를 서술하는 자리**(`STATE`·`SPEC §10`·`PRIMARY_SOURCE_MAP`의 현행 서술)만 *"차이 9행(현재 4행)"*으로 보정한다.
- 🔴 **#80 절차**: 47곳 목록을 만들어 **각 항목에 `정정` / `이력이라 제외` 표시**를 붙이고 **보고에 그대로 싣는다.**

### 1-3. 진행표 행 이동 (`LENS_COMPLETION_STANDARD.md` 진행표)

- **driver3(2행)·driver6(5행)·인플레(6행)** → **"동일 식·값만 차이" 절**로 이동. 🔴 **각주 전체를 그대로 들고 간다**(판정·근거·대가·불리한사실·재검토조건 다섯 칸 한 글자도 안 고침). driver6 각주 끝에 §0의 **미측정 단서** 추가.
- **7행(모집단)** → **"제품 전제" 절 신설** 후 이동. 판정 칸 = `🅿️ 제품 전제(대안 없음)`. 883이 낸 근거(`lensCuts`·순위표시·크론 배치가 population>1 요구)를 그대로 가져간다.
- **8행(데이터출처)** → 차이 절에 잔류. 판정 칸 = `🅿️ 제약(1인 운영)`. **재검토 조건 = 팀 규모 확대 시**. 🔴 *"41,072개"는 근사치*라는 883의 단서를 함께 남긴다.
- **9행(검증사례)** → 진행표에서 빼고 **DoD 검증 항목**으로 옮긴다. 🔴 진행표 자리에 **포인터 한 줄**: *"검증사례 → DoD 검증축으로 이관(887). 위치: (실제 경로·절 번호)"*. 🔴 **DoD 쪽에 받을 자리가 실제로 있는지 먼저 확인하고, 없으면 만들되 그 사실을 보고한다.**

### 1-4. 연동 문서

- `lib/revdcf/registry.ts` — 886에서 한 줄 결론 + 포인터로 축약했다. 🔴 **범주가 바뀐 세 항목의 한 줄 결론만** 갱신. **`klass`(A/B/C)는 다른 축이니 건드리지 말 것.**
- `docs/REVDCF_SPEC.md` §10 — **#57·#58·#59 해소** 표시(재분류 완료). `§12`는 값 분류 축이라 무관 — 🔴 **확인만 하고 안 고친다.**
- `docs/PRIMARY_SOURCE_MAP.md` — 현행 서술의 범주 표기 보정
- `docs/DECISION_884_TABLE_STRUCTURE.md` — 상단에 **"✅ 2026-08-03 장은태 승인 · 887에서 적용 완료"** + 보완 2건 기록. 🔴 **본문은 그대로 둔다**(결정 이력).
- `docs/STATE.md` 🔴 **142줄 상한 유지** · `docs/CHANGELOG.md`

## §2 — 🔴 무손실 검증 (886과 같은 방식)

| 세는 것 | 기대 |
|---|---|
| 대조표 총 행 수 | 22 → **20** (인플레 중복 −1 · 검증사례 이관 −1) |
| 진행표 판정 칸 | 개수 불변(위치만 이동) · ✅/🅿️ 내역 전/후 대조 |
| `SPEC §10` 항목 수 | 불변(해소 표시만) |
| 🔴 마커 총수(`docs`+`CLAUDE.md`) | **불변** — 다르면 설명 |

🔴 **판정 문구는 diff에서 "이동"으로만 나타나야 한다. 내용 변경이 잡히면 되돌리고 보고한다.**

## §3 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- app/ components/ messages/ scripts/ data/   # 🔴 출력 없어야 함
git diff --stat HEAD -- lib/                                        # 🔴 registry.ts 만
git status --porcelain                                              # 🔴 ?? 0건
```

```bash
git add -A
git reset -- data/
git status --porcelain
git commit -m "STEP 887: apply the approved reclassification of the comparison table

- the source labels its own input sheet in three groups and puts the tax rate, the cost of
  capital and inflation in one of them; the decomposition shows the vintage of those values
  moves the result about seven times as much as our choice of method does
- so those three move into the value-only bucket, the population row becomes a product premise
  because no alternative to it exists in code, the sourcing row stays with a constraint marker
  instead of a verdict, and the validation row leaves the table for the completion criteria
- the total is twenty, not twenty-two; the old count double-counted inflation
- the name coined for this group is left alone in the history and redefined once in the table,
  because renaming it everywhere would misreport what was true at the time
- verdict text is moved, never edited; counts before and after must match or be explained"
git push && git push origin main:revdcf-preview
```

## §4 — 보고 후 멈춘다

```
§0 승인 기록 · driver6 미측정 각주 · Cowork 판단 철회 이력 · 플레이북 신규
§1 대조표 20행 재검산 결과 · "차이 9행" 47곳 목록(정정/이력제외 표시) · 진행표 이동 내역
   9행 DoD 이관 위치(받을 자리 유무) · registry 한 줄 결론 갱신
§2 🔴 무손실 검증표(전/후 4종) · 판정 문구가 "이동"으로만 나타나는지 diff 확인
§3 COMMIT_GATES 6개 게이트 통과 여부
무변경: app/components/messages/scripts/data diff 없음 · lib은 registry.ts만 · 판정 내용 불변
       REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **산술이 20이 아니거나 판정 문구에 내용 변경이 잡히면 되돌리고 보고할 것. 다음 행을 제안하지 말 것.**
