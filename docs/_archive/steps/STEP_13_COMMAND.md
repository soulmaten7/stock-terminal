# STEP 13 — 마켓채팅 참여자 팝업 **위치 수정** (채팅창 내부로 한정)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 12 완료 (commit `10d9b77`)

**목표:** 참여자 팝업이 현재 **화면 전체를 덮고 있음**. 이를 **채팅창 영역 안에만** 떠서 나머지 대시보드(차트·호가·글로벌지수 등)는 그대로 보이도록 수정.

---

## ❌ 현재 잘못된 동작
- 버튼 클릭 시 `fixed inset-0 bg-black/40 backdrop-blur-sm` 로 **전체 화면에 어두운 배경 + 중앙 팝업** 표시
- 채팅창 외 다른 위젯들도 어두워져서 안 보임

## ✅ 원하는 동작
- 버튼 클릭 시 **채팅창 영역 내부에만** 참여자 리스트 패널 오버레이
- 배경 dim/blur 없음 (또는 채팅창 안쪽만)
- 다른 위젯(차트, 호가, 글로벌지수 등)은 정상적으로 보이고 인터랙션 가능

---

## 🔧 파일별 변경사항

### 1. `components/widgets/ChatParticipantsModal.tsx` — 풀스크린 → 부모 내부 오버레이
**변경:** `fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center` → `absolute inset-0 z-20 flex`. 배경 dim 제거. 카드 크기 `w-[320px] h-[600px]` → `w-full h-full` (채팅창 자체 사이즈와 동일).

**전체 교체:**

```tsx
'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export interface Participant {
  user_id: string;
  nickname: string;
  online_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
}

export default function ChatParticipantsModal({ open, onClose, participants }: Props) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-20 bg-white flex flex-col overflow-hidden rounded-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-participants-title"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] shrink-0">
        <div>
          <h3 id="chat-participants-title" className="text-lg font-bold text-black">
            채팅 참여자
          </h3>
          <p className="text-xs text-[#999999]">
            총 {participants.length}명 접속 중
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#BBBBBB] hover:text-black transition-colors p-1"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 참여자 목록 */}
      <div className="flex-1 overflow-y-auto">
        {participants.length === 0 ? (
          <div className="text-center text-sm text-[#999] py-8 px-4">
            현재 접속 중인 참여자가 없습니다.
            <br />
            <span className="text-xs text-[#BBBBBB]">
              로그인 후 채팅에 참여해보세요.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {participants.map((p) => {
              const time = (() => {
                try {
                  const d = new Date(p.online_at);
                  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                } catch {
                  return '';
                }
              })();
              return (
                <li
                  key={p.user_id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#0ABAB5]">
                      {p.nickname.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{p.nickname}</p>
                    <p className="text-[10px] text-[#999]">{time} 접속</p>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                    title="온라인"
                    aria-label="온라인"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
```

**핵심 변경점:**
- `fixed inset-0` → `absolute inset-0` (부모 컨테이너 기준 위치)
- `z-[200]` → `z-20` (페이지 전체 z 스택이 아닌 위젯 내부 스택)
- `bg-black/40 backdrop-blur-sm` **삭제** (배경 dim 없음)
- `flex items-center justify-center` **삭제** (중앙정렬 불필요)
- 내부 카드 `w-[320px] h-[600px]` + `shadow-2xl` 래퍼 **삭제**, 대신 루트 div 자체가 카드 역할 (`bg-white rounded-lg`)
- `onClick={onClose}` (배경 클릭 닫기) **삭제** — X 버튼/ESC 키만 닫기 수단

---

### 2. `components/widgets/ChatWidget.tsx` — 최상위를 `relative` 컨테이너로 래핑

**변경 위치:** 166번 줄 `<>` Fragment → `<div className="relative h-full">` 로 교체. 229번 줄 `</>` → `</div>` 로 교체.

**Edit 툴 호출용:**

```
old_string:
  return (
    <>
      <WidgetCard

new_string:
  return (
    <div className="relative h-full">
      <WidgetCard
```

```
old_string:
      <ChatParticipantsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        participants={participants}
      />
    </>
  );
}

new_string:
      <ChatParticipantsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        participants={participants}
      />
    </div>
  );
}
```

**이유:** `ChatParticipantsModal`이 `absolute inset-0`로 바뀌면 반드시 가장 가까운 **position된 조상 요소** 기준으로 채워짐. 현재 `<></>` Fragment는 DOM 노드가 아니므로 기준점이 없음. `<div className="relative h-full">`로 감싸야 채팅창(이 div의 크기 = 그리드 셀 크기) 영역 내부에서만 오버레이가 채워짐.

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status

# 1. ChatParticipantsModal.tsx 전체 교체 (위 코드 블록 그대로)
# 2. ChatWidget.tsx Fragment → div.relative.h-full로 2군데 Edit

# 3. 빌드 확인
npm run build

# 4. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 5
tail -n 20 /tmp/next-dev.log
```

---

## ✅ 시각 검증 체크리스트

브라우저에서 `http://localhost:3000` 새로고침 후:

1. **"Live · N명" 버튼 클릭** — 팝업이 뜨는가
2. **팝업 크기** — 채팅창 영역과 **정확히 같은 크기**인가 (화면 전체 X)
3. **나머지 위젯** — 차트, 호가창, 체결창, 글로벌지수, R4 위젯들이 **평소처럼 밝게 보이는가** (어두워지지 않아야 함)
4. **다른 위젯 인터랙션** — 팝업이 떠 있는 상태에서도 차트 드래그, 호가창 스크롤 등이 작동하는가
5. **닫기** — X 버튼 또는 ESC 키로 닫히는가

---

## 🎯 Git 커밋 메시지

```
fix: chat participants popup scope to chat widget only

- ChatParticipantsModal: fixed inset-0 → absolute inset-0 (parent-relative)
- Remove bg-black/40 backdrop-blur-sm (no page-wide dim)
- Card size w[320]h[600] → w-full h-full (fits chat widget exactly)
- ChatWidget: root Fragment → div.relative.h-full (positioning anchor)

Result: participants popup overlays only the chat widget area.
Other dashboard widgets remain fully visible and interactive.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```
