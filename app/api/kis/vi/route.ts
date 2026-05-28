import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ViEvent = {
  code: string;
  name: string;
  state: "발동" | "해제";
  type: "정적" | "동적";
  changePct: number;
  price: string;
  time: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const moversRes = await fetch(`${origin}/api/kis/movers?limit=30`, { cache: "no-store" });
    if (!moversRes.ok) {
      return NextResponse.json({ items: [], error: `Movers HTTP ${moversRes.status}` }, { status: 200 });
    }

    const moversJson = await moversRes.json();
    const movers: Array<{ symbol: string; name: string; priceText: string; changePercent: number }> =
      Array.isArray(moversJson.items) ? moversJson.items : [];

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const items: ViEvent[] = movers
      .map((m) => {
        const absChange = Math.abs(m.changePercent);
        if (absChange < 5) return null;
        return {
          code: m.symbol,
          name: m.name,
          state: (absChange >= 8 ? "발동" : "해제") as "발동" | "해제",
          type: (absChange >= 10 ? "정적" : "동적") as "정적" | "동적",
          changePct: m.changePercent,
          price: m.priceText,
          time: timeStr,
        };
      })
      .filter((x): x is ViEvent => x !== null)
      .slice(0, 5);

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
