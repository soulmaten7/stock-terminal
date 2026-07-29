import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tonesFromStates, type Tone } from "@/lib/lensTones";
import { isActiveCountry } from "@/lib/activeMarkets";
import { marketToday } from "@/lib/marketDate";
import usSymbolsData from "@/data/us_symbols.json";
import { titleCaseUsName } from "@/lib/usNameFormat";

// US 원어명 맵(us-list 라우트와 동일 소스·패턴) — us_stock_perf엔 name 컬럼이 없어 번들 JSON에서(STEP 781 §1).
type UsSym = { sym: string; name: string; type: string };
const US_NAME_MAP = new Map(
  (usSymbolsData as UsSym[]).filter((s) => s.type === "stock").map((s) => [s.sym, titleCaseUsName(s.name)])
);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WatchRow = { symbol: string; name_ko: string; market: string; country: string };
type Quote = { symbol: string; price: number | null; changePercent: number | null; market: string | null; nameEn: string | null };

// country(대문자) → 선계산 스냅샷 테이블. KR만 change_percent, 나머지는 r1d(전일대비%).
// 전체 6개국 설정은 파킹 보존용(docs/PARKED_FIELD_SURFACES.md §7) — 실제 조회는 ACTIVE_MARKETS(KR·US)만(STEP 799:
// jp/cn/vn/gb-perf 크론이 794에서 멎어 이 테이블을 계속 읽으면 동결된 옛 가격을 현재가처럼 보여주는 버그였다).
const SNAPSHOT_ALL: Record<string, { table: string; changeCol: string; hasMarket?: boolean; hasNameEn?: boolean }> = {
  KR: { table: "kr_stock_snapshot", changeCol: "change_percent", hasMarket: true, hasNameEn: true },
  US: { table: "us_stock_perf", changeCol: "r1d" },
  JP: { table: "jp_stock_perf", changeCol: "r1d" },
  CN: { table: "cn_stock_perf", changeCol: "r1d" },
  VN: { table: "vn_stock_perf", changeCol: "r1d" },
  GB: { table: "gb_stock_perf", changeCol: "r1d" },
};
const SNAPSHOT: Record<string, { table: string; changeCol: string; hasMarket?: boolean; hasNameEn?: boolean }> =
  Object.fromEntries(Object.entries(SNAPSHOT_ALL).filter(([country]) => isActiveCountry(country)));

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
    const unsupportedMarket = !isActiveCountry(country); // STEP 799: JP/CN/VN/GB 기존 등록 행 — 정직 결측(가격 대신 안내)
    const candidates = quoteMaps.get(country)?.get(w.symbol) ?? [];
    const match = candidates.length > 1 ? candidates.find((c) => c.market === w.market) ?? candidates[0] : candidates[0];
    // 리스트 표시용 원어명(776 §1 통일 대상) — KR은 kr_stock_snapshot 조인(match.nameEn), US는 번들 맵. JP/CN/VN/GB는 이번 STEP 스코프 밖(null → 클라가 기존 name_ko로 폴백).
    const nameEn = match?.nameEn ?? (country === "US" ? US_NAME_MAP.get(w.symbol) ?? null : null);
    return {
      symbol: w.symbol,
      name_ko: w.name_ko,
      market: w.market,
      country: w.country,
      price: match?.price ?? null,
      changePercent: match?.changePercent ?? null,
      name_en: nameEn,
      tones: tonesBySym.get(w.symbol) ?? null,
      unsupportedMarket,
    };
  });

  // STEP 829 §7: 데이터 기준일(asOf) — 오늘·탐색과 같은 규칙으로 화면이 스냅샷 나이를 표시(최대 25h 묵음 정직화).
  //   KR=bas_dd(거래일)·US=us_stock_perf 최신 updated_at을 시장 로컬 날짜로. 관심목록에 실제 있는 시장만 조회.
  const asOf: Record<string, string> = {};
  const present = new Set(Array.from(byCountry.keys()).filter((c) => isActiveCountry(c)));
  await Promise.all([
    present.has("KR")
      ? admin.from("kr_stock_snapshot").select("bas_dd").order("bas_dd", { ascending: false }).limit(1)
          .then(({ data }) => { const d = data?.[0]?.bas_dd as string | undefined; if (d && /^\d{8}$/.test(d)) asOf.KR = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`; })
      : Promise.resolve(),
    present.has("US")
      ? admin.from("us_stock_perf").select("updated_at").order("updated_at", { ascending: false }).limit(1)
          .then(({ data }) => { const u = data?.[0]?.updated_at as string | undefined; if (u) asOf.US = marketToday("US", new Date(u)); })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ auth: true, watchlist, asOf });
}
