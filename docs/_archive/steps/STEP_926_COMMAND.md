# STEP 926 — 🟢 **B안 승인(장은태 2026-08-06)**: `email-brief` mover-line 중복만 수정 · 발송 0

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_926_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `1d5781e`(STEP 925 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 1행
🔴 **925 push 중 GH Actions 봇의 US 유니버스 일일갱신 커밋(`6e595cd`, `data/us_symbols.json`)이 먼저 들어와 rebase로 정리됐다** — 🔑 **정상 동작이다. 이 STEP도 push 전에 같은 상황을 만날 수 있다.**

## 🟢 승인 기록

> **장은태 승인 2026-08-06**: *"B안으로 `email-brief` mover-line만 우선 수정."*
> 🔴 **A안(공유 헬퍼로 전면 통일)·C안(방치)은 채택하지 않는다.** 🔴 **`daily-brief`는 이번에 손대지 않는다.**

🔴 **불변 금지선**: 🔑 **메일을 발송하지 말 것** · 🔑 **`email-brief` 크론을 돌리지 말 것**(실제 메일이 나간다) · **크론 수동 실행 금지 전반** · DB **쓰기 금지** · 🔴 **`daily-brief` 경로 수정 금지**(B안의 정의다) · `lib/lensPrecompute.ts`(917 계측)·`lib/revdcf/**` 수정 금지 · 924 산출물(`lensStateLine`·`resolveDisplayName`) **수정 금지** · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지 · **`REVDCF_ENABLED` Production OFF 유지**.
🔴 **DoD 판정 칸을 바꾸지 말 것** · **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측).
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §1 — 🔴 먼저 열어라

1. `docs/DECISION_925_BRIEF.md`의 **A·B·C 원문을 그대로 인용**한다. 🔴 **이 STEP이 "B"라 부르는 것이 925의 B와 같은지 확인**하고, 다르면 **925의 정의를 따르고 그 사실을 적는다.**
2. 925가 찾은 경로를 연다 — `buildFallbackBrief()`(🔑 **실반환값에 리터럴 중복이 있는 지점**) · `lensDisplayName` · `lensStateLabel` · 3필드(`{lensName, from, to}`) 저장 후 `${lensName} ${from}→${to}` 이어붙이는 자리.
3. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 열어서 본다. 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).
4. 🔴 **924의 `lensStateLine`을 재사용할 수 있는지 판단**한다. 🔑 **email 경로는 3필드로 나눠 저장하는 구조라 그대로 못 쓸 수 있다.** 🔴 **재사용하면 `lensStateLine` 자체는 고치지 말 것**(924 산출물 불변). 🔴 **못 쓰면 못 쓰는 이유를 적고 이 경로 안에서 해결한다.**

## §2 — 🔴 수정 (`email-brief`만)

1. 🔑 **문구가 아니라 조립을 고친다** — 924가 한 것과 같은 성격. 🔴 **`messages/`의 phrase 텍스트를 바꾸지 말 것.** 🔴 **불가피하면 이유를 적고 ko/en 동시에.**
2. 🔴 **`daily-brief`가 같은 함수를 공유하고 있으면 주의한다** — 🔑 **공유 지점을 고치면 B안이 아니라 A안이 된다.** 🔴 **공유면 공유라고 적고, `email-brief`에만 적용되는 형태로 처리하거나, 그게 불가능하면 중단하고 보고한다.**
3. **ko/en 둘 다.** 🔴 `messages.test.ts` 패리티 통과. 🔴 **en 축약형 금지.**
4. 🔴 **종목명은 이미 정상이다**(925: 잔존 0건 양쪽). 🔴 **건드리지 말 것.**

## §3 — 🔴 검증 (오늘 표본으로 하지 말 것)

🔑 **925가 명시했다**: *"오늘 표본에 momentum-up이나 valuation-mid가 안 걸렸을 뿐, 안전하다는 뜻은 아님."*

1. 🔴 **71개 조합 전수로 검증한다** — 924·925가 쓴 `lensStateLabel` 함수·데이터를 그대로 재사용. 🔴 **오늘 실데이터 표본으로 대신하지 말 것.**
2. 🔴 **수정 후 리터럴 중복이 71개 중 0건**임을 확인한다. 🔴 **0이 아니면 몇 건이 남았는지 적는다.**
3. 🔴 **회귀 확인** — 중복이 없던 조합의 문자열이 **바뀌지 않았는지.** 🔑 **924에서 68개 조합이 문자열 불변이었던 것과 같은 검사.**
4. 🔴 **`daily-brief` 출력이 수정 전과 완전히 동일한지 확인**한다 — 🔑 **B안의 정의다.** 🔴 **바뀌었으면 되돌린다.**
5. **프로브** `scripts/probe_926_*.ts` + 산출 JSON — 🔴 **같은 커밋에**(#78) · 🔴 **sanity check**(#87) · 🔴 **925의 `probe_925_brief_labels.ts`를 재사용할 수 있으면 재사용**하고 그 사실을 적는다.
6. 🔴 **메일 발송 0 · 라우트 미호출 · DB 쓰기 0**을 확인해 적는다.

## §4 — 🔴 이 STEP이 못 하는 것 (명시할 것)

- 🔴 **실제 발송 메일의 육안 검증은 불가능하다** — 🔑 **브라우저로 볼 수 있는 화면이 아니다.** 🔴 **문자열 검증이 전부임을 판정서에 적는다.** 🔑 **920·923·924에서 육안이 잡아낸 것들이 있었으므로, 이 경로는 그 안전망이 없다는 사실을 남긴다.**
- 🔴 **과거 발송분은 여전히 잴 수 없다**(925: mover-line은 DB 미저장). 🔴 **"0건"이 아니라 "잴 수 없음"으로 유지.**
- 🔴 **`daily-brief`의 리터럴 중복 0건이 "LLM 패러프레이즈로 우회"인지 "폴백을 거의 안 탐"인지는 미확정**(925). 🔴 **이 STEP도 확정하지 말 것.**

## §5 — 문서 · 커밋

- `docs/DECISION_925_BRIEF.md` — 🔴 **B안 채택·적용 기록**(승인자·일자) · 🔴 **본문 선택지는 고치지 말 것** · 🔴 **A안은 미채택으로 남겨두고 재검토 조건을 적는다**(🔑 `daily-brief` 쪽 성격이 밝혀지면).
- `docs/REVDCF_SPEC.md` §11(71개 전수 결과) · `docs/STATE.md`(🔴 142줄 상한 · 🔴 **22:45 UTC 크론 관측 대기 유지**) · `docs/CHANGELOG.md`
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **화면이 아닌 출력은 육안 안전망이 없다.** 메일·푸시·파일처럼 브라우저로 볼 수 없는 경로는 **문자열 검증이 유일한 관문**이므로, 표본이 아니라 **조합 전수**로 검증한다. **이력**: 925가 오늘 표본에서 5건 중 3건을 잡았으나 *"오늘 표본에 안 걸린 조합이 안전하다는 뜻은 아니다"*라고 스스로 단서를 달았다.

```bash
npx tsc --noEmit && npm run test          # 🔴 ko/en 패리티 포함
git diff --stat HEAD -- lib/lensPrecompute.ts lib/revdcf/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git diff HEAD -- lib/lensCopy.ts                                                        # 🔴 924 산출물 — 출력 없어야 함
git status --porcelain                                                                  # 🔴 ?? 0건
```

🔴 **`daily-brief` 경로에 diff가 나오면 B안을 넘은 것이다 — 되돌리고 보고한다.**
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례: GH Actions 봇의 `data/us_symbols.json` 갱신). 🔴 **충돌이 나면 중단하고 보고한다 — 억지로 해결하지 말 것.**
🔴 **커밋 메시지는 §3 전수 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 926: stop the emailed summary from printing a lens name twice

- the label there is assembled from three stored fields and joined back together, which is a
  different path from the one fixed for the list, so the shared helper written then does not reach
  it and the join is corrected where it happens
- only the emailed path is touched: the other summary shows no literal duplication in what it has
  stored, and why that is remains unsettled, so changing it would be acting on a guess
- checking is done across every lens and state rather than against today's rows, because today
  simply did not happen to include the combinations that break
- nothing is sent and nothing is written; what already went out was never stored and still cannot
  be measured, which is recorded rather than reported as none"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 925의 A·B·C 원문 인용 · 🔴 이 STEP의 "B"가 925의 B와 같은가
   buildFallbackBrief() 등 실제 경로 · 🔴 lensStateLine 재사용 가능한가(불가면 이유)
§2 🔴 조립을 고쳤는가 문구를 고쳤는가(문구면 이유+ko/en)
   🔴 daily-brief와 공유 지점이 있었는가 · 있었으면 어떻게 분리했는가
   ko/en 패리티 · 🔴 종목명 미접촉
§3 🔴 71개 조합 전수 — 수정 후 중복 0건인가(아니면 몇 건)
   🔴 중복 없던 조합 문자열 불변 확인 · 🔴 daily-brief 출력 완전 동일 확인
   🔴 메일 발송 0 · 라우트 미호출 · DB 쓰기 0 · probe_925 재사용 여부
§4 🔴 실제 메일 육안 검증 불가 명시 · 과거 발송분 "잴 수 없음" 유지
   🔴 daily-brief 0건의 이유 미확정 유지
§5 DECISION_925에 B 채택 기록 · 🔴 A안 미채택+재검토 조건 · 🔴 본문 선택지 불변
무변경: 🔴 daily-brief 경로 diff 0 · lib/lensCopy.ts(924) diff 0
       lib/lensPrecompute.ts(917)·lib/revdcf/·data/·.github/·vercel.json diff 0
       DoD 판정 칸 전부 불변 · ②단계 미착수 · 안건 3 대기 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · 메일 발송 0 · DB 쓰기 0
tsc 0 · test ?/? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **메일을 보내지 말 것. `email-brief` 크론을 돌리지 말 것. `daily-brief`를 고치지 말 것. 924 산출물(`lensStateLine`·`resolveDisplayName`)을 건드리지 말 것. 오늘 표본으로 검증을 대신하지 말 것. 수신자 정보를 조사하지 말 것. DoD7을 판정하지 말 것. `REVDCF_ENABLED`를 켜지 말 것. ②단계를 시작하지 말 것. 다음 STEP을 제안하지 말 것.**
