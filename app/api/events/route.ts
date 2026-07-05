import { NextResponse } from "next/server";
import { fetchMaterial8K } from "@/lib/eightK";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

// 종목별 '중대 8-K 이벤트 사실'(US) — EDGAR submissions의 item 코드로 결정론 분류(lib/eightK).
// 렌즈 점수엔 안 섞음. 페이지가 이벤트 리스트 + 관련 렌즈 ⚠️/📌 플래그에 사용. 비US·미상장은 events:[].
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  try {
    const events = await fetchMaterial8K(symbol, 6);
    const data = { symbol, events };
    cache.set(symbol, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, events: [], error: String(e) }, { status: 200 });
  }
}
