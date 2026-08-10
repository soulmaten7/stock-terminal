<!-- STEP 974 §2단계 착수 전 검색 — 3중 규칙: 코드를 쓰기 전에 ①-A 3회 + ①-B 3회를 먼저 하고 기록한다. -->

# STEP 974 — 크론 배선 전 검색 기록

## A-0 (우리 자산 — 검색 전 먼저 확인)

`data/sources/README.md`에 이미 있는 사실:
- Damodaran `indname.xls` 등 8개 xls — 매년 1월 "Data Update" 시리즈로 갱신(`damodaran_data_update_1_2026.html` 원문 보존, "Data Update 1 for 2026").
- 나스닥 스크리너(`nasdaq_screener_20260808.json`) — **응답 자체에 `as_of`가 없다**(939 확인). 우리가 취득 시각을 `as_of`로 찍는 구조.
- 야후 `assetProfile` — 마찬가지로 응답에 기준일 없음, 취득 시각을 `as_of`로 찍음.
- SPDR 섹터 홀딩스(`spdr_sector_holdings_2026-08-06.json`) — 🔴 **유일하게 출처가 기준일을 준다**("Holdings: As of {date}"), **지수 리밸런싱마다 바뀐다**고 이미 기록돼 있음.

→ 이미 가진 자산만으로도 "섹터 분류는 저빈도"라는 방향은 서 있었다. 아래는 이걸 원전·타 플랫폼으로 뒷받침·대조한 결과.

---

## ①-A 원전 3회

**1. Damodaran 본인 — 갱신 주기**
검색: "Aswath Damodaran industry data update frequency annual January Data Update"
> *"For the last four decades, Aswath Damodaran has spent the first week of each year collecting and analyzing data on publicly traded companies."* — 2023/2025/2026년 블로그 포스트("Data Update 1 for 2023/2025/2026") 다수 확인.
결론: **연 1회, 매년 1월 첫 주.** A-0의 기존 기록과 일치(재확인).

**2. GICS(S&P/MSCI 공동 소유, 우리가 매핑 근거로 쓰는 진짜 분류체계) — 검토 주기**
검색: "GICS Global Industry Classification Standard review schedule semi-annual effective date"
> *"Standard & Poor's and MSCI review the GICS structure on an annual basis"* + *"GICS classifications are... continuously monitored for corporate actions"* + MSCI Semi-Annual Index Review 사례(2018-12-03 발효).
결론: **구조 자체는 연 1회 검토**, 개별 종목의 GICS 배정은 기업 이벤트(합병·분사 등) 발생 시 그때그때 반영 — "매일" 성격의 갱신이 아니다.

**3. SEC — SIC 코드 배정·변경 정책**
검색: "SEC EDGAR SIC code assignment update policy how often changes"
> *"The SEC reviews all requests for SIC changes once-a-year starting in June."* 변경 요청은 이메일로 하며, **처리 후 다음 제출(filing)이 들어와야 EDGAR 프로필에 반영**된다.
결론: **연 1회 검토 창(6월 시작) + 이벤트(제출) 트리거.** 날짜 주기가 아니라 "회사가 요청하고 제출해야 바뀐다"는 구조 — 우리가 매일 재조회해도 바뀔 일이 거의 없다는 뜻.

🔑 **①-A 종합**: 세 원전(Damodaran·GICS·SEC) 전부 **연 단위 또는 이벤트 트리거**다. "매일 도는 크론"과 "섹터 분류"는 원천적으로 갱신 주기가 다른 두 축이라는 973의 판단(신선도 상한 미설정)이 세 원전 모두에서 뒷받침된다.

---

## ①-B 타 플랫폼 실무 3회

**1. Nasdaq 공개 스크리너 API(우리가 crossCheck에 쓰는 그 소스) — 갱신 주기 공식 문서**
검색: "Nasdaq API screener sector classification data update frequency source"
> 검색 결과로는 **정확한 갱신 주기가 공식 문서에 명시돼 있지 않다**(공개 스크리너는 비공식 엔드포인트). "정확한 답은 나스닥 공식 문서를 직접 확인해야 한다"는 결론뿐.
결론: **못 찾음 — 명시 안 함.** A-0의 "응답에 as_of 없음" 관찰과 일치(우리도 못 찾은 게 아니라 원래 공개돼 있지 않은 정보).

**2. SPDR Select Sector ETF(우리 sectorSource="spdr"의 원천) — 리밸런스 일정**
검색: "SPDR sector ETF GICS rebalance quarterly reconstitution schedule"
> *"The Select Sector Indices are rebalanced quarterly after the close of the third Friday in March, June, September and December."*
결론: **분기 1회, 정확한 날짜가 공개돼 있다.** 우리가 쓰는 4개 소스 중 유일하게 "언제 다음이 바뀌는지"를 미리 알 수 있는 소스 — 신선도 상한을 나중에 도입한다면 이 소스부터 "분기"를 기준으로 잡을 수 있다는 뜻(이번엔 도입하지 않음, §5 참조).

**3. 개인용 스크리너 플랫폼(stockanalysis.com·Wisesheets) — 섹터 데이터 갱신 정책**
검색: "stockanalysis.com OR wisesheets sector classification data source update how often"
> stockanalysis.com은 **실적(earnings) 데이터의 갱신 시점**(발표 후 수분~수시간)만 명시하고 **섹터 분류 자체의 갱신 주기는 못 찾음**. Wisesheets는 사용자가 수동으로 새로고침하는 구조(자동 주기 명시 없음).
결론: **못 찾음.** 지어내지 않고 그대로 기록.

🔑 **①-B 종합**: 3곳 중 1곳(SPDR)만 명시적 주기(분기)를 공개, 나머지 2곳(Nasdaq·개인용 스크리너)은 공개 안 함/못 찾음 — **섹터 분류 갱신 주기를 공개하는 것 자체가 업계에서 흔치 않다.** 이 역시 "우리가 매일 갱신 안 해도 이례적이지 않다"는 결론을 지지한다.

---

## 결론 — 2단계 착수 근거

①-A(원전 3/3: 연1회·연1회+이벤트·연1회+이벤트)와 ①-B(타플랫폼 3/3: 미공개·분기·미공개)가 **독립적으로 같은 방향**을 가리킨다 — 섹터 분류는 원천적으로 저빈도 개념이고, 그걸 공개하는 관행조차 흔치 않다. 973의 "신선도 상한 미설정" 판단과 이번 STEP의 "기존 종목 재계산 안 함(증분만)" 설계 둘 다 이 검색 결과와 어긋나지 않는다. 코드 작성을 진행한다.
