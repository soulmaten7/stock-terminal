# STEP 892 — 시총 신선도: 원인 확정 · stale 편향 분해 · 처방 판정 (🔴 코드 변경 0)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_892_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `f6227a5`(STEP 891 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

🔴 **이 STEP은 코드를 고치지 않는다.** 원인을 확정하고 처방을 **판정**한다. 적용은 893.

---

## §0 — 891이 남긴 것

891 판정: **결함**. `lensPrecompute.ts` 자신은 **7일 TTL 폴백**을 쓰는데 **revdcf 크론은 필터가 없다.**
891 실측: 604 중 **stale 86사(14.2%)**. `years` 비율 fresh 20.3% vs **stale 26.7%**, GAP 중앙 **9 vs 12**. 엔진 재현 15사 중 **2사 실제 이동**(CL 12→9년 · DCI 12→13년).

891이 명시적으로 남긴 미해결:
> *"stale 그룹의 GAP 중앙값이 fresh보다 높은 것(9 vs 12)이 **신선도 자체의 인과인지, 우연히 특정 성격의 종목이 몰린 것인지는 구분하지 않았다** — N=86이 작고 원인 분해는 이번 STEP 범위 밖."*
> *"신선도 필터를 revdcf 크론에 실제로 추가하는 코드 작업은 하지 않았다 — `REVDCF_SPEC.md` A-11에 재검토 조건으로만 남김."*

### 🔴 Cowork 사전 실측 (다시 하지 말고 이어서)

```
lib/lensPrecompute.ts:115   const RETRY_MAX = 400, RETRY_MS = 40_000;
                     :117   const retrySet = retryAll.slice(0, RETRY_MAX);   ← 🔴 400개로 잘림
                     :121   if (Date.now() - t0 > RETRY_MS) { timeHit = true; return; }
                     :131   capRows = [...freshSet]                          ← 성공분만 기록
                     :134   upsert(..., { onConflict: "symbol" })            ← 실패분은 옛 행 그대로
                     :157   retryBudgetHit: retryAll.length > RETRY_MAX || timeHit   ← 🔴 진단이 이미 있다
```

DB: `us_market_cap` oldest **2026-07-30** · newest **2026-08-03** · **7일 초과 0건**(오늘 기준).

🔑 **재시도가 400개·40초로 잘리고, 잘린 나머지는 그날 갱신되지 않는다. 그리고 그 사실을 알리는 진단 플래그가 이미 계산되고 있다.**

## §1 — 원인 확정 (🔴 읽기만)

1. **`retryBudgetHit`·`freshCoverage`·`recovered`·`fallbackUsed`가 어디로 가는가** — 반환만 되고 버려지는가, 로그·Sentry·응답에 실리는가. 🔴 **어디까지 도달하는지 코드로 추적한다.**
   → 891은 *"실패는 조용함(로그·플래그 없음)"*이라 적었는데, **진단은 있고 소비처가 없는 것**일 수 있다. 🔴 **어느 쪽인지 확정한다.**
2. **최근 실행에서 실제로 잘렸는가** — `retryAll.length`가 400을 넘었는지, `timeHit`이 걸렸는지 **관측 가능한 흔적**(Sentry·Vercel 로그·DB)이 있는가. 🔴 **없으면 "관측 불가"로 적는다** — 추정 금지.
3. **86사가 왜 하필 그들인가** — 891 표본 10개가 전부 야후 정상 조회됐다. 🔴 **알파벳 순서·심볼 길이·거래소 등 `STOCK_SYMS` 배열 위치와 상관이 있는지** 본다(청크 100개 단위 처리라 **뒤쪽이 불리할 수 있다**). 🔴 **상관이 없으면 없다고 적는다.**
4. 🔴 **구조적 상한이 없다는 것을 확인한다** — `us_market_cap`에 정리(cleanup)가 있는가. 없고 revdcf에 필터도 없으면 **한 심볼이 계속 실패할 때 나이 상한이 무한**이다. 오늘 4일인 것은 우연이다.

## §2 — 🔴 stale 편향 분해 (891이 남긴 것 · 이 STEP의 핵심)

**질문**: `GAP 중앙 12(stale) vs 9(fresh)`가 **신선도 때문인가, 종목 구성 때문인가.**

🔑 **답은 같은 종목 안에서 봐야 나온다.** 891은 15사만 재현했다. **86사 전부**로 확대한다.

- 86사 각각에 대해 **현재 저장된 stale 시총**과 **오늘 야후 시총**을 둘 다 넣고 GAP·verdict를 계산한다. 🔴 **DB 쓰기 금지 — 프로브 계산만.**
- 낼 것: **판정이 바뀌는 종목 수** · GAP 이동 분포(중앙·p25/p75) · **버킷 이동 내역**(어느 칸에서 어느 칸으로)
- 🔴 **시총 변화율과 GAP 변화의 관계**를 본다. 며칠 사이 시총이 몇 % 움직였고 그것이 GAP을 몇 년 움직이는가. 🔑 **이게 "주가 민감도"이고, 848·881이 WACC 민감도만 재고 이건 잰 적이 없다.**
- 🔴 **fresh 518사에도 같은 실험을 표본으로 돌린다**(예: 무작위 86사). 신선한 종목에서도 하루치 시총 변화로 GAP이 비슷하게 움직이면, **문제는 신선도가 아니라 모델이 주가에 민감한 것**이다. 🔑 **이 대조가 없으면 §3을 판정할 수 없다.**

## §3 — 🔴 처방 판정 (하나만)

§1·§2 결과로 **하나를 고른다.** 🔴 **선택지 나열 금지**(플레이북 #79). 근거는 **§1·§2 실측**에 걸려야 한다.

후보(참고용 · 이 목록에 갇히지 말 것):

| 안 | 내용 | 성격 |
|---|---|---|
| A | **조달을 고친다** — `RETRY_MAX`·`RETRY_MS` 상향 또는 청크 전략 변경 | 원인 제거 · 🔴 야후 레이트리밋·크론 시간 예산 확인 필요 |
| B | **revdcf에 TTL 필터** — `lensPrecompute`와 같은 7일 기준 | 증상 차단 · 🔴 초과분은 `skip_reason` 처리 |
| C | **폴백 명시** — stale 사용은 허용하되 `flags`에 나이를 기록 | 정직 노출 · 판정은 그대로 |
| D | **화면 표기** — 시총 기준일을 사용자에게 보임 | 🔴 플래그 OFF라 지금은 검증 불가 |

🔴 **A와 B는 성격이 다르다** — A는 원인, B는 증상이다. **A로 해결되면 B가 필요 없을 수 있다.** §1이 원인을 확정해야 고를 수 있다.

🔴 **판정에 반드시 포함**: **근거 · 대가 · 불리한 사실 · 재검토 조건**.
🔴 **유니버스 보존**(880 교훈): B를 고르면 skip되는 종목도 **행은 써야 한다.** 안 쓰면 크론 자기참조로 **영구 탈락**한다. 판정에 이 조치를 명시한다.
🔴 **DoD 2·4를 다시 판정하지 말 것.** 891이 *"DoD 2는 안 흔든다(완전성만 쟀지 신선도는 다른 축)"*고 정했다. §2 결과가 그걸 뒤집으면 **바꾸지 말고 보고하고 멈춘다.**

## §4 — 문서 · 검증 · 커밋

- `docs/REVDCF_SPEC.md` — **A-11** 재검토 조건을 §3 판정으로 갱신 · **§11 실측 원장**에 주가 민감도 신규 · §10 갱신
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 4 각주의 *"86사 stale"* 항목에 §2 분해 결과 추가. 🔴 **판정 칸 불변.**
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_892_staleness_causal.ts` + `docs/probe_892_staleness_causal.json` — 🔴 **스크립트를 같은 커밋에**(#78)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 892: separate what the stale prices actually cause from what they merely correlate with

- the refresh retries are capped at four hundred symbols and forty seconds, and whatever falls
  outside keeps yesterday's row, so the cause is traced to that cap rather than to the symbols
- the diagnostic that would announce the cap being hit is already computed; where it ends up is
  followed through the code instead of being assumed absent
- the gap difference between stale and fresh companies is re-measured inside each company, by
  running both the stored figure and today's, because a difference between two groups says
  nothing about which one caused it
- a control run on fresh companies asks whether the model is simply sensitive to price, which
  would make this a property rather than a defect
- one remedy is chosen with its cost and what would reopen it; no code is changed here"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 진단 플래그 소비처(있는가/버려지는가) · 최근 실행에서 잘렸다는 관측 흔적(없으면 "관측 불가")
   86사와 STOCK_SYMS 배열 위치 상관 유무 · 🔴 나이 상한 부재 확인
§2 86사 stale↔최신 시총 대조 — 판정 변경 종목 수 · GAP 이동 분포 · 버킷 이동 내역
   🔴 시총 변화율 ↔ GAP 변화 관계(= 주가 민감도, 최초 측정)
   🔴 fresh 대조군 결과 — 신선도 문제인가 모델의 주가 민감도인가
§3 🔴 처방 판정 하나 + 근거·대가·불리한사실·재검토조건 · 유니버스 보존 조치 명시
무변경: lib/app/components/messages/data/.github diff 없음 · DoD 2·4 판정 불변
       REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3 · us_market_cap 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **코드를 고치지 말 것. DoD를 재판정하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
