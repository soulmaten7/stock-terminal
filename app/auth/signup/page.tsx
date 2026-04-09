'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      setLoading(false);
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2~20자여야 합니다');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 닉네임 중복 체크
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (existing) {
      setError('이미 사용 중인 닉네임입니다');
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    if (authError) {
      setError(authError.message === 'User already registered' ? '이미 가입된 이메일입니다' : authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        nickname,
        role: 'free',
      });
    }

    router.push('/');
    router.refresh();
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-center mb-2">회원가입</h1>
        <p className="text-text-secondary text-center text-sm mb-8">무료로 시작하고 투자 데이터를 탐색하세요</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 bg-up/10 border border-up/20 rounded-lg text-up text-sm">{error}</div>
          )}

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 (2~20자)"
              required
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-border rounded-lg text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              required
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-border rounded-lg text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              required
              className="w-full pl-10 pr-10 py-3 bg-dark-800 border border-border rounded-lg text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-text-secondary" /> : <Eye className="w-4 h-4 text-text-secondary" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              required
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-border rounded-lg text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-secondary text-xs">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full py-3 bg-dark-800 border border-border rounded-lg text-sm font-medium hover:bg-dark-600 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google로 가입
          </button>
          <button
            onClick={() => handleSocialLogin('kakao')}
            className="w-full py-3 bg-[#FEE500] text-[#191919] rounded-lg text-sm font-medium hover:bg-[#FEE500]/90 flex items-center justify-center gap-2"
          >
            카카오로 가입
          </button>
        </div>

        <p className="text-center text-text-secondary text-sm mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-accent hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
