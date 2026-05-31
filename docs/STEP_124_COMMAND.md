<!-- 2026-05-31 -->
# STEP 124 — 토론 댓글 기능

🔴 **Opus 권장** (DB 스키마 + 트리거 + UI 신규 + 인터랙션)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `5d0a828` (STEP 123 UI 일관성)
- 종목 페이지 토론 작동: 메인 글 좋아요·신고 가능, 댓글 X
- discussions 테이블에 `comment_count INTEGER NOT NULL DEFAULT 0` 컬럼만 있고 실제 댓글 X
- 운종 정체성 "대화" 본질 강화 필요

## 운종 본질 — 이 STEP 의 의미

> **운종 = 정보 + 대화**

댓글 없는 토론 = 게시판 (블로그). 댓글 있는 토론 = **대화 (네이버 종토방·디시·블라인드)**.
댓글이 운종의 "대화" 본질을 완성.

## 목표

| 항목 | 변경 |
|------|------|
| **DB 마이그레이션 018** | discussion_comments 테이블 + RLS + 자동 comment_count 트리거 |
| **신규 컴포넌트** | DiscussionComments — 댓글 목록 + 작성 |
| **DiscussionItem 변경** | 댓글 버튼 클릭 시 펼치기/접기 토글 |
| **운종 정책** | 댓글 작성도 로그인 필요 (메인 글과 동일) |
| **댓글에도 좋아요·신고** | (선택 — 이번 STEP 에 포함) |

---

## DB 마이그레이션 018 — discussion_comments

⚠️ **Cowork 가 Supabase MCP 로 별도 적용**

신규 파일: `supabase/migrations/018_discussion_comments.sql`

```sql
-- 018: 토론 댓글
-- STEP 124 — 운종 V5 대화 본질 강화

-- ============================================================
-- 1) discussion_comments — 댓글
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  like_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_created
  ON public.discussion_comments (discussion_id, created_at ASC);

-- ============================================================
-- 2) 댓글 작성·삭제 시 discussions.comment_count 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_discussion_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions SET comment_count = comment_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions SET comment_count = comment_count - 1 WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_discussion_comments_count ON public.discussion_comments;
CREATE TRIGGER trigger_discussion_comments_count
  AFTER INSERT OR DELETE ON public.discussion_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_comment_count();

-- ============================================================
-- 3) RLS — 모두 읽기 (hidden=false), 인증만 작성
-- ============================================================
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments public read" ON public.discussion_comments;
CREATE POLICY "comments public read" ON public.discussion_comments
  FOR SELECT USING (hidden = false);

DROP POLICY IF EXISTS "comments auth insert" ON public.discussion_comments;
CREATE POLICY "comments auth insert" ON public.discussion_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND char_length(content) BETWEEN 1 AND 2000);

-- 본인 댓글 삭제 가능
DROP POLICY IF EXISTS "comments self delete" ON public.discussion_comments;
CREATE POLICY "comments self delete" ON public.discussion_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4) Realtime publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;
```

---

## 작업 디테일

### [1] 신규 컴포넌트 — `components/stock/DiscussionComments.tsx`

토론 1개의 댓글 목록 + 작성 폼.

```tsx
"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { Send, AlertCircle, Trash2 } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Comment = {
  id: string;
  discussion_id: string;
  user_id: string | null;
  nickname: string;
  tier: number;
  content: string;
  created_at: string;
};

type Props = { discussionId: string };

export default function DiscussionComments({ discussionId }: Props) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  // 초기 로드 + Realtime
  useEffect(() => {
    let mounted = true;
    const supabase = createAnonClient();

    const load = async () => {
      const { data } = await supabase
        .from("discussion_comments")
        .select("id, discussion_id, user_id, nickname, tier, content, created_at")
        .eq("discussion_id", discussionId)
        .eq("hidden", false)
        .order("created_at", { ascending: true })
        .limit(100);
      if (mounted) {
        setComments((data || []) as Comment[]);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`comments-${discussionId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "discussion_comments",
          filter: `discussion_id=eq.${discussionId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const c = payload.new as Comment;
          if (!c?.id) return;
          setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [discussionId]);

  const handleSubmit = async () => {
    if (!user) {
      setShowLoginNotice(true);
      setTimeout(() => setShowLoginNotice(false), 3000);
      return;
    }
    const trimmed = input.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("discussion_comments").insert({
      discussion_id: discussionId,
      user_id: user.id,
      nickname: user.nickname,
      tier: user.tier ?? 1,
      content: trimmed,
    });
    if (!error) setInput("");
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;

    const supabase = createAnonClient();
    const { error } = await supabase
      .from("discussion_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-unjong-border space-y-2">
      {/* 댓글 목록 */}
      {loading ? (
        <LoadingState title="댓글 로딩 중..." className="py-2" />
      ) : comments.length === 0 ? (
        <p className="text-[10px] text-unjong-muted italic py-1">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="space-y-1.5">
          {comments.map((c) => {
            const tierEmoji = c.tier === 3 ? "🏆" : c.tier === 2 ? "✓" : "";
            const isOwn = user && c.user_id === user.id;
            return (
              <li key={c.id} className="group flex items-start gap-2 text-xs">
                <span className="font-semibold text-unjong-primary flex-shrink-0">
                  {tierEmoji} {c.nickname}
                </span>
                <span className="text-unjong-primary flex-1 whitespace-pre-wrap leading-snug">
                  {c.content}
                </span>
                <span className="text-[10px] text-unjong-muted flex-shrink-0">
                  {new Date(c.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                {isOwn && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-unjong-muted hover:text-unjong-danger transition-opacity"
                    aria-label="삭제"
                    title="삭제"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 댓글 작성 */}
      {!user ? (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-800">
            <AlertCircle size={12} />
            <span>댓글은 로그인 후 작성 가능합니다</span>
          </div>
          <Link href="/auth/login" className="text-[10px] text-unjong-accent font-semibold hover:underline">
            로그인 →
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded border border-unjong-border bg-unjong-surface px-2 py-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${user.nickname} 으로 댓글 작성...`}
            maxLength={2000}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !input.trim()}
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50"
            aria-label="댓글 등록"
          >
            <Send size={12} />
          </button>
        </div>
      )}

      {showLoginNotice && (
        <div className="px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800">
          로그인 후 댓글 작성 가능합니다
        </div>
      )}
    </div>
  );
}
```

### [2] DiscussionItem 수정 — 댓글 토글

`components/stock/DiscussionItem.tsx` 의 댓글 버튼에 onClick 추가 + 펼치기 상태.

기존 (댓글 버튼):
```tsx
<button
  type="button"
  className="flex items-center gap-1 text-[10px] text-unjong-muted"
  disabled
  title="댓글 기능은 추후 구현"
>
  <MessageCircle size={12} />
  <span>{d.comment_count}</span>
</button>
```

변경:
```tsx
import DiscussionComments from "./DiscussionComments";
// ...
const [showComments, setShowComments] = useState(false);
const [localCommentCount, setLocalCommentCount] = useState(d.comment_count);

// JSX 안 댓글 버튼:
<button
  type="button"
  onClick={() => setShowComments((v) => !v)}
  className={`flex items-center gap-1 text-[10px] transition-colors ${showComments ? "text-unjong-accent" : "text-unjong-muted hover:text-unjong-primary"}`}
>
  <MessageCircle size={12} fill={showComments ? "currentColor" : "none"} />
  <span>{localCommentCount}</span>
</button>

// 그리고 <li> 닫기 직전에:
{showComments && (
  <DiscussionComments discussionId={d.id} />
)}
```

⚠️ `localCommentCount` 는 Realtime 으로 정확 동기화 하려면 `discussions` 의 comment_count 도 postgres_changes 구독 필요. 일단 페이지 새로고침으로 동기화.

### [3] Realtime 댓글 수 동기화 (선택)

DiscussionItem 에서 댓글 INSERT 발생 시 `localCommentCount + 1` 처리:

```tsx
useEffect(() => {
  if (!showComments) return;
  const supabase = createAnonClient();
  const channel = supabase
    .channel(`comment-count-${d.id}`)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      {
        event: "INSERT",
        schema: "public",
        table: "discussion_comments",
        filter: `discussion_id=eq.${d.id}`,
      },
      () => {
        setLocalCommentCount((c) => c + 1);
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [d.id, showComments]);
```

### [4] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [5] 4개 문서 헤더 갱신

### [6] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(comments): 토론 댓글 기능 — 운종 V5 대화 본질 완성

DB 마이그레이션 018 (Cowork 가 별도 적용):
- discussion_comments 테이블 (id·discussion_id·user_id·nickname·tier·content·like_count·report_count·hidden·created_at)
- comment_count 자동 갱신 트리거 (INSERT +1 / DELETE -1)
- RLS: 모두 read (hidden=false), 인증만 insert, 본인만 delete
- Realtime publication 등록

신규 컴포넌트:
- components/stock/DiscussionComments.tsx
  - Realtime 구독 (postgres_changes INSERT)
  - 작성 (인증 필요 + 본인 이름·Tier 자동 표시)
  - 본인 댓글 hover 시 삭제 버튼 (Trash2 아이콘)
  - 비로그인 시 amber 배너 + /auth/login 안내

DiscussionItem 수정:
- 댓글 버튼 onClick → 토글 (펼치기/접기)
- showComments 상태 시 DiscussionComments 자식 렌더
- localCommentCount Realtime 동기화 (열려있을 때만 구독)
- 채워진 MessageCircle 아이콘 = 댓글 영역 열림

운종 정체성 강화:
- 토론 = 메인 글 + 댓글 = 진짜 대화
- 네이버 종토방 수준 인터랙션 가능
- 단 운종은 모더레이션 (5건 신고 자동 hidden) + Tier 시스템으로 차별화"
git push
```

## 검증 (사용자 안내용)

⚠️ DB 마이그레이션 018 적용 후 + 카카오 OAuth 활성화 후 (실제 댓글 insert):

1. `/stock/005930` → 토론 글 → 💬 댓글 버튼 클릭 → 펼침 (채워진 아이콘)
2. 비로그인 → amber 배너 "댓글은 로그인 후 작성 가능합니다" + /auth/login 링크
3. 로그인 → 닉네임 + Tier 표시 + 댓글 입력창
4. Enter → 댓글 등록 → 즉시 표시 (Realtime)
5. 본인 댓글 hover → 🗑 삭제 버튼 표시 → 클릭 → confirm → 삭제
6. 댓글 1개 등록 시 discussions.comment_count = 1 자동 (트리거)
7. 다른 사람이 같은 토론에 댓글 → 본인 화면에서 자동 반영 (Realtime)

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ 마이그레이션 018 (Cowork 별도 적용)
- ✅/❌ DiscussionComments + DiscussionItem 토글 동작
- ✅/❌ Realtime 댓글 동기화
- ✅/❌ 커밋 + 푸시

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| 댓글 좋아요·신고 미구현 (메인 글만) | 추후 (이번 STEP 범위 X) |
| 대댓글 (nested reply) 미지원 | 추후 (parent_comment_id 컬럼 + UI) |
| 댓글 길이 2000자 제한 표시 X | maxLength 만 적용. UI 카운터 추후 |
| 댓글 도배 (단시간 다수 insert) | 추후 rate limit |
| 비로그인 사용자 댓글 누구 작성? | 운종 정책: 댓글은 인증만. 비로그인 = 읽기만 |

## 다음 STEP (사용자 결정)

- 미국 주식 상세 정보 (Yahoo quoteSummary — 시고저·52주·PER)
- 검색 드롭다운 ⭐ 추가 버튼 (Watchlist 통합)
- 큰 시각 디자인 변경 (사용자 피드백)
- 모바일 반응형 (PC 완성 후)
- Vercel 배포 (도메인 결정 후)
