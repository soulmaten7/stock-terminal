"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, Eye, ShieldCheck, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/components/ui/State";

type Room = {
  id: string;
  platform: string;
  name: string;
  is_certified: boolean;
  like_count: number;
  dislike_count: number;
  view_count: number;
};

const PLATFORM_DOMAIN: Record<string, string> = {
  telegram: "telegram.org",
  kakao: "kakaocorp.com",
  discord: "discord.com",
  naver_band: "band.us",
  naver_cafe: "naver.com",
  youtube: "youtube.com",
};
const PLATFORM_EMOJI: Record<string, string> = {
  telegram: "✈️",
  kakao: "💬",
  discord: "🎮",
  naver_band: "🟢",
  naver_cafe: "☕",
  youtube: "▶️",
  other: "📡",
};
const LOGODEV = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;

function PlatformLogo({ platform, size = 28 }: { platform: string; size?: number }) {
  const [err, setErr] = useState(false);
  const domain = PLATFORM_DOMAIN[platform];
  const url = domain && LOGODEV ? `https://img.logo.dev/${domain}?token=${LOGODEV}&size=128&retina=true` : null;
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="shrink-0 rounded-full border border-unjong-border bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-unjong-background"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {PLATFORM_EMOJI[platform] ?? PLATFORM_EMOJI.other}
    </span>
  );
}

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
          .select("id, platform, name, is_certified, like_count, dislike_count, view_count")
          .eq("hidden", false)
          .order("is_certified", { ascending: false })
          .order("like_count", { ascending: false })
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
      {/* 운종 정체성 경고 — 평가 X, 사실·평가만 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">
          운종은 리딩방을 <b>평가하지 않아요</b>. 금감원 신고 여부(사실)와 사용자 평가만 보여줘요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.
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
                <PlatformLogo platform={r.platform} size={28} />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-unjong-primary">{r.name}</span>
                  {r.is_certified ? (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <ShieldCheck size={10} /> 금감원 신고 ✓
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">신고 미확인</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums text-unjong-muted">
                  <span className="flex items-center gap-0.5"><ThumbsUp size={11} /> {r.like_count}</span>
                  <span className="flex items-center gap-0.5"><ThumbsDown size={11} /> {r.dislike_count}</span>
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
