<!-- 2026-05-31 -->
# STEP 115 — 종목 페이지 + 토론 게시판 + 종목별 채팅 (V5 핵심)

🔴 **Opus 권장** (대규모 신규 시스템 — DB·페이지·컴포넌트 전부 신규)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: STEP 118 (Layer 3 인증 코드 — 활성화는 추후)
- 컨테이너 max-w-[1984px], 한국/미국 2창, 카드 9개, 종목 상세 2탭
- 인증 인프라 코드 깔림 (카카오 OAuth 활성화 X — 비로그인 익명 동작)

## 운종 V5 핵심 — 이 STEP 의 의미

> **운종 = 오르내림 + 대화**
> 
> 종목 페이지가 운종의 **본질 페이지**. 가격 확인 + 토론 + 채팅이 한 화면에서 자연스럽게 동선 흐름.

토스 + 네이버 페이 증권 레이아웃 패턴 참고:
- 좌측 sticky 종목 정보 패널 (320px)
- 가운데 토론 게시판 (1128px)
- 우측 실시간 채팅 (380px, 토스 종목 페이지엔 없으나 운종은 채팅이 본질이라 추가)

## 목표

| 영역 | 변경 |
|------|------|
| **신규 페이지** | `/stock/[code]` 라우트 (예: `/stock/005930` `/stock/AAPL`) |
| **신규 DB 테이블** | `discussions` (토론 게시판), `discussion_likes`, `discussion_reports` |
| **DB 수정** | `chat_messages` 에 `symbol` 컬럼 추가 (종목별 채팅) |
| **신규 컴포넌트** | StockInfoPanel (좌), DiscussionBoard (중), StockChatPanel (우) |
| **수정** | 검색 드롭다운 선택 시 → /stock/[code] 로 이동 (현재는 setSelectedSymbol) |
| **수정** | 카드 종목 클릭 시 → /stock/[code] 로 이동 |
| **운종 정책 명시** | 비로그인 = 토론 읽기 가능, 글쓰기 X (로그인 안내) · 채팅 = 비로그인도 가능 |

## DB 마이그레이션 017 — 토론 시스템 + 종목별 채팅

신규 파일: `supabase/migrations/017_discussions.sql`

```sql
-- 017: 토론 게시판 + 종목별 채팅

-- ============================================================
-- 1) discussions — 토론 게시글
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussions_symbol_created
  ON public.discussions (symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_symbol_hot
  ON public.discussions (symbol, like_count DESC, created_at DESC);

-- ============================================================
-- 2) discussion_likes — 좋아요
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_likes (
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

-- ============================================================
-- 3) discussion_reports — 신고
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discussion_id, reporter_id)
);

-- ============================================================
-- 4) chat_messages 에 symbol 컬럼 추가 (종목별 채팅)
-- ============================================================
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS symbol TEXT DEFAULT NULL;

-- NULL = 전체 채팅 (general), 값 = 종목별 채팅
CREATE INDEX IF NOT EXISTS idx_chat_messages_symbol_created
  ON public.chat_messages (symbol, created_at DESC) WHERE symbol IS NOT NULL;

-- ============================================================
-- 5) like_count 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions SET like_count = like_count - 1 WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_discussion_likes_count ON public.discussion_likes;
CREATE TRIGGER trigger_discussion_likes_count
  AFTER INSERT OR DELETE ON public.discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_like_count();

-- ============================================================
-- 6) report_count + auto-hide (5건 이상 자동 숨김)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_discussion_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.discussions
  SET report_count = report_count + 1,
      hidden = (report_count + 1) >= 5
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_discussion_reports_count ON public.discussion_reports;
CREATE TRIGGER trigger_discussion_reports_count
  AFTER INSERT ON public.discussion_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_report_count();

-- ============================================================
-- 7) RLS
-- ============================================================
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reports ENABLE ROW LEVEL SECURITY;

-- 토론 글: 모두 읽기 (hidden=false), 로그인한 사람만 작성
CREATE POLICY "discussions public read" ON public.discussions
  FOR SELECT USING (hidden = false);
CREATE POLICY "discussions auth insert" ON public.discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND char_length(content) BETWEEN 1 AND 5000);

-- 좋아요: 로그인한 사람만
CREATE POLICY "likes auth read" ON public.discussion_likes
  FOR SELECT USING (true);
CREATE POLICY "likes self insert" ON public.discussion_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes self delete" ON public.discussion_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 신고: 로그인한 사람만 INSERT
CREATE POLICY "reports auth insert" ON public.discussion_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- 8) Realtime — 토론·채팅 모두 publication 추가
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;
-- chat_messages 는 이미 005 에서 추가됨
```

⚠️ **Cowork 가 Supabase MCP 로 별도 적용**.

---

## 작업 디테일

### [1] 신규 페이지 — `/stock/[code]`

#### `app/stock/[code]/page.tsx`

```tsx
import { Suspense } from "react";
import StockPageClient from "@/components/stock/StockPageClient";

export const metadata = { title: "종목 — 운종" };

type Props = {
  params: Promise<{ code: string }>;
};

export default async function StockPage({ params }: Props) {
  const { code } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <StockPageClient code={code} />
    </Suspense>
  );
}
```

#### `app/stock/layout.tsx` — 종목 페이지 전용 layout (운종 V5 메인 헤더 유지)

```tsx
import type { ReactNode } from "react";

export default function StockLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

### [2] 신규 컴포넌트 — `components/stock/StockPageClient.tsx`

좌·중·우 3컬럼 레이아웃. 토스/네이버 패턴.

```tsx
"use client";

import { useEffect } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import StockInfoPanel from "./StockInfoPanel";
import DiscussionBoard from "./DiscussionBoard";
import StockChatPanel from "./StockChatPanel";

type Props = { code: string };

export default function StockPageClient({ code }: Props) {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  // 종목 페이지 진입 시 selectedSymbol 동기화 (기존 차트·관심종목 활용)
  useEffect(() => {
    setSelectedSymbol({ code, name: code, market: /^[A-Z.\-]+$/.test(code) ? "US" : "KOSPI" });
  }, [code, setSelectedSymbol]);

  return (
    <div className="grid grid-cols-[320px_1fr_380px] gap-4 px-10 py-4 min-h-screen">
      {/* 좌측: 종목 정보 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
      </aside>

      {/* 가운데: 토론 게시판 */}
      <main>
        <DiscussionBoard symbol={code} />
      </main>

      {/* 우측: 실시간 채팅 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)]">
        <StockChatPanel symbol={code} />
      </aside>
    </div>
  );
}
```

### [3] 신규 컴포넌트 — `components/stock/StockInfoPanel.tsx`

좌측 sticky 종목 정보. 가격·차트·재무.

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

type Props = { symbol: string };

export default function StockInfoPanel({ symbol }: Props) {
  const [data, setData] = useState<{
    name: string;
    price: number;
    changePct: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    high52w: number;
    low52w: number;
    per: number;
    pbr: number;
    marketCap: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!/^\d{6}$/.test(symbol)) {
      // 미국 주식: Yahoo /api/yahoo/quote 사용
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/price?symbol=${symbol}`);
        const json = await r.json();
        if (!json.error) {
          setData({
            name: json.name,
            price: json.price,
            changePct: json.changePercent,
            open: json.open,
            high: json.high,
            low: json.low,
            volume: json.volume,
            high52w: json.high52w,
            low52w: json.low52w,
            per: json.per,
            pbr: json.pbr,
            marketCap: json.marketCap,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) return <div className="p-4 text-center text-xs text-unjong-muted">⏳ 로딩...</div>;
  if (!data) return (
    <div className="p-4 text-center text-xs text-unjong-muted">
      {/^\d{6}$/.test(symbol) ? "데이터 없음" : "미국 주식 — Yahoo Finance 통합 추후"}
    </div>
  );

  const isUp = data.changePct >= 0;

  return (
    <div className="space-y-3">
      {/* 뒤로 */}
      <Link href="/kr" className="inline-flex items-center gap-1 text-[10px] text-unjong-muted hover:text-unjong-primary">
        <ArrowLeft size={12} /> 한국주식
      </Link>

      {/* 종목 헤더 */}
      <div className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
        <h2 className="text-base font-bold text-unjong-primary">{data.name}</h2>
        <p className="text-[10px] text-unjong-muted font-mono">{symbol}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-unjong-primary tabular-nums">
            {data.price.toLocaleString()}
          </span>
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? "+" : ""}{data.changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 시세 */}
      <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
        <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">시세</h3>
        <Row label="시가" value={data.open ? data.open.toLocaleString() : "—"} />
        <Row label="고가" value={data.high ? data.high.toLocaleString() : "—"} />
        <Row label="저가" value={data.low ? data.low.toLocaleString() : "—"} />
        <Row label="거래량" value={data.volume ? data.volume.toLocaleString() : "—"} />
        <Row label="52주 최고" value={data.high52w ? data.high52w.toLocaleString() : "—"} />
        <Row label="52주 최저" value={data.low52w ? data.low52w.toLocaleString() : "—"} />
      </section>

      {/* 재무 */}
      <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
        <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">재무</h3>
        <Row label="시가총액" value={data.marketCap > 0 ? `${(data.marketCap / 100000000).toFixed(1)}조` : "—"} />
        <Row label="PER" value={data.per > 0 ? data.per.toFixed(1) : "—"} />
        <Row label="PBR" value={data.pbr > 0 ? data.pbr.toFixed(1) : "—"} />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-unjong-muted">{label}</span>
      <span className="font-semibold text-unjong-primary tabular-nums">{value}</span>
    </div>
  );
}
```

### [4] 신규 컴포넌트 — `components/stock/DiscussionBoard.tsx`

가운데 토론 게시판. 글 목록 + 글쓰기 + 좋아요 + 신고.

```tsx
"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { Heart, MessageCircle, Flag, AlertCircle } from "lucide-react";
import Link from "next/link";

type Discussion = {
  id: string;
  symbol: string;
  nickname: string;
  tier: number;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type SortMode = "hot" | "recent";

type Props = { symbol: string };

export default function DiscussionBoard({ symbol }: Props) {
  const user = useAuthStore((s) => s.user);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [showWrite, setShowWrite] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createAnonClient();
      let query = supabase
        .from("discussions")
        .select("id, symbol, nickname, tier, content, like_count, comment_count, created_at")
        .eq("symbol", symbol)
        .eq("hidden", false)
        .limit(50);
      query = sortMode === "hot"
        ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
        : query.order("created_at", { ascending: false });
      const { data } = await query;
      setDiscussions(data || []);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [symbol, sortMode]);

  const handleSubmit = async () => {
    if (!user) return;
    const trimmed = writeContent.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("discussions").insert({
      symbol,
      user_id: user.id,
      nickname: user.nickname,
      tier: user.tier ?? 1,
      content: trimmed,
    });
    if (!error) {
      setWriteContent("");
      setShowWrite(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <header className="flex items-center justify-between bg-unjong-surface rounded-lg border border-unjong-border px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-unjong-primary">💬 {symbol} 토론</h1>
          <p className="text-[10px] text-unjong-muted">실시간 토론 · 좋아요 정렬 / 최신순</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSortMode("hot")}
            className={`text-[10px] px-2 py-1 rounded ${sortMode === "hot" ? "bg-unjong-accent text-white font-semibold" : "text-unjong-muted hover:text-unjong-primary"}`}
          >
            🔥 HOT
          </button>
          <button
            type="button"
            onClick={() => setSortMode("recent")}
            className={`text-[10px] px-2 py-1 rounded ${sortMode === "recent" ? "bg-unjong-accent text-white font-semibold" : "text-unjong-muted hover:text-unjong-primary"}`}
          >
            🕐 최신
          </button>
        </div>
      </header>

      {/* 글쓰기 */}
      {!user ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4 text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-unjong-muted" />
          <p className="text-xs text-unjong-primary">토론 글쓰기는 로그인 후 가능합니다</p>
          <Link href="/auth/login" className="inline-block text-[10px] text-unjong-accent hover:underline">
            카카오로 로그인 →
          </Link>
        </div>
      ) : !showWrite ? (
        <button
          type="button"
          onClick={() => setShowWrite(true)}
          className="w-full text-left bg-unjong-surface rounded-lg border border-unjong-border px-4 py-3 text-xs text-unjong-muted hover:text-unjong-primary"
        >
          ✏️ {symbol} 에 대해 어떻게 생각하세요?
        </button>
      ) : (
        <div className="bg-unjong-surface rounded-lg border border-unjong-accent p-3 space-y-2">
          <textarea
            value={writeContent}
            onChange={(e) => setWriteContent(e.target.value)}
            placeholder="의견을 작성하세요. 욕설·작전·홍보는 자동 필터링됩니다."
            maxLength={5000}
            rows={4}
            autoFocus
            className="w-full text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-unjong-muted">
              {writeContent.length} / 5000자 · {user.nickname} (Tier {user.tier ?? 1})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowWrite(false); setWriteContent(""); }}
                className="text-xs text-unjong-muted px-2 py-1"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !writeContent.trim()}
                className="text-xs bg-unjong-accent text-white font-semibold px-3 py-1 rounded disabled:opacity-50"
              >
                {submitting ? "..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 text-center text-xs text-unjong-muted">⏳ 로딩 중...</div>
      ) : discussions.length === 0 ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 text-center text-xs text-unjong-muted">
          첫 토론을 남겨보세요.
        </div>
      ) : (
        <ul className="space-y-2">
          {discussions.map((d) => (
            <DiscussionItem key={d.id} discussion={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DiscussionItem({ discussion: d }: { discussion: Discussion }) {
  const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";

  return (
    <li className="bg-unjong-surface rounded-lg border border-unjong-border p-3 hover:border-unjong-accent transition-colors">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-semibold text-unjong-primary">
          {tierEmoji} {d.nickname}
        </span>
        <span className="text-[10px] text-unjong-muted">
          {new Date(d.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className="text-xs text-unjong-primary whitespace-pre-wrap leading-relaxed mb-2">{d.content}</p>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1 text-[10px] text-unjong-muted hover:text-unjong-danger">
          <Heart size={12} />
          <span>{d.like_count}</span>
        </button>
        <button className="flex items-center gap-1 text-[10px] text-unjong-muted hover:text-unjong-primary">
          <MessageCircle size={12} />
          <span>{d.comment_count}</span>
        </button>
        <button className="ml-auto text-[10px] text-unjong-muted hover:text-unjong-danger">
          <Flag size={11} />
        </button>
      </div>
    </li>
  );
}
```

### [5] 신규 컴포넌트 — `components/stock/StockChatPanel.tsx`

우측 종목별 실시간 채팅. 기존 ChatPanel 패턴 차용 + symbol 필터.

```tsx
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useNickname } from "@/stores/nicknameStore";

type ChatMessage = {
  id: string;
  symbol: string | null;
  nickname: string;
  content: string;
  created_at: string;
};

type Props = { symbol: string };

export default function StockChatPanel({ symbol }: Props) {
  const nickname = useNickname((s) => s.nickname);
  const ensureNickname = useNickname((s) => s.ensureNickname);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    ensureNickname();
  }, [ensureNickname]);

  useEffect(() => {
    let mounted2 = true;
    setLoading(true);
    setMessages([]);

    const load = async () => {
      try {
        const supabase = createAnonClient();
        const queryPromise = supabase
          .from("chat_messages")
          .select("id, symbol, nickname, content, created_at")
          .eq("symbol", symbol)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(100);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        );
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;
        if (!mounted2) return;
        if (!error && data) setMessages([...data].reverse() as ChatMessage[]);
      } catch {
      } finally {
        if (mounted2) setLoading(false);
      }
    };
    load();
    return () => { mounted2 = false; };
  }, [symbol]);

  useEffect(() => {
    const supabase = createAnonClient();
    const channel = supabase
      .channel(`chat-stock-${symbol}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `symbol=eq.${symbol}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const msg = payload.new as ChatMessage;
          if (!msg?.id) return;
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [symbol]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const supabase = createAnonClient();
    const safeNickname = nickname || "익명";
    const { error } = await supabase.from("chat_messages").insert({
      symbol,
      room: "general",  // backward compat
      nickname: safeNickname,
      content: trimmed,
    });
    if (!error) setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-unjong-surface rounded-lg border border-unjong-border h-[calc(100vh-2rem)] overflow-hidden">
      <header className="flex items-center justify-between border-b border-unjong-border px-3 py-2 bg-unjong-background flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary">⚡ {symbol} 실시간 채팅</span>
        <span className="text-[10px] text-unjong-muted truncate ml-2" suppressHydrationWarning>
          {mounted ? nickname : ""}
        </span>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {loading ? (
          <div className="text-center text-[10px] text-unjong-muted italic py-4">⏳ 로딩 중...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[10px] text-unjong-muted italic py-4">
            첫 메시지를 남겨보세요. {symbol} 트레이더와 실시간 대화.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-unjong-primary">{msg.nickname}</span>
                <span className="text-[10px] text-unjong-muted">
                  {new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              <p className="text-xs text-unjong-primary pl-1">{msg.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${symbol} 채팅...`}
            maxLength={500}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### [6] 검색·카드 클릭 → /stock/[code] 로 이동

#### 6-A. `components/header/HeaderSearch.tsx` — handleSelect 변경

```tsx
import { useRouter } from "next/navigation";

const router = useRouter();

const handleSelect = (item: SearchResult) => {
  router.push(`/stock/${item.symbol}`);
  setQuery("");
  setResults([]);
  setShowDropdown(false);
  setActiveIndex(-1);
};
```

#### 6-B. `components/sidebar/WatchlistPanel.tsx` — handleItemClick 변경

```tsx
import { useRouter } from "next/navigation";
const router = useRouter();
const handleItemClick = (item: WatchlistItem) => {
  router.push(`/stock/${item.code}`);
};
```

#### 6-C. 카드 컴포넌트들 — `setSelectedSymbol` 호출 시 router.push 로 변경 (또는 양쪽 다)

KrCards 와 UsCards 안의 종목 클릭 핸들러:

```tsx
import { useRouter } from "next/navigation";
const router = useRouter();
// 기존: setSelectedSymbol({...})
// 변경: router.push(`/stock/${item.code}`)
```

(setSelectedSymbol 도 유지하면 우측 패널·관심종목 동기화 OK)

### [7] 기존 페이지 영향

- `/(windows)/layout.tsx` 는 그대로 (카드 페이지에서는 좌측 채팅 + 우측 관심종목 그대로)
- `/stock/[code]` 는 별도 layout 적용 (좌·중·우 3컬럼 다르게)

### [8] 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

### [9] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(stock-page): 종목 페이지 + 토론 게시판 + 종목별 채팅 (V5 핵심)

신규 페이지:
- /stock/[code] — 종목 페이지 (좌 320 종목정보 + 중 토론 + 우 380 채팅)
- 토스·네이버 페이 증권 패턴 참고. 운종은 좌·중·우 3컬럼 sticky

DB 마이그레이션 017 (Cowork 가 별도 적용):
- discussions 테이블 (토론 게시글)
- discussion_likes (좋아요)
- discussion_reports (신고, 5건 이상 자동 hidden)
- chat_messages.symbol 컬럼 추가 (종목별 채팅)
- like_count·report_count 자동 갱신 트리거
- RLS: 모두 read, 인증만 글쓰기

신규 컴포넌트:
- StockPageClient — 3컬럼 grid 레이아웃
- StockInfoPanel — 좌측 sticky 종목 정보 (가격·시세·재무, 30초 폴링)
- DiscussionBoard — 가운데 토론 (HOT/최신 정렬, 글쓰기, 좋아요, 신고)
- StockChatPanel — 우측 실시간 채팅 (symbol 필터 + postgres_changes)

운종 정책 명시:
- 토론 글쓰기는 로그인 후만 (비로그인은 '카카오로 로그인' 안내 + /auth/login 링크)
- 토론 읽기는 비로그인도 가능
- 채팅은 비로그인도 가능 (트레이더-XXXX)
- 신고 5건 이상 → 자동 hidden (모더레이션)

검색·카드·관심종목 동선 변경:
- HeaderSearch 선택 → /stock/[code] 이동
- WatchlistPanel 종목 클릭 → /stock/[code] 이동
- 카드 종목 클릭 → /stock/[code] 이동 (setSelectedSymbol 도 유지)"
git push
```

## 검증 (사용자 안내용)

푸시 + Cowork 마이그레이션 017 적용 후:

1. /kr 의 Movers 카드 → 삼성전자 클릭 → `/stock/005930` 자동 이동
2. 종목 페이지에서 좌측 종목 정보 + 가운데 토론 + 우측 실시간 채팅 동시 표시
3. 좌측 종목 정보 30초마다 가격 갱신
4. 가운데 토론 — 비로그인: "토론 글쓰기는 로그인 후" 안내 + /auth/login 링크
5. 가운데 토론 — HOT/최신 토글
6. 우측 채팅 — 메시지 입력 → 즉시 실시간 반영 (postgres_changes)
7. 헤더 검색 "삼성" → 드롭다운 → 클릭 → /stock/[code] 이동
8. 우측 관심종목 클릭 → /stock/[code] 이동

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ /stock/005930, /stock/AAPL 등 라우트 정상
- ✅/❌ 검색·카드·관심종목에서 종목 클릭 시 /stock/[code] 이동
- ⚠️ DB 마이그레이션 017 — Cowork 가 별도 적용

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| 미국 주식 종목 정보 (Yahoo) 미통합 → "추후" 표시 | OK (다음 STEP 에서 통합) |
| 토론 글쓰기에 댓글 기능 없음 (comment_count 만 있음) | OK (댓글은 추후) |
| 좋아요 버튼 동작 X (UI 만 있음) | 다음 STEP 에서 onClick 구현 |
| 신고 버튼 동작 X (UI 만 있음) | 다음 STEP 에서 구현 |
| 종목 페이지에 차트 통합 X | 좌측 패널 외 별도 영역 추후 |

## 다음 STEP

- **STEP 117** — 새 홈 페이지 + dashboard 처분 + V3 잔재 2차 청소
- **STEP 119** — Vercel 배포 + unjong.com 도메인
- 추후 — 카카오 OAuth 활성화 (STEP 118 잔여)
- 추후 — 토론 좋아요·신고·댓글·미국 주식 통합
