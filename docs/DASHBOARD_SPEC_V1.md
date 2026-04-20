# Stock Terminal V3 — 홈 대시보드 스펙 V1

작성일: 2026-04-20 | Phase A 완료 기준

---

## 섹션 1: 설계 원칙

### 3-LLM 합의 + 전업투자자 실사용 사이트 매핑

Stock Terminal 홈 대시보드는 전업투자자가 실제 사용하는 워크스테이션 환경을 표준으로 삼는다.
참조 사이트: Koyfin · Bloomberg Terminal · HTS(영웅문) · Investing.com · finviz

**3-패널 레이아웃 원칙**
- **좌측 (3fr)** — 발굴: 내가 보는 종목 + 오늘의 급등/급락
- **중앙 (6fr)** — 분석: 차트 + 호가/체결 (선택 종목 딥다이브)
- **우측 (3fr)** — 검증: 매크로·뉴스·수급·공시 (시장 맥락 판단)
- **좌측 하단 고정** — 커뮤니티 채팅 (실시간 정보 교환)

**핵심 결정**
- AI/LLM 기능 일절 없음 — 순수 데이터 터미널 + 유저 커뮤니티
- 채팅은 Supabase Realtime 기반 유저 간 커뮤니케이션
- TradingView 차트 위젯 임베드 (KRX:XXXXXX 심볼 형식)
- 모든 유료 API 대신 무료 공식 API 우선 (KIS · DART · pykrx · RSS)

---

## 섹션 2: 14개 위젯 상세

| # | 위젯명 | 영역 | 파일 | 데이터 소스 | 실시간 | MVP |
|---|---|---|---|---|---|---|
| 1 | 관심종목 | 좌측 | WatchlistWidget | Supabase + KIS API | 15분 지연 허용 | O |
| 2 | 거래량 급등 TOP 10 | 좌측 | VolumeTop10Widget | KIS API (FHKST01010900) | 15분 지연 허용 | O |
| 3 | 상승/하락 TOP 10 | 좌측 | MoversTop10Widget | KIS API (등락률 순위) | 15분 지연 허용 | O |
| 4 | 차트 | 중앙 | ChartWidget | TradingView iframe | TradingView 자체 처리 | O |
| 5 | 호가창 (10단) | 중앙 | OrderBookWidget | KIS API (FHKST01010200) + WebSocket | 필수 실시간 | O |
| 6 | 체결창 + 체결강도 | 중앙 | TickWidget | KIS API (FHKST01010300) + WebSocket | 필수 실시간 | O |
| 7 | 글로벌 지수·환율·선물·채권 | 우측 | GlobalIndicesWidget | Yahoo Finance + Investing 위젯 | 15분 지연 허용 | O |
| 8 | DART 공시 피드 | 우측 | DartFilingsWidget | DART OpenAPI | 5~10분 폴링 | O |
| 9 | 경제캘린더 | 우측 | EconCalendarWidget | Investing.com iframe | 일 1회 갱신 | O |
| 10 | 실시간 수급 TOP | 우측 | NetBuyTopWidget | pykrx + 서버 cron | 10분 지연 | O |
| 11 | 투자자별 매매동향 | 우측 | InvestorFlowWidget | pykrx | 10분 지연 | O |
| 12 | 뉴스 속보 | 우측 | NewsFeedWidget | 한국경제·매일경제·이데일리 RSS | 5분 이내 | O |
| 13 | 장전 브리핑 | 우측 | PreMarketBriefingWidget | Yahoo Finance + DART | 매일 1회 갱신 | O |
| 14 | 커뮤니티 채팅 | 고정 | CommunityChatWidget | Supabase Realtime | 실시간 | O |

---

## 섹션 3: 데이터 소스 매핑 요약

### 우선순위 소스 (★★★★★)
| 소스 | 용도 | 비용 | 인증 |
|---|---|---|---|
| KIS OpenAPI | 실시간 시세·호가·체결·순위 | 무료 | OAuth 2.0 |
| DART OpenAPI | 공시 피드·재무제표 | 무료 | API 키 |
| TradingView Widget | 차트 임베드 | 무료 | 없음 |
| Supabase + Realtime | 유저 데이터·채팅 | 무료 티어 | API 키 + RLS |
| FRED | 미국 경제지표 | 무료 | API 키 |

### 보조 소스 (★★★★)
| 소스 | 용도 | 비고 |
|---|---|---|
| pykrx | 투자자별 매매·시가총액 | 비실시간, 장 마감 후 |
| 한국경제·매일경제·이데일리 RSS | 뉴스 속보 | 안정적 |
| Yahoo Finance (비공식) | 글로벌 지수·환율 | 정책 변경 리스크 |

### 사용하지 않는 소스
- 네이버/다음 금융 크롤링 — ToS 위반 소지
- 키움 OpenAPI+ — Windows 전용

---

## 섹션 4: 구현 우선순위

### Phase A (완료) — 스켈레톤 + 스텁
- [x] 3-패널 CSS Grid 레이아웃 (3fr 6fr 3fr, gap 8px)
- [x] 14개 위젯 스텁 컴포넌트 (`components/widgets/`)
- [x] 각 위젯: 제목바 + 더미 데이터 3~5줄 + "준비 중" 배지
- [x] WidgetCard 공통 래퍼 활용
- [x] 채팅 고정 위젯 (left-12, bottom-0, 320×360px)
- [x] 빌드 통과 + 타입 에러 0

### Phase B (다음 세션) — 데이터 통합
우선순위 순:
1. **TradingView 차트** — iframe 임베드 (0.5일, 난이도 하)
2. **경제캘린더** — Investing.com iframe (0.5일, 난이도 하)
3. **뉴스 속보** — RSS 3종 병합 API (1.5일, 난이도 하)
4. **글로벌 지수** — Yahoo Finance REST (1일, 난이도 하)
5. **거래량/등락률 순위** — KIS API (1일, 난이도 중)
6. **DART 공시** — DART OpenAPI 폴링 (1.5일, 난이도 중)
7. **수급/매매동향** — pykrx cron → Supabase 캐싱 (1.5일, 난이도 중)
8. **관심종목** — Supabase + KIS 시세 (2~3일, 난이도 중)
9. **호가창/체결창** — KIS WebSocket (2일, 난이도 중~상)
10. **채팅** — 기존 Supabase Realtime 연동 (1일)
11. **장전 브리핑** — 새벽 cron + 다소스 통합 (2일)

---

## 섹션 5: Phase 2 위젯

| 위젯 | 설명 | 소스 | 예상 공수 |
|---|---|---|---|
| 조건검색 알람 | 유저 정의 조건식 + 서버 스캔 | 자체 구현 | 5~7일 |
| 방송 라이브 임베드 | 삼프로TV·한경TV·매경TV YouTube | YouTube IFrame API | 1일 |
| 시장 히트맵 | 업종별 등락 시각화 | pykrx + TradingView | 2일 |
| 옵션/선물 만기 캘린더 | 파생상품 만기일 | DART + KRX | 2일 |
