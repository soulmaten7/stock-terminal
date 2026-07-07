// GB 티커(HSBA.L) → 영문 종목명(클린, 예: "HSBC Holdings"). R3 영국 뉴스 검색어용(야후 shortName은 "HSBC HOLDINGS PLC ORD..."로 지저분).
// 소스 = gb_names 테이블(Wikipedia FTSE 350 시드). 없으면 null → 호출측이 야후 영문명 폴백.
export async function getGbName(symbol: string): Promise<string | null> {
  if (!/\.L$/i.test(symbol)) return null;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('gb_names')
    .select('name_en')
    .eq('sym', symbol.toUpperCase())
    .maybeSingle();
  return (data as { name_en: string } | null)?.name_en ?? null;
}
