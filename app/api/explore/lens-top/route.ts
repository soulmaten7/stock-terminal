// 렌즈 정렬 목록 — /explore "강점이 많은 종목" 등의 원료(STEP 767a). lens_scores 선계산 + 시세 배치 조인.
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tonesFor, type LensScoreRow } from "@/lib/lensTones";
import { cleanUsName } from "@/lib/usNameFormat";
import foreignKoRaw from "@/data/foreign_ko_names.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOREIGN_KO = foreignKoRaw as Record<string, string>;

type LensRow = LensScoreRow & { symbol: string; name: string | null };
type Tones = { pos: number; warn: number; flat: number };

export async function GET(req: NextRequest) {
  const marketParam = req.nextUrl.searchParams.get("market");
  const market = marketParam === "KR" || marketParam === "US" ? marketParam : null;
  if (!market) return NextResponse.json({ error: "market must be KR or US" }, { status: 400 });

  const sortKey: "pos" | "warn" = req.nextUrl.searchParams.get("sort") === "warn" ? "warn" : "pos";
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "10", 10) || 10, 1), 50);
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ko";

  const sb = createAdminClient();
  const { data } = await sb
    .from("lens_scores")
    .select("symbol,name,momentum_state,technical_state,valuation_state,lowvol_state,quality_state,assetgrowth_state,fscore_state")
    .eq("market", market);

  const withTones = ((data ?? []) as LensRow[])
    .map((r) => ({ row: r, tones: tonesFor(r) }))
    .filter((x): x is { row: LensRow; tones: Tones } => !!x.tones);
  withTones.sort((a, b) => b.tones[sortKey] - a.tones[sortKey]);

  // 동률(거래대금) 타이브레이크용으로 여유 있게 후보를 잡은 뒤 시세 조인 후 재정렬.
  const candidates = withTones.slice(0, Math.max(limit * 3, 100));
  const symbols = candidates.map((c) => c.row.symbol);

  type Snap = { price: number | null; changePercent: number | null; tradeAmount: number | null; nameKo?: string; nameEn?: string | null };
  const snapMap = new Map<string, Snap>();
  for (let i = 0; i < symbols.length; i += 1000) {
    const chunk = symbols.slice(i, i + 1000);
    if (chunk.length === 0) continue;
    if (market === "KR") {
      const { data: snap } = await sb.from("kr_stock_snapshot").select("symbol,price,change_percent,trade_amount,name,name_en").in("symbol", chunk);
      for (const s of (snap ?? []) as { symbol: string; price: number | null; change_percent: number | null; trade_amount: number | null; name: string; name_en: string | null }[]) {
        snapMap.set(s.symbol, { price: s.price, changePercent: s.change_percent, tradeAmount: s.trade_amount, nameKo: s.name, nameEn: s.name_en ?? undefined });
      }
    } else {
      const { data: snap } = await sb.from("us_stock_perf").select("symbol,price,r1d,amount").in("symbol", chunk);
      for (const s of (snap ?? []) as { symbol: string; price: number | null; r1d: number | null; amount: number | null }[]) {
        snapMap.set(s.symbol, { price: s.price, changePercent: s.r1d, tradeAmount: s.amount });
      }
    }
  }

  const withSnap = candidates.map((c) => ({ ...c, snap: snapMap.get(c.row.symbol) }));
  withSnap.sort((a, b) => {
    const diff = b.tones[sortKey] - a.tones[sortKey];
    if (diff !== 0) return diff;
    return (b.snap?.tradeAmount ?? 0) - (a.snap?.tradeAmount ?? 0);
  });

  const items = withSnap.slice(0, limit).map(({ row, tones, snap }) => {
    let name: string;
    if (market === "KR") {
      name = lang === "en" ? (snap?.nameEn ?? row.name ?? row.symbol) : (snap?.nameKo ?? row.name ?? row.symbol);
    } else {
      const ko = FOREIGN_KO[row.symbol.toUpperCase()];
      name = lang === "ko" && ko ? ko : cleanUsName(row.name ?? row.symbol);
    }
    return { symbol: row.symbol, name, tones, price: snap?.price ?? null, changePercent: snap?.changePercent ?? null };
  });

  return NextResponse.json({ items });
}
