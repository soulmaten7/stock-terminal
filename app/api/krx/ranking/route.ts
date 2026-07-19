import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tonesFor, type LensScoreRow } from "@/lib/lensTones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 일별매매정보 — KRX 공식 OpenAPI. 일별(장 마감). 인증키: .env.local KRX_API_KEY.
const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = {
  kospi: `${BASE}/stk_bydd_trd`,
  kosdaq: `${BASE}/ksq_bydd_trd`,
};

type KrxRow = Record<string, string>;
type Mapped = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  tradeAmount: number;
  marketCap: number;
};

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
function toShort(code: string): string {
  const c = code.trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}

async function fetchOne(url: string, basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${url}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? j.block1 ?? []) as KrxRow[];
  } catch {
    return [];
  }
}

// 시장별 매핑 결과 캐시 (KRX 호출이 느리고 응답이 커서) — 5분
const cache = new Map<string, { at: number; basDd: string; rows: Mapped[] }>();
const TTL = 5 * 60 * 1000;

async function loadMapped(market: string, key: string): Promise<{ rows: Mapped[]; basDd: string }> {
  const hit = cache.get(market);
  if (hit && Date.now() - hit.at < TTL) return { rows: hit.rows, basDd: hit.basDd };

  const urls =
    market === "kospi" ? [EP.kospi] : market === "kosdaq" ? [EP.kosdaq] : [EP.kospi, EP.kosdaq];

  // 최신 영업일: 오늘부터 최대 8일 거슬러 데이터 있는 첫 날
  let raw: KrxRow[] = [];
  let usedDate = "";
  const now = new Date();
  for (let i = 0; i < 8 && raw.length === 0; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const basDd = ymd(d);
    const parts = await Promise.all(urls.map((u) => fetchOne(u, basDd, key)));
    const merged = parts.flat();
    if (merged.length > 0) {
      raw = merged;
      usedDate = basDd;
    }
  }

  const rows: Mapped[] = raw
    .map((r) => ({
      symbol: toShort(String(r.ISU_CD || "")),
      name: String(r.ISU_NM || "").trim(),
      price: num(r.TDD_CLSPRC),
      changePercent: num(r.FLUC_RT),
      volume: num(r.ACC_TRDVOL),
      tradeAmount: num(r.ACC_TRDVAL),
      marketCap: num(r.MKTCAP),
    }))
    .filter((s) => s.symbol && s.price > 0);

  if (rows.length > 0) cache.set(market, { at: Date.now(), basDd: usedDate, rows });
  return { rows, basDd: usedDate };
}

// 응답으로 나가는 종목들의 렌즈 톤 배치 조회 — 무거운 계산 없음(추가 쿼리 1회). 선계산 밖이면 null(호출부가 '—' 처리).
async function fetchLensMap(sb: ReturnType<typeof createAdminClient>, symbols: string[]): Promise<Map<string, { pos: number; warn: number; flat: number }>> {
  const out = new Map<string, { pos: number; warn: number; flat: number }>();
  // .in()에 심볼 수천 개를 한 번에 넣으면 URL이 너무 길어져 400(Bad Request)로 조용히 실패(data=null) →
  // 1000개씩 청크로 나눠 호출(실측: 1500 ok·2000+ 실패). STEP 757 발견·수정(limit이 큰 요청에서 재현).
  for (let i = 0; i < symbols.length; i += 1000) {
    const chunk = symbols.slice(i, i + 1000);
    if (chunk.length === 0) continue;
    const { data } = await sb
      .from("lens_scores")
      .select("symbol, momentum_state, technical_state, valuation_state, lowvol_state, quality_state, assetgrowth_state, fscore_state")
      .eq("market", "KR")
      .in("symbol", chunk);
    for (const r of (data ?? []) as (LensScoreRow & { symbol: string })[]) {
      const tones = tonesFor(r);
      if (tones) out.set(r.symbol, tones);
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") || "all";
  const sort = request.nextUrl.searchParams.get("sort") || "amount";
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "100", 10) || 100, 3000);

  // ── 스냅샷 우선(크론 미리계산) — 즉시 서빙, 딜레이 없음 ──
  try {
    const sb = createAdminClient();
    const col =
      sort === "volume" ? "volume" : sort === "cap" ? "market_cap" : sort === "up" || sort === "down" ? "change_percent" : "trade_amount";
    const asc = sort === "down";
    // PostgREST 기본 1000행 캡을 .range() 페이지네이션으로 우회(STEP 759) — limit이 1000 이하면 1페이지로 끝남(기존과 동일).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = [];
    for (let from = 0; from < limit; from += 1000) {
      const to = Math.min(from + 999, limit - 1);
      let q = sb
        .from("kr_stock_snapshot")
        .select("symbol,name,name_en,market,price,change_percent,volume,trade_amount,market_cap,r1w,r1m,r3m,r6m,r1y");
      if (market === "kospi" || market === "kosdaq") q = q.eq("market", market);
      const { data: page, error } = await q.order(col, { ascending: asc, nullsFirst: false }).range(from, to);
      if (error) throw error;
      if (!page || page.length === 0) break;
      data.push(...page);
      if (page.length < to - from + 1) break; // 마지막 페이지
    }
    if (data.length > 0) {
      const lensMap = await fetchLensMap(sb, data.map((s) => s.symbol));
      const stocks = data.map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        nameEn: s.name_en ?? null,
        price: Number(s.price) || 0,
        changePercent: Number(s.change_percent) || 0,
        volume: Number(s.volume) || 0,
        tradeAmount: Number(s.trade_amount) || 0,
        marketCap: Number(s.market_cap) || 0,
        // 1주~1년 수익률을 1일전과 같은 응답에 함께 실어 보냄(별도 kr-performance 병합 제거 → 병합실패로 나머지 '—' 되던 버그 방지)
        r1w: s.r1w, r1m: s.r1m, r3m: s.r3m, r6m: s.r6m, r1y: s.r1y,
        lens: lensMap.get(s.symbol) ?? null,
      }));
      return NextResponse.json({ stocks, source: "kr_snapshot" });
    }
  } catch {
    /* 스냅샷 실패 → 아래 라이브 fallback */
  }

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ stocks: [], source: "krx", error: "no_key" });

  try {
    const { rows: mapped, basDd } = await loadMapped(market, key);
    if (mapped.length === 0) return NextResponse.json({ stocks: [], source: "krx", error: "empty" });

    type M = Mapped;
    const sorters: Record<string, (a: M, b: M) => number> = {
      amount: (a, b) => b.tradeAmount - a.tradeAmount,
      volume: (a, b) => b.volume - a.volume,
      cap: (a, b) => b.marketCap - a.marketCap,
      up: (a, b) => b.changePercent - a.changePercent,
      down: (a, b) => a.changePercent - b.changePercent,
    };
    const sliced = [...mapped].sort(sorters[sort] || sorters.amount).slice(0, limit);
    const lensMap = await fetchLensMap(createAdminClient(), sliced.map((s) => s.symbol));
    const stocks = sliced.map((s, i) => ({ rank: i + 1, ...s, lens: lensMap.get(s.symbol) ?? null }));

    return NextResponse.json({ stocks, source: "krx", basDd });
  } catch (e) {
    return NextResponse.json({
      stocks: [],
      source: "krx",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
