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
  biz_no: string | null;
  cert_verified_at: string | null;
  discussion_count: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램", kakao: "카카오", discord: "디스코드",
  naver_band: "네이버밴드", naver_cafe: "네이버카페", youtube: "유튜브", other: "기타",
};

export default function RoomDetailClient({ id }: { id: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [bizNoInput, setBizNoInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("leading_rooms")
        .select("id, platform, name, operator, description, external_url, pricing, category, is_certified, biz_no, cert_verified_at, discussion_count")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) { setRoom((data as Room) ?? null); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 px-6 lg:px-10 py-4">
      {/* 좌: 리딩방 정보 */}
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-3">
        <Link href="/rooms" className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
          <ArrowLeft size={12} /> 리딩방 디렉토리
        </Link>
        <div className="bg-unjong-surface rounded-2xl border border-unjong-border p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {PLATFORM_LABEL[room.platform] ?? "기타"}
            </span>
            {room.is_certified ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 text-[#1AC267] text-xs font-semibold px-2 py-0.5">
                <ShieldCheck size={12} /> 금감원 신고업체 ✓
              </span>
            ) : (
              <span className="rounded-full bg-unjong-background text-unjong-muted text-xs px-2 py-0.5">신고 미확인</span>
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

          {room.is_certified && (
            <p className="text-xs text-unjong-muted mb-3 leading-normal">
              출처: 금융감독원 파인 · 유사투자자문업자 신고현황
              {room.cert_verified_at && (
                <> · 확인 {new Date(room.cert_verified_at).toLocaleDateString("ko-KR")}</>
              )}
            </p>
          )}

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

        {/* 운영자 인증 (사업자번호 → 금감원 자동 대조) */}
        <div className="bg-unjong-surface rounded-2xl border border-unjong-border p-4 shadow-soft space-y-2">
          <p className="text-xs font-semibold text-unjong-primary">운영자 인증 (사업자번호)</p>
          <p className="text-[11px] text-unjong-muted leading-normal">
            금융감독원 파인 유사투자자문업자 신고목록과 자동 대조합니다. (운영자 본인 인증은 추후 적용)
          </p>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={bizNoInput}
              onChange={(e) => setBizNoInput(e.target.value)}
              placeholder="사업자번호 (숫자 10자리)"
              maxLength={20}
              className="flex-1 text-xs px-2 py-1.5 rounded border border-unjong-border bg-unjong-background text-unjong-primary focus:outline-none focus:border-unjong-accent"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || !bizNoInput.trim()}
              className="text-xs bg-unjong-accent text-white font-semibold px-3 py-1.5 rounded disabled:opacity-50"
            >
              {verifying ? "확인 중..." : "검증"}
            </button>
          </div>
          {verifyMsg && <p className="text-[11px] text-unjong-muted">{verifyMsg}</p>}
        </div>

        {/* 면책 고지 (V6 §11) */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-normal">
            운종은 투자 권유·중개를 하지 않으며, 인증 뱃지는 금융감독원 신고 여부만 의미합니다.
            신고 = 수익 보장 아님. 토론은 사용자 개인 의견입니다.
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
