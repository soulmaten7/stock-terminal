# STEP 922 — 🟢 **안건 4 승인 적용(장은태 2026-08-06)** · DoD7의 마지막 판단(`boardBadge.years`) 재료 + 권고

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_922_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `9c09f58`(STEP 921 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

## 🟢 승인 기록

> **장은태 승인 2026-08-06**: *"921 권고대로"* — **"모델 완성" = DoD9 제외 8항목 닫힘**(1·2·4·5·6·8 ✅ + 3 🅿️ + 7 ✅화). **DoD9은 별도 "노출" 트랙으로 분리.**

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED`를 켜지 말 것** · DB **쓰기 금지** · **크론 수동 실행 금지** · `lib/**` 수정 금지(산식·917 계측 불변) · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **DoD9에 손대지 말 것**(노출 트랙은 이 STEP 범위 밖) · **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측).
🔴 **이 STEP은 판단 재료와 권고까지만 한다. 구현은 승인 후다** — 🔑 **그래서 `lib/` diff 0이 게이트로 성립한다**(907 교훈: 지시와 게이트가 충돌하면 안 된다).
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §1 — 승인 적용 (문서)

- `docs/LENS_COMPLETION_STANDARD.md` — 🔴 **DoD 절 머리에 승인된 정의를 기록**한다(승인자·일자). 🔑 *"9항목 전부 통과"* 문구가 이제 부정확하므로 🔴 **취소선 보존으로 정정**하고 새 정의를 병기한다. 🔴 **개별 항목의 ③판정 칸은 바꾸지 말 것** — DoD7은 §2 판단 후다.
- `docs/DECISION_921_COMPLETION.md` — 머리에 **승인 기록**. 🔴 **본문 권고는 고치지 말 것**(907 전례).
- `docs/DECISION_908_PENDING.md` — **안건 4 해소** 표시. 🔴 **안건 3은 그대로 대기.** 🔑 **이로써 대기 안건은 3번 하나만 남는다** — 그 사실을 적는다.
- `docs/STATE.md` — 🔴 **보류 목록의 *"항목 7·9(노출)"* 프레이밍을 921 §2 정정에 맞게 고친다**: DoD7은 노출과 무관(판단 1건), 노출 요구는 DoD9뿐. 🔴 **142줄 상한.**

## §2 — 🔴 DoD7의 마지막 판단: `boardBadge.years`

921 실측: *"DoD7 🔶의 진짜 이유는 노출이 아니라 `boardBadge.years` 판단 미결 하나뿐 — 플래그 무관하게 지금 닫을 수 있음."*

🔑 **이 하나를 판단하면 DoD7이 ✅가 되고, 그러면 승인된 정의상 완성까지 남는 것은 필요조건 3건뿐이다.**

### §2-1 먼저 열어라 (🔴 단정 금지)

🔴 **Cowork은 `boardBadge.years`가 무엇을 묻는지 모른다.**

1. `docs/LENS_COMPLETION_STANDARD.md` DoD7 항목과 그 각주를 열어 **판단해야 할 것이 정확히 무엇인지 그대로 인용**한다.
2. **`boardBadge.years`를 코드에서 찾아** 실제로 무엇을 표시하는 값인지, 어디에 쓰이는지 확인한다. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 열어서 본다.
3. 🔴 **DoD7이 요구하는 *"카드·목록·변화피드·이메일·브리핑에서 같은 이름·판정·단위"*(921 인용)와 이 판단이 어떻게 연결되는지** 적는다.
4. 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).
5. 🔴 **이미 판단이 내려져 있는데 표시가 안 된 것인지 먼저 확인한다** — 🔑 **`#26`·`#33`·`#29`·`#40`·`#41`이 전부 그랬다. 921에서도 세 건이 그렇게 나왔다.**

### §2-2 원전 대조

🔴 **원전이 이 논점을 다루는지 확인한다.** 🔑 **이 프로젝트의 제1 기준은 원전이다** — 2차 권위가 앞설 수 없다.
🔴 **어느 시트 어느 셀인지 적고**, 다루지 않으면 **"원전에 없음"**으로 적는다. 🔑 **그러면 원전 준수 문제가 아니라 우리 제품 결정이고 판단 근거가 달라진다.**
🔴 **산문이 아니라 셀을 본다**(877 교훈) · 🔴 **시트가 무엇의 튜토리얼인지 확인하고 인용한다**(906 교훈).

### §2-3 실측

🔴 **읽기만 · DB 쓰기 0.** 🔑 **910·918이 판정할 수 있었던 이유는 실측이 있었기 때문이다.**

1. 🔴 **선택지마다 무엇이 달라지는가** — 표시가 바뀌는 종목 수 · 판정 이동(있으면).
2. 🔴 **일관성 위반이 실제로 있는가** — DoD7이 *"같은 이름·판정·단위"*를 요구하므로, **다섯 표면(카드·목록·변화피드·이메일·브리핑)에서 지금 무엇이 어떻게 다른지** 코드로 확인해 표로 적는다.
3. 🔴 **0이면 0이라고 적는다.** 🔑 **차이가 없으면 판단할 것도 없고 DoD7은 그냥 ✅다.**
4. 프로브가 필요하면 `scripts/probe_922_*.ts` + 산출 JSON — 🔴 **같은 커밋에**(#78) · 🔴 **sanity check 넣을 것**(#87).

### §2-4 권고

🔴 **910·918 형식**: 권고 한 줄 + **근거**(🔴 전부 §2-2 원전 또는 §2-3 실측에 걸려야 한다) + 🔴 **대가** + 🔴 **불리한 사실** + 🔴 **재검토 조건**.
🔴 **구현하지 말 것 — 권고까지.** 🔴 **③판정 칸을 바꾸지 말 것.** 🔴 **승인은 장은태 것임을 명시**한다.

## §3 — 🔴 필요조건 3건 파악만 (`#70`·`#71`·`#74`)

921: *"진짜 미해소 10건, 완성 필요조건은 3건뿐(70·71·74)."*

🔴 **파악만 한다. 착수하지 말 것.** 🔑 **`CLAUDE.md`: "하나를 하나씩 완벽하게."** 🔴 **이 STEP의 작업 대상은 §2 하나다.**

**각 건에 대해**:
1. 🔴 **실제 문구를 그대로 인용**한다.
2. 🔴 **무엇을 하면 닫히는가** — 한 줄로.
3. 🔴 **결정형인가 작업형인가** — 🔑 **결정형이면 장은태 승인이 선행이고, 작업형이면 바로 할 수 있다.**
4. 🔴 **서로 의존하는가** · 🔴 **예상 비용**(대략으로. 🔴 **모르면 "모름"**).
5. 🔴 **`#71`(Preview 500)은 921이 원인 미규명으로 남겼다** — 그 상태 그대로 적는다. 🔴 **추정으로 원인을 쓰지 말 것.**
6. 🔴 **순서를 정하지 말 것** — 🔑 **의존 관계만 사실로 적는다**(908 §2가 한 방식).

## §4 — 문서 · 검증 · 커밋

- `docs/DECISION_922_BADGE.md` 신설 — §2 전체.
- `docs/REVDCF_SPEC.md` §10 — `#70`·`#71`·`#74` 상태 명확화 · §11에 §2-3 실측
- `docs/CHANGELOG.md` · `docs/STATE.md`(🔴 142줄 상한 · 🔴 **"▶ 다음"에 22:45 UTC 크론 관측 대기 유지**)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **`lib/`나 `components/`에 diff가 나오면 구현한 것이다 — 되돌리고 보고한다.** 🔑 **이 STEP은 권고까지다.**
🔴 **커밋 메시지는 §2의 실제 권고에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 922: record the approved meaning of finished, and work out the one judgement still holding item seven open

- the standard said all nine must pass and one was closed at a ceiling instead, so the approved
  reading drops the ninth into its own track and the old wording is struck through rather than
  deleted
- item seven turned out not to be waiting on visibility at all but on a single unresolved call
  about one badge, so what that call is gets read from the standard and from the code rather than
  recalled, including whether it was in fact already made and merely never marked
- the requirement it serves is that a name, a verdict and a unit read the same across five
  surfaces, so those five are compared and the differences written down; if there are none then
  there is nothing to decide
- the three items that the approved definition still requires are listed with what would close
  each, and left alone: one thing at a time, and this step's thing is the badge"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 승인 정의 기록(🔴 "9항목 전부" 취소선 보존 정정) · 안건 4 해소
   🔴 대기 안건이 3번 하나만 남았다는 사실 · 🔴 STATE 보류 프레이밍 정정
   🔴 DoD 개별 ③판정 칸 불변
§2-1 boardBadge.years가 무엇인지 원문·코드로 · 🔴 이미 판단됐는데 미표시인지 확인 결과
§2-2 🔴 원전 처리 — 어느 시트 어느 셀 · 없으면 "원전에 없음"
§2-3 🔴 다섯 표면 비교 표 — 무엇이 어떻게 다른가(🔴 차이 0이면 0)
§2-4 🔴 권고 1개 + 근거·대가·불리한사실·재검토조건 · 🔴 구현 안 했는지 · 승인 명시
§3 #70·#71·#74 각각 문구 인용 · 닫는 방법 · 결정형/작업형 · 의존 · 비용(모르면 "모름")
   🔴 #71 원인 미규명 그대로 · 🔴 순서 안 정했는지 · 🔴 착수 안 했는지
무변경: 🔴 REVDCF_ENABLED Production OFF · lib/·components/ diff 0(구현 없음)
       app/messages/data/.github/vercel.json diff 0 · 917 계측 불변
       DoD 개별 판정 칸 전부 불변 · DoD9 미접촉 · ②단계 미착수
       안건 3 대기 불변 · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **구현하지 말 것(권고까지). `REVDCF_ENABLED`를 켜지 말 것. DoD 개별 판정 칸을 바꾸지 말 것. DoD9·노출 트랙에 손대지 말 것. `#70`·`#71`·`#74`에 착수하지 말 것. ②단계를 시작하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
