import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const BAD_WORDS = ['씨발', '개새끼', '좆'];
const RATE_LIMIT_PER_MINUTE = 5;

// $토큰 매칭 — 한글·영문·숫자. ex: $삼성전자, $005930, $NAVER
const STOCK_TAG_REGEX = /\$([가-힣A-Za-z0-9]+)/g;

async function extractStockTags(
  content: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const tokens = Array.from(content.matchAll(STOCK_TAG_REGEX)).map((m) => m[1]);
  if (tokens.length === 0) return [];

  const symbols = new Set<string>();
  const namesToLookup: string[] = [];

  for (const tok of tokens) {
    // 6자리 숫자는 symbol 로 직접 사용
    if (/^\d{6}$/.test(tok)) {
      symbols.add(tok);
    } else {
      namesToLookup.push(tok);
    }
  }

  if (namesToLookup.length > 0) {
    const unique = Array.from(new Set(namesToLookup));
    // name_ko 또는 name_en 과 정확히 일치하는 종목 조회
    const [byKo, byEn] = await Promise.all([
      supabase.from('stocks').select('symbol').eq('is_active', true).in('name_ko', unique),
      supabase.from('stocks').select('symbol').eq('is_active', true).in('name_en', unique),
    ]);
    for (const row of [...(byKo.data ?? []), ...(byEn.data ?? [])] as { symbol: string }[]) {
      symbols.add(row.symbol);
    }
  }

  return Array.from(symbols);
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

  const raw = await req.json().catch(() => null);
  const content: unknown = raw?.content;
  if (typeof content !== 'string') {
    return NextResponse.json({ error: '내용 필요' }, { status: 400 });
  }
  // 공백·제로폭 문자 제거 후 빈 문자열 차단 (프론트엔드 trim 보완)
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return NextResponse.json({ error: '내용 필요' }, { status: 400 });
  }
  if (trimmed.length > 500) {
    return NextResponse.json({ error: '500자 초과' }, { status: 400 });
  }
  if (containsBadWord(trimmed)) {
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

  const stock_tags = await extractStockTags(trimmed, supabase);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, content: trimmed, stock_tags })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
