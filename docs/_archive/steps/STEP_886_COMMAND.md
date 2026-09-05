# STEP 886 — 원장 정리: 정본 배정 · 게이트 추출 · 아카이브 분리 (🔴 사실 삭제 0)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_886_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `03559b6`(STEP 885 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **`docs/DECISION_884_TABLE_STRUCTURE.md`는 887에서 적용한다. 이 STEP에서 적용하지 말 것.**

---

## §0 — 왜 이 STEP이 필요한가 · 성격

오늘 사고 여러 건의 원인이 **같은 사실의 사본이 여러 곳에 있는 것**이었다:

- *"GAP 8→23년"*이 **5곳**(884에서 grep으로 **7곳**으로 늘어남) → 881이 한 곳만 고쳐 문서 내부가 모순
- `REVDCF_SPEC` 이중계산 서술이 **3곳** → 877이 2곳만 고쳐 878이 나머지를 정정
- `registry.ts`와 진행표가 **같은 4행에 다른 상태** → 878이 두 축으로 분리
- 인플레가 대조표 **두 칸에 이중 등재** → 882 발견, 884 검산에서 "22는 부풀려진 수"로 확정

현재 규모: `CLAUDE.md` 552 · `REVDCF_SPEC` 1,586 · `LENS_COMPLETION_STANDARD` 1,061 · `LENS_DEV_PLAYBOOK` 143(**87항목**) · `STATE` 201(🔴 1~2p 상한 초과) = **3,543줄**.

🔴 **887이 손대야 할 곳이 진행표·`:607`·`registry.ts`·`SPEC` 네 곳인데 지금 그 넷이 서로 사본이다. 정본을 먼저 정해야 887이 한 곳만 고치면 된다.**

### 🔴 이 STEP의 성격 — 절대 규칙

1. 🔴 **사실을 하나도 삭제하지 않는다.** 이동·포인터화·아카이브만 한다.
2. 🔴 **판정·근거·대가·불리한사실·재검토조건의 내용을 고치지 않는다.** 한 글자도.
3. 🔴 **코드 diff 0** — `lib/`·`app/`·`components/`·`messages/`·`scripts/`·`data/` 전부. **단 `lib/revdcf/registry.ts`의 주석·문자열만 예외**(§1-2).
4. 🔴 **새 판정·새 측정 없음.**

## §1 — 정본 배정 (Single Source of Truth)

### 1-1. 배정표

| 사실의 종류 | 🔑 **정본** | 다른 곳은 |
|---|---|---|
| 차이 9행 **판정·근거·대가·불리한사실·재검토조건** | `docs/LENS_COMPLETION_STANDARD.md` 진행표 + 각주 | **포인터만** |
| **미결·미측정** | `docs/REVDCF_SPEC.md` **§10** (#번호 부여됨) | **`§10 #NN` 번호로 참조** |
| **실측 숫자**(출처·날짜 포함) | `docs/REVDCF_SPEC.md` **§11** | **참조** |
| **값 분류(A/B/C)** | `docs/REVDCF_SPEC.md` **§12** | 참조 |
| **원전 셀 판독** | `docs/PRIMARY_SOURCE_MAP.md` | 참조 |
| **이력** | `docs/CHANGELOG.md` | 🔴 `STEP_*_COMMAND.md`는 **당시 명령서**이므로 불변·정리 대상 아님 |
| **현재 상태·다음 할 일** | `docs/STATE.md` | — |

### 1-2. 포인터 형식 (통일)

사본이 있던 자리에 **내용을 지우지 말고** 요약 한 줄 + 포인터로 바꾼다:

```
🔑 정본: `docs/REVDCF_SPEC.md` §10 #50 — (한 줄 요약)
```

🔴 **요약 한 줄은 원문에서 그대로 뽑는다.** 새로 쓰지 말 것.

**`lib/revdcf/registry.ts`**: `divergence` 문자열이 지금 판정·근거·대가를 다 담아 진행표와 중복이다.
- **남길 것**: 원전 좌표(`primary`) · 우리 방식(`ours`) · 분류(`klass`) · **한 줄 결론**
- **포인터로 뺄 것**: 근거 나열·실측 숫자·대가·재검토조건 → *"근거·대가·재검토조건: `LENS_COMPLETION_STANDARD.md` 진행표 N행"*
- 🔴 **`registry.ts`는 런타임 import 0건**(878 확인)이지만 **tsc·test는 반드시 돌린다.**
- 🔴 **필드를 추가·삭제하지 말 것.** 문자열 내용만 줄인다.

### 1-3. 🔴 중복 전수 조사 먼저 (플레이북 #80 절차)

배정하기 전에 **어떤 사실이 몇 곳에 있는지 목록을 만든다.** 최소 아래는 확인할 것:

- 차이 9행 각 행의 판정 문구 — 진행표 / `registry.ts` / `SPEC §12` / `PRIMARY_SOURCE_MAP`
- `§10` 미결 항목 — SPEC §10 / STATE / 진행표 각주
- 도미노 앵커 숫자(GAP 7·8·11.617% 등) — 전 문서

🔴 **목록을 보고에 그대로 싣는다. 목록 없이 옮기지 말 것.**

## §2 — 완결 기록 아카이브 분리

`docs/LENS_COMPLETION_STANDARD.md` **97~575행(약 480줄)**이 **7렌즈 완결 기록**이다. 812~827에서 닫혔고 이후 변하지 않는다 — 파일의 45%가 종료된 이력이다.

- `docs/_archive/LENS_7_COMPLETED.md`로 **내용 그대로**(한 글자도 안 고침) 옮긴다.
- 원래 자리에 **포인터 절** 한 개를 남긴다 — 7렌즈 각각의 STEP 번호·완료일·상태(✅)만 한 줄씩 + 아카이브 경로.
- 🔴 **완성 현황표(28~62행)는 옮기지 않는다** — 현재 상태이지 이력이 아니다.
- 🔴 **3중 검증 규칙(7~15행)·DoD 9항목(16~27행)·§10 깊이 표준(63~96행)도 옮기지 않는다** — 현행 규칙이다.

## §3 — 🔴 커밋 게이트 추출 (`docs/COMMIT_GATES.md` 신설)

플레이북 **87항목**을 다 기억할 수 없다. **오늘 데이터가 답을 준다**:

| 형태 | 사례 | 결과 |
|---|---|---|
| **교훈형** | #76(셀을 봐라) · #77(줄번호 말고 내용) · #81 · #82 | 🔴 **재발함** — #76 만든 뒤 #82에서 같은 유형, #77 만든 뒤 881에서 재발 |
| **게이트형** | #78(스크립트 동반 커밋·untracked 0) · #80(grep→목록→표시→보고) | ✅ **즉시 작동** — #80은 넣자마자 놓친 2곳을 더 잡음 |

🔑 **교훈은 안 듣고 절차는 듣는다.**

### 할 것

`docs/COMMIT_GATES.md`를 만들고, **87항목 중 절차로 환원 가능한 것만** 뽑아 **커밋 전 체크리스트**로 쓴다. 각 게이트에 **출처 플레이북 번호**를 단다.

최소 포함(더 있으면 추가):

1. **원본 게이트**(#76·#82) — 원전·문서를 근거로 말하기 전, **그 자리를 열어서** 내용을 봤는가. `grep -l` 매칭이나 기억으로 단언하지 않았는가.
2. **정정 게이트**(#77·#80) — 수치·주장을 고칠 때 **grep으로 출현 목록**을 만들고 **각 항목에 ✅/제외사유**를 붙였는가. 목록을 보고에 실었는가.
3. **재현 게이트**(#78) — 산출물을 커밋하면 **그것을 만든 스크립트도 같은 커밋**에 있는가. 출처 표기가 **실재하는 경로**를 가리키는가(`/tmp` 금지).
4. **근거 게이트**(#81) — 모든 근거가 **실측 또는 직인용**에 걸려 있는가. 안 잰 것을 근거로 쓰지 않았는가.
5. **완결 게이트**(#79) — 재료가 갖춰진 행을 "대기"로 남기지 않았는가. 선택지 목록이 아니라 **판정 하나**를 냈는가.
6. **커밋 게이트**(#78) — `git add -A` 후 제외만 명시했는가. `git status --porcelain`의 `??`가 0인가.

🔴 **`LENS_DEV_PLAYBOOK.md`의 87항목을 삭제하지 말 것.** 게이트는 **추출**이지 대체가 아니다. 플레이북 상단에 *"실행 체크리스트는 `docs/COMMIT_GATES.md`"* 포인터만 단다.
🔴 **`CLAUDE.md`에도 한 줄** — 커밋 전 `COMMIT_GATES.md`를 돌린다. 🔴 **그 외 `CLAUDE.md` 수정 금지.**

## §4 — `STATE.md` 상한 복귀

현재 **201줄**로 1~2p 상한을 넘는다.

- 미측정·미결은 **`SPEC §10 #NN` 번호 참조**로 대체한다(내용 중복 제거). 🔴 **항목이 사라지면 안 된다 — 번호가 전부 남아 있어야 한다.**
- 완료된 STEP 서술은 **CHANGELOG로 이동**(정본 배정대로).
- 🔴 **"못 한 것 / 미측정 / 장은태 대기" 목록은 반드시 남긴다** — 상한의 목적이 이걸 지우는 게 아니다.
- 🔴 옮긴 것은 **무엇을 어디로 옮겼는지 보고에 적는다.**

## §5 — 🔴 무손실 검증 (이 STEP의 핵심 안전장치)

정리 **전·후**로 개수를 세어 대조한다. 🔴 **`docs/_archive/` 포함 합계로 센다.**

| 세는 것 | 방법 |
|---|---|
| 미결·미측정 항목 | `SPEC §10`의 `#번호` 최대값과 개수 |
| 차이 9행 판정 | 진행표에서 ✅/🅿️/🔴 개수 |
| 실측 숫자 행 | `SPEC §11` 행 수 |
| 플레이북 항목 | `LENS_DEV_PLAYBOOK` 번호 개수 |
| 🔴 전체 `🔴` 마커 | `grep -c "🔴" docs/ -r` 합계 |

🔴 **전후가 다르면 어디서 달라졌는지 설명한다. 설명 못 하면 그 변경을 되돌린다.**
🔴 **줄 수는 줄어도 된다(중복 제거). 사실 개수는 줄면 안 된다.**

## §6 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- app/ components/ messages/ scripts/ data/   # 🔴 출력 없어야 함
git diff --stat HEAD -- lib/                                        # 🔴 registry.ts 만
git status --porcelain                                              # 🔴 ?? 0건
wc -l CLAUDE.md docs/*.md docs/_archive/*.md                        # 🔴 전후 비교용
```

```bash
git add -A
git reset -- data/
git status --porcelain
git commit -m "STEP 886: give every fact one home before the next step edits four copies of it

- several of today's mistakes came from the same fact living in four documents, where a
  correction landed in one copy and left the others contradicting it
- each kind of fact now has one authoritative place and the other locations carry a one-line
  summary and a pointer, with the summary lifted verbatim rather than rewritten
- the seven completed lens records are moved to an archive unchanged; they are closed history
  and were nearly half of a file that is read every session
- the playbook keeps all its entries, but the ones that reduce to a procedure are extracted
  into a commit checklist, because today only the procedural ones actually prevented a repeat
- nothing is deleted: counts of open items, verdicts, measurements and markers are compared
  before and after, and any difference has to be explained or reverted"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 🔴 중복 전수 목록(사실 → 몇 곳) · 정본 배정 결과 · registry.ts 축약 내용
§2 아카이브 분리(옮긴 줄 범위 · 남긴 포인터)
§3 COMMIT_GATES.md 게이트 목록(각 게이트의 출처 #번호) · 플레이북·CLAUDE.md 포인터
§4 STATE 201 → N줄 · 🔴 무엇을 어디로 옮겼는지
§5 🔴 무손실 검증표(전/후 개수 5종) · 차이가 있으면 설명
   파일별 줄 수 전/후
무변경: app/components/messages/scripts/data diff 없음 · lib은 registry.ts만 · 판정 내용 불변
       DECISION_884 미적용 · REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **무손실 검증에서 설명 못 하는 차이가 나오면 되돌리고 보고할 것. DECISION_884를 적용하지 말 것.**
