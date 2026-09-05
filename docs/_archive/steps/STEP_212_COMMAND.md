<!-- 2026-06-07 -->
# STEP 212 — 홈 실시간채팅 (우측 레일 위 반화면 + 아래 관심종목)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_212_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
홈 우측 레일을 **[위=실시간채팅(~반 화면) / 아래=관심종목]**으로.
- 이름은 그냥 **'실시간채팅'**.
- 전체(장중) 채팅 — 기존 `chat_messages` 테이블 + Supabase realtime 재활용. **방 키 `symbol="HOME"`**(종목 채팅과 분리). DB 변경 0.
- 빈 상태: "첫 메시지를 남겨보세요 · 장 보면서 편하게 얘기해요"(죽은 느낌 방지).

## 전제 상태
- HEAD: STEP 211 상태
- 변경: `components/home-v6/HomeLiveChat.tsx`(신규) + `components/home-v6/HomeRightRail.tsx`(전면 교체)
- 참고: `chat_messages` = id, symbol, room, nickname, content, created_at, hidden (StockChatPanel과 동일). 닉네임 = `useNickname` 스토어.

---

## 작업 1/2 — 신규 `components/home-v6/HomeLiveChat.tsx` (파일 생성)

```tsx
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useNickname } from "@/stores/nicknameStore";
import { LoadingState, EmptyState } from "@/components/ui/State";

type ChatMessage = { id: string; nickname: string; content: string; created_at: string };

const ROOM = "HOME";

export default function HomeLiveChat() {
  const nickname = useNickname((s) => s.nickname);
  const ensureNickname = useNickname((s) => s.ensureNickname);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); ensureNickname(); }, [ensureNickname]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data, error } = await supabase
          .from("chat_messages")
          .select("id, nickname, content, created_at")
          .eq("symbol", ROOM)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(100);
        if (alive && !error && data) setMessages([...data].reverse() as ChatMessage[]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const supabase = createAnonClient();
    const channel = supabase
      .channel(`chat-${ROOM}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `symbol=eq.${ROOM}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const msg = payload.new as ChatMessage;
          if (!msg?.id) return;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("chat_messages").insert({
      symbol: ROOM,
      room: "general",
      nickname: nickname || "익명",
      content: trimmed,
    });
    if (!error) setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-[46vh] flex-col overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <header className="flex shrink-0 items-center justify-between border-b border-unjong-border bg-unjong-background px-4 py-3">
        <span className="text-sm font-semibold text-unjong-primary">⚡ 실시간채팅</span>
        <span className="ml-2 truncate text-xs text-unjong-muted" suppressHydrationWarning>{mounted ? nickname : ""}</span>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {loading ? (
          <LoadingState />
        ) : messages.length === 0 ? (
          <EmptyState icon="💬" title="첫 메시지를 남겨보세요" description="장 보면서 편하게 얘기해요." />
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-unjong-primary">{msg.nickname}</span>
                <span className="text-xs text-unjong-muted">
                  {new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              <p className="pl-1 text-sm text-unjong-primary">{msg.content}</p>
            </div>
          ))
        )}
      </div>
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
    </div>
  );
}
```

## 작업 2/2 — `components/home-v6/HomeRightRail.tsx` (파일 전체 교체)

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
    <aside className="sticky top-5 hidden h-[calc(100vh-6rem)] gap-3 self-start lg:flex">
      {/* 위=실시간채팅(~반화면) / 아래=관심종목 */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <HomeLiveChat />
        <div className="min-h-0 flex-1 overflow-hidden">
          <WatchlistPanel />
        </div>
      </div>

      {/* 오른쪽 끝 세로 아이콘 탭 (토스식) */}
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-5 rounded-2xl border border-unjong-border bg-unjong-surface py-4 shadow-soft"
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

> 우측 레일 = [실시간채팅 46vh] + [관심종목 나머지] + [세로 아이콘 탭]. 채팅은 `chat_messages` HOME방, realtime.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeLiveChat.tsx components/home-v6/HomeRightRail.tsx && git commit -m "feat(v7): 홈 실시간채팅 — 우측 레일 위(반화면) 전체 채팅(chat_messages HOME방)+아래 관심종목 (STEP 212)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 우측 **위쪽에 '⚡ 실시간채팅'**(반 화면), **아래에 관심종목**
- [ ] 메시지 입력·전송되고 **새로고침 없이 실시간**으로 뜨는지(두 탭으로 테스트)
- [ ] 비어 있을 때 "첫 메시지를 남겨보세요" 안내
- [ ] 종목 상세의 종목 채팅과 **섞이지 않는지**(HOME방 분리)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- DB 변경 없음 — `chat_messages`에 `symbol="HOME"`로 저장(종목 채팅 RLS·insert 패턴 동일).
- 관심종목 높이가 어색하면 채팅 `h-[46vh]` 숫자만 조절.
- 신규라 초반엔 비어 있음 — 정상(빈 상태 안내). 트래픽 붙으면 살아남.
- **문서 TODO**(다음 갱신): STEP 212.

---
> STEP 212 = 홈 실시간채팅. 전제 STEP 211. 문서 묶어 갱신.
