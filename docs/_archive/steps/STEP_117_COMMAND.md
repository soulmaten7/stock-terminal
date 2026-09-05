<!-- 2026-05-31 -->
# STEP 117 — 새 홈 페이지 + dashboard 처분 + V3 2차 청소

🔴 **Opus 권장** (대규모 페이지·컴포넌트 삭제 + 신규 홈 작성)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `79f1dc9` (STEP 115 종목 페이지 + 토론)
- 컨테이너 max-w-[1984px] · 한국/미국 2창 · 카드 9개 · 종목 페이지 · 토론·종목별 채팅 (인증 활성화 추후)
- V3 잔재 보존된 영역: dashboard + HomeClient + widgets + V3 12개 페이지 (briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map)

## 운종 V5 핵심 — 이 STEP 의 의미

> **운종 = 한국 주식 동선의 출발점 + 정제된 대화**

손성기 디자이너의 네이버 페이 증권 홈 리뉴얼 케이스 스터디 (2024) 인사이트:
- **70%+ 클릭이 관심종목 영역** — 가장 핵심
- 홈 = **"탐색의 출발점 가이드"** 로 재정의
- 모듈 순서: 시장 지표 → 보유/관심 → 시장 핫 이슈

운종 V5 정체성에 맞게 dashboard (V3 5섹션) 가 사실상 가치 X → **새 홈이 100% 대체**.

## 목표

| 항목 | 변경 |
|------|------|
| **신규 페이지** | `/` 새 홈 (3컬럼 — 좌 시장·우 관심 가운데 카드+토론+채팅 HOT) |
| **삭제** | `/dashboard` (V3 5섹션 — 새 홈이 대체) |
| **삭제** | V3 12개 페이지 (briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map) |
| **삭제** | `components/home/HomeClient.tsx` + `components/widgets/*` 전체 |
| **삭제** | `components/chat/FloatingChat.tsx` (HomeClient 의존) |
| **redirect 변경** | `/scalper`, `/longterm` → `/kr` (이미 STEP 114) · `/` → 새 홈 (현재 /kr redirect 제거) |

## 9개 정확 카드 — 새 홈 에서의 위치

- 한국 5개 + 미국 4개 = 9개 (그대로 유지)
- `/kr` 페이지 = 한국 5개 카드
- `/us` 페이지 = 미국 4개 카드
- **새 홈 (`/`)** = 한국주식 카드 일부 (Movers·Volume·NetBuy) + 시장 핫 이슈 + 관심종목 + HOT 토론 + 활발한 채팅방

새 홈에선 미국주식 카드 X (사용자가 /us 가서 봄). 한국 카드 3개만 노출. → "한국 시장 동선의 출발점" 정체성.

---

## 작업 디테일

### [1] 새 홈 페이지 — `/`

#### `app/page.tsx`

기존 (redirect 처리):
```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/kr"); }
```

변경 (신규 홈 컴포넌트 렌더):
```tsx
import HomeClientV5 from "@/components/home-v5/HomeClientV5";

export const metadata = { title: "운종 — 한국 주식 동선의 출발점" };

export default function HomePage() {
  return <HomeClientV5 />;
}
```

#### `components/home-v5/HomeClientV5.tsx` 신규

```tsx
"use client";

import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { MoversCard, VolumeCard, NetBuyBrokerCard } from "@/components/cards/ScalperCards";
import { DisclosureCard } from "@/components/cards/ScalperCards";
import HotDiscussionsModule from "./HotDiscussionsModule";
import HotChatRoomsModule from "./HotChatRoomsModule";

export default function HomeClientV5() {
  return (
    <div className="grid grid-cols-[320px_1fr_320px] gap-4 px-10 py-4 min-h-[calc(100vh-200px)]">
      {/* 좌측: 시장 동선 시작 — 채팅 + HOT 토론 */}
      <aside className="space-y-4 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="h-[400px] flex flex-col">
          <ChatPanel />
        </div>
        <HotChatRoomsModule />
      </aside>

      {/* 가운데: 시장 핫 이슈 (카드 4종) + HOT 토론 */}
      <main className="space-y-4">
        <section>
          <h2 className="text-base font-semibold text-unjong-primary mb-3">🔥 시장 핫 이슈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MoversCard />
            <VolumeCard />
            <NetBuyBrokerCard />
            <DisclosureCard />
          </div>
        </section>

        <HotDiscussionsModule />
      </main>

      {/* 우측: 관심 종목 + 사용자가 만든 동선 */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)]">
        <WatchlistPanel />
      </aside>
    </div>
  );
}
```

#### `components/home-v5/HotDiscussionsModule.tsx` 신규

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { Heart, MessageCircle, TrendingUp } from "lucide-react";

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

export default function HotDiscussionsModule() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("discussions")
          .select("id, symbol, nickname, tier, content, like_count, comment_count, created_at")
          .eq("hidden", false)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10);
        setItems(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-unjong-primary flex items-center gap-1.5">
          🔥 HOT 토론 <span className="text-[10px] text-unjong-muted font-normal">24시간 좋아요 순</span>
        </h2>
        <span className="text-[10px] text-unjong-muted italic">실시간</span>
      </header>

      {loading ? (
        <div className="text-center text-xs text-unjong-muted py-4">⏳ 로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-xs text-unjong-muted py-4">
          첫 토론을 남겨보세요. 종목 페이지에서 작성 가능.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => {
            const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";
            return (
              <li key={d.id}>
                <Link
                  href={`/stock/${d.symbol}`}
                  className="block bg-unjong-background rounded p-3 hover:border-unjong-accent border border-transparent transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {d.symbol}
                      </span>
                      <span className="text-xs font-medium text-unjong-primary">
                        {tierEmoji} {d.nickname}
                      </span>
                    </div>
                    <span className="text-[10px] text-unjong-muted">
                      {new Date(d.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-unjong-primary truncate">{d.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-unjong-muted">
                      <Heart size={10} /> {d.like_count}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-unjong-muted">
                      <MessageCircle size={10} /> {d.comment_count}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

#### `components/home-v5/HotChatRoomsModule.tsx` 신규

활발한 채팅방 (24시간 메시지 많은 종목 TOP 5):

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle } from "lucide-react";

type ChatRoom = {
  symbol: string;
  message_count: number;
};

export default function HotChatRoomsModule() {
  const [items, setItems] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createAnonClient();
        // 24시간 안에 메시지가 가장 많은 종목 TOP 5
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("chat_messages")
          .select("symbol")
          .not("symbol", "is", null)
          .gte("created_at", since);
        // 클라이언트에서 집계
        const counts: Record<string, number> = {};
        (data || []).forEach((r: { symbol: string | null }) => {
          if (r.symbol) counts[r.symbol] = (counts[r.symbol] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([symbol, message_count]) => ({ symbol, message_count }))
          .sort((a, b) => b.message_count - a.message_count)
          .slice(0, 5);
        setItems(sorted);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
      <h3 className="text-xs font-semibold text-unjong-primary mb-2">💬 활발한 채팅방</h3>
      {loading ? (
        <div className="text-center text-[10px] text-unjong-muted py-2">⏳</div>
      ) : items.length === 0 ? (
        <div className="text-center text-[10px] text-unjong-muted py-2">아직 종목별 채팅이 없습니다</div>
      ) : (
        <ul className="space-y-1">
          {items.map((room) => (
            <li key={room.symbol}>
              <Link
                href={`/stock/${room.symbol}`}
                className="flex items-center justify-between text-xs py-1 px-2 hover:bg-unjong-background rounded"
              >
                <span className="font-mono text-unjong-primary">{room.symbol}</span>
                <span className="flex items-center gap-1 text-[10px] text-unjong-muted">
                  <MessageCircle size={10} /> {room.message_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

### [2] dashboard 통째 삭제

```bash
rm -rf app/dashboard
```

### [3] V3 12개 페이지 삭제

```bash
rm -rf app/briefing
rm -rf app/analysis
rm -rf app/chat
rm -rf app/chart
rm -rf app/orderbook
rm -rf app/ticks
rm -rf app/disclosures
rm -rf app/investor-flow
rm -rf app/movers
rm -rf app/net-buy
rm -rf app/news
rm -rf app/themes
rm -rf app/market-map
```

### [4] V3 컴포넌트 통째 삭제

```bash
rm -rf components/home
rm -rf components/widgets
rm -rf components/chat
```

(주의: components/chat 안에 FloatingChat.tsx 만 있는지 grep 확인. 다른 컴포넌트 있으면 보존)

### [5] V3 잔재 API 정리 (검토 후)

다음 API endpoint 들이 V3 페이지에서만 사용됐다면 삭제:

```bash
# 검증 후 삭제 결정 — grep 으로 확인 후
ls app/api/home/  # briefing, sectors, disclosures, news, investor-flow, global
ls app/api/ecos/  # 사용 검토
ls app/api/sec/   # SEC EDGAR — UsCards 의 일부 카드가 사용? 검증
```

→ 명확히 V3 만 쓰던 거 (예: `app/api/home/*` 가 V3 HomeClient 전용이면) 삭제. V4·V5 가 쓰면 보존.

#### 검증 명령:
```bash
echo "=== /api/home 사용처 ==="
grep -rn "/api/home/" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next"
```

V4·V5 카드들은 `/api/kis/*`, `/api/dart/*`, `/api/yahoo/*` 사용 중. `/api/home/*` 가 V3 widgets 전용이면 삭제.

### [6] 잔재 import 확인

```bash
echo "=== 삭제 페이지로의 잔여 참조 ==="
for d in dashboard briefing analysis chat chart orderbook ticks disclosures investor-flow movers net-buy news themes market-map; do
  refs=$(grep -rn "href=\"/$d\"\|from .*components/widgets\|from .*components/home/\|from .*components/chat/" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l | tr -d ' ')
  [ "$refs" -gt "0" ] && echo "/$d → $refs 건"
done

echo "=== HomeClient·widgets·FloatingChat 잔재 ==="
grep -rn "HomeClient\|WidgetCard\|WidgetHeader\|FloatingChat" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next"
```

위 결과가 모두 0건이어야 함.

### [7] Footer.tsx 검토

`components/layout/Footer.tsx` 가 삭제된 페이지로의 링크 (예: /pricing, /admin) 가지면 정리:

```bash
grep -n "href=\"/" components/layout/Footer.tsx
```

V3 링크 제거.

### [8] 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

체크:
- TypeScript·ESLint 에러 0
- 라우트 맵에서 dashboard + V3 12개 페이지 사라짐
- 신규 / 라우트 생성됨

### [9] 4개 문서 헤더 날짜 갱신 + 로그

### [10] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(home): 새 홈 페이지 + V3 dashboard·12페이지·widgets 통째 청소

신규:
- app/page.tsx — / 가 새 홈 페이지 (이전: /kr redirect)
- components/home-v5/HomeClientV5.tsx — 3컬럼 (좌 채팅+활발한 채팅방 · 중 시장 핫 이슈 카드 4종+HOT 토론 · 우 관심종목)
- components/home-v5/HotDiscussionsModule.tsx — 24시간 좋아요 순 토론 TOP 10
- components/home-v5/HotChatRoomsModule.tsx — 24시간 메시지 많은 종목 TOP 5

손성기 디자이너 (네이버 페이 증권 홈 리뉴얼 2024) 인사이트 적용:
- '탐색의 출발점 가이드' 정체성
- 관심종목·시장 핫 이슈·HOT 토론·채팅 3컬럼 배치
- 70%+ 클릭 영역 (관심종목) 우측 sticky

삭제 (운종 V5 가 100% 대체):
- app/dashboard — V3 5섹션 통합 페이지
- app/briefing, analysis, chat, chart, orderbook, ticks, disclosures,
  investor-flow, movers, net-buy, news, themes, market-map — V3 12개 페이지
- components/home/HomeClient.tsx — V3 홈 통합
- components/widgets/* — V3 위젯 13개 (WatchlistWidget·BriefingWidget·
  NewsFeedWidget·SectorHeatmapWidget·DisclosureStreamWidget·등)
- components/chat/FloatingChat.tsx — V3 부동 채팅 (V5 는 좌측 ChatPanel)

이연 사항:
- components/layout/TopNav.tsx (고아) — 추후 정리
- app/api/home/* (V3 widgets 전용일 가능성) — grep 검증 후 결정
- app/mypage 의 구독·결제 탭 V3 잔재 (STEP 118 활성화 시 정리)

운종 V5 페이지 구조 최종:
- / : 새 홈 (운종의 출발점)
- /kr : 한국주식 카드 5개
- /us : 미국주식 카드 4개
- /stock/[code] : 종목 페이지 (좌 정보·중 토론·우 채팅)
- /screener : 종목발굴
- /calendar : 경제 캘린더
- /auth/login, /auth/callback : 카카오 OAuth (활성화 추후)
- /mypage : 마이페이지 (Layer 3 활성화 시 정리)
"
git push
```

## 검증 (사용자 안내용)

푸시 후 하드 리프레시:

1. `localhost:3333/` 접속 → **새 홈** (3컬럼: 채팅+토론·시장 핫 이슈·관심종목)
2. `localhost:3333/dashboard` → 404
3. `localhost:3333/briefing`, `/analysis`, `/chart`, `/news`, `/themes`, `/orderbook`, `/ticks`, `/chat`, `/disclosures`, `/investor-flow`, `/movers`, `/net-buy`, `/market-map` → 모두 404
4. `/kr`, `/us`, `/stock/005930`, `/screener`, `/calendar` → 정상
5. 좌측 채팅 + 우측 관심종목 + 중앙 카드 동작
6. HOT 토론 — STEP 115 에서 작성한 글이 있으면 표시 (현재 0건이라 안내 메시지)
7. 활발한 채팅방 — 종목별 채팅 메시지 있으면 표시

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ 라우트 맵에서 dashboard + V3 12개 사라짐
- ✅/❌ 삭제한 컴포넌트 import 0건
- ✅/❌ 새 홈 (`/`) 정상 렌더
- ✅/❌ 커밋 + 푸시

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| `/api/home/*` 가 V4·V5 코드에서 쓰임 | grep 후 보존 결정 |
| `next.config.ts` 의 `/scalper → /kr` redirect 가 / 와 충돌 | 새 홈 별도 path 라 영향 X |
| 새 홈에서 카드 4개 동시 로드로 KIS API 폭주 | 각 카드 자체 폴링 주기 (10~30초) 분산 |
| HomeClientV5 가 SSR 에서 채팅 hydration 깨질 가능성 | "use client" + suppressHydrationWarning 처리 |

## 다음 STEP

- **STEP 119** — Vercel 배포 + unjong.com 도메인 + 환경변수 설정
- 추후 — 카카오 OAuth 활성화 (STEP 118 잔여 사용자 작업)
- 추후 — 토론 좋아요/신고/댓글 onClick 구현
- 추후 — 미국 주식 종목 정보 (Yahoo) StockInfoPanel 통합
