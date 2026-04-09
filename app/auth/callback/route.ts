import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 사용자 프로필이 없으면 생성
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

        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          nickname,
          role: 'free',
        });
      }

      return NextResponse.redirect(origin);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
