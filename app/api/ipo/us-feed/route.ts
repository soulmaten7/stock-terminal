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

type UsIpoItem = { ticker: string; name: string; exchange: string; price: string; date: string; dealSize: string; status: "upcoming" | "priced" };

function ymOffset(n: number): string {
  const d = new Date();
  const dt = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchMonth(ym: string): Promise<any | null> {
  try {
    const r = await fetch(`https://api.nasdaq.com/api/ipo/calendar?date=${ym}`, {
      headers: NASDAQ_HEADERS,
      next: { revalidate: 21600 },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const [cur, prev] = await Promise.all([fetchMonth(ymOffset(0)), fetchMonth(ymOffset(-1))]);
  const items: UsIpoItem[] = [];
  const seen = new Set<string>();

  const pushUpcoming = (rows: any[] | undefined) =>
    (rows ?? []).forEach((row) => {
      const t = row?.proposedTickerSymbol;
      if (!t || seen.has("u" + t)) return;
      seen.add("u" + t);
      items.push({
        ticker: t, name: row.companyName ?? t, exchange: row.proposedExchange ?? "",
        price: row.proposedSharePrice ?? "", date: row.expectedPriceDate ?? "",
        dealSize: row.dollarValueOfSharesOffered ?? "", status: "upcoming",
      });
    });
  const pushPriced = (rows: any[] | undefined) =>
    (rows ?? []).forEach((row) => {
      const t = row?.proposedTickerSymbol;
      if (!t || seen.has("p" + t)) return;
      seen.add("p" + t);
      items.push({
        ticker: t, name: row.companyName ?? t, exchange: row.proposedExchange ?? "",
        price: row.proposedSharePrice ?? "", date: row.pricedDate ?? "",
        dealSize: row.dollarValueOfSharesOffered ?? "", status: "priced",
      });
    });

  pushUpcoming(cur?.data?.upcoming?.upcomingTable?.rows);
  pushPriced(cur?.data?.priced?.rows);
  pushPriced(prev?.data?.priced?.rows);

  const pd = (s: string) => { const d = Date.parse(s); return isNaN(d) ? 0 : d; };
  items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "upcoming" ? -1 : 1;
    return a.status === "upcoming" ? pd(a.date) - pd(b.date) : pd(b.date) - pd(a.date);
  });

  return NextResponse.json(
    { items: items.slice(0, 30) },
    { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } }
  );
}
