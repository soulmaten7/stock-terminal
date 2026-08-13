<!-- STEP 1008 — 조사 전용. 코드 수정 0 · DB 쓰기 0. -->
# STEP 1008 — 로컬↔프로덕션 390건 1:1 전수 대조

> 대상 = 1006 P1이 로컬에서 조회했던 정지 코호트 390건 그대로(`docs/probe_1006_yahoo_endpoints.md`의 target 목록). 프로덕션 = `https://onetrillion.app/api/diag/yahoo`(정식 프로덕션 도메인). 8회 분할 호출(`?symbols=` 상한 50), 회차 간 6초 이상 간격. 실행 2026-08-13 11:53:10Z~11:55:42Z(UTC), 총 소요 약 2분32초.
> 🔴 이 문서는 관측 + 설명력 수치만 담는다. 원인 단정·처방 선택은 하지 않는다(STEP1008 §0·§2-3·맨 끝 지시대로 STEP1009 이후로 이관).

## 결론 5줄

1. **환경 차이 코호트가 390건 중 284건(72.8%)** — 로컬에서는 marketCap을 받고 프로덕션에서는 못 받는 심볼. 이게 이 조사의 진짜 대상이다.
2. **역방향(로컬 실패·프로덕션 성공)은 0건** — 프로덕션이 로컬보다 나은 경우는 하나도 없었다. "프로덕션이 열등하다"는 방향은 일관됐다.
3. **가장 강한 단일 축은 거래소가 아니라 티커 길이(≤3자)다** — 설명력(정확도) **92.1%**. 거래소(NYQ)는 **73.4%**로 1006이 "부분신호"라 부른 것이 숫자로도 약함이 확인됐다.
4. **시가총액 규모는 거의 설명력이 없다** — 환경차이 코호트에 $10M대 소형주부터 $300B대 초대형주(HD 등)까지 골고루 섞여 있다. "소형주만의 문제"가 아니다.
5. `USA`는 STEP1007 명령서가 "이중결측"군으로 잘못 분류했다 — 실측은 HD군(부분결측)과 같은 모양이었다. 이 STEP의 전수 대조가 그 수기 분류를 실측으로 대체했다.

## §1. 4분면 표

390건 = 1006 로컬 target 390건 전수(누락 0건, 대조 완료).

| | 프로덕션 ✅(marketCap 있음) | 프로덕션 ❌(marketCap 없음) |
|---|---:|---:|
| **로컬 ✅** | **20건(5.1%)** — 양쪽 정상 | 🔑 **284건(72.8%) — 환경 차이 코호트** |
| **로컬 ❌** | 🔴 **0건(0.0%)** — 역방향 없음 | **86건(22.1%)** — 이중결측(종목 속성) |

🔴 **정정(작성 중 발견 — 최초 초안의 목록이 수기 전사 과정에서 오류가 있어 스크립트 출력으로 전량 교체함)**: 아래 세 목록은 `docs/probe_1006_yahoo_endpoints.md`의 target 390건과 이번 회 8배치 프로덕션 응답을 코드로 조인한 **`quadrants.json`의 원출력 그대로**다(수기 편집 없음).

**양쪽 정상(20건)** — 🔴 이 20건은 STEP1007이 대조군으로 썼던 `AAPL`·`MSFT`·`NVDA`(그쪽은 애초에 이 390건 target에 포함되지 않았다)와 **다른 집합**이다. 여기 20건은 "정지 코호트 390건" 안에서 로컬·프로덕션 둘 다 오늘은 정상인 심볼이다:
`ACM, AFBI, AXIA, BNZI, CAG, EA, EML, EYE, FLY, FNV, GOF, LPRO, MDV, NUE, NUTR, ORLA, SKYT, STRS, TFX, VSEE`

**환경 차이 코호트(284건)**:
`AAP, ADI, AEO, AFB, AGD, AHT, AI, AIB, AIT, AMBO, AMC, AMG, AMH, AMS, AOD, ARAI, ARL, AS, ASA, ASIC, ASR, ASTI, AVBP, AVK, AVX, AZO, BBW, BBY, BDL, BGB, BGH, BHK, BHV, BKE, BLX, BME, BOE, BOX, BRC, BSL, BST, BTO, BTZ, BUI, BVN, BWG, CCU, CEE, CET, CHW, CIG, CIK, CMC, COO, CPB, CRF, CRM, CRS, CVV, CX, CXM, CYD, CYN, DAC, DAL, DBL, DCI, DDS, DHT, DHY, DIT, DOX, DRD, DSS, DY, EBF, ECC, EDD, EDF, EDN, EDSA, EDU, EFT, EL, EMD, EMO, EOT, ERH, ESE, ESP, ETY, EU, EVG, EVV, EXG, FC, FCT, FN, FOF, FRA, FT, FTF, GAB, GAIN, GAP, GDL, GDO, GF, GFI, GGN, GGZ, GIS, GLO, GLQ, GLU, GO, GRX, GSL, GSM, GUT, HD, HEI, HEQ, HHS, HIO, HLX, HMY, HPQ, HQH, HQL, HRL, IBN, ICL, IDT, IGA, IGC, IHD, IHT, IIF, IMO, IOT, IQI, ITT, JCE, JD, JFR, JHI, JOF, JQC, JRS, KAI, KBH, KEN, KMX, KOF, KR, KSS, LBRDK, LGI, LND, LOW, LTM, MANU, MCY, MDT, MGF, MGN, MHD, MIN, MMD, MOV, MRX, MSB, MSM, MU, MUJ, MWG, MXC, MYI, NAC, NAK, NAN, NAT, NAZ, NBB, NBH, NBN, NCA, NCT, NCV, NEA, NGL, NHS, NIO, NL, NMI, NMT, NNY, NOK, NOMD, NRP, NXP, ODC, OLN, ORC, P, PBH, PBM, PC, PCM, PCN, PCQ, PDT, PED, PFL, PGP, PHI, PHK, PHM, PLG, PML, PMO, PMT, PNI, POM, PPL, PPT, PVH, PZG, RCG, RFI, RGC, RGS, RGT, RMCO, RYN, SE, SFL, SID, SIF, SIG, SJT, SKK, SNX, SNYR, SOR, SSL, STK, SWZ, TAL, TEO, TGT, THM, TOL, TRP, TRT, TRX, TS, TTC, TX, TYG, UAN, UEC, UFI, USA, UTF, UUU, VGZ, VHC, VIV, VKQ, VLT, VMO, VOC, VPV, WDC, WDS, WEA, WIW, WMK, WWW, WYY, YRD, ZBIO`

**이중결측(86건, 종목 속성)**:
`AADX, AFGB, AFGC, AFGD, AFGE, AMUB, AQNB, ARTC, ATHS, ATMP, ATTO, BAR, BDCZ, BEPH, BEPI, BEPJ, BHFAL, BIOT, BIPI, BNJ, BPRE, BREZ, CCZ, CDZIP, CITR, DCBG, DDT, DGP, DGZ, DJP, DPU, DTB, DTG, DTK, DTW, DUKB, DZZ, EAI, ELC, ELSE, EMP, ENJ, ENO, FNGD, FNGO, FRTT, FTRA, GJH, GJO, GJP, GJR, GJS, GJT, GRN, GV, JBK, KMPB, KTN, KVAC, LILAP, LSH, MLAA, MLPB, MNSBP, OTAI, PPLC, PSTV, PSUS, PYT, QVCG, RZC, SHOT, SMHB, SOMN, SVA, TOI, TVC, TVE, UCIB, VCX, VII, VXX, VXZ, WAFDP, XELLL, ZTR`

🔴 **역방향 0건의 의미**: "로컬 ❌ / 프로덕션 ✅" 칸이 정말로 0이었다 — 프로덕션이 로컬보다 우월한 경우는 관측되지 않았다. 이건 단순한 "프로덕션이 열등하다"보다 강한 진술이다: 로컬에서 성공하면 프로덕션은 성공하거나 실패하고(20 또는 284), 로컬에서 실패하면 프로덕션도 반드시 실패한다(86, 0). **로컬 성공이 프로덕션 성공의 필요조건**처럼 보인다(충분조건은 아니다 — 284가 그 반례).

## §2. 축별 교차표 + 설명력(정확도)

비교 기준 두 집단: **환경 차이 코호트(284)** vs **양쪽 정상(20)**. 각 축의 "설명력"은 그 축 하나로 이분 분류했을 때의 **정확도**(= (참양성+참음성) / 전체)로 계산한다.

### 2-1. 티커 길이 — 🔑 가장 강한 축

| 길이 | 환경차이(284) | 양쪽정상(20) |
|---|---:|---:|
| ≤3자 | 271(95.4%) | 11(55.0%) |
| =4자 | 12(4.2%) | 9(45.0%) |
| ≥5자 | 1(0.4%) | 0(0.0%) |

가설 "≤3자 → 프로덕션 결측": TP=271 · FN=13(4자 이상인데 결측) · TN=9(4자 이상이고 정상) · FP=11(≤3자인데 정상)
**정확도 = (271+9)/304 = 92.1%**

### 2-2. 거래소(`exchange`/`fullExchangeName`) — 부분신호, 숫자로 확인

🔴 프로덕션 응답 자체엔 환경차이 코호트의 `exchange` 필드가 없다(§4에서 다룸). **1006 로컬 결과의 `exchange` 값을 프록시로 썼다** — 거래소 소속은 하루이틀 사이 바뀌지 않는다는 가정이며, `us_market_cap`·`us_stock_perf`엔 거래소 컬럼이 없어(스키마 확인 완료) DB로 보완 불가했다.

| 거래소 | 환경차이(284, 로컬값) | 양쪽정상(20, 로컬값) |
|---|---:|---:|
| NYQ(NYSE) | 211(74.3%) | 8(40.0%) |
| ASE(NYSE American) | 38(13.4%) | 1(5.0%) |
| NCM(NasdaqCM) | 16(5.6%) | 5(25.0%) |
| NMS(NasdaqGS) | 12(4.2%) | 3(15.0%) |
| NGM(NasdaqGM) | 7(2.5%) | 3(15.0%) |

가설 "NYQ → 프로덕션 결측": TP=211 · FN=73(비NYQ인데 결측) · TN=12(비NYQ이고 정상) · FP=8(NYQ인데 정상)
**정확도 = (211+12)/304 = 73.4%** — 1006이 "부분신호"로만 남긴 것이 숫자로도 확인된다(티커 길이보다 18.7%p 약함).

### 2-3. `quoteType` — 설명력 없음

| | 환경차이(284) | 양쪽정상(20) |
|---|---:|---:|
| EQUITY | 283(99.6%) | 20(100%) |
| ETF | 1(0.4%, `SWZ`) | 0 |

양쪽이 거의 100% EQUITY라 이 축은 두 집단을 전혀 가르지 못한다. 설명력 계산 자체가 무의미한 수준(사실상 상수).

### 2-4. 시가총액 규모(`us_market_cap`, 정지 이전 마지막 값) — 설명력 없음

| 구간 | 환경차이(284) | 양쪽정상(20) | 이중결측(86) |
|---|---:|---:|---:|
| <$0.3B | 99(34.9%) | 7(35.0%) | 5 |
| $0.3~1B | 54(19.0%) | 1(5.0%) | 1 |
| $1~10B | 85(29.9%) | 8(40.0%) | 0 |
| $10~100B | 38(13.4%) | 4(20.0%) | 0 |
| ≥$100B | 8(2.8%, `HD` 포함) | 0 | 0 |
| 미상(`us_market_cap` 값 없음) | 0 | 0 | **80**(🔴 버리지 않고 별도 집계) |

환경차이 코호트와 양쪽정상 코호트의 시총 분포가 **거의 같은 모양**이다(둘 다 <$0.3B~$10B대가 대다수). 소형주만의 문제가 아니다 — $337B짜리 `HD`도 같은 코호트에 있다. 🔴 이중결측(86)의 80건은 `us_market_cap`에 값이 아예 없는 종목(1006의 "neverSucceeded" 80과 정확히 일치) — "미상"으로 분리 집계했다(버리지 않음).

### 2-5. MU(Nasdaq)·CRM(NYSE)·AAPL(Nasdaq) 명시 판정

🔴 `AAPL`은 이 390건 target에 속하지 않는다(1006 정지 코호트 밖 — 원래부터 매일 정상 갱신되는 종목이라 애초에 문제 목록에 없었다). 여기서는 **STEP1007 W2의 별도 12종목 호출**(§1과 다른 모집단)에서 관측된 `AAPL` 결과를 참고로만 끌어온다.

`MU`(390건 target 소속, NMS, 2자)와 `CRM`(390건 target 소속, NYQ, 3자)는 이번 전수 대조에서 둘 다 **환경 차이 코호트**(프로덕션 결측), 1007에서 관측한 `AAPL`(NMS, 4자)은 정상. **거래소만으로는 설명 안 된다**(`MU`·`AAPL`이 같은 NMS인데 결과가 다르다). **티커 길이로는 셋 다 정확히 갈린다**(`MU`·`CRM` ≤3자=결측, `AAPL` 4자=정상). 🔴 **판정: 이 세 종목에 한해서는 거래소 단순 이분법이 아니라 티커 길이가 결과와 일치한다.** (390건 전체 정확도는 §2-1의 92.1%로 이미 수치화됨 — 완전한 설명은 아니다.)

## §3. `longName` — 참고 축(추가 관측)

STEP1007이 `longName` 결측을 지적했는데(라이선스 가설을 약화시키는 근거), 여기서 정량화한다.

| 코호트 | `longName` 있음 |
|---|---:|
| 양쪽정상(20) | 10건(50.0%) |
| 환경차이(284) | **0건(0.0%)** |
| 이중결측(86) | 59건(68.6%, 🔴 아래 참조) |

환경차이 코호트는 **284건 전부** `longName`이 없다 — 1007의 5종목 관측이 전수로 확인됐다. 단 양쪽정상 코호트도 절반만 `longName`이 있어(50%), 이 필드 자체가 완전한 성공 지표는 아니다. 🔴 이중결측(86)의 68.6%가 `longName`을 가진 것은 역설적으로 보이지만, 이 그룹 대부분은 `fields`가 완전히 빈 게 아니라(GV·KVAC·PSTV·ELSE 등 소수만 완전히 빔) **가격은 오되 marketCap만 없는** 우선주·리츠·펀드류라 별도 필드 구성을 갖는다 — 이 STEP은 이 그룹 내부를 더 쪼개지 않았다(미측정으로 남김).

## §4. 필드 키 집합 차집합

**양쪽정상(20) 전원의 프로덕션 응답에 있는데, 환경차이(284) 전원의 응답엔 전혀 없는 키**: `marketCap`, `sharesOutstanding`, `impliedSharesOutstanding`

**환경차이(284) 프로덕션 응답에 있는데 양쪽정상(20)엔 전혀 없는 키**: **(없음)** — 결측군의 필드는 정상군 필드의 부분집합이다. 새로 추가되는 필드는 없다.

🔴 환경차이 코호트의 프로덕션 응답엔 `exchange`·`fullExchangeName`·`quoteType`·`marketState`가 **살아 있다**(§2-2에서 프록시가 아니라 이 필드들 자체는 실제로 옴 — 1007의 HD·LOW·TGT·MU·CRM 원문에서 이미 확인됐고 이번 284건 전수에서도 재확인). **오직 시총·주식수 계열 3개만 빠진다.**

## §5. 회차별 리전

| 회차 | 심볼 수 | 시작(UTC) | 종료(UTC) | `vercelRegion` | `vercelEnv` |
|---|---:|---|---|---|---|
| 0 | 50 | 11:53:11.402Z | 11:53:24.980Z | iad1 | production |
| 1 | 50 | 11:53:31.556Z | 11:53:44.544Z | iad1 | production |
| 2 | 50 | 11:53:51.467Z | 11:54:04.845Z | iad1 | production |
| 3 | 50 | 11:54:11.445Z | 11:54:24.694Z | iad1 | production |
| 4 | 50 | 11:54:31.230Z | 11:54:44.299Z | iad1 | production |
| 5 | 50 | 11:54:50.910Z | 11:55:05.250Z | iad1 | production |
| 6 | 50 | 11:55:11.884Z | 11:55:24.882Z | iad1 | production |
| 7 | 40 | 11:55:31.464Z | 11:55:42.317Z | iad1 | production |

🔴 **리전 드리프트 없음** — 8회 전부 `iad1`. "회차마다 다른 서버리스 인스턴스가 뜬다"는 있을 수 있는 가설이지만, 적어도 리전 수준에서는 8회 동안 고정이었다(인스턴스 ID까지는 관측 불가 — 아래 미측정 참조).

## §6. 🔴 `USA` 분류 오류 정정 (STEP1008 §1 지시)

STEP1007 명령서 §2 W2가 진단 엔드포인트 기본 목록을 짜면서 `USA`를 `GV`·`KVAC`·`PSTV`와 같은 **"양쪽 실패 · 이중결측군"**으로 분류했다. 그러나 실측(1007 W2, 이번 1008 전수 재확인)은 다르다 — `USA`는 `regularMarketPrice`가 있고 `exchange`·`quoteType`·`fields`(63개)가 전부 존재하는 **부분결측**(marketCap·sharesOutstanding만 없음) 상태이고, 이는 `HD`·`LOW`·`TGT`·`MU`·`CRM`과 **같은 모양**이다. 이번 전수 대조에서 `USA`는 **환경 차이 코호트(284건)**에 속한다. **원인은 Cowork(1006 결과를 명령서에 옮기며 수기 분류)이었다** — 이 STEP의 전수 대조가 그 수기 분류를 실측으로 대체하는 목적을 겸했다(STEP1008 §1 원문).

## §7. `revdcf` heartbeat(오늘 밤 크론)

이 STEP 작업 시각(2026-08-13 11:53~11:59 UTC)은 `revdcf` 크론 예정 시각(22:45 UTC)보다 **훨씬 이르다** — 아직 지나지 않았다. `cron_heartbeats` 조회(읽기만, 크론 미호출) 결과 여전히 4행(`email-brief`·`jp-disclosures`·`kr-lens-scores`·`lens-scores`)뿐이고 `revdcf` 행은 없다 — 예상대로다. 🔴 **다음 정규 크론(22:45 UTC) 이후 확인**으로 남긴다. `BUDGET_MS` 판정은 여기서 하지 않는다(지시대로).

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 서버리스 **인스턴스 단위** 식별(리전 아래 단계) — Vercel 진단 도구가 노출하지 않는다.
- 이중결측(86) 그룹 내부를 우선주·ETN·REIT·펀드 등으로 세분하지 않았다(§3에서 발견만 하고 안 쪼갬).
- `longName`을 제외한 다른 메타데이터 필드(`epsForward`·`priceToBook` 등)의 결측 패턴은 안 봄 — `marketCap` 계열 3개만 대상으로 했다(STEP 지시 범위).
- exchange 축은 프로덕션 응답 자체엔 없어 로컬(1006) 값을 프록시로 썼다 — 오늘 실제 거래소 소속이 다를 가능성은 이론상 있으나 검증 안 함(사실상 무시 가능한 위험으로 판단, 확정은 아님).

**철회·정정한 것**
- STEP1007 명령서의 `USA` "이중결측" 분류 — §6에서 정정.
- 1006이 "부분신호"로만 남긴 거래소 가설을 73.4% 정확도로 정량화(철회는 아니고 정밀화).

**미측정으로 남은 것**
- 환경 차이의 **근본 원인**(IP·리전 내부 라우팅·야후 서버측 요청자 식별 등) — 이 STEP은 "무엇이 갈리는지"만 쟀고 "왜 갈리는지"는 안 쟀다.
- `revdcf` heartbeat 6구간 실측값(다음 크론 이후).
- 티커 길이(≤3자) 자체가 원인일 수는 없다(야후가 티커 문자수로 응답을 바꿀 이유가 없다) — **진짜 원인의 대리 변수(proxy)일 가능성**이 높다는 점은 적어두지만, 무엇의 대리인지는 미확정.

🔴 **판정(취득 경로 변경·`BUDGET_MS` 조정·게이트 임계)은 STEP 1009 이후로 이관한다. 이 STEP에서 고르지 않았다.**
