# STEP 77 — 플로팅 채팅 전환 (인라인 ChatWidget 제거)

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 76 완료 — Section 2 추가 완료.

**목표:**
기존 대시보드 어딘가에 인라인으로 붙어 있는 `ChatWidget` 을 제거하고, **전역 플로팅 채팅**으로 전환.
- 3상태 토글: **닫힘(56×56 FAB)** ↔ **최소화(240×40 바)** ↔ **열림(320×440 패널)**
- 모든 페이지 공통 — `app/layout.tsx` 에 마운트.
- 위치/최소화 상태 localStorage 지속.

**범위 제한:**
- 기존 채팅 메시지 스토어(`chatStore` 등) **수정 금지** — UI 래퍼만 교체.
- 드래그 이동은 **선택적** — 시간 되면 구현, 아니면 우하단 고정.
- 사운드/알림 음성 추가 금지.

---

## 작업 0 — 현재 ChatWidget 위치 파악

```bash
# 1) ChatWidget 파일 위치
find components -name "ChatWidget*" -o -name "Chat*.tsx" -type f 2>/dev/null | head

# 2) 어디서 import 되고 있는지
grep -rln "ChatWidget" app/ components/ --include="*.tsx" 2>/dev/null

# 3) 채팅 스토어 확인
find stores -name "chat*" -o -name "*Chat*" -type f 2>/dev/null
```

보고: ChatWidget 파일 경로, 현재 마운트 위치, 스토어 존재 여부.

---

## 작업 1 — `FloatingChat.tsx` 신규 작성

`components/chat/FloatingChat.tsx` 생성 (기존 `ChatWidget.tsx` 내용 일부 재활용):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Minus, X, Send } from 'lucide-react';
// 기존 채팅 메시지 렌더/입력 로직은 기존 ChatWidget 에서 가져올 것

type ChatState = 'closed' | 'minimized' | 'open';

const STORAGE_KEY = 'floating-chat-state';

export default function FloatingChat() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<ChatState>('closed');
  const [unread, setUnread] = useState(0);

  // 초기화 — localStorage 복원
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'minimized' || saved === 'open' || saved === 'closed') {
        setState(saved);
      }
    } catch {}
  }, []);

  // 상태 변경 시 저장
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, state);
    } catch {}
    if (state === 'open') setUnread(0);
  }, [state, mounted]);

  if (!mounted) return null;

  // 닫힘 — FAB
  if (state === 'closed') {
    return (
      <button
        onClick={() => setState('open')}
        aria-label="채팅 열기"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0ABAB5] text-white shadow-lg flex items-center justify-center hover:bg-[#089693] transition"
      >
        <MessageCircle className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF4D4D] text-white text-xs flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    );
  }

  // 최소화 — 바
  if (state === 'minimized') {
    return (
      <div className="fixed bottom-6 right-6 z-40 w-60 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-between px-3">
        <button
          onClick={() => setState('open')}
          className="flex items-center gap-2 text-sm text-[#222]"
        >
          <MessageCircle className="w-4 h-4 text-[#0ABAB5]" />
          채팅 {unread > 0 && <span className="text-[#FF4D4D]">({unread})</span>}
        </button>
        <button
          onClick={() => setState('closed')}
          aria-label="닫기"
          className="text-[#999] hover:text-[#222]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 열림 — 패널
  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 h-[440px] rounded-lg bg-white border border-[#E5E7EB] shadow-xl flex flex-col">
      {/* 헤더 */}
      <div className="h-10 border-b border-[#E5E7EB] flex items-center justify-between px-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#222]">
          <MessageCircle className="w-4 h-4 text-[#0ABAB5]" />
          채팅
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setState('minimized')}
            aria-label="최소화"
            className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-black hover:bg-[#F3F4F6] rounded"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setState('closed')}
            aria-label="닫기"
            className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-black hover:bg-[#F3F4F6] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 메시지 영역 + 입력 — 기존 ChatWidget 내부에서 복사 */}
      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {/* TODO: 기존 ChatWidget 의 MessageList 를 여기로 이동 */}
        <div className="text-[#999] text-center mt-10">채팅 기능 준비 중</div>
      </div>
      <div className="h-12 border-t border-[#E5E7EB] p-2 flex items-center gap-2">
        <input
          type="text"
          placeholder="메시지 입력..."
          className="flex-1 h-8 px-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0ABAB5]"
        />
        <button
          aria-label="보내기"
          className="w-8 h-8 flex items-center justify-center text-white bg-[#0ABAB5] rounded hover:bg-[#089693]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**주의:**
- 기존 `ChatWidget.tsx` 의 메시지 리스트 + 입력 핸들러 로직이 이미 있으면 `FloatingChat` 내부로 복사해서 재사용.
- 기존 스토어(`chatStore`) 호출 코드는 그대로 유지.

---

## 작업 2 — `app/layout.tsx` 에 전역 마운트

`app/layout.tsx` 의 `<body>` 하단 (또는 `{children}` 바로 뒤) 에:

```tsx
import FloatingChat from '@/components/chat/FloatingChat';

// ...
<body>
  {children}
  <FloatingChat />
</body>
```

- `'use client'` 래퍼 필요시 별도 클라이언트 컴포넌트로 감싸기.
- 로그인/랜딩 페이지에서도 표시할지 여부는 이번 STEP 에서 **전역 표시**로 단순화 (제외 필요시 다음 STEP).

---

## 작업 3 — 인라인 ChatWidget 제거

작업 0 보고에서 찾은 마운트 위치 전부 제거:

```tsx
// 기존 — 아래 2줄 삭제
// import ChatWidget from '@/components/chat/ChatWidget';
// <ChatWidget />
```

- 보통 `HomeClient.tsx` 하단, `app/(dashboard)/layout.tsx`, `components/Layout.tsx` 등에 있을 가능성.
- 전부 제거 후 빌드 에러 없는지 확인.

---

## 작업 4 — 미읽음 카운트 연동 (선택)

기존 채팅 스토어에 새 메시지 이벤트가 있으면 `setUnread(n)` 호출.

```ts
// chatStore 에 unread 카운터가 있으면
const unread = useChatStore((s) => s.unreadCount);
```

없으면 TODO 유지하고 일단 `unread=0` 하드코드.

---

## 작업 5 — 빌드 + 문서 + push

```bash
npm run build
```

문서 4개 갱신 + CHANGELOG:
```
- feat(chat): 인라인 ChatWidget → 전역 FloatingChat 전환 (3상태: 닫힘/최소화/열림) (STEP 77)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(chat): 인라인 → 플로팅 전역 채팅 전환 (STEP 77)

- FloatingChat.tsx 신규 (3상태: 56×56 FAB, 240×40 바, 320×440 패널)
- app/layout.tsx 전역 마운트
- 기존 인라인 ChatWidget 제거
- localStorage floating-chat-state 지속성
- 미읽음 배지 자리 (기존 스토어 연동 TODO 유지)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 77 완료
- FloatingChat.tsx 신규 (3상태 전환)
- 전역 마운트: app/layout.tsx
- 인라인 ChatWidget 제거: <제거된 파일 목록>
- 미읽음 배지: <연동/TODO>
- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **기존 채팅 로직 보존** — 메시지 스토어, 소켓 연결, 사용자 세션 연동 코드는 절대 수정 금지. UI 래퍼만 교체.
- **z-index 충돌** — StockDetailToggle FAB(`z-40`) 와 겹칠 수 있음. FloatingChat 도 `z-40`. 화면 우하단 같은 위치면 StockDetailToggle 를 `bottom-24 right-6` 로 이동시켜 겹치지 않게.
- **SSR hydration** — FloatingChat 은 `mounted` 가드 필수. localStorage 는 서버에 없음.
- **닫힘 상태 디폴트** — 초기 방문자에게는 `closed` 디폴트. 이전에 열어둔 사용자만 `open/minimized` 복원.
