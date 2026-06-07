"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ShieldCheck, AlertTriangle, MessageCircle, Eye } from "lucide-react";
import { LoadingState } from "@/components/ui/State";

type Room = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  pricing: string | null;
  is_certified: boolean;
  discussion_count: number;
  view_count: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램",
  kakao: "카카오",
  discord: "디스코드",
  naver_band: "네이버밴드",
  naver_cafe: "네이버카페",
  youtube: "유튜브",
  other: "기타",
};

export default function HomeRoomRanking() {
  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, is_certified, discussion_count, view_count")
          .eq("hidden", false)
          .order("is_certified", { ascending: false })
          .order("discussion_count", { ascending: false })
          .order("view_count", { ascending: false })
          .limit(10);
        if (!cancelled) setItems((data as Room[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 운종 정체성 경고 — 평가 X, 사실·토론만 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">
          운종은 리딩방을 <b>평가하지 않아요</b>. 금감원 신고 여부(사실)와 사용자 토론만 보여줘요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.
        </p>
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 text-2xl">📡</span>
          <p className="text-sm font-medium text-unjong-primary">아직 등록된 리딩방이 없어요</p>
          <Link href="/discussion" className="mt-3 inline-block rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            리딩방 디렉토리 보기 →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-unjong-border">
          {items.map((r, i) => (
            <li key={r.id}>
              <Link href={`/room/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-unjong-background">
                <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums text-unjong-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-unjong-primary">{r.name}</span>
                    {r.is_certified ? (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ShieldCheck size={10} /> 금감원 신고 ✓
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">신고 미확인</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-unjong-muted">
                    {PLATFORM_LABEL[r.platform] ?? "기타"} · {r.operator || "운영자 미상"} · {r.pricing || "가격 미상"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5 text-[11px] text-unjong-muted">
                  <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {r.discussion_count}</span>
                  <span className="flex items-center gap-0.5"><Eye size={11} /> {r.view_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
