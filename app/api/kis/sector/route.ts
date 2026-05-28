import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECTOR_MAP: Record<string, string[]> = {
  "반도체":  ["005930", "000660", "042700"],
  "자동차":  ["005380", "000270", "012330"],
  "2차전지": ["247540", "086520", "373220"],
  "바이오":  ["207940", "068270", "326030"],
  "금융":    ["105560", "055550", "086790"],
  "조선":    ["329180", "010140", "042660"],
  "건설":    ["000720", "375500", "047040"],
  "유통":    ["004170", "139480", "069960"],
};

async function fetchChangePct(origin: string, symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`${origin}/api/kis/price?symbol=${symbol}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.changePercent === "number" ? json.changePercent : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const results: Array<{ name: string; changePct: number; status: "up" | "down" }> = [];

    for (const [sectorName, codes] of Object.entries(SECTOR_MAP)) {
      const changes = await Promise.all(codes.map((c) => fetchChangePct(origin, c)));
      const valid = changes.filter((c): c is number => c !== null);
      if (valid.length === 0) continue;

      const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
      results.push({
        name: sectorName,
        changePct: Number(avg.toFixed(1)),
        status: avg >= 0 ? "up" : "down",
      });
    }

    results.sort((a, b) => b.changePct - a.changePct);

    return NextResponse.json({ items: results });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
