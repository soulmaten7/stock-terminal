# STEP 931 — 🔴 930 CHANGELOG 소급 기록 + 명령서 결함 플레이북 (문서만 · 새 판단 0)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_931_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a10fbfa`(STEP 930 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `docs/STATE.md` **131줄** · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 1행

🔴 **불변 금지선**: 🔑 **DoD 판정 칸을 하나도 바꾸지 말 것** · **DoD 9항목 정의 수정 금지** · **921 승인 완성 정의 수정 금지** · **`docs/STATE.md` 내용 수정 금지**(🔴 **HEAD/배포 줄의 커밋 해시·push 상태 갱신만 허용** — 관례) · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수 수정·재배포 금지** · DB **쓰기 금지** · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 문서만 고친다. 코드 diff 0 · 새 판단 0 · 새 측정 0.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 무엇이 빠졌나

930 보고:

> *"STEP 930은 §3에서 **'CHANGELOG 조치 불필요·확인만'**이라 명시했기 때문에, 이전 STEP들과 달리 이번엔 `docs/CHANGELOG.md`에 **새 엔트리를 추가하지 않았다** — 의도된 예외이지 누락이 아니다(관례 이탈이라 명시적으로 밝힘)."*

🔴 **명령서(930 §3)의 결함이다.** 🔑 **"CHANGELOG를 손대지 말 것"이 두 가지를 가리켰다**: ① 기존 항목을 고치지 말 것(의도) · ② 이 STEP 자신의 이력을 남기지 말 것(의도 아님). 🔴 **구분해 쓰지 않아 실행 측이 ②까지 지켰다.**

🔑 **`STATE.md` 머리가 정한 규칙**: *"**현재상태=여기에만 · 이력=CHANGELOG에만**"* — 🔴 **930은 STATE를 8건 고쳤는데 그 이력이 CHANGELOG에 없다.**

## §1 — 🔴 930 항목 소급 추가

🔴 **`docs/CHANGELOG.md` 최상단에 930 항목을 추가**한다. 🔑 **928이 927 누락을 소급 추가한 방식 그대로**(72번 항목 · *"소급 기록 — 927 당시 이 항목이 누락됐던 것을 928에서 발견해 추가"*).

- 🔴 **소급 기록임을 제목이나 머리에 명시**한다(928 전례 문구 참조).
- 🔴 **930 보고에 있는 사실만 적는다. 새로 판단하지 말 것.** 실제 내용:
  - **정정 8건**: 1-1 헤더 `7 🔶(보류)`→`(미결)`(🔶 기호 불변 · DoD9 "(보류)"는 유지) · 1-2 903 시점 서술 취소선 보존 + 921 승인("DoD9 제외 8항목") 병기 · 1-3 DoD7 미결 사유를 *"같은 이름 정의의 부재"* 하나로(🔶 칸 불변) · 1-4 DoD9 사유를 *"플래그 OFF"*에서 *"US전용↔KR요구 충돌"*로(❌ 칸 불변 · *"고쳐야 한다"* 안 씀) · 1-5 인프라 403 항목 해소 표시(항목 삭제 안 함 · 남은 제약 MCP 403·로그보존 1시간 명시) · 1-6 `us_market_cap` 실제 DB값 5,892 확인 후 배경 절의 고정숫자 5,887 제거 + 두 참조가 서로 다른 대상임을 명시 · 1-7 **22:45 UTC 예약**(`trig_016oNSwKrTa9qSSGQXQDXGqo`) *"Cowork 세션으로만 배달"* 기록 · 1-8 *"하루 100 배포"* 출처 확인 = **STEP 755(2026-07-18) 3중검증으로 확인된 값**을 CHANGELOG에서 찾아 인용
  - **압축**: 최종 **131줄**(상한 142) — 866~877 개별 STEP 서술 10줄을 CHANGELOG 포인터 1줄로. 🔴 **삭제 아니라 압축**(전체 서술은 CHANGELOG에 그대로).
  - **재확인**: §0 Cowork 정리와 **8건 전부 원문에서 일치** · §3 CHANGELOG 재확인(6,244줄·최신순·929까지·927 소급 흔적) — **손 안 댐**
  - **무변경**: DoD 판정 칸 전부 불변(심볼 한 곳도 안 바뀜 · `git diff` 육안) · DoD 정의·921 승인 정의 불변 · `LENS_COMPLETION_STANDARD.md` diff 0 · 코드 diff 0 · 환경변수 0 · 재배포 0 · `REVDCF_ENABLED` Production OFF · ②단계 미착수 · 안건 3 대기 불변 · 크론 미실행 · 메일 발송 0 · DB 쓰기 0 · tsc 0 · test 182/182 · push `a10fbfa`
- 🔴 **931 자신의 항목도 같은 커밋에 추가**한다(이 STEP이 무엇을 했는지).
- 🔴 **기존 항목(929 이하)은 한 글자도 고치지 말 것.**

## §2 — 🔴 플레이북 신규 2건

🔴 **`docs/LENS_DEV_PLAYBOOK.md`에 추가.** 🔑 **930에서 이 파일이 갱신되지 않은 것도 같은 원인이다**(명령서가 요구하지 않았고 실행 측이 그대로 지켰다).

> 🔑 **"X를 건드리지 말 것"은 범위를 나눠 쓴다.** 930 §3이 *"CHANGELOG는 확인만 하고 손대지 말 것"*이라 적어, 실행 측이 **이 STEP 자신의 이력을 남기는 것까지** 금지로 읽었다. 🔴 **금지선을 쓸 때 "기존 내용 수정 금지"와 "이 STEP의 산출물 기록"을 구분한다.** 🔑 **`STATE.md` 규칙이 *"이력=CHANGELOG에만"*이므로, 이력을 안 남기면 그 규칙이 깨진다.** **이력**: 907(`lib/` 지시 vs `lib/` diff 0 게이트) · 930(CHANGELOG 금지 범위).

> 🔑 **명령서가 지정한 출처·범위가 틀릴 수 있다 — 실행 측이 재확인해서 잡는다.** 929에서 Cowork이 *"DoD7 다섯 표면 중 셋 N/A"*의 출처를 **925**로 지칭했으나 직접 재확인 결과 실제 출처는 **901**이었다(929가 정정). 🔴 **명령서의 인용 지시는 "그 문구를 찾아 재인용하라"로 쓰고, 출처가 다르면 정정하도록 명시한다.**

## §3 — 🔴 `STATE.md`

🔴 **내용은 고치지 말 것.** 🔑 **HEAD/배포 줄의 커밋 해시·push 상태만 관례대로 갱신**한다.
🔴 **줄 수 131 → 늘어나지 않게 한다**(상한 142이나 이 STEP은 늘릴 이유가 없다). 🔴 **최종 줄 수를 보고한다.**

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
wc -l docs/STATE.md                                    # 🔴 131 유지(±0 목표)
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git diff HEAD -- docs/LENS_COMPLETION_STANDARD.md      # 🔴 출력 없어야 함
git diff HEAD -- docs/STATE.md                         # 🔴 육안 — HEAD 줄 외 변경 없는지
git status --porcelain                                 # 🔴 ?? 0건
```

🔴 **DoD 판정 칸이나 `STATE.md` 본문에 변경이 있으면 되돌리고 보고한다.**
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례). 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §1에서 실제로 적은 내용에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 931: write down what the previous step changed, since its own instructions told it not to

- the state file rules say current state lives in one place and history in another; the last step
  edited the first and was told to leave the second alone, so eight corrections happened with no
  record of why
- that instruction meant do not rewrite existing entries, not do not record this one, and the two
  were not separated when it was written; the entry is added after the fact, the way a missing one
  was added two steps earlier
- nothing is re-decided here and no measurement is repeated: the entry says what the report said
- the pattern goes in the playbook alongside the earlier case where an instruction forbade the very
  path its own steps required, and alongside a citation this session pointed at the wrong step"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 CHANGELOG 930 항목 소급 추가 — 🔴 소급임을 명시했는가 · 정정 8건·압축·무변경 반영
   931 자신의 항목 추가 · 🔴 929 이하 기존 항목 diff 0
§2 플레이북 2건 추가
§3 🔴 STATE.md — HEAD 줄만 갱신 · 최종 줄 수
무변경: 🔴 DoD 판정 칸 전부 불변 · DoD 정의·921 승인 정의 불변
       LENS_COMPLETION_STANDARD.md diff 0 · STATE 본문 diff 0(HEAD 줄 제외)
       코드 diff 0 · 환경변수 0 · 재배포 0 · REVDCF_ENABLED Production OFF
       ②단계 미착수 · 안건 3 대기 불변 · 크론 미실행 · 메일 발송 0 · DB 쓰기 0
tsc 0 · test ?/? · wc -l STATE ? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **새 판단을 하지 말 것. 새 측정을 하지 말 것. `STATE.md` 본문을 고치지 말 것. 기존 CHANGELOG 항목을 고치지 말 것. DoD 판정 칸을 바꾸지 말 것. 코드를 고치지 말 것. `REVDCF_ENABLED` Production을 켜지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
