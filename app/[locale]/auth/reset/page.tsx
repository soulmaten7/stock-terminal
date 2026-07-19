"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const t = useTranslations('Login');
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const inputClass = "w-full rounded-md border border-unjong-border bg-unjong-background px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError(t('errPasswordShort')); return; }
    if (password !== password2) { setError(t('errPasswordMismatch')); return; }
    setLoading(true);
    try {
      // 이메일 링크 클릭 시 Supabase 클라이언트가 URL의 복구 토큰을 감지해 임시 세션을 이미 세워둔 상태
      // (detectSessionInUrl 기본값) — 여기서는 그 세션으로 새 비밀번호만 지정하면 된다.
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-unjong-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 space-y-6">
          <h1 className="text-lg font-semibold text-unjong-primary text-center">{t('resetHeading')}</h1>

          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-unjong-primary">{t('resetDone')}</p>
              <Link href="/auth/login" className="inline-block text-sm font-semibold text-unjong-accent">{t('resetGoLogin')}</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-unjong-muted">{t('fieldNewPassword')} <span className="text-unjong-muted">({t('fieldPasswordHint')})</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" minLength={8} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-unjong-muted">{t('fieldNewPasswordConfirm')}</label>
                <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputClass} autoComplete="new-password" minLength={8} />
              </div>
              {error && <p className="text-sm text-unjong-danger text-center">❌ {error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? t('resetSubmitting') : t('resetSubmit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
