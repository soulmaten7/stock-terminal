<!-- 2026-04-18 -->
# Stock Terminal — Product Spec V3

> **이 문서가 기준이다.** `docs/HOME_REDESIGN_V2_SPEC.md` 는 참고용 아카이브. 충돌 시 V3 우선.

---

## 0. 한 줄 요약

**한국 개인투자자(전업~입문)를 위한 Bloomberg/Koyfin 급 데이터 터미널 + 단일 지속 채팅 + 투자자 도구함(Link Hub) 을 PC-First로 무료 데이터 소스 기반으로 구축하고, 광고주 독립적(Partner-Agnostic) 랜딩페이지 인프라로 Lead Gen 수익을 즉시 발생시킨다.**

---

## 1. 제품 철학 (Why)

### 1.1 타겟 정의

| 구분 | 비중 | 특징 | 우리 제품의 역할 |
|---|---|---|---|
| **전업투자자 (상위 ~1%)** | 소수 | 이미 Bloomberg/Koyfin/Thinkorswim 사용 | 레퍼런스 기준 — **"이 사람이 보는 것"을 일반인에게 보여주기** |
| **반전업/숙련 (~10%)** | 중간 | 기능 파편화(네이버+삼성증권+유튜브+텔레그램) | 통합 환경 제공 — 파편화 해결 |
| **일반투자자 (대다수)** | 다수 | 상위를 **동경**함 (Aspirational) | "이렇게 투자하는 것이다" 라는 **기준을 학습** |

> **핵심 인사이트**: 일반 투자자는 "쉬운 것"을 원하는 게 아니라, "**상위가 보는 것을 보고 싶어한다**". 이것이 Aspirational Design의 기반.

### 1.2 Aspirational Design 원칙

- Nike / Tesla / Rolex / Bloomberg 공통: **상위 1%를 기준으로 만들고 일반인에게 개방**
- UI 를 단순화해서 모두에게 쉽게 만드는 게 아니라, **"전업이 실제로 보는 정보"를 그대로 보여주되 학습 곡선을 완만하게** 만든다
- "쉬운 UI" 가 아니라 "**전문가 UI + 친절한 설명**"

### 1.3 한국 시장 우선

- 데이터 소스가 한국 시장에 집중되어 있으므로 **KR 시장 먼저 완성**
- 글로벌 확장(미국/일본/홍콩)은 Phase 3 이후

---

## 2. 독자 포지셔닝 (What makes us different)

### 2.1 경쟁 지형 비교

| 항목 | Bloomberg Terminal | Koyfin | 네이버금융 | 삼성증권 앱 | **Stock Terminal (우리)** |
|---|---|---|---|---|---|
| 가격 | $2,000/월 | $39~119/월 | 무료 | 무료 (계좌 필수) | **무료~₩29,900/월** |
| 데이터 커버리지 | 글로벌 전 자산군 | 글로벌 주식/채권 | KR 주식 위주 | KR 주식 + 해외(거래계정 한정) | **KR 집중 + 글로벌 확장** |
| UI 복잡도 | 극상 (학습 수주) | 상 | 중 | 상 | **상 (학습 곡선 완만)** |
| 소셜(채팅) | 없음 | 없음 | 댓글 (종목별 분산) | 없음 | **단일 실시간 채팅** ⭐ |
| 링크 허브 | 없음 | 없음 | 없음 | 없음 | **투자자 도구함** ⭐ |
| AI 리포트 | 일부 | 일부 | 없음 | 없음 | **종목별 AI 분석 (Pro)** |

### 2.2 3가지 차별점

**① Bloomberg-급 정보 밀도, 무료 접근**
- 공공 데이터 소스(DART/KRX/KIS/FDR)만으로 전업투자자가 일상적으로 보는 데이터의 95% 커버
- 서버사이드 KIS 연동 완료 → **비로그인 이용자도 실시간** 데이터 열람

**② 단일 지속 채팅 (Density Over Distribution)**
- 종목별로 채팅을 분산하지 않는다 → 모든 대화가 한 곳에 모임 → 인기 종목/사건이 자연스럽게 떠오름
- `$삼성전자` 식 자동 태그 + 필터 + 실시간 인기 종목 뱃지
- 페이지 이동해도 채팅 사이드바 유지 (Persistent Chat)

**③ 투자자 도구함 (Link Hub)**
- 우리가 제공 못하는 데이터/도구의 링크를 **카테고리별로 정리**
- "여기 켜두고 필요한 건 바로가기로" → Start Page Strategy (네이버 시작페이지 패턴)
- SEO 효과 + 체류시간 증가 + 광고주 독립적 랜딩 배치 기반

---

## 3. 4-페이지 심장부 (Phase 1 범위)

V3에서 Phase 1 집중 개발 페이지는 **4개**. 나머지는 유지/보완 수준.

### 3.1 🏠 Home (런처 페이지)

**역할**: "켜두는 페이지" — 오늘 시장 전반 점검 + 관심종목 모니터링 + 상세 페이지 진입점

**레이아웃 (PC 1920 기준)**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Header (Logo / Nav / Search / Login)                           60px     │
├──────┬──────────────────────────────────────────────────────┬────────────┤
│ Chat │  Main Content (Bento Grid)                           │ Partner    │
│ Side │                                                      │ Slot (Ad-  │
│ bar  │  ┌─────────────────┬─────────────────┐              │ agnostic)  │
│      │  │ 관심종목 라이브   │ 외국인/기관 수급 │              │            │
│ 320px│  │ (WatchlistLive) │ (InstFlow)      │              │ 240px      │
│      │  └─────────────────┴─────────────────┘              │            │
│ ───  │  ┌─────────────────┬─────────────────┐              │ Premium    │
│ Ch.1 │  │ 거래량 급증      │ 시장 지수(미니차트)│             │ (₩5/week) │
│      │  └─────────────────┴─────────────────┘              │            │
│      │  ┌─────────────────┬─────────────────┐              │ ───        │
│      │  │ 경제 캘린더      │ IPO / 실적 일정  │              │ General    │
│      │  └─────────────────┴─────────────────┘              │ (₩3/week) │
│      │  ┌─────────────────────────────────────┐            │            │
│      │  │ 브레이킹 피드 (뉴스 + 공시)           │            │            │
│      │  └─────────────────────────────────────┘            │            │
└──────┴──────────────────────────────────────────────────────┴────────────┘
```

**모든 위젯은 2가지 크기만 사용** (1×1 또는 1×2) — iOS Bento Grid 원칙

### 3.2 📊 Stock Detail (핵심 ⭐)

**역할**: 전업투자자가 종목 하나당 **80% 시간을 쓰는 페이지**. Bloomberg 표준 복제.

**URL**: `/stocks/[symbol]` (예: `/stocks/005930` — 삼성전자)

**레이아웃**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [005930 삼성전자] 72,300 +1.82% ▲1,300  거래량 12,345,678  시총 XXX조   │
├──────┬──────────────────────────────────────────────────────────────────┤
│ Chat │  [개요] [차트] [호가] [재무] [실적] [뉴스공시] [수급] [비교]        │
│ Side │  ─────────────────────────────────────────────────────────────── │
│ bar  │                                                                  │
│      │  <active tab content>                                            │
│ 320px│                                                                  │
└──────┴──────────────────────────────────────────────────────────────────┘
```

**8개 탭 상세**

| # | 탭 | 내용 | 데이터 소스 |
|---|---|---|---|
| 1 | 개요 | 현재가/시가/고저/52주 범위/시총/PER/PBR/배당/업종/임원/자본금 | KIS `price` + DART 기업개황 |
| 2 | 차트 | TradingView 위젯 (캔들/지표/드로잉) + 한국식 색상 (UP=RED/DOWN=BLUE) | TradingView embed |
| 3 | 호가 | 10단 호가창 + 체결 타임라인 + 매수/매도 잔량 비율 | KIS `orderbook` + `execution` |
| 4 | 재무 | 분기/연간 재무제표 3년치 (매출/영업이익/순이익/EPS/BPS/ROE) | DART `fnlttSinglAcntAll` |
| 5 | 실적 | 분기별 컨센서스 vs 실제 (서프라이즈/미스) + 연간 예상 | Naver 증권 크롤링 or DART |
| 6 | 뉴스공시 | DART 공시 (분기/연간/주요사항) + 뉴스 피드 | DART `list` API + Naver 뉴스 |
| 7 | 수급 | 외국인/기관 일별 매매 (차트) + 공매도 잔고 + 프로그램매매 | KRX 정보데이터시스템 + FDR |
| 8 | 비교 | 동종업계 3~5개 종목 비교 테이블 (PER/PBR/ROE/매출성장/시총) | 기존 `/compare` 재활용 |

**Phase 1 에서는 1~6 우선 구현, 7~8은 데이터 수집 이후 2차 오픈**

### 3.3 🔍 Screener (스크리너)

**역할**: 조건 필터로 종목 발굴

**기존 `components/screener/ScreenerClient.tsx` 유지 + 보완**:
- 현재: market[], keyword, minCap, maxCap
- V3 추가: PER/PBR 범위, ROE 최소, 배당수익률, 거래량 급증률, 외국인 보유율
- 결과 클릭 → 종목 상세로 (URL 유지)

### 3.4 🧰 투자자 도구함 (Link Hub) ⭐ 신규

**역할**: 우리가 제공 못하는 외부 도구/사이트를 카테고리로 정리 — Start Page Strategy

**URL**: `/toolbox`

**10개 카테고리 × 5+ 링크 = 초기 50+ 링크**

| 카테고리 | 예시 링크 |
|---|---|
| 1. 공시/재무 | DART, 금감원 전자공시, WiseReport, FnGuide |
| 2. 시황/뉴스 | 한경컨센서스, 머투, 서경, 팍스넷 |
| 3. 차트/지표 | TradingView, 키움 영웅문, 네이버 차트, 인베스팅 |
| 4. 커뮤니티 | 네이버 종토방, 팍스넷, 뽐뿌, 디시 주갤 |
| 5. 글로벌 | SEC EDGAR, Yahoo Finance, Finviz, Seeking Alpha |
| 6. 거시경제 | 한국은행 ECOS, 통계청 KOSIS, FRED, World Bank |
| 7. 외환/원자재 | BOK 환율, 한국거래소 금, CME 선물, Bloomberg Commodity |
| 8. 가상자산 | 업비트, 빗썸, CoinMarketCap, TradingView Crypto |
| 9. 세무/법률 | 국세청 홈택스, 증권거래세 안내, 금투세 FAQ |
| 10. 투자자 블로그 | 주요 버핏클럽 멤버 블로그, 유튜브 채널 |

**기능**:
- 카테고리 접/펴기 (아코디언)
- 링크 클릭 시 새 탭 + 클릭 로그 (`link_hub_clicks` 테이블)
- 로그인 사용자: 즐겨찾기 (별표 토글)
- 관리자 패널에서 링크 추가/수정/삭제
- 카테고리 상단에 광고주 독립적 Partner Slot 삽입 가능 (섹션 5 참고)

---

## 4. 단일 지속 채팅 시스템 (Persistent Single Chat)

### 4.1 원칙: Density Over Distribution

- 종목별 채팅방 분산 ❌
- 전체 하나 + 태그/필터로 격리 ✅
- 이유: 유동성 많은 곳에 더 몰리는 네트워크 효과 — 파편화되면 모든 방이 죽는다

### 4.2 UX 동작

```
[채팅 입력]   삼성전자 실적 나왔네 $005930
          → 자동 태깅: $005930 (클릭하면 종목 상세로 이동)
          → 인기 스코어 +1 (10분 슬라이딩 윈도우)

[필터] 전체 / 내 관심종목 / 인기 Top 5
[인기 뱃지]  🔥 삼성전자 (89 mentions / 10min)
```

### 4.3 기술 구현

**파일 위치**: `app/layout.tsx` 에 `<ChatSidebar />` 배치 → 페이지 라우팅 시에도 리렌더링 없이 유지

```tsx
// app/layout.tsx (개념 코드)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        <div className="flex">
          <ChatSidebar />   {/* ← 여기. children과 동일 레벨 */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- Supabase Realtime 채널 구독 (`chat_messages` 테이블)
- WebSocket 연결은 layout 레벨 유지 → 페이지 이동해도 connection 유지
- Zustand store 로 메시지 상태 보관

### 4.4 DB 스키마

```sql
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text not null,
  stock_tags text[],          -- ['005930', '035720'] — $종목 자동 추출
  created_at timestamptz default now(),
  -- 모더레이션
  hidden boolean default false,
  report_count int default 0
);

create index on chat_messages (created_at desc);
create index on chat_messages using gin (stock_tags);
```

### 4.5 모더레이션

- 유저별 분당 5개 제한 (rate limit)
- 욕설 필터 (한국어 BAD_WORDS 리스트)
- 같은 메시지 연속 금지 (해시 체크 10분)
- 신고 3건 이상 → 자동 `hidden=true`
- 관리자가 `/admin/chat` 에서 수동 복구/영구 차단

### 4.6 참여 인센티브 (회원만 발화 가능)

- 비로그인: **읽기만 가능** (SEO 효과 + 궁금증 유발)
- 로그인: 발화 + 좋아요 + 신고 + 나만의 채팅 필터

---

## 5. 광고주 독립적 랜딩페이지 인프라 (Partner-Agnostic)

### 5.1 철학

- **"어떤 광고주가 들어올지 미리 알 수 없다"** — 한투/○○증권 하드코딩 금지
- 템플릿 기반 동적 경로 + 관리자 패널 + 슬롯 기반 배치
- 제휴 맺을 때 관리자가 5분 내 랜딩 생성 → 슬롯에 꽂기 → Lead Gen 시작

### 5.2 `/partner/[slug]` 동적 라우트

**URL**: `/partner/[slug]` (예: `/partner/kiumhero`, `/partner/tossinvest`)

**구조 (모든 랜딩이 같은 템플릿)**:

```
┌─────────────────────────────────────────┐
│ [Partner Logo + 제목 + 서브카피]          │ Hero
├─────────────────────────────────────────┤
│ [이미지/영상 슬롯]                         │ Visual
├─────────────────────────────────────────┤
│ [3~5개 혜택 불릿]                         │ Benefits
├─────────────────────────────────────────┤
│ [리드 수집 폼 — 필드 설정 가능]             │ Form
│   이름 [ ]                               │
│   전화번호 [ ]                            │
│   (상품관심 dropdown — 선택)               │
│   [ ✓ 개인정보 3자 제공 동의]               │
│   [ 신청하기 ]                            │
├─────────────────────────────────────────┤
│ [고객 후기 섹션 — 선택]                    │ Testimonials
├─────────────────────────────────────────┤
│ [FAQ 섹션 — 선택]                         │ FAQ
└─────────────────────────────────────────┘
```

### 5.3 DB 스키마

```sql
create table partners (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- URL 용: 'kiumhero'
  name text not null,                     -- 표시명: '키움증권 영웅문'
  logo_url text,
  hero_title text,
  hero_subtitle text,
  visual_url text,                        -- 이미지 or 영상
  benefits jsonb,                         -- ["계좌개설 수수료 0원", ...]
  form_fields jsonb,                      -- [{name:"phone", required:true}, ...]
  consent_text text,                      -- 개인정보 제공 동의문 (파트너별 커스텀)
  category text,                          -- '증권사' | '재테크앱' | '보험' | '부동산' ...
  active boolean default true,
  tracking_pixel text,                    -- (선택) 광고주 픽셀 코드
  payout_per_lead numeric,                -- 리드당 정산금 (원)
  created_at timestamptz default now()
);

create table partner_leads (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id),
  slot_type text,                         -- 'contextual_stock' | 'category' | 'home_featured' | ...
  slot_ref text,                          -- 어느 종목/카테고리에서 왔는지 (예: '005930')
  user_id uuid references auth.users(id), -- null 이면 비로그인
  form_data jsonb,                        -- 입력값
  consent boolean default false,
  ip_address inet,
  user_agent text,
  referrer text,
  status text default 'new',              -- 'new' | 'sent' | 'paid' | 'rejected'
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index on partner_leads (partner_id, created_at desc);
```

### 5.4 6가지 Partner Slot 타입

광고주가 들어올 수 있는 **위치 타입**을 미리 정의해놓으면, 제휴 시 슬롯만 바꿔 꽂을 수 있다.

| # | 슬롯 타입 | 위치 | 예시 시나리오 |
|---|---|---|---|
| 1 | Contextual Stock Slot | 종목 상세 특정 탭 상단/하단 | "삼성전자 페이지 → 증권사 A 계좌개설" |
| 2 | Category Slot | 투자자 도구함 카테고리 내부 | "미국 주식 카테고리 → 해외주식 특화 증권사 B" |
| 3 | Home Featured Slot | 홈 오른쪽 Partner 컬럼 상단 | "모두에게 노출 — 이번주 프로모션" |
| 4 | Detail Tab Slot | 특정 탭(예: 뉴스공시) 하단 | "공시 읽어주는 AI 서비스 C" |
| 5 | Chat Pinned Slot | 채팅 사이드바 상단 고정 | "실전 투자대회 참가자 모집" |
| 6 | Post-Action Slot | 회원가입 완료/리드 제출 완료 후 | "첫 리드 완료 — 추천 서비스 D" |

각 슬롯은 `PartnerSlot` 컴포넌트 하나로 재사용 가능 (props 로 slug 만 받아서 렌더).

### 5.5 관리자 패널 `/admin/partners`

- 파트너 CRUD
- 폼 필드 구성 (체크박스/드롭다운/텍스트)
- 슬롯 배치 (어떤 slot_type 에 어떤 slug 를 꽂을지 — 간단한 매핑 테이블)
- 리드 관리 (리스트 / CSV 다운로드 / 상태 변경)

### 5.6 개인정보 처리 기본 구조 (PIPA 대응)

- 폼 제출 시 `consent = true` 필수 (체크박스 미체크 → 제출 차단)
- `consent_text` 는 파트너별로 커스텀 (변호사 검토 필요 — Phase 2)
- 리드 데이터는 `partners` 테이블의 `category` 에 따라 **암호화 저장** (Phase 2)
- 3자 제공 목록 페이지 `/legal/third-party` 에서 파트너 활성 목록 공개

---

## 6. 회원 가입 인센티브

비로그인도 읽기/실시간 데이터 OK → **회원은 왜 가입하는가?** 에 대한 답:

| 기능 | 비로그인 | 로그인(무료) | Pro |
|---|---|---|---|
| 실시간 시세/차트/호가 | ✅ | ✅ | ✅ |
| 재무/공시/뉴스 | ✅ | ✅ | ✅ |
| 채팅 읽기 | ✅ | ✅ | ✅ |
| 채팅 발화/좋아요 | ❌ | ✅ | ✅ |
| 관심종목 (5개) | ❌ | ✅ | ✅ |
| 관심종목 (30개) | ❌ | ❌ | ✅ |
| 가격 알림 | ❌ | 3개까지 | 무제한 |
| 메모/즐겨찾기 | ❌ | ✅ | ✅ |
| AI 종목 분석 리포트 | ❌ | 월 3회 | 무제한 |
| CSV 다운로드 | ❌ | ❌ | ✅ |
| 광고 없음 | ❌ | ❌ | ✅ |

---

## 7. 데이터 소스 전략

### 7.1 100% 무료 소스로 충분한 이유

전업투자자가 매일 보는 정보 ≈ 공공데이터의 **95%**

| 데이터 | 무료 소스 | 구현 상태 |
|---|---|---|
| 실시간 시세/호가/체결 | **KIS OpenAPI (우리 서버사이드)** | ✅ 완료 |
| 공시 (전자공시) | DART API | ⏳ Phase 1 |
| 재무제표 | DART fnlttSinglAcntAll | ⏳ Phase 1 |
| 외국인/기관 매매 | KRX 정보데이터시스템 | ⏳ Phase 1 |
| 공매도 잔고 | KRX (FDR) | ⏳ Phase 1 |
| 프로그램매매 | KRX 크롤링 | ⏳ Phase 2 |
| 과거 주가 | FinanceDataReader | ✅ 완료 |
| 뉴스 | Naver 금융 크롤링 | ⏳ Phase 1 |
| 경제지표 | 한국은행 ECOS | ⏳ Phase 2 |
| 미국 주식 | SEC EDGAR | ⏳ Phase 3 |

### 7.2 KIS 서버사이드 실시간의 의미

- 우리가 한투 계정 1개로 API 호출 → 모든 방문자에게 실시간 데이터 제공
- **비로그인 이용자도 실시간** (네이버 금융은 15분 지연)
- Rate limit 관리: `KIS_RATE_LIMIT_MS=60` (20건/초) + 큐 serialize
- 이미 구현된 엔드포인트 (7개):
  - `/api/kis/price` — 현재가
  - `/api/kis/orderbook` — 호가
  - `/api/kis/execution` — 체결
  - `/api/kis/investor` — 개별 종목 수급
  - `/api/kis/investor-rank` — 전 종목 수급 랭킹
  - `/api/kis/volume-rank` — 거래량 랭킹
  - `/api/kis/token` — 토큰 발급

### 7.3 Phase 1 에 추가로 필요한 엔드포인트

| 엔드포인트 | 목적 | 소스 |
|---|---|---|
| `/api/dart/filings?symbol=005930` | 공시 리스트 | DART `list` |
| `/api/dart/financials?symbol=005930&period=Q` | 재무제표 | DART `fnlttSinglAcntAll` |
| `/api/dart/company?symbol=005930` | 기업개황 | DART `company` |
| `/api/news/stock?symbol=005930` | 뉴스 | Naver 금융 크롤 |
| `/api/krx/foreign-flow?symbol=005930&period=30d` | 외국인 일별 | KRX (FDR) |
| `/api/krx/short-balance?symbol=005930` | 공매도 잔고 | KRX (FDR) |

---

## 8. 유저 활동 로깅 (Lead Quality를 위한 기반)

광고주 입장에서 리드가 "진짜 투자자인지" 확인할 수 있어야 리드 단가가 올라감.

```sql
create table user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_id text,                       -- 비로그인도 쿠키 ID 로 집계
  action text not null,                  -- 'page_view' | 'stock_detail' | 'chat_send' | 'watchlist_add' | 'tab_click' | 'link_click' | 'form_submit'
  target text,                           -- 종목코드 / 카테고리 / 링크ID 등
  metadata jsonb,
  created_at timestamptz default now()
);

create index on user_activity_logs (user_id, created_at desc);
create index on user_activity_logs (action, created_at desc);
```

리드 제출 시 해당 user의 최근 30일 활동 로그를 `partner_leads.form_data.activity_summary` 에 함께 기록 → 광고주에게 "이 리드는 최근 X 종목을 조회한 실사용자입니다" 어필 가능.

---

## 9. 6가지 기술 규율 (Modularity Rules — 모바일 전환 대비)

PC-First 지만, **이후 반응형 전환이 쉽게 되도록** 지금부터 지킬 규칙:

### 9.1 컴포넌트 격리
- 모든 위젯은 **`components/home/widgets/*.tsx`** 같은 독립 폴더
- 위젯은 자체 데이터 fetch / 자체 에러 처리 / 부모와 독립

### 9.2 고정 픽셀 지양
- 한 위젯 안에서는 `px` 사용 OK
- 위젯 간/레이아웃에서는 **`rem`/`%`/`grid-template`** 사용
- 이유: 모바일 전환 시 한 줄 수정으로 반응형 가능

### 9.3 Grid Abstraction
- `HomeGrid.tsx` 가 Bento Grid 레이아웃 담당
- 위젯은 자기 크기 모름 (1×1 / 1×2) → Grid가 `span` 지정
- PC: 2 columns / 태블릿: 2 columns / 모바일: 1 column — Grid만 수정

### 9.4 Container Queries (미래 대비)
- Tailwind `@container` 지원 — Phase 2 에서 도입
- 위젯이 **부모 컨테이너 크기**에 반응 (뷰포트가 아니라)
- 이유: 사이드바 있을 때/없을 때 같은 위젯이 다른 레이아웃 가능

### 9.5 위젯 크기 2개만 사용
- 1×1 (정사각형 — 숫자/KPI)
- 1×2 (가로 긴 형태 — 리스트/차트)
- 혼란 방지 + Grid 설계 단순화

### 9.6 독립 테스트
- 각 위젯에 `__stories__/` 또는 `__tests__/` 폴더 — 단독으로 렌더 가능해야 함
- Storybook 도입은 Phase 2

---

## 10. Phase 1 / 2 / 3 실행 로드맵

### Phase 1 (0~4주) — **즉시 수익 가능한 최소 골격**

| 주 | 작업 |
|---|---|
| W1 | Persistent Chat (`app/layout.tsx` + `ChatSidebar` + Supabase Realtime + `chat_messages` 테이블) |
| W2 | 종목 상세 8탭 중 1~6 (개요/차트/호가/재무/실적/뉴스공시) + DART API 연동 |
| W3 | 투자자 도구함 (`/toolbox` + `link_hub` 테이블 UI + 관리자 편집) |
| W4 | Partner-Agnostic Landing (`/partner/[slug]` + `partners`/`partner_leads` 테이블 + 관리자 패널 + 6 슬롯 컴포넌트) |

**Phase 1 완료 기준**: 파트너 1곳 확보 → 랜딩 생성 → 홈에 슬롯 배치 → Lead 첫 건 정산 → 반복 가능 확인

### Phase 2 (5~12주) — **Pro 구독 + 광고 노출 본격화**

- 토스페이먼츠 결제 연동 + Pro 기능 게이트 (관심종목 30개 / AI 리포트 무제한 / CSV)
- 알림 시스템 (가격/공시/뉴스 푸시)
- KRX 공매도/프로그램매매 크롤링
- 종목 상세 7~8번 탭 (수급/비교) 완성
- 파트너 슬롯 5~10개 동시 운영
- 개인정보 처리방침 변호사 검토 + PIPA 정식 대응

### Phase 3 (12개월+) — **광고주 확장 + 글로벌**

- SEC EDGAR API (미국 주식)
- 일본 TSE / 홍콩 HKEX
- À la carte 프리미엄 (종목별 심층 리포트 단건 구매)
- 광고 인벤토리 세분화 (Category Slot 20+ 개)
- Make/자동화 시나리오 확장

---

## 11. "하지 말 것" 리스트 (Anti-patterns)

- ❌ 종목별 채팅방 분리
- ❌ 위젯 크기 3종 이상 사용
- ❌ 광고주 이름 하드코딩 (한투/토스증권/XX증권 등)
- ❌ 비로그인 이용자 차단 (SEO/유입 손해)
- ❌ 모바일 퍼스트 — 지금은 PC First, 모바일은 반응형 전환 후
- ❌ Bloomberg UI 를 단순화해서 "쉽게" 만들기 — Aspirational 훼손
- ❌ DEV_BYPASS 를 프로덕션에 남기기
- ❌ 중복 fetch — 위젯마다 같은 종목 API 중복 호출 (공통 store 사용)
- ❌ `console.log` 남긴 채 커밋
- ❌ 빌드 깨진 채 push

---

## 12. Phase 1 브라우저 검증 체크리스트

Claude Code 실행 후 **매번** 다음 항목 체크:

- [ ] `npm run build` 에러 0
- [ ] `/` 진입 → 홈 정상 렌더 + 채팅 사이드바 보임
- [ ] `/stocks/005930` 이동 → **채팅 사이드바 유지** (재로드 X, 스크롤 위치 유지)
- [ ] 탭 클릭 (개요→차트→호가→...) → 각 탭 데이터 정상 표시
- [ ] `/toolbox` → 10 카테고리 + 링크 클릭 시 새 탭
- [ ] `/partner/test` (더미 파트너) → 랜딩 + 폼 제출 → DB `partner_leads` 1건 생성 확인
- [ ] `/admin/partners` → 파트너 CRUD 가능, 슬롯 배치 UI 동작
- [ ] 채팅 입력 `테스트 $005930` → `$005930` 태그 자동 파란색 처리 + 클릭 시 종목 이동
- [ ] 비로그인 이용자로 모든 페이지 실시간 시세 보이는지

---

## 13. 참고: 레거시 문서 매핑

| 기존 문서 | V3에서의 역할 |
|---|---|
| `docs/HOME_REDESIGN_V2_SPEC.md` | **아카이브** — 홈 단건 스펙. V3에서 홈은 4페이지 중 1개로 축소 |
| `docs/BUSINESS_STRATEGY.md` | 유지 — 비즈니스 전략 상세는 여기 참조 |
| `docs/SYSTEM_DESIGN.md` | 유지 — 기술 아키텍처 상세는 여기 참조 |
| `docs/COMMANDS_PHASE1_HOME.md` ~ `PHASE4_MONETIZE.md` | 참고 — V3 에서는 `COMMANDS_V3_PHASE1.md` 가 신규 기준 |
| `docs/PAGE_FRAME_SPEC.md` | 참고 — 페이지별 프레임 일부 재사용 |

---

## 14. 용어 사전 (Glossary)

| 용어 | 정의 |
|---|---|
| Aspirational Design | 상위 1% 를 기준으로 만들고 일반에게 개방하는 설계 (Nike/Tesla/Bloomberg 패턴) |
| Bento Grid | iOS 18 스타일 — 통일된 셀 크기의 위젯 그리드 |
| Density Over Distribution | 파편화 없이 한 곳에 모으는 원칙 (단일 채팅) |
| Partner-Agnostic | 특정 광고주에 의존하지 않는 인프라 — 슬롯/템플릿 기반 |
| Persistent Chat | 페이지 이동해도 유지되는 채팅 — `app/layout.tsx` 배치 |
| Start Page Strategy | 사용자가 "켜두는 페이지"로 만드는 전략 (네이버 시작페이지 패턴) |
| Lead Gen / DB 장사 | 광고주에게 제공할 리드(개인정보 동의 기반) 수집 사업 — 한국 시장 5~10만원/리드 |
| Aspirational User | 자신보다 상위 단계(전업투자자)를 목표로 삼는 일반 투자자 |

---

**문서 종료.** Phase 1 실행 명령어는 `docs/COMMANDS_V3_PHASE1.md` 참고.
