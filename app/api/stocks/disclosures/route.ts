import { NextRequest, NextResponse } from 'next/server';
import { fetchDart, getDartCorpCode, DartKeyMissingError } from '@/lib/dart';

export const runtime = 'nodejs';

// ── SEC EDGAR helpers ──────────────────────────────────────────────────────

const SEC_UA = process.env.SEC_USER_AGENT ?? 'StockTerminal research@stockterminal.local';

let _cikMap: Record<string, number> | null = null;
let _cikMapTime = 0;

async function getCikForTicker(ticker: string): Promise<number | null> {
  const now = Date.now();
  if (!_cikMap || now - _cikMapTime > 86_400_000) {
    try {
      const res = await fetch('https://data.sec.gov/submissions/company_tickers.json', {
        headers: { 'User-Agent': SEC_UA },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return null;
      const raw = await res.json() as Record<string, { cik_str: number; ticker: string }>;
      _cikMap = {};
      for (const entry of Object.values(raw)) {
        _cikMap[entry.ticker.toUpperCase()] = entry.cik_str;
      }
      _cikMapTime = now;
    } catch {
      return null;
    }
  }
  return _cikMap?.[ticker.toUpperCase()] ?? null;
}

interface SecSubmissions {
  cik: string;
  name: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
}

async function fetchSecFilings(ticker: string, limit: number) {
  const cik = await getCikForTicker(ticker);
  if (!cik) return { items: [], error: `CIK not found for ${ticker}` };

  const cikPadded = String(cik).padStart(10, '0');
  const url = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': SEC_UA } });
  if (!res.ok) return { items: [], error: `SEC EDGAR returned ${res.status}` };

  const data = await res.json() as SecSubmissions;
  const recent = data.filings?.recent;
  if (!recent) return { items: [], corp_name: data.name };

  const n = Math.min(limit, recent.accessionNumber.length);
  const items = [];
  for (let i = 0; i < n; i++) {
    const acc = recent.accessionNumber[i];
    const accNoDash = acc.replace(/-/g, '');
    items.push({
      report_name: recent.form[i],
      published_at: recent.filingDate[i] ? `${recent.filingDate[i]}T00:00:00Z` : null,
      disclosure_type: recent.form[i],
      source_url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDash}/${recent.primaryDocument[i]}`,
    });
  }
  return { items, corp_name: data.name, cik };
}

/**
 * GET /api/stocks/disclosures?symbol=005930&months=3&limit=50
 *
 * DART list.json 으로 종목 공시 목록을 라이브 조회.
 * corp_code 는 dart_corp_codes 테이블에서 symbol 로 lookup.
 * 응답: 정렬·가공된 공시 아이템 배열.
 */

type DartListItem = {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  corp_cls: string;
  report_nm: string;
  rcept_no: string;
  flr_nm: string;
  rcept_dt: string;
  rm: string;
};

type DartListResponse = {
  status: string;
  message?: string;
  page_no?: number;
  page_count?: number;
  total_count?: number;
  total_page?: number;
  list?: DartListItem[];
};

// report_nm 기반으로 공시 유형 간단 분류
function classifyDisclosureType(reportName: string): string {
  if (/유상증자/.test(reportName)) return '유상증자';
  if (/무상증자/.test(reportName)) return '무상증자';
  if (/자기주식|자사주/.test(reportName)) return '자사주';
  if (/전환사채|CB|신주인수권/.test(reportName)) return 'CB발행';
  if (/최대주주|대주주/.test(reportName)) return '대주주변동';
  if (/합병|분할/.test(reportName)) return '합병분할';
  if (/사업보고서|분기보고서|반기보고서/.test(reportName)) return '정기보고';
  if (/감사보고서|재무제표/.test(reportName)) return '감사·재무';
  if (/주요사항보고서/.test(reportName)) return '주요사항';
  if (/IR|기업설명회/.test(reportName)) return 'IR';
  return '기타';
}

// YYYYMMDD → YYYY-MM-DDT00:00:00+09:00
function parseKrDate(yyyymmdd: string): string | null {
  if (!/^\d{8}$/.test(yyyymmdd)) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00+09:00`;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const market = req.nextUrl.searchParams.get('market');
  const months = Math.min(12, Math.max(1, Number(req.nextUrl.searchParams.get('months') ?? 3)));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50)));

  if (!symbol) {
    return NextResponse.json({ error: 'symbol 파라미터 필요' }, { status: 400 });
  }

  const isUS = market === 'US' || (market !== 'KR' && !/^\d{6}$/.test(symbol));

  if (isUS) {
    try {
      const result = await fetchSecFilings(symbol.toUpperCase(), limit);
      return NextResponse.json({
        corp_name: result.corp_name ?? null,
        total_count: result.items.length,
        items: result.items,
        source: 'SEC EDGAR',
        ...(result.error ? { error: result.error } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      return NextResponse.json({ error: `SEC 조회 실패: ${msg}`, items: [] }, { status: 502 });
    }
  }

  try {
    const corpCode = await getDartCorpCode(symbol.toUpperCase());
    if (!corpCode) {
      return NextResponse.json(
        { error: 'DART corp_code 매칭 실패 (dart_corp_codes 시딩 확인)', items: [] },
        { status: 404 }
      );
    }

    const end = new Date();
    const bgn = new Date();
    bgn.setMonth(bgn.getMonth() - months);

    const yyyymmdd = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    const data = await fetchDart<DartListResponse>('/list.json', {
      corp_code: corpCode,
      bgn_de: yyyymmdd(bgn),
      end_de: yyyymmdd(end),
      page_count: String(limit),
      page_no: '1',
    });

    const list = data.list ?? [];

    const items = list.map((i) => ({
      rcept_no: i.rcept_no,
      report_name: i.report_nm,
      disclosure_type: classifyDisclosureType(i.report_nm),
      filer_name: i.flr_nm,
      published_at: parseKrDate(i.rcept_dt),
      remark: i.rm,
      corp_name: i.corp_name,
      source_url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${i.rcept_no}`,
    }));

    return NextResponse.json({
      corp_code: corpCode,
      corp_name: list[0]?.corp_name ?? null,
      total_count: data.total_count ?? items.length,
      items,
      meta: {
        range: { begin: yyyymmdd(bgn), end: yyyymmdd(end) },
        months,
        limit,
      },
    });
  } catch (e) {
    if (e instanceof DartKeyMissingError) {
      return NextResponse.json(
        { error: 'DART_API_KEY 미설정 — .env.local 확인', items: [] },
        { status: 500 }
      );
    }
    const msg = e instanceof Error ? e.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `DART 조회 실패: ${msg}`, items: [] },
      { status: 502 }
    );
  }
}
