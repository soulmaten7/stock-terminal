// CN 티커(0700.HK / 600519.SS / 000001.SZ) → 중국어명. R3 중국 뉴스를 진짜 중국어로 검색하기 위함.
// 소스 = cn_names 테이블(HK=HKEX 번체 / A주=텐센트 qt.gtimg.cn 간체). 없으면 null → 호출측이 야후 영어명 폴백.
export async function getCnName(symbol: string): Promise<string | null> {
  if (!/\.(HK|SS|SZ)$/i.test(symbol)) return null;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('cn_names')
    .select('name_zh')
    .eq('sym', symbol.toUpperCase())
    .maybeSingle();
  return (data as { name_zh: string } | null)?.name_zh ?? null;
}
