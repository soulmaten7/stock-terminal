"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Flag, MessageCircle } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import DiscussionComments from "./DiscussionComments";

type Discussion = {
  id: string;
  symbol: string;
  nickname: string;
  tier: number;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type Props = {
  discussion: Discussion;
  initiallyLiked?: boolean;
};

export default function DiscussionItem({ discussion: d, initiallyLiked = false }: Props) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(d.like_count);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(d.comment_count);

  const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";

  // 댓글 영역이 열려 있을 때만 댓글 수 Realtime 동기화
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
        () => setLocalCommentCount((c) => c + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [d.id, showComments]);

  const handleLike = async () => {
    if (!user) {
      setShowLoginNotice(true);
      setTimeout(() => setShowLoginNotice(false), 3000);
      return;
    }
    const supabase = createAnonClient();
    if (liked) {
      const { error } = await supabase
        .from("discussion_likes")
        .delete()
        .eq("discussion_id", d.id)
        .eq("user_id", user.id);
      if (!error) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    } else {
      const { error } = await supabase
        .from("discussion_likes")
        .insert({ discussion_id: d.id, user_id: user.id });
      if (!error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  };

  const handleReport = async () => {
    if (!user) {
      setShowLoginNotice(true);
      setTimeout(() => setShowLoginNotice(false), 3000);
      return;
    }
    if (reported || reporting) return;
    if (!confirm(`이 게시글을 신고하시겠습니까?\n\n"${d.content.slice(0, 50)}..."\n\n허위 신고 시 운종 닉네임 신뢰 점수가 감소합니다.`)) return;

    setReporting(true);
    const supabase = createAnonClient();
    const { error } = await supabase
      .from("discussion_reports")
      .insert({ discussion_id: d.id, reporter_id: user.id, reason: "user_report" });
    if (!error) setReported(true);
    setReporting(false);
  };

  return (
    <li className="bg-unjong-surface rounded-lg border border-unjong-border p-4 hover:border-unjong-accent transition-colors">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold text-unjong-primary">
          {tierEmoji} {d.nickname}
        </span>
        <span className="text-xs text-unjong-muted">
          {new Date(d.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className="text-sm text-unjong-primary whitespace-pre-wrap leading-relaxed mb-2">{d.content}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1 text-xs transition-colors ${liked ? "text-unjong-danger" : "text-unjong-muted hover:text-unjong-danger"}`}
        >
          <Heart size={12} fill={liked ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1 text-xs transition-colors ${showComments ? "text-unjong-accent" : "text-unjong-muted hover:text-unjong-primary"}`}
        >
          <MessageCircle size={12} fill={showComments ? "currentColor" : "none"} />
          <span>{localCommentCount}</span>
        </button>
        <button
          type="button"
          onClick={handleReport}
          disabled={reported || reporting}
          className={`ml-auto text-xs transition-colors ${reported ? "text-unjong-danger" : "text-unjong-muted hover:text-unjong-danger"}`}
          title={reported ? "신고 완료" : "신고"}
        >
          <Flag size={11} fill={reported ? "currentColor" : "none"} />
        </button>
      </div>

      {/* 비로그인 안내 */}
      {showLoginNotice && (
        <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center justify-between">
          <span>로그인 후 이용 가능합니다</span>
          <Link href="/auth/login" className="text-unjong-accent font-semibold hover:underline">
            로그인 →
          </Link>
        </div>
      )}

      {/* 댓글 영역 */}
      {showComments && <DiscussionComments discussionId={d.id} />}
    </li>
  );
}
