# STEP 933 — 🟢 **`retryAllLen` 획득 · `#67` 해소** · 🔴 **916 예측 반증**(시간 아니라 개수 절단) · ②단계 미판정

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_933_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `edd4b2a`(STEP 932 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `docs/STATE.md` **131줄**(상한 142) · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892

🔴 **불변 금지선**: 🔑 **②단계(예산·상한 증액)를 시작하지 말 것 — 장은태 승인 사항** · **`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97/95)·`maxDuration` 불변** · **`lib/lensPrecompute.ts`(917 계측) 수정 금지** · **DoD 판정 칸 수정 금지** · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수 수정·재배포 금지** · DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 실측 등재와 반증 기록만 한다. 코드 diff 0 · ②단계 판정 0.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 먼저 직접 재조회

🔴 **아래는 Cowork이 2026-08-06 22:46 UTC에 읽은 것이다. 실행 측이 직접 재조회한다**(#82 · 읽기만).

```sql
select job, last_run_at, ok, note from cron_heartbeats order by last_run_at desc;
select market, lens_key, as_of, updated_at from lens_cuts order by market, lens_key;
```

### US `lens-scores` — **2026-08-06 22:06:02 UTC** · 🔴 **`ok = false`**

```json
{"market":"US","freshCoverage":0.9143766756032171,"coverageOk":false,
 "compositionOk":false,"compRatio":0.9,"cutGateOk":false,
 "retryAllLen":511,"retrySetLen":400,
 "countHit":true,"timeHit":false,"retryBudgetHit":true,
 "stage1Ms":4258,"stage2Ms":13808,"stage3Ms":494,"acqMs":18560,
 "loopMs":133673,"pass2Ms":1009,"pruneMs":1,"calcMs":134683,"routeMs":153765,
 "churn":0.019,"skipChangeDiff":false,"computed":918,"universe":1000}
```

### `lens_cuts`

| market | `as_of` | `updated_at` |
|---|---|---|
| **US** (5 렌즈 전부) | **2026-07-30** | 2026-07-28 04:33:55 |
| **KR** (5 렌즈 전부) | 🟢 **2026-08-06** | 2026-07-28 04:33:55 |

🔴 **재조회 결과가 다르면 다르다고 적고 그 값으로 진행한다.**

## §1 — 🔴 916 예측 반증 (이 STEP의 핵심)

916 §1이 산술로 예측한 것:

> *"개수 절단(400) vs 시간 절단: 40초 안에 실제 처리되는 건수(~330)가 `RETRY_MAX`(400)보다 적음 — **시간 절단이 개수 절단보다 먼저·더 타이트하게 걸림.**"*

🔴 **실측은 정반대다**:

| | 916 예측 | 933 실측 |
|---|---|---|
| `countHit` | (걸리지 않음) | 🔴 **true** |
| `timeHit` | **먼저 걸림** | 🔴 **false** |
| 1건당 소요 | ~120ms(코드 주석 벤치마크) | 🔑 **13,808ms ÷ 400 ≈ 34.5ms** |

🔑 **`stage2Ms` = 13,808ms — `RETRY_MS` 40,000ms 예산 중 13.8초만 썼다. 26초가 남았다.**
🔴 **병목은 시간이 아니라 개수다**: `retryAllLen`(511) > `RETRY_MAX`(400) → `retrySetLen`=400으로 잘림 → **111건이 아예 시도되지 못했다.**

🔴 **아래 산술은 Cowork의 계산이다. 실행 측이 재계산해 확인하고, 틀리면 틀렸다고 적는다.**
- 511건 전부 시도 시 예상 = 511 × 34.5ms ≈ **17.6초** → 🔑 **40초 예산 안에 들어간다**(여유 ≈22초)
- `routeMs` 153,765ms(≈154초) / `maxDuration` 300초 → 🔑 **여유 ≈146초**. 111건 추가 시 +약 3.8초.

🔴 **916 §1의 "40초가 464건에 구조적으로 부족" 결론을 정정 표시한다**(🔴 **취소선 보존 · 916 본문은 고치지 말 것**). 🔑 **916은 코드 주석의 벤치마크(~120ms/건)와 915 표본(순차 136.68ms/건)에 기댔는데, 실제 크론은 동시성 6으로 훨씬 빠르다.**

## §2 — 🔴 확정된 것

1. 🟢 **`#67` 해소 — `retryAllLen` = 511.** 🔑 **894가 로그에 붙인 뒤 8 STEP 넘게 못 얻던 값이 917 계측(`cron_heartbeats.note`)으로 획득됐다.** 🔴 **`#67`을 소진 처리한다.**
2. 🔴 **`cutGateOk = false`** — 게이트가 컷 재유도를 막고 있다는 **직접 증거**. `coverageOk`·`compositionOk` **둘 다 false**.
3. **`freshCoverage` = 91.44%** — 🔑 **916의 DB 역산 90.5%와 근접해 그 역산이 정확했음이 확인됐다.** 🔴 임계 97% 미달.
4. 🟢 **대조군 완성** — 같은 코드·같은 게이트인데 **KR은 `cutGateOk=true` → `lens_cuts` 08-06 갱신**, **US는 false → 07-30 정지 유지**. 🔑 **게이트가 원인이라는 가장 강한 증거.**
5. 🔴 **크론이 `ok=false`로 기록된다** — 🔑 **실패로 남고 있었다.** 🔴 **이것이 언제부터인지는 `cron_heartbeats`가 최신 1행만 보존해 알 수 없다**(915 확인) — **"모름"으로 적는다.**
6. 🔴 **`updated_at`이 전부 2026-07-28 04:33로 동일** — 913이 밝힌 *"최초 INSERT 시각 고정"*이 재확인됐다.
7. 🔴 **`universe: 1000` · `computed: 918`** — 🔑 **렌즈 계산 대상은 상위 1,000종목이고, `freshCoverage`의 분모(5,966)와는 다른 대상이다.** 🔴 **두 숫자를 섞지 말 것.**

## §3 — 🔴 ②단계 재료 (🔴 판정하지 말 것)

🔑 **916이 나눈 "예산 증액 vs 구조 변경" 이분법이 실측으로 바뀌었다.**

🔴 **사실만 적는다**:
- 시간 예산(`RETRY_MS` 40초)은 **부족하지 않다** — 13.8초만 사용.
- 개수 상한(`RETRY_MAX` 400)이 **511에 못 미친다** — 111건 미시도.
- `maxDuration` 300초에 **여유 146초**가 있다 — 🔑 **916이 "플랫폼 절대상한이라 증액 불가"로 걱정한 축은 이번 실측에서 병목이 아니다.**
- 🔴 **`RETRY_MAX`를 올리면 커버리지가 97%를 넘는지는 이 실측으로 알 수 없다** — 🔑 **511건이 전부 성공한다는 보장이 없다.** 915가 표본 20/20 성공을 봤지만 **표본이다.** 🔴 **"올리면 해결된다"고 쓰지 말 것.**
- 🔴 **선택지 A·B·C·D 병기 유지** · 🔴 **A안의 형태가 916 서술과 달라졌다는 사실만 적는다.**

🔴 **②단계를 시작하지 말 것.** 🔴 **`RETRY_MAX` 값을 제안하지 말 것.**

## §4 — 🔴 문서 갱신

🔴 **각 문서를 열어 확인하고 고친다** · 🔴 **취소선 보존** · 🔴 **줄 번호를 믿지 말 것**(878).

1. `docs/DECISION_912_LIVE.md` — §0 US 실측 JSON 원문 · §1 반증 표 · §2 확정 7건 · §3 재료. 🔴 **②단계 미판정 유지 명시.**
2. `docs/REVDCF_SPEC.md` §10 **`#67` 소진 처리**(🔑 값 획득) · §11 실측 등재.
3. 🔴 **916 관련 정정** — 916 판정서/기록에 *"시간 절단이 먼저"* 결론이 있으면 **정정 블록 추가**(🔴 **본문 불변** · 907 전례).
4. `docs/STATE.md` — 🔴 **"▶ 다음 00" 갱신**: `retryAllLen`=511 획득 · `countHit`/`timeHit` 실측 · `cutGateOk=false` 확정 · KR 대조군 · **②단계 여전히 미판정**. 🔴 **131줄 유지**(필요하면 압축).
5. `docs/CHANGELOG.md` — 🔴 **933 항목 추가**(931 플레이북).
6. 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규 1건**:
   > 🔑 **코드 주석의 벤치마크와 단일 표본은 실제 실행을 대신하지 못한다.** 916은 코드 주석(~120ms/건)과 순차 표본(136.68ms/건)으로 *"시간 절단이 먼저 걸린다"*를 산술 확정했으나, 실제 크론은 동시성 6으로 **34.5ms/건**이었고 걸린 것은 **개수 절단**이었다. 🔴 **"산술로 확정"이라 적을 때, 그 산술의 입력이 실측인지 추정인지 함께 적는다.**

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
wc -l docs/STATE.md                                    # 🔴 131 이하
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git diff HEAD -- docs/LENS_COMPLETION_STANDARD.md      # 🔴 출력 없어야 함
git status --porcelain                                 # 🔴 ?? 0건
```

🔴 **`lib/lensPrecompute.ts`에 diff가 나오면 계측이나 상수를 건드린 것이다 — 되돌리고 보고한다.**
🔴 **DB 사전/사후 스냅샷 일치 확인**(읽기만 했는지).
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례). 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §0 재조회·§1 재계산 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 933: the number arrived, and it says the opposite of what the arithmetic predicted

- five hundred and eleven names were waiting and four hundred were tried, so the cap that bound
  was the count and not the clock: the retry window used fourteen seconds of the forty it had
- an earlier step calculated the reverse from a comment in the code and a sequential sample, and
  concluded from that the time budget was structurally short; the run itself is three times faster
  per name because it fetches six at a time, and that conclusion is corrected
- the gate reports itself closed, coverage sits below its threshold, and the Korean side of the
  same code passes and moved its cutoffs to today while the American ones stayed on the thirtieth
- the value that eight steps could not read is now read, and the item that asked for it is closed
- what to do about the cap is not decided here, and whether raising it would clear the threshold
  is not something this measurement can say"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 🔴 직접 재조회 — Cowork JSON·표와 같은가 다른가
§1 🔴 916 반증 표 · 🔴 34.5ms/건 재계산 확인(틀리면 틀렸다고)
   🔴 511건 예상 17.6초·routeMs 여유 146초 재계산 · 🔴 916 본문 불변으로 정정 블록만
§2 확정 7건 — retryAllLen 511 · cutGateOk false · freshCoverage 91.44%(역산 90.5% 근접)
   KR 대조군 · 🔴 ok=false가 언제부터인지 "모름" · updated_at 고정 재확인
   🔴 universe 1000과 freshCoverage 분모 5,966을 안 섞었는지
§3 🔴 ②단계 미판정 유지 · 🔴 RETRY_MAX 값 제안 안 했는지
   🔴 "올리면 해결된다"고 안 썼는지 · A·B·C·D 병기 유지
§4 #67 소진 · DECISION_912 등재 · 916 정정 블록 · STATE(131줄) · CHANGELOG 933 · 플레이북 1건
무변경: 🔴 RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변 · lib/lensPrecompute.ts diff 0
       DoD 판정 칸 전부 불변 · LENS_COMPLETION_STANDARD.md diff 0 · 코드 diff 0
       환경변수 0 · 재배포 0 · REVDCF_ENABLED Production OFF
       크론 미실행 · 메일 발송 0 · DB 쓰기 0(읽기만)
tsc 0 · test ?/? · wc -l STATE ? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **②단계를 시작하지 말 것. `RETRY_MAX`·`RETRY_MS`·게이트·임계값·`maxDuration`을 바꾸지 말 것. 917 계측을 건드리지 말 것. "올리면 해결된다"고 쓰지 말 것. 916 본문을 고치지 말 것. 크론을 돌리지 말 것. DB에 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
