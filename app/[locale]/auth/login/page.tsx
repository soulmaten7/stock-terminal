"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Mail } from "lucide-react";
import { safeNextPath } from "@/lib/authRedirect";

type Tab = "login" | "signup";

function getNext(): string {
  if (typeof window === "undefined") return "/";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

export default function LoginPage() {
  const t = useTranslations('Login');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");
  const [showForgot, setShowForgot] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [confirmSentEmail, setConfirmSentEmail] = useState<string | null>(null);
  const [needsConfirmEmail, setNeedsConfirmEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 확인 메일 재발송 쿨다운(60초) — 서버 최소 재발송 간격과 정합
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // OAuth 왕복에 로케일·복귀경로 실어보내기(쿠키). redirectTo는 불변 — Supabase 허용목록 안 건드림(710D 전례).
      const cookieOpts = `path=/; max-age=600; samesite=lax${window.location.protocol === "https:" ? "; secure" : ""}`;
      document.cookie = `post_login_locale=${locale}; ${cookieOpts}`;
      document.cookie = `post_login_next=${encodeURIComponent(getNext())}; ${cookieOpts}`;
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsConfirmEmail(null);
    if (!email.trim() || !password) { setError(t('errRequired')); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/email not confirmed/i.test(error.message)) {
          setNeedsConfirmEmail(email.trim());
          setError(t('errEmailNotConfirmed'));
          setLoading(false);
          return;
        }
        throw error;
      }
      router.push(getNext());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  const handleResend = async (targetEmail: string) => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setResendCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!nickname.trim() || !email.trim() || !password) { setError(t('errRequired')); return; }
    if (password.length < 8) { setError(t('errPasswordShort')); return; }
    setLoading(true);
    try {
      // OAuth 로그인과 동일하게 로케일을 쿠키로 실어보냄 — 확인 메일 링크도 /auth/callback으로 복귀하므로
      // 콜백이 이 쿠키를 읽어 로케일 프리픽스를 복원한다(710D 전례 재사용).
      document.cookie = `post_login_locale=${locale}; path=/; max-age=600; samesite=lax${window.location.protocol === "https:" ? "; secure" : ""}`;
      const supabase = createClient();
      // ⚠️ handle_new_user 트리거(마이그레이션 016)가 raw_user_meta_data의 'name' 키를 닉네임으로 읽음
      // (OAuth 콜백과 동일 트리거 공유) — 여기서도 반드시 'name' 키로 실어야 트리거가 닉네임을 반영한다.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: nickname.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`, // 허용목록에 이미 있는 OAuth 콜백 재사용(710D 전례 — 새 URL 추가 금지)
        },
      });
      if (error) {
        if (/already registered|already exists/i.test(error.message)) {
          setError(t('errEmailExists'));
        } else {
          setError(error.message);
        }
        return;
      }
      // 이미 가입된 이메일이면 Supabase가 에러 없이 identities: []로만 응답하는 경우가 있음
      // (이넘메레이션 방지) — 동일 안내로 처리.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError(t('errEmailExists'));
        return;
      }
      // "Confirm email" ON(정식) — signUp이 세션 없이 반환되면 확인 메일 발송 상태.
      // 폼 대신 안내 화면으로 전환(STEP 761 · 758의 임시 문구 signupNeedsConfirm 대체).
      if (!data.session) {
        setConfirmSentEmail(email.trim());
        setResendCooldown(60); // 방금 발송됐으므로 서버 최소 재발송 간격과 정합
        return;
      }
      router.push(getNext());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) { setError(t('errRequired')); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setInfo(t('resetSent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-md border border-unjong-border bg-unjong-background px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-unjong-background p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 — 홈 고정이 아니라 직전 화면으로(히스토리 없으면 홈). 종목 상세와 동일 동작. */}
        <button
          type="button"
          onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-primary mb-6"
        >
          <ArrowLeft size={20} />
          {t('back')}
        </button>

        {/* 트릴리언 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider text-unjong-primary mb-2">
            Trillion {locale === 'ko' && <span className="text-base text-unjong-muted font-medium">{t('brandKo')}</span>}
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

          {confirmSentEmail ? (
            <div className="space-y-4 text-center">
              <Mail className="mx-auto text-unjong-accent" size={32} />
              <div>
                <p className="text-sm font-semibold text-unjong-primary">{t('confirmSentTitle', { email: confirmSentEmail })}</p>
                <p className="mt-1 text-sm text-unjong-muted">{t('confirmSentDesc')}</p>
                <p className="mt-1 text-xs text-unjong-muted">{t('confirmSentSpam')}</p>
              </div>
              <button
                type="button"
                onClick={() => handleResend(confirmSentEmail)}
                disabled={loading || resendCooldown > 0}
                className="w-full rounded-md bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {resendCooldown > 0 ? t('resendCooldown', { s: resendCooldown }) : loading ? t('resending') : t('resendConfirm')}
              </button>
              {error && (
                <p className="text-sm text-unjong-danger text-center">
                  ❌ {error}
                </p>
              )}
            </div>
          ) : (
            <>
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

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-unjong-border" />
                <span className="text-xs text-unjong-muted">{t('or')}</span>
                <div className="h-px flex-1 bg-unjong-border" />
              </div>

              {/* 탭: 로그인 / 회원가입 */}
              <div className="flex gap-1 rounded-md border border-unjong-border p-1">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setShowForgot(false); setError(null); setInfo(null); setNeedsConfirmEmail(null); }}
                  className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold transition-colors ${tab === 'login' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                >
                  {t('tabLogin')}
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setShowForgot(false); setError(null); setInfo(null); setNeedsConfirmEmail(null); }}
                  className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold transition-colors ${tab === 'signup' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                >
                  {t('tabSignup')}
                </button>
              </div>

              {tab === 'login' ? (
                showForgot ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-unjong-muted">{t('fieldEmail')}</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="w-full rounded-md bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {loading ? t('sendingResetEmail') : t('sendResetEmail')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setError(null); setInfo(null); }}
                      className="w-full text-center text-xs text-unjong-muted hover:text-unjong-accent"
                    >
                      {t('forgotBack')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-unjong-muted">{t('fieldEmail')}</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-unjong-muted">{t('fieldPassword')}</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setError(null); setInfo(null); }}
                      className="text-xs text-unjong-muted hover:text-unjong-accent"
                    >
                      {t('forgotPassword')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-md bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {loading ? t('loginSubmitting') : t('loginSubmit')}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleSignup} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-unjong-muted">{t('fieldNickname')}</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} autoComplete="nickname" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-unjong-muted">{t('fieldEmail')}</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-unjong-muted">{t('fieldPassword')} <span className="text-unjong-muted">({t('fieldPasswordHint')})</span></label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" minLength={8} />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {loading ? t('signupSubmitting') : t('signupSubmit')}
                  </button>
                </form>
              )}

              {error && (
                <p className="text-sm text-unjong-danger text-center">
                  ❌ {error}
                </p>
              )}
              {needsConfirmEmail && (
                <button
                  type="button"
                  onClick={() => handleResend(needsConfirmEmail)}
                  disabled={loading || resendCooldown > 0}
                  className="w-full rounded-md border border-unjong-border py-2 text-xs font-semibold text-unjong-accent disabled:opacity-50"
                >
                  {resendCooldown > 0 ? t('resendCooldown', { s: resendCooldown }) : loading ? t('resending') : t('resendConfirm')}
                </button>
              )}
              {info && (
                <p className="text-sm text-unjong-accent text-center">
                  {info}
                </p>
              )}
            </>
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
