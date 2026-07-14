import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// next = 로그인 후 돌아갈 앱 내부 경로(로케일 포함: ko → '/' · en → '/en').
// 반드시 '/'로 시작하는 상대경로만 허용 — '//evil.com'·'https://evil.com'을 그대로 쓰면 오픈 리다이렉트가 된다.
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

// 에러로 로그인 화면에 되돌릴 때도 보던 언어를 유지한다(/en에서 실패 → /en/auth/login).
function loginPath(next: string): string {
  const isEn = next === '/en' || next.startsWith('/en/');
  return `${isEn ? '/en' : ''}/auth/login`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errParam = searchParams.get('error');
  const next = safeNext(searchParams.get('next'));
  const login = `${origin}${loginPath(next)}`;

  if (errParam) {
    return NextResponse.redirect(`${login}?error=provider_${errParam}`);
  }

  if (!code) {
    return NextResponse.redirect(`${login}?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${login}?error=exchange_failed`);
  }

  // DB 트리거(handle_new_user, 마이그레이션 016)가 users 행을 자동 생성하지만,
  // 트리거 미적용 환경 대비 폴백 insert (ON CONFLICT 격 — 존재 시 skip).
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .single();

  if (!existingUser) {
    const meta = data.user.user_metadata ?? {};
    const nickname =
      meta.name ||
      meta.nickname ||
      meta.full_name ||
      data.user.email?.split('@')[0] ||
      `트레이더-${data.user.id.slice(0, 4)}`;

    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email ?? `${data.user.id}@unjong.local`,
      nickname,
      role: 'free',
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
