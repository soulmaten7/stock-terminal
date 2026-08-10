# STEP 987 — 3번 규칙 기록 (①-A 3회 · ①-B 3회, 985/986 재사용 포함)

> 초점 = 야후가 regularMarketPrice를 안 주는 종목의 성격. 985/986에서 확보한 것은 재사용.

## A-0 — 먼저 연 것

- 985/986의 정의(시총=주가×발행주식수)·복수클래스 CIK 방법 그대로 재사용, 중복 조사 안 함.
- `us_cik_map`에서 이번 무응답 3종목(`GV`·`KVAC`·`PSTV`) 조회 — `KVAC`=**"Keen Vision Acquisition Corp."**(이름 자체가 SPAC), `GV`="Visionary Holdings Inc.", `PSTV`="PLUS THERAPEUTICS, INC."(소형 바이오텍).

## ①-A/①-B — 야후가 regularMarketPrice를 안 주는 경우 (원전 없음, 실무 사례로 대체)

**A-1(WebSearch).** `yfinance` GitHub 이슈 #2453 — *"possibly delisted; no price data found"*가 **실제로는 정상 상장·거래 중인 종목(`^GSPC`)에도 뜬다**는 보고. 원인은 이슈 자체에서도 특정 안 됨(*"the specific cause... isn't explicitly detailed"*) — **야후 백엔드가 간헐적으로 정상 종목도 빈 응답을 준다는 게 이미 알려진, 미해결 커뮤니티 이슈**다.

**A-2(WebSearch).** 같은 검색에서 이슈 #2386·#1713 — 델리스팅·거래정지 시 가격 데이터가 사라진다는 일반론 확인. Wikipedia "Trading curb"·MarketBeat "trading halt" — 거래정지 시 가격 갱신이 멈춘다는 원론적 사실만(야후 API 특유의 동작은 서술 없음).

**A-3.** 🔴 **미독** — 야후 자체의 공식 응답 스키마 문서는 없다(984·985에서 이미 확인된 것과 같은 결론, 재확인만).

🔑 **결론**: 우리 무응답 3건(`GV`·`KVAC`·`PSTV`)은 **소형·SPAC류(KVAC는 이름부터 SPAC)** — "비거래 티어" 가설과 정합적이나, #2453이 보여주듯 **정상 종목도 간헐적으로 이런 응답을 받을 수 있어 확정할 수 없다.** 유니버스 포함 여부는 이번 STEP에서 판단하지 않는다(별도 판정 사항, 아래 §4).
