"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { ThumbsUp, ThumbsDown, Eye, Users, ShieldCheck, ExternalLink } from "lucide-react";
import { PlatformLogo, PLATFORM_LABEL } from "./platformLogo";

export type RoomItem = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  pricing: string | null;
  external_url: string | null;
  is_certified: boolean;
  like_count: number;
  dislike_count: number;
  view_count: number;
  follower_count: number;
};

type Comment = { id: string; nickname: string; content: string };

export default function HomeRoomPreview({ room }: { room: RoomItem | null }) {
  const user = useAuthStore((s) => s.user);
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loginNotice, setLoginNotice] = useState(false);

  useEffect(() => {
    if (!room) return;
    setLikes(room.like_count);
    setDislikes(room.dislike_count);
    setVote(null);
    let cancelled = false;
    (async () => {
      const supabase = createAnonClient();
      if (user) {
        const { data } = await supabase
          .from("leading_room_votes")
          .select("vote_type")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && data) setVote(data.vote_type as "like" | "dislike");
      }
      const { data: cs } = await supabase
        .from("platform_discussions")
        .select("id, nickname, content")
        .eq("target_type", "room")
        .eq("target_id", room.id)
        .eq("hidden", false)
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (!cancelled) setComments((cs as Comment[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [room?.id, user]);

  if (!room) {
    return (
      <aside className="hidden w-80 shrink-0 xl:block">
        <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-5 text-sm text-unjong-muted shadow-soft">
          리딩방에 마우스를 올리면 미리보기가 표시됩니다.
        </div>
      </aside>
    );
  }

  const notifyLogin = () => { setLoginNotice(true); setTimeout(() => setLoginNotice(false), 3000); };

  const handleVote = async (dir: "like" | "dislike") => {
    if (!user) return notifyLogin();
    const supabase = createAnonClient();
    if (vote === dir) {
      const { error } = await supabase.from("leading_room_votes").delete().eq("room_id", room.id).eq("user_id", user.id);
      if (!error) {
        setVote(null);
        if (dir === "like") setLikes((c) => Math.max(c - 1, 0));
        else setDislikes((c) => Math.max(c - 1, 0));
      }
    } else if (vote === null) {
      const { error } = await supabase.from("leading_room_votes").insert({ room_id: room.id, user_id: user.id, vote_type: dir });
      if (!error) {
        setVote(dir);
        if (dir === "like") setLikes((c) => c + 1);
        else setDislikes((c) => c + 1);
      }
    } else {
      const { error } = await supabase.from("leading_room_votes").update({ vote_type: dir }).eq("room_id", room.id).eq("user_id", user.id);
      if (!error) {
        setVote(dir);
        if (dir === "like") { setLikes((c) => c + 1); setDislikes((c) => Math.max(c - 1, 0)); }
        else { setDislikes((c) => c + 1); setLikes((c) => Math.max(c - 1, 0)); }
      }
    }
  };

  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="sticky top-5 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {/* 헤더 */}
        <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
          <PlatformLogo platform={room.platform} size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-bold text-unjong-primary">{room.name}</p>
              {room.is_certified && <ShieldCheck size={13} className="shrink-0 text-emerald-600" />}
            </div>
            <p className="truncate text-xs text-unjong-muted">
              {PLATFORM_LABEL[room.platform] ?? "기타"}{room.pricing ? ` · ${room.pricing}` : ""}
            </p>
          </div>
        </div>

        {/* 연결 */}
        <div className="border-b border-unjong-border p-4">
          <p className="mb-2 text-xs font-semibold text-unjong-muted">연결</p>
          {room.external_url ? (
            <a
              href={room.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {PLATFORM_LABEL[room.platform] ?? "방"} 입장하기 <ExternalLink size={13} />
            </a>
          ) : (
            <p className="rounded-lg bg-unjong-background py-2.5 text-center text-xs text-unjong-muted">입장 링크 미등록</p>
          )}
        </div>

        {/* 투표 + 조회수 */}
        <div className="flex items-center gap-2 border-b border-unjong-border p-4">
          <button
            type="button"
            onClick={() => handleVote("like")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors ${
              vote === "like" ? "border-[#F04452] bg-[#F04452]/5 text-[#F04452]" : "border-unjong-border text-unjong-muted hover:border-[#F04452] hover:text-[#F04452]"
            }`}
          >
            <ThumbsUp size={14} fill={vote === "like" ? "currentColor" : "none"} /> {likes}
          </button>
          <button
            type="button"
            onClick={() => handleVote("dislike")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors ${
              vote === "dislike" ? "border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6]" : "border-unjong-border text-unjong-muted hover:border-[#3182F6] hover:text-[#3182F6]"
            }`}
          >
            <ThumbsDown size={14} fill={vote === "dislike" ? "currentColor" : "none"} /> {dislikes}
          </button>
          <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Eye size={13} /> {room.view_count}</span>
          {room.follower_count > 0 && (
            <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Users size={13} /> {room.follower_count.toLocaleString()}</span>
          )}
        </div>
        {loginNotice && <p className="px-4 pt-2 text-[11px] text-amber-700">로그인 후 평가할 수 있어요.</p>}

        {/* 방 평가 */}
        <div className="p-4">
          <p className="mb-2 text-xs font-semibold text-unjong-muted">방 평가</p>
          {comments.length === 0 ? (
            <p className="text-xs text-unjong-muted">아직 평가가 없어요. 첫 평가를 남겨보세요.</p>
          ) : (
            <ul className="space-y-2.5">
              {comments.map((c) => (
                <li key={c.id} className="text-xs">
                  <p className="mb-0.5 text-unjong-muted">{c.nickname}</p>
                  <p className="line-clamp-2 text-unjong-primary">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/room/${room.id}`}
            className="mt-3 block w-full rounded-lg border border-unjong-border py-2 text-center text-sm font-medium text-unjong-primary hover:bg-unjong-background"
          >
            방 상세 · 평가 남기기 →
          </Link>
        </div>
      </div>
    </aside>
  );
}
