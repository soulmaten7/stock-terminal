// VN 티커(VIC.VN) → 베트남어 종목명. R3 베트남 뉴스를 진짜 베트남어로 검색하기 위함.
// 소스 = vn_names 테이블(vnstock listing_companies·HOSE organ_name). 없으면 null → 호출측이 야후 영문명 폴백.
export async function getVnName(symbol: string): Promise<string | null> {
  if (!/\.VN$/i.test(symbol)) return null;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('vn_names')
    .select('name_vi')
    .eq('sym', symbol.toUpperCase())
    .maybeSingle();
  return (data as { name_vi: string } | null)?.name_vi ?? null;
}
