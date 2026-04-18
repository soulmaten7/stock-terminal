import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errParam = searchParams.get('error');
  const errDesc = searchParams.get('error_description');

  console.log('[auth/callback] hit', { hasCode: !!code, errParam, errDesc, origin });

  if (errParam) {
    console.error('[auth/callback] OAuth provider 에러:', errParam, errDesc);
    return NextResponse.redirect(`${origin}/auth/login?error=provider_${errParam}`);
  }

  if (!code) {
    console.error('[auth/callback] code 파라미터 없음');
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession 실패:', {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed&msg=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    console.error('[auth/callback] exchange 성공이지만 user 없음');
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`);
  }

  console.log('[auth/callback] 로그인 성공:', { userId: data.user.id, email: data.user.email });

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .single();

  if (!existingUser) {
    const nickname = data.user.user_metadata?.nickname ||
      data.user.user_metadata?.full_name ||
      data.user.email?.split('@')[0] ||
      `user_${Date.now()}`;

    const { error: insertErr } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      nickname,
      role: 'free',
    });
    if (insertErr) {
      console.error('[auth/callback] users insert 실패:', insertErr);
    } else {
      console.log('[auth/callback] users row 생성 완료');
    }
  }

  return NextResponse.redirect(origin);
}
