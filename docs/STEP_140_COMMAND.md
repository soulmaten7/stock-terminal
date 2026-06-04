<!-- 2026-06-03 -->
# STEP 140 — 종목 토론 추천/비추천 통일 (신뢰 신호 일관화)

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
호출법: `@docs/STEP_140_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표

상품·리딩방 평가 글(`platform_discussions`)엔 **추천/비추천**이 있는데(STEP 020), **종목 토론(`discussions`)엔 좋아요만** 있어 신뢰 신호가 일관되지 않다. 종목 토론에도 **추천(+1)/비추천(-1)** 을 도입해 "운종의 모든 토론·평가에 솔직한 신호" 정체성을 완성한다.

- 사용자당 1표(추천 또는 비추천), **토글·전환** 가능 (platform 패턴과 동일)
- UI 도 platform 평가(`PlatformDiscussionBoard` = ThumbsUp/Down)와 통일 — `Heart` → `ThumbsUp/ThumbsDown`

> **참조 구현**: `components/platform/PlatformDiscussionBoard.tsx` 가 이미 ThumbsUp/Down + vote 토글을 구현 — 같은 패턴을 종목 토론에 이식.

---

## 📌 전제 상태

- **이전 HEAD**: `9fd5327` (STEP 139 — 종목 페이지 디테일). *시작 전 `git log --oneline -1` 확인.*
- **마이그레이션 `022_discussion_dislike.sql` 신규** — Cowork 가 Supabase MCP 로 적용(Claude Code 는 파일 생성만, 직접 apply ❌).
- 현재 스키마(확인됨):
  - `discussions`: `like_count`·`report_count` 있음, **`dislike_count` 없음**
  - `discussion_likes`: `discussion_id`·`user_id`·`created_at` (**`vote` 없음**, PK=(discussion_id,user_id))
  - 기존 트리거: `trigger_discussion_likes_count` → 함수 `update_discussion_like_count` (현재 like_count 만 증감) → **이번에 교체**

---

## 🔢 작업 순서

### STEP 1 — 마이그레이션 SQL 생성 (apply 는 Cowork)

`supabase/migrations/022_discussion_dislike.sql` 신규:

```sql
-- 022: 종목 토론 추천/비추천 (platform_discussions 020 패턴과 통일)
-- 기존 discussion_likes 행은 모두 추천(+1)으로 승계(vote DEFAULT 1).

-- 1) 투표 방향 컬럼
ALTER TABLE public.discussion_likes
  ADD COLUMN IF NOT EXISTS vote SMALLINT NOT NULL DEFAULT 1 CHECK (vote IN (-1, 1));

-- 2) 비추천 집계 컬럼
ALTER TABLE public.discussions
  ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0;

-- 3) like_count / dislike_count 동시 갱신 (INSERT / DELETE / UPDATE 전환) — 기존 함수 교체
CREATE OR REPLACE FUNCTION public.update_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 1 THEN
      UPDATE public.discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.discussions SET dislike_count = dislike_count + 1 WHERE id = NEW.discussion_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 1 THEN
      UPDATE public.discussions SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.discussion_id;
    ELSE
      UPDATE public.discussions SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.discussion_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote <> NEW.vote THEN
    IF NEW.vote = 1 THEN
      UPDATE public.discussions
        SET like_count = like_count + 1, dislike_count = GREATEST(dislike_count - 1, 0)
        WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.discussions
        SET dislike_count = dislike_count + 1, like_count = GREATEST(like_count - 1, 0)
        WHERE id = NEW.discussion_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) 트리거 재생성 — UPDATE 까지 포함 (전환 반영)
DROP TRIGGER IF EXISTS trigger_discussion_likes_count ON public.discussion_likes;
CREATE TRIGGER trigger_discussion_likes_count
  AFTER INSERT OR DELETE OR UPDATE ON public.discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_like_count();
```
> 생성 후 **"022 생성 완료, Cowork 적용 대기"** 보고. apply ❌.

---

### STEP 2 — `DiscussionItem.tsx` 추천/비추천 UI

`Heart` 좋아요를 **ThumbsUp(추천) + ThumbsDown(비추천)** 으로 교체. (PlatformDiscussionBoard 패턴 이식)

**(a) import 교체**
```tsx
import { ThumbsUp, ThumbsDown, Flag, MessageCircle } from "lucide-react";
```

**(b) 타입 + props**
```tsx
type Discussion = {
  id: string; symbol: string; nickname: string; tier: number; content: string;
  like_count: number; dislike_count: number; comment_count: number; created_at: string;
};
type Props = { discussion: Discussion; initialVote?: 0 | 1 | -1 };
```

**(c) 상태 — liked 대신 vote 방향**
```tsx
export default function DiscussionItem({ discussion: d, initialVote = 0 }: Props) {
  const user = useAuthStore((s) => s.user);
  const [vote, setVote] = useState<0 | 1 | -1>(initialVote);
  const [likeCount, setLikeCount] = useState(d.like_count);
  const [dislikeCount, setDislikeCount] = useState(d.dislike_count);
  // ... (reporting/showComments 등 기존 유지)
```

**(d) 투표 핸들러 — 기존 handleLike 제거하고 추가**
```tsx
  const handleVote = async (dir: 1 | -1) => {
    if (!user) { setShowLoginNotice(true); setTimeout(() => setShowLoginNotice(false), 3000); return; }
    const supabase = createAnonClient();

    if (vote === dir) {
      // 같은 방향 재클릭 → 취소
      const { error } = await supabase.from("discussion_likes")
        .delete().eq("discussion_id", d.id).eq("user_id", user.id);
      if (!error) {
        setVote(0);
        dir === 1 ? setLikeCount((c) => c - 1) : setDislikeCount((c) => c - 1);
      }
    } else if (vote === 0) {
      // 신규 투표
      const { error } = await supabase.from("discussion_likes")
        .insert({ discussion_id: d.id, user_id: user.id, vote: dir });
      if (!error) {
        setVote(dir);
        dir === 1 ? setLikeCount((c) => c + 1) : setDislikeCount((c) => c + 1);
      }
    } else {
      // 전환 (추천↔비추천)
      const { error } = await supabase.from("discussion_likes")
        .update({ vote: dir }).eq("discussion_id", d.id).eq("user_id", user.id);
      if (!error) {
        setVote(dir);
        if (dir === 1) { setLikeCount((c) => c + 1); setDislikeCount((c) => Math.max(c - 1, 0)); }
        else { setDislikeCount((c) => c + 1); setLikeCount((c) => Math.max(c - 1, 0)); }
      }
    }
  };
```

**(e) 버튼 렌더 — 좋아요 버튼 자리 교체**
```tsx
<button type="button" onClick={() => handleVote(1)}
  className={`flex items-center gap-1 text-xs transition-colors ${vote === 1 ? "text-[#1AC267]" : "text-unjong-muted hover:text-[#1AC267]"}`}>
  <ThumbsUp size={12} fill={vote === 1 ? "currentColor" : "none"} /><span>{likeCount}</span>
</button>
<button type="button" onClick={() => handleVote(-1)}
  className={`flex items-center gap-1 text-xs transition-colors ${vote === -1 ? "text-[#F04452]" : "text-unjong-muted hover:text-[#F04452]"}`}>
  <ThumbsDown size={12} fill={vote === -1 ? "currentColor" : "none"} /><span>{dislikeCount}</span>
</button>
```
> 댓글·신고 버튼은 그대로. 추천=토스 그린, 비추천=토스 레드.

---

### STEP 3 — `DiscussionBoard.tsx` vote 로드 + select 보강

**(a) Discussion 타입에 `dislike_count: number` 추가.**

**(b) select 에 `dislike_count` 추가** (2곳: 목록 쿼리):
```tsx
.select("id, symbol, nickname, tier, content, like_count, dislike_count, comment_count, created_at")
```

**(c) 본인 투표 방향 로드** — 기존 `likedIds`(Set) 를 `voteMap`(Map<id, 1|-1>) 으로 교체:
```tsx
const [voteMap, setVoteMap] = useState<Map<string, 1 | -1>>(new Map());
// loadLikes 교체:
const { data } = await supabase
  .from("discussion_likes")
  .select("discussion_id, vote")
  .eq("user_id", user.id);
if (cancelled) return;
setVoteMap(new Map((data || []).map((r: { discussion_id: string; vote: number }) => [r.discussion_id, r.vote as 1 | -1])));
```

**(d) 렌더 시 initialVote 전달:**
```tsx
<DiscussionItem key={d.id} discussion={d} initialVote={voteMap.get(d.id) ?? 0} />
```

**(e) 헤더 문구**: "실시간 토론 · 좋아요 정렬 / 최신순" → "실시간 토론 · 추천 정렬 / 최신순".

---

### STEP 4 — `HotDiscussionsModule.tsx` (홈) 비추천 표시 통일

홈 HOT 토론 카드도 일관되게:
- `Discussion` 타입에 `dislike_count: number` 추가
- select 에 `dislike_count` 추가
- `Heart` → `ThumbsUp` 로 교체하고 옆에 `ThumbsDown {dislike_count}` 추가 (읽기 전용 표시)
```tsx
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
// 좋아요 표시부 교체:
<span className="flex items-center gap-1 text-xs text-unjong-muted"><ThumbsUp size={10} /> {d.like_count}</span>
<span className="flex items-center gap-1 text-xs text-unjong-muted"><ThumbsDown size={10} /> {d.dislike_count}</span>
```

---

### STEP 5 — 빌드 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
✓ exit 0 · `console.log` 금지.

```bash
cd ~/stock-terminal && git add supabase/migrations/022_discussion_dislike.sql \
  components/stock/DiscussionItem.tsx components/stock/DiscussionBoard.tsx \
  components/home-v5/HotDiscussionsModule.tsx \
  && git commit -m "feat(v6): 종목 토론 추천/비추천 도입 — 평가 글과 신뢰 신호 통일 (마이그레이션 022, STEP 140)" \
  && git push
```

---

### STEP 6 — 문서 갱신

오늘(2026-06-03):
- `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` 헤더 + STEP 140 블록 + 마이그레이션 022
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD·마이그레이션 022·다음 후보 갱신)
- `docs/SESSION_KICKOFF.md` (현재 커밋)

---

## ✅ 완료 기준 (DoD)

1. `022_discussion_dislike.sql` 생성(Cowork 적용 대기 보고).
2. 종목 토론 글에 추천(ThumbsUp)/비추천(ThumbsDown) — 토글·전환 동작.
3. 본인 투표 방향이 새로고침 후에도 유지(voteMap 로드).
4. 홈 HOT 토론 카드에 추천·비추천 수 표시.
5. `npm run build` ✓ exit 0 + push.
6. 6개 문서 갱신.

## ⚠️ 주의

- 마이그레이션 apply 는 **Cowork(Supabase MCP)** — Claude Code 직접 ❌. 적용 전엔 `vote` 컬럼이 없어 투표가 에러날 수 있으니, **빌드만 확인하고 실제 투표 테스트는 Cowork 적용 후**.
- `discussion_likes` PK=(discussion_id,user_id) — insert/update/delete 키 동일.
- 색: 추천=`#1AC267`(그린)·비추천=`#F04452`(레드) — 평가·홈 토스식과 통일(시세성 데이터와 무관).
- 기존 좋아요 데이터는 vote=1 로 자동 승계(DEFAULT 1).

---

> **STEP 140 = 모든 토론·평가에 추천/비추천 통일.** 다음 후보: 공시(DART) 탭(STEP 141 — `/api/stocks/disclosures` 이미 존재, 연결만) · 외국인보유율·상장주식수 메타.
