"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { ThumbsUp, ThumbsDown, Flag, AlertCircle } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type PlatformDiscussion = {
  id: string;
  nickname: string;
  tier: number;
  content: string;
  duration: string | null;
  outcome: "positive" | "neutral" | "negative" | null;
  like_count: number;
  dislike_count: number;
  created_at: string;
};

type SortMode = "hot" | "recent";
type Outcome = "positive" | "neutral" | "negative";

type Props = {
  targetType: "product" | "room";
  targetId: string;
};

const OUTCOME_META: Record<Outcome, { label: string; cls: string }> = {
  positive: { label: "👍 만족", cls: "bg-emerald-50 text-emerald-700" },
  neutral: { label: "😐 보통", cls: "bg-slate-100 text-slate-600" },
  negative: { label: "👎 불만", cls: "bg-red-50 text-red-700" },
};

export default function PlatformDiscussionBoard({ targetType, targetId }: Props) {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<PlatformDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [showWrite, setShowWrite] = useState(false);
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("");
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [myVotes, setMyVotes] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const supabase = createAnonClient();
      let query = supabase
        .from("platform_discussions")
        .select("id, nickname, tier, content, duration, outcome, like_count, dislike_count, created_at")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("hidden", false)
        .limit(50);
      query = sortMode === "hot"
        ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
        : query.order("created_at", { ascending: false });
      const { data } = await query;
      if (cancelled) return;
      setItems((data || []) as PlatformDiscussion[]);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [targetType, targetId, sortMode]);

  // 본인 투표(추천/비추천) 선로드
  useEffect(() => {
    if (!user) { setMyVotes(new Map()); return; }
    let cancelled = false;
    const load = async () => {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("platform_discussion_likes")
        .select("discussion_id, vote")
        .eq("user_id", user.id);
      if (!cancelled) {
        setMyVotes(new Map((data || []).map((r: { discussion_id: string; vote: number }) => [r.discussion_id, r.vote])));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, items.length]);

  const handleSubmit = async () => {
    if (!user) return;
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("platform_discussions").insert({
      target_type: targetType,
      target_id: targetId,
      user_id: user.id,
      nickname: user.nickname,
      tier: user.tier ?? 1,
      content: trimmed,
      duration: duration.trim() || null,
      outcome: outcome || null,
    });
    if (!error) {
      setContent("");
      setDuration("");
      setOutcome("");
      setShowWrite(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between bg-unjong-surface rounded-lg border border-unjong-border px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-unjong-primary">💬 사용자 평가</h2>
          <p className="text-xs text-unjong-muted">운종은 평가 X · 사용자 토론·추천/비추천만 제공</p>
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

      {/* 작성 */}
      {!user ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4 text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-unjong-muted" />
          <p className="text-sm text-unjong-primary">평가 작성은 로그인 후 가능합니다</p>
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
          ✏️ 직접 이용해본 경험을 남겨주세요
        </button>
      ) : (
        <div className="bg-unjong-surface rounded-lg border border-unjong-accent p-3 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="실제 이용 경험을 작성하세요. 허위·작전·홍보는 신고 대상입니다."
            maxLength={5000}
            rows={4}
            autoFocus
            className="w-full text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none resize-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="이용 기간 (예: 3개월)"
              maxLength={40}
              className="text-xs px-2 py-1 rounded border border-unjong-border bg-unjong-background text-unjong-primary focus:outline-none focus:border-unjong-accent"
            />
            <div className="flex gap-1">
              {(Object.keys(OUTCOME_META) as Outcome[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome((cur) => (cur === o ? "" : o))}
                  className={`text-xs px-2 py-1 rounded border ${outcome === o ? `${OUTCOME_META[o].cls} border-transparent font-semibold` : "border-unjong-border text-unjong-muted hover:text-unjong-primary"}`}
                >
                  {OUTCOME_META[o].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-unjong-muted">
              {content.length} / 5000자 · {user.nickname} (Tier {user.tier ?? 1})
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowWrite(false); setContent(""); }} className="text-sm text-unjong-muted px-2 py-1">
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
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
      ) : items.length === 0 ? (
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
          <EmptyState icon="💬" title="첫 평가를 남겨보세요" description="실제 이용 경험을 공유해 다른 투자자를 도와주세요." />
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => (
            <PlatformDiscussionItem key={d.id} discussion={d} initialVote={myVotes.get(d.id) ?? 0} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlatformDiscussionItem({ discussion: d, initialVote }: { discussion: PlatformDiscussion; initialVote: number }) {
  const user = useAuthStore((s) => s.user);
  const [vote, setVote] = useState(initialVote); // 1 추천 · -1 비추천 · 0 없음
  const [likeCount, setLikeCount] = useState(d.like_count);
  const [dislikeCount, setDislikeCount] = useState(d.dislike_count);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";

  const notifyLogin = () => {
    setShowLoginNotice(true);
    setTimeout(() => setShowLoginNotice(false), 3000);
  };

  const handleVote = async (dir: 1 | -1) => {
    if (!user) return notifyLogin();
    const supabase = createAnonClient();
    if (vote === dir) {
      // 같은 방향 재클릭 → 투표 취소
      const { error } = await supabase
        .from("platform_discussion_likes")
        .delete()
        .eq("discussion_id", d.id)
        .eq("user_id", user.id);
      if (!error) {
        setVote(0);
        if (dir === 1) setLikeCount((c) => c - 1);
        else setDislikeCount((c) => c - 1);
      }
    } else {
      // 신규 또는 전환 → upsert
      const { error } = await supabase
        .from("platform_discussion_likes")
        .upsert({ discussion_id: d.id, user_id: user.id, vote: dir }, { onConflict: "discussion_id,user_id" });
      if (!error) {
        const prev = vote;
        setVote(dir);
        if (dir === 1) {
          setLikeCount((c) => c + 1);
          if (prev === -1) setDislikeCount((c) => c - 1);
        } else {
          setDislikeCount((c) => c + 1);
          if (prev === 1) setLikeCount((c) => c - 1);
        }
      }
    }
  };

  const handleReport = async () => {
    if (!user) return notifyLogin();
    if (reported || reporting) return;
    if (!confirm("이 평가를 신고하시겠습니까?\n\n허위 신고 시 운종 닉네임 신뢰 점수가 감소합니다.")) return;
    setReporting(true);
    const supabase = createAnonClient();
    const { error } = await supabase
      .from("platform_discussion_reports")
      .insert({ discussion_id: d.id, reporter_id: user.id, reason: "user_report" });
    if (!error) setReported(true);
    setReporting(false);
  };

  return (
    <li className="bg-unjong-surface rounded-lg border border-unjong-border p-4 hover:border-unjong-accent transition-colors">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-unjong-primary">{tierEmoji} {d.nickname}</span>
          {d.outcome && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${OUTCOME_META[d.outcome].cls}`}>
              {OUTCOME_META[d.outcome].label}
            </span>
          )}
          {d.duration && <span className="text-xs text-unjong-muted">· {d.duration}</span>}
        </div>
        <span className="text-xs text-unjong-muted">
          {new Date(d.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className="text-sm text-unjong-primary whitespace-pre-wrap leading-normal mb-2">{d.content}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleVote(1)}
          className={`flex items-center gap-1 text-xs transition-colors ${vote === 1 ? "text-[#1AC267]" : "text-unjong-muted hover:text-[#1AC267]"}`}
          title="추천"
        >
          <ThumbsUp size={12} fill={vote === 1 ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => handleVote(-1)}
          className={`flex items-center gap-1 text-xs transition-colors ${vote === -1 ? "text-[#F04452]" : "text-unjong-muted hover:text-[#F04452]"}`}
          title="비추천"
        >
          <ThumbsDown size={12} fill={vote === -1 ? "currentColor" : "none"} />
          <span>{dislikeCount}</span>
        </button>
        <button
          type="button"
          onClick={handleReport}
          disabled={reported || reporting}
          className={`ml-auto text-xs transition-colors ${reported ? "text-unjong-danger" : "text-unjong-muted hover:text-unjong-danger"}`}
          title={reported ? "신고 완료" : "사기의심 신고"}
        >
          <Flag size={11} fill={reported ? "currentColor" : "none"} />
        </button>
      </div>
      {showLoginNotice && (
        <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center justify-between">
          <span>로그인 후 이용 가능합니다</span>
          <Link href="/auth/login" className="text-unjong-accent font-semibold hover:underline">로그인 →</Link>
        </div>
      )}
    </li>
  );
}
