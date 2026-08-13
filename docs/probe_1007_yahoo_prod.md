<!-- STEP 1007 W2 — 조사 전용. DB 쓰기 0. -->
# STEP 1007 W2 — `/api/diag/yahoo` 프로덕션 실측

> 호출 대상 = `https://onetrillion.app/api/diag/yahoo`(정식 프로덕션 도메인, `docs/PROD_ACCESS_ANSWER2_2026-08-02.md` §2 확정값). 1회 호출, 2026-08-13T11:42:58.936Z(UTC) 시작 · 11:43:02.295Z 종료(3.36초, 12종목 · 동시성1 · 200ms간격).
> 🔴 `vercelRegion=iad1` · `vercelEnv=production`.
> 🔴 이 문서는 관측만 담는다. 원인 단정은 하지 않는다(STEP1007 §2 W2 지시대로).

## 결론 3줄

1. **환경 차이가 확정됐다.** HD·LOW·TGT·MU·CRM 5종목 전부 프로덕션에서 `marketCap: false`(결측) — 1006이 **오늘 로컬에서는 5종목 전부 완전 데이터**였던 바로 그 대조다.
2. **대조군(AAPL·MSFT·NVDA)은 프로덕션에서도 정상**(`marketCap: true`) — "야후가 전면 차단"이 아니라 **특정 종목군만** 결측이라는 것이 확인됐다.
3. **`GV`·`KVAC`·`PSTV`는 완전 결측**(응답 자체가 빈 객체, `fields: []`)이 프로덕션에서도 재현 — 987·1006과 세 번째 독립 재현. `USA`는 1007이 처음 프로덕션에서 확인했는데, 이 3종목과 **다른 패턴**(가격은 오되 시총만 없음, HD군과 같은 모양)이었다 — STEP1007 명령서가 `USA`를 "양쪽 실패(이중결측)"군으로 분류했으나 **이 프로덕션 결과는 그 분류와 다르다**(아래 §3에 그대로 남김).

## §1. 로컬(1006) ↔ 프로덕션(1007) 대조표

| 심볼 | 1006 로컬 marketCap | 1007 프로덕션 marketCap | 일치? |
|---|:--:|:--:|:--:|
| HD | ✅ 있음(342,439,755,776) | 🔴 **없음** | ❌ **불일치 — 환경차이** |
| LOW | ✅ 있음(121,095,905,280) | 🔴 **없음** | ❌ **불일치 — 환경차이** |
| TGT | ✅ 있음(69,945,425,920) | 🔴 **없음** | ❌ **불일치 — 환경차이** |
| MU | ✅ 있음(1,029,204,672,512) | 🔴 **없음** | ❌ **불일치 — 환경차이** |
| CRM | ✅ 있음(158,329,094,144) | 🔴 **없음** | ❌ **불일치 — 환경차이** |
| AAPL | (1006 대상 밖 — 대조군으로만 지정, 실측 없음) | ✅ 있음 | 대조군 정상 |
| MSFT | (1006 대상 밖) | ✅ 있음 | 대조군 정상 |
| NVDA | (1006 대상 밖) | ✅ 있음 | 대조군 정상 |
| GV | 🔴 없음(응답 자체 결측, 987 재현) | 🔴 없음(`fields: []`) | ✅ 일치 — 종목 자체 문제 |
| KVAC | 🔴 없음(응답 자체 결측, 987 재현) | 🔴 없음(`fields: []`) | ✅ 일치 — 종목 자체 문제 |
| PSTV | 🔴 없음(응답 자체 결측, 987 재현) | 🔴 없음(`fields: []`) | ✅ 일치 — 종목 자체 문제 |
| USA | (1006 대상 밖 — 명령서가 이중결측군으로 분류) | 🔴 없음, 단 `regularMarketPrice: true`(HD군과 같은 부분결측 패턴) | 🔴 **명령서 분류와 다름 — §3 참조** |

## §2. `fields` 배열의 구조적 신호

HD·LOW·TGT·MU·CRM·USA(프로덕션 결측군)의 `fields` 배열에는 **`marketCap`·`sharesOutstanding`·`longName`·`impliedSharesOutstanding`가 아예 없다**(null이 아니라 키 자체가 없음). AAPL·MSFT·NVDA(정상군)의 `fields`엔 이 4개가 전부 있다. 🔴 이건 "야후가 필드를 null로 준다"가 아니라 **"야후가 이 필드들을 응답 객체에서 통째로 뺀다"**는 뜻이다 — quote() 응답의 필드 구성 자체가 종목군에 따라 다르다.

## §3. 🔴 명령서 분류와 어긋난 것 — `USA`

STEP1007 §2 W2 원문은 `USA`를 `GV,KVAC,PSTV`와 같은 **"양쪽 실패 · 이중결측군"**으로 지정했다. 그러나 이번 프로덕션 실측에서 `USA`는 `GV`·`KVAC`·`PSTV`처럼 응답이 완전히 비지 않았다 — `regularMarketPrice: true`이고 `exchange`·`quoteType`·`fields`(63개)가 전부 존재한다. 실제로는 **HD 그룹과 같은 모양**(가격은 있고 시총·주식수만 없음)이다. 🔴 이 분류 차이의 원인은 조사하지 않았다(1006이 어떤 근거로 `USA`를 이중결측군에 넣었는지는 이 STEP 범위 밖) — 사실만 남긴다.

## §4. 프로덕션 응답 원문(요약 없이 그대로)

```json
{
  "env": { "vercelRegion": "iad1", "vercelEnv": "production" },
  "startedAt": "2026-08-13T11:42:58.936Z",
  "finishedAt": "2026-08-13T11:43:02.295Z",
  "requested": 12,
  "results": [
    {
      "symbol": "HD", "ok": true,
      "has": { "marketCap": false, "regularMarketPrice": true, "sharesOutstanding": false },
      "quoteType": "EQUITY", "exchange": "NYQ", "fullExchangeName": "NYSE", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","isEarningsDateEstimate","language","market","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "LOW", "ok": true,
      "has": { "marketCap": false, "regularMarketPrice": true, "sharesOutstanding": false },
      "quoteType": "EQUITY", "exchange": "NYQ", "fullExchangeName": "NYSE", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","isEarningsDateEstimate","language","market","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "TGT", "ok": true,
      "has": { "marketCap": false, "regularMarketPrice": true, "sharesOutstanding": false },
      "quoteType": "EQUITY", "exchange": "NYQ", "fullExchangeName": "NYSE", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","isEarningsDateEstimate","language","market","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "MU", "ok": true,
      "has": { "marketCap": false, "regularMarketPrice": true, "sharesOutstanding": false },
      "quoteType": "EQUITY", "exchange": "NMS", "fullExchangeName": "NasdaqGS", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsCallTimestampEnd","earningsCallTimestampStart","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","isEarningsDateEstimate","language","market","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "CRM", "ok": true,
      "has": { "marketCap": false, "regularMarketPrice": true, "sharesOutstanding": false },
      "quoteType": "EQUITY", "exchange": "NYQ", "fullExchangeName": "NYSE", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsCallTimestampEnd","earningsCallTimestampStart","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","isEarningsDateEstimate","language","market","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "AAPL", "ok": true,
      "has": { "marketCap": true, "regularMarketPrice": true, "sharesOutstanding": true },
      "quoteType": "EQUITY", "exchange": "NMS", "fullExchangeName": "NasdaqGS", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsCallTimestampEnd","earningsCallTimestampStart","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","impliedSharesOutstanding","isEarningsDateEstimate","language","longName","market","marketCap","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","sharesOutstanding","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "MSFT", "ok": true,
      "has": { "marketCap": true, "regularMarketPrice": true, "sharesOutstanding": true },
      "quoteType": "EQUITY", "exchange": "NMS", "fullExchangeName": "NasdaqGS", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsCallTimestampEnd","earningsCallTimestampStart","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","impliedSharesOutstanding","isEarningsDateEstimate","language","longName","market","marketCap","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","sharesOutstanding","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    {
      "symbol": "NVDA", "ok": true,
      "has": { "marketCap": true, "regularMarketPrice": true, "sharesOutstanding": true },
      "quoteType": "EQUITY", "exchange": "NMS", "fullExchangeName": "NasdaqGS", "marketState": "PRE",
      "fields": ["ask","askSize","averageAnalystRating","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","displayName","dividendDate","dividendRate","dividendYield","earningsCallTimestampEnd","earningsCallTimestampStart","earningsTimestamp","earningsTimestampEnd","earningsTimestampStart","epsCurrentYear","epsForward","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","forwardPE","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","impliedSharesOutstanding","isEarningsDateEstimate","language","longName","market","marketCap","marketState","messageBoardId","nameChangeDate","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","prevName","priceEpsCurrentYear","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","sharesOutstanding","shortName","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    },
    { "symbol": "GV", "ok": true, "has": { "marketCap": false, "regularMarketPrice": false, "sharesOutstanding": false }, "fields": [] },
    { "symbol": "KVAC", "ok": true, "has": { "marketCap": false, "regularMarketPrice": false, "sharesOutstanding": false }, "fields": [] },
    { "symbol": "PSTV", "ok": true, "has": { "marketCap": false, "regularMarketPrice": false, "sharesOutstanding": false }, "fields": [] },
    {
      "symbol": "USA", "ok": true,
      "has": { "marketCap": false, "regularMarketPrice": true, "sharesOutstanding": false },
      "quoteType": "EQUITY", "exchange": "NYQ", "fullExchangeName": "NYSE", "marketState": "PRE",
      "fields": ["ask","askSize","averageDailyVolume10Day","averageDailyVolume3Month","bid","bidSize","bookValue","corporateActions","cryptoTradeable","currency","customPriceAlertConfidence","dividendRate","dividendYield","epsTrailingTwelveMonths","esgPopulated","exchange","exchangeDataDelayedBy","exchangeTimezoneName","exchangeTimezoneShortName","fiftyDayAverage","fiftyDayAverageChange","fiftyDayAverageChangePercent","fiftyTwoWeekChangePercent","fiftyTwoWeekHigh","fiftyTwoWeekHighChange","fiftyTwoWeekHighChangePercent","fiftyTwoWeekLow","fiftyTwoWeekLowChange","fiftyTwoWeekLowChangePercent","fiftyTwoWeekRange","financialCurrency","firstTradeDateMilliseconds","fullExchangeName","gmtOffSetMilliseconds","hasPrePostMarketData","language","market","marketState","messageBoardId","preMarketChange","preMarketChangePercent","preMarketPrice","preMarketTime","priceHint","priceToBook","quoteSourceName","quoteType","region","regularMarketChange","regularMarketChangePercent","regularMarketDayHigh","regularMarketDayLow","regularMarketDayRange","regularMarketOpen","regularMarketPreviousClose","regularMarketPrice","regularMarketTime","regularMarketVolume","sourceInterval","symbol","tradeable","trailingAnnualDividendRate","trailingAnnualDividendYield","trailingPE","triggerable","twoHundredDayAverage","twoHundredDayAverageChange","twoHundredDayAverageChangePercent","typeDisp"]
    }
  ]
}
```

## 못 한 것 / 미측정

- **반복 관측이 아니다** — 1회 호출뿐. 같은 5종목이 매번 프로덕션에서 결측인지, 아니면 이번 실행에서만 그런지는 **이 STEP 범위 밖**(반복 호출은 다음 STEP 판단 사항).
- **왜** 환경이 다른지는 여전히 모른다(IP·리전·야후 백엔드 라우팅 등 — 1006 §1-D의 가설 후보 그대로 미확정).
- `USA`가 명령서의 "이중결측" 분류와 다르게 나온 이유는 조사하지 않았다.
- `marketState: "PRE"`(프리마켓)가 원인에 영향을 주는지는 확인 안 됨 — 호출 시각(11:43 UTC = 07:43 EDT, 개장 전)이 우연히 걸린 것일 수 있다.
