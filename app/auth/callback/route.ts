import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errParam = searchParams.get('error');
  const next = searchParams.get('next') ?? '/';

  if (errParam) {
    return NextResponse.redirect(`${origin}/auth/login?error=provider_${errParam}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
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
