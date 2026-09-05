<!-- 2026-06-07 -->
# STEP 213 — 채팅 입력창 강조 + 우측 레일 고정 해제 + 관심종목 색버그

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_213_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시 + 버그)
1. **채팅 입력창**: 하단 회색 배경 슬랩 제거 → 입력칸 자체를 라운드 + 옅은 채움 + 포커스 강조로 '입력창'답게.
2. **우측 레일 고정(sticky) 해제** → 그냥 그 자리. 페이지 스크롤하면 **관심종목이 페이지 길이만큼 길게**(그리드 stretch). WatchlistPanel 구조는 안 건드림(3곳 공용).
3. 🐛 **관심종목 등락률 색버그** — STEP 208과 같은 sed 잔재(상승·하락 둘 다 파랑) → 상승=빨강.

## 전제 상태
- HEAD: STEP 212 상태
- 변경: `components/home-v6/HomeLiveChat.tsx`(입력영역) · `components/home-v6/HomeRightRail.tsx`(전면 교체) · `components/sidebar/WatchlistPanel.tsx`(1곳)

---

## 작업 1/3 — `HomeLiveChat.tsx` 입력영역 (회색 제거 + 강조)

**찾기:**
```tsx
      <div className="shrink-0 border-t border-unjong-border bg-unjong-background p-2">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="실시간채팅..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled={sending}
          />
          <button type="button" onClick={sendMessage} disabled={sending || !input.trim()} className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50">
            <Send size={14} />
          </button>
        </div>
      </div>
```
**바꾸기:**
```tsx
      <div className="shrink-0 border-t border-unjong-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-unjong-border bg-unjong-background px-3 py-2 transition-colors focus-within:border-unjong-accent">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="실시간채팅 메시지 입력..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled={sending}
          />
          <button type="button" onClick={sendMessage} disabled={sending || !input.trim()} className="shrink-0 text-unjong-muted hover:text-unjong-accent disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
```

## 작업 2/3 — `HomeRightRail.tsx` (파일 전체 교체 — 고정 해제)

```tsx
"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import HomeLiveChat from "./HomeLiveChat";

export default function HomeRightRail() {
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심", href: "/" },
    { icon: Briefcase, label: "보유", href: "/mypage" },
    { icon: Clock, label: "최근", href: "/" },
  ];
  return (
    <aside className="hidden gap-3 lg:flex">
      {/* 위=실시간채팅(고정 아님) / 아래=관심종목(페이지 길이만큼 길게) */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <HomeLiveChat />
        <div className="min-h-0 flex-1 overflow-hidden">
          <WatchlistPanel />
        </div>
      </div>

      {/* 오른쪽 끝 세로 아이콘 탭 (상단 정렬) */}
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-5 self-start rounded-2xl border border-unjong-border bg-unjong-surface py-4 shadow-soft"
        aria-label="우측 바로가기"
      >
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              href={n.href}
              title={n.label}
              className="flex flex-col items-center gap-1 text-unjong-muted transition-colors hover:text-unjong-primary"
            >
              <Icon size={18} />
              <span className="text-[9px]">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

> `sticky top-5 h-[calc(100vh-6rem)] self-start` 제거 → 그리드 stretch로 우측 칼럼이 왼쪽(랭킹) 높이만큼 늘어남 → 채팅(46vh) 밑 관심종목이 페이지 길이만큼 길게, 고정 안 됨. 아이콘 탭만 `self-start`로 위 정렬.

## 작업 3/3 — `WatchlistPanel.tsx` 등락률 색버그 (상승=빨강)

**찾기:**
```tsx
                      <span className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${isUp ? "text-[#3182F6]" : "text-[#3182F6]"}`}>
```
**바꾸기:**
```tsx
                      <span className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${isUp ? "text-[#F04452]" : "text-[#3182F6]"}`}>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeLiveChat.tsx components/home-v6/HomeRightRail.tsx components/sidebar/WatchlistPanel.tsx && git commit -m "fix(v7): 홈 채팅 입력창 강조(회색 슬랩 제거)+우측 레일 고정 해제(관심종목 페이지 길이)+관심종목 등락색 버그 (STEP 213)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 채팅 하단 **회색 슬랩 사라지고**, 입력칸이 라운드+옅은 채움, 클릭 시 테두리 강조(focus)
- [ ] 우측 레일이 **스크롤 따라다니지 않음**(고정 해제), 관심종목이 페이지 따라 **길게**
- [ ] 관심종목 **상승 종목 빨강·하락 파랑**(둘 다 파랑이던 버그 수정)
- [ ] (windows)·home-v5 등 다른 곳 WatchlistPanel 깨지지 않음(구조 안 건드림)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 관심종목이 페이지(왼쪽 랭킹) 높이만큼 늘어나며, 종목 적으면 박스 아래 여백 생길 수 있음(정상). 너무 길면 채팅 `h-[46vh]`/구조 조절.
- WatchlistPanel은 색 한 줄만 수정(구조 유지) → 3곳 공용 안전.
- **문서 TODO**(다음 갱신): STEP 212~213.

---
> STEP 213 = 채팅 입력 강조·레일 고정해제·관심종목 색버그. 전제 STEP 212. 문서 묶어 갱신.
