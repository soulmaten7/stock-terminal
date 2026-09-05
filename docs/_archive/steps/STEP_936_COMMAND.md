# STEP 936 — 🟢 **계측 ②차(장은태 승인 2026-08-07)**: 재시도 성공/실패 분해 · 값 변경 0

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_936_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `c97e7ee`(STEP 935 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `docs/STATE.md` **131줄**(상한 142) · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892

## 🟢 승인 기록 · 🔴 용어 구분 (혼동 방지)

> **장은태 승인 2026-08-07**: *"계측 ②차 추가 — 원인 규명 계속."*

🔴 **이름이 겹치니 먼저 못박는다**:
- **A안 ①단계 = 계측** — 917에서 배포 완료. **이번 STEP은 그 연장(계측 ②차)이다.**
- **A안 ②단계 = 예산·상한 증액** — 🔴 **여전히 미판정이고 934가 "불가"로 판정한 축이다.** 🔑 **이 STEP과 무관하다.**

🔴 **불변 금지선**: 🔑 **A안 ②단계(증액)를 시작하지 말 것** · **`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97/95)·`maxDuration` 불변** · **계산에 쓰이는 값 하나도 바꾸지 말 것** · **DoD 판정 칸 수정 금지** · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수 수정 금지** · **Cowork/Claude Code의 DB 직접 쓰기 금지** · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/revdcf/**`·`data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **`lib/lensPrecompute.ts` 수정은 계측 목적에 한해 허용**(917과 같은 범위). 🔴 **그 외 파일은 건드리지 말 것.**
🔑 **성공 기준은 "값이 하나도 안 바뀌는 것"이다** — 917과 동일.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §1 — 🔴 먼저 열어라 (935가 찾은 것 재확인)

🔴 **`lib/lensPrecompute.ts`를 읽어 확인한다**(#82 · `grep`만으로 단정 금지 · 🔴 줄 번호는 내용으로 찾는다).

1. 🔑 **935 발견 재확인**: *"`stage2Ms` 타이머가 재시도 루프 **뒤의 DB upsert까지** 포함한다"* — 🔴 **경계를 정확히 적는다.**
2. 🔑 **935 발견 재확인**: *"재시도 1건은 실제 HTTP 호출뿐, 즉시반환 경로 없음"* · *"재시도 성공분은 `freshSet`에 들어간다(`:131` 부근)"*.
3. **`retryAll = [...noCapField, ...noResponse]`** — 두 배열이 각각 어디서 채워지는지.
4. **stage1의 구조** — 🔑 **stage1도 외부 호출을 하는가.** 🔴 **한다면 몇 건인지 셀 수 있는가.**
5. 🔴 **재시도 1건의 실패 경로** — 예외인가 반환값인가. 🔑 **HTTP status나 사유를 붙잡을 수 있는 자리가 있는가.** 🔴 **없으면 "없음"으로 적고 §2에서 무엇을 뺄지 판단한다.**

## §2 — 🔴 잴 것 (🔴 이것만 · 호기심으로 늘리지 말 것)

🔑 **935가 못 본 것만 채운다.**

1. 🔑 **`recovered`** — **재시도로 실제 회복돼 `freshSet`에 들어간 수.** 🔴 **이 하나가 934의 대수적 도출을 직접 관측으로 바꾼다. 최우선.**
2. 🔑 **재시도 실패 사유별 집계** — HTTP status(429·404·5xx)·타임아웃·데이터 없음·기타. 🔴 **§1-5에서 붙잡을 자리가 없으면 잡히는 것만.** 🔴 **못 나누면 "미분해"로 남긴다.**
3. **`noCapField` / `noResponse` 각각의 길이** — 935가 *"관측 불가"*로 남긴 분해.
4. 🔑 **`stage2` 타이머 분리** — **순수 호출 구간**과 **DB upsert 구간**을 따로. 🔴 **935가 밝힌 경계 문제를 해소해야 34.5ms/건의 정체가 확정된다.**
5. **stage1 성공/실패 수**(§1-4에서 셀 수 있으면). 🔑 **레이트리밋이 stage1에서 시작될 수 있다.**
6. **실패 심볼 표본** — 🔴 **최대 5개만.** 🔑 **note가 비대해지면 안 된다.** 🔴 **전체 목록을 남기지 말 것.**

🔴 **KR 경로는 손대지 말 것** — 🔑 **KR엔 재시도 구조가 없다**(917 확인). 🔴 **US 경로만.**

## §3 — 🔴 구현 (917과 동일한 안전장치)

1. 🔴 **계산에 쓰이는 값은 하나도 바꾸지 않는다.** 추가되는 줄은 **전부 계측**이어야 한다.
2. 🔴 **계측 실패가 파이프라인을 죽이면 안 된다** — `try/catch`로 감싸고, 실패해도 렌즈 계산이 계속되게 한다. 🔑 **관측을 넣다가 라이브를 세우면 최악이다.**
3. 🔴 **루프 안에서 매 건 기록하지 말 것** — 🔑 **집계해서 끝에 한 번.** 🔴 **계측 자체가 시간을 먹으면 측정 대상이 오염된다.**
4. 🔴 **`retryBudgetHit`·`cutGateOk` 등 기존 판정 값의 산식을 건드리지 말 것** — 🔑 **892가 지적하고 894가 막은 자리다.** 🔴 **옆에 추가로 기록만.**
5. 🔴 **`git diff`를 육안으로 읽고**, 추가된 줄이 전부 계측인지 확인한다. 🔴 **하나라도 계산에 관여하면 되돌린다.**
6. 🔴 **`cron_heartbeats.note`에 기록**(917과 같은 채널 · 스키마 변경 0).

## §4 — 🔴 판정 불변 검증 (성공 기준)

**사전 스냅샷**(🔴 읽기만 · `docs/probe_936_baseline.json`):
`lens_cuts` 10행(US `as_of`=07-30 · KR=08-06) · `lens_scores` US/KR 행 수·`updated_at` · `us_market_cap` 행 수 · `cron_heartbeats` 현재 3행 · 🔴 **표본 20종목의 렌즈 판정 문자열**

```bash
npx tsc --noEmit && npm run test          # 🔴 182/182 이상 유지
git diff HEAD -- lib/lensPrecompute.ts    # 🔴 육안 — 추가분이 전부 계측인가
git diff --stat HEAD -- lib/revdcf/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                     # 🔴 ?? 0건
```

🔴 **`lib/revdcf/`나 `vercel.json`에 diff가 나오면 되돌리고 보고한다.**
🔴 **사후 DB 스냅샷이 사전과 일치해야 한다**(이 STEP 자체의 쓰기 0).

## §5 — 🔴 배포 후 관측 시점

🔴 **이 STEP은 배포까지만. 관측은 다음이다.**

- **US** `lens-scores` = **21:30 UTC**(지터 ±59분). 🔑 **최근 실측은 22:06**(933).
- 🔴 **KR은 이번 계측 대상이 아니다** — 재시도 구조 없음.
- 🔴 **다음 관측에서 볼 것을 목록으로 남긴다**: `recovered` · 실패 사유 집계 · `noCapField`/`noResponse` 길이 · 순수 호출 시간 vs upsert 시간 · stage1 성공/실패 · 실패 표본.
- 🔴 **`probe_936_baseline.json` 대비 판정 불변**도 함께 확인 대상.

## §6 — 문서 · 커밋

- `docs/DECISION_912_LIVE.md` — 계측 ②차 승인·배포 기록. 🔴 **A안 ②단계(증액)는 미판정 유지** · 🔴 **934 "불가" 판정 불변** · 🔴 **A·B·C·D 병기 유지.**
- `docs/REVDCF_SPEC.md` §11 · `docs/STATE.md`(🔴 **131줄 유지** · "▶ 다음 00" 갱신) · `docs/CHANGELOG.md`(🔴 **936 항목**)
- 🔴 **플레이북은 새 교훈이 있으면만** 추가한다(935가 이미 타이머 경계 건을 넣었다 · 🔴 중복 금지).

🔴 **커밋 메시지는 §2에서 실제로 넣은 항목에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 916→933→934→935로 **세 번 연속 축이 바뀌었다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 936: measure whether the retries recover anything, instead of inferring it

- the count of names still missing after retrying equals the count that went in, which implies none
  were recovered, but that follows from an identity the code always satisfies rather than from an
  observation, so the recovered figure itself is recorded
- the timer that suggested thirty-four milliseconds a name turned out to span the database write as
  well as the calls, so the two are separated before that number is used for anything
- failures are counted by reason where a reason can be caught at all, and the two lists that feed
  the retry are sized separately, since one of them may not be recoverable by retrying
- a handful of failing symbols is kept, not the whole list: this goes in a column read by hand
- nothing the pipeline computes moves, the caps and thresholds and gate are untouched, and the
  stored cutoffs are snapshotted first so the next run can be checked against them"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 🔴 935 발견 재확인 — stage2Ms 경계 · 즉시반환 없음 · freshSet 병합
   retryAll 구성 · stage1 외부호출 여부 · 🔴 실패 사유를 붙잡을 자리가 있는가(없으면 "없음")
§2 실제로 넣은 계측 항목 · 🔴 못 넣은 것과 이유("미분해" 등)
   🔴 실패 표본 5개 이하인지 · 🔴 KR 경로 미접촉
§3 🔴 git diff 육안 — 추가분이 전부 계측인가 · try/catch · 루프 밖 집계
   🔴 retryBudgetHit·cutGateOk 산식 불변
§4 🔴 tsc 0 · test ?/? · lib/revdcf/·vercel.json diff 0 · 사전/사후 DB 일치
   🔴 probe_936_baseline.json 내용
§5 🔴 관측 시각(US 21:30 UTC ±지터) · 다음에 볼 목록
무변경: 🔴 RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변 · 계산 값 0건 변경
       lib/revdcf/·app/·components/·messages/·data/·.github/·vercel.json diff 0
       DoD 판정 칸 전부 불변 · A안 ②단계 미착수 · 934 "불가" 판정 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · 메일 발송 0 · DB 직접 쓰기 0
push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **A안 ②단계(증액)를 시작하지 말 것. `RETRY_MAX`·`RETRY_MS`·게이트·임계값·`maxDuration`을 바꾸지 말 것. 계산에 쓰이는 값을 바꾸지 말 것. KR 경로를 건드리지 말 것. 실패 심볼 전체 목록을 남기지 말 것. 934 판정을 뒤집지 말 것. 크론을 돌리지 말 것. DB에 직접 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
