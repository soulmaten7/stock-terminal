import { NextResponse } from "next/server";
import { fetchMaterial8K } from "@/lib/eightK";
import { pickLocale } from "@/lib/lensCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

// 종목별 '중대 8-K 이벤트 사실'(US) — EDGAR submissions의 item 코드로 결정론 분류(lib/eightK).
// 렌즈 점수엔 안 섞음. 페이지가 이벤트 리스트 + 관련 렌즈 ⚠️/📌 플래그에 사용. 비US·미상장은 events:[].
// 라벨은 결정론 이중언어 맵(?lang=en → label 자리에 EightKDef.en). ⚠️ 캐시 키에 locale 필수 — 빠지면 먼저 캐시된 언어가 양쪽에 뜬다.
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });
  const locale = pickLocale(url.searchParams.get("lang")); // 기본 ko · ?lang=en

  const key = `${symbol}:${locale}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  try {
    const raw = await fetchMaterial8K(symbol, 6);
    // en은 내부 필드 → 응답에서 제거(ko 페이로드는 기존과 동일). en 로케일이면 label 자리에 치환.
    const events = raw.map((e) => ({
      ...e,
      defs: e.defs.map(({ en, ...d }) => (locale === "en" ? { ...d, label: en } : d)),
    }));
    const data = { symbol, events };
    cache.set(key, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, events: [], error: String(e) }, { status: 200 });
  }
}
