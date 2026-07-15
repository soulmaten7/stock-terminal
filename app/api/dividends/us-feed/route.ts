import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 21600; // 6h

const NASDAQ_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/",
};

type UsDivItem = { symbol: string; name: string; exDate: string; payDate: string; amount: string };

function isoDay(n: number): string {
  return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
}

async function fetchDay(day: string): Promise<any[]> {
  try {
    const r = await fetch(`https://api.nasdaq.com/api/calendar/dividends?date=${day}`, {
      headers: NASDAQ_HEADERS,
      next: { revalidate: 21600 },
    });
    if (!r.ok) return [];
    const j: any = await r.json();
    return j?.data?.calendar?.rows ?? [];
  } catch {
    return [];
  }
}

// 동시성 제한(Nasdaq 버스트 403 회피 — 14일을 4개씩)
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  const days = Array.from({ length: 14 }, (_, i) => isoDay(i)); // 오늘~13일 뒤(배당락일 캘린더)
  const perDay = await mapLimit(days, 4, fetchDay);
  const items: UsDivItem[] = [];
  const seen = new Set<string>();
  perDay.flat().forEach((row: any) => {
    const sym = row?.symbol;
    if (!sym) return;
    const ex = row?.dividend_Ex_Date ?? "";
    const key = sym + ex;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      symbol: sym,
      name: row.companyName ?? sym,
      exDate: ex,
      payDate: row.payment_Date ?? "",
      amount: String(row.dividend_Rate ?? ""),
    });
  });
  const pd = (s: string) => { const d = Date.parse(s); return isNaN(d) ? Infinity : d; };
  items.sort((a, b) => pd(a.exDate) - pd(b.exDate)); // 배당락일 임박순
  return NextResponse.json(
    { items: items.slice(0, 40) },
    { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } }
  );
}
