import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEME_MAP: Record<string, string[]> = {
  "AI/반도체": ["005930", "000660", "042700", "036930"],
  "2차전지":  ["247540", "086520", "373220", "066970"],
  "로봇":     ["454910", "108490", "285550"],
  "우주항공": ["012450", "079550", "047810"],
  "원전":     ["034020", "267260", "298040"],
  "조선":     ["329180", "010140", "042660"],
  "방산":     ["079550", "047810", "064350"],
  "바이오":   ["207940", "068270", "326030"],
  "K-콘텐츠": ["035900", "041510", "122870"],
  "리오프닝": ["039130", "008770", "035250"],
};

type PriceResult = { name: string; changePct: number };

async function fetchPrice(origin: string, code: string): Promise<PriceResult | null> {
  try {
    const res = await fetch(`${origin}/api/kis/price?symbol=${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const name = String(json.name ?? "").trim();
    const changePct = Number(json.changePercent ?? 0);
    if (!name) return null;
    return { name, changePct };
  } catch {
    return null;
  }
}

type ThemeItem = {
  rank: number;
  name: string;
  changePct: number;
  leader: string;
  leaderCode: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const results: ThemeItem[] = [];

    for (const [themeName, codes] of Object.entries(THEME_MAP)) {
      const prices = await Promise.all(codes.map((c) => fetchPrice(origin, c)));
      const valid = prices
        .map((p, i) => (p ? { ...p, code: codes[i] } : null))
        .filter((p): p is PriceResult & { code: string } => p !== null);

      if (valid.length === 0) continue;

      const avg = valid.reduce((sum, p) => sum + p.changePct, 0) / valid.length;
      const leader = valid.reduce((best, p) => (p.changePct > best.changePct ? p : best), valid[0]);

      results.push({
        rank: 0,
        name: themeName,
        changePct: Number(avg.toFixed(2)),
        leader: leader.name,
        leaderCode: leader.code,
      });
    }

    results.sort((a, b) => b.changePct - a.changePct);
    results.forEach((t, i) => { t.rank = i + 1; });

    return NextResponse.json({ items: results.slice(0, 10) });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
