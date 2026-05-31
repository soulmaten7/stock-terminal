"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { Send, AlertCircle, Trash2 } from "lucide-react";
import { LoadingState } from "@/components/ui/State";

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
