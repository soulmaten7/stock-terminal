<!-- 2026-05-29 -->
# STEP 106 — Layer 1-B Supabase Realtime 채팅 실시간

> **목표**: 좌측 채팅창 더미 → Supabase Realtime 실시간 송수신. 단타·장타·미국주식창 채팅방 분리.
> **세션**: #27
> **전제**: 세션 #26 종료 (`0ad3c52`), 21개 카드 100% 실데이터
> **참조**: `components/sidebar/ChatPanel.tsx`, Supabase 인프라

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_106_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **3창 채팅방 분리** — room 컬럼 (`scalper` / `longterm` / `us`)
2. **Realtime postgres_changes 활용** — INSERT 감지 → 자동 갱신
3. **닉네임 간단** — localStorage 익명 (Layer 4 에서 점수제 추가)
4. **과거 메시지 100건 로드** — 마운트 시 최근 메시지 가져옴
5. **입력박스 활성화** — disabled 제거, Enter 키로 전송
6. **DB 마이그레이션은 사용자가 Supabase Dashboard 에서 실행** — 안전성 우선

---

## 작업 1 — Supabase 인프라 진단

```bash
cd ~/stock-terminal
echo "=== Supabase 클라이언트 위치 ===" && find lib -name "supabase*" 2>/dev/null && find utils -name "supabase*" 2>/dev/null
echo "=== 기존 마이그레이션 ===" && ls supabase/migrations 2>/dev/null
echo "=== package.json supabase ===" && grep "supabase" package.json
echo "=== .env.local 키 (값은 표시 X) ===" && grep -o "^[A-Z_]*SUPABASE[A-Z_]*" .env.local 2>/dev/null
```

확인:
- Supabase 클라이언트 패턴 (server vs client)
- 기존 마이그레이션 파일 번호
- `@supabase/ssr` 또는 `@supabase/supabase-js` 사용 패턴
- 환경변수 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

## 작업 2 — Supabase 마이그레이션 파일 신설

### 새 파일: `supabase/migrations/{NEXT_NUMBER}_chat_messages.sql`

기존 마이그레이션 번호 확인 후 +1 (예: `002_chat_messages.sql`)

```sql
-- chat_messages 테이블 신설 (단타·장타·미국주식 채팅 분리)

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL CHECK (room IN ('scalper', 'longterm', 'us')),
  nickname TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: room + created_at 기준 빠른 조회
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON chat_messages (room, created_at DESC);

-- RLS 활성화
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 모두 읽기 가능
DROP POLICY IF EXISTS "Anyone can read messages" ON chat_messages;
CREATE POLICY "Anyone can read messages" ON chat_messages
  FOR SELECT USING (true);

-- 모두 쓰기 가능 (Layer 4 에서 인증 강화)
DROP POLICY IF EXISTS "Anyone can insert messages" ON chat_messages;
CREATE POLICY "Anyone can insert messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Realtime publication 추가
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

⚠️ 마지막 줄 `ALTER PUBLICATION` 이 이미 추가되어 있으면 에러. 그 경우:
```sql
-- 이미 존재하면 무시
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

---

## 작업 3 — 사용자 안내 (Supabase Dashboard 에서 SQL 실행)

이 SQL 은 Supabase Dashboard 의 SQL Editor 에서 실행. Claude Code 가 자동 실행 X (안전성).

명령서 끝에 사용자 안내 메시지 명시:
> 1. https://supabase.com/dashboard 접속
> 2. 운종 프로젝트 (구 stock-platform) 선택
> 3. SQL Editor → New query
> 4. `supabase/migrations/00X_chat_messages.sql` 파일 내용 복붙 + Run
> 5. Realtime 활성화 확인: Database → Replication → `chat_messages` 토글 ON

---

## 작업 4 — 닉네임 store 신설

### 새 파일: `stores/nicknameStore.ts`

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Store = {
  nickname: string;
  setNickname: (n: string) => void;
};

// 첫 방문 시 자동 생성 ("트레이더-XXXX")
function generateNickname(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `트레이더-${num}`;
}

export const useNickname = create<Store>()(
  persist(
    (set) => ({
      nickname: generateNickname(),
      setNickname: (n) => set({ nickname: n }),
    }),
    {
      name: "unjong-nickname",
    }
  )
);
```

---

## 작업 5 — `components/sidebar/ChatPanel.tsx` 재작성

기존 더미 메시지 제거 + Supabase Realtime 실시간 송수신.

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useNickname } from "@/stores/nicknameStore";

type ChatMessage = {
  id: string;
  room: string;
  nickname: string;
  message: string;
  created_at: string;
};

// Supabase 클라이언트 (브라우저)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ROOM_META: Record<string, { window: string; emoji: string }> = {
  "/scalper": { window: "단타창", emoji: "⚡" },
  "/longterm": { window: "장타창", emoji: "🌳" },
  "/us": { window: "미국주식창", emoji: "🌙" },
};

function getRoomKey(pathname: string | null): "scalper" | "longterm" | "us" {
  if (pathname?.startsWith("/longterm")) return "longterm";
  if (pathname?.startsWith("/us")) return "us";
  return "scalper";
}

export function ChatPanel() {
  const pathname = usePathname();
  const room = getRoomKey(pathname);
  const ctx = ROOM_META[`/${room}`] ?? ROOM_META["/scalper"];

  const nickname = useNickname((s) => s.nickname);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 마운트 시 과거 메시지 로드 (room 변경 시 재실행)
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room", room)
        .order("created_at", { ascending: false })
        .limit(100);

      if (mounted) {
        if (!error && data) {
          // DESC 로 가져왔으니 reverse 해서 오래된 → 최신 순
          setMessages([...data].reverse());
        }
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [room]);

  // 2. Realtime subscribe (room 변경 시 재구독)
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${room}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room=eq.${room}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // 중복 방지 (이미 있으면 무시)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  // 3. 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 4. 메시지 전송
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      room,
      nickname,
      message: trimmed,
    });

    if (!error) {
      setInput("");
    } else {
      console.warn("[chat] send failed", error.message);
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-unjong-surface">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{ctx.emoji}</span>
          <span className="text-sm font-semibold text-unjong-primary">
            {ctx.window} 채팅
          </span>
        </div>
        <span className="text-[10px] text-unjong-muted truncate ml-2" title={nickname}>
          {nickname}
        </span>
      </div>

      {/* 메시지 영역 (스크롤) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0"
      >
        {loading ? (
          <div className="text-center text-[10px] text-unjong-muted italic py-4">
            ⏳ 채팅 로딩 중...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[10px] text-unjong-muted italic py-4">
            첫 메시지를 남겨보세요. {ctx.window} 트레이더와 대화 시작.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-unjong-primary">
                  {msg.nickname}
                </span>
                <span className="text-[10px] text-unjong-muted">
                  {formatTime(msg.created_at)}
                </span>
              </div>
              <p className="text-xs text-unjong-primary leading-snug pl-1">
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 입력창 (고정 크기) */}
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${ctx.window}에 메시지...`}
            maxLength={500}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            aria-label="채팅 입력"
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}
```

⚠️ 기존 DUMMY_MESSAGES const 삭제.
⚠️ Supabase 클라이언트는 모듈 레벨에서 한 번만 생성 (singleton).
⚠️ `process.env.NEXT_PUBLIC_*` 는 빌드 시 인라인. 클라이언트 사용 가능.

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- ChatPanel.tsx 정상 컴파일
- `@supabase/supabase-js` import 정상
- TypeScript 오류 0

---

## 작업 7 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add supabase/migrations
git add stores/nicknameStore.ts
git add components/sidebar/ChatPanel.tsx
git add docs/STEP_106_COMMAND.md
git status
git commit -m "feat: STEP 106 - Layer 1-B Supabase Realtime 채팅 실시간

DB:
- supabase/migrations/00X_chat_messages.sql 신설
  · chat_messages 테이블 (room/nickname/message/created_at)
  · room CHECK ('scalper' | 'longterm' | 'us')
  · 메시지 길이 1~500자 제약
  · RLS: 읽기·쓰기 모두 허용 (Layer 4 강화 예정)
  · Realtime publication 추가
  · 인덱스: (room, created_at DESC)

Store:
- stores/nicknameStore.ts 신설
  · Zustand persist (localStorage)
  · 첫 방문 시 '트레이더-XXXX' 자동 생성

ChatPanel:
- 더미 DUMMY_MESSAGES 제거
- usePathname 으로 room 자동 결정
- 마운트 시 과거 메시지 100건 로드 (DESC → reverse)
- Realtime postgres_changes subscribe (room 필터)
- 입력박스 활성화 — Enter 키로 전송
- 자동 스크롤 (새 메시지 도착 시)
- 닉네임 헤더 우측 표시

사용자 안내:
- Supabase Dashboard 에서 마이그레이션 SQL 실행 필수
- Realtime publication 활성화 확인 (Database → Replication)

다음: 세션 #27 진행 또는 Layer 1-B 후속 (모더레이션·신고 — Layer 4)"
git push
```

---

## 검증 체크리스트

- [ ] `supabase/migrations/00X_chat_messages.sql` 신설
- [ ] `stores/nicknameStore.ts` 신설 (Zustand persist)
- [ ] `ChatPanel.tsx` Supabase Realtime 적용
- [ ] DUMMY_MESSAGES 제거
- [ ] 입력박스 disabled 제거, Enter 전송
- [ ] 자동 스크롤 작동
- [ ] 빌드 클린, git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 106 완료. Layer 1-B Supabase Realtime 채팅 끝.

신규 파일:
- supabase/migrations/00X_chat_messages.sql
- stores/nicknameStore.ts

변경:
- components/sidebar/ChatPanel.tsx 전면 재작성
  · 더미 → Supabase Realtime 실시간
  · 과거 메시지 100건 로드
  · postgres_changes subscribe (room 필터)
  · Enter 전송, 자동 스크롤
  · 닉네임: 트레이더-XXXX 자동 생성 (localStorage)

빌드 클린, git push 완료 (커밋 [해시])

⚠️ 다음 단계 — 사용자가 직접 실행:
1. https://supabase.com/dashboard 접속
2. 운종 프로젝트 (구 stock-platform) 선택
3. SQL Editor → New query
4. supabase/migrations/00X_chat_messages.sql 파일 내용 복붙 → Run
5. Database → Replication → chat_messages 토글 ON
6. 브라우저에서 http://localhost:3333/scalper 채팅 테스트
   · 메시지 입력 → Enter → 자동 전송
   · 다른 브라우저 탭/창에서 실시간 수신 확인
```

---

## ⚠️ 주의 사항

1. **DB 마이그레이션 자동 실행 X** — Claude Code 가 Supabase Dashboard 접근 못함. 사용자가 직접 SQL Editor 실행
2. **Realtime publication 활성화 필수** — Dashboard 의 Database → Replication 에서 토글 ON 안 하면 INSERT 감지 안 됨
3. **닉네임 익명** — 사용자 인증 없음. Layer 4 에서 점수제 + 누적 정확도 추가
4. **메시지 길이 500자** — DB CHECK 제약. 길이 초과 시 INSERT 실패
5. **room 자동 결정** — `usePathname()` 기반. `/scalper` → scalper, `/longterm` → longterm, `/us` → us
6. **3개 디테일 페이지** — `/scalper/movers` 같은 디테일 페이지에서도 ChatPanel 작동 (room=scalper)
7. **Supabase 클라이언트 singleton** — 모듈 레벨에서 한 번만 생성
8. **console.log 남기지 말 것** — console.warn 은 에러 디버깅 용이라 OK
