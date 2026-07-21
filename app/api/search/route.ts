// 전 종목 검색(6개국) — /explore 검색창의 원료(STEP 767a). 서버 인메모리 인덱스(lib/stockName.ts와 동일 소스).
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanUsName } from "@/lib/usNameFormat";
import usSymbols from "@/data/us_symbols.json";
import jpSymbols from "@/data/jp_symbols.json";
import cnSymbols from "@/data/cn_symbols.json";
import vnSymbols from "@/data/vn_symbols.json";
import gbSymbols from "@/data/gb_symbols.json";
import foreignKoRaw from "@/data/foreign_ko_names.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Country = "KR" | "US" | "JP" | "CN" | "VN" | "GB";
type SymRow = { sym: string; name: string; type?: string };
type IndexEntry = { symbol: string; nameKo: string; nameEn: string; country: Country; type: "stock" | "etf" };

const FOREIGN_KO = foreignKoRaw as Record<string, string>;
// 시장 규모 우선순위(작을수록 우선) — KR·US(가장 깊은 커버리지) > JP·CN > VN·GB. 실측 시총 아닌 정성적 티어.
const SIZE_PRIORITY: Record<Country, number> = { KR: 0, US: 0, JP: 1, CN: 1, VN: 2, GB: 2 };

function buildForeign(country: Country, arr: SymRow[]): IndexEntry[] {
  return arr.map((r) => {
    const ko = FOREIGN_KO[r.sym.toUpperCase()];
    const en = country === "US" ? cleanUsName(r.name) : r.name;
    return { symbol: r.sym, nameKo: ko ?? en, nameEn: en, country, type: r.type === "etf" ? "etf" : "stock" };
  });
}

// 해외 5개국 인덱스 — 번들 JSON이라 서버 인스턴스당 1회만 조립(모듈 캐시).
let _foreignIndex: IndexEntry[] | null = null;
function foreignIndex(): IndexEntry[] {
  if (_foreignIndex) return _foreignIndex;
  _foreignIndex = [
    ...buildForeign("US", usSymbols as SymRow[]),
    ...buildForeign("JP", jpSymbols as SymRow[]),
    ...buildForeign("CN", cnSymbols as SymRow[]),
    ...buildForeign("VN", vnSymbols as SymRow[]),
    ...buildForeign("GB", gbSymbols as SymRow[]),
  ];
  return _foreignIndex;
}

// KR 인덱스 — DB 소스라 1시간마다 갱신(전종목 2,772행·.range() 페이지네이션·PostgREST 1000행 캡 회피).
let _krIndex: { at: number; rows: IndexEntry[] } | null = null;
const KR_TTL = 60 * 60 * 1000;
async function krIndex(): Promise<IndexEntry[]> {
  if (_krIndex && Date.now() - _krIndex.at < KR_TTL) return _krIndex.rows;
  const sb = createAdminClient();
  const rows: IndexEntry[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("kr_stock_snapshot").select("symbol,name,name_en").range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const r of data as { symbol: string; name: string; name_en: string | null }[]) {
      rows.push({ symbol: r.symbol, nameKo: r.name, nameEn: r.name_en ?? r.name, country: "KR", type: "stock" });
    }
    if (data.length < 1000) break;
  }
  _krIndex = { at: Date.now(), rows };
  return rows;
}

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ko";
  if (!q) return NextResponse.json({ items: [] });

  const cacheKey = `${lang}:${q.toUpperCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.data);

  const qUpper = q.toUpperCase();
  const kr = await krIndex();
  const all: IndexEntry[] = [...kr, ...foreignIndex()];

  const startsWith = (e: IndexEntry) =>
    e.symbol.toUpperCase().startsWith(qUpper) || e.nameKo.toUpperCase().startsWith(qUpper) || e.nameEn.toUpperCase().startsWith(qUpper);
  const includes = (e: IndexEntry) =>
    e.symbol.toUpperCase().includes(qUpper) || e.nameKo.toUpperCase().includes(qUpper) || e.nameEn.toUpperCase().includes(qUpper);

  const matched = all.filter(includes);
  matched.sort((a, b) => {
    const aPre = startsWith(a), bPre = startsWith(b);
    if (aPre !== bPre) return aPre ? -1 : 1;
    return SIZE_PRIORITY[a.country] - SIZE_PRIORITY[b.country];
  });

  const items = matched.slice(0, 8).map((e) => ({
    symbol: e.symbol,
    name: lang === "en" ? e.nameEn : e.nameKo,
    country: e.country,
    type: e.type,
  }));

  const result = { items };
  cache.set(cacheKey, { at: Date.now(), data: result });
  return NextResponse.json(result);
}
