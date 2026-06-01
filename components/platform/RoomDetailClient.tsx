"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { LoadingState } from "@/components/ui/State";
import PlatformDiscussionBoard from "./PlatformDiscussionBoard";

type Room = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  description: string | null;
  external_url: string | null;
  pricing: string | null;
  category: string[] | null;
  is_certified: boolean;
  discussion_count: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램", kakao: "카카오", discord: "디스코드",
  naver_band: "네이버밴드", naver_cafe: "네이버카페", youtube: "유튜브", other: "기타",
};

export default function RoomDetailClient({ id }: { id: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("leading_rooms")
        .select("id, platform, name, operator, description, external_url, pricing, category, is_certified, discussion_count")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) { setRoom((data as Room) ?? null); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingState className="p-8" title="리딩방 로딩 중..." />;
  if (!room) return <div className="p-8 text-center text-sm text-unjong-muted">리딩방을 찾을 수 없습니다.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 px-6 lg:px-10 py-4">
      {/* 좌: 리딩방 정보 */}
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-3">
        <Link href="/rooms" className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
          <ArrowLeft size={12} /> 리딩방 디렉토리
        </Link>
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {PLATFORM_LABEL[room.platform] ?? "기타"}
            </span>
            {room.is_certified && (
              <span className="flex items-center gap-1 text-xs font-semibold text-unjong-accent">
                <ShieldCheck size={12} /> 인증
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-unjong-primary">{room.name}</h1>
          <p className="text-xs text-unjong-muted mb-3">{room.operator || "운영자 미상"} · {room.pricing || "가격 미상"}</p>
          {room.category && room.category.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {room.category.map((c) => (
                <span key={c} className="text-xs px-1.5 py-0.5 rounded bg-unjong-background text-unjong-muted">{c}</span>
              ))}
            </div>
          )}
          {room.description && <p className="text-sm text-unjong-primary leading-normal mb-3">{room.description}</p>}
          {room.external_url && (
            <a
              href={room.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-md border border-unjong-border py-2 text-sm text-unjong-primary hover:border-unjong-accent transition-colors"
            >
              가입 링크 <ExternalLink size={12} />
            </a>
          )}
        </div>

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-normal">
            운종은 평가하지 않습니다. 가입·결제 전 충분히 검토하세요. 손실 책임은 본인에게 있습니다.
          </p>
        </div>
      </aside>

      {/* 우: 평가 토론 */}
      <main>
        <PlatformDiscussionBoard targetType="room" targetId={id} />
      </main>
    </div>
  );
}
