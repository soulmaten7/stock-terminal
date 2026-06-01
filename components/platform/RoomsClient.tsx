"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle, Eye, ShieldCheck, AlertTriangle } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Room = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  description: string | null;
  pricing: string | null;
  category: string[] | null;
  is_certified: boolean;
  discussion_count: number;
  view_count: number;
};

const PLATFORM_META: Record<string, { label: string; cls: string }> = {
  telegram: { label: "텔레그램", cls: "bg-sky-50 text-sky-700" },
  kakao: { label: "카카오", cls: "bg-yellow-50 text-yellow-800" },
  discord: { label: "디스코드", cls: "bg-indigo-50 text-indigo-700" },
  naver_band: { label: "네이버밴드", cls: "bg-emerald-50 text-emerald-700" },
  naver_cafe: { label: "네이버카페", cls: "bg-emerald-50 text-emerald-700" },
  youtube: { label: "유튜브", cls: "bg-red-50 text-red-700" },
  other: { label: "기타", cls: "bg-slate-100 text-slate-600" },
};

const PLATFORMS = [
  { value: "all", label: "전체" },
  { value: "telegram", label: "텔레그램" },
  { value: "kakao", label: "카카오" },
  { value: "discord", label: "디스코드" },
  { value: "youtube", label: "유튜브" },
  { value: "other", label: "기타" },
];

export default function RoomsClient() {
  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const supabase = createAnonClient();
      let q = supabase
        .from("leading_rooms")
        .select("id, platform, name, operator, description, pricing, category, is_certified, discussion_count, view_count")
        .eq("hidden", false)
        .order("is_certified", { ascending: false })
        .order("discussion_count", { ascending: false });
      if (platform !== "all") q = q.eq("platform", platform);
      const { data } = await q;
      if (cancelled) return;
      setItems((data || []) as Room[]);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [platform]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-unjong-primary mb-2">📡 리딩방 디렉토리</h1>
        <p className="text-sm text-unjong-muted">
          텔레그램·카톡방·유튜브 등 리딩방을 사용자 후기와 함께 확인하세요.
        </p>
      </header>

      {/* 경고 안내문 — 리딩방은 가짜·작전 많음 */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-normal">
          운종은 리딩방을 <strong>평가하지 않습니다</strong>. 사용자 토론만 제공합니다. 리딩방은 허위·작전·과장이 많으니
          가입·결제 전 충분히 검토하고, 손실 책임은 본인에게 있습니다.
        </p>
      </div>

      <nav className="flex gap-2 mb-4 border-b border-unjong-border pb-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPlatform(p.value)}
            className={`text-sm px-3 py-1.5 rounded ${
              platform === p.value
                ? "bg-unjong-accent text-white font-semibold"
                : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
            }`}
          >
            {p.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <LoadingState title="리딩방 로딩 중..." />
      ) : items.length === 0 ? (
        <EmptyState icon="📡" title="등록된 리딩방이 없습니다" description="운영진이 곧 추가합니다." />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r) => {
            const pm = PLATFORM_META[r.platform] ?? PLATFORM_META.other;
            return (
              <li key={r.id}>
                <Link
                  href={`/room/${r.id}`}
                  className="block bg-unjong-surface rounded-2xl border border-unjong-border p-5 shadow-soft hover:shadow-soft-hover transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${pm.cls}`}>{pm.label}</span>
                    {r.is_certified && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-unjong-accent">
                        <ShieldCheck size={12} /> 인증
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-unjong-primary mb-1">{r.name}</h3>
                  <p className="text-xs text-unjong-muted mb-2">{r.operator || "운영자 미상"} · {r.pricing || "가격 미상"}</p>
                  {r.description && <p className="text-sm text-unjong-primary line-clamp-2 mb-3">{r.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-unjong-muted">
                    <span className="flex items-center gap-1"><MessageCircle size={11} /> {r.discussion_count}</span>
                    <span className="flex items-center gap-1"><Eye size={11} /> {r.view_count}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
