<!-- STEP 976 착수 전 검색 — 3중 규칙: 측정 설계 전에 ①-A 3회 + ①-B 3회를 먼저 하고 기록한다. -->

# STEP 976 — latestYear() 신선도 스캔 전 검색 기록

## ①-A 원전 3회 — Damodaran이 "항목별 시점 불일치(stale input)"를 다루는가

**1. Damodaran의 "12개월 후행(trailing)" 권고** — 웹검색(다수 출처, `pages.stern.nyu.edu` 밸류에이션 자료 계열)
> *"One of the problems with using financial statements is that they are dated. ... it is better to use 12-month trailing estimates for earnings and revenues than numbers for the most recent financial year. This rule becomes even more critical when valuing companies that are evolving and growing rapidly."*
🔑 Damodaran 본인이 **"연간 재무제표 자체가 낡았다"는 문제의식을 명시적으로 갖고 있다** — 해법은 "TTM을 쓰라"이지 "항목마다 다른 연도를 섞으라"가 아니다. 즉 **모든 항목을 같은(더 최신) 기준시점으로 통일**하는 방향이지, 일부 항목만 몇 년 전 값으로 남기는 것은 원전이 말하는 해법과 반대 방향이다.

**2. Damodaran 데이터 자신도 항목별 갱신주기가 다르다(중요한 대조군)** — 웹검색
> *"He updates his data once a year and will not return to do an update until the following January; the equity risk premiums for the US get updated every month and the equity risk premiums for other countries get a mid-year update."*
🔑 Damodaran의 공개 데이터셋도 **항목마다 갱신주기가 다르다**(업종 배수=연 1회, 미국 ERP=매월, 타국 ERP=반기). 그러나 이건 **각 항목이 "자기 고유의 정상 주기"로 최신인 상태**이지, "이번 회차에 갱신하려던 값을 못 찾아서 몇 년 전 값을 대신 쓰는" 것과는 다르다 — 의도된 다중 주기 vs 의도치 않은 결측 대체는 별개 문제.

**3. Point-in-Time 데이터 무결성(학술)** — 웹검색(Eagle Alpha, Yale SOM 논문 등)
> *"Point-in-Time (PIT) data is essential in quantitative finance as it prevents look-ahead bias... Data providers must ensure PIT integrity through robust collection and revision protocols including timestamping and maintaining data versions."* 실증: *"The absolute variability of quarterly earnings, quarterly sales, and annual accruals attributable to Compustat adjustments averages 100%, 144%, and 129% respectively relative to prior point-in-time figures, with earnings sign flipping approximately 14 percent of the time."*
🔑 상업 데이터 벤더(Compustat)조차 시점 불일치로 인한 변동성이 크다는 것이 **학술 문헌에 실증**돼 있다 — 이 STEP이 다루는 문제군(latestYear류 값 신선도) 자체가 금융데이터 업계에서 알려진 리스크 범주다.

**종합**: 원전은 "항목별로 서로 다른 연도를 섞어 쓰는 것"을 직접 다루지는 않으나, **①연간재무는 원천적으로 dated하다는 문제의식이 있고 ②해법은 "통일된 최신 시점으로 갱신"이지 "일부만 방치"가 아니며 ③업계 전반에 이 리스크가 실증돼 있다.**

---

## ①-B 타 플랫폼 3회 — 항목별 연도 어긋남 처리

| 플랫폼 | 결과 | 확인 내용 |
|---|---|---|
| **stockanalysis.com** | 🟢 방법론 페이지 확인 | 데이터 제공자(S&P Global/Fiscal AI) 사용, **회계연도를 화면에 명시**("Fiscal year is October-September" 식), 실적발표 수분 내 갱신. 결측 항목 처리 정책은 못 찾음. |
| **Bloomberg**(Point-in-Time Data) | 🟢 공식 제품문서 확인 | *"Daily snapshots for every active public company deliver **the latest reported fiscal period data**, latest annual data and LTM data"* — **하나의 스냅샷 안에서 회계기간을 통일**해서 제공(항목마다 다른 연도를 섞지 않음). |
| **Refinitiv**(Reuters Fundamentals) | 🟢 데이터가이드 확인 | `FiscalPeriodEndDate`로 회계기간을 명시하고, **재작성치가 있으면 원본(as-reported)은 아예 제공하지 않는다**(둘을 섞지 않음) — "이번 기간=이 버전 하나"를 강제하는 설계. |
| Koyfin/GuruFocus | 🔴 공식 방법론 못 찾음(부가 확인) | Koyfin은 사용자 포럼에서 **결측 라인아이템 문제가 알려진 미해결 이슈**로 언급됨("total assets가 항목 합계와 안 맞는다") — 공식 정책 문서는 없음. |

🔑 **종합**: 3곳(stockanalysis·Bloomberg·Refinitiv) 모두 **"하나의 보고 시점 안에서는 회계기간을 통일한다"**는 원칙을 확인할 수 있었다(Bloomberg·Refinitiv는 명시적, stockanalysis는 화면표기로 간접 확인). **"항목 A는 최신, 항목 B는 3년 전"을 같은 스냅샷으로 섞어 내보내는 관행은 어디서도 확인되지 않았다** — Koyfin의 사용자 불만 사례가 오히려 "이런 어긋남이 실제로 발생하면 사용자가 알아챈다"는 것을 보여준다.

**우리 상황과의 관계**: `latestYear()`는 "항목별로 최신"이 아니라 "목표연도에 값이 없으면 조용히 더 옛날로 내려간다"는 점에서, 위 3곳의 "회계기간 통일" 원칙과 다른 방향이다. **다만 이건 판정이 아니라 사실 확인이다 — 처방은 4단계에서 후보만 제시한다.**
