# STEP 884 — 출처 표기 정정 · 차이 9행 전수 마감 감사 · 🔴 장은태 판정서 1장

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_884_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `ee3b9d5`(STEP 883 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

🔴 **이 STEP은 새 판정을 내리지 않는다.** 이미 내린 판정들의 **재현 경로와 근거 건전성**을 감사하고, 남은 셋을 **장은태가 한 번에 결정할 수 있는 한 장**으로 만든다.

---

## §0 — Cowork 사전 확인 (이미 마친 것 · 다시 하지 말 것)

Cowork이 883 산출물을 직접 확인했다:

- 🔴 **"GAP 8" 정합성 = 문제 없음.** `REVDCF_SPEC.md:1047`이 *"이 열은 T8 기준이라 라벨 그대로 정확"*이라 구분해 적었고, 883의 i=rf 대조도 **T8 드라이버 그대로** 놓고 i만 바꾼 것이라 `8→12`는 내부 정합적이다. **882의 정정과 충돌하지 않는다.** → 🔴 **이 항목은 손대지 말 것.**
- ✅ `scripts/probe_883_i_eq_rf.ts`(8,656B)·`docs/probe_883_i_eq_rf.json` 모두 커밋돼 있고, 스크립트 안에 도미노·rf 재료가 들어 있다.

## §1 — 🔴 출처 표기가 존재하지 않는 파일을 가리킨다

`docs/REVDCF_SPEC.md:1583`:

> *"883 격리 실험(`/tmp/diag883.ts`, **일회성·미커밋**)"*

🔴 **이 줄이 근거로 다는 출처는 `/tmp`의 사라진 파일이다.** 그런데 이 실험이 낸 **`GAP 8→12`가 지금 인플레 판정의 유일한 지탱 근거**다(883이 "자동화 부적합"을 철회하고 그 자리에 넣었다).

→ **판정을 떠받치는 숫자의 출처가 재현 불가능한 경로로 적혀 있다.** 플레이북 #78이 막으려던 바로 그 상태다.

### 할 것

1. `scripts/probe_883_i_eq_rf.ts`를 **실행해** 도미노 `i=1.6% → 0.65%`에서 **GAP `8 → 12`가 실제로 재현되는지** 확인한다.
   - ✅ 재현되면 → `SPEC:1583`의 출처를 **`scripts/probe_883_i_eq_rf.ts`로 교체**한다(취소선 보존).
   - 🔴 재현되지 않으면 → **정정하지 말고 중단하고 보고한다.** 판정 근거가 재현되지 않는다는 뜻이므로 장은태 확인이 먼저다.
2. 🔴 **같은 유형이 더 있는지 전수 grep**(플레이북 #80 절차 그대로): `docs/` 전체에서 `/tmp/`를 출처로 단 자리를 찾아 **목록으로 만들고 각 항목에 처리 표시**한다.
3. 플레이북 **#78에 한 줄 추가**:
   > 🔑 **출처 표기는 실제 재현 경로를 가리켜야 한다.** 커밋된 스크립트가 같은 실험을 담고 있으면 그것을 적는다. `/tmp` 경로를 근거 출처로 적지 않는다 — 다음 세션에는 존재하지 않는다.

## §2 — 🔴 차이 9행 전수 마감 감사 (판정하지 않는다 · 점검만)

871~883에서 아홉 행을 전부 돌았다. **각 행이 실제로 닫혔는지 전수 점검한다.**

행마다 **다섯 칸**이 채워져 있는지 확인한다:

| 칸 | 확인 기준 |
|---|---|
| ③판정 | 하나로 확정됐는가(선택지 나열 아님) |
| 근거 | 각 근거가 **실측 또는 직인용**에 걸려 있는가 — 🔴 **플레이북 #81 적용** |
| 대가 | 이 판정이 잃는 것이 적혀 있는가 |
| 불리한 사실 | 판정에 반하는 관찰이 적혀 있는가 |
| 재검토 조건 | 무엇이 확보되면 다시 여는가 |

🔴 **결과를 표 하나로 낸다**(9행 × 5칸 = 45칸, 각 칸 ✅ / 🔴빔 / 🔶부분).

🔴 **빈 칸이나 실측에 안 걸린 근거를 발견하면 — 채우지 말고 목록으로만 낸다.** 근거를 새로 만드는 것은 이 STEP의 일이 아니다. 🔴 **판정을 바꾸지도 말 것.**

**이미 알려진 것(감사에서 확인만)**:
- 883 못 한 것 — *"i=rf가 다른 결과를 낸다는 것만 확인했지, 그 결과가 더 정확한지는 재지 않았다"*
- 881 못 한 것 — 업종 평균 근사(베타·신용스프레드)의 편향 **515사 미측정**(도미노 1건 스팟체크만)
- 883 8행 — *"41,072개 값"은 근사치*

## §3 — 🔴 장은태 판정서 (`docs/DECISION_884_TABLE_STRUCTURE.md` 신설)

**세 건이 "장은태 판정 대기"로 흩어져 있다. 한 장으로 모은다.**

| # | 안건 | 지금까지 나온 사실 |
|---|---|---|
| 1 | **7 모집단 · 8 데이터출처의 성격** | 883 실측: n=1이면 `lensCuts.ts` 컷 정의 불가·`/api/revdcf` 순위 표시 불가·크론 배치가 전부 `population>1` 전제. 8행은 604사×약 68항목 ≈ **41,072개 값**을 매일 수기 입력해야 함 → **되돌림 불가** |
| 2 | **9 검증사례의 성격** | 883: 원전 1건 < 우리 4건 → **"되돌림" 정의 자체가 성립 안 함** |
| 3 | **대조표 구조** | 882: `:607`에서 **인플레가 두 칸에 이중 등재**. 877(driver 3)·881(driver 6)이 **"구조는 같고 값만 다르다"**로 판명 |

### 🔴 작성 규칙

- **권고안을 하나씩 낸다.** 🔴 선택지 나열 금지(플레이북 #79).
- 권고안마다 **근거 · 대가 · 불리한 사실**을 붙인다.
- 🔴 **재분류를 적용했을 때의 22행 산술을 실제로 다시 계산해 시안으로 제시한다** — 동일 N행 + 동일식값차이 N행 + 차이 N행 + 우리추가물 N행 = **22가 맞는지 검산**. 안 맞으면 안 맞는다고 적는다.
- 🔴 **적용하지 말 것.** 진행표·`:607`·registry는 **그대로 둔다.** 이 문서는 결정을 받기 위한 것이다.
- 🔴 각 안건에 **"결정을 미룰 때의 비용"**을 한 줄씩 적는다(예: *"이 상태로 두면 차이 9행이라는 이름이 실제 내용과 어긋난 채 다음 단계로 넘어간다"*).

## §4 — 문서 · 검증 · 커밋

- `docs/REVDCF_SPEC.md:1583` 출처 정정(§1) · §10 미결 갱신
- `docs/LENS_DEV_PLAYBOOK.md` #78 한 줄 추가(§1-3)
- `docs/DECISION_884_TABLE_STRUCTURE.md` **신설**(§3)
- `docs/LENS_COMPLETION_STANDARD.md` — §2 감사표를 진행표 아래에 **감사 결과 절**로 추가. 🔴 진행표 자체의 판정 칸은 **건드리지 않는다.**
- `docs/STATE.md` 🔴 1~2p(미측정 보존) · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- data/ app/ components/ messages/ lib/   # 🔴 출력 없어야 함
grep -rn "/tmp/" docs/ | grep -v STEP_                          # 🔴 처리 안 된 잔존 0건
git status --porcelain                                          # 🔴 ?? 0건
```

```bash
git add -A docs/
git status --porcelain
git commit -m "STEP 884: point the provenance at a file that still exists, audit all nine rows, put the three open questions on one page

- the number now carrying the inflation verdict was cited to a scratch file that no longer
  exists, while the committed probe covers the same experiment; the citation is repaired after
  re-running it, and the playbook gains the rule that provenance must name a reproducible path
- every closed row is audited on five fields, including whether each ground actually rests on a
  measurement or a direct quotation; gaps are listed, not filled
- the three questions left to the owner are collected into a single decision page with a
  recommendation, its cost, the observation against it, and the arithmetic redone
- nothing is applied and no verdict changes; documents only"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 probe_883 재실행 결과(GAP 8→12 재현 여부) · SPEC:1583 출처 정정 · /tmp 출처 전수 목록 · #78 추가
§2 🔴 9행 × 5칸 감사표 · 빈 칸/실측 미연결 근거 목록 (🔴 채우지 않음·판정 안 바꿈)
§3 DECISION_884 신설 — 안건 3건 각각 권고안·근거·대가·불리한 사실·미룰 때의 비용 · 22행 산술 검산 결과
무변경: data/app/components/messages/lib diff 없음 · 진행표 판정 칸 불변 · REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건 · /tmp 출처 잔존 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **§1에서 재현 실패하면 정정하지 말고 중단·보고. 판정을 바꾸거나 재분류를 적용하지 말 것.**
