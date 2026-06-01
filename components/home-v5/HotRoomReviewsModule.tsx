"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Room = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  is_certified: boolean;
  discussion_count: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램", kakao: "카카오", discord: "디스코드",
  naver_band: "네이버밴드", naver_cafe: "네이버카페", youtube: "유튜브", other: "기타",
};

export default function HotRoomReviewsModule() {
  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, is_certified, discussion_count")
          .eq("hidden", false)
          .order("discussion_count", { ascending: false })
          .limit(5);
        if (!cancelled) setItems((data || []) as Room[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-unjong-primary flex items-center gap-1.5">
          📡 HOT 리딩방 평가
        </h2>
        <Link href="/rooms" className="text-xs text-unjong-accent hover:underline font-medium">
          전체 보기 →
        </Link>
      </header>

      {loading ? (
        <LoadingState title="로딩 중..." />
      ) : items.length === 0 ? (
        <EmptyState icon="📡" title="등록된 리딩방이 없습니다" />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id}>
              <Link href={`/room/${r.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-unjong-background transition-colors">
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                  {PLATFORM_LABEL[r.platform] ?? "기타"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-unjong-primary truncate flex items-center gap-1">
                    {r.name}
                    {r.is_certified && <ShieldCheck size={12} className="text-unjong-accent flex-shrink-0" />}
                  </p>
                  <p className="text-xs text-unjong-muted truncate">{r.operator || "운영자 미상"}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-unjong-muted flex-shrink-0">
                  <MessageCircle size={12} /> {r.discussion_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
