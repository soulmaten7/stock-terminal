"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, Eye, Users, ShieldCheck, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/components/ui/State";
import { PlatformLogo } from "./platformLogo";
import HomeRoomPreview, { type RoomItem } from "./HomeRoomPreview";

type Kind = "room" | "channel";

const COPY: Record<Kind, { warn: string; empty: string }> = {
  room: {
    warn: "금감원 신고 여부(사실)와 사용자 평가 순으로 랭킹을 보여줄 뿐, 운종이 추천·보증하지 않아요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.",
    empty: "아직 등록된 리딩방이 없어요",
  },
  channel: {
    warn: "주식 관련 유튜브·SNS·디스코드 채널이에요. 운종은 사용자 평가 랭킹을 보여줄 뿐 추천·보증하지 않아요. 투자 판단·결과는 본인 책임이에요.",
    empty: "아직 등록된 채널이 없어요",
  },
};

type RoomSort = "follower" | "like" | "dislike" | "view";
const SORT_COL: Record<RoomSort, string> = {
  follower: "follower_count",
  like: "like_count",
  dislike: "dislike_count",
  view: "view_count",
};

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}

export default function HomeRoomRanking({ platforms, kind }: { platforms: string[]; kind: Kind }) {
  const sorts: { key: RoomSort; label: string }[] =
    kind === "channel"
      ? [{ key: "follower", label: "팔로워순" }, { key: "like", label: "좋아요순" }, { key: "dislike", label: "싫어요순" }, { key: "view", label: "조회순" }]
      : [{ key: "like", label: "좋아요순" }, { key: "dislike", label: "싫어요순" }, { key: "view", label: "조회순" }];

  const [items, setItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<RoomItem | null>(null);
  const [sort, setSort] = useState<RoomSort>("like");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, external_url, is_certified, like_count, dislike_count, view_count, follower_count")
          .eq("hidden", false)
          .in("platform", platforms)
          .order(SORT_COL[sort], { ascending: false })
          .order("view_count", { ascending: false })
          .limit(10);
        if (!cancelled) {
          const list = (data as RoomItem[]) ?? [];
          setItems(list);
          setHovered(list[0] ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [platforms, kind, sort]);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 정체성 경고 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">{COPY[kind].warn}</p>
      </div>

      {/* 정렬 칩 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-unjong-border px-3 py-2">
        {sorts.map((s) => (
          <button key={s.key} type="button" onClick={() => setSort(s.key)} className={chip(sort === s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 text-2xl">{kind === "room" ? "📡" : "📺"}</span>
          <p className="text-sm font-medium text-unjong-primary">{COPY[kind].empty}</p>
          <Link href="/discussion" className="mt-3 inline-block rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            디렉토리 보기 →
          </Link>
        </div>
      ) : (
        <div className="flex items-start gap-4 p-2">
          <ul className="min-w-0 flex-1 divide-y divide-unjong-border">
            {items.map((r, i) => (
              <li key={r.id}>
                <Link href={`/room/${r.id}`} onMouseEnter={() => setHovered(r)} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-unjong-background">
                  <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums text-unjong-muted">{i + 1}</span>
                  <PlatformLogo platform={r.platform} size={28} />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-unjong-primary">{r.name}</span>
                    {r.is_certified ? (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ShieldCheck size={10} /> 금감원 신고 ✓
                      </span>
                    ) : kind === "room" ? (
                      <span className="shrink-0 rounded-full bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">신고 미확인</span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums text-unjong-muted">
                    {kind === "channel" && (
                      <span className={`flex items-center gap-0.5 ${sort === "follower" ? "font-bold text-unjong-primary" : ""}`}><Users size={11} /> {r.follower_count.toLocaleString()}</span>
                    )}
                    <span className={`flex items-center gap-0.5 ${sort === "like" ? "font-bold text-unjong-primary" : ""}`}><ThumbsUp size={11} /> {r.like_count}</span>
                    <span className={`flex items-center gap-0.5 ${sort === "dislike" ? "font-bold text-unjong-primary" : ""}`}><ThumbsDown size={11} /> {r.dislike_count}</span>
                    <span className={`flex items-center gap-0.5 ${sort === "view" ? "font-bold text-unjong-primary" : ""}`}><Eye size={11} /> {r.view_count}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <HomeRoomPreview room={hovered} />
        </div>
      )}
    </section>
  );
}
