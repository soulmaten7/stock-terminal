# STEP 932 — 🟢 917 계측 **첫 실측값 획득(KR)** 등재 · ②단계는 여전히 미판정(US 값 부재)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_932_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `3e31320`(STEP 931 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `docs/STATE.md` **131줄** · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행

🔴 **불변 금지선**: 🔑 **②단계(예산 증액)를 시작하지 말 것 — US 실측값이 아직 없다** · **`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97/95)·`maxDuration` 불변** · **`lib/lensPrecompute.ts`(917 계측) 수정 금지** · **DoD 판정 칸 수정 금지** · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수 수정·재배포 금지** · DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 실측값을 문서에 등재만 한다. 코드 diff 0 · 새 판단 0.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 먼저 직접 재조회

🔴 **아래는 Cowork이 Supabase로 읽은 것이다. 실행 측이 직접 재조회한다**(#82 · 읽기만).

```sql
select job, last_run_at, ok, note from cron_heartbeats order by last_run_at desc;
```

### Cowork 실측 (2026-08-06 14:21 UTC 조회)

| job | last_run_at | ok | note |
|---|---|---|---|
| **`kr-lens-scores`** | **2026-08-06 10:35:49 UTC** | ✅ | 🟢 **계측 JSON 있음**(아래) |
| `email-brief` | 2026-08-05 23:05:32 UTC | ✅ | `null` |
| `jp-disclosures` | 2026-07-27 16:01:57 UTC | ✅ | `null` |

```json
{"market":"KR","coverage":1,"coverageOk":true,"cutGateOk":true,
 "acqMs":4119,"loopMs":151439,"pass2Ms":1447,"pruneMs":227,
 "calcMs":153113,"routeMs":157948,
 "churn":0.023,"skipChangeDiff":false,"computed":975,"universe":1000}
```

🔴 **재조회 결과가 다르면 다르다고 적고 그 값으로 진행한다.**

## §1 — 🔴 이것으로 확정되는 것 (사실만)

1. 🟢 **917 계측이 작동한다** — 배포 후 첫 정규 크론에서 `cron_heartbeats.note`에 값이 기록됐다. 🔑 **채널 선택(사다리 1번)이 옳았다** — 로그 보존 1시간 밖에서도 값이 남는다.
2. 🟢 **KR 크론 08-06분 정상 실행** — 916이 *"08-05분 확정 미실행 + 08-06분 **대기**"*로 남긴 것 중 **08-06분이 해소**됐다. 🔴 **08-05분 미실행 자체는 그대로 사실로 남는다**(원인 미규명 · 이 STEP에서 조사하지 말 것).
3. 🟢 **KR은 게이트를 통과한다** — `coverage: 1`(100%) · `coverageOk: true` · **`cutGateOk: true`**. 🔑 **913·914의 *"KR은 문제 없음"* 판정이 계측으로 확인됐다.**
4. 🟢 **단계별 elapsed 분해 확보(KR)** — 916이 *"코드에 계측 자체가 없어 224s/141s의 내역을 못 나눈다"*고 한 그 분해:
   - `acqMs` **4,119ms** · `loopMs` **151,439ms** · `pass2Ms` **1,447ms** · `pruneMs` **227ms** · `calcMs` **153,113ms** · **`routeMs` 157,948ms(≈158초)**
   - 🔑 **`maxDuration` 300초 대비 여유 ≈142초**(KR 기준)
   - 🔑 **시간의 대부분은 렌즈 계산 루프(`loopMs` 151.4초 = 라우트의 95.9%)이고 취득은 4.1초뿐**이다.
5. **KR 유니버스 1,000 / 계산 975** · `churn` 0.023 · `skipChangeDiff` false.

## §2 — 🔴 아직 없는 것 (🔴 추정 금지)

1. 🔴 **`retryAllLen`·`countHit`·`timeHit`이 note에 없다.** 🔑 **917이 명시한 설계다** — *"KR: `acqMs`만(`topKrByMarketCap`이 벌크 단일읽기라 US식 3단계 구조 자체가 없음 — 없는 단계를 억지로 안 쪼갬)."* 🔴 **결손이 아니라 해당 없음**임을 적는다.
2. 🔴 **`retryAllLen`은 US 크론에서만 나온다** — **21:30 UTC ±59분 지터**. 🔴 **이 STEP 시점(14:21 UTC 조회)에는 아직 없다.**
3. 🔴 **KR의 158초를 US에 적용하지 말 것.** 🔑 **유니버스가 1,000 대 5,966이고 US엔 재시도 단계가 있다.** 🔴 **"US도 여유가 있을 것"이라고 쓰지 말 것.**
4. 🔴 **`kr-perf`는 `cron_heartbeats`에 없다** — 917이 계측 대상 밖으로 뒀다(설계). 🔴 **KR "관측 수단 없음" 문제는 `kr-lens-scores`만 해소.**
5. 🔴 **`email-brief` 최신이 08-05 23:05**이다 — 조회 시점(14:21 UTC) 기준 08-06분이 아직 도래 전인지 미실행인지 **이 STEP은 판단하지 않는다**. 🔴 **"미실행"으로 적지 말 것** · 🔴 **스케줄 시각만 확인해 적고 판정은 다음 관측으로.**

## §3 — 🔴 ②단계는 여전히 미판정

🔴 **②단계(보수적 예산 증액)를 시작하지 말 것.** 🔑 **916이 정한 입력은 `retryAllLen`과 US 단계별 elapsed다. 둘 다 없다.**
🔴 **KR 값으로 ②단계를 판정하지 말 것** — 🔑 **US의 병목은 재시도 예산(`RETRY_MAX`/`RETRY_MS`)이고, KR엔 그 구조가 없다.**
🔴 **916의 "40초가 464건에 구조적으로 부족" 산술은 그대로 유효**하며 이 STEP이 바꾸지 않는다.

## §4 — 🔴 문서 갱신

🔴 **각 문서를 열어 실제 문구를 확인하고 고친다** · 🔴 **취소선 보존** · 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).

1. `docs/DECISION_912_LIVE.md` — 🟢 **KR 첫 실측값 등재**(§0 JSON 원문 그대로) · §1 확정 5건 · §2 미확보 5건. 🔴 **②단계 미판정 유지 명시.**
2. `docs/REVDCF_SPEC.md` §11 — 실측 등재.
3. `docs/STATE.md` — 🔴 **"▶ 다음 00" 항목 갱신**: 916의 *"KR 08-06분 대기"* → **해소** · 917 계측 **작동 확인** · 🔴 **②단계 입력은 여전히 US 크론(21:30 UTC) 대기.** 🔴 **131줄 유지**(늘리지 말 것 · 필요하면 압축).
4. `docs/CHANGELOG.md` — 🔴 **932 항목 추가**(931 플레이북 반영 — 이 STEP의 이력을 남긴다).
5. 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규 1건**:
   > 🔑 **보존기간이 짧은 로그 대신 DB에 남기면, 값을 놓치지 않는다.** 894가 붙인 `console.log`는 8 STEP 동안 한 번도 읽히지 못했다(Hobby 보존 1시간). 917이 같은 값을 `cron_heartbeats.note`(기존 미사용 컬럼·스키마 변경 0)에 남기자 **배포 후 첫 정규 크론에서 바로 획득**됐다. 🔴 **계측을 넣을 때 "어디에 남길 것인가"를 "무엇을 잴 것인가"보다 먼저 정한다.**

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
wc -l docs/STATE.md                                    # 🔴 131 이하
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git diff HEAD -- docs/LENS_COMPLETION_STANDARD.md      # 🔴 출력 없어야 함
git status --porcelain                                 # 🔴 ?? 0건
```

🔴 **`lib/lensPrecompute.ts`에 diff가 나오면 계측을 건드린 것이다 — 되돌리고 보고한다.**
🔴 **DB 사전/사후 스냅샷 일치 확인**(읽기만 했는지).
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례). 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §0 재조회 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 932: the instrumentation returned its first numbers, from the Korean job

- the value that was logged for eight steps and never once read is now written to a table instead,
  and the first scheduled run after deploying that change left it there
- for Korea the run takes about a hundred and fifty-eight seconds against a ceiling of three
  hundred, and almost all of it is the lens loop rather than the fetching
- the gate that has been blocking cutoff re-derivation on the American side passes cleanly here,
  which confirms by measurement what two earlier steps concluded from stored dates
- the number the recommendation actually turns on comes from the American job, which has not run
  yet today, so the increase stays unjudged and the Korean timings are not carried across: the
  universes differ by a factor of six and only one of them retries"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 🔴 직접 재조회 결과 — Cowork 표·JSON과 같은가 다른가
§1 확정 5건 — 계측 작동 · KR 08-06분 실행 · cutGateOk true · 단계별 elapsed · 유니버스/계산 수
§2 미확보 5건 — 🔴 retryAllLen "해당 없음"(결손 아님) 명시 · US 21:30 UTC 대기
   🔴 KR 158초를 US에 적용 안 했는지 · kr-perf 계측 밖 · email-brief 판정 안 했는지
§3 🔴 ②단계 미판정 유지 확인 · 916 산술 불변
§4 DECISION_912 등재 · SPEC §11 · STATE(🔴 131줄 이하·"대기" 해소 반영) · CHANGELOG 932 항목
   플레이북 1건
무변경: 🔴 RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변 · lib/lensPrecompute.ts diff 0
       DoD 판정 칸 전부 불변 · LENS_COMPLETION_STANDARD.md diff 0 · 코드 diff 0
       환경변수 0 · 재배포 0 · REVDCF_ENABLED Production OFF
       크론 미실행 · 메일 발송 0 · DB 쓰기 0(읽기만)
tsc 0 · test ?/? · wc -l STATE ? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **②단계를 시작하지 말 것. KR 값으로 US를 추정하지 말 것. `RETRY_MAX`·`RETRY_MS`·게이트·임계값을 바꾸지 말 것. 917 계측을 건드리지 말 것. 08-05 KR 미실행 원인을 조사하지 말 것(별건). `email-brief` 미실행 여부를 판정하지 말 것. 크론을 돌리지 말 것. DB에 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
