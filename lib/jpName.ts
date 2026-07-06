// JP 티커(7203.T) → 일본어 종목명("トヨタ自動車"). R3 일본 뉴스를 진짜 일본어로 검색하기 위함.
// 소스 = jp_names 테이블(JPX 東証上場銘柄一覧 시드). 없으면 null → 호출측이 야후 영어명으로 폴백.
export async function getJpName(symbol: string): Promise<string | null> {
  const code = symbol.replace(/\.T$/i, '').trim();
  if (!/^\d{4}$/.test(code)) return null;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('jp_names')
    .select('name_ja')
    .eq('code', code)
    .maybeSingle();
  return (data as { name_ja: string } | null)?.name_ja ?? null;
}
