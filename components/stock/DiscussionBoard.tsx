"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import DiscussionItem from "./DiscussionItem";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Discussion = {
  id: string;
  symbol: string;
  nickname: string;
  tier: number;
  content: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  created_at: string;
};

type SortMode = "hot" | "recent";

type Props = { symbol: string; stockName?: string };

export default function DiscussionBoard({ symbol, stockName }: Props) {
  const user = useAuthStore((s) => s.user);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [showWrite, setShowWrite] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voteMap, setVoteMap] = useState<Map<string, 1 | -1>>(new Map());

  // 본인 투표 방향(추천/비추천) 미리 로드
  useEffect(() => {
    if (!user) {
      setVoteMap(new Map());
      return;
    }
    let cancelled = false;
    const loadVotes = async () => {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("discussion_likes")
        .select("discussion_id, vote")
        .eq("user_id", user.id);
      if (cancelled) return;
      setVoteMap(new Map((data || []).map((r: { discussion_id: string; vote: number }) => [r.discussion_id, r.vote as 1 | -1])));
    };
    loadVotes();
    return () => { cancelled = true; };
  }, [user, discussions.length]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const supabase = createAnonClient();
      let query = supabase
        .from("discussions")
        .select("id, symbol, nickname, tier, content, like_count, dislike_count, comment_count, created_at")
        .eq("symbol", symbol)
        .eq("hidden", false)
        .limit(50);
      query = sortMode === "hot"
        ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
        : query.order("created_at", { ascending: false });
      const { data } = await query;
      if (cancelled) return;
      setDiscussions(data || []);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol, sortMode]);

  const handleSubmit = async () => {
    if (!user) return;
    const trimmed = writeContent.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("discussions").insert({
      symbol,
      user_id: user.id,
      nickname: user.nickname,
      tier: user.tier ?? 1,
      content: trimmed,
    });
    if (!error) {
      setWriteContent("");
      setShowWrite(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <header className="flex items-center justify-between bg-unjong-surface rounded-lg border border-unjong-border px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-unjong-primary">💬 {stockName || symbol} 토론</h1>
          <p className="text-xs text-unjong-muted">실시간 토론 · 추천 정렬 / 최신순</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSortMode("hot")}
            className={`text-xs px-2 py-1 rounded ${sortMode === "hot" ? "bg-unjong-accent text-white font-semibold" : "text-unjong-muted hover:text-unjong-primary"}`}
          >
            🔥 HOT
          </button>
          <button
            type="button"
            onClick={() => setSortMode("recent")}
            className={`text-xs px-2 py-1 rounded ${sortMode === "recent" ? "bg-unjong-accent text-white font-semibold" : "text-unjong-muted hover:text-unjong-primary"}`}
          >
            🕐 최신
          </button>
        </div>
      </header>

      {/* 글쓰기 */}
      {!user ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4 text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-unjong-muted" />
          <p className="text-sm text-unjong-primary">토론 글쓰기는 로그인 후 가능합니다</p>
          <Link href="/auth/login" className="inline-block text-xs text-unjong-accent hover:underline">
            카카오로 로그인 →
          </Link>
        </div>
      ) : !showWrite ? (
        <button
          type="button"
          onClick={() => setShowWrite(true)}
          className="w-full text-left bg-unjong-surface rounded-lg border border-unjong-border px-4 py-3 text-sm text-unjong-muted hover:text-unjong-primary"
        >
          ✏️ {stockName || symbol} 에 대해 어떻게 생각하세요?
        </button>
      ) : (
        <div className="bg-unjong-surface rounded-lg border border-unjong-accent p-4 space-y-2">
          <textarea
            value={writeContent}
            onChange={(e) => setWriteContent(e.target.value)}
            placeholder="의견을 작성하세요. 욕설·작전·홍보는 자동 필터링됩니다."
            maxLength={5000}
            rows={4}
            autoFocus
            className="w-full text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-unjong-muted">
              {writeContent.length} / 5000자 · {user.nickname} (Tier {user.tier ?? 1})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowWrite(false); setWriteContent(""); }}
                className="text-sm text-unjong-muted px-2 py-1"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !writeContent.trim()}
                className="text-sm bg-unjong-accent text-white font-semibold px-3 py-1 rounded disabled:opacity-50"
              >
                {submitting ? "..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
          <LoadingState />
        </div>
      ) : discussions.length === 0 ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
          <EmptyState icon="💬" title="첫 토론을 남겨보세요" description="이 종목에 대한 의견·분석·질문을 자유롭게." />
        </div>
      ) : (
        <ul className="space-y-2">
          {discussions.map((d) => (
            <DiscussionItem
              key={d.id}
              discussion={d}
              initialVote={voteMap.get(d.id) ?? 0}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
