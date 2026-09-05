<!-- 2026-04-21 -->
# Step 12 — 마켓채팅 참여자 팝업 (Phase 2-A)

## 실행 명령어 (Sonnet)

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

2파일 수정/신규 + Supabase Presence API 연동. 복잡한 디버깅 없이 패턴 명확 → Sonnet으로 충분.

---

## 목표

사용자 요구사항 (원문):
> "마켓 채팅에 채팅 참여자 목록이 보이게 누르면 팝업창으로 마켓채팅크기로 팝업창이 나타나게 해줘"

### 구현 스펙

1. **마켓 채팅 헤더 "Live" 뱃지 확장** → "Live · N명" 형태로 참여자 수 표시
2. **카운트 클릭** → 참여자 목록 모달 오픈
3. **모달 크기** = 마켓채팅 위젯과 비슷한 크기 (320px × 600px)
4. **참여자 추적** = Supabase Presence API (로그인 사용자만)
5. **모달 내용** = 닉네임 + 접속 시간 + 초록색 온라인 점

---

## 전제 상태

- 기존 `ChatWidget` 은 Supabase Realtime으로 메시지 수신 작동 중
- `nickFrom()` 헬퍼 함수 재사용 가능
- Supabase Presence API는 Realtime 플랜에서 기본 제공 (추가 설정 불필요)

---

## 기술 배경 — Supabase Presence API

각 클라이언트가 채널에 접속할 때 메타데이터(user_id, nickname 등) 등록 → 서버가 자동 추적.
- `channel.track({ ... })` — 본인 presence 등록
- `on('presence', { event: 'sync' }, ...)` — 전체 상태 변경 시 호출
- `channel.presenceState()` — 현재 접속자 전체 조회
- 자동 cleanup — 연결 끊어지면 자동 제거

참고: https://supabase.com/docs/guides/realtime/presence

---

## 변경 #1: `components/widgets/ChatParticipantsModal.tsx` (신규)

```bash
cat > components/widgets/ChatParticipantsModal.tsx << 'EOF'
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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-participants-title"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[320px] h-[600px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
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
    </div>
  );
}
EOF
```

---

## 변경 #2: `components/widgets/ChatWidget.tsx` — Presence 통합

**파일 전체를 아래 내용으로 교체:**

```bash
cat > components/widgets/ChatWidget.tsx << 'EOF'
'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/home/WidgetCard';
import ChatParticipantsModal, { type Participant } from './ChatParticipantsModal';

interface ChatMsg {
  id: string;
  user_id: string | null;
  content: string;
  stock_tags: string[];
  created_at: string;
  nickname?: string;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function nickFrom(uid: string | null): string {
  const NICKS = ['주식고수', '투자왕', '차트맨', '배당러버', '스윙왕', '퀀트맨', '바이더딥', '가치투자자', 'ETF부자', '인덱스투자'];
  if (!uid) return '익명';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) & 0x7fffffff;
  return NICKS[hash % NICKS.length];
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 메시지 로딩 + 인증 상태 + 메시지 realtime 구독
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (cancelled) return;
      setLoggedIn(!!data.user);
      setUserId(data.user?.id ?? null);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_evt: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;
      setLoggedIn(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });

    supabase
      .from('chat_messages')
      .select('id,user_id,content,stock_tags,created_at')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }: { data: ChatMsg[] | null }) => {
        if (cancelled || !data) return;
        setMessages(data.reverse());
      });

    const channel = supabase
      .channel('chat-sidebar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: { new: unknown }) => {
          const row = payload.new as ChatMsg;
          if (row.user_id) {
            setMessages((prev) => [...prev.slice(-99), row]);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Presence 구독 — 로그인 상태가 바뀔 때마다 재구독
  useEffect(() => {
    if (!userId) {
      setParticipants([]);
      return;
    }

    const supabase = createClient();
    const nickname = nickFrom(userId);

    const presenceChannel = supabase.channel('chat-presence', {
      config: { presence: { key: userId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const list: Participant[] = [];
        Object.values(state).forEach((metas: unknown) => {
          (metas as Participant[]).forEach((meta) => {
            list.push(meta);
          });
        });
        setParticipants(list);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            nickname,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `status ${res.status}`);
      }
      setInput('');
    } catch (ex) {
      setErr(String(ex instanceof Error ? ex.message : ex));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <WidgetCard
        title="마켓 채팅"
        subtitle="Supabase Realtime"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 hover:bg-gray-50 px-1.5 py-0.5 rounded transition-colors"
            title="참여자 목록 보기"
            aria-label={`참여자 목록 보기 (${participants.length}명)`}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
            <span className="text-[10px] text-[#FF3B30] font-bold">Live</span>
            <span className="text-[10px] text-[#999999] font-medium">
              · {participants.length}명
            </span>
          </button>
        }
      >
        <div className="h-full flex flex-col">
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-[11px] text-[#999] text-center py-4">
                아직 메시지가 없습니다. 첫 메시지를 남겨보세요.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-bold text-[#0ABAB5]">
                    {m.nickname || nickFrom(m.user_id)}
                  </span>
                  <span className="text-xs text-[#BBBBBB]">{fmtTime(m.created_at)}</span>
                </div>
                <p className="text-sm text-[#333] leading-snug break-all">{m.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="sticky bottom-0 border-t border-[#F0F0F0] bg-white px-3 py-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loggedIn ? '메시지 입력… ($종목명 태그 지원)' : '로그인 후 채팅 참여'}
              disabled={!loggedIn || sending}
              maxLength={500}
              className={`w-full text-sm border border-[#E5E7EB] rounded px-2.5 py-2 ${
                loggedIn
                  ? 'bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]'
                  : 'bg-[#F8F9FA] text-[#999] cursor-not-allowed'
              }`}
            />
            {err && <p className="text-[10px] text-[#C33] mt-1">⚠ {err}</p>}
          </form>
        </div>
      </WidgetCard>

      <ChatParticipantsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        participants={participants}
      />
    </>
  );
}
EOF
```

### 변경 포인트 요약

| 항목 | Before | After |
|---|---|---|
| import | `@supabase/supabase-js`, `WidgetCard` 만 | `ChatParticipantsModal` + `Participant` 타입 추가 |
| State | messages, loggedIn, input, sending, err | + `userId`, `participants`, `modalOpen` |
| useEffect | 1개 (메시지 + realtime) | 2개 (Presence는 userId 변경 시 재구독) |
| action slot | 단순 Live 뱃지 (`<div>`) | 클릭 가능한 `<button>` + 참여자 수 |
| Modal | 없음 | `<ChatParticipantsModal>` 래핑 |

---

## 변경 #3: 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

**실패 시 체크리스트**:
- `Participant` 타입 import 실패 → `ChatParticipantsModal.tsx` 파일이 제대로 생성됐는지 확인
- `presenceChannel.presenceState()` 타입 오류 → supabase-js 타입 정의 확인, 필요 시 `as any` 허용
- TypeScript strict 모드 경고 허용 (`presence state` 내부 메타데이터 타입은 any 허용)

---

## 변경 #4: 로컬 시각 검증

```bash
npm run dev
```

체크리스트:

**비로그인 상태**:
- [ ] 헤더에 "Live · 0명" 표시
- [ ] 카운트 클릭 시 모달 오픈 → "현재 접속 중인 참여자가 없습니다. 로그인 후 채팅에 참여해보세요." 안내 표시
- [ ] 모달 배경 클릭 / X 버튼 / ESC 키로 닫힘
- [ ] 채팅 입력창은 여전히 비활성화 상태

**로그인 상태** (Supabase Auth 로그인 후):
- [ ] 헤더에 "Live · 1명" (본인 포함) 이상 표시
- [ ] 카운트 클릭 → 본인 닉네임이 목록에 나타남
- [ ] 참여자 row에 아바타(첫 글자) + 닉네임 + 접속 시간 + 초록 점
- [ ] 다른 탭에서도 로그인 → "Live · 2명" 증가 (Presence는 탭별로 트래킹)
- [ ] 탭 닫기 → 수 초 내 "Live · 1명"으로 감소

**모달 UX**:
- [ ] 크기: 320px × 600px (마켓채팅 위젯 크기와 유사)
- [ ] 중앙 정렬 + 반투명 검은 배경 + 블러 효과
- [ ] 참여자 hover 시 row 배경색 변경

---

## 변경 #5: 문서 4종 헤더 날짜 업데이트

대상 파일:
1. `CLAUDE.md`
2. `docs/CHANGELOG.md` + Step 12 블록 추가
3. `session-context.md` + Step 12 완료 블록
4. `docs/NEXT_SESSION_START.md` — 다음 P0 업데이트 (Phase 2-B)

### CHANGELOG.md Step 12 블록

```markdown
### Step 12 — 마켓채팅 참여자 팝업 (Phase 2-A)

**변경 사항**:
- 마켓채팅 헤더에 실시간 참여자 수 표시 ("Live · N명")
- 참여자 수 클릭 → 참여자 목록 모달 오픈
- 모달 크기: 320px × 600px (마켓채팅 위젯과 유사)
- 참여자 추적: Supabase Presence API (로그인 사용자만)
- 모달 UX: 배경 클릭/ESC/X 버튼으로 닫힘, 배경 블러, 스크롤 가능

**신규 파일**: `components/widgets/ChatParticipantsModal.tsx`
**수정 파일**: `components/widgets/ChatWidget.tsx`

**Phase 2-A 완료. Phase 2-B, 2-C 대기**:
- Phase 2-B: `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- Phase 2-C: 경제캘린더 홈 미니 위젯 (오늘+내일 주요 이벤트)
```

### session-context.md Step 12 블록

```markdown
### Session #22 Step 12 완료 (2026-04-21)
- Phase 2-A: 마켓채팅 참여자 팝업 완료
- Supabase Presence API 통합 — 로그인 사용자의 실시간 접속 추적
- 새 컴포넌트: ChatParticipantsModal (320×600, ESC/배경 클릭 닫기)
- ChatWidget 재구조 — action slot을 버튼으로 변경, 2번째 useEffect 추가 (Presence)

### TODO (Phase 2-B)
- [ ] /investor-flow 페이지 내용을 /net-buy 내 탭으로 흡수
- [ ] 수급 페이지 탭 구조: [종목별 TOP] [시장 동향]

### TODO (Phase 2-C)
- [ ] 경제캘린더 API 소스 결정 (네이버증권 vs Investing.com vs 한경컨센서스)
- [ ] 홈 미니 위젯 (오늘+내일 주요 이벤트 3~5건)
```

### NEXT_SESSION_START.md 업데이트 블록

```markdown
## 현재 상태 (2026-04-21 기준)

Phase 2-A 완료. Phase 2-B 작업 대기.

## 다음 세션 P0

- **Phase 2-B**: `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 통합
  - 탭 구조: [종목별 TOP] [시장 동향 시계열]
  - URL은 `/net-buy`로 단일화, `/investor-flow`는 301 리다이렉트

## 다음 세션 P1

- **Phase 2-C**: 경제캘린더 홈 미니 위젯
  - API 소스 리서치 필요
  - 크기/배치 결정 필요 (현재 어느 위젯 옆?)
```

---

## 변경 #6: Git 커밋

```bash
git add components/widgets/ChatWidget.tsx components/widgets/ChatParticipantsModal.tsx CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md docs/STEP_12_COMMAND.md

git commit -m "$(cat <<'EOF'
Step 12: 마켓채팅 참여자 팝업 (Phase 2-A)

Changes:
- 마켓채팅 헤더 "Live · N명" 참여자 수 실시간 표시
- 카운트 클릭 → 참여자 목록 모달 오픈
- 모달: 320×600, 배경 블러, ESC/배경클릭/X버튼 닫기, 스크롤 가능
- Supabase Presence API 통합 — 로그인 사용자 실시간 트래킹
- 참여자 row: 아바타(닉네임 첫 글자) + 닉네임 + 접속 시간 + 초록 온라인 점

New files:
- components/widgets/ChatParticipantsModal.tsx (신규 컴포넌트)
- docs/STEP_12_COMMAND.md (작업 기록)

Modified:
- components/widgets/ChatWidget.tsx
  - Presence 구독용 2번째 useEffect 추가
  - action slot을 button으로 변경 (접근성 aria-label 추가)
  - userId, participants, modalOpen state 추가
- 문서 4종 날짜 업데이트 + Phase 2-A 완료 블록 추가

Next: Phase 2-B (투자자 동향 → 수급 탭 흡수), Phase 2-C (경제캘린더 미니 위젯)
EOF
)"
```

---

## 변경 #7: Git Push

```bash
git push
```

---

## 실행 후 사용자에게 보고할 내용

1. 빌드 성공 여부 (TypeScript 경고 포함)
2. 커밋 해시
3. push 성공 여부
4. 로컬 dev 서버 스크린샷 요청
   - 비로그인 상태에서 "Live · 0명" 표시
   - 카운트 클릭 시 모달 오픈 확인

---

## 롤백 절차

```bash
git reset --hard HEAD~1
rm -f components/widgets/ChatParticipantsModal.tsx
```

신규 파일이므로 reset만으로 제거됨.

---

## 알려진 한계 (다음 세션 개선 후보)

1. **비로그인 사용자는 카운트에 포함 안 됨** — 의도적 (채팅 참여 불가하므로)
2. **Presence 채널 1개 공유** — 전체 사이트에서 한 채널 사용. 향후 특정 종목방 분리 시 채널 분기 필요
3. **닉네임은 user_id 해시 기반** — 실제 프로필 닉네임으로 업그레이드 시 Supabase `profiles` 테이블 JOIN 필요
4. **아바타 이미지 없음** — 첫 글자만 표시. 향후 프로필 이미지 연동 시 확장
