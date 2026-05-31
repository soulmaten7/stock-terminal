<!-- 2026-05-31 -->
# STEP 120 — 종목 페이지 마무리 (좋아요·신고 + 차트 inline + 미장 Yahoo)

🔴 **Opus 권장** (3가지 영역 동시 — 토론 인터랙션 + 차트 통합 + Yahoo API)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `cbe50a9` (STEP 117 새 홈)
- 종목 페이지 `/stock/[code]` 작동 — 단:
  - 토론 좋아요·신고 버튼 UI 만 있고 onClick 동작 X
  - 차트 영역 없음 (좌측 종목 정보만)
  - 미국 주식 종목 정보 = "Yahoo Finance 통합 추후" 메시지
- 카카오 OAuth 활성화 X → 로그인 시도 X. 단 "로그인 필요" 안내는 동작

## 목표

| 영역 | 변경 |
|------|------|
| **DiscussionBoard 좋아요** | onClick → discussion_likes insert/delete 토글 + 채워진 하트 |
| **DiscussionBoard 신고** | onClick → 확인 모달 → discussion_reports insert |
| **비로그인 인터랙션** | 좋아요/신고 클릭 시 → "로그인 필요" 안내 + /auth/login 링크 |
| **종목 페이지 차트** | StockInfoPanel 안에 미니 일봉 차트 inline (lightweight-charts) |
| **미장 종목 정보** | StockInfoPanel 미국 분기 → Yahoo `/api/yahoo/quote` 통합 |

---

## 작업 디테일

### [1] DiscussionBoard 좋아요·신고 동작

#### 1-A. `components/stock/DiscussionItem` 분리 + state 관리

기존 `DiscussionItem` 함수형 컴포넌트를 별도 파일로 분리하고 상태 추가:

```tsx
// components/stock/DiscussionItem.tsx (신규 분리)
"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Flag, MessageCircle } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";

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

type Props = {
  discussion: Discussion;
  initiallyLiked?: boolean;
};

export default function DiscussionItem({ discussion: d, initiallyLiked = false }: Props) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(d.like_count);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";

  const handleLike = async () => {
    if (!user) {
      setShowLoginNotice(true);
      setTimeout(() => setShowLoginNotice(false), 3000);
      return;
    }
    const supabase = createAnonClient();
    if (liked) {
      // Unlike
      const { error } = await supabase
        .from("discussion_likes")
        .delete()
        .eq("discussion_id", d.id)
        .eq("user_id", user.id);
      if (!error) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("discussion_likes")
        .insert({ discussion_id: d.id, user_id: user.id });
      if (!error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  };

  const handleReport = async () => {
    if (!user) {
      setShowLoginNotice(true);
      setTimeout(() => setShowLoginNotice(false), 3000);
      return;
    }
    if (reported || reporting) return;
    if (!confirm(`이 게시글을 신고하시겠습니까?\n\n"${d.content.slice(0, 50)}..."\n\n허위 신고 시 운종 닉네임 신뢰 점수가 감소합니다.`)) return;

    setReporting(true);
    const supabase = createAnonClient();
    const { error } = await supabase
      .from("discussion_reports")
      .insert({ discussion_id: d.id, reporter_id: user.id, reason: "user_report" });
    if (!error) setReported(true);
    setReporting(false);
  };

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
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1 text-[10px] transition-colors ${liked ? "text-unjong-danger" : "text-unjong-muted hover:text-unjong-danger"}`}
        >
          <Heart size={12} fill={liked ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] text-unjong-muted"
          disabled
          title="댓글 기능은 추후 구현"
        >
          <MessageCircle size={12} />
          <span>{d.comment_count}</span>
        </button>
        <button
          type="button"
          onClick={handleReport}
          disabled={reported || reporting}
          className={`ml-auto text-[10px] transition-colors ${reported ? "text-unjong-danger" : "text-unjong-muted hover:text-unjong-danger"}`}
          title={reported ? "신고 완료" : "신고"}
        >
          <Flag size={11} fill={reported ? "currentColor" : "none"} />
        </button>
      </div>

      {/* 비로그인 안내 */}
      {showLoginNotice && (
        <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-center justify-between">
          <span>로그인 후 이용 가능합니다</span>
          <Link href="/auth/login" className="text-unjong-accent font-semibold hover:underline">
            로그인 →
          </Link>
        </div>
      )}
    </li>
  );
}
```

#### 1-B. `DiscussionBoard.tsx` — 본인이 좋아요한 글 표시 + DiscussionItem 사용

기존 인라인 `DiscussionItem` 함수 제거하고 import:

```tsx
import DiscussionItem from "./DiscussionItem";
```

그리고 로드 시 본인의 좋아요한 글 ID 들도 가져오기:

```tsx
const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

useEffect(() => {
  if (!user) {
    setLikedIds(new Set());
    return;
  }
  const loadLikes = async () => {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("discussion_likes")
      .select("discussion_id")
      .eq("user_id", user.id);
    setLikedIds(new Set((data || []).map((r) => r.discussion_id)));
  };
  loadLikes();
}, [user, discussions.length]);
```

리스트 렌더링 변경:
```tsx
{discussions.map((d) => (
  <DiscussionItem
    key={d.id}
    discussion={d}
    initiallyLiked={likedIds.has(d.id)}
  />
))}
```

### [2] 종목 페이지 차트 inline — StockInfoPanel

`components/stock/StockInfoPanel.tsx` 에 차트 영역 추가. lightweight-charts dynamic import (STEP 108 코드 재활용).

상단 종목 헤더 아래, 시세 박스 위에 차트 위치:

```tsx
import { useRef } from "react";

// 컴포넌트 안에 추가
const chartRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!symbol || !/^\d{6}$/.test(symbol)) return;
  if (!chartRef.current) return;

  let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
  let cancelled = false;

  const load = async () => {
    try {
      const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
        import("lightweight-charts"),
        fetch(`/api/kis/chart?symbol=${symbol}&period=D`).then((r) => r.json()),
      ]);
      if (cancelled || !chartRef.current) return;

      chartRef.current.innerHTML = "";
      chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#475569",
          fontFamily: "inherit",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: "#e2e8f0", style: LineStyle.Dotted },
          horzLines: { color: "#e2e8f0", style: LineStyle.Dotted },
        },
        rightPriceScale: { borderColor: "#cbd5e1" },
        timeScale: { borderColor: "#cbd5e1", timeVisible: false },
      });

      const series = chart.addCandlestickSeries({
        upColor: "#0E7C7B",
        downColor: "#C73E3A",
        borderUpColor: "#0E7C7B",
        borderDownColor: "#C73E3A",
        wickUpColor: "#0E7C7B",
        wickDownColor: "#C73E3A",
      });
      series.setData(res.candles.slice(-60).map((c: { time: string; open: number; high: number; low: number; close: number }) => ({
        time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
      })));
      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (chart && chartRef.current) {
          chart.applyOptions({ width: chartRef.current.clientWidth });
        }
      });
      ro.observe(chartRef.current);
      (chart as unknown as { _ro?: ResizeObserver })._ro = ro;
    } catch (err) {
      // 차트 로딩 실패 무시
    }
  };
  load();
  return () => {
    cancelled = true;
    if (chart) {
      const ro = (chart as unknown as { _ro?: ResizeObserver })._ro;
      if (ro) ro.disconnect();
      chart.remove();
    }
  };
}, [symbol]);
```

JSX 에 차트 div 추가 (종목 헤더 박스 다음):
```tsx
{/* 차트 */}
{/^\d{6}$/.test(symbol) && (
  <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
    <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-2">일봉 (60일)</h3>
    <div ref={chartRef} className="w-full h-[200px]" />
  </section>
)}
```

### [3] 미국 주식 StockInfoPanel — Yahoo 통합

기존 `if (!/^\d{6}$/.test(symbol))` 분기 처리:

```tsx
// 한국 주식: KIS API 사용 (기존 로직 유지)
// 미국 주식: Yahoo API 추가

useEffect(() => {
  let cancelled = false;
  const load = async () => {
    try {
      if (/^\d{6}$/.test(symbol)) {
        const r = await fetch(`/api/kis/price?symbol=${symbol}`);
        const json = await r.json();
        if (cancelled || json.error) return;
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
      } else if (/^[A-Z.\-]+$/.test(symbol)) {
        // 미국 주식 — Yahoo quote
        const r = await fetch(`/api/yahoo/quote?symbols=${symbol}`);
        const json = await r.json();
        if (cancelled || !json.items?.[0]) return;
        const it = json.items[0];
        setData({
          name: it.code,  // Yahoo 가 종목명 따로 안 줌. code 만.
          price: it.price,
          changePct: it.changePct,
          open: 0, high: 0, low: 0, volume: 0,
          high52w: 0, low52w: 0, per: 0, pbr: 0, marketCap: 0,
        });
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  };
  load();
  const interval = setInterval(load, 30000);
  return () => { cancelled = true; clearInterval(interval); };
}, [symbol]);
```

미국 주식의 경우 시세·재무 박스도 표시 X 또는 단순화. 더 풍부한 데이터 (시고저·52주 등) 는 추후 `/api/yahoo/quote-detail` 같은 신규 API 필요. 일단 가격·등락률만.

JSX 의 미국 주식 분기:
```tsx
// 시세·재무 박스 렌더링 — 한국 주식만 풍부, 미국은 단순
{/^\d{6}$/.test(symbol) && data.open > 0 && (
  <>
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
      <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">시세</h3>
      <Row label="시가" value={data.open ? data.open.toLocaleString() : "—"} />
      {/* ... */}
    </section>
    {/* 재무 ... */}
  </>
)}

{!/^\d{6}$/.test(symbol) && (
  <div className="bg-unjong-surface rounded-lg border border-unjong-border p-3 text-center text-[10px] text-unjong-muted">
    <p>미국 주식 상세 정보 (시고저·52주·PER 등)</p>
    <p>Yahoo Finance 통합 작업 중</p>
  </div>
)}
```

### [4] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

체크:
- TypeScript 에러 0
- 차트 영역 정상 빌드
- DiscussionItem 분리 후 import 정상

### [5] 4개 문서 헤더 갱신 + 로그

### [6] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(stock-page): 토론 좋아요·신고 + 차트 inline + 미장 Yahoo 통합

DiscussionBoard 인터랙션:
- DiscussionItem 컴포넌트 분리
- 좋아요 onClick → discussion_likes insert/delete 토글 + 채워진 하트
- 신고 onClick → confirm 다이얼로그 → discussion_reports insert (5건 자동 hidden)
- 비로그인 시 → 'amber 배너로 로그인 안내' + /auth/login 링크 (3초 자동 숨김)
- 로드 시 본인 좋아요한 글 ID 미리 가져와서 초기 liked 상태 표시
- 댓글 버튼: 현재 disabled (count 만 표시)

StockInfoPanel 차트 inline:
- 좌측 종목 헤더 박스 아래에 60일 일봉 차트 추가 (높이 200px)
- lightweight-charts dynamic import (STEP 108 ChartTab 코드 재활용)
- attributionLogo: false (Apache 2.0 합법)
- 한국 주식만 표시 (미국은 별도 통합 추후)
- ResizeObserver 로 컨테이너 너비 자동 조절

미국 주식 StockInfoPanel 통합:
- /api/yahoo/quote 호출 추가 (가격·등락률)
- '미국 주식 — Yahoo Finance 통합 추후' 메시지 제거
- 시세·재무 박스는 한국 주식만 풍부 (미국은 'Yahoo Finance 통합 작업 중' 안내)
- 더 풍부한 미국 데이터 (시고저·52주·PER) 는 별도 API 필요 — 추후"
git push
```

## 검증 (사용자 안내용)

푸시 후 하드 리프레시:

1. `/stock/005930` (삼성전자) → 좌측 종목 헤더 + **60일 캔들 차트** + 시세·재무 박스
2. 가운데 토론 — 글 작성 → 본인이 작성한 글 표시 (인증 활성화 시)
3. 토론 글의 ❤ 버튼 클릭 → 즉시 카운트 증가 + 채워진 하트
4. 다시 클릭 → 즉시 카운트 감소 + 빈 하트
5. 🚩 신고 → confirm 다이얼로그 → OK → 빨간 깃발 채워짐
6. 비로그인 상태 클릭 → amber 배너 "로그인 후 이용 가능합니다" + 3초 후 자동 숨김
7. `/stock/AAPL` (애플) → 좌측 가격·등락률 표시 (Yahoo)
8. 우측 채팅 정상

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ DiscussionItem 분리 + 좋아요·신고 동작
- ✅/❌ StockInfoPanel 차트 inline (한국 주식)
- ✅/❌ 미국 주식 Yahoo 통합 (가격·등락률)
- ✅/❌ 커밋 + 푸시

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| 인증 활성화 X 라 좋아요·신고 실제 RLS insert 실패 | "로그인 안내" 배너로 흐름 차단 (STEP 118 활성화 후 정상) |
| 차트 영역이 sticky 종목 정보 안에 있어 스크롤 무거움 | 차트 dynamic import 라 lazy load |
| 미국 주식 종목명 (Apple) 이 ticker 만 표시 | Yahoo `quote` API 가 종목명 미반환 — 추후 quoteSummary 통합 |
| ResizeObserver 미지원 브라우저 (구형 IE) | Next.js 최소 지원 Chrome/Firefox/Safari 라 무관 |

## 다음 STEP

- **STEP 121** — 모바일 반응형 (< 1024px 단일 컬럼, 채팅 별도 페이지)
- **STEP 122** — 종목별 뉴스 (네이버 검색 API + 뉴스 탭)
- **STEP 123** — UI 다듬기
