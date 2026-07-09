import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
  const to = Math.floor(Date.now() / 1000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://trading.vietcap.com.vn/",
      },
      body: JSON.stringify({ timeFrame: "ONE_DAY", symbols: ["SHS", "FPT"], to, countBack: 5 }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text.slice(0, 500) });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
