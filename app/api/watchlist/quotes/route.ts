import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WatchRow = { symbol: string; name_ko: string; market: string; country: string };
type Quote = { symbol: string; price: number | null; changePercent: number | null; market: string | null; nameEn: string | null };

// country(대문자) → 선계산 스냅샷 테이블. KR만 change_percent, 나머지는 r1d(전일대비%).
const SNAPSHOT: Record<string, { table: string; changeCol: string; hasMarket?: boolean; hasNameEn?: boolean }> = {
  KR: { table: "kr_stock_snapshot", changeCol: "change_percent", hasMarket: true, hasNameEn: true },
  US: { table: "us_stock_perf", changeCol: "r1d" },
  JP: { table: "jp_stock_perf", changeCol: "r1d" },
  CN: { table: "cn_stock_perf", changeCol: "r1d" },
  VN: { table: "vn_stock_perf", changeCol: "r1d" },
  GB: { table: "gb_stock_perf", changeCol: "r1d" },
};

type Tone = "pos" | "warn" | "flat";
// state→tone (라이브 로직과 동일 · na/null/그 외는 제외)
function tonesFromStates(r: Record<string, string | null>): Tone[] {
  const out: Tone[] = [];
  const map = (s: string | null, pos: string, warn: string, mid: string) => {
    if (s === pos) out.push("pos");
    else if (s === warn) out.push("warn");
    else if (s === mid) out.push("flat");
    // 그 외(na/null) → 제외
  };
  map(r.momentum_state, "up", "down", "flat");
  map(r.technical_state, "up", "down", "flat");
  map(r.valuation_state, "cheap", "rich", "mid");
  map(r.lowvol_state, "calm", "jumpy", "mid");
  map(r.quality_state, "high", "low", "mid");
  map(r.assetgrowth_state, "conservative", "aggressive", "mid");
  map(r.fscore_state, "strong", "weak", "mid");
  return out;
}

async function fetchQuotes(sb: ReturnType<typeof createAdminClient>, country: string, symbols: string[]): Promise<Map<string, Quote[]>> {
  const cfg = SNAPSHOT[country];
  const out = new Map<string, Quote[]>();
  if (!cfg || symbols.length === 0) return out;

  const cols = [
    "symbol", "price", cfg.changeCol,
    cfg.hasMarket ? "market" : null,
    cfg.hasNameEn ? "name_en" : null,
  ].filter(Boolean).join(",");
  const { data } = await sb.from(cfg.table).select(cols).in("symbol", symbols);
  for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
    const symbol = String(r.symbol);
    const q: Quote = {
      symbol,
      price: r.price == null ? null : Number(r.price),
      changePercent: r[cfg.changeCol] == null ? null : Number(r[cfg.changeCol]),
      market: cfg.hasMarket ? (r.market == null ? null : String(r.market)) : null,
      nameEn: cfg.hasNameEn ? (r.name_en == null ? null : String(r.name_en)) : null,
    };
    const list = out.get(symbol) ?? [];
    list.push(q);
    out.set(symbol, list);
  }
  return out;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ auth: false, watchlist: [] });

  const { data: rows } = await supabase
    .from("watchlist")
    .select("symbol, name_ko, market, country")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return NextResponse.json({ auth: true, watchlist: [] });

  const watchRows = rows as WatchRow[];

  // country별로 symbol 묶어서 배치 조회
  const byCountry = new Map<string, string[]>();
  for (const w of watchRows) {
    const c = (w.country || "").toUpperCase();
    const list = byCountry.get(c) ?? [];
    list.push(w.symbol);
    byCountry.set(c, list);
  }

  const admin = createAdminClient();
  const quoteMaps = new Map<string, Map<string, Quote[]>>();
  await Promise.all(
    Array.from(byCountry.entries()).map(async ([country, symbols]) => {
      quoteMaps.set(country, await fetchQuotes(admin, country, Array.from(new Set(symbols))));
    })
  );

  // 전 심볼(국가 무관) lens_scores 상태 배치 읽기 — public-read
  const allSymbols = watchRows.map((r) => r.symbol);
  const { data: lensRows } = await admin
    .from("lens_scores")
    .select("symbol, momentum_state, technical_state, valuation_state, lowvol_state, quality_state, assetgrowth_state, fscore_state")
    .in("symbol", allSymbols);
  const tonesBySym = new Map<string, Tone[]>();
  for (const lr of (lensRows ?? []) as Record<string, string | null>[]) {
    tonesBySym.set(lr.symbol as string, tonesFromStates(lr));
  }

  const watchlist = watchRows.map((w) => {
    const country = (w.country || "").toUpperCase();
    const candidates = quoteMaps.get(country)?.get(w.symbol) ?? [];
    const match = candidates.length > 1 ? candidates.find((c) => c.market === w.market) ?? candidates[0] : candidates[0];
    return {
      symbol: w.symbol,
      name_ko: w.name_ko,
      market: w.market,
      country: w.country,
      price: match?.price ?? null,
      changePercent: match?.changePercent ?? null,
      name_en: match?.nameEn ?? null,
      tones: tonesBySym.get(w.symbol) ?? null,
    };
  });

  return NextResponse.json({ auth: true, watchlist });
}
