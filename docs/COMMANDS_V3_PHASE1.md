<!-- 2026-04-18 -->
# V3 Phase 1 실행 명령어

> 이 파일은 **Claude Code 가 읽고 실행하기 위한 명령 문서** 이다.
> Cowork 가 `PRODUCT_SPEC_V3.md` 에서 설계한 내용을 구현 단위로 쪼개놓은 것.
> 실행 전 반드시 `docs/PRODUCT_SPEC_V3.md` 를 먼저 읽을 것.

**모델 기본값**: Sonnet.
**🔴 Opus 권장 표시가 있는 블록만** Opus 로 실행.

**실행 위치**: `~/Desktop/OTMarketing`

**Phase 1 범위 (4주)**:
1. W1 — Persistent Chat
2. W2 — 종목 상세 8탭 (1~6)
3. W3 — 투자자 도구함
4. W4 — Partner-Agnostic Landing

---

## 📦 사전 확인 (Step 0)

```bash
cd ~/Desktop/OTMarketing && git status
```

- 이전 세션에서 push 되지 않은 변경사항 있는지 확인
- 있다면 먼저 처리

```bash
cd ~/Desktop/OTMarketing && npm run build
```

- 빌드 에러 0 확인
- 에러 있으면 V3 진입 전에 고치기

---

## 🔧 W1 — Persistent Chat 시스템 (예상 2~3일)

### 1-1. Supabase 스키마 생성

파일: `supabase/migrations/004_chat_messages.sql` (신규)

```sql
-- 채팅 메시지
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) between 1 and 500),
  stock_tags text[] default '{}',
  created_at timestamptz default now(),
  hidden boolean default false,
  report_count int default 0
);

create index if not exists idx_chat_messages_created_at
  on public.chat_messages (created_at desc);

create index if not exists idx_chat_messages_stock_tags
  on public.chat_messages using gin (stock_tags);

-- 채팅 모더레이션 테이블 (신고)
create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.chat_messages(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique (message_id, reporter_id)
);

-- RLS
alter table public.chat_messages enable row level security;

create policy "read chat messages"
  on public.chat_messages for select
  using (hidden = false);

create policy "insert own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Realtime publication
alter publication supabase_realtime add table public.chat_messages;
```

**실행 방법** (Supabase Studio SQL Editor 또는 CLI):

```bash
cd ~/Desktop/OTMarketing
npx supabase db push
```

### 1-2. Zustand 스토어 생성

파일: `stores/chatStore.ts` (신규)

```typescript
import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  user_id: string | null;
  content: string;
  stock_tags: string[];
  created_at: string;
  hidden: boolean;
};

type ChatState = {
  messages: ChatMessage[];
  filter: 'all' | 'watchlist' | 'hot';
  hotStocks: { symbol: string; count: number }[];
  isConnected: boolean;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setFilter: (f: ChatState['filter']) => void;
  setHotStocks: (h: ChatState['hotStocks']) => void;
  setConnected: (v: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  filter: 'all',
  hotStocks: [],
  isConnected: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-199), msg] })),
  setFilter: (filter) => set({ filter }),
  setHotStocks: (hotStocks) => set({ hotStocks }),
  setConnected: (isConnected) => set({ isConnected }),
}));
```

### 1-3. ChatSidebar 컴포넌트

파일: `components/chat/ChatSidebar.tsx` (신규)

**요구사항**:
- 320px 고정 너비, 왼쪽 사이드바
- 상단: 필터 탭 (전체 / 관심종목 / 인기)
- 중간: 메시지 리스트 (자동 스크롤)
- 하단: 입력창 (비로그인은 disabled + "로그인하면 대화 가능" CTA)
- `$005930` 자동 태그 파싱 → 파란색 링크 처리
- Supabase Realtime 구독, 연결 상태 표시

**구현 지시사항**:
```
- useEffect 에서 Supabase Realtime 채널 구독 (채팅 메시지 insert)
- 언마운트 시 채널 unsubscribe
- 메시지 전송 시: 입력값에서 /\$(\d{6})/g 로 stock_tags 추출 → DB insert
- 필터별 렌더:
  - all: 전체 메시지
  - watchlist: 로그인 사용자의 watchlist 종목이 stock_tags에 포함된 것만
  - hot: hotStocks 상위 5개 종목 메시지만
```

### 1-4. Hot Stocks 10분 슬라이딩 윈도우

파일: `app/api/chat/hot-stocks/route.ts` (신규)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('stock_tags')
    .gte('created_at', tenMinAgo)
    .eq('hidden', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, number>();
  (data ?? []).forEach((row: any) => {
    (row.stock_tags ?? []).forEach((s: string) => {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
  });

  const top = Array.from(counts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ hotStocks: top, refreshedAt: new Date().toISOString() });
}
```

- ChatSidebar 에서 60초마다 fetch → `useChatStore.setHotStocks`

### 1-5. Rate Limit & Moderation

파일: `app/api/chat/send/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BAD_WORDS = ['씨발', '개새끼', '좆']; // 추후 리스트 파일로 분리
const RATE_LIMIT_PER_MINUTE = 5;

function extractStockTags(content: string): string[] {
  const matches = content.match(/\$(\d{6})/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1))));
}

function containsBadWord(content: string): boolean {
  return BAD_WORDS.some((w) => content.includes(w));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const { content } = await req.json();
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: '내용 필요' }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: '500자 초과' }, { status: 400 });
  }
  if (containsBadWord(content)) {
    return NextResponse.json({ error: '금지어 포함' }, { status: 400 });
  }

  // rate limit (분당 5개)
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
    return NextResponse.json({ error: '분당 5개 초과' }, { status: 429 });
  }

  const stock_tags = extractStockTags(content);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, content, stock_tags })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
```

### 1-6. app/layout.tsx 에 ChatSidebar 배치

파일: `app/layout.tsx` (기존 수정)

**현재 구조 파악 후 다음 원칙대로 개편**:
- `<html>` → `<body>` → `<Header />` → `<div className="flex">` → `<ChatSidebar />` + `<main>{children}</main>`
- ChatSidebar 는 `hidden min-[1400px]:block w-[320px]` 로 PC 에서만 노출
- `position: sticky; top: 60px; height: calc(100vh - 60px);` 고정
- **기존 `HomeClient.tsx` 의 SidebarChat 은 제거** (layout 으로 이관)

### 1-7. 검증

```bash
cd ~/Desktop/OTMarketing && npm run build
```

- 빌드 0 에러
- `npm run dev` → `http://localhost:3000` 접속
- 로그인 후 채팅 입력 → DB `chat_messages` 에 1건 들어오는지 Supabase Studio 에서 확인
- 다른 탭에서 같은 페이지 → 첫번째 탭에 메시지 실시간 표시되는지
- `/stocks/005930` 이동 → 채팅 사이드바 리렌더 없이 유지되는지 (메시지 리스트 그대로)

**커밋 메시지**: `feat: persistent single chat with realtime + stock auto-tag + moderation`

---

## 🔧 W2 — 종목 상세 8탭 (1~6) (예상 5~7일)

### 2-1. 라우트 & 레이아웃

파일: `app/stocks/[symbol]/page.tsx` (기존 있으면 교체, 없으면 신규)

**구조**:
- Server Component
- `params.symbol` 로 기본 정보 SSR (종목명/현재가/변동) — SEO 중요
- 탭 스위칭은 Client Component `<StockDetailTabs />` 에서 처리
- URL query param `?tab=chart` 로 탭 상태 유지

```tsx
// app/stocks/[symbol]/page.tsx
import { notFound } from 'next/navigation';
import StockDetailTabs from '@/components/stocks/StockDetailTabs';
import StockHeader from '@/components/stocks/StockHeader';

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  if (!/^\d{6}$/.test(symbol)) notFound();

  // SSR: 기본 시세 fetch
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/kis/price?symbol=${symbol}`,
    { cache: 'no-store' }
  );
  const priceData = await res.json();

  return (
    <div className="flex-1 min-w-0 px-4 py-4">
      <StockHeader symbol={symbol} initialData={priceData} />
      <StockDetailTabs symbol={symbol} />
    </div>
  );
}
```

### 2-2. 8개 탭 컴포넌트

파일: `components/stocks/StockDetailTabs.tsx` (신규)

```tsx
'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OverviewTab from './tabs/OverviewTab';
import ChartTab from './tabs/ChartTab';
import OrderbookTab from './tabs/OrderbookTab';
import FinancialsTab from './tabs/FinancialsTab';
import EarningsTab from './tabs/EarningsTab';
import NewsTab from './tabs/NewsTab';
import FlowTab from './tabs/FlowTab';       // Phase 1 후반
import CompareTab from './tabs/CompareTab'; // Phase 1 후반

const TABS = [
  { key: 'overview', label: '개요', Comp: OverviewTab },
  { key: 'chart', label: '차트', Comp: ChartTab },
  { key: 'orderbook', label: '호가', Comp: OrderbookTab },
  { key: 'financials', label: '재무', Comp: FinancialsTab },
  { key: 'earnings', label: '실적', Comp: EarningsTab },
  { key: 'news', label: '뉴스/공시', Comp: NewsTab },
  { key: 'flow', label: '수급', Comp: FlowTab },
  { key: 'compare', label: '비교', Comp: CompareTab },
];

export default function StockDetailTabs({ symbol }: { symbol: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get('tab') ?? 'overview';
  const ActiveComp = (TABS.find((t) => t.key === active) ?? TABS[0]).Comp;

  return (
    <div>
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => router.push(`?tab=${t.key}`, { scroll: false })}
            className={`px-4 py-2 text-sm ${
              active === t.key
                ? 'border-b-2 border-black font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>
        <ActiveComp symbol={symbol} />
      </div>
    </div>
  );
}
```

### 2-3. 탭별 데이터 소스 매핑

| 탭 | API | 구현 우선순위 |
|---|---|---|
| 개요 | `/api/kis/price` + `/api/dart/company?symbol=X` | P0 |
| 차트 | TradingView embed (iframe) | P0 |
| 호가 | `/api/kis/orderbook` (3초 폴링) | P0 |
| 재무 | `/api/dart/financials?symbol=X&period=Q` | P1 |
| 실적 | Naver 증권 파싱 `/api/news/earnings?symbol=X` | P1 |
| 뉴스/공시 | `/api/dart/filings` + `/api/news/stock` | P1 |
| 수급 | `/api/krx/foreign-flow` + `/api/kis/investor` | P2 (데이터 확보 후) |
| 비교 | 기존 `/compare` 로직 재활용 | P2 |

### 2-4. DART API Wrapper

파일: `lib/dart.ts` (신규)

```typescript
// DART API 공통 호출자. 인증키는 .env.local 에서.
// DART API 키: https://opendart.fss.or.kr/ 에서 발급 (무료)
const DART_API_KEY = process.env.DART_API_KEY || '';
const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

export async function fetchDart<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${DART_BASE_URL}${endpoint}`);
  url.searchParams.set('crtfc_key', DART_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`DART API error: ${res.status}`);
  const data = await res.json();
  if (data.status !== '000') {
    throw new Error(`DART API status=${data.status} msg=${data.message}`);
  }
  return data as T;
}

// 종목코드(005930) → DART corp_code (8자리) 변환이 필요.
// 최초 1회: CORPCODE.xml 다운 → Supabase 'dart_corp_codes' 테이블에 적재.
// 이후 이 함수로 매핑.
export async function getDartCorpCode(symbol: string): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('dart_corp_codes')
    .select('corp_code')
    .eq('stock_code', symbol)
    .maybeSingle();
  return data?.corp_code ?? null;
}
```

**.env.local 추가**:
```
DART_API_KEY=...  ← opendart.fss.or.kr 에서 발급
```

### 2-5. API Route: 기업개황

파일: `app/api/dart/company/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchDart, getDartCorpCode } from '@/lib/dart';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  const corpCode = await getDartCorpCode(symbol);
  if (!corpCode) return NextResponse.json({ error: 'corp_code not found' }, { status: 404 });

  try {
    const data = await fetchDart<any>('/company.json', { corp_code: corpCode });
    return NextResponse.json({
      symbol,
      name: data.corp_name,
      ceo: data.ceo_nm,
      address: data.adres,
      homepage: data.hm_url,
      phone: data.phn_no,
      industry: data.induty_code,
      established: data.est_dt,
      listed: data.bizr_no,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

### 2-6. DART CORPCODE 적재 스크립트

파일: `scripts/seed-dart-corpcodes.py` (신규)

```python
"""
DART CORPCODE.xml 다운로드 → Supabase 'dart_corp_codes' 테이블 적재.
실행: python3 scripts/seed-dart-corpcodes.py
"""
import os, io, zipfile, requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
API_KEY = os.getenv('DART_API_KEY')
SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

sb = create_client(SB_URL, SB_KEY)

# 1. ZIP 다운로드
url = f'https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key={API_KEY}'
r = requests.get(url, timeout=30)
r.raise_for_status()

with zipfile.ZipFile(io.BytesIO(r.content)) as z:
    with z.open('CORPCODE.xml') as f:
        tree = ET.parse(f)

rows = []
for corp in tree.getroot().iter('list'):
    stock_code = corp.findtext('stock_code', '').strip()
    if not stock_code or stock_code == ' ':
        continue
    rows.append({
        'corp_code': corp.findtext('corp_code'),
        'corp_name': corp.findtext('corp_name'),
        'stock_code': stock_code,
    })

print(f'총 {len(rows)}건 적재 중...')
# 배치 upsert
CHUNK = 500
for i in range(0, len(rows), CHUNK):
    sb.table('dart_corp_codes').upsert(rows[i:i+CHUNK], on_conflict='stock_code').execute()
print('완료')
```

**마이그레이션**: `supabase/migrations/005_dart_corp_codes.sql`
```sql
create table if not exists public.dart_corp_codes (
  corp_code text primary key,
  corp_name text,
  stock_code text unique,
  created_at timestamptz default now()
);
create index on public.dart_corp_codes (stock_code);
```

### 2-7. 탭 컴포넌트 기본 뼈대 (6개)

각 탭 폴더: `components/stocks/tabs/`

- `OverviewTab.tsx` — KPI 그리드 (시총/PER/PBR/EPS/BPS/ROE/배당/52주범위) + 기업개황
- `ChartTab.tsx` — TradingView iframe (`https://s.tradingview.com/widgetembed/?symbol=KRX:SAMSUNG&interval=D`)
- `OrderbookTab.tsx` — 10단 호가창 + 체결 스트림 (3초 폴링)
- `FinancialsTab.tsx` — 3년 분기/연간 매출/영익/순익 차트 (Recharts)
- `EarningsTab.tsx` — 서프라이즈/미스 히스토리
- `NewsTab.tsx` — DART 공시 + Naver 뉴스 혼합 피드 (탭 내 서브탭)

**모든 탭 공통**:
- `useSWR` 또는 `useEffect + useState` 로 fetch
- 로딩 skeleton
- 에러 fallback
- 코드 용어 영어 / 표시 한국어

### 2-8. 검증

- `/stocks/005930` → 개요/차트/호가 탭 모두 데이터 표시
- 탭 전환 시 URL 변경 `?tab=chart` + 뒤로가기 동작
- 비로그인 상태에서도 모든 탭 접근 가능
- `npm run build` 0 에러

**커밋 메시지**: `feat: stock detail page with 8 Bloomberg-standard tabs (overview~news phase 1)`

---

## 🔧 W3 — 투자자 도구함 (예상 2~3일)

### 3-1. 스키마 확장

파일: `supabase/migrations/006_link_hub_categories.sql` (신규)

기존 `link_hub` 테이블에 카테고리 컬럼 이미 있을 가능성 → 스키마 확인 후 없으면 추가.

```sql
-- 카테고리 메타 테이블 (순서, 색상)
create table if not exists public.link_hub_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'disclosure', 'news', ...
  label text not null,                -- '공시/재무', '시황/뉴스'
  display_order int default 0,
  icon text,                          -- lucide-react 아이콘명
  created_at timestamptz default now()
);

-- link_hub 테이블 확장 (없으면 추가)
alter table public.link_hub add column if not exists category_slug text references public.link_hub_categories(slug);
alter table public.link_hub add column if not exists display_order int default 0;

-- 즐겨찾기
create table if not exists public.link_hub_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  link_id uuid references public.link_hub(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, link_id)
);

-- 클릭 로그 (Lead quality 기반)
create table if not exists public.link_hub_clicks (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  link_id uuid references public.link_hub(id) on delete cascade,
  clicked_at timestamptz default now()
);
```

### 3-2. 카테고리 시딩

파일: `scripts/seed-toolbox.py` (신규)

```python
"""투자자 도구함 카테고리 + 초기 링크 시딩."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

CATEGORIES = [
    {'slug': 'disclosure', 'label': '공시/재무', 'display_order': 1, 'icon': 'FileText'},
    {'slug': 'news', 'label': '시황/뉴스', 'display_order': 2, 'icon': 'Newspaper'},
    {'slug': 'chart', 'label': '차트/지표', 'display_order': 3, 'icon': 'LineChart'},
    {'slug': 'community', 'label': '커뮤니티', 'display_order': 4, 'icon': 'MessageSquare'},
    {'slug': 'global', 'label': '글로벌 주식', 'display_order': 5, 'icon': 'Globe'},
    {'slug': 'macro', 'label': '거시경제', 'display_order': 6, 'icon': 'TrendingUp'},
    {'slug': 'forex', 'label': '외환/원자재', 'display_order': 7, 'icon': 'DollarSign'},
    {'slug': 'crypto', 'label': '가상자산', 'display_order': 8, 'icon': 'Bitcoin'},
    {'slug': 'tax', 'label': '세무/법률', 'display_order': 9, 'icon': 'Scale'},
    {'slug': 'blogs', 'label': '투자자 블로그', 'display_order': 10, 'icon': 'BookOpen'},
]

LINKS = [
    # 공시/재무
    {'category_slug': 'disclosure', 'title': 'DART 전자공시', 'url': 'https://dart.fss.or.kr/', 'description': '금융감독원 전자공시시스템 — 모든 공시 원문'},
    {'category_slug': 'disclosure', 'title': 'WiseReport', 'url': 'https://comp.wisereport.co.kr/', 'description': '기업 상세 재무지표'},
    {'category_slug': 'disclosure', 'title': 'FnGuide', 'url': 'https://comp.fnguide.com/', 'description': '컨센서스 + 재무 데이터'},
    {'category_slug': 'disclosure', 'title': 'KRX 정보데이터시스템', 'url': 'https://data.krx.co.kr/', 'description': '거래소 원천 데이터'},
    {'category_slug': 'disclosure', 'title': '한국거래소 상장공시시스템', 'url': 'https://kind.krx.co.kr/', 'description': 'KIND — 투자판단 관련 공시'},
    # 시황/뉴스
    {'category_slug': 'news', 'title': '한경컨센서스', 'url': 'https://consensus.hankyung.com/', 'description': '애널리스트 리포트 모음'},
    {'category_slug': 'news', 'title': '머니투데이', 'url': 'https://www.mt.co.kr/', 'description': '증권 뉴스'},
    {'category_slug': 'news', 'title': '팍스넷', 'url': 'https://www.paxnet.co.kr/', 'description': '커뮤니티 + 뉴스'},
    {'category_slug': 'news', 'title': '이데일리 증권', 'url': 'https://www.edaily.co.kr/', 'description': '증권 속보'},
    {'category_slug': 'news', 'title': '서울경제', 'url': 'https://www.sedaily.com/', 'description': '경제 종합'},
    # 차트/지표
    {'category_slug': 'chart', 'title': 'TradingView', 'url': 'https://www.tradingview.com/', 'description': '차트 + 커뮤니티'},
    {'category_slug': 'chart', 'title': '네이버 금융', 'url': 'https://finance.naver.com/', 'description': '한국 주식 시세'},
    {'category_slug': 'chart', 'title': 'Investing.com', 'url': 'https://kr.investing.com/', 'description': '글로벌 지표'},
    {'category_slug': 'chart', 'title': 'StockCharts', 'url': 'https://stockcharts.com/', 'description': '기술적 분석'},
    {'category_slug': 'chart', 'title': 'Finviz', 'url': 'https://finviz.com/', 'description': '미국 주식 히트맵'},
    # 커뮤니티
    {'category_slug': 'community', 'title': '네이버 종토방', 'url': 'https://finance.naver.com/item/board.naver', 'description': '종목 토론'},
    {'category_slug': 'community', 'title': '팍스넷 광장', 'url': 'https://www.paxnet.co.kr/tbbs/home', 'description': '투자자 커뮤니티'},
    {'category_slug': 'community', 'title': '뽐뿌 주식', 'url': 'https://www.ppomppu.co.kr/zboard/zboard.php?id=stock', 'description': '주식 게시판'},
    {'category_slug': 'community', 'title': '디시 주갤', 'url': 'https://gall.dcinside.com/board/lists/?id=stock_new3', 'description': '주식 갤러리'},
    {'category_slug': 'community', 'title': 'Reddit r/stocks', 'url': 'https://reddit.com/r/stocks', 'description': '글로벌 커뮤니티'},
    # 글로벌 주식
    {'category_slug': 'global', 'title': 'SEC EDGAR', 'url': 'https://www.sec.gov/edgar.shtml', 'description': '미국 상장사 공시'},
    {'category_slug': 'global', 'title': 'Yahoo Finance', 'url': 'https://finance.yahoo.com/', 'description': '미국 주식 시세'},
    {'category_slug': 'global', 'title': 'Seeking Alpha', 'url': 'https://seekingalpha.com/', 'description': '애널리스트 분석'},
    {'category_slug': 'global', 'title': 'MarketWatch', 'url': 'https://www.marketwatch.com/', 'description': '미국 시황'},
    {'category_slug': 'global', 'title': 'Bloomberg.com', 'url': 'https://www.bloomberg.com/markets', 'description': '블룸버그 시장'},
    # 거시경제
    {'category_slug': 'macro', 'title': '한국은행 ECOS', 'url': 'https://ecos.bok.or.kr/', 'description': '경제통계시스템'},
    {'category_slug': 'macro', 'title': '통계청 KOSIS', 'url': 'https://kosis.kr/', 'description': '국가통계포털'},
    {'category_slug': 'macro', 'title': 'FRED', 'url': 'https://fred.stlouisfed.org/', 'description': '미국 연준 경제 데이터'},
    {'category_slug': 'macro', 'title': 'World Bank Data', 'url': 'https://data.worldbank.org/', 'description': '세계은행 데이터'},
    {'category_slug': 'macro', 'title': 'IMF Data', 'url': 'https://www.imf.org/en/Data', 'description': 'IMF 통계'},
    # 외환/원자재
    {'category_slug': 'forex', 'title': '서울외국환중개', 'url': 'https://www.smbs.biz/', 'description': '환율 기준'},
    {'category_slug': 'forex', 'title': '한국거래소 파생상품', 'url': 'https://open.krx.co.kr/contents/OPN/01/01030000/OPN01030000.jsp', 'description': 'KOSPI200 선물/옵션'},
    {'category_slug': 'forex', 'title': 'CME Group', 'url': 'https://www.cmegroup.com/', 'description': '미국 선물'},
    {'category_slug': 'forex', 'title': 'LBMA 금값', 'url': 'https://www.lbma.org.uk/', 'description': '런던 금 시장'},
    {'category_slug': 'forex', 'title': 'OilPrice.com', 'url': 'https://oilprice.com/', 'description': '원유 가격'},
    # 가상자산
    {'category_slug': 'crypto', 'title': '업비트', 'url': 'https://upbit.com/', 'description': '국내 1위 거래소'},
    {'category_slug': 'crypto', 'title': '빗썸', 'url': 'https://www.bithumb.com/', 'description': '국내 2위 거래소'},
    {'category_slug': 'crypto', 'title': 'CoinMarketCap', 'url': 'https://coinmarketcap.com/', 'description': '글로벌 시세 집계'},
    {'category_slug': 'crypto', 'title': 'TradingView Crypto', 'url': 'https://www.tradingview.com/markets/cryptocurrencies/prices-all/', 'description': '크립토 차트'},
    {'category_slug': 'crypto', 'title': 'CoinGecko', 'url': 'https://www.coingecko.com/', 'description': '코인 정보'},
    # 세무/법률
    {'category_slug': 'tax', 'title': '국세청 홈택스', 'url': 'https://www.hometax.go.kr/', 'description': '세무 신고'},
    {'category_slug': 'tax', 'title': '금감원 금융소비자정보포털', 'url': 'https://fine.fss.or.kr/', 'description': '금융소비자 보호'},
    {'category_slug': 'tax', 'title': '금융투자협회', 'url': 'https://www.kofia.or.kr/', 'description': '금투세/증권거래세'},
    {'category_slug': 'tax', 'title': '법제처 국가법령', 'url': 'https://www.law.go.kr/', 'description': '법령 검색'},
    {'category_slug': 'tax', 'title': '대법원 판례', 'url': 'https://glaw.scourt.go.kr/', 'description': '판례 검색'},
    # 투자자 블로그 (일반명칭만 — 실명 기재는 사후 승인)
    {'category_slug': 'blogs', 'title': '버핏클럽 온라인', 'url': 'https://www.buffettclub.co.kr/', 'description': '가치투자 블로그'},
    {'category_slug': 'blogs', 'title': '인베스팅 Korea 분석', 'url': 'https://kr.investing.com/analysis/', 'description': '종합 분석'},
    {'category_slug': 'blogs', 'title': 'Seeking Alpha', 'url': 'https://seekingalpha.com/', 'description': '미국 주식 커뮤니티'},
    {'category_slug': 'blogs', 'title': 'ZeroHedge', 'url': 'https://www.zerohedge.com/', 'description': '거시 블로그'},
    {'category_slug': 'blogs', 'title': 'Yahoo Finance Contributors', 'url': 'https://finance.yahoo.com/topic/contributors/', 'description': '기고자 칼럼'},
]

# 카테고리 upsert
sb.table('link_hub_categories').upsert(CATEGORIES, on_conflict='slug').execute()
print(f'카테고리 {len(CATEGORIES)}건')

# 링크 upsert — URL 유니크가 없으면 title+url 기준으로 중복 체크 후 insert
existing = sb.table('link_hub').select('url').execute().data
existing_urls = {r['url'] for r in (existing or [])}

to_insert = [l for l in LINKS if l['url'] not in existing_urls]
if to_insert:
    sb.table('link_hub').insert(to_insert).execute()
print(f'링크 {len(to_insert)}건 신규 / 이미 있던 {len(LINKS) - len(to_insert)}건')
```

**실행**: `python3 scripts/seed-toolbox.py`

### 3-3. 페이지 & 컴포넌트

- `app/toolbox/page.tsx` (신규) — Server Component, 카테고리 + 링크 SSR
- `components/toolbox/ToolboxClient.tsx` — 아코디언 + 즐겨찾기 + 클릭 로깅
- `components/toolbox/CategorySection.tsx` — 각 카테고리 섹션
- `components/partner/PartnerSlot.tsx` — 카테고리 상단에 꽂을 광고주 슬롯 (W4에서 정의)

```tsx
// app/toolbox/page.tsx
import { createClient } from '@/lib/supabase/server';
import ToolboxClient from '@/components/toolbox/ToolboxClient';

export const revalidate = 300; // 5분 캐시

export default async function ToolboxPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: links }] = await Promise.all([
    supabase.from('link_hub_categories').select('*').order('display_order'),
    supabase.from('link_hub').select('*').order('display_order'),
  ]);

  return <ToolboxClient categories={categories ?? []} links={links ?? []} />;
}
```

### 3-4. 검증

- `/toolbox` → 10 카테고리 + 50+ 링크 렌더
- 링크 클릭 시 새 탭으로 열리면서 `link_hub_clicks` 에 1건 로그
- 로그인 사용자가 즐겨찾기 별표 클릭 → `link_hub_favorites` 에 기록
- `npm run build` 0 에러

**커밋 메시지**: `feat: 투자자 도구함 (10 categories, 50+ curated links) with favorites and click logging`

---

## 🔧 W4 — Partner-Agnostic Landing 인프라 (예상 4~5일)

### 4-1. 스키마

파일: `supabase/migrations/007_partners.sql` (신규)

```sql
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  hero_title text,
  hero_subtitle text,
  visual_url text,
  benefits jsonb default '[]',
  form_fields jsonb default '[]',
  consent_text text,
  category text,
  active boolean default true,
  tracking_pixel text,
  payout_per_lead numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  slot_type text,
  slot_ref text,
  user_id uuid references auth.users(id) on delete set null,
  form_data jsonb,
  consent boolean default false,
  ip_address inet,
  user_agent text,
  referrer text,
  status text default 'new',
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index on public.partner_leads (partner_id, created_at desc);
create index on public.partner_leads (status, created_at desc);

-- 슬롯 배치 매핑
create table if not exists public.partner_slot_placements (
  id uuid primary key default gen_random_uuid(),
  slot_type text not null,             -- 'contextual_stock' | 'category' | 'home_featured' | ...
  slot_ref text,                       -- 종목코드 or 카테고리 slug (null 이면 전체 대상)
  partner_slug text references public.partners(slug) on delete cascade,
  display_order int default 0,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

create index on public.partner_slot_placements (slot_type, slot_ref, active);
```

### 4-2. 랜딩 페이지 `/partner/[slug]`

파일: `app/partner/[slug]/page.tsx` (신규)

```tsx
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PartnerLanding from '@/components/partner/PartnerLanding';

export default async function PartnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ slot?: string; ref?: string }>;
}) {
  const { slug } = await params;
  const { slot, ref } = await searchParams;

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (!partner) notFound();

  return (
    <PartnerLanding
      partner={partner}
      slotType={slot ?? 'direct'}
      slotRef={ref ?? null}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('partners').select('name, hero_subtitle').eq('slug', slug).maybeSingle();
  return { title: data?.name ?? 'Partner', description: data?.hero_subtitle };
}
```

### 4-3. PartnerLanding 컴포넌트

파일: `components/partner/PartnerLanding.tsx` (신규)

**섹션 순서**: Hero → Visual → Benefits → Form → (선택) Testimonials → (선택) FAQ

**Form 컴포넌트**:
- `form_fields` 배열을 렌더 (name/phone/email/interest 등)
- 각 필드에 `required` 표시
- 제출 시 `/api/partner/lead` POST
- 제출 완료 후 "Post-Action Slot" 노출 (다른 파트너 추천)

### 4-4. Lead 수집 API

파일: `app/api/partner/lead/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { partner_slug, slot_type, slot_ref, form_data, consent } = body;

  if (!consent) {
    return NextResponse.json({ error: '개인정보 제공 동의 필요' }, { status: 400 });
  }

  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('slug', partner_slug)
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: 'partner not found' }, { status: 404 });

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('partner_leads')
    .insert({
      partner_id: partner.id,
      slot_type,
      slot_ref,
      user_id: user?.id ?? null,
      form_data,
      consent: true,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
      referrer: req.headers.get('referer') ?? null,
      status: 'new',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, leadId: data.id });
}
```

### 4-5. PartnerSlot 컴포넌트 (재사용)

파일: `components/partner/PartnerSlot.tsx` (신규)

- props: `{ slotType: string; slotRef?: string }`
- Server Component
- `partner_slot_placements` 테이블에서 active 한 slot 찾아서 렌더
- 내부적으로 1~N 개 파트너 카드 (logo + hero_title + CTA 버튼 → `/partner/[slug]?slot=X&ref=Y`)

```tsx
// 사용 예시
import PartnerSlot from '@/components/partner/PartnerSlot';

// 종목 상세 개요 탭 하단
<PartnerSlot slotType="contextual_stock" slotRef={symbol} />

// 투자자 도구함 카테고리 상단
<PartnerSlot slotType="category" slotRef="global" />

// 홈 오른쪽 패널
<PartnerSlot slotType="home_featured" />
```

### 4-6. 관리자 패널

파일: `app/admin/partners/page.tsx` (신규, `AuthGuard minPlan="admin"`)

- 파트너 목록 테이블 (이름/카테고리/상태/리드 수)
- "+ 새 파트너" → 폼 (slug/name/logo/hero/benefits/fields/consent/category/payout)
- 파트너 클릭 → 상세 + 편집 + 슬롯 배치 UI + 리드 리스트 다운로드(CSV)

**최소 기능 (W4 안에 끝내야 하는 것)**:
- 파트너 CRUD
- 슬롯 배치 (select: slot_type + slot_ref 입력 + partner_slug 선택)
- 리드 CSV 다운로드

### 4-7. 더미 파트너 1건 시딩 (검증용)

```sql
insert into public.partners (slug, name, hero_title, hero_subtitle, benefits, form_fields, consent_text, category, payout_per_lead)
values (
  'test',
  '테스트 파트너',
  '테스트 랜딩 페이지',
  '이것은 테스트입니다',
  '["혜택 1", "혜택 2", "혜택 3"]'::jsonb,
  '[{"name":"name","label":"이름","type":"text","required":true},{"name":"phone","label":"전화번호","type":"tel","required":true}]'::jsonb,
  '제공받은 정보는 테스트 목적으로만 사용되며 수집일로부터 30일 후 파기됩니다.',
  '테스트',
  50000
);

insert into public.partner_slot_placements (slot_type, slot_ref, partner_slug, display_order)
values ('home_featured', null, 'test', 1);
```

### 4-8. 검증

- `/partner/test` → 더미 랜딩 정상 렌더
- 폼 제출 (이름/전화번호) → DB `partner_leads` 에 1건
- `/admin/partners` → 파트너 리스트 표시 + CRUD 가능
- 홈 페이지 오른쪽 패널에 '테스트 파트너' 슬롯 노출 (home_featured)
- 슬롯 클릭 → `/partner/test?slot=home_featured` 진입
- `npm run build` 0 에러

**커밋 메시지**: `feat: partner-agnostic landing infrastructure with 6 slot types, admin panel, lead capture`

---

## ✅ Phase 1 완료 후 전체 검증 체크리스트

```bash
cd ~/Desktop/OTMarketing && npm run build
```

- [ ] 빌드 0 에러 / 0 경고 (또는 납득 가능한 경고만)
- [ ] `/` → 홈 + 채팅 사이드바 + Partner Slot (오른쪽) 정상
- [ ] `/stocks/005930` → 채팅 유지 + 8탭 (1~6 동작)
- [ ] `/toolbox` → 10 카테고리 + 50+ 링크 + 즐겨찾기 + 클릭 로그
- [ ] `/partner/test` → 더미 랜딩 + 폼 제출 → DB 확인
- [ ] `/admin/partners` → 파트너 CRUD + 슬롯 배치 + 리드 CSV
- [ ] 비로그인 이용자로 모든 페이지 실시간 시세 표시
- [ ] 채팅 `$005930` 태그 자동 파싱 + 클릭 시 종목 페이지 이동
- [ ] 채팅 rate limit (분당 6개 시도 시 429)
- [ ] DB 4개 신규 테이블 존재 (`chat_messages`, `partners`, `partner_leads`, `link_hub_categories`, `partner_slot_placements`)

---

## 📝 세션 종료 시 해야 할 일

1. 4개 문서 헤더 오늘 날짜로 업데이트
2. `docs/CHANGELOG.md` 에 세션 변경사항 기록
3. `session-context.md` 세션 히스토리 블록 추가
4. `docs/NEXT_SESSION_START.md` 최신화
5. `git add -A && git commit -m "..." && git push`

---

**명령어 종료.** 의문점/블로커 발생 시 Cowork 에게 돌아와서 상의.
