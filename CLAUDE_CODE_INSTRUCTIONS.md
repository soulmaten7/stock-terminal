# 글로벌 개인투자자용 통합 데이터 터미널 플랫폼 — 개발 명령서

---
## ⚠️⚠️⚠️ 최우선 경고: Supabase 프로젝트 반드시 새로 생성 ⚠️⚠️⚠️

**이 프로젝트는 기존 Supabase 프로젝트(POTAL 등)와 절대로 공유하지 않는다.**
**기존 프로젝트의 URL/Key를 사용하면 테이블명이 겹쳐서 기존 데이터가 손상된다.**
**반드시 아래 절차를 따를 것:**

1. Supabase 대시보드(https://supabase.com/dashboard)에 접속
2. "New Project" 버튼으로 완전히 새로운 프로젝트를 생성
3. 프로젝트 이름: stock-platform
4. Region: Northeast Asia (ap-northeast-1) 또는 가장 가까운 리전 선택
5. 생성 완료 후 Project Settings > API에서 URL과 anon key, service_role key를 복사
6. 이 프로젝트의 .env.local 파일에 새로 생성한 프로젝트의 URL과 Key만 입력
7. **기존 POTAL이나 다른 프로젝트의 Supabase URL/Key를 절대 사용하지 말 것**

**이 단계를 완료하기 전에는 DB 스키마 생성이나 다른 Supabase 관련 작업을 진행하지 말 것.**
---

## 프로젝트 개요
한국 시장을 타겟으로 한 주식 정보 통합 플랫폼. 전업투자자들이 수년에 걸쳐 직접 세팅하는 투자 정보 환경을 일반 투자자에게 제공하는 웹 서비스.

---

## 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: Zustand
- **차트**: TradingView 위젯 (임베드)
- **실시간**: Supabase Realtime (채팅)
- **아이콘**: Lucide React

### 백엔드
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth (이메일 + 소셜 로그인: Google, Kakao)
- **스토리지**: Supabase Storage (배너 이미지 등)
- **API**: Next.js API Routes (Route Handlers)
- **실시간**: Supabase Realtime Channels

### 결제
- **토스페이먼츠** (정기결제 빌링키 방식)

### 외부 API
- DART 전자공시 API (한국 공시/재무제표)
- 한국거래소 KRX API (수급, 공매도, 신용잔고)
- 한국은행 ECOS API (거시경제 지표)
- SEC EDGAR API (미국 공시/재무제표)
- FRED API (미국 거시경제)
- TradingView 위젯 (차트, 티커)
- OpenAI GPT API (데이터 자연어 정리)
- RSS 피드 (뉴스 수집)

### 자동화
- Make (Integromat) — 정기 데이터 업데이트 스케줄링

### 배포
- Vercel (Next.js 배포)
- Supabase Cloud (데이터베이스)

---

## 프로젝트 폴더 구조

```
/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (헤더 + 티커바 + 푸터 + 플로팅채팅)
│   ├── page.tsx                      # 홈 (메인 대시보드)
│   ├── globals.css                   # 글로벌 스타일
│   ├── link-hub/
│   │   └── page.tsx                  # 링크 허브 페이지
│   ├── stocks/
│   │   ├── page.tsx                  # 종목 검색/리스트 페이지
│   │   └── [symbol]/
│   │       ├── page.tsx              # 종목 상세 대시보드
│   │       └── analysis/
│   │           └── page.tsx          # 기법별 분석
│   ├── advertiser/
│   │   ├── page.tsx                  # 광고주 랜딩 페이지
│   │   └── dashboard/
│   │       └── page.tsx              # 광고주 대시보드
│   ├── mypage/
│   │   └── page.tsx                  # 마이페이지
│   ├── pricing/
│   │   └── page.tsx                  # 구독/결제 페이지
│   ├── admin/
│   │   └── page.tsx                  # 관리자 페이지
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx              # 로그인
│   │   ├── signup/
│   │   │   └── page.tsx              # 회원가입
│   │   └── callback/
│   │       └── route.ts              # 소셜 로그인 콜백
│   └── api/
│       ├── dart/
│       │   └── route.ts              # DART API 프록시
│       ├── krx/
│       │   └── route.ts              # KRX 데이터 API
│       ├── ecos/
│       │   └── route.ts              # 한국은행 API
│       ├── sec/
│       │   └── route.ts              # SEC EDGAR API
│       ├── fred/
│       │   └── route.ts              # FRED API
│       ├── news/
│       │   └── route.ts              # RSS 뉴스 수집 API
│       ├── ai-analysis/
│       │   └── route.ts              # GPT 분석 생성 API
│       ├── payment/
│       │   ├── billing/
│       │   │   └── route.ts          # 토스페이먼츠 정기결제
│       │   └── webhook/
│       │       └── route.ts          # 결제 웹훅
│       └── advertiser/
│           ├── register/
│           │   └── route.ts          # 배너 등록 API
│           └── payment/
│               └── route.ts          # 광고 결제 API
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # 헤더 (네비게이션)
│   │   ├── TickerBar.tsx             # 실시간 티커 바
│   │   ├── Footer.tsx                # 푸터 (6섹션)
│   │   └── FloatingChat.tsx          # 플로팅 채팅
│   ├── home/
│   │   ├── MarketSummaryCards.tsx     # 시장 요약 카드
│   │   ├── TodayDisclosures.tsx      # 오늘의 주요 공시
│   │   ├── TodayNews.tsx             # 오늘의 주요 뉴스
│   │   ├── SupplyDemandSummary.tsx   # 수급 요약
│   │   ├── TopMovers.tsx             # 상승/하락/거래량 TOP
│   │   └── BannerSection.tsx         # 배너 영역
│   ├── stocks/
│   │   ├── StockSearch.tsx           # 종목 검색
│   │   ├── StockList.tsx             # 종목 리스트 테이블
│   │   ├── StockFilters.tsx          # 필터/정렬
│   │   ├── WatchlistButton.tsx       # 관심종목 버튼
│   │   └── dashboard/
│   │       ├── StockHeader.tsx       # 종목 헤더 (이름, 현재가)
│   │       ├── ChartTab.tsx          # 차트 탭
│   │       ├── FinancialsTab.tsx     # 재무제표 탭
│   │       ├── DisclosuresTab.tsx    # 공시 탭
│   │       ├── SupplyDemandTab.tsx   # 수급 탭
│   │       ├── ShortSellingTab.tsx   # 공매도/신용 탭
│   │       ├── InsiderTab.tsx        # 내부자 탭
│   │       ├── DividendTab.tsx       # 배당 탭
│   │       ├── NewsTab.tsx           # 뉴스 탭
│   │       ├── SectorTab.tsx         # 섹터 탭
│   │       └── MacroTab.tsx          # 거시경제 탭
│   ├── analysis/
│   │   ├── ValueAnalysis.tsx         # 가치투자 분석
│   │   ├── TechnicalAnalysis.tsx     # 기술적 분석
│   │   ├── QuantAnalysis.tsx         # 퀀트 분석
│   │   ├── DividendAnalysis.tsx      # 배당 투자 분석
│   │   └── SupplyAnalysis.tsx        # 수급 분석
│   ├── chat/
│   │   ├── ChatWindow.tsx            # 채팅 윈도우
│   │   ├── ChatMessage.tsx           # 메시지 컴포넌트
│   │   ├── ChatInput.tsx             # 입력창
│   │   └── ChatModeration.tsx        # 금칙어/제재 로직
│   ├── advertiser/
│   │   ├── BannerForm.tsx            # 배너 등록 폼
│   │   ├── BannerPreview.tsx         # 배너 미리보기
│   │   ├── AdvertiserStats.tsx       # 광고 통계
│   │   └── BannerDisplay.tsx         # 배너 렌더링
│   ├── auth/
│   │   ├── LoginForm.tsx             # 로그인 폼
│   │   ├── SignupForm.tsx            # 회원가입 폼
│   │   └── AuthGuard.tsx             # 인증 가드 (유료 컨텐츠 보호)
│   ├── payment/
│   │   ├── PricingCard.tsx           # 요금제 카드
│   │   ├── PaymentForm.tsx           # 결제 폼
│   │   └── SubscriptionStatus.tsx    # 구독 상태
│   └── common/
│       ├── CountrySelector.tsx       # 국가 선택 드롭다운
│       ├── QuickSearch.tsx           # 빠른 종목 검색
│       ├── DisclaimerBanner.tsx      # 면책 고지
│       ├── LoadingSkeleton.tsx       # 로딩 스켈레톤
│       └── PaywallModal.tsx          # 구독 유도 모달
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Supabase 클라이언트 (브라우저)
│   │   ├── server.ts                 # Supabase 서버 클라이언트
│   │   └── admin.ts                  # Supabase Admin 클라이언트
│   ├── api/
│   │   ├── dart.ts                   # DART API 유틸
│   │   ├── krx.ts                    # KRX API 유틸
│   │   ├── ecos.ts                   # ECOS API 유틸
│   │   ├── sec.ts                    # SEC EDGAR 유틸
│   │   ├── fred.ts                   # FRED API 유틸
│   │   └── news.ts                   # RSS 뉴스 수집 유틸
│   ├── ai/
│   │   └── analysis.ts              # GPT 분석 생성 유틸
│   ├── payment/
│   │   └── toss.ts                   # 토스페이먼츠 유틸
│   ├── chat/
│   │   ├── moderation.ts             # 금칙어 필터 + 제재 로직
│   │   └── realtime.ts               # Supabase Realtime 채팅 유틸
│   ├── constants/
│   │   ├── bannedWords.ts            # 금칙어 목록
│   │   ├── linkHub.ts                # 링크 허브 데이터 (카테고리별 링크 목록)
│   │   ├── countries.ts              # 국가별 설정
│   │   └── analysisTypes.ts          # 분석 기법 종류
│   └── utils/
│       ├── format.ts                 # 숫자/날짜 포맷팅
│       ├── stockCalculations.ts      # PER, PBR, RSI 등 계산 함수
│       └── permissions.ts            # 권한 체크 유틸
├── stores/
│   ├── authStore.ts                  # 인증 상태
│   ├── countryStore.ts               # 선택된 국가
│   ├── watchlistStore.ts             # 관심 종목
│   └── chatStore.ts                  # 채팅 상태
├── types/
│   ├── stock.ts                      # 주식 관련 타입
│   ├── user.ts                       # 사용자 타입
│   ├── advertiser.ts                 # 광고주 타입
│   ├── chat.ts                       # 채팅 타입
│   └── api.ts                        # API 응답 타입
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # 초기 DB 스키마
├── public/
│   ├── logo.svg
│   └── images/
├── .env.local                        # 환경변수
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 데이터베이스 스키마 (Supabase PostgreSQL)

### 반드시 아래 SQL을 Supabase에 적용할 것

```sql
-- ============================================
-- 1. 사용자 테이블
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'premium', 'advertiser', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  billing_key TEXT,  -- 토스페이먼츠 빌링키
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 관심 종목 테이블
-- ============================================
CREATE TABLE watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,         -- 종목코드 (예: 005930, AAPL)
  market TEXT NOT NULL,         -- 시장 (KOSPI, KOSDAQ, NASDAQ, NYSE)
  country TEXT NOT NULL,        -- 국가 (KR, US, JP, HK)
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol, market)
);

-- ============================================
-- 3. 종목 기본 정보 테이블
-- ============================================
CREATE TABLE stocks (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  name_ko TEXT,                 -- 한국어 이름
  name_en TEXT,                 -- 영어 이름
  market TEXT NOT NULL,         -- KOSPI, KOSDAQ, NASDAQ, NYSE
  country TEXT NOT NULL,        -- KR, US
  sector TEXT,                  -- 섹터
  industry TEXT,                -- 산업군
  market_cap BIGINT,            -- 시가총액
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, market)
);

-- ============================================
-- 4. 재무제표 데이터 테이블
-- ============================================
CREATE TABLE financials (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly')),
  period_date DATE NOT NULL,    -- 결산일 (예: 2025-12-31)
  revenue BIGINT,               -- 매출액
  operating_income BIGINT,      -- 영업이익
  net_income BIGINT,            -- 순이익
  total_assets BIGINT,          -- 총자산
  total_liabilities BIGINT,     -- 총부채
  total_equity BIGINT,          -- 자기자본
  eps NUMERIC,                  -- 주당순이익
  bps NUMERIC,                  -- 주당순자산
  per NUMERIC,                  -- PER
  pbr NUMERIC,                  -- PBR
  roe NUMERIC,                  -- ROE
  roa NUMERIC,                  -- ROA
  debt_ratio NUMERIC,           -- 부채비율
  operating_margin NUMERIC,     -- 영업이익률
  net_margin NUMERIC,           -- 순이익률
  source TEXT,                  -- 데이터 출처 (DART, SEC)
  raw_data JSONB,               -- 원본 데이터 전체 저장
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, period_type, period_date)
);

-- ============================================
-- 5. 공시 데이터 테이블
-- ============================================
CREATE TABLE disclosures (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT REFERENCES stocks(id) ON DELETE SET NULL,
  symbol TEXT,
  title TEXT NOT NULL,
  disclosure_type TEXT,         -- 유상증자, 무상증자, 자사주, CB발행, 대주주변동, 합병분할, 기타
  source TEXT NOT NULL,         -- DART, SEC
  source_url TEXT,              -- 원문 링크
  published_at TIMESTAMPTZ NOT NULL,
  ai_summary TEXT,              -- AI 요약 (GPT 생성)
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. 수급 데이터 테이블
-- ============================================
CREATE TABLE supply_demand (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  foreign_net BIGINT,           -- 외국인 순매수 (양수=매수, 음수=매도)
  institution_net BIGINT,       -- 기관 순매수
  individual_net BIGINT,        -- 개인 순매수
  foreign_cumulative BIGINT,    -- 외국인 누적 순매수
  program_net BIGINT,           -- 프로그램 매매
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, trade_date)
);

-- ============================================
-- 7. 공매도 / 신용잔고 테이블
-- ============================================
CREATE TABLE short_credit (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  short_volume BIGINT,          -- 공매도 거래량
  short_balance BIGINT,         -- 공매도 잔고
  short_ratio NUMERIC,          -- 공매도 비율
  credit_balance BIGINT,        -- 신용잔고
  loan_balance BIGINT,          -- 대차잔고
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, trade_date)
);

-- ============================================
-- 8. 내부자 거래 테이블
-- ============================================
CREATE TABLE insider_trades (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  insider_name TEXT NOT NULL,
  position TEXT,                -- 직위 (CEO, CFO, 이사 등)
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  shares BIGINT NOT NULL,
  price NUMERIC,
  total_amount BIGINT,
  trade_date DATE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. 배당 데이터 테이블
-- ============================================
CREATE TABLE dividends (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  fiscal_year INT NOT NULL,
  dividend_per_share NUMERIC,
  dividend_yield NUMERIC,
  payout_ratio NUMERIC,         -- 배당성향
  ex_dividend_date DATE,        -- 배당락일
  payment_date DATE,            -- 지급일
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, fiscal_year)
);

-- ============================================
-- 10. 뉴스 테이블
-- ============================================
CREATE TABLE news (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT REFERENCES stocks(id) ON DELETE SET NULL,
  symbol TEXT,
  title TEXT NOT NULL,
  source TEXT NOT NULL,          -- 출처 (네이버증권, Bloomberg 등)
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  summary_ko TEXT,              -- 한국어 요약 (해외뉴스의 경우 AI 번역)
  country TEXT,                 -- 뉴스 대상 국가
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. 거시경제 지표 테이블
-- ============================================
CREATE TABLE macro_indicators (
  id BIGSERIAL PRIMARY KEY,
  indicator_name TEXT NOT NULL,  -- 기준금리, CPI, GDP, 환율, 유가 등
  country TEXT NOT NULL,         -- KR, US
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_rate NUMERIC,
  unit TEXT,                     -- %, 원, 달러, 배럴 등
  measured_at DATE NOT NULL,
  source TEXT,                   -- ECOS, FRED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(indicator_name, country, measured_at)
);

-- ============================================
-- 12. AI 분석 결과 테이블
-- ============================================
CREATE TABLE ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('value', 'technical', 'quant', 'dividend', 'supply')),
  content_ko TEXT NOT NULL,      -- 한국어 분석 텍스트
  content_en TEXT,               -- 영어 분석 텍스트 (추후)
  data_snapshot JSONB,           -- 분석에 사용된 데이터 스냅샷
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,        -- 만료 시점 (재생성 필요 시점)
  UNIQUE(stock_id, analysis_type)
);

-- ============================================
-- 13. 채팅 메시지 테이블
-- ============================================
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  room TEXT NOT NULL DEFAULT 'general',  -- general, kospi, nasdaq, free
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. 채팅 제재 테이블
-- ============================================
CREATE TABLE chat_penalties (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('warning', 'mute_30min', 'mute_1month')),
  reason TEXT,
  warning_count INT NOT NULL DEFAULT 1,
  muted_until TIMESTAMPTZ,       -- 정지 해제 시각
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. 광고주 테이블
-- ============================================
CREATE TABLE advertisers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advertiser_type TEXT NOT NULL CHECK (advertiser_type IN ('verified', 'general')),
  company_name TEXT,
  business_registration_number TEXT,  -- 사업자등록번호
  business_registration_image TEXT,   -- 사업자등록증 이미지 URL (Supabase Storage)
  representative_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_approved BOOLEAN DEFAULT FALSE,  -- 인증업체 승인 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 16. 배너 테이블
-- ============================================
CREATE TABLE banners (
  id BIGSERIAL PRIMARY KEY,
  advertiser_id BIGINT NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                -- 제목 (30자 이내)
  link_url TEXT NOT NULL,             -- 링크 (단톡방 or 상품페이지)
  banner_image_url TEXT,              -- 배너 이미지 URL
  product_type TEXT CHECK (product_type IN ('investment_product', 'reading_room', 'education', 'other')),
  description TEXT,                   -- 상세 설명 (500자 이내)
  banner_tier TEXT NOT NULL CHECK (banner_tier IN ('premium', 'standard')),  -- 인증=premium, 일반=standard
  position_priority INT DEFAULT 0,    -- 노출 우선순위
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired')),
  payment_amount INT,                 -- 결제 금액 (원)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 17. 배너 클릭 로그 테이블
-- ============================================
CREATE TABLE banner_clicks (
  id BIGSERIAL PRIMARY KEY,
  banner_id BIGINT NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_location TEXT               -- 어느 페이지에서 클릭했는지
);

-- ============================================
-- 18. 결제 내역 테이블
-- ============================================
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'banner')),
  amount INT NOT NULL,               -- 결제 금액 (원)
  payment_method TEXT,               -- card, kakaopay, naverpay, tosspay
  payment_key TEXT,                  -- 토스페이먼츠 paymentKey
  order_id TEXT NOT NULL UNIQUE,     -- 주문번호
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  banner_id BIGINT REFERENCES banners(id),  -- 배너 결제인 경우
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 19. 링크 허브 데이터 테이블
-- ============================================
CREATE TABLE link_hub (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,              -- KR, US, JP, HK
  category TEXT NOT NULL,             -- news, disclosure, exchange, macro, chart, research, community
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  description TEXT,                   -- 한 줄 설명
  logo_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 20. 금칙어 테이블
-- ============================================
CREATE TABLE banned_words (
  id BIGSERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',    -- general, investment, spam
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_stocks_symbol_market ON stocks(symbol, market);
CREATE INDEX idx_stocks_country ON stocks(country);
CREATE INDEX idx_stocks_sector ON stocks(sector);
CREATE INDEX idx_financials_stock_id ON financials(stock_id);
CREATE INDEX idx_disclosures_stock_id ON disclosures(stock_id);
CREATE INDEX idx_disclosures_published ON disclosures(published_at DESC);
CREATE INDEX idx_supply_demand_stock_date ON supply_demand(stock_id, trade_date DESC);
CREATE INDEX idx_short_credit_stock_date ON short_credit(stock_id, trade_date DESC);
CREATE INDEX idx_news_stock_id ON news(stock_id);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_chat_messages_room ON chat_messages(room, created_at DESC);
CREATE INDEX idx_banners_active ON banners(is_active, banner_tier, start_date, end_date);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_ai_analysis_stock ON ai_analysis(stock_id, analysis_type);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 데이터만 수정 가능
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 관심종목은 자기 것만
CREATE POLICY "Users can manage own watchlist" ON watchlist FOR ALL USING (auth.uid() = user_id);

-- 채팅 메시지는 누구나 읽을 수 있고, 로그인 사용자만 작성
CREATE POLICY "Anyone can read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chat" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 공개 데이터 테이블은 누구나 읽기 가능
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stocks" ON stocks FOR SELECT USING (true);
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read financials" ON financials FOR SELECT USING (true);
ALTER TABLE disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read disclosures" ON disclosures FOR SELECT USING (true);
ALTER TABLE supply_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read supply_demand" ON supply_demand FOR SELECT USING (true);
ALTER TABLE short_credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read short_credit" ON short_credit FOR SELECT USING (true);
ALTER TABLE insider_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insider_trades" ON insider_trades FOR SELECT USING (true);
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read dividends" ON dividends FOR SELECT USING (true);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news" ON news FOR SELECT USING (true);
ALTER TABLE macro_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read macro" ON macro_indicators FOR SELECT USING (true);
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ai_analysis" ON ai_analysis FOR SELECT USING (true);
ALTER TABLE link_hub ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read link_hub" ON link_hub FOR SELECT USING (true);
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read banned_words" ON banned_words FOR SELECT USING (true);

-- 배너는 누구나 읽기 (활성화된 것만), 광고주만 자기 것 관리
CREATE POLICY "Anyone can read active banners" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "Advertisers manage own banners" ON banners FOR ALL USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
);

-- 광고주는 자기 정보만
CREATE POLICY "Advertisers manage own profile" ON advertisers FOR ALL USING (auth.uid() = user_id);

-- 결제는 자기 것만
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
```

---

## 페이지별 상세 구현 명세

---

### 페이지 0: 공통 레이아웃 (app/layout.tsx)

모든 페이지에 공통으로 적용되는 레이아웃. 아래 4개 요소가 항상 존재해야 한다.

#### 0-1. 헤더 (Header.tsx)
- **고정 위치**: 화면 상단에 고정 (sticky top-0)
- **배경**: 다크 네이비 (#0F1724) 또는 이에 준하는 금융 플랫폼 느낌의 다크 색상
- **좌측**:
  - 로고 이미지 + 사이트명 (클릭 시 홈으로 이동)
  - 국가 선택 드롭다운 (기본값: 한국 🇰🇷)
    - 옵션: 한국 🇰🇷 / 미국 🇺🇸 (추후 일본 🇯🇵, 홍콩 🇭🇰 추가)
    - 선택 시 Zustand countryStore 업데이트 → 전체 사이트 데이터 변경
- **중앙**:
  - 메뉴: 홈 | 링크허브 | 종목검색 | 기법분석
  - 현재 페이지 활성 표시 (하단 바 또는 색상 변경)
- **우측**:
  - 종목 빠른 검색 바 (돋보기 아이콘 + 입력창)
    - 입력 시 자동완성 드롭다운 (종목명/종목코드 매칭)
    - 선택 시 해당 종목 상세 대시보드로 이동
  - 비로그인: "로그인" | "회원가입" 버튼
  - 로그인 후: 프로필 아이콘 + 닉네임 드롭다운
    - 드롭다운 메뉴: 마이페이지 | 관심종목 | 구독관리 | 로그아웃
  - 무료회원: "프리미엄 시작하기" 강조 버튼 (노란색/금색 계열)

#### 0-2. 실시간 티커 바 (TickerBar.tsx)
- **위치**: 헤더 바로 아래, 모든 페이지에서 고정 (sticky)
- **배경**: 헤더보다 약간 밝은 다크 (#1A2332)
- **구현**: TradingView Ticker Tape 위젯 사용
  - 위젯 URL: https://www.tradingview.com/widget/ticker-tape/
- **표시 항목** (가로 스크롤, 자동 흐름):
  - 한국 선택 시: KOSPI | KOSDAQ | NASDAQ | S&P500 | DOW | USD/KRW | WTI유가 | 금 | BTC
  - 미국 선택 시: NASDAQ | S&P500 | DOW | RUSSELL2000 | USD/KRW | WTI유가 | 금 | BTC | KOSPI
- **스타일**:
  - 상승: 빨간색 (#FF3B30), 하락: 파란색 (#007AFF) (한국 주식 관례)
  - 각 항목: 지수명 + 현재값 + 등락률(▲▼)
  - 마우스 호버 시 스크롤 일시정지

#### 0-3. 플로팅 채팅 (FloatingChat.tsx)
- **위치**: 좌측 하단 고정 (fixed bottom-4 left-4)
- **닫힌 상태**:
  - 원형 채팅 아이콘 버튼 (직경 56px)
  - 아이콘 위에 현재 접속자 수 배지 (빨간 원 + 숫자)
  - 호버 시 "실시간 채팅" 툴팁
- **열린 상태** (아이콘 클릭 시):
  - 팝업 크기: 400px 너비 x 500px 높이
  - 상단 바: "실시간 채팅" 제목 + 접속자 수 + 최소화 버튼 + 닫기 버튼
  - 채팅방 선택 탭: 전체 | 코스피 | 나스닥 | 자유
  - 메시지 영역:
    - 최근 50개 메시지 표시
    - 각 메시지: 닉네임(볼드) + 시간(회색, 작은 텍스트) + 내용
    - 자동 스크롤 (신규 메시지 수신 시 하단으로)
    - 메시지 우클릭 시 "신고" 옵션
  - 입력창:
    - 비로그인: "채팅에 참여하려면 로그인하세요" 안내 + 로그인 버튼
    - 로그인: 텍스트 입력창 + 전송 버튼
    - Enter 키로 전송
  - **채팅 규칙 시스템** (ChatModeration.ts에서 처리):
    - 금칙어 필터: banned_words 테이블에서 목록 로드
      - 초기 금칙어: "사세요", "매수추천", "급등예정", "수익보장", "원금보장", "확정수익", "매도추천", "떡상", "지금들어가", "리딩방", "단톡방", "카톡방", "텔레방"
    - 금칙어 포함 메시지 → 전송 차단 + "해당 표현은 사용할 수 없습니다" 알림
    - 외부 링크(http://, https://, www.) 포함 메시지 → 전송 차단 + "외부 링크는 입력할 수 없습니다" 알림
    - 동일 메시지 3회 연속 반복 → 자동 경고
    - 10초 내 3개 이상 메시지 전송 → 1분 쿨다운
    - 제재 단계:
      - 1회 위반: 경고 메시지 표시 (chat_penalties에 warning 기록)
      - 2회 위반: 30분 채팅 정지 (muted_until 설정)
      - 3회 위반: 1개월 채팅 정지
    - 정지 상태: 입력창 비활성화 + "채팅 정지 상태입니다. 해제일: YYYY-MM-DD HH:mm" 표시
  - **Supabase Realtime 구현**:
    - 채널: `chat:{room}` (예: chat:general, chat:kospi)
    - INSERT 이벤트 구독 → 실시간 메시지 수신
    - 메시지 전송: chat_messages 테이블에 INSERT

#### 0-4. 푸터 (Footer.tsx)
- **배경**: 다크 (#0F1724)
- **레이아웃**: 6개 섹션을 4컬럼 그리드로 배치

**섹션 1: 서비스 안내**
- 서비스 소개 (링크 → /about — 추후 제작)
- 이용가이드 (링크 → /guide — 추후 제작)
- 자주 묻는 질문 (링크 → /faq — 추후 제작)
- 공지사항 (링크 → /notice — 추후 제작)

**섹션 2: 약관/정책**
- 이용약관 (링크 → /terms)
- 개인정보처리방침 (링크 → /privacy)
- 광고 게재 약관 (링크 → /ad-terms)
- 환불 정책 (링크 → /refund-policy)

**섹션 3: 광고/제휴**
- 광고 문의 (링크 → /advertiser)
- 제휴 문의 (이메일 링크)
- 데이터 제공 문의 (이메일 링크)
- 미디어/언론 문의 (이메일 링크)

**섹션 4: 고객지원**
- 이메일: support@[도메인].com
- 카카오톡 문의: @[브랜드명]
- 운영시간: 평일 09:00 ~ 18:00
- 문의 응답: 영업일 기준 1~2일 이내

**면책 고지 영역** (전체 너비, 구분선 위):
- 배경: 약간 더 어두운 색상
- 텍스트 (회색, 작은 폰트):
  - "본 사이트는 공개된 금융 데이터를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다. 모든 투자 판단과 그에 따른 결과의 책임은 투자자 본인에게 있습니다. 본 사이트에서 제공하는 정보의 정확성, 완전성을 보장하지 않으며, 이를 기반으로 한 투자 손실에 대해 어떠한 책임도 지지 않습니다."
  - "광고 배너는 광고주가 직접 등록한 것이며, 본 사이트는 광고 내용에 대한 책임을 지지 않습니다. 인증업체 마크는 사업자등록 확인을 의미하며, 상품의 품질이나 수익을 보증하지 않습니다."

**사업자 정보**:
- 상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력]
- 통신판매업 신고번호: [추후 입력] | 주소: [추후 입력]
- 연락처: [추후 입력] | 이메일: [추후 입력]

**최하단**:
- "© 2026 [브랜드명]. All rights reserved."

---

### 페이지 1: 홈 — 메인 대시보드 (app/page.tsx)

**전체 너비 사용 (채팅이 플로팅으로 빠졌으므로)**

#### 1-1. 시장 요약 카드 (MarketSummaryCards.tsx)
- **레이아웃**: 가로 스크롤 가능한 카드 행 (flex, overflow-x-auto)
- **카드 항목** (한국 선택 시):
  - 코스피 지수 | 코스닥 지수 | 나스닥 지수 | S&P500 지수 | 원/달러 환율 | 국제유가(WTI) | 금 시세 | 비트코인
- **각 카드 내용**:
  - 지표명
  - 현재 값 (큰 폰트)
  - 등락률 (▲빨간 / ▼파란 + 퍼센트)
  - 미니 차트 (최근 30일 추이 — 간단한 라인 차트, recharts 사용)
- **데이터 소스**: TradingView 위젯 또는 KRX API / Yahoo Finance API
- **업데이트 주기**: 장중 실시간 (위젯 사용 시 자동), API 사용 시 1분 간격

#### 1-2. 오늘의 주요 공시 + 뉴스 (2컬럼 배치)

**좌측: 오늘의 주요 공시 (TodayDisclosures.tsx)**
- 제목: "오늘의 주요 공시" + "더보기 →" 링크
- 리스트: 최근 10건
- 각 항목: 시간(HH:mm) | 종목명 | 공시 제목
- 종목명 클릭 → 종목 상세 대시보드로 이동
- 공시 제목 클릭 → DART 원문 링크 새 탭 열기
- 데이터: disclosures 테이블에서 today 날짜 필터

**우측: 오늘의 주요 뉴스 (TodayNews.tsx)**
- 제목: "주요 뉴스" + "더보기 →" 링크
- 리스트: 최근 10건
- 각 항목: 시간(HH:mm) | 뉴스 제목 | 출처(네이버증권, 한경 등)
- 클릭 → 원문 링크 새 탭 열기
- 데이터: news 테이블에서 today 날짜 필터

#### 1-3. 수급 요약 (SupplyDemandSummary.tsx)
- **레이아웃**: 2컬럼
- **좌측**: 오늘 외국인 순매수 TOP 5 (종목명 + 순매수 금액)
- **우측**: 오늘 기관 순매수 TOP 5 (종목명 + 순매수 금액)
- 각 종목 클릭 → 종목 상세 대시보드
- 데이터: supply_demand 테이블에서 today 날짜

#### 1-4. 상승/하락/거래량 TOP (TopMovers.tsx)
- **레이아웃**: 3컬럼 탭 방식
- **탭 1**: 상승률 TOP 10 (종목명 + 현재가 + 등락률)
- **탭 2**: 하락률 TOP 10 (종목명 + 현재가 + 등락률)
- **탭 3**: 거래량 TOP 10 (종목명 + 현재가 + 거래량)
- 각 종목 클릭 → 종목 상세 대시보드

#### 1-5. 배너 영역 (BannerSection.tsx)
- **인증업체 배너**: 메인 콘텐츠 우측 사이드바 또는 콘텐츠 중간에 삽입
  - 큰 사이즈 (300x250 또는 728x90)
  - "인증업체" 마크 (체크 아이콘 + 파란 배지)
  - 배너 이미지 + 제목
  - 클릭 시: banner_clicks에 로그 기록 → link_url로 이동 또는 광고주 상세페이지
- **일반 배너**: 하단에 배치
  - 작은 사이즈 (300x100 또는 텍스트 배너)
  - 상단 고지 문구: "아래 단톡방은 사업자인증을 한 것이 아니니 참고용으로만 이용해주세요" (회색 배경, 작은 텍스트)
  - 배너 리스트 (가로 스크롤 또는 그리드)
- **배너 노출 로직**:
  - banners 테이블에서 is_active=true AND start_date <= today AND end_date >= today 조건
  - banner_tier='premium'이 상단, 'standard'가 하단
  - position_priority 기준 정렬
  - 광고가 없을 때: 자체 프로모션 배너 ("광고주가 되어보세요" 등)

---

### 페이지 2: 링크 허브 (app/link-hub/page.tsx)

**모든 사용자 무료 접근 가능**

#### 2-1. 상단
- 페이지 제목: "투자 정보 허브"
- 설명: "주식 투자에 필요한 모든 사이트를 카테고리별로 정리했습니다"
- 국가 표시: 현재 선택된 국가 (국가 변경 시 링크 목록 변경)

#### 2-2. 카테고리 탭 바 (가로, sticky)
- 클릭 시 해당 섹션으로 스크롤
- 탭: 뉴스/기사 | 공시/재무 | 거래소/시장데이터 | 거시경제 | 차트/분석도구 | 증권사리서치 | 커뮤니티

#### 2-3. 각 카테고리 섹션
- 데이터: link_hub 테이블에서 country + category 필터
- **각 링크 카드**:
  - 사이트 로고 (logo_url — 없으면 파비콘 또는 기본 아이콘)
  - 사이트명 (볼드)
  - 한 줄 설명 (description)
  - "바로가기 →" 버튼 (새 탭 열기)
- **한국 기준 초기 데이터** (link_hub 테이블에 시드 데이터로 입력):

```
카테고리: news (뉴스/기사)
- 네이버 증권 뉴스 | https://finance.naver.com/news/ | 종합 주식 뉴스, 실시간 속보
- 한국경제 | https://www.hankyung.com/economy | 경제 전문 일간지
- 매일경제 | https://www.mk.co.kr/economy | 경제 전문 일간지
- 이데일리 | https://www.edaily.co.kr | 증권/금융 전문 미디어
- 머니투데이 | https://www.mt.co.kr | 경제/금융 뉴스
- 파이낸셜뉴스 | https://www.fnnews.com | 금융 전문 뉴스
- 서울경제 | https://www.sedaily.com | 종합 경제 뉴스
- 아시아경제 | https://www.asiae.co.kr | 종합 경제 뉴스
- 연합인포맥스 | https://www.yonhapnews.co.kr | 실시간 금융정보

카테고리: disclosure (공시/재무)
- DART 전자공시시스템 | https://dart.fss.or.kr | 상장기업 공시, 재무제표, 감사보고서
- 금융감독원 | https://www.fss.or.kr | 금융감독 정보, 기업분석
- NICE신용평가 | https://www.nicerating.com | 기업 신용등급, 신용분석
- 한국신용평가 | https://www.kisrating.com | 기업 신용등급 평가

카테고리: exchange (거래소/시장데이터)
- 한국거래소(KRX) | https://www.krx.co.kr | 수급 데이터, 공매도 잔고, 거래량, 시가총액
- KRX 정보데이터시스템 | http://data.krx.co.kr | 상세 시장 데이터, 통계
- KOSCOM | https://www.koscom.co.kr | 금융 데이터 서비스

카테고리: macro (거시경제)
- 한국은행 ECOS | https://ecos.bok.or.kr | 기준금리, GDP, CPI, 통화량 등 경제통계
- 통계청 KOSIS | https://kosis.kr | 국가 통계 데이터
- 기획재정부 | https://www.moef.go.kr | 경제정책, 재정 현황

카테고리: chart (차트/분석도구)
- TradingView | https://www.tradingview.com | 실시간 차트, 기술적 분석, 글로벌 시장
- 알파스퀘어 | https://www.alphasquare.co.kr | 퀀트 분석, 종목 스크리너
- Investing.com | https://kr.investing.com | 글로벌 시장 데이터, 경제 캘린더
- Finviz | https://finviz.com | 미국 주식 스크리너, 히트맵

카테고리: research (증권사 리서치)
- 키움증권 리서치 | https://www.kiwoom.com | 종목분석, 산업분석 리포트
- 미래에셋증권 리서치 | https://securities.miraeasset.com | 투자전략, 종목분석
- 삼성증권 리서치 | https://www.samsungpop.com | 시장분석, 종목분석
- NH투자증권 리서치 | https://www.nhqv.com | 투자전략 리포트
- 한국투자증권 리서치 | https://www.truefriend.com | 종목분석, 시장전망

카테고리: community (커뮤니티)
- 네이버 종목토론방 | https://finance.naver.com | 종목별 투자자 토론
- 팍스넷 | https://www.paxnet.co.kr | 주식 커뮤니티, 종목토론
- Investing.com 포럼 | https://kr.investing.com/analysis | 투자 분석, 의견 교환
```

```
카테고리: news (미국 기준)
- Bloomberg | https://www.bloomberg.com | 글로벌 금융 뉴스
- Reuters | https://www.reuters.com/business | 글로벌 비즈니스 뉴스
- CNBC | https://www.cnbc.com | 미국 금융 전문 미디어
- MarketWatch | https://www.marketwatch.com | 시장 데이터, 뉴스
- Seeking Alpha | https://seekingalpha.com | 투자 분석, 종목 리서치
- Yahoo Finance | https://finance.yahoo.com | 종합 금융 데이터

카테고리: disclosure (미국 기준)
- SEC EDGAR | https://www.sec.gov/edgar | 미국 기업 공시 (10-K, 10-Q, 8-K)
- Macrotrends | https://www.macrotrends.net | 장기 재무 데이터, 차트
- GuruFocus | https://www.gurufocus.com | 가치투자 분석, 재무 데이터

카테고리: exchange (미국 기준)
- NYSE | https://www.nyse.com | 뉴욕증권거래소
- NASDAQ | https://www.nasdaq.com | 나스닥 증권거래소
- CBOE | https://www.cboe.com | 옵션/변동성 데이터

카테고리: macro (미국 기준)
- FRED | https://fred.stlouisfed.org | 미국 연준 경제데이터
- BLS | https://www.bls.gov | 미국 노동통계국
- BEA | https://www.bea.gov | 미국 경제분석국

카테고리: chart (미국 기준)
- TradingView | https://www.tradingview.com | 실시간 차트, 기술적 분석
- Finviz | https://finviz.com | 스크리너, 히트맵, 뉴스
- StockCharts | https://stockcharts.com | 기술적 분석 차트
- Barchart | https://www.barchart.com | 시장 데이터, 옵션 분석

카테고리: research (미국 기준)
- Morningstar | https://www.morningstar.com | 펀드/주식 분석 리서치
- Zacks | https://www.zacks.com | 종목 등급, 실적 추정치
- S&P Global | https://www.spglobal.com | 신용등급, 시장 분석

카테고리: community (미국 기준)
- Reddit r/investing | https://www.reddit.com/r/investing | 투자 토론 커뮤니티
- Reddit r/wallstreetbets | https://www.reddit.com/r/wallstreetbets | 개인투자자 커뮤니티
- StockTwits | https://stocktwits.com | 종목별 실시간 의견
```

---

### 페이지 3: 종목 검색/리스트 (app/stocks/page.tsx)

**리스트 열람은 무료, 종목 클릭하여 상세 대시보드 접근은 유료**

#### 3-1. 검색 영역
- 큰 검색 바 (페이지 상단 중앙)
- placeholder: "종목명 또는 종목코드를 입력하세요 (예: 삼성전자, 005930, AAPL)"
- 입력 시 실시간 자동완성: stocks 테이블에서 name_ko, name_en, symbol ILIKE 검색
- 자동완성 드롭다운: 종목코드 + 종목명 + 시장 표시

#### 3-2. 필터/정렬 바 (StockFilters.tsx)
- **시장 필터** (토글 버튼):
  - 한국: 전체 | 코스피 | 코스닥
  - 미국: 전체 | 나스닥 | NYSE
- **섹터 필터** (드롭다운):
  - 전체 | 반도체 | 바이오/헬스케어 | 2차전지/에너지 | IT/소프트웨어 | 금융 | 화학 | 자동차 | 건설 | 유통 | 엔터테인먼트 | 식품 | 통신 | 기타
- **정렬** (드롭다운):
  - 시가총액순 (기본) | 등락률순 | 거래량순 | PER 낮은순 | PER 높은순 | PBR 낮은순 | 배당수익률 높은순

#### 3-3. 종목 리스트 테이블 (StockList.tsx)
- **테이블 컬럼**:
  - ★ (관심종목 추가/제거 — 별표 아이콘, 로그인 필요)
  - 종목코드
  - 종목명
  - 현재가
  - 등락률 (빨간/파란 색상)
  - 거래량
  - 시가총액
  - PER
  - PBR
  - 배당수익률
- **행 클릭 시**:
  - 유료 회원: /stocks/[symbol] 종목 상세 대시보드로 이동
  - 무료 회원: PaywallModal 표시 ("프리미엄 구독 시 종목별 상세 분석을 볼 수 있습니다" + 구독 버튼)
- **페이지네이션**: 한 페이지 50개, 하단 페이지 번호
- **관심종목 탭**: 상단에 "전체 종목 | 내 관심종목" 탭
  - 관심종목 탭: watchlist 테이블에서 user_id로 필터

---

### 페이지 4: 종목 상세 대시보드 (app/stocks/[symbol]/page.tsx)

**유료 구독 전용 — AuthGuard 컴포넌트로 접근 제어**

#### 4-0. 접근 제어 (AuthGuard.tsx)
- 비로그인/무료회원 접근 시: PaywallModal 표시
- 유료회원(role='premium'): 정상 접근

#### 4-1. 종목 헤더 (StockHeader.tsx)
- **좌측**: 종목명(큰 폰트) + 종목코드 + 시장(KOSPI/NASDAQ 배지)
- **중앙**: 현재가(매우 큰 폰트) + 등락폭 + 등락률(▲▼, 빨간/파란)
- **우측**: 관심종목 추가 버튼(★) + "기법별 분석" 버튼(→ /stocks/[symbol]/analysis)

#### 4-2. 탭 네비게이션 (가로 탭, sticky)
[차트] [재무제표] [공시] [수급] [공매도/신용] [내부자] [배당] [뉴스] [섹터] [거시경제]

#### 4-3. 차트 탭 (ChartTab.tsx) — 기본 선택
- TradingView 고급 차트 위젯 (Advanced Real-Time Chart Widget)
  - 위젯 URL: https://www.tradingview.com/widget/advanced-chart/
  - symbol: 선택된 종목 (예: KRX:005930, NASDAQ:AAPL)
  - 기간 전환: 1일/1주/1개월/3개월/1년/5년
  - 기술적 지표: MA(5,20,60,120), 볼린저밴드, RSI, MACD, 스토캐스틱 오버레이
  - 거래량 차트 포함
- **높이**: 최소 500px

#### 4-4. 재무제표 탭 (FinancialsTab.tsx)
- **토글**: 연간 | 분기별
- **요약 카드** (가로 배치):
  - 매출액 (최근값 + 전년대비 증감)
  - 영업이익 (최근값 + 전년대비 증감)
  - 순이익 (최근값 + 전년대비 증감)
  - ROE | PER | PBR | 부채비율
- **추이 차트** (recharts 사용):
  - 매출액/영업이익/순이익 바 차트 (최근 5년 또는 8분기)
  - 영업이익률/순이익률 라인 차트
- **상세 테이블**:
  - 행: 매출액, 영업이익, 순이익, 총자산, 총부채, 자기자본, EPS, BPS, PER, PBR, ROE, ROA, 부채비율, 영업이익률, 순이익률
  - 열: 최근 5년 또는 8분기
- **DART 원문 링크**: "재무제표 원문 보기 →" 버튼 (DART 페이지로 이동)
- **AI 요약** (하단, 연한 배경 카드):
  - ai_analysis 테이블에서 analysis_type='value' 로드
  - 예시: "최근 4분기 영업이익이 연속 증가 중이며, 부채비율은 42%로 안정적입니다. ROE 15.3%는 동종업계 평균 10.2%를 상회합니다."
- 데이터: financials 테이블

#### 4-5. 공시 탭 (DisclosuresTab.tsx)
- **필터 버튼**: 전체 | 유상증자 | 무상증자 | 자사주 | CB발행 | 대주주변동 | 합병분할 | 기타
- **공시 리스트**:
  - 각 행: 날짜(YYYY-MM-DD) | 공시유형(배지) | 공시제목 | AI요약(한줄) | 원문보기(→)
  - 원문보기 클릭 → source_url 새 탭 열기
- **최근 50건 표시, "더 불러오기" 버튼**
- 데이터: disclosures 테이블에서 stock_id 필터

#### 4-6. 수급 탭 (SupplyDemandTab.tsx)
- **수급 추이 차트** (recharts):
  - X축: 날짜 (최근 20거래일)
  - Y축: 순매수 금액
  - 3개 라인: 외국인(빨강), 기관(파랑), 개인(초록)
- **외국인 누적 순매수 차트** (라인)
- **연속 순매수일수 표시**: "외국인 연속 7거래일 순매수" (강조 배지)
- **상세 테이블**:
  - 행: 최근 20거래일
  - 열: 날짜 | 외국인 순매수 | 기관 순매수 | 개인 순매수 | 프로그램 매매
- **AI 요약**: "외국인이 최근 7거래일 연속 순매수 중이며, 누적 매수량은 1,234,567주입니다."
- 데이터: supply_demand 테이블

#### 4-7. 공매도/신용 탭 (ShortSellingTab.tsx)
- **공매도 잔고 추이 차트** (최근 30거래일, 바 차트)
- **공매도 비율 라인** (거래량 대비 %)
- **신용잔고 추이 차트** (최근 30거래일)
- **대차잔고 추이 차트**
- **AI 요약**: "공매도 잔고가 최근 2주간 30% 감소하여 숏커버링 가능성이 있습니다."
- 데이터: short_credit 테이블

#### 4-8. 내부자 탭 (InsiderTab.tsx)
- **내부자 거래 테이블**:
  - 열: 거래일 | 이름 | 직위 | 매수/매도(배지) | 수량 | 단가 | 총금액
  - 매수: 초록 배지, 매도: 빨강 배지
- **최근 6개월 내부자 거래 추이 차트** (매수/매도 바 차트)
- **DART 원문 링크** (해당 공시 링크)
- 데이터: insider_trades 테이블

#### 4-9. 배당 탭 (DividendTab.tsx)
- **배당 요약 카드**:
  - 주당 배당금 | 배당수익률 | 배당성향 | 배당락일
- **과거 5년 배당 이력 테이블 + 차트** (바 차트)
- **동종업계 배당수익률 비교** (수평 바 차트)
- 데이터: dividends 테이블

#### 4-10. 뉴스 탭 (NewsTab.tsx)
- **뉴스 리스트**:
  - 각 행: 시간 | 제목 | 출처 | 링크(→)
  - 클릭 → 원문 새 탭 열기
- **최근 30일 뉴스**
- **나스닥 종목의 경우**: summary_ko에 AI 한국어 번역 요약 표시
- 데이터: news 테이블에서 stock_id 필터

#### 4-11. 섹터 탭 (SectorTab.tsx)
- **섹터명 표시**: "반도체" (해당 종목의 sector)
- **같은 섹터 종목 리스트**: 시가총액순 상위 20개
  - 열: 종목명 | 시가총액 | PER | 등락률(오늘)
  - 현재 보고 있는 종목 하이라이트
- **섹터 내 포지션**: "시가총액 기준 섹터 내 3위 / 45개 중"
- **섹터 전체 자금흐름 차트** (최근 30일, 외국인 순매수 합계)
- 데이터: stocks 테이블에서 sector 필터

#### 4-12. 거시경제 탭 (MacroTab.tsx)
- **주요 지표 카드** (현재값 + 추이 미니차트):
  - 한국 기준금리 | 미국 기준금리 | 원/달러 환율 | 유가(WTI) | CPI
- **각 지표 클릭 시**: 상세 추이 차트 확장 (최근 12개월)
- **AI 요약**: "현재 금리 인하 기조로 성장주에 유리한 환경이며, 원/달러 환율은 1,350원대로 수출주에 긍정적입니다."
- 데이터: macro_indicators 테이블

---

### 페이지 5: 기법별 분석 (app/stocks/[symbol]/analysis/page.tsx)

**유료 구독 전용**

#### 5-0. 페이지 헤더
- 종목명 + 종목코드 표시
- "← 종목 대시보드로 돌아가기" 링크

#### 5-1. 분석 기법 탭
[가치투자] [기술적분석] [퀀트] [배당투자] [수급분석]

#### 5-2. 가치투자 분석 (ValueAnalysis.tsx)
- **핵심 지표 카드**: PER | PBR | PSR | PCR | EV/EBITDA
- **동종업계 비교 차트** (수평 바):
  - 해당 종목 vs 섹터 평균 vs 시장 평균
  - 각 지표별 위치 표시
- **그레이엄 안전마진 계산**:
  - 공식: (내재가치 - 현재가) / 내재가치 × 100
  - 내재가치 = √(22.5 × EPS × BPS)
  - 결과 표시: "현재가 기준 안전마진: +15.3% (저평가 가능성)"
- **DCF 간이 모델**:
  - 최근 영업이익 기반 추정 FCF
  - 할인율: 10% (기본값)
  - 성장률: 최근 3년 영업이익 CAGR
  - 적정가 계산 결과 표시
- **AI 정리**: "가치투자 관점에서 이 종목의 데이터를 정리하면, PER 12.3배는 동종업계 평균 15.2배 대비 낮으며, PBR 1.1배, ROE 15.3%를 고려할 때..."
- **면책 고지** (하단): "위 내용은 가치투자 기법의 데이터 기준으로 정리한 것이며, 투자 권유가 아닙니다. 모든 투자의 책임은 본인에게 있습니다."

#### 5-3. 기술적 분석 (TechnicalAnalysis.tsx)
- **이동평균선 상태**:
  - 5일 / 20일 / 60일 / 120일 MA 값 표시
  - 배열 상태: "정배열" (단기 > 장기) 또는 "역배열" (단기 < 장기)
  - 골든크로스/데드크로스 발생 여부
- **RSI (14일)**:
  - 현재값 + 게이지 차트 (0-100, 과매수>70 빨강, 과매도<30 파랑)
- **MACD**:
  - MACD 라인, 시그널 라인, 히스토그램 값
  - 상태: "매수 시그널 (MACD > Signal)" 또는 "매도 시그널"
- **볼린저밴드**:
  - 상단/중단/하단 값
  - 현재가 위치: "상단 밴드 근처 (과매수 영역)"
- **스토캐스틱**:
  - %K, %D 값
  - 상태: 과매수/과매도/중립
- **지지선/저항선**:
  - 최근 20일 기준 주요 지지/저항 가격대 2개씩
- **AI 정리**: "기술적 분석 관점에서 현재 5일, 20일 이동평균선이 정배열을 유지하고 있으며, RSI 62는 중립 영역입니다..."
- 계산 함수: lib/utils/stockCalculations.ts에 구현

#### 5-4. 퀀트 분석 (QuantAnalysis.tsx)
- **모멘텀 스코어**:
  - 3개월 수익률 | 6개월 수익률 | 12개월 수익률
  - 시장 전체 대비 백분위 (상위 몇 %)
- **밸류 스코어**:
  - PER/PBR/PSR 종합 점수
  - 점수: 1~100 (100이 최저평가)
- **퀄리티 스코어**:
  - ROE, 부채비율, 이익 안정성(최근 5년 순이익 변동성)
  - 점수: 1~100 (100이 최고 퀄리티)
- **종합 퀀트 스코어**:
  - 모멘텀(33%) + 밸류(33%) + 퀄리티(33%) 가중 평균
  - 시각화: 게이지 차트 + "상위 12%"
- **AI 정리**: "퀀트 팩터 기준으로 이 종목은 모멘텀 상위 25%, 밸류 상위 15%, 퀄리티 상위 8%에 해당하며..."

#### 5-5. 배당 투자 분석 (DividendAnalysis.tsx)
- **배당수익률**: 현재값 + 과거 5년 추이 차트
- **배당성향**: 현재값 + 추이
- **배당 성장률**: 최근 5년 CAGR
- **배당 안정성**: 과거 5년 연속 배당 여부 (Yes/No + 연속 년수)
- **배당락일 카운트다운**: "다음 배당락일까지 D-45"
- **동종업계 배당 비교 차트** (수평 바)
- **AI 정리**: "배당 투자 관점에서 이 종목은 5년 연속 배당을 유지하고 있으며, 배당수익률 3.2%는 동종업계 평균 1.8%를 크게 상회합니다..."

#### 5-6. 수급 분석 (SupplyAnalysis.tsx)
- **외국인/기관 매집 패턴**:
  - 최근 20일 누적 차트
  - 매집 강도: "강한 매수", "약한 매수", "중립", "약한 매도", "강한 매도"
- **거래량 이상 감지**:
  - 최근 20일 평균 거래량 대비 오늘 거래량 배수
  - "평균 대비 3.5배 (거래량 폭증)" 같은 표시
- **프로그램 매매 비중**: 최근 5일 프로그램 매매 비율
- **AI 정리**: "수급 관점에서 외국인이 최근 10거래일 중 8일 순매수하였으며, 거래량이 평균 대비 2.3배로 관심이 증가하고 있습니다..."

---

### 페이지 6: 광고주 센터 (app/advertiser/)

#### 6-1. 광고주 랜딩 페이지 (app/advertiser/page.tsx) — 비로그인 접근 가능
- **히어로 섹션**:
  - 제목: "투자에 관심 있는 사용자에게 직접 다가가세요"
  - 부제: "월 5만원부터 시작하는 타겟 광고"
  - CTA 버튼: "광고 시작하기" (→ 로그인 후 광고주 대시보드)
- **플랫폼 소개**:
  - DAU/MAU 수치 (추후 실제 데이터)
  - "투자에 진심인 사용자들이 모인 플랫폼"
- **광고 상품 소개 카드**:
  - **인증업체 배너**:
    - 가격: 20일 5만원
    - 위치: 프리미엄 영역 (상단, 큰 사이즈)
    - "인증업체" 마크 부여
    - 필요서류: 사업자등록증
  - **일반 배너**:
    - 가격: 20일 3만원
    - 위치: 일반 영역 (하단, 작은 사이즈)
    - 별도 인증 불필요
- **장기 할인 안내**: 40일 -10% | 60일 -15%
- **FAQ 섹션**: 자주 묻는 질문 아코디언

#### 6-2. 광고주 대시보드 (app/advertiser/dashboard/page.tsx) — 로그인 필요

**광고주 등록이 안 된 경우: 등록 폼 표시**
- 광고주 유형 선택: 인증업체 / 일반
- **인증업체 추가 입력**:
  - 회사명
  - 사업자등록번호
  - 사업자등록증 이미지 업로드 (Supabase Storage)
  - 대표자명
  - 연락처 / 이메일
  - 제출 → 관리자 승인 대기
- **일반 광고주**: 기본 정보만 입력

**광고주 등록 완료 후: 대시보드**

**내 배너 관리 섹션**:
- 진행 중인 배너 리스트:
  - 배너 제목 | 유형(인증/일반) | 기간(시작~종료) | 상태(진행중/만료/심사중) | 클릭수 | 관리(수정/연장/삭제)
- 클릭수 그래프 (일별 차트, recharts)

**새 배너 등록 (BannerForm.tsx)**:
- 제목 (30자 이내, 실시간 글자수 카운트)
- 링크 URL (단톡방 링크 or 상품페이지 URL)
  - URL 유효성 검증
- 배너 이미지 업로드
  - 인증업체: 300x250 또는 728x90 권장
  - 일반: 300x100 권장
  - 파일 크기 제한: 2MB
  - 미리보기 표시 (BannerPreview.tsx)
- 상품 유형 선택: 투자상품 | 리딩방 | 교육 | 기타
- 상세 설명 (500자 이내)
- **금칙어 실시간 체크**:
  - 제목/설명 입력 시 금칙어 포함 여부 실시간 검증
  - 금칙어 감지 시: 빨간 경고 메시지 + 해당 부분 하이라이트
  - "다음 표현은 사용할 수 없습니다: [감지된 금칙어]"
- **주의사항 체크박스** (모두 체크해야 등록 가능):
  - ☐ 투자 수익을 보장하는 표현을 사용하지 않겠습니다
  - ☐ 허위/과장 광고를 하지 않겠습니다
  - ☐ 광고 게재 약관에 동의합니다
- **배너 위치/기간 선택**:
  - 인증업체: 프리미엄 위치 자동 배정
  - 일반: 일반 위치 자동 배정
  - 기간: 20일 / 40일(-10%) / 60일(-15%) 선택
  - 가격 자동 계산 표시
- **결제** (토스페이먼츠):
  - 카드 / 카카오페이 / 네이버페이 / 토스페이
  - 결제 완료 → banners 테이블에 INSERT + 인증업체는 관리자 승인 후 활성화, 일반은 즉시 활성화

---

### 페이지 7: 마이페이지 (app/mypage/page.tsx)

**로그인 필요**

#### 7-1. 프로필 관리
- 닉네임 변경 (중복 체크)
- 이메일 표시 (변경 불가 또는 인증 후 변경)
- 비밀번호 변경
- 프로필 이미지 업로드 (Supabase Storage)

#### 7-2. 구독 관리
- 현재 구독 상태: 무료 / 프리미엄
- 프리미엄인 경우:
  - 구독 시작일
  - 다음 결제일
  - 결제 수단
  - "구독 해지" 버튼 (해지 시 현재 기간 만료까지 이용 가능)
  - "플랜 변경" 버튼
- 무료인 경우:
  - "프리미엄 시작하기" 버튼 (→ 구독/결제 페이지)
- 결제 내역 리스트:
  - 날짜 | 금액 | 결제수단 | 상태(완료/환불)

#### 7-3. 관심 종목
- 등록한 관심 종목 리스트
  - 종목코드 | 종목명 | 현재가 | 등락률 | 삭제(X) 버튼
- 드래그앤드롭 순서 변경 (추후)
- 종목 클릭 → 종목 상세 대시보드

#### 7-4. 알림 설정
- 관심 종목 공시 알림: ON/OFF (이메일)
- 관심 종목 급등락 알림: ON/OFF + 임계값 설정 (기본 ±5%)
- 뉴스 알림: ON/OFF

#### 7-5. 채팅 관리
- 내 최근 채팅 기록 (최근 100개)
- 제재 이력: 경고/정지 날짜 + 사유
- 현재 정지 상태인 경우: 해제일 표시

---

### 페이지 8: 구독/결제 (app/pricing/page.tsx)

#### 8-1. 플랜 비교 카드 (2개)

**무료 플랜**:
- 가격: 무료
- 포함:
  - ✓ 홈 대시보드 (시장 요약, 공시, 뉴스)
  - ✓ 링크 허브 (전체 카테고리)
  - ✓ 실시간 채팅
  - ✓ 종목 리스트 열람
  - ✗ 종목 상세 대시보드
  - ✗ 기법별 분석
  - ✗ AI 데이터 정리
  - ✗ 공시/급등락 알림
- 버튼: "현재 플랜" (무료) 또는 비표시

**프리미엄 플랜**:
- 가격: 월 29,000원 (강조 표시)
- 포함:
  - ✓ 무료 플랜 모든 기능
  - ✓ 종목 상세 대시보드 (10개 탭 전체)
  - ✓ 기법별 분석 (가치/기술적/퀀트/배당/수급)
  - ✓ AI 데이터 정리 (자연어 요약)
  - ✓ 공시 실시간 알림
  - ✓ 급등락 알림
  - ✓ 관심 종목 무제한
  - ✓ 한국 + 미국 시장 통합 분석
  - ✓ 해외 뉴스 한국어 번역
- 버튼: "프리미엄 시작하기" (강조)

#### 8-2. 이용권 선택 (프리미엄 클릭 후)
- 1개월: 29,000원/월
- 3개월: 26,100원/월 (10% 할인, 총 78,300원)
- 6개월: 24,650원/월 (15% 할인, 총 147,900원)
- 12개월: 23,200원/월 (20% 할인, 총 278,400원)

#### 8-3. 결제 (PaymentForm.tsx)
- 토스페이먼츠 결제 위젯 연동
- 결제 수단: 카드 | 카카오페이 | 네이버페이 | 토스페이
- 정기결제 동의 체크박스
- 프로모션 코드 입력 (선택)
- "결제하기" 버튼

#### 8-4. 결제 후 처리
- payments 테이블에 기록
- users 테이블 업데이트: role='premium', subscription_status='active', subscription_start_date, subscription_end_date, billing_key
- 성공 페이지: "프리미엄 구독이 시작되었습니다!" + 대시보드로 이동 버튼

#### 8-5. 환불 정책 안내 (하단)
- 환불 규정 텍스트

---

### 페이지 9: 관리자 페이지 (app/admin/page.tsx)

**role='admin'인 사용자만 접근 가능**

#### 9-1. 대시보드 탭
- 총 회원 수 / 유료 회원 수 / 오늘 가입자 수
- DAU / MAU (추정)
- 오늘 구독 전환 수 / 해지 수
- 월 매출: 구독 매출 + 광고 매출
- 차트: 최근 30일 가입자 추이, 매출 추이

#### 9-2. 회원 관리 탭
- 회원 검색 (이메일/닉네임)
- 회원 리스트 테이블: 닉네임 | 이메일 | 가입일 | 구독상태 | 채팅제재이력
- 상세 보기: 프로필 정보, 결제 이력, 관심 종목, 채팅 기록
- 수동 제재/해제 기능

#### 9-3. 광고 관리 탭
- 배너 승인 대기 목록 (인증업체)
  - 사업자등록증 확인 → 승인/거부 버튼
- 전체 배너 리스트: 제목 | 광고주 | 유형 | 기간 | 상태 | 클릭수 | 결제상태
- 배너 강제 비활성화 기능
- 광고 매출 리포트 (월별)

#### 9-4. 콘텐츠 관리 탭
- 링크 허브 관리: 링크 추가/수정/삭제/순서변경
- 금칙어 관리: 추가/삭제
- 공지사항 관리 (추후)

#### 9-5. 데이터 관리 탭
- API 연동 상태 모니터링:
  - DART API: 정상/오류 + 마지막 업데이트 시각
  - KRX: 정상/오류 + 마지막 업데이트 시각
  - ECOS: 정상/오류
  - SEC EDGAR: 정상/오류
  - RSS 뉴스: 정상/오류
- 수동 데이터 업데이트 트리거 버튼 (각 소스별)
- AI 분석 재생성 버튼 (전체 또는 특정 종목)

#### 9-6. 채팅 관리 탭
- 신고 접수 목록: 신고자 | 대상자 | 메시지 내용 | 신고시각 | 처리(경고/정지/무시)
- 제재 내역 리스트
- 채팅방별 메시지 수 통계

---

## 환경변수 (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DART API
DART_API_KEY=your_dart_api_key

# 한국은행 ECOS
ECOS_API_KEY=your_ecos_api_key

# SEC EDGAR (User-Agent만 필요, API키 불필요)
SEC_USER_AGENT=your_company_name your_email

# FRED
FRED_API_KEY=your_fred_api_key

# OpenAI (GPT API)
OPENAI_API_KEY=your_openai_api_key

# 토스페이먼츠
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# 카카오 소셜 로그인 (선택)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

---

## 디자인 가이드

### 색상
- **Primary Dark (배경)**: #0F1724 (다크 네이비)
- **Secondary Dark**: #1A2332 (티커 바, 카드 배경)
- **Card Background**: #1E293B (개별 카드)
- **Text Primary**: #F8FAFC (흰색 계열)
- **Text Secondary**: #94A3B8 (회색)
- **Accent (CTA)**: #3B82F6 (파란)
- **Premium Accent**: #F59E0B (금색 — 프리미엄 강조)
- **상승**: #FF3B30 (빨강)
- **하락**: #007AFF (파랑)
- **성공/매수**: #34C759 (초록)
- **경고**: #FF9500 (주황)
- **Border**: #334155

### 폰트
- 기본: Pretendard (한국어) + Inter (영문/숫자)
- 숫자/가격: 모노스페이스 (JetBrains Mono 또는 Fira Code)

### 반응형 (PC 우선)
- 최소 너비: 1280px (PC 기준 최적화)
- 최대 너비: 1440px (중앙 정렬)
- 추후 태블릿(768px~), 모바일(~767px) 대응

---

## 개발 순서 (권장)

1. 프로젝트 초기 설정 (Next.js + Tailwind + Supabase + TypeScript)
2. DB 스키마 생성 (위 SQL 실행)
3. 공통 레이아웃 (헤더 + 티커바 + 푸터 + 플로팅채팅)
4. 인증 시스템 (회원가입 + 로그인 + Supabase Auth)
5. 홈 페이지 (시장 요약 + 공시 + 뉴스 + 수급 + TOP 종목)
6. 링크 허브 페이지
7. 종목 검색/리스트 페이지
8. 종목 상세 대시보드 (10개 탭)
9. 기법별 분석 페이지
10. 실시간 채팅 (Supabase Realtime)
11. 광고주 센터
12. 구독/결제 (토스페이먼츠)
13. 마이페이지
14. 관리자 페이지
15. API 연동 (DART, KRX, ECOS, SEC, FRED, RSS)
16. AI 분석 생성 (GPT API)
17. 최종 테스트 및 배포 (Vercel)

---

## 중요 주의사항

1. **면책 고지는 모든 분석 관련 페이지에 반드시 포함**
2. **금칙어 필터는 채팅과 배너 등록 양쪽 모두에 적용**
3. **유료 컨텐츠 접근 제어는 서버 사이드에서도 검증** (프론트만 막으면 안됨)
4. **모든 외부 API 호출은 서버 사이드(API Routes)에서** (API 키 노출 방지)
5. **TradingView 위젯은 무료 사용 조건 확인** (상업적 사용 시 라이선스 확인)
6. **개인정보처리방침과 이용약관은 반드시 작성** (법적 필수)
7. **채팅 메시지는 최근 1000개만 유지** (오래된 메시지는 자동 삭제하는 cron 구현)
8. **배너 만료 체크는 일 1회 cron으로** (end_date 지난 배너 자동 비활성화)
9. **국가 변경 시 모든 데이터가 해당 국가 기준으로 변경되어야 함**
10. **한국어가 기본이며, 미국 데이터의 경우 AI 번역을 통해 한국어로 제공**
