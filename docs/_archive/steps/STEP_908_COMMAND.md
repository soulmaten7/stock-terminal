# STEP 908 — `#36` 처리(`lib/` 허용) · 🔴 결정 대기 전수를 한 장으로

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_908_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `4aef37c`(STEP 907 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 907이 잡은 명령서 결함 · 플레이북

907 보고:
> *"`#36`은 저비용(문자열 2개)이나 **`lib/` 파일이라 907 자신의 diff-empty 게이트에 걸려 실행 불가** — *'저비용 ≠ 이 STEP에서 가능'*으로 구분해 기록."*

🔴 **명령서 결함이다.** §2가 `#36` 처리를 지시하면서 §3 검증이 `lib/` diff 0을 요구했다 — **한 문서 안에서 지시와 게이트가 충돌**해 실행 측이 둘 중 하나를 어길 수밖에 없었다. **894와 같은 유형**(판단을 여는 절과 결과를 단정한 커밋 메시지).

### 플레이북 신규

> 🔑 **작업을 지시하기 전에 그 작업이 이 STEP의 검증 게이트를 통과할 수 있는지 확인한다.** 지시 절이 건드리라는 경로를 검증 절이 `diff 0`으로 막고 있으면 **모순**이다. 🔴 **금지선·게이트는 지시 목록을 다 쓴 뒤 마지막에 맞춰 쓴다.**
> **이력**: 894(판단 열림 vs 커밋 단정) · 907(`lib/` 지시 vs `lib/` diff 0 게이트).

## §1 — `#36` 처리 (🔴 `lib/revdcf/registry.ts`만 허용)

907 확인: `lib/revdcf/registry.ts:259·273`이 여전히 **`"재개방"`**인데 **867의 실제 결정과 불일치**한다.

- 🔴 **`AUDIT_904_OPEN_ITEMS.md`와 867 기록을 먼저 열어** 실제 결정이 무엇인지 확인한다. **기억으로 고치지 말 것.**
- **문자열만** 고친다. 🔴 **필드 추가·삭제 금지 · 로직 무변경.**
- 🔴 **`registry.ts`는 런타임 import 0건**(878 확인)이나 **`npx tsc --noEmit && npm run test`는 반드시 돌린다.**
- 🔴 **같은 파일의 다른 stale 표현도 함께 볼 것** — 875가 지적한 **driver 4 "가설" 표현**이 STATE §9에 아직 남아 있다. 🔴 **878이 고쳤는지 확인**하고, 안 고쳐졌으면 **함께 처리**한다. 이미 고쳐졌으면 **STATE §9에서 그 항목을 지운다.**

🔴 **`lib/` 중 `registry.ts` 외 파일은 건드리지 말 것.**

## §2 — 🔴 결정 대기 전수를 한 장으로 (`docs/DECISION_908_PENDING.md` 신설)

**장은태 결정 대기가 네 곳에 흩어져 있다.** 884·890·902에서 한 것과 같은 정리다.

🔴 **각 문서에서 읽어 옮긴다. 새로 판단하지 말 것.** 🔴 **권고안은 이미 각 판정서에 있다 — 다시 쓰지 말고 인용한다.**

| # | 안건 | 정본 | 상태 |
|---|---|---|---|
| 1 | **`#46` 운전자본 정의**(유동부채 전액 vs 무이자만) | `DECISION_907_WC_DEF.md` | 권고 = 하이브리드/플래그 |
| 2 | **`#17`·`#37`·`#43`** 결정형 3건 | `DECISION_905_NEXT.md` · `AUDIT_904` | 🔴 **Claude Code가 할 일 없음** — 905가 확인 |
| 3 | **`#67`** retryBudgetHit 로그 | `SPEC §10` | 🔴 **Vercel 대시보드 = 장은태 권한** · CLI는 *"5분 이내"* 제약 |
| 4 | **"모델 완성"의 정의** | `STATE.md`(903 §3 기록) | 7개 닫힘 vs 9개 전부 |

**각 안건에 적을 것**:
- **한 줄 질문**(무엇을 정하는가)
- **정본 위치**(권고안·근거는 거기 있다는 포인터)
- 🔴 **이 결정이 막고 있는 것** — 🔑 예: `#46`이 안 정해지면 **905 권고 ④단계(화면 `#29`·`#40`·`#41`)를 시작하면 재작업 위험**이다.
- 🔴 **결정을 미룰 때의 비용**
- 🔴 **서로 의존하는가** — 예: 4번이 정해지면 보류(DoD 7·9)가 풀리는가.

🔴 **판정하지 말 것. 순서를 정하지 말 것.** 🔴 **"이것부터 정하시라"고 쓰지 말고, 의존 관계만 사실로 적는다.**

## §3 — 현재 진행 가능한 작업이 없다는 사실 기록

🔴 **`#36`을 처리하고 나면 Claude Code가 지시 없이 할 수 있는 항목이 남지 않는다.**

- 905 권고 **③단계(`#17`·`#37`·`#43`)는 전부 결정형** — 905가 *"닫는 방법 = 장은태가 ~ 여부 결정"*으로 확인했다.
- 905 권고 **④단계(화면)는 `#46` 결정 전에 하면 재작업 위험** — 905 권고 근거가 그것이었다.
- 나머지는 **보류·원리적 불가·인프라 확충 후**다.

🔴 **`STATE.md`에 이 사실을 적는다.** 🔑 **"할 일이 없다"는 것도 상태다** — 다음 세션이 없는 일을 만들어내지 않게.
🔴 **142줄 상한 유지.**

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/                       # 🔴 registry.ts 만
git diff --stat HEAD -- app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                             # 🔴 ?? 0건
```

🔴 **`lib/` diff에 `registry.ts` 외 파일이 나오면 중단하고 보고한다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 908: fix the one line of code left, and collect every pending decision onto one page

- a ledger field still said an item was reopened when the decision had gone the other way; it is
  a string in a file nothing imports at runtime, and the previous step could not touch it because
  its own verification gate forbade the path its instructions named
- four decisions are waiting in four different documents, so they are listed together with what
  each one is blocking and whether any depends on another; the recommendations stay where they
  were written rather than being restated
- after this there is nothing left that can be done without a decision, and that is recorded as a
  state rather than left for the next session to discover"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§0 플레이북 신규(지시 vs 게이트 충돌)
§1 #36 — 867 실제 결정 확인 결과 · 고친 문자열 · 🔴 driver4 "가설" 표현 처리(이미 고쳐졌으면 STATE §9 정리)
   🔴 registry.ts 외 lib/ 파일 diff 0 확인
§2 DECISION_908 신설 — 안건 4건 · 각 안건이 막고 있는 것 · 의존 관계
   🔴 판정·순서 안 정했는지
§3 STATE에 "지시 없이 진행 가능한 항목 없음" 기록
무변경: app/components/messages/data/.github diff 0 · lib은 registry.ts만
       DoD 판정 칸 전부 불변 · 보류 목록 불변 · REVDCF_ENABLED Production OFF
       크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **판정하지 말 것. 순서를 정하지 말 것. 화면(#29·#40·#41)에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
