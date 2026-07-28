import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const yf = new YahooFinance();

// 미국 대표 개별 REIT (티커·약식명). 시총/거래량 상위. us-etf-performance와 동일 계산.
const UNIVERSE: { sym: string; name: string }[] = [
  { sym: "PLD", name: "Prologis (PLD)" },
  { sym: "AMT", name: "American Tower (AMT)" },
  { sym: "EQIX", name: "Equinix (EQIX)" },
  { sym: "WELL", name: "Welltower (WELL)" },
  { sym: "O", name: "Realty Income (O)" },
  { sym: "SPG", name: "Simon Property Group (SPG)" },
  { sym: "PSA", name: "Public Storage (PSA)" },
  { sym: "DLR", name: "Digital Realty (DLR)" },
  { sym: "CCI", name: "Crown Castle (CCI)" },
  { sym: "VICI", name: "VICI Properties (VICI)" },
  { sym: "EXR", name: "Extra Space Storage (EXR)" },
  { sym: "AVB", name: "AvalonBay Communities (AVB)" },
  { sym: "EQR", name: "Equity Residential (EQR)" },
  { sym: "IRM", name: "Iron Mountain (IRM)" },
  { sym: "VTR", name: "Ventas (VTR)" },
  { sym: "ARE", name: "Alexandria Real Estate (ARE)" },
  { sym: "INVH", name: "Invitation Homes (INVH)" },
  { sym: "MAA", name: "Mid-America Apartment (MAA)" },
  { sym: "SUI", name: "Sun Communities (SUI)" },
  { sym: "UDR", name: "UDR (UDR)" },
  { sym: "ESS", name: "Essex Property Trust (ESS)" },
  { sym: "KIM", name: "Kimco Realty (KIM)" },
  { sym: "WPC", name: "W. P. Carey (WPC)" },
  { sym: "CPT", name: "Camden Property Trust (CPT)" },
  { sym: "BXP", name: "BXP (BXP)" },
  { sym: "DOC", name: "Healthpeak Properties (DOC)" },
  { sym: "GLPI", name: "Gaming and Leisure (GLPI)" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  const results = await mapLimit(UNIVERSE, 10, async (e) => {
    try {
      const ch = await yf.chart(e.sym, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
      const closes = quotes.map((q) => q.close).filter((c): c is number => typeof c === "number" && c > 0);
      if (closes.length < 22) return null;
      const lastClose = closes[closes.length - 1];
      let lastVolume = 0;
      for (let i = quotes.length - 1; i >= 0; i--) {
        const v = quotes[i].volume;
        if (typeof v === "number" && v > 0) { lastVolume = v; break; }
      }
      return {
        symbol: e.sym,
        name: e.name,
        price: lastClose,
        changePercent: ret(closes, 1), // 결측이면 null(0 날조 금지·STEP 804 §1)
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        amount: lastClose * lastVolume,
      };
    } catch {
      return null;
    }
  });

  const items = results.filter((x) => x !== null);
  items.sort((a, b) => (b!.amount ?? 0) - (a!.amount ?? 0));
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
