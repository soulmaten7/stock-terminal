# StockTerminal — 시스템 설계서
<!-- 2026-04-08 -->
<!-- 이 문서는 구현해야 할 모든 기능과 시스템 아키텍처를 기록합니다 -->
<!-- Claude Code가 작업할 때 반드시 이 파일을 참조해야 합니다 -->

---

## 1. 전체 아키텍처

```
[사용자 브라우저]
    ↓
[Next.js App (Vercel)]
    ├── 프론트엔드 (React + TradingView 위젯)
    ├── API Routes (서버사이드)
    │   ├── /api/dart → DART OpenAPI
    │   ├── /api/krx → KRX 데이터
    │   ├── /api/ecos → 한국은행 ECOS
    │   ├── /api/fred → FRED 경제지표
    │   ├── /api/edgar → SEC EDGAR
    │   ├── /api/news → RSS 뉴스 수집
    │   ├── /api/ai-analysis → OpenAI GPT
    │   └── /api/payment → 토스페이먼츠
    └── Supabase Client (DB/Auth/Realtime)
         ↓
[Supabase Cloud]
    ├── PostgreSQL (20개 테이블)
    ├── Auth (이메일 + Google + Kakao)
    ├── Realtime (채팅)
    └── Storage (배너 이미지)
         ↓
[Make (Integromat)] — 스케줄 자동화
    ├── 매일 09:00 DART 공시 수집
    ├── 매일 16:00 KRX 수급 데이터 수집
    ├── 매시간 뉴스 RSS 수집
    └── 매주 1회 AI 분석 갱신
```

---

## 2. 페이지별 기능 명세

### 2-1. 홈페이지 (/)
**목적**: 시장 전체를 한눈에 파악하는 대시보드

| 섹션 | 기능 | 데이터 소스 | 구현 상태 |
|------|------|------------|----------|
| 헤더 | 로고, 네비게이션(홈/링크허브/종목검색), 검색, 로그인/회원가입 | - | 완료 |
| 티커바 | 주요 지수 실시간 스크롤 (KOSPI, KOSDAQ, NASDAQ, S&P500, DOW, USD/KRW, WTI, GOLD, BTC) | TradingView TickerTape 위젯 | 완료 |
| 시장 요약 | TradingView MarketOverview 위젯 (주요 지수 차트) | TradingView 위젯 | 완료 |
| 오늘의 공시 | 최신 DART 공시 5건 | DART API → Supabase disclosures | API 연동 중 |
| 주요 뉴스 | 최신 뉴스 5건 | RSS → Supabase news | API 연동 중 |
| 오늘의 수급 | 외국인/기관 순매수 TOP 5 | KRX API → Supabase supply_demand | 미구현 |
| 상승/하락 TOP | 시가총액 상위 종목 등락률 | KRX API → Supabase stocks | 미구현 |
| 배너 섹션 | 인증업체/일반 배너 노출 | Supabase banners | UI 완료, 데이터 없음 |
| 플로팅 채팅 | 좌하단 접이식 실시간 채팅 | Supabase Realtime | UI 완료, 기능 테스트 필요 |
| Footer | 서비스 안내, 약관, 광고문의, 고객지원, 면책조항 | - | 완료 |

### 2-2. 종목 검색/리스트 (/stocks)
**목적**: 전체 종목 탐색 및 필터링

| 기능 | 설명 | 구현 상태 |
|------|------|----------|
| 종목 검색 | 종목명/코드로 실시간 검색 | UI 완료, Supabase 연동 필요 |
| 시장 필터 | 전체/코스피/코스닥 탭 | 완료 |
| 섹터 필터 | 드롭다운으로 섹터 필터 | UI 완료 |
| 정렬 | 시가총액/등락률/거래량 정렬 | UI 완료 |
| 관심종목 탭 | 로그인 사용자의 관심종목 목록 | UI 완료, Auth 연동 필요 |
| 종목 테이블 | 종목코드, 종목명, 현재가, 등락률, 거래량, 시가총액, PER, PBR, 배당수익률 | UI 완료, 실시간 데이터 필요 |

### 2-3. 종목 상세 대시보드 (/stocks/[symbol])
**목적**: 한 종목의 모든 데이터를 10개 탭으로 보여줌 (프리미엄 전용)

| 탭 | 내용 | 데이터 소스 | 구현 상태 |
|----|------|------------|----------|
| 개요 | TradingView 차트 + 기본 정보 + 실시간 시세 | TradingView | UI 완료 |
| 재무제표 | 연간/분기별 매출, 영업이익, 순이익, ROE, PER, PBR | DART API → financials | UI 완료, 데이터 없음 |
| 공시 | 최근 공시 목록 + AI 요약 | DART API → disclosures | UI 완료, 데이터 없음 |
| 수급 | 외국인/기관/개인 매매 동향 차트 | KRX API → supply_demand | UI 완료, 데이터 없음 |
| 공매도/신용 | 공매도 잔고, 신용잔고, 대차잔고 | KRX API → short_credit | UI 완료, 데이터 없음 |
| 내부자 거래 | 임원/대주주 매수/매도 내역 | DART API → insider_trades | UI 완료, 데이터 없음 |
| 배당 | 연도별 배당금, 배당수익률, 배당성향 | DART API → dividends | UI 완료, 데이터 없음 |
| 뉴스 | 해당 종목 관련 뉴스 | RSS → news | UI 완료, 데이터 없음 |
| AI 분석 | 5가지 기법별 데이터 정리 | OpenAI GPT → ai_analysis | UI 완료, GPT 미연동 |
| 관련 종목 | 같은 섹터/업종 종목 | Supabase stocks | UI 완료 |

### 2-4. 기법별 분석 (/stocks/[symbol]/analysis)
**목적**: AI가 공개 데이터를 5가지 분석 기법으로 정리 (프리미엄 전용)

| 기법 | AI 정리 내용 | 필요 데이터 |
|------|-------------|------------|
| 가치 분석 | PER/PBR/ROE/부채비율 해석, 동종업계 비교 | financials |
| 기술적 분석 | 이평선/RSI/MACD 현황 정리 | TradingView 데이터 |
| 퀀트 분석 | 모멘텀/밸류/퀄리티 팩터 점수 | financials + supply_demand |
| 배당 분석 | 배당수익률 추이, 배당 안정성, 배당성향 | dividends |
| 수급 분석 | 외국인/기관 매매 흐름, 공매도 추이 | supply_demand + short_credit |

### 2-5. 링크 허브 (/link-hub)
**목적**: 투자에 필요한 모든 외부 사이트를 카테고리별 정리

| 카테고리 | 예시 사이트 | 구현 상태 |
|---------|-----------|----------|
| 뉴스/기사 | 네이버증권, 한국경제, 매일경제, Bloomberg, CNBC | 완료 (시드 데이터) |
| 공시/재무 | DART, 금감원, SEC EDGAR | 완료 |
| 거래소/시장데이터 | KRX, NYSE, NASDAQ | 완료 |
| 거시경제 | ECOS, FRED, 통계청 | 완료 |
| 차트/분석도구 | TradingView, Finviz, 알파스퀘어 | 완료 |
| 증권사 리서치 | 키움, 미래에셋, 삼성증권 | 완료 |
| 커뮤니티 | 네이버 종목토론, 팍스넷, Reddit | 완료 |

- 한국/미국 국가별 전환 기능 있음
- Supabase link_hub 테이블에서 동적으로 로드

### 2-6. 요금제 (/pricing)
**목적**: 무료/프리미엄 비교 + 구독 결제

| 기능 | 구현 상태 |
|------|----------|
| 무료/프리미엄 플랜 비교 카드 | 완료 |
| 1/3/6/12개월 기간 선택 + 할인율 표시 | 완료 |
| 총 결제 금액 자동 계산 | 완료 |
| 토스페이먼츠 결제 버튼 | UI 완료, 결제 연동 필요 |

### 2-7. 로그인/회원가입 (/auth/login, /auth/signup)
| 기능 | 구현 상태 |
|------|----------|
| 이메일/비밀번호 로그인 | UI 완료, Auth 테스트 필요 |
| 이메일/닉네임/비밀번호 회원가입 | UI 완료, Auth 테스트 필요 |
| Google 소셜 로그인 | UI 완료, Supabase Auth 설정 필요 |
| 카카오 소셜 로그인 | UI 완료, Supabase Auth 설정 필요 |

### 2-8. 마이페이지 (/mypage)
| 기능 | 구현 상태 |
|------|----------|
| 프로필 정보 (닉네임, 이메일, 가입일) | UI 완료 |
| 구독 상태 및 결제 내역 | UI 완료 |
| 관심종목 관리 | UI 완료 |
| 비밀번호 변경 | UI 완료 |
| 회원 탈퇴 | UI 완료 |

### 2-9. 광고주 센터 (/advertiser)
| 기능 | 구현 상태 |
|------|----------|
| 광고 상품 소개 (인증업체/일반 배너) | 완료 |
| 광고 시작하기 CTA | 완료 |
| 통계 카드 (월간 활성 사용자, 페이지뷰, 투자 관심 비율) | 완료 |
| 배너 등록 폼 (로그인 필요) | UI 완료, 기능 연동 필요 |
| 사업자등록증 업로드 (인증업체) | UI 완료, Storage 연동 필요 |
| 배너 관리 대시보드 | UI 완료 |

### 2-10. 관리자 대시보드 (/admin)
| 기능 | 구현 상태 |
|------|----------|
| 통계 카드 (회원수, 프리미엄, 방문자, 배너) | UI 완료 |
| 최근 가입 회원 목록 | UI 완료 |
| 배너 승인/거절 | UI 완료, 기능 연동 필요 |
| 채팅 신고 관리 | UI 완료, 기능 연동 필요 |
| 사이드바 네비게이션 | UI 완료 |
| 관리자 인증 체크 | 미구현 (role='admin' 체크 필요) |

---

## 3. DB 스키마 (20개 테이블)

```
users              — 사용자 (role: free/premium/advertiser/admin)
watchlist           — 관심종목
stocks             — 종목 기본정보
financials         — 재무제표
disclosures        — 공시
supply_demand      — 수급 (외국인/기관/개인)
short_credit       — 공매도/신용잔고
insider_trades     — 내부자 거래
dividends          — 배당
news               — 뉴스
macro_indicators   — 거시경제 지표
ai_analysis        — AI 분석 결과
chat_messages      — 채팅 메시지
chat_penalties     — 채팅 제재
advertisers        — 광고주
banners            — 배너
banner_clicks      — 배너 클릭 로그
payments           — 결제 내역
link_hub           — 링크 허브
banned_words       — 금칙어
```

- RLS(Row Level Security) 적용 완료
- 인덱스 적용 완료
- 시드 데이터: 금칙어 13개, 링크허브 55개, 주요 종목 25개

---

## 4. 외부 API 연동 현황

| API | 용도 | 키 상태 | 연동 상태 |
|-----|------|--------|----------|
| DART OpenAPI | 공시, 재무제표, 내부자거래 | 발급 완료 | 연동 중 |
| FRED | 미국 거시경제 (GDP, CPI, 금리) | 발급 완료 | 연동 중 |
| SEC EDGAR | 미국 기업 공시 | User-Agent만 필요 | 연동 중 |
| 한국은행 ECOS | 한국 거시경제 (기준금리, GDP, CPI) | 승인 대기 중 | 미연동 |
| KRX | 수급, 공매도, 신용잔고 | 공개 API (키 불필요) | 미연동 |
| OpenAI GPT | AI 데이터 정리 | 미설정 | 미연동 |
| 토스페이먼츠 | 구독 결제 | 미설정 | 미연동 |
| TradingView | 차트, 티커 위젯 | 무료 위젯 | 완료 |
| RSS 피드 | 뉴스 수집 | 키 불필요 | 미연동 |

---

## 5. 채팅 시스템 설계

### 기본 구조
- Supabase Realtime Channels 사용
- 기본 방: 'general' (전체 채팅방)
- 메시지: user_id, nickname, content, created_at
- 로그인 사용자만 메시지 전송 가능
- 비로그인도 채팅 내용 열람 가능

### 모더레이션
- **금칙어 필터**: banned_words 테이블의 단어가 포함되면 전송 차단
- **링크 차단**: URL 패턴 감지 시 차단 (스팸 방지)
- **제재 시스템**:
  - 1차: 경고 (warning)
  - 2차: 30분 음소거 (mute_30min)
  - 3차: 1개월 음소거 (mute_1month)
- 제재 기록: chat_penalties 테이블

---

## 6. 인증/권한 시스템

### 사용자 역할
| 역할 | 접근 가능 기능 |
|------|-------------|
| 비로그인 | 홈(제한), 링크허브, 종목리스트, 채팅열람 |
| free | 위 + 로그인 필요 기능 (채팅 참여, 관심종목 3개) |
| premium | 위 + 종목상세 10탭, AI분석, 알림, 관심종목 무제한 |
| advertiser | 위 + 광고주 대시보드, 배너 등록/관리 |
| admin | 전체 접근 + 관리자 대시보드 |

### 프리미엄 접근 제어
- 종목 상세 대시보드: 로그인 + premium 이상만
- AI 분석: 로그인 + premium 이상만
- 공시 실시간 알림: premium 이상만
- 관심종목: free는 3개, premium은 무제한

---

## 7. Make(Integromat) 자동화 스케줄

| 작업 | 주기 | 설명 |
|------|------|------|
| DART 공시 수집 | 매일 09:00 / 12:00 / 15:00 | 최신 공시를 Supabase disclosures에 저장 |
| KRX 수급 수집 | 매일 16:30 (장 마감 후) | 외국인/기관 순매수 데이터를 supply_demand에 저장 |
| KRX 공매도 수집 | 매일 17:00 | 공매도/신용잔고를 short_credit에 저장 |
| ECOS 거시경제 | 매일 10:00 | 한국 경제지표를 macro_indicators에 저장 |
| FRED 거시경제 | 매일 22:00 (미국 시간 맞춤) | 미국 경제지표를 macro_indicators에 저장 |
| 뉴스 RSS | 매시간 | 주요 경제 뉴스를 news에 저장 |
| AI 분석 갱신 | 매주 월요일 06:00 | 주요 종목 AI 분석을 ai_analysis에 저장 |

---

## 8. 배포 체크리스트 (런칭 전)

- [ ] 도메인 구매 + DNS 설정
- [ ] Vercel 배포 + 환경변수 설정
- [ ] Supabase Auth 소셜 로그인 설정 (Google, Kakao)
- [ ] 토스페이먼츠 실환경 키 발급
- [ ] SSL 인증서 확인
- [ ] SEO: 메타태그, Open Graph, sitemap.xml, robots.txt
- [ ] 이용약관 / 개인정보처리방침 페이지
- [ ] Google Analytics / 방문자 추적
- [ ] 에러 모니터링 (Sentry 등)
- [ ] 성능 테스트 (Lighthouse 90+ 목표)
- [ ] Make 자동화 시나리오 실행 확인
- [ ] 관리자 계정 생성 + admin 역할 부여

---

## 9. 구현 우선순위 (Claude Code 작업 순서)

### 즉시 (이번 주)
1. DART/FRED/SEC API 연동 완료 → 실제 데이터 표시
2. Supabase Auth 테스트 (회원가입 → 로그인 → 세션)
3. 종목 검색에서 Supabase stocks 데이터 표시
4. ECOS API 키 승인 후 연동

### 다음 주
5. KRX 수급 데이터 연동
6. 플로팅 채팅 Realtime 연동 + 금칙어 필터
7. 관심종목 추가/삭제 기능
8. 프리미엄 접근 제어 (AuthGuard)

### 2주 후
9. 토스페이먼츠 결제 연동
10. 배너 광고주 셀프서비스 완성
11. OpenAI GPT AI 분석 연동
12. Make 자동화 스케줄 설정

### 1개월 후
13. 관리자 기능 완성 (배너 승인, 채팅 관리)
14. 미국 시장 데이터 강화
15. 도메인 + Vercel 배포
16. SEO + 이용약관 + 법적 검토
