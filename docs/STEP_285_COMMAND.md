<!-- 2026-06-20 -->
# STEP 285 — [V7 ③] 유튜브 Top100 표시 (유튜브 탭)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_285_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 284(`0158d9a` 이후 티커 커밋). 빌드 ✓.
- **사전 작업(완료, DB 직접)**: `youtube_channels` 테이블 생성 + 한국 주식 유튜브 Top100 적재 끝(2026년 6월 3주차, 구독자 1만↑, 코인·부동산·골프 블랙리스트 필터). git 변경 아님 — DB에 이미 있음.
- **설계 근거**: `docs/PRODUCT_SPEC_V7.md` ③ 유튜브 Top100.

---

## 🎯 목표

게이트웨이 **유튜브 탭**의 "준비 중" 자리를 **실제 한국 주식 유튜브 Top100 랭킹**으로 교체.
- 순위 · 채널 썸네일 · 채널명 · 구독자수(만 단위) · 채널 바로가기
- 상단에 주차 라벨("2026년 6월 3주차 · 구독자순 · 매주 갱신")
- 한국 탭만 표시(미국은 "준비 중" 유지)

> 데이터는 이미 DB에 있음 → 조회 + 표시만. 3개 파일.

---

## 📄 파일 1 (신규 생성) — `components/toolbox/YoutubeRanking.tsx`

```tsx
'use client';

import { ExternalLink } from 'lucide-react';

export type YtChannel = {
  rank: number;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  channel_url: string;
  week_label: string | null;
};

function fmtSubs(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)}만`;
  return n.toLocaleString();
}

export default function YoutubeRanking({ channels }: { channels: YtChannel[] }) {
  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-2 text-2xl">📺</span>
        <p className="text-sm font-medium text-unjong-primary">유튜브 Top100 — 데이터 준비 중</p>
        <p className="mt-1 text-xs text-unjong-muted">곧 채워집니다</p>
      </div>
    );
  }
  const week = channels[0]?.week_label ?? '';
  return (
    <section className="min-w-0">
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">한국 주식 유튜브 Top 100</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">{week} · 구독자순 · 매주 갱신</p>
      </div>
      <ol className="grid grid-cols-1 gap-0.5">
        {channels.map((c) => (
          <li key={c.rank}>
            <a
              href={c.channel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-unjong-background"
            >
              <span className={`w-6 shrink-0 text-center text-sm font-bold ${c.rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>{c.rank}</span>
              {c.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail_url}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                />
              ) : (
                <span className="h-7 w-7 shrink-0 rounded-full bg-unjong-background" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{c.title}</span>
              <span className="shrink-0 text-xs font-bold text-unjong-accent">{fmtSubs(c.subscriber_count)}</span>
              <span className="hidden shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors group-hover:border-unjong-accent group-hover:bg-unjong-background group-hover:text-unjong-accent sm:flex">
                채널
                <ExternalLink size={11} />
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

---

## 📄 파일 2 — `app/page.tsx` (youtube_channels 조회 + prop 전달)

### (2-A) 링크 조회 밑에 유튜브 조회 추가
**찾기:**
```tsx
  const { data: links } = await supabase
    .from("link_hub")
    .select("id, country, category, site_name, site_url, description, logo_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
```
**바꾸기:**
```tsx
  const { data: links } = await supabase
    .from("link_hub")
    .select("id, country, category, site_name, site_url, description, logo_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: ytRows } = await supabase
    .from("youtube_channels")
    .select("rank, title, thumbnail_url, subscriber_count, channel_url, week_label")
    .eq("country", "KR")
    .order("rank", { ascending: true });
  const youtubeChannels = ytRows ?? [];
```

### (2-B) ToolboxClient에 prop 전달
**찾기:**
```tsx
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
```
**바꾸기:**
```tsx
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} youtubeChannels={youtubeChannels} />
```

---

## 📄 파일 3 — `components/toolbox/ToolboxClient.tsx` (유튜브 탭 = 랭킹)

### (3-A) import 추가
**찾기:**
```tsx
import LinkCard, { type LinkItem } from './LinkCard';
import BrokerRanking from './BrokerRanking';
```
**바꾸기:**
```tsx
import LinkCard, { type LinkItem } from './LinkCard';
import BrokerRanking from './BrokerRanking';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
```

### (3-B) props에 youtubeChannels 추가
**찾기:**
```tsx
export default function ToolboxClient({
  initialCategories,
  isLoggedIn,
}: {
  initialCategories: Category[];
  isLoggedIn: boolean;
}) {
```
**바꾸기:**
```tsx
export default function ToolboxClient({
  initialCategories,
  isLoggedIn,
  youtubeChannels,
}: {
  initialCategories: Category[];
  isLoggedIn: boolean;
  youtubeChannels: YtChannel[];
}) {
```

### (3-C) 유튜브 탭 렌더 — Placeholder → YoutubeRanking(한국만)
**찾기:**
```tsx
        {activeTab === 'youtube' ? (
          <Placeholder emoji="📺" title="유튜브 Top100 — 준비 중" desc="주간 구독자순 한국 주식 유튜브 (자동 갱신 예정)" />
        ) : activeTab === 'room' ? (
```
**바꾸기:**
```tsx
        {activeTab === 'youtube' ? (
          country === 'KR' ? (
            <YoutubeRanking channels={youtubeChannels} />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 주식 유튜브 — 준비 중" />
          )
        ) : activeTab === 'room' ? (
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 홈 → **유튜브 탭** 클릭 → "한국 주식 유튜브 Top 100" 랭킹.
2. 1위 **슈카월드**, 2위 **삼프로TV**, 3위 **한국경제TV** … 순서 + 구독자수(371만 등) + 썸네일.
3. 채널 클릭 → 새 탭으로 유튜브 채널 열림.
4. **미국 토글** → 유튜브 탭은 "미국 주식 유튜브 — 준비 중".

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 유튜브 Top100 랭킹 표시 (유튜브 탭, 구독자순·주차라벨) (V7 ③, STEP 285)" && git push
```

---

> **한 줄 요약**: DB에 적재된 한국 주식 유튜브 Top100을 유튜브 탭에 랭킹(순위·썸네일·구독자수·채널링크)으로 표시. 주간 자동갱신은 다음 STEP(286).
