# STEP 891 — 🔴 시총 신선도 결함 실측 · 604↔2,857 교집합 · DoD 4 적용

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_891_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `5a30f41`(STEP 890 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

🔴 **순서 고정: §1 → §2 → §3.** §1이 §3의 전제를 흔들 수 있다. **§1 결과가 나오기 전에 DoD 4를 올리지 말 것.**

---

## §0 — 성격 · Cowork 사전 실측

**장은태 승인(2026-08-04)**: `docs/DECISION_890_DOD4.md` **조건부 권고 승인** — *"실제 604(자기참조 고정)"와 "목표 2,857(867 승인·미구현)"을 문서에서 가르면 DoD 4 ✅*.
🔴 **단 §1을 먼저 잰다.** 890이 *"원인 미조사로 기록만"*이라 넘긴 항목이 **판정 전제에 닿을 수 있다.**

### 🔴 Cowork이 DB에서 직접 확인한 것 (다시 하지 말고 이어서 하라)

```sql
select as_of, count(*) from us_market_cap group by as_of;
  2026-08-03  5,361
  2026-08-02      6      ← 🔴 여섯 건
  2026-07-30    520

select cnt_dates, count(*) from (select symbol, count(distinct as_of) cnt_dates
  from us_market_cap group by symbol) t group by cnt_dates;
  cnt_dates=1 → 5,887      ← 🔴 심볼당 정확히 한 행
```

🔑 **`us_market_cap`은 일별 스냅샷이 아니라 심볼당 한 행이 쌓이는 누적 표다.** 그래서 **520 심볼은 2026-07-30 시총을 그대로 들고 3일째 갱신이 안 되고 있다.**

그리고 `app/api/cron/revdcf/route.ts:44~45`:
```ts
sb.from("us_market_cap").select("symbol, market_cap")   // 🔴 as_of 필터 없음·ORDER BY 없음
const mcapBy = new Map(mcapRows.map(r => [r.symbol.toUpperCase(), +r.market_cap]));
```
→ `sharePrice = mcap / shares`(`:67`). 🔑 **시총이 주가를 만들고, 주가가 GAP을 만든다.**

## §1 — 🔴 시총 신선도 실측 (최우선 · 읽기만)

### 1-1. 무엇이 얼마나 묵었는가

- `us_market_cap`의 `as_of` 분포 재확인(위 숫자가 여전한가 — 크론이 그사이 돌았을 수 있다)
- 🔴 **`revdcf_results` 최신 `as_of`의 604 CIK 중 몇 개가 stale한 시총을 쓰는가.** 심볼 기준으로 조인해 `us_market_cap.as_of`별로 센다.
- 🔴 **그 stale 종목들의 `verdict`·`gap_years` 분포**가 fresh 종목과 다른가.

### 1-2. 왜 갱신이 안 되는가

🔴 **`us_market_cap`의 생산자를 코드에서 찾는다**(`lib/lensPrecompute.ts` 외에 더 있는지 grep). 확인할 것:
1. **upsert의 conflict target**이 `symbol`인가 `(as_of, symbol)`인가. 🔑 **`symbol`이면 갱신 실패 시 옛 행이 옛 `as_of`째로 영원히 남는다** — 지금 관찰과 맞는지.
2. **520 심볼이 어떤 종목인가** — 상장폐지·티커 변경·OTC 이동·야후 조회 실패 중 무엇인가. 🔴 **표본 10개를 실제로 확인**하고 유형별로 분류한다. 🔴 **추정으로 분류하지 말 것.**
3. **실패가 조용한가** — 실패 시 로그·플래그·스킵이 남는가, 아니면 그냥 옛 값이 계속 쓰이는가.

### 1-3. 🔴 영향 판정

- 🔴 **이것이 "결함"인가 "설계"인가**를 판정한다. 시총이 며칠 묵어도 GAP 판정이 안 바뀌면 결함이 아니다 — **그럼 얼마나 바뀌는지 재라.**
- 참고: 848·881이 *"GAP은 WACC(특히 rf)가 지배"*라 했다. 🔴 **주가 민감도는 별도로 잰 적이 없다.** stale 종목의 시총을 최신값으로 바꾸면 GAP이 얼마나 움직이는지 **프로브로 재라**(🔴 DB 쓰기 금지 · 계산만).
- 🔴 **DoD 2(입력 검증)는 이미 ✅다**(862). 이 결함이 DoD 2를 흔드는지 판정한다. 🔴 **흔든다면 ✅를 내리지 말고 보고하고 멈춘다** — 판정 되돌리기는 장은태 확인이 먼저다.

## §2 — 604 ↔ 2,857 교집합 (890 미측정)

890이 *"코드 연결 관계 확인으로만 한정"*했다. **실제 집합을 잰다.**

- `revdcf_results` 최신 604 CIK가 866의 "거래소 상장 2,857"의 **부분집합인가.** 아니면 몇 개가 밖에 있는가.
- 🔴 **866의 2,857 목록이 저장돼 있는가**부터 확인한다. 없으면 *"재현 불가 — 867 당시 일회성 계산"*이라 적고 **재계산하지 말 것**(이번 범위 밖).
- 🔴 목록이 없어 교집합을 못 재면 **"미측정"으로 남기고 §3을 진행한다** — 이 항목이 §3의 전제는 아니다.

## §3 — DoD 4 적용 (🔴 §1 결과가 판정을 안 흔들 때만)

승인된 권고대로 **문서에서 두 숫자를 가른다**:

| 구분 | 값 | 성격 |
|---|---|---|
| **실제 운영 표본** | **604** | `revdcf_results` · 🔴 크론 자기참조로 **고정** · 새 종목 유입 경로 없음 |
| **목표 조달 범위** | **2,857** | 867 승인 · **미구현** · 2026-08-02 기준 일회성 계산 |
| **7렌즈 표본** | `us_market_cap` | 🔴 **매일 갱신 설계이나 §1에서 실제 갱신 상태 확인** |

- `docs/LENS_COMPLETION_STANDARD.md` DoD 4 서술 *"모집단 = 거래소상장 N=2,857 확정"* → **위 구분으로 교체**. 🔴 취소선 보존.
- 🔴 **#80 절차**: `2,857`이 박힌 자리를 전수 grep해 **목록화 + 각 항목 처리 표시**(기준일 표기 / 이력이라 제외 / 이미 정확). 보고에 싣는다.
- **DoD 4 판정**: ✅ 또는 유지 — 🔴 **§1이 결함을 찾았고 그것이 모집단·분포 근거에 닿으면 올리지 말고 보고한다.**
- ✅로 올릴 경우 **근거·대가·불리한 사실·재검토 조건**을 다른 행과 같은 형식으로 남긴다. 🔴 **불리한 사실에 §1 결과를 반드시 적는다.**

## §4 — `docs/STATE.md` 정정 (890 미처리)

890 보고: *"`STATE.md` 배경 섹션의 `us_symbols.json(6,766)` 기준이 이번 실측(6,779)과 어긋나 보이나 '변경 없음' 섹션이라 손대지 않았다."*

- 🔴 **숫자를 6,779로 바꾸지 말 것** — 매일 변한다. **기준일을 붙이거나 배선**한다(`CLAUDE.md §12 B분류` · 869 선례).
- 🔴 `STATE.md` **142줄 상한 유지**.

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

프로브: `scripts/probe_891_mcap_staleness.ts` + `docs/probe_891_mcap_staleness.json` — 🔴 **스크립트를 같은 커밋에**(#78)

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 891: find out how old the prices are before calling the population settled

- the market cap table turns out to hold one row per symbol rather than one per day, so a few
  hundred symbols have been carrying a figure from several days ago and nothing marks them
- that figure becomes the share price, and the share price is what the whole model reads
  expectations out of, so how much it moves the verdict is measured rather than assumed
- whether this is a defect or an accepted design is decided from that measurement, and if it
  reaches an item already marked complete, the mark is reported rather than quietly removed
- the population figure recorded as settled describes a target that was never built; the number
  the model actually runs on is a different one, and the two are separated in the documents
- a count in the state file gets a date rather than a refresh, for the same reason as before"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 1-1 as_of 분포 재확인 · 604 중 stale 시총 사용 종목 수 · stale/fresh 판정 분포 차이
   1-2 생산자·conflict target · 520 표본 10개 유형 분류(🔴 실제 확인) · 실패가 조용한가
   1-3 🔴 결함인가 설계인가 판정 · 시총→GAP 민감도 실측 · DoD 2를 흔드는가(🔴 흔들면 내리지 말고 보고)
§2 604 ⊂ 2,857 여부 또는 "2,857 목록 부재로 미측정"
§3 DoD 4 — 세 구분 적용 · "2,857" 전수 목록(처리 표시) · 판정 결과 + 근거·대가·불리한사실·재검토조건
§4 STATE 6,766 → 기준일 표기 또는 배선(어느 쪽인지·이유)
무변경: lib/app/components/messages/data/.github diff 없음 · REVDCF_ENABLED OFF · 크론 미실행
       revdcf_results 604×3 · us_market_cap 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **§1이 DoD 2를 흔들면 ✅를 내리지 말고 중단·보고. `us_market_cap`에 쓰지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
