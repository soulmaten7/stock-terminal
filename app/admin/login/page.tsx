'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'checking' | 'login' | 'denied'>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPhase('login'); return; }
      const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (me?.role === 'admin') router.replace('/admin');
      else setPhase('denied');
    })();
  }, [router]);

  const login = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
  };

  return (
    <div className="flex min-h-[calc(100svh_-_61px)] items-center justify-center bg-unjong-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 text-unjong-accent" size={28} />
        <h1 className="text-lg font-bold text-unjong-primary">트릴리언 관리자</h1>
        <p className="mt-1 text-sm text-unjong-muted">관리자 전용 페이지입니다.</p>
        {phase === 'checking' ? (
          <p className="mt-6 text-sm text-unjong-muted">확인 중…</p>
        ) : phase === 'denied' ? (
          <p className="mt-6 text-sm text-unjong-danger">이 계정은 관리자 권한이 없습니다.</p>
        ) : (
          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-unjong-border bg-unjong-surface py-3 font-semibold text-[#1f1f1f] transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
            </svg>
            {loading ? '이동 중…' : '관리자 Google 로그인'}
          </button>
        )}
        <a href="/" className="mt-4 inline-block text-xs text-unjong-muted hover:text-unjong-primary">← 홈으로</a>
      </div>
    </div>
  );
}
