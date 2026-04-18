import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BAD_WORDS = ['씨발', '개새끼', '좆'];
const RATE_LIMIT_PER_MINUTE = 5;

function extractStockTags(content: string): string[] {
  const matches = content.match(/\$(\d{6})/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1))));
}

function containsBadWord(content: string): boolean {
  return BAD_WORDS.some((w) => content.includes(w));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const { content } = await req.json();
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: '내용 필요' }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: '500자 초과' }, { status: 400 });
  }
  if (containsBadWord(content)) {
    return NextResponse.json({ error: '금지어 포함' }, { status: 400 });
  }

  const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
    return NextResponse.json({ error: '분당 5개 초과' }, { status: 429 });
  }

  const stock_tags = extractStockTags(content);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, content, stock_tags })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
