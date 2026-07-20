// 어제→오늘 렌즈 상태 변화 조회 — 홈 "오늘" 다이제스트의 원료(STEP 764). 결정론·LLM 무사용.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChangeRow = {
  symbol: string;
  name: string | null;
  lens_key: string;
  from_state: string | null;
  to_state: string;
  from_tone: string | null;
  to_tone: string;
  trade_amount: number | null;
};

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 5 * 60 * 1000;

async function latestDate(sb: ReturnType<typeof createAdminClient>, market: string): Promise<string | null> {
  const { data } = await sb
    .from("lens_state_changes")
    .select("change_date")
    .eq("market", market)
    .order("change_date", { ascending: false })
    .limit(1);
  return (data?.[0] as { change_date: string } | undefined)?.change_date ?? null;
}

export async function GET(req: NextRequest) {
  const marketParam = req.nextUrl.searchParams.get("market");
  const market = marketParam === "KR" || marketParam === "US" ? marketParam : null;
  if (!market) return NextResponse.json({ error: "market must be KR or US" }, { status: 400 });

  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 1), 200);
  const wantWatchlist = req.nextUrl.searchParams.get("watchlist") === "true";

  const sb = createAdminClient();

  // 관심목록 필터 — 로그인 세션 확인 후 심볼 집합. 비로그인 + watchlist=true는 정직하게 0건(임의로 전체를 보여주지 않음).
  let watchSymbols: Set<string> | null = null;
  if (wantWatchlist) {
    const supaSession = await createClient();
    const { data: { user } } = await supaSession.auth.getUser();
    if (user) {
      const { data: wl } = await sb.from("watchlist").select("symbol").eq("user_id", user.id);
      watchSymbols = new Set(((wl ?? []) as { symbol: string }[]).map((w) => w.symbol));
    } else {
      watchSymbols = new Set();
    }
  }

  // 요청 날짜에 행이 없으면(주말·휴장) 최신 change_date로 폴백 — 응답의 date로 실제 반영된 날짜를 명시.
  let date = req.nextUrl.searchParams.get("date");
  if (date) {
    const { count } = await sb
      .from("lens_state_changes")
      .select("id", { count: "exact", head: true })
      .eq("market", market)
      .eq("change_date", date);
    if (!count) date = await latestDate(sb, market);
  } else {
    date = await latestDate(sb, market);
  }
  if (!date) return NextResponse.json({ date: null, items: [] });

  if (watchSymbols && watchSymbols.size === 0) {
    return NextResponse.json({ date, items: [] });
  }

  const cacheKey = `${market}:${date}:${limit}:${watchSymbols ? [...watchSymbols].sort().join(",") : "all"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.data);

  let q = sb
    .from("lens_state_changes")
    .select("symbol,name,lens_key,from_state,to_state,from_tone,to_tone,trade_amount")
    .eq("market", market)
    .eq("change_date", date)
    .order("trade_amount", { ascending: false, nullsFirst: false });
  if (watchSymbols) q = q.in("symbol", [...watchSymbols]);

  // watchlist 필터 시 유니크 심볼 수가 적어 넉넉히 가져와 정렬 후 자름(정확한 limit 적용).
  const { data, error } = await q.limit(watchSymbols ? 2000 : limit);
  if (error) return NextResponse.json({ date, items: [], error: error.message }, { status: 500 });

  // 전체 건수(limit 절단 전) — "N건 더 보기" 같은 표시가 실제로 잘린 만큼만 말하도록(근거 없는 숫자 금지).
  let countQ = sb.from("lens_state_changes").select("id", { count: "exact", head: true }).eq("market", market).eq("change_date", date);
  if (watchSymbols) countQ = countQ.in("symbol", [...watchSymbols]);
  const { count } = await countQ;

  const items = ((data ?? []) as ChangeRow[]).slice(0, limit).map((r) => ({
    symbol: r.symbol,
    name: r.name,
    lensKey: r.lens_key,
    fromState: r.from_state,
    toState: r.to_state,
    fromTone: r.from_tone,
    toTone: r.to_tone,
    tradeAmount: r.trade_amount,
  }));

  const result = { date, count: count ?? items.length, items };
  cache.set(cacheKey, { at: Date.now(), data: result });
  return NextResponse.json(result);
}
