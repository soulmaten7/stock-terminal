"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-unjong-background p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 */}
        <Link
          href="/kr"
          className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary mb-6"
        >
          <ArrowLeft size={14} />
          돌아가기
        </Link>

        {/* 운종 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider text-unjong-primary mb-2">
            UNJONG <span className="text-base text-unjong-muted font-medium">운종</span>
          </h1>
          <p className="text-xs text-unjong-muted">한국 주식 동선의 출발점</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-unjong-primary mb-1">로그인</h2>
            <p className="text-xs text-unjong-muted">
              로그인하면 닉네임과 관심종목이 모든 기기에서 동기화됩니다
            </p>
          </div>

          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#FEE500] text-[#000] font-semibold py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <MessageCircle size={18} />
            {loading ? "이동 중..." : "카카오로 시작하기"}
          </button>

          {error && (
            <p className="text-xs text-unjong-danger text-center">
              ❌ {error}
            </p>
          )}

          <div className="border-t border-unjong-border pt-4 text-center space-y-1">
            <p className="text-[10px] text-unjong-muted">
              로그인 없이도 채팅·관심종목 사용 가능합니다
            </p>
            <p className="text-[10px] text-unjong-muted">
              단 닉네임·관심종목이 이 브라우저에만 저장됩니다
            </p>
          </div>
        </div>

        {/* 약관 */}
        <p className="text-[10px] text-unjong-muted text-center mt-6 leading-relaxed">
          로그인 시 운종의 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link> 에 동의한 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
