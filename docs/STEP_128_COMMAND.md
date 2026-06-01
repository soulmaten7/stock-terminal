<!-- 2026-06-01 -->
# STEP 128 — MVP 2.0 1차: 상품·리딩방 디렉토리 + 평가 시스템 기반

🔴 **Opus 권장** (운종 진짜 사업 진입 — DB·페이지·헤더·시드 한 번에)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `aa264dd` (STEP 127 Pretendard + 크기·spacing 상향)
- 운종 V5 PC 기능 완성 (홈·종목·토론·댓글·채팅·뉴스·검색·차트·관심종목)
- **MVP 2.0 영역 = 0% (시작 안 됨)**
- 사용자 결정: "운종 = 신뢰 평가 허브 (Trustpilot 금융 버전) + 정제된 토론 + Tier 인증 광고"

## 운종 진짜 사업 — 이 STEP 의 의미

> **운종 = Trustpilot 한국 금융 버전**

대화에서 사용자가 결정한 모델 F:
- 증권사 상품 (ETF·펀드·랩 등) 평가 디렉토리
- 텔레그램·카톡방 리딩방 평가 디렉토리
- 광고 (Sponsored) ↔ 토론 (운종 책임 X) 명확 분리
- Tier 1·2·3 인증 시스템

→ **이게 운종의 진짜 차별화** (네이버·토스·키움 모두 안 함, 시장 공백).

## 목표 (MVP 2.0 1차 — 기반)

| 영역 | 변경 |
|------|------|
| **DB 마이그레이션 019** | products + leading_rooms + platform_discussions 테이블 |
| **신규 페이지** | `/products` 디렉토리 · `/rooms` 디렉토리 · `/product/[id]` 평가 · `/room/[id]` 평가 |
| **헤더 메뉴 추가** | 종목발굴/캘린더 옆에 "💼 상품·리딩방" 추가 |
| **시드 데이터** | 주요 ETF 30개 + 알려진 리딩방 5~10개 (운영진 manual) |
| **평가 시스템** | 네이버 토론방 형식 (글 + 좋아요·신고 + HOT 정렬) — discussion 패턴 재활용 |

⚠️ MVP 2.0 1차는 **기반만**. Tier 인증 광고·결제·KOFIA API 통합은 추후.

---

## DB 마이그레이션 019 (Cowork 가 별도 적용)

신규 파일: `supabase/migrations/019_platform_directory.sql`

```sql
-- 019: MVP 2.0 — 상품·리딩방 디렉토리 + 평가 시스템

-- ============================================================
-- 1) products — 금융 상품 (ETF, 펀드, 랩, ELS 등)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('etf', 'fund', 'wrap', 'els', 'bond', 'reits', 'other')),
  ticker TEXT,  -- ETF 등 코드 (KOSEF 332520, TIGER 미국나스닥100 등)
  name TEXT NOT NULL,
  issuer TEXT,  -- 운용사 (미래에셋·삼성·KB·NH 등)
  description TEXT,
  external_url TEXT,  -- 운용사 또는 증권사 페이지 URL
  fee_pct NUMERIC(5, 4),  -- 보수율 (예: 0.0050 = 0.5%)
  inception_date DATE,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  discussion_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_products_ticker ON public.products (ticker) WHERE ticker IS NOT NULL;

-- ============================================================
-- 2) leading_rooms — 리딩방 (텔레그램·카톡방·디스코드 등)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leading_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'kakao', 'discord', 'naver_band', 'naver_cafe', 'youtube', 'other')),
  name TEXT NOT NULL,
  operator TEXT,  -- 운영자 (별명 or 실명)
  description TEXT,
  external_url TEXT,  -- 가입 링크
  pricing TEXT,  -- '무료' / '월 10만원' / '평생 100만원' 등
  category TEXT[],  -- ['단타', '장타', '코인', '미장'] 등
  is_certified BOOLEAN NOT NULL DEFAULT false,  -- Tier 1 인증 (운영진 검토)
  view_count INTEGER NOT NULL DEFAULT 0,
  discussion_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leading_rooms_platform ON public.leading_rooms (platform) WHERE hidden = false;

-- ============================================================
-- 3) platform_discussions — 상품·리딩방 평가 토론
-- ============================================================
-- 기존 discussions 테이블은 종목용 (symbol 컬럼).
-- 별도 테이블 — 다형 참조 (target_type + target_id).
CREATE TABLE IF NOT EXISTS public.platform_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'room')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  -- 평가 메타 (선택)
  duration TEXT,  -- '1개월 이용' '3년 보유' 등
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('positive', 'neutral', 'negative')),
  like_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_discussions_target_created
  ON public.platform_discussions (target_type, target_id, created_at DESC) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_platform_discussions_target_hot
  ON public.platform_discussions (target_type, target_id, like_count DESC) WHERE hidden = false;

-- ============================================================
-- 4) platform_discussion_likes / reports — 좋아요·신고
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_discussion_likes (
  discussion_id UUID NOT NULL REFERENCES public.platform_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.platform_discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.platform_discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discussion_id, reporter_id)
);

-- ============================================================
-- 5) 트리거 — like_count, discussion_count, 자동 hidden
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_platform_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.platform_discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.platform_discussions SET like_count = like_count - 1 WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_platform_likes_count ON public.platform_discussion_likes;
CREATE TRIGGER trigger_platform_likes_count
  AFTER INSERT OR DELETE ON public.platform_discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_discussion_like_count();

CREATE OR REPLACE FUNCTION public.update_platform_discussion_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.platform_discussions
  SET report_count = report_count + 1,
      hidden = (report_count + 1) >= 5
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_platform_reports_count ON public.platform_discussion_reports;
CREATE TRIGGER trigger_platform_reports_count
  AFTER INSERT ON public.platform_discussion_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_discussion_report_count();

-- 토론 작성·삭제 시 products/leading_rooms 의 discussion_count 갱신
CREATE OR REPLACE FUNCTION public.update_target_discussion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'product' THEN
      UPDATE public.products SET discussion_count = discussion_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'room' THEN
      UPDATE public.leading_rooms SET discussion_count = discussion_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'product' THEN
      UPDATE public.products SET discussion_count = discussion_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'room' THEN
      UPDATE public.leading_rooms SET discussion_count = discussion_count - 1 WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_target_discussion_count ON public.platform_discussions;
CREATE TRIGGER trigger_target_discussion_count
  AFTER INSERT OR DELETE ON public.platform_discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_target_discussion_count();

-- ============================================================
-- 6) RLS
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussion_reports ENABLE ROW LEVEL SECURITY;

-- 디렉토리: 모두 읽기, INSERT/UPDATE 는 운영자만 (별도 admin role — 추후)
CREATE POLICY "products public read" ON public.products FOR SELECT USING (hidden = false);
CREATE POLICY "leading_rooms public read" ON public.leading_rooms FOR SELECT USING (hidden = false);

-- 평가 토론: 모두 읽기 (hidden=false), 인증만 작성
CREATE POLICY "platform_discussions public read" ON public.platform_discussions
  FOR SELECT USING (hidden = false);
CREATE POLICY "platform_discussions auth insert" ON public.platform_discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND char_length(content) BETWEEN 1 AND 5000);

-- 좋아요: 인증
CREATE POLICY "platform_likes auth read" ON public.platform_discussion_likes FOR SELECT USING (true);
CREATE POLICY "platform_likes self insert" ON public.platform_discussion_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "platform_likes self delete" ON public.platform_discussion_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 신고: 인증
CREATE POLICY "platform_reports auth insert" ON public.platform_discussion_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- 7) 시드 데이터 — 주요 ETF + 리딩방 (운영진 manual)
-- ============================================================

-- ETF 시드 10개 (대표 ETF)
INSERT INTO public.products (category, ticker, name, issuer, description, external_url, fee_pct) VALUES
  ('etf', '069500', 'KODEX 200', '삼성자산운용', 'KOSPI 200 추종', 'https://www.samsungfund.com', 0.0015),
  ('etf', '102110', 'TIGER 200', '미래에셋자산운용', 'KOSPI 200 추종', 'https://www.tigeretf.com', 0.0005),
  ('etf', '133690', 'TIGER 미국나스닥100', '미래에셋자산운용', '미국 나스닥100 추종', 'https://www.tigeretf.com', 0.0070),
  ('etf', '360750', 'TIGER 미국S&P500', '미래에셋자산운용', '미국 S&P500 추종', 'https://www.tigeretf.com', 0.0070),
  ('etf', '305720', 'KODEX 2차전지산업', '삼성자산운용', '국내 2차전지 산업', 'https://www.samsungfund.com', 0.0045),
  ('etf', '305540', 'TIGER 2차전지테마', '미래에셋자산운용', '국내 2차전지 테마', 'https://www.tigeretf.com', 0.0050),
  ('etf', '459580', 'KODEX 미국나스닥100(H)', '삼성자산운용', '환헤지 나스닥100', 'https://www.samsungfund.com', 0.0070),
  ('etf', '329200', 'TIGER 리츠부동산인프라', '미래에셋자산운용', '국내 리츠·인프라', 'https://www.tigeretf.com', 0.0050),
  ('etf', '278530', 'KODEX 200TR', '삼성자산운용', 'KOSPI 200 (배당재투자)', 'https://www.samsungfund.com', 0.0015),
  ('etf', '379780', 'KODEX 미국나스닥100TR', '삼성자산운용', '나스닥100 배당재투자', 'https://www.samsungfund.com', 0.0070)
ON CONFLICT DO NOTHING;

-- 리딩방 시드 (placeholder — 운영진이 실제 등록 시 교체)
INSERT INTO public.leading_rooms (platform, name, operator, description, pricing, category, is_certified) VALUES
  ('telegram', '예시 리딩방 A', '익명 운영자 A', '단타 리딩 (시드 데이터)', '월 50만원', ARRAY['단타'], false),
  ('telegram', '예시 리딩방 B', '익명 운영자 B', '장타·가치투자 리딩 (시드 데이터)', '평생 100만원', ARRAY['장타', '가치투자'], false),
  ('kakao', '예시 카톡방 C', '익명 운영자 C', '미국주식 리딩 (시드 데이터)', '월 30만원', ARRAY['미국주식'], false),
  ('youtube', '예시 유튜브 D', '익명 운영자 D', '주식 분석 채널 (시드 데이터)', '무료', ARRAY['분석', '교육'], false),
  ('discord', '예시 디스코드 E', '익명 운영자 E', '코인·주식 통합 (시드 데이터)', '월 100만원', ARRAY['코인', '주식'], false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8) Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_discussions;
```

⚠️ Cowork 가 별도 적용.

---

## 작업 디테일

### [1] 신규 페이지 — `/products` 디렉토리

`app/products/page.tsx`:

```tsx
import { Suspense } from "react";
import ProductsClient from "@/components/platform/ProductsClient";

export const metadata = { title: "상품 디렉토리 — 운종" };

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <ProductsClient />
    </Suspense>
  );
}
```

`components/platform/ProductsClient.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle, Eye, ExternalLink } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Product = {
  id: string;
  category: string;
  ticker: string | null;
  name: string;
  issuer: string | null;
  description: string | null;
  fee_pct: number | null;
  discussion_count: number;
  view_count: number;
};

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "etf", label: "ETF" },
  { value: "fund", label: "펀드" },
  { value: "wrap", label: "랩" },
  { value: "reits", label: "리츠" },
  { value: "bond", label: "채권" },
];

export default function ProductsClient() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createAnonClient();
      let q = supabase
        .from("products")
        .select("id, category, ticker, name, issuer, description, fee_pct, discussion_count, view_count")
        .eq("hidden", false)
        .order("discussion_count", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      const { data } = await q;
      setItems((data || []) as Product[]);
      setLoading(false);
    };
    load();
  }, [category]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-unjong-primary mb-2">💼 금융 상품 디렉토리</h1>
        <p className="text-sm text-unjong-muted">
          ETF·펀드·랩·리츠 등 금융 상품을 사용자 리뷰와 함께 비교하세요. 운종은 평가 X, 사용자 토론 제공.
        </p>
      </header>

      <nav className="flex gap-2 mb-4 border-b border-unjong-border pb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`text-sm px-3 py-1.5 rounded ${
              category === c.value
                ? "bg-unjong-accent text-white font-semibold"
                : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
            }`}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <LoadingState title="상품 로딩 중..." />
      ) : items.length === 0 ? (
        <EmptyState icon="💼" title="등록된 상품이 없습니다" description="운영진이 곧 추가합니다." />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/product/${p.id}`}
                className="block bg-unjong-surface rounded-lg border border-unjong-border p-4 hover:border-unjong-accent transition-colors"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {p.category.toUpperCase()}
                  </span>
                  {p.ticker && <span className="text-xs font-mono text-unjong-muted">{p.ticker}</span>}
                </div>
                <h3 className="text-base font-semibold text-unjong-primary mb-1">{p.name}</h3>
                <p className="text-xs text-unjong-muted mb-2">{p.issuer || "운용사 미상"}</p>
                {p.description && <p className="text-xs text-unjong-primary line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center gap-3 text-[11px] text-unjong-muted">
                  {p.fee_pct !== null && <span>보수율 {(p.fee_pct * 100).toFixed(2)}%</span>}
                  <span className="flex items-center gap-1"><MessageCircle size={11} /> {p.discussion_count}</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {p.view_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### [2] 신규 페이지 — `/rooms` 디렉토리

`app/rooms/page.tsx` + `components/platform/RoomsClient.tsx` — 위와 유사 패턴.

리딩방 카테고리: 텔레그램/카카오/디스코드/네이버밴드/네이버카페/유튜브/기타.
플랫폼 배지·인증 마크 (is_certified) 표시.

⚠️ **시각 강조** — 리딩방은 가짜·작전 많아서 운종이 "운종은 평가 X, 사용자 토론 제공. 가입 전 충분한 검토 필요" 안내문 상단 노출.

### [3] 신규 페이지 — `/product/[id]`, `/room/[id]` 평가

각각 디렉토리 카드 클릭 시 진입. 좌측 상품/방 정보 + 가운데 평가 토론 (PlatformDiscussionBoard 컴포넌트 — 기존 DiscussionBoard 패턴 재활용).

### [4] 신규 컴포넌트 — `PlatformDiscussionBoard`

기존 `components/stock/DiscussionBoard.tsx` 와 거의 동일. 차이점:
- `target_type` ('product' | 'room') · `target_id` 으로 필터
- `discussions` 테이블 → `platform_discussions` 테이블
- 작성 시 `target_type` + `target_id` 같이 insert
- 평가 메타 옵션 (`duration` "1개월 이용" / `outcome` positive·neutral·negative)

### [5] 헤더 메뉴 추가 — `components/header/MainNav.tsx`

```tsx
const SECONDARY_LINKS = [
  { href: "/products", label: "상품·리딩방", englishLabel: "Reviews", icon: Award },  // 신규
  { href: "/screener", label: "종목발굴", englishLabel: "Screener", icon: BarChart3 },
  { href: "/calendar", label: "경제 캘린더", englishLabel: "Calendar", icon: CalendarDays },
] as const;
```

(Award 아이콘 또는 다른 적합한 lucide-react 아이콘)

### [6] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [7] 4개 문서 헤더 갱신

### [8] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(mvp2): MVP 2.0 1차 — 상품·리딩방 디렉토리 + 평가 시스템 기반

DB 마이그레이션 019 (Cowork 별도 적용):
- products (category·ticker·name·issuer·fee_pct·description·external_url·discussion_count·view_count)
- leading_rooms (platform·name·operator·pricing·category·is_certified·discussion_count)
- platform_discussions (다형 — target_type 'product'|'room' + target_id)
- platform_discussion_likes / reports
- 트리거: like_count·discussion_count 자동 갱신 + report 5건 자동 hidden
- RLS: 모두 read, 인증만 insert
- 시드: ETF 10개 (KODEX 200·TIGER 미국나스닥100 등) + 리딩방 placeholder 5개

신규 페이지:
- /products — 디렉토리 (카테고리 필터: ETF·펀드·랩·리츠·채권)
- /product/[id] — 상품 평가 (좌 정보 + 중 토론)
- /rooms — 리딩방 디렉토리 (플랫폼 배지·인증 마크·운종 안내문)
- /room/[id] — 리딩방 평가

신규 컴포넌트:
- ProductsClient, RoomsClient — 디렉토리
- ProductDetailClient, RoomDetailClient — 평가 페이지
- PlatformDiscussionBoard — DiscussionBoard 패턴 재활용 (target_type 다형)

헤더 변경:
- '상품·리딩방 (Reviews)' 메뉴 추가 (종목발굴 옆)

운종 정체성 재확인:
- 운종은 평가 X (사용자 토론 제공만)
- 광고 (Sponsored 명시) ↔ 토론 (운종 책임 X) 명확 분리 — 추후 광고 영역 추가
- Tier 1·2·3 인증 시스템 — 추후 STEP

MVP 2.0 진입 — 운종의 진짜 차별화 (Trustpilot 한국 금융 버전) 시작."
git push
```

## 검증 (사용자 안내용)

푸시 + Cowork 마이그레이션 019 적용 후:

1. 헤더 → "🏆 상품·리딩방 (Reviews)" 메뉴 클릭
2. `/products` → ETF 10개 카드 표시 (KODEX 200 · TIGER 미국나스닥100 등)
3. 카테고리 필터 (전체/ETF/펀드/랩/리츠/채권) 동작
4. 카드 클릭 → `/product/[id]` 진입
5. 좌측 상품 정보 + 가운데 평가 토론 (현재 빈 상태 — "첫 평가를 남겨보세요")
6. `/rooms` → 리딩방 5개 (placeholder)
7. 리딩방 카드 → 플랫폼 배지·"운종 평가 X" 안내문

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ /products·/rooms·/product·/room 라우트 정상
- ✅/❌ 시드 데이터 표시
- ⚠️ Cowork 마이그레이션 019 별도 적용

## 다음 STEP (MVP 2.0 후속)

- 광고 영역 (Sponsored 명시) ↔ 평가 토론 분리 UI
- Tier 1·2·3 인증 시스템 (운영자 인터페이스)
- 상품 검색 (KRX·KOFIA API 통합 — 키 발급 후)
- 평가에 outcome (positive/neutral/negative) UI
- 카카오 OAuth 활성화 (도메인 후)
- Vercel 배포

## ⚠️ 잔여 보안

`SUPABASE_ACCESS_TOKEN` 폐기 (계속 권장):
- https://supabase.com/dashboard/account/tokens
