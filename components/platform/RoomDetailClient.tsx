"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { LoadingState } from "@/components/ui/State";
import { PlatformLogo, PLATFORM_LABEL } from "@/components/home-v6/platformLogo";
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
  biz_no: string | null;
  cert_verified_at: string | null;
  discussion_count: number;
  like_count: number;
  dislike_count: number;
  view_count: number;
};

export default function RoomDetailClient({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [bizNoInput, setBizNoInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [loginNotice, setLoginNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("leading_rooms")
        .select("id, platform, name, operator, description, external_url, pricing, category, is_certified, biz_no, cert_verified_at, discussion_count, like_count, dislike_count, view_count")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) {
        const r = (data as Room) ?? null;
        setRoom(r);
        if (r) { setLikes(r.like_count); setDislikes(r.dislike_count); }
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  // 조회수 +1 (페이지 진입 시 1회, RPC — RLS 우회)
  useEffect(() => {
    createAnonClient().rpc("increment_room_view", { p_room_id: id });
  }, [id]);

  useEffect(() => {
    if (!room || !user) { setVote(null); return; }
    let cancelled = false;
    (async () => {
      const supabase = createAnonClient();
      const { data } = await supabase.from("leading_room_votes").select("vote_type").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
      if (!cancelled && data) setVote(data.vote_type as "like" | "dislike");
    })();
    return () => { cancelled = true; };
  }, [room?.id, user]);

  const notifyLogin = () => { setLoginNotice(true); setTimeout(() => setLoginNotice(false), 3000); };

  const handleVote = async (dir: "like" | "dislike") => {
    if (!user || !room) return notifyLogin();
    const supabase = createAnonClient();
    if (vote === dir) {
      const { error } = await supabase.from("leading_room_votes").delete().eq("room_id", room.id).eq("user_id", user.id);
      if (!error) { setVote(null); if (dir === "like") setLikes((c) => Math.max(c - 1, 0)); else setDislikes((c) => Math.max(c - 1, 0)); }
    } else if (vote === null) {
      const { error } = await supabase.from("leading_room_votes").insert({ room_id: room.id, user_id: user.id, vote_type: dir });
      if (!error) { setVote(dir); if (dir === "like") setLikes((c) => c + 1); else setDislikes((c) => c + 1); }
    } else {
      const { error } = await supabase.from("leading_room_votes").update({ vote_type: dir }).eq("room_id", room.id).eq("user_id", user.id);
      if (!error) {
        setVote(dir);
        if (dir === "like") { setLikes((c) => c + 1); setDislikes((c) => Math.max(c - 1, 0)); }
        else { setDislikes((c) => c + 1); setLikes((c) => Math.max(c - 1, 0)); }
      }
    }
  };

  const handleVerify = async () => {
    const biz = bizNoInput.replace(/[^0-9]/g, "");
    if (biz.length < 10) { setVerifyMsg("사업자번호 숫자 10자리를 입력하세요"); return; }
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await fetch(`/api/rooms/${id}/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bizNo: biz }),
      });
      const json = await res.json();
      if (json.ok && json.verified) {
        setVerifyMsg(`✓ 인증 완료 — ${json.advisor?.company_name ?? ""}`);
        setRoom((r) => (r ? { ...r, is_certified: true, biz_no: biz, cert_verified_at: new Date().toISOString() } : r));
        setBizNoInput("");
      } else {
        setVerifyMsg(json.reason || json.error || "금감원 신고목록에서 확인 안 됨");
      }
    } catch {
      setVerifyMsg("검증 요청 실패");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <LoadingState className="p-8" title="리딩방 로딩 중..." />;
  if (!room) return <div className="p-8 text-center text-sm text-unjong-muted">리딩방을 찾을 수 없습니다.</div>;

  return (
    <div className="grid grid-cols-1 gap-4 px-6 py-4 lg:grid-cols-[360px_1fr] lg:px-10">
      {/* 좌: 방 정보 */}
      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <Link href="/rooms" className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
          <ArrowLeft size={12} /> 디렉토리
        </Link>

        <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-soft">
          {/* 헤더: 로고 + 이름 + 인증 */}
          <div className="flex items-center gap-3">
            <PlatformLogo platform={room.platform} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-unjong-primary">{room.name}</h1>
                {room.is_certified && <ShieldCheck size={15} className="shrink-0 text-emerald-600" />}
              </div>
              <p className="truncate text-xs text-unjong-muted">{PLATFORM_LABEL[room.platform] ?? "기타"} · {room.operator || "운영자 미상"} · {room.pricing || "가격 미상"}</p>
            </div>
          </div>

          <div className="mt-2">
            {room.is_certified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={12} /> 금감원 신고업체 ✓
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-unjong-background px-2 py-0.5 text-xs text-unjong-muted">신고 미확인</span>
            )}
          </div>

          {room.category && room.category.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {room.category.map((c) => (
                <span key={c} className="rounded bg-unjong-background px-1.5 py-0.5 text-xs text-unjong-muted">{c}</span>
              ))}
            </div>
          )}
          {room.description && <p className="mt-3 text-sm leading-normal text-unjong-primary">{room.description}</p>}

          {/* 투표 + 조회수 */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleVote("like")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors ${vote === "like" ? "border-[#F04452] bg-[#F04452]/5 text-[#F04452]" : "border-unjong-border text-unjong-muted hover:border-[#F04452] hover:text-[#F04452]"}`}
            >
              <ThumbsUp size={14} fill={vote === "like" ? "currentColor" : "none"} /> {likes}
            </button>
            <button
              type="button"
              onClick={() => handleVote("dislike")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors ${vote === "dislike" ? "border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6]" : "border-unjong-border text-unjong-muted hover:border-[#3182F6] hover:text-[#3182F6]"}`}
            >
              <ThumbsDown size={14} fill={vote === "dislike" ? "currentColor" : "none"} /> {dislikes}
            </button>
            <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Eye size={13} /> {room.view_count}</span>
          </div>
          {loginNotice && <p className="mt-1.5 text-[11px] text-amber-700">로그인 후 평가할 수 있어요.</p>}

          {room.is_certified && (
            <p className="mt-3 text-xs leading-normal text-unjong-muted">
              출처: 금융감독원 파인 · 유사투자자문업자 신고현황
              {room.cert_verified_at && (<> · 확인 {new Date(room.cert_verified_at).toLocaleDateString("ko-KR")}</>)}
            </p>
          )}

          {/* 입장하기 (강조) */}
          {room.external_url ? (
            <a
              href={room.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {PLATFORM_LABEL[room.platform] ?? "방"} 입장하기 <ExternalLink size={13} />
            </a>
          ) : (
            <p className="mt-3 rounded-lg bg-unjong-background py-2.5 text-center text-xs text-unjong-muted">입장 링크 미등록</p>
          )}
        </div>

        {/* 운영자 인증 (사업자번호 → 금감원 자동 대조) */}
        <div className="space-y-2 rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-soft">
          <p className="text-xs font-semibold text-unjong-primary">운영자 인증 (사업자번호)</p>
          <p className="text-[11px] leading-normal text-unjong-muted">
            금융감독원 파인 유사투자자문업자 신고목록과 자동 대조합니다. (운영자 본인 인증은 추후 적용)
          </p>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={bizNoInput}
              onChange={(e) => setBizNoInput(e.target.value)}
              placeholder="사업자번호 (숫자 10자리)"
              maxLength={20}
              className="flex-1 rounded border border-unjong-border bg-unjong-background px-2 py-1.5 text-xs text-unjong-primary focus:border-unjong-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || !bizNoInput.trim()}
              className="rounded bg-unjong-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {verifying ? "확인 중..." : "검증"}
            </button>
          </div>
          {verifyMsg && <p className="text-[11px] text-unjong-muted">{verifyMsg}</p>}
        </div>

        {/* 면책 고지 */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <p className="text-xs leading-normal text-amber-800">
            트릴리언은 투자 권유·중개를 하지 않으며, 인증 뱃지는 금융감독원 신고 여부만 의미합니다. 신고 = 수익 보장 아님. 토론·평가는 사용자 개인 의견입니다.
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
