# STEP 866D — OTC 티어 교차 + 866C 보고 구멍 2건 (측정 전용 · 소규모)

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

```
@docs/STEP_866D_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `f547d72`(STEP 866C) · 로컬 3커밋 ahead 미푸시 · tsc 0 · vitest 151/151 · `REVDCF_ENABLED` OFF · `revdcf_results` 604×3 · `us_market_cap` 5,886 (전부 무변경 확인됨)

---

## 왜 866D인가

**🔴 OTC는 한 덩어리가 아니다 — 티어가 곧 공시 수준이다**

866C의 `byExchangeField`가 이미 이걸 보여줬는데 **3분류와 교차하지 않았다**:

| 티어 | n |
|---|---|
| OTC Markets **OTCQX** | 32 |
| OTC Markets **OTCQB** | 165 |
| OTC Markets **OTCPK**(Pink) | 144 |
| OTC Markets **OTCID** | 135 |
| YHD | 1 |
| 계(응답) | 477 |

OTC Markets 자체 서술(공식 블로그 2024-10-14 · OTCID 시행 2025-07-01):

> *"The OTCID Basic Market is for companies that meet a **minimal current information standard** and provide management certification, **without the qualitative standards of our OTCQX and OTCQB markets**."*
> 미준수 시 *"Pink Limited Market 또는 Expert Restricted Market으로 이관"*

→ **티어 = 공시 수준의 계단**이다. 그리고 866C 결과의 정체(산출률 10.9%→11.1%, (c)에 320 잔류)는 **공시 문제**였다. 티어별로 갈라보지 않으면 *"OTC는 안 된다"* 와 *"OTC 하위 티어는 안 된다"* 를 구분할 수 없다.

🔴 **이건 Claude Code 누락이 아니다.** 866C 명령서가 `byExchangeField`를 **분포만** 요구했다(Cowork 설계 누락).

**보고 구멍 2건** (코드는 맞고 출력에 안 실림)

1. `otcWithMcap 453` vs `hasMarketCap 446 + hasPriceOnly 30 = 476` — 코드 `149~156`행이 **`computeDrivers`가 `shares`를 낼 때만** `price×shares`를 쓴다(명령서 "추정 금지"대로). 30 중 **7건만** 통과 → 446+7=453. **`mcapSource`를 코드가 추적하는데(162·166행) JSON에 없다.**
2. 응답 477 − 446 − 30 = **1건 미분류.** `85~86`행이 `if / else if`라 **marketCap도 가격도 없는 응답**은 어느 칸에도 안 들어간다.

---

## 🔴 금지사항 (866C와 동일)

`lib/**` 수정 · `us_market_cap`/`revdcf_results` 쓰기 · `data/us_symbols.json` 수정 · `app/**` 수정 · 플래그 변경 · **티어 컷 제안** · `git push`.

🔴 **특히**: *"OTCQX·OTCQB만 넣자"* 같은 문장을 쓰지 말 것. **티어별 숫자만** 내고 멈춘다.

---

## 1단계 — 티어를 행에 붙인다

`scripts/probe_866c_otc_supply.ts`를 수정한다(신규 파일 금지 — 같은 스크립트에 단계 추가).

- 1단계 야후 응답에서 `fullExchangeName`을 **심볼별로 보존**한다(현재는 카운트만 하고 버린다).
- 야후 쿼트 캐시가 남아 있으면 재사용하고, 없으면 **486개만** 다시 조회한다(전수 재실행 금지).
- 티어 정규화: `OTC Markets OTCQX`→`OTCQX` · `OTCQB`→`OTCQB` · `OTCPK`→`PINK` · `OTCID`→`OTCID` · 그 외(`YHD` 포함)→`UNKNOWN`. 🔴 **매핑을 추측으로 늘리지 말 것.**

## 2단계 — 티어 × 결과 교차표

```json
"byTier": {
  "OTCQX": { "n": ?, "quoteOk": ?, "hasMarketCap": ?, "priceOnly": ?,
             "computed": ?, "undecidable": ?, "insufficient": ?,
             "yieldPctOfN": ?,
             "verdictMix": { "years": ?, "over_cap": ?, "value_destroying": ?, "below_one": ? },
             "insufficientBreakdown": { "INSUFFICIENT_HISTORY": ?, "MISSING_TAG": ?, "NO_INDUSTRY": ?, "NO_MARKETCAP": ?, "…": ? },
             "marketCapMedian": ? },
  "OTCQB": { … }, "PINK": { … }, "OTCID": { … }, "UNKNOWN": { … }
}
```

🔴 **대조군을 같은 표에 넣는다**: `EXCHANGE_LISTED`(거래소상장 2,857) 행을 같은 형식으로 한 줄 추가. **티어가 거래소상장과 얼마나 다른지가 재료다.**

🔴 **`INSUFFICIENT_HISTORY`·`MISSING_TAG` 비율을 티어별로** 낼 것. OTC Markets 문서가 말하는 "공시 수준 차이"가 우리 데이터에서 실제로 보이는지 아닌지 — **보이면 보인다고, 안 보이면 안 보인다고** 적는다. 🔴 **문서가 그렇다고 우리 숫자가 그럴 거라 가정하지 말 것.**

## 3단계 — 보고 구멍 2건 메우기

`docs/probe_866c_supply.json`·`docs/probe_866c_output.json`에 **키만 추가**(덮어쓰기 금지):

```json
// supply.json
"quoteReturnedButNoPrice": ?,   // 477 − 446 − 30 = 1 로 예상. 심볼도 같이 적는다
"tallyCheck": "quoteReturned = hasMarketCap + hasPriceOnly + quoteReturnedButNoPrice"

// output.json
"mcapSourceBreakdown": { "marketCap": ?, "priceTimesShares": ?, "none": ? },
"otcWithMcapNote": "otcWithMcap = marketCap ? + priceTimesShares ? = ?. 가격만 있는 30건 중 computeDrivers가 shares를 낸 것만 사용(추정 금지)."
```

## 4단계 — 산출물

`docs/probe_866d_output.json`(1·2단계) · `probe_866c_supply.json`·`probe_866c_output.json` 키 추가 · `docs/STATE.md`·`docs/CHANGELOG.md` 갱신.

## 5단계 — 검증 후 멈춘다

```bash
npx tsc --noEmit && npx vitest run
git diff --stat HEAD -- lib/ app/ data/us_symbols.json docs/probe_survivors.json   # 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3
select count(*) from us_market_cap;                                             -- 5,886
```

**커밋**(push 금지):

```bash
git add scripts/probe_866c_otc_supply.ts docs/probe_866d_output.json \
        docs/probe_866c_supply.json docs/probe_866c_output.json \
        docs/STEP_866D_COMMAND.md docs/STATE.md docs/CHANGELOG.md
git commit -m "STEP 866D: cross OTC tier with outcome buckets, close two reporting gaps (measurement only)

- OTC is not one group: OTCQX 32 / OTCQB 165 / Pink 144 / OTCID 135 per Yahoo fullExchangeName
- OTC Markets states tiers differ in disclosure standard; test whether our data shows it
- tier x bucket table with exchange-listed control row, disclosure-type skip reasons per tier
- report mcapSource split (446 marketCap + 7 price x shares = 453)
- add quoteReturnedButNoPrice bucket (1 symbol fell through if/else-if)
- no writes to us_market_cap or revdcf_results, flag unchanged"
```

## 🔴 마지막

**보고 형식**:

```
티어별 (n / 산출 / 판정불가 / 입력부족 / 산출률(a)÷N / 시총중앙):
  OTCQX ? · OTCQB ? · PINK ? · OTCID ? · UNKNOWN ? · [대조] EXCHANGE_LISTED ?
공시형 결격(INSUFFICIENT_HISTORY+MISSING_TAG) 비율: 티어별 ?% / 거래소상장 ?%
  → OTC Markets 문서의 "티어=공시수준"이 우리 데이터에서 보이나: 보인다 / 안 보인다 (숫자로)
보고 구멍: quoteReturnedButNoPrice ?(심볼 ?) · mcapSource marketCap ? + priceTimesShares ? = 453
무변경 확인 · tsc 0 · vitest ?/?
```

티어 채택·컷에 **의견을 쓰지 말 것.** 판정은 장은태가 한다.
