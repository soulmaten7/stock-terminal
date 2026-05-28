import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

export async function GET() {
  try {
    const result = await yf.search("S&P 500", { newsCount: 5 });
    const news = result.news ?? [];

    type NewsItem = {
      title: string;
      source: string;
      time: string;
      url?: string;
    };

    const items: NewsItem[] = (news as Array<Record<string, unknown>>)
      .slice(0, 5)
      .map((n) => {
        const publishTime = Number(n.providerPublishTime ?? 0) * 1000;
        const hoursAgo =
          publishTime > 0
            ? Math.floor((Date.now() - publishTime) / (1000 * 60 * 60))
            : 0;
        return {
          title: String(n.title ?? "").trim(),
          source: String(n.publisher ?? "—"),
          time: hoursAgo > 0 ? `${hoursAgo}h ago` : "방금",
          url: typeof n.link === "string" ? n.link : undefined,
        };
      });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
