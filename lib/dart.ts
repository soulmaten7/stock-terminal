// DART OpenAPI 래퍼.
// 인증키: https://opendart.fss.or.kr/ 무료 발급 후 .env.local 에 DART_API_KEY=... 로 설정.
// 키 없으면 에러 throw — 호출 측에서 try-catch 로 처리.

const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

export class DartKeyMissingError extends Error {
  constructor() {
    super('DART_API_KEY not set');
    this.name = 'DartKeyMissingError';
  }
}

export async function fetchDart<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) throw new DartKeyMissingError();

  const url = new URL(`${DART_BASE_URL}${endpoint}`);
  url.searchParams.set('crtfc_key', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`DART API HTTP ${res.status}`);
  const data = await res.json();
  if (data.status && data.status !== '000') {
    throw new Error(`DART API status=${data.status} msg=${data.message ?? 'unknown'}`);
  }
  return data as T;
}

export async function getDartCorpCode(symbol: string): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('dart_corp_codes')
    .select('corp_code')
    .eq('stock_code', symbol)
    .maybeSingle();
  return (data as { corp_code: string } | null)?.corp_code ?? null;
}

// KR 6자리(005930·005930.KS) → DART 한글 종목명(예: "삼성전자"). R3 한국 뉴스 검색어용.
export async function getDartCorpName(symbol: string): Promise<string | null> {
  const code6 = symbol.replace(/\.(KS|KQ)$/i, '').trim();
  if (!/^\d{6}$/.test(code6)) return null;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('dart_corp_codes')
    .select('corp_name')
    .eq('stock_code', code6)
    .maybeSingle();
  return (data as { corp_name: string } | null)?.corp_name ?? null;
}
