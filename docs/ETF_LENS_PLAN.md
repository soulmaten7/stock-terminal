<!-- 2026-07-10 -->
# ETF_LENS_PLAN — ETF/ETN/REIT 상품 구성 상세 (TR-AI 렌즈 확장)

> 목표: 주식탭의 "TR-AI 렌즈·근거 보기"가 종목 상세를 보여주듯, **ETF/ETN 등 상품도 상세 페이지에서 구성(구성종목·비중·섹터·보수율 등)을 디테일하게** 보여준다.
> 구성 정보 = **어디서 사는지와 무관한 순수 상품 정보**(운용사 팩트시트). **증권사 연결(수익화)은 별도·이후 논의**(사용자 지시 2026-07-10).
> 방법론: `LOCALE_SOURCE_PLAYBOOK`(소스 프로브 먼저·검증게이트·크론 스냅샷). 정체성: 사실 요약·비예측·판단은 사용자.

---

## §0 왜 지금 없나 + 상품 유형 구분 (검증 완료)

우리 렌즈는 **개별 기업 재무 기반**(모멘텀·밸류·퀄리티·F-Score) → ETF/ETN은 자기 재무 없는 '래퍼'라 "산출 불가". 그래서 유형별로 **다르게** 다룬다:

| 유형 | 정체 | 상세에 보여줄 것 | 분석 방식 |
|------|------|------------------|-----------|
| **ETF** | 주식/채권 바스켓 | 구성종목+비중·섹터·보수율·운용사·추종지수·AUM | 구성 요약(→ 나중 팩터 룩스루) |
| **ETN** | 발행사 신용 채권(지수 추종) | 추종 지수·발행사·기초지수 구성 | 지수 구성 요약(바스켓 없음) |
| **REIT** | 부동산 회사(단일 주식) | 보유 자산·배당수익률·FFO 등 | **단일 주식으로**(룩스루 아님·리츠 지표) |

## §1 데이터 소스 (프로브 결과 2026-07-10)

- 🇺🇸 **US ETF = Yahoo `quoteSummary(topHoldings, fundProfile)` — ✅ 지금 바로 됨.** 프로브(SPY·QQQ): 상위 10보유(심볼·이름·비중)·섹터 비중·보수율(annualReportExpenseRatio)·운용사(family). **우리가 이미 쓰는 의존성**(리스크 0). 단 상위 10만(전체 아님) — 요약엔 충분.
- 🇰🇷 **KR ETF = Yahoo에 없음**(069500.KS "No fundamentals data") → **KRX 필요**:
  - KRX Data Marketplace OTP 방식(`data.krx.co.kr` getJsonData.cmd·pykrx가 쓰는 방식·키 불필요) 또는 KRX OpenAPI(`openapi.krx.co.kr`·키·10k/일).
  - ⚠️ **클라우드 IP 차단 리스크**(CN 东方財富·VN VCI 전례) → **프로브 필수 + 크론 스냅샷 DB 패턴**(막히면 off-Vercel GitHub Actions). 대체: 네이버 금융 ETF 구성종목 테이블.
- **ETN(KR)** = KRX(`api/krx/etn` 이미 있음) + 기초지수 구성.
- 이미 보유: `api/krx/etf-performance`·`api/krx/etn`·`api/yahoo/us-etf-performance`·`reit-performance`(가격·성과). **구성종목만 신규.**

## §2 스키마 (의미우선)

```
etf_holdings (신규 테이블)
  symbol            text   -- 상품 티커(069500.KS·SPY)
  market            text   -- KR·US…
  as_of             date   -- 스냅샷 날짜(시장 로컬)
  fund_type         text   -- etf|etn|reit
  family            text   -- 운용사(삼성자산운용·State Street)
  index_tracked     text   -- 추종 지수(KOSPI200·나스닥100)
  expense_ratio     numeric-- 보수율
  aum               numeric-- 순자산(있으면)
  holdings          jsonb  -- [{sym,name,weight}]  (US=상위10·KR=전체 or 상위N)
  sectors           jsonb  -- [{name,weight}]
  source            text   -- yahoo|krx|naver (귀속)
  source_url        text   -- 원문 팩트시트 링크
```

## §3 페이지 (종목 상세 재사용)

- `/stock/{symbol}` 진입 시 **type이 etf/etn/reit면** 렌즈(기업재무) 대신 **구성 뷰** 렌더(`StockLensClient`에 분기 or `EtfLensClient` 신규).
- 구성 뷰 = 추종지수·운용사·보수율(상단) + **상위 보유종목 표(비중 바)** + 섹터 비중(막대) + (LLM) **한 줄 사실 요약** + **원문 팩트시트 링크**(출처 귀속).
- **미리보기 렌즈 슬롯**(보드 우측/모바일 시트): 상품이면 "TR-AI 렌즈" 자리에 **구성 요약**(추종·상위3보유·보수율) + "TR-AI 렌즈·근거 보기"→구성 상세.
- REIT = 단일 주식이라 기존 종목 상세 유지하되 **리츠 지표(FFO·배당수익률·LTV)** 보강(별도·후순위).

## §4 단계 (phasing)

1. **MVP-A (US·빠름·리스크0)**: Yahoo topHoldings로 US ETF 구성 뷰 + 미리보기 요약 → **페이지 UX 확정**(준비된 데이터로 전체 흐름 검증).
2. **MVP-B (KR·핵심)**: KRX ETF 구성 **프로브**(도달성·형식·Vercel 차단 여부) → 되면 **크론 스냅샷**(`etf_holdings` KR 적재·`api/etf-holdings`) → 구성 뷰 KR.
3. **요약(LLM)**: 구성 사실을 R2식 한 줄 요약(비예측). 
4. **ETN·REIT**: ETN 지수 구성 / REIT 리츠 지표.
5. **[보류] 수익화**: "이 상품 거래하기 → 증권사"(거래처 안내·별도 논의). 운용사=정보 출처 / 증권사=거래 채널 분리.

## §5 검증 게이트 (막힘 대비)

- KRX가 Vercel(미 IP)서 되는지 **배포 실측**(로컬 통과≠지속). 막히면 off-Vercel 크론(GH Actions) or 네이버 폴백. 실패 시 §보류로 기록·배선 보존(가짜 금지).
- 구성 커버리지 정직 표기(US=상위10 명시). 출처·날짜 귀속.

## §6 다음
- 사용자 결정: **US-first(UX 먼저·빠름)** vs **KR-first(주 시장·KRX 프로브부터)**.
- 착수 시 이 문서 갱신 + STEP 발행(Cowork 설계 → Claude Code 빌드).
