import { createClient } from '@/lib/supabase/client';

export async function getWatchlist(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function addToWatchlist(userId: string, symbol: string, country: string = 'KR') {
  const supabase = createClient();
  const { error } = await supabase
    .from('watchlists')
    .insert({ user_id: userId, symbol, country });
  return !error;
}

export async function removeFromWatchlist(userId: string, symbol: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol);
  return !error;
}

export async function isInWatchlist(userId: string, symbol: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .limit(1);
  return (data?.length || 0) > 0;
}

export async function getWatchlistSymbols(userId: string): Promise<string[]> {
  const items = await getWatchlist(userId);
  return items.map((i: { symbol: string }) => i.symbol);
}
