import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('stock_tags')
    .gte('created_at', tenMinAgo)
    .eq('hidden', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, number>();
  (data ?? []).forEach((row: { stock_tags: string[] }) => {
    (row.stock_tags ?? []).forEach((s) => {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
  });

  const top = Array.from(counts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ hotStocks: top, refreshedAt: new Date().toISOString() });
}
