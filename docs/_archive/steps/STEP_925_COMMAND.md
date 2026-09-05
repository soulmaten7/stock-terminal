# STEP 925 — `daily-brief`·`email-brief` 라벨 조립 진단 (🔴 진단만 · 발송 경로 손대지 말 것)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_925_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `f63d9cb`(STEP 924 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED`를 켜지 말 것** · DB **쓰기 금지** · **크론 수동 실행 금지**(🔑 **`email-brief` 크론은 특히 — 실제 메일이 나간다**) · **메일을 발송하지 말 것** · `lib/lensPrecompute.ts`(917 계측)·`lib/revdcf/**` 수정 금지 · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 진단만 한다. 코드 수정 0.** 🔑 **924가 만든 `lensStateLine`·`resolveDisplayName`을 건드리지 말 것.**
🔴 **DoD 판정 칸을 바꾸지 말 것** · **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측).
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🟢 924 육안 검증 완료 (Cowork 실측 2026-08-06 · `localhost:3333`)

924가 *"실제 픽셀 렌더는 Cowork 몫"*으로 남긴 자리를 닫는다. 🔴 **아래를 문서에 등재한다.**

| 확인 | 결과 |
|---|---|
| `/explore?market=US` 「Mo」 | 🟢 **「Altria Group, Inc.」** |
| 같은 곳 「Hst」 | 🟢 **「Host Hotels & Resorts, Inc.」** |
| 「모멘텀 모멘텀 상위권」 | 🟢 **「모멘텀 상위권」** — 중복 해소 |
| 회귀 대조(Suncor Energy Inc. 등) | 🟢 정상 유지 |
| `/explore?market=KR` | 🟢 **종목명·라벨 전부 정상 · 안 깨짐** |
| 「Alphabet Inc.」 2행 | 🔴 **그대로**(설계로 확인됨 · 924가 의도적으로 미접촉) |

🔴 **`resolveDisplayName` 호출 대상 2곳 중 `lib/todayChanges.ts` 경로(ChangeRow·TodayClient·daily-brief·email-brief 공통)는 브라우저로 직접 못 봤다** — 🔑 **`/explore`만 봤다.** 🔴 **§2가 코드로 답한다.**

## §1 — 🔴 먼저 열어라

924 보고: *"`daily-brief`·`email-brief`에도 momentum과 같은 이름중복 패턴(`${lensName} ${from}→${to}`)이 **있을 가능성**을 발견."*

🔴 **"가능성"이다. 확인부터 한다.** 🔑 **924도 이것을 진단하지 않고 기록만 남겼다.**

1. **`daily-brief`·`email-brief`의 생성 경로를 끝까지 연다** — 크론 라우트 → 본문 조립 → 렌즈 라벨이 문자열이 되는 지점.
2. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 열어서 본다. 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).
3. 🔴 **924가 신설한 `lib/lensCopy.ts`의 `lensStateLine`을 이 두 경로가 쓰는가, 아니면 자체 조립을 하는가** — 🔑 **이것이 답을 가른다.** 쓰면 이미 고쳐졌고, 안 쓰면 중복이 남아 있다.
4. 🔴 **`lib/todayChanges.ts`가 이 둘에 어떻게 닿는지** 확인한다 — 924는 종목명이 4곳에 공통 반영된다고 했다. 🔑 **종목명은 반영됐어도 라벨 조립은 별개일 수 있다.**

## §2 — 🔴 실측: 중복이 실제로 있는가

1. **두 경로의 실제 출력 문자열을 만들어 본다** — 🔴 **메일을 보내지 말고**, 조립 함수만 호출하거나 렌더 결과를 문자열로 뽑는다. 🔴 **프로브로**(`scripts/probe_925_*.ts` + 산출 JSON · 🔴 **같은 커밋에**(#78) · 🔴 **sanity check**(#87)).
2. 🔴 **924가 찾은 3그룹**(momentum ko/en의 up·flat·down · valuation-ko의 mid)이 **이 두 경로에서도 중복으로 나오는지** 확인한다. 🔴 **924의 71개 조합 전수 대조를 재사용할 수 있으면 재사용**하고, 못 하면 못 한다고 적는다.
3. 🔴 **중복이 0건이면 0건이라고 적는다.** 🔑 **`lensStateLine`을 이미 쓰고 있으면 그럴 수 있다.**
4. 🔴 **종목명도 함께 확인한다** — 🔑 **`/explore`만 육안 확인됐다.** 이 두 경로의 출력에 「Mo」·「Hst」가 남아 있는지.
5. **ko/en 둘 다** 본다.

## §3 — 🔴 노출 이력 (되돌릴 수 없는 것)

🔑 **`email-brief`는 실제로 메일이 나간다.** 🔴 **이미 발송된 메일은 고칠 수 없다.**

1. 🔴 **`email-brief` 크론이 언제부터 돌았고 지금도 도는지** DB로 확인한다(🔴 읽기만) — `cron_heartbeats`에 기록이 있다(911 확인: 08-04 23:14 `ok=true`).
2. 🔴 **`daily_brief` 테이블의 최신·최초 `as_of`** — 🔑 **잘못된 라벨이 며칠치 남아 있는가.**
3. 🔴 **수신자 규모는 조사하지 말 것** — 🔑 **개인정보 영역이고 이 STEP의 질문이 아니다.** 🔴 **"미조사"로 적는다.**
4. 🔴 **추정으로 "몇 명이 봤다"를 쓰지 말 것.**

## §4 — 🔴 판정서 (`docs/DECISION_925_BRIEF.md` 신설)

- **§1 경로** · **§2 실측**(중복 유무 · 종목명 유무 · ko/en)
- 🔴 **중복이 있으면 수리 선택지와 각각의 대가** — 🔑 **`lensStateLine`을 쓰게 하는 것이 자연스러우나, 이 경로는 메일 발송이라 회귀 위험이 다르다.** 🔴 **권고까지만. 실행은 승인 후.**
- 🔴 **중복이 없으면 "없음"으로 닫고 924의 *"있을 가능성"* 기록을 정정**한다(🔴 취소선 보존).
- 🔴 **노출 이력**(§3) — 🔴 **수신자 규모 미조사 명시.**
- 🔴 **DoD7과의 관계** — 🔑 **923이 확인한 대로 DoD7 원문의 "같은 이름"은 모호하다.** 🔴 **이 STEP도 DoD7을 판정하지 않는다.**
- 🔴 **승인은 장은태 것임을 명시.**

## §5 — 문서 · 검증 · 커밋

- `docs/DECISION_925_BRIEF.md` 신설 · `docs/DECISION_923_NAMING.md`(🔴 **§0 육안 결과 등재** · 🔴 **본문 불변**) · `docs/REVDCF_SPEC.md` §11
- `docs/STATE.md`(🔴 142줄 상한 · 🔴 **22:45 UTC 크론 관측 대기 유지**) · `docs/CHANGELOG.md`
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **한 곳을 고치면 그 함수를 안 쓰는 곳이 남는다.** 924가 목록의 라벨 조립을 `lensStateLine`으로 고쳤지만, 같은 문자열을 자체 조립하는 경로가 더 있을 수 있다. 🔴 **조립 함수를 신설했으면 "누가 아직 안 쓰는가"를 같은 흐름에서 센다.**

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **어느 코드 경로에든 diff가 나오면 수리한 것이다 — 되돌리고 보고한다.**(프로브 스크립트는 예외 · `scripts/`)
🔴 **커밋 메시지는 §2 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 925: check whether the briefs assemble the same label the list used to

- the previous step fixed one place where a lens name was printed twice because the phrase already
  carried it, and noted that the daily and emailed summaries might build the same string their own
  way; that was a possibility, not a finding, so it is checked
- the question is narrow: do those two paths call the shared assembler that was just introduced,
  or do they still compose the line themselves
- the output strings are produced without sending anything, in both languages, and the company
  names are looked at in the same pass since only the explore list was ever seen rendered
- one of these paths sends mail, so how long it has been running is read from its own heartbeat
  table: what already went out cannot be corrected, which changes what the options are worth
- nothing is repaired here and no mail is sent"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 924 육안 결과 등재
§1 daily-brief·email-brief 라벨 조립 경로(열어서 확인)
   🔴 lensStateLine을 쓰는가 자체 조립인가 · todayChanges.ts가 어떻게 닿는가
§2 🔴 실제 출력 문자열 — 중복 유무(0이면 0) · 종목명에 Mo·Hst 남아있는가 · ko/en
   🔴 메일 발송 0 확인 · 924의 71개 조합 재사용 여부
§3 email-brief 크론 가동 이력 · daily_brief 최초·최신 as_of
   🔴 수신자 규모 "미조사" 명시 · 🔴 추정 안 했는지
§4 DECISION_925 — 중복 있으면 선택지+대가(권고까지) / 없으면 924 기록 정정(취소선 보존)
   🔴 DoD7 판정 안 함 · 승인은 장은태 것임 명시
무변경: 🔴 코드 diff 0(수리 없음, scripts/ 프로브 예외) · 메일 발송 0 · DB 쓰기 0
       924의 lensStateLine·resolveDisplayName 불변 · lib/lensPrecompute.ts(917)·lib/revdcf/ diff 0
       DoD 판정 칸 전부 불변 · ②단계 미착수 · 안건 3 대기 불변
       REVDCF_ENABLED Production OFF · 크론 미실행
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것(진단만). 메일을 보내지 말 것. `email-brief` 크론을 돌리지 말 것. 924의 `lensStateLine`·`resolveDisplayName`을 건드리지 말 것. 수신자 정보를 조사하지 말 것. DoD7을 판정하지 말 것. `REVDCF_ENABLED`를 켜지 말 것. ②단계를 시작하지 말 것. 다음 STEP을 제안하지 말 것.**
