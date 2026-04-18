import { NextRequest, NextResponse } from 'next/server';
import { fetchDart, getDartCorpCode, DartKeyMissingError } from '@/lib/dart';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }

  try {
    const corpCode = await getDartCorpCode(symbol);
    if (!corpCode) {
      return NextResponse.json(
        { error: 'corp_code not found — run scripts/seed-dart-corpcodes.py' },
        { status: 404 }
      );
    }

    const raw = await fetchDart<{
      corp_name: string;
      ceo_nm: string;
      adres: string;
      hm_url: string;
      phn_no: string;
      induty_code: string;
      est_dt: string;
    }>('/company.json', { corp_code: corpCode });

    return NextResponse.json({
      symbol,
      name: raw.corp_name,
      ceo: raw.ceo_nm,
      address: raw.adres,
      homepage: raw.hm_url,
      phone: raw.phn_no,
      industry: raw.induty_code,
      established: raw.est_dt,
    });
  } catch (err) {
    if (err instanceof DartKeyMissingError) {
      return NextResponse.json(
        { error: 'DART_API_KEY not configured', fallback: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
