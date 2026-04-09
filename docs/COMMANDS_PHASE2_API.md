# Phase 2 — 한투 API 연동 후 명령어
<!-- 한국투자증권 OpenAPI 계좌 개설 + API Key 발급 후 실행 -->

---

## 명령어 1: 한투 OpenAPI 연동 기본 세팅

```
한국투자증권 OpenAPI를 연동해줘.

[.env.local에 추가할 키] (내가 값을 알려줄게)
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_ACCOUNT_NO=

[API 라우트 생성]
app/api/kis/route.ts — 한투 OpenAPI 프록시
- OAuth 토큰 발급 (POST /oauth2/tokenP)
- 토큰 캐싱 (만료 전까지 재사용)
- 에러 핸들링

app/api/kis/price/route.ts — 실시간 시세
- 종목 현재가 조회 (GET /uapi/domestic-stock/v1/quotations/inquire-price)
- 요청 파라미터: symbol (종목코드)

app/api/kis/orderbook/route.ts — 호가
- 10단 호가 조회 (GET /uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn)

app/api/kis/execution/route.ts — 체결
- 실시간 체결 내역 조회

app/api/kis/investor/route.ts — 투자자별 매매동향
- 외국인/기관/개인 순매수 조회

lib/kis.ts — 한투 API 유틸리티 함수
- getKisToken() — 토큰 발급/캐싱
- fetchKisApi(endpoint, params) — 공통 API 호출 함수
- 에러 처리, 레이트 리밋 대응

한투 OpenAPI 문서 기준: https://apiportal.koreainvestment.com/
모의투자 도메인: https://openapivts.koreainvestment.com:29443
실전 도메인: https://openapi.koreainvestment.com:9443
일단 모의투자로 세팅하고, 나중에 실전으로 전환할 수 있게 env 변수로 분리해줘.
```

---

## 명령어 2: WatchlistLive 실시간 연결

```
WatchlistLive.tsx의 더미 데이터를 한투 API 실시간 시세로 교체해줘.

- 관심종목 리스트는 Supabase watchlist 테이블에서 가져옴
- 각 종목의 현재가를 /api/kis/price?symbol=005930 형태로 조회
- 5초마다 폴링 (WebSocket은 나중에)
- 가격 변동 시 깜빡임 애니메이션 유지
- API 에러 시 이전 데이터 유지 + 회색 표시
- 로딩 중: 스켈레톤 UI
```

---

## 명령어 3: InstitutionalFlow 실시간 연결

```
InstitutionalFlow.tsx의 더미 데이터를 한투 API로 교체해줘.

- /api/kis/investor 엔드포인트에서 외국인/기관 순매수 TOP 5 가져옴
- 30초마다 폴링
- 탭 전환 (외국인/기관) 시 즉시 데이터 전환
- API 에러 시 더미 데이터 폴백
```

---

## 명령어 4: 종목 상세 — 호가창 + 체결 연결

```
종목 상세 페이지 (/stocks/[symbol])에 호가창과 체결내역을 한투 API로 연결해줘.

[호가창 — components/stocks/OrderBook.tsx]
- /api/kis/orderbook?symbol=005930 에서 10단 호가 데이터
- 매도 10단 (위) + 현재가 + 매수 10단 (아래)
- 물량에 따라 막대 그래프 (배경 너비)
- 매도: 파란 배경, 매수: 빨간 배경
- 3초마다 폴링

[체결내역 — components/stocks/ExecutionList.tsx]
- /api/kis/execution?symbol=005930 에서 실시간 체결
- 시간 | 가격 | 수량 | 체결구분(매수/매도)
- 매수체결: 빨강, 매도체결: 파랑
- 위에서 아래로 최신순 스크롤
- 2초마다 폴링

이 두 컴포넌트를 종목 상세 페이지의 차트 우측에 배치해줘.
docs/PAGE_FRAME_SPEC.md의 종목 상세 레이아웃 참고.
```

---

## 명령어 5: 2층 실시간 데이터 연결

```
홈 2층의 VolumeSpike, ProgramTrading 컴포넌트를 한투 API로 연결해줘.

[VolumeSpike]
- 거래량 상위 종목 조회 API 활용
- 전일 대비 거래량 비율 계산
- 200% 이상만 필터
- 5분마다 폴링

[ProgramTrading]
- 프로그램 매매 동향 조회
- 차익/비차익 구분
- 5분마다 폴링

API 엔드포인트가 없는 경우, KRX 크롤링 또는 더미 유지하고 TODO 주석 남겨줘.
```
