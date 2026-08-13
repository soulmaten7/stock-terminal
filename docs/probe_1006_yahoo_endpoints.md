<!-- STEP 1006 P1 — 조사 전용. 코드 수정 0 · DB 쓰기 0 · 크론 미호출. 원인 단정 없음, 관측값만. -->
# STEP 1006 P1 — 야후 엔드포인트별 응답 비교 (373건 전수 + 대조군)

> 원자료 = `scripts/probe_1006_yahoo_endpoints.ts` 실행 결과. 실행일 2026-08-13.
> 🔴 이 문서는 **관측만** 담는다. 가설은 「가설」이라 명시하고, 판정은 하지 않는다(STEP 1007로 넘김).

## 표본 구성 (전수, 실행 시점 기준)

`us_market_cap` 실측(2026-08-13 기준, STEP 배경의 373건과 소폭 차이 — 하루 경과분):

| 구분 | 건수 |
|---|---:|
| `as_of ≠ 최신(2026-08-12)`(정지 코호트) | 310 |
| 한 번도 성공 못 함(`never succeeded`) | 80 |
| **target 합계(전수, 표본 아님)** | **390** |
| control(대조군, 길이분포 매칭) | 390 |

target 티커 길이 분포: `≤3자 322(82.6%) · 4자 61(15.6%) · ≥5자 7(1.8%)`. control은 fresh(정상취득) 풀에서 이 분포를 그대로 맞춰(결정론적, 정렬 후 앞에서부터) 390건을 뽑았다.

## 경로 3개 × 필드별 확보율

| 경로 | 필드 | target(390) | control(390) |
|---|---|---|---|
| `yf.quote()` | 응답 성공 | 390/390 (100.0%) | 390/390 (100.0%) |
| `yf.quote()` | `marketCap` 보유 | **304/390 (77.9%)** | **390/390 (100.0%)** |
| `yf.quote()` | `regularMarketPrice` 보유 | 384/390 (98.5%) | 390/390 (100.0%) |
| `yf.quote()` | `sharesOutstanding` 보유 | 323/390 (82.8%) | 390/390 (100.0%) |
| `yf.chart()` | 응답 성공 | 390/390 (100.0%) | 390/390 (100.0%) |
| `yf.chart()` | 마지막 종가 보유 | 378/390 (96.9%) | 390/390 (100.0%) |
| `yf.quoteSummary()` | 응답 성공 | 381/390 (97.7%) | 390/390 (100.0%) |
| `yf.quoteSummary()` | `price.marketCap` 보유 | 289/390 (74.1%) | 390/390 (100.0%) |
| `yf.quoteSummary()` | `defaultKeyStatistics.sharesOutstanding` 보유 | 297/390 (76.2%) | 390/390 (100.0%) |

🔑 **핵심 관측 1 — target 코호트도 대부분 marketCap을 준다, 지금(오늘) 직접 조회하면.** production에서 07-30 이후 14일간 못 받은 373건(오늘 기준 390건) 중 **304건(77.9%)이 오늘 이 스크립트의 독립적인 `yf.quote()` 호출에서는 marketCap을 정상적으로 받았다.** 이는 "이 종목들은 야후에서 marketCap을 원래 안 준다"는 가설과 배치된다.

🔑 **핵심 관측 2 — `quoteSummary()`는 `quote()`가 놓친 것을 거의 못 건진다.** `quote()`로 marketCap을 못 받은 86건 중 `quoteSummary()`가 추가로 회복시킨 건 **단 1건(`ELSE`)뿐**이다. 두 경로의 결측 사유가 사실상 같다 — `quoteSummary()`는 97% 게이트를 열 수 있는 별도 경로가 아니다.

## `quote()`+`quoteSummary()` 둘 다 marketCap을 못 준 진짜 결측 — 85건(21.8%)

두 경로의 합집합으로도 marketCap을 못 얻은 종목은 **85건**(둘 중 하나라도 확보 = 305/390 = 78.2%).

**quoteType 분포(85건)**: `EQUITY 64 · ETF 16 · (quote 자체 실패/무응답) 5`
**fullExchangeName 분포(85건)**: `NYSE 47 · NYSEArca 13 · NasdaqGM 9 · (없음) 5 · NasdaqGS 4 · Cboe US 3 · NasdaqCM 3 · NYSE American 1`

**심볼 목록(85건 전체)**:
```
LSH TOI PSTV GV KVAC AADX AFGB AFGC AFGD AFGE AMUB AQNB ARTC ATHS ATMP ATTO BAR BDCZ BEPH BEPI BEPJ
BHFAL BIOT BIPI BNJ BPRE BREZ CCZ CDZIP CITR DCBG DDT DGP DGZ DJP DPU DTB DTG DTK DTW DUKB DZZ EAI ELC
EMP ENJ ENO FNGD FNGO FRTT FTRA GJH GJO GJP GJR GJS GJT GRN JBK KMPB KTN LILAP MLAA MLPB MNSBP OTAI
PPLC PSUS PYT QVCG RZC SHOT SMHB SOMN SVA TVC TVE UCIB VCX VII VXX VXZ WAFDP XELLL ZTR
```

**관측(가설 아님)**: 이 85건을 육안으로 훑으면 우선주(`AFGB`·`AFGC`·`AFGD`·`AFGE`·`WAFDP`·`DUKB`·`KMPB`·`MNSBP` 등)·레버리지/인버스 상품ETN(`DGP`·`DGZ`·`DJP`·`DZZ`·금 관련, `FNGD`·`FNGO` — FANG+ 레버리지)·변동성 상품(`VXX`·`VXZ` — VIX 연계 ETN)이 다수 눈에 띈다. `GV`·`KVAC`·`PSTV`는 **STEP987이 이미 "무응답 3건"으로 확인했던 바로 그 심볼**과 정확히 일치한다(재현 — 새 발견 아님, 기존 결과와 정합).

## quoteType·exchange 분포 — target(전체 390) vs control(전체 390)

| | target(390) | control(390) |
|---|---|---|
| **quoteType** | `EQUITY 367(94.1%) · ETF 17(4.4%) · (없음) 6(1.5%)` | `EQUITY 390(100%)` |
| **exchange(fullExchangeName)** | `NYSE 266(68.2%) · NYSE American 40(10.3%) · NasdaqCM 24(6.2%) · NasdaqGS 19(4.9%) · NasdaqGM 19(4.9%) · NYSEArca 13(3.3%) · (없음) 6 · Cboe US 3(0.8%)` | `NYSE 238(61.0%) · NasdaqGS 56(14.4%) · NasdaqCM 43(11.0%) · NasdaqGM 36(9.2%) · NYSE American 17(4.4%)` |

**관측(가설 아님)**: target은 NYSE American·NYSEArca·Cboe US(비-메인보드/대안 거래소) 합산 비중이 **14.4%**(40+13+3=56/390)인 반면 control은 NYSE American만 **4.4%**(17/390)로, NYSEArca·Cboe US는 0건이다. 방향은 "거래소 실시간 시세 라이선스" 가설과 일치하나, **양쪽 다 NYSE(NYQ)가 최대 단일 비중**(target 68.2%·control 61.0%)이라 이 가설이 결측을 전부 설명하지는 못한다 — 부분적 신호로만 기록한다.

## 대형주 5종목 원본 응답 (HD·LOW·TGT·MU·CRM)

🔑 **관측 — 다섯 종목 전부, 오늘 이 세션의 독립 조회에서 `quote()`·`chart()`·`quoteSummary()` 세 경로 모두 완전한 데이터를 받았다.** (원문은 아래 그대로.)

```json
HD: { quote: { ok:true, marketCap:342439755776, regularMarketPrice:343.43, sharesOutstanding:997116682, quoteType:"EQUITY", exchange:"NYQ", fullExchangeName:"NYSE" }, chart: { ok:true, hasLastClose:true, lastClose:343.42999267578125 }, quoteSummary: { ok:true, priceMarketCap:342439755776, dksSharesOutstanding:997116682 } }

LOW: { quote: { ok:true, marketCap:121095905280, regularMarketPrice:215.97, sharesOutstanding:560707041, quoteType:"EQUITY", exchange:"NYQ", fullExchangeName:"NYSE" }, chart: { ok:true, hasLastClose:true, lastClose:215.97000122070312 }, quoteSummary: { ok:true, priceMarketCap:121159172096, dksSharesOutstanding:561000000 } }
// 🔴 참고: quote()와 quoteSummary()의 marketCap이 미세하게 다르다(121,095,905,280 vs 121,159,172,096) — 두 엔드포인트가 내부적으로 다른 시점/다른 산식(shares×price 재계산 등)을 쓸 수 있음을 보여주는 관측(원인 미조사, 이번 STEP 범위 밖).

TGT: { quote: { ok:true, marketCap:69945425920, regularMarketPrice:154, sharesOutstanding:454191112, quoteType:"EQUITY", exchange:"NYQ", fullExchangeName:"NYSE" }, chart: { ok:true, hasLastClose:true, lastClose:154 }, quoteSummary: { ok:true, priceMarketCap:69945425920, dksSharesOutstanding:454191112 } }

MU: { quote: { ok:true, marketCap:1029204672512, regularMarketPrice:911.29, sharesOutstanding:1129393151, quoteType:"EQUITY", exchange:"NMS", fullExchangeName:"NasdaqGS" }, chart: { ok:true, hasLastClose:true, lastClose:911.2899780273438 }, quoteSummary: { ok:true, priceMarketCap:1029204672512, dksSharesOutstanding:1129393151 } }

CRM: { quote: { ok:true, marketCap:158329094144, regularMarketPrice:193.32, sharesOutstanding:819000000, quoteType:"EQUITY", exchange:"NYQ", fullExchangeName:"NYSE" }, chart: { ok:true, hasLastClose:true, lastClose:193.32000732421875 }, quoteSummary: { ok:true, priceMarketCap:158329094144, dksSharesOutstanding:819000000 } }
```

**의미(관측만, 판정 아님)**: "HD·LOW·TGT가 야후에서 조회 불가일 리는 없다"는 배경 서술이 실측으로 확인됐다 — 셋 다(및 MU·CRM도) 오늘 직접 조회에서 완전한 데이터를 받는다. 07-30 production 정지는 이 5종목의 데이터 자체가 야후에 없어서가 아니다.

## 재구성(986) 컷 개방 여부 재확인

배경(heartbeat)의 `reconstructable 17`·`wouldBeCoverage 94.04%`는 이번 조사로 바뀌지 않는다 — 이번 조사는 **오늘 이 세션에서 독립적으로 조회했을 때의 응답**이지, production의 그 시점 응답을 재현한 것이 아니다. `quoteSummary()`가 추가로 여는 문도 1건뿐임을 확인했으므로(위), **quoteSummary 경로로 97% 게이트를 넘기는 것도 어렵다**는 관측을 더한다.

## 실패 사유(에러) 집계

`quote()`·`chart()`는 target·control 모두 응답 실패(예외) 0건 — 전부 정상 HTTP 응답이었다(에러가 나서 실패한 게 아니라 필드가 비어서 실패한 것, 배경의 heartbeat 관측과 일치). `quoteSummary()`는 target에서 9건 예외(381/390 성공) — 사유는 원자료(`/tmp/step1006_raw_results.json`, 커밋 안 됨·재현용 스크립트만 커밋)에 기록, 대부분 스키마 검증 실패(yahoo-finance2 라이브러리의 알려진 이슈, 버전 3.15.4)로 추정되나 이번엔 개별 사유까지 파고들지 않았다(못 한 것으로 남김).

## 🔴 하지 않은 것 (지시대로)

`lib/lensPrecompute.ts` 무수정 · 취득 경로 무변경 · `us_market_cap` 쓰기 0 · 게이트 임계(97/95) 무변경 · `data/us_symbols.json` 무수정.

## 못 한 것 / 미측정

- `quoteSummary()` 9건 예외의 개별 사유(스택트레이스) — 원자료엔 있으나 이 문서에 정리 안 함
- production 환경(Vercel) 자체에서 같은 조회를 재현한 것이 아니다 — **이 결과는 "오늘 로컬/이 세션에서 독립 조회하면"의 값이지, "07-30 production에서 무슨 일이 있었는지"를 직접 증명하지 않는다.** 305/390(78.2%)이 지금은 받아진다는 것은 "영구 결측이 아니다"의 강한 증거이지, "07-30에 정확히 무엇이 있었는지"의 증거는 아니다.
- 85건 "진짜 결측"의 개별 상품 유형(우선주·ETN·CEF 등) 분류는 육안 훑음 수준이며 전수 분류표는 만들지 않음
