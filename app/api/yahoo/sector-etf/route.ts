import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 미국 11개 SPDR 섹터 ETF — '해외 업종' 실데이터
const SECTORS = [
  { sym: "XLK", name: "기술" },
  { sym: "XLF", name: "금융" },
  { sym: "XLE", name: "에너지" },
  { sym: "XLV", name: "헬스케어" },
  { sym: "XLY", name: "임의소비재" },
  { sym: "XLP", name: "필수소비재" },
  { sym: "XLI", name: "산업재" },
  { sym: "XLB", name: "소재" },
  { sym: "XLU", name: "유틸리티" },
  { sym: "XLRE", name: "부동산" },
  { sym: "XLC", name: "커뮤니케이션" },
];

export async function GET() {
  try {
    const quotes = await yf.quote(SECTORS.map((s) => s.sym));
    const arr = Array.isArray(quotes) ? quotes : [quotes];
    const bySym = new Map(arr.map((q) => [String((q as Record<string, unknown>).symbol ?? ""), q]));
    const sectors = SECTORS.map((s) => {
      const q = bySym.get(s.sym) as Record<string, unknown> | undefined;
      return {
        code: s.sym,
        name: s.name,
        index: Number(q?.regularMarketPrice ?? 0),
        changePercent: Number(q?.regularMarketChangePercent ?? 0),
      };
    })
      .filter((s) => s.index > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    return NextResponse.json({ sectors });
  } catch (e) {
    return NextResponse.json({ sectors: [], error: e instanceof Error ? e.message : String(e) });
  }
}
