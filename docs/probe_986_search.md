# STEP 986 — 3번 규칙 기록 (①-A 3회 · ①-B 3회, 985 재사용 포함)

> 초점 = 복수클래스 종목 식별 방법. 985에서 확보한 것은 재사용, 중복 조사 안 함.

## A-0 (우리 자산) — 먼저 연 것 (신규 데이터소스 도입 전 필수 확인)

- `us_cik_map`(symbol·cik·exchange·title, 10,432행) — 이미 보유, 실측으로 판별력 확인(§1).
- `lib/revdcf/drivers.ts:364-385` — `MULTI_CLASS_SHARES` skipReason. **다른 신호**(SEC companyfacts에 클래스 통합 주식수 총계 자체가 없음 — 차원(dimension) 팩트로만 쪼개져 있음, V·STZ·FWONA·WMG·COKE 예시)를 쓴다. 우리 야후 파이프라인(`topByMarketCap`)은 SEC 데이터에 접근하지 않으므로 이 신호를 직접 재사용할 순 없으나, **같은 문제의 다른 관측**으로 교차검증 가치가 있다(아래 §1).

## ①-A — 원전이 복수클래스를 어떻게 식별하는가 (985 재사용 + 1회 신규)

**A-1(신규, WebSearch).** SEC/EDGAR 생태계 자료(sec-api.io 등) — *"A single company might have multiple classes of stock... the CIK ties all of those filings together"*, *"One CIK can correspond to multiple tickers if a company has different share classes."* 🔑 **CIK가 바로 원전(SEC)이 쓰는 통합 식별자다** — 우리가 새로 만들 필요 없이 SEC 체계 자체가 이미 이 방식을 쓴다.
같은 자료: *"복수클래스 합산 시총 = 클래스별(주식수×가격)의 합"* — **우리가 하려는 단순 재구성(한 클래스의 shares×price)이 왜 틀리는지**를 정확히 설명한다. 야후 `marketCap`은 회사 전체(전클래스 합산)를, `sharesOutstanding`은 조회한 티커의 클래스만 담기 때문에 애초에 서로 다른 대상을 잰다.

**A-2(985 재사용).** `docs/probe_985_search.md` A-2/A-3 — 시총 정의(주가×발행주식수) 자체는 985에서 이미 확인. 이번엔 "그 발행주식수가 회사 전체인가 클래스별인가"라는 새 질문만 추가로 본다(A-1이 답함).

**A-3.** 🔴 **미독** — Damodaran 원전이 복수클래스 시총 처리를 명시하는지는 이번에도 확인 안 함(975가 이미 "PBV·PS는 주당 정의가 아니라 총액÷총액"이라 확인해 둔 것과 결이 다른 질문이라 새로 찾아야 하나, 시간상 스킵).

## ①-B — 실무 서비스의 복수클래스 처리 (985의 1/3 미확보를 채움)

**B-1(985 재사용).** `yfinance`(Python) — `market_cap` 계산이 `shares × last_price`. 🔴 **985에서 못 본 것**: 이 계산이 복수클래스에서 어떻게 되는지는 985가 확인 안 했다 — yfinance는 티커 단위로 조회하므로 우리와 똑같이 **클래스별 shares만 반영**할 가능성이 높다(같은 구조적 함정을 공유할 것으로 추정, 직접 검증은 안 함).

**B-2(신규, WebSearch 재확인).** 위 A-1과 같은 조사에서 확보 — **985가 3곳 중 못 채운 자리를 채운다**: SEC 데이터 서비스(sec-api.io류)는 클래스별 shares를 개별 반환하고, "합산하려면 사용자가 직접 클래스별로 곱해서 더해야 한다"고 명시한다 — 즉 **실무에서도 "복수클래스 자동합산"은 특별 처리 없이는 안 된다**는 것을 재확인. 우리가 이번에 "재구성을 단일클래스에만 한정"하기로 한 것과 같은 결론이다.

**B-3.** 🔴 **못 채움** — 세 번째 독립 서비스(스크리너 등)의 복수클래스 UI 처리(BRK-A/BRK-B를 하나로 묶어 보여주는지)는 확인 안 함.
