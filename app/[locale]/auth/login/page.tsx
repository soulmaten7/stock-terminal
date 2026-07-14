"use client";

import { useState } from "react";
import { useRouter, Link, getPathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations('Login');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // 로그인 후 복귀 경로 = 지금 보던 언어의 홈. getPathname이 routing(as-needed)대로 뽑는다: ko → '/' · en → '/en'.
      // 콜백 라우트(/auth/callback)는 구글·Supabase에 등록된 고정 URL이라 경로를 절대 바꾸지 않는다.
      // 로케일은 오직 next(앱 내부 상대경로) 쿼리로만 실어 보낸다 — admin 로그인이 이미 쓰는 방식(?next=/admin).
      const next = getPathname({ href: '/', locale });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
        {/* 뒤로가기 — 홈 고정이 아니라 직전 화면으로(히스토리 없으면 홈). 종목 상세와 동일 동작. */}
        <button
          type="button"
          onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }}
          className="inline-flex items-center gap-1 text-sm text-unjong-muted hover:text-unjong-primary mb-6"
        >
          <ArrowLeft size={14} />
          {t('back')}
        </button>

        {/* 트릴리언 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider text-unjong-primary mb-2">
            Trillion <span className="text-base text-unjong-muted font-medium">{t('brandKo')}</span>
          </h1>
          <p className="text-sm text-unjong-muted">{t('tagline')}</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-unjong-primary mb-1">{t('heading')}</h2>
            <p className="text-sm text-unjong-muted">
              {t('desc')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-[#1f1f1f] font-semibold py-3 border border-unjong-border hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
            </svg>
            {loading ? t('loading') : t('google')}
          </button>

          {error && (
            <p className="text-sm text-unjong-danger text-center">
              ❌ {error}
            </p>
          )}

          <div className="border-t border-unjong-border pt-4 text-center space-y-1">
            <p className="text-xs text-unjong-muted">
              {t('note1')}
            </p>
            <p className="text-xs text-unjong-muted">
              {t('note2')}
            </p>
          </div>
        </div>

        {/* 약관 */}
        <p className="text-xs text-unjong-muted text-center mt-6 leading-relaxed">
          {t.rich('terms', {
            terms: (c) => <Link href="/terms" className="underline">{c}</Link>,
            privacy: (c) => <Link href="/privacy" className="underline">{c}</Link>,
          })}
        </p>
      </div>
    </div>
  );
}
