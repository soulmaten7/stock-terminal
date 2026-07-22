// 어제→오늘 렌즈 상태 변화 조회 — /api/today/changes와 서버 프리페치(app/[locale]/page.tsx) 공용(STEP 771 §3).
// 내부 HTTP 왕복 없이 양쪽이 이 함수를 직접 호출 — DB 접근·캐시는 여기 하나.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tone } from "@/lib/lensTones";

export type ChangeItemData = {
  symbol: string;
  name: string | null;
  lensKey: string;
  fromState: string | null;
  toState: string;
  fromTone: Tone | null;
  toTone: Tone;
  tradeAmount: number | null;
  price: number | null;
  changePercent: number | null;
  nameKo: string | null;
  nameEn: string | null;
};
export type ToneCounts = { total: number; pos: number; warn: number };
export type ChangesResult = { date: string | null; count: number; counts: ToneCounts; items: ChangeItemData[] };

type ChangeRow = {
  symbol: string;
  name: string | null;
  lens_key: string;
  from_state: string | null;
  to_state: string;
  from_tone: Tone | null;
  to_tone: Tone;
  trade_amount: number | null;
};
type Snap = { price: number | null; changePercent: number | null; nameKo: string | null; nameEn: string | null };

const cache = new Map<string, { at: number; data: ChangesResult }>();
const TTL = 5 * 60 * 1000;

// 현재가+어제 등락률+KR 종목명(한글/영문) 조인(STEP 769·770) — 스냅샷/us_perf 1000청크 규칙.
// name/name_en은 KR만(kr_stock_snapshot에 있음) — lens_state_changes.name은 야후 영문 약칭이라 화면 표시에 직접 못 씀(STEP 770 §3).
async function snapMap(sb: ReturnType<typeof createAdminClient>, market: string, symbols: string[]): Promise<Map<string, Snap>> {
  const map = new Map<string, Snap>();
  for (let i = 0; i < symbols.length; i += 1000) {
    const chunk = symbols.slice(i, i + 1000);
    if (chunk.length === 0) continue;
    if (market === "KR") {
      const { data } = await sb.from("kr_stock_snapshot").select("symbol,price,change_percent,name,name_en").in("symbol", chunk);
      for (const r of (data ?? []) as { symbol: string; price: number | null; change_percent: number | null; name: string | null; name_en: string | null }[]) {
        map.set(r.symbol, { price: r.price, changePercent: r.change_percent, nameKo: r.name, nameEn: r.name_en });
      }
    } else {
      const { data } = await sb.from("us_stock_perf").select("symbol,price,r1d").in("symbol", chunk);
      for (const r of (data ?? []) as { symbol: string; price: number | null; r1d: number | null }[]) {
        map.set(r.symbol, { price: r.price, changePercent: r.r1d, nameKo: null, nameEn: null });
      }
    }
  }
  return map;
}

async function latestDate(sb: ReturnType<typeof createAdminClient>, market: string): Promise<string | null> {
  const { data } = await sb
    .from("lens_state_changes")
    .select("change_date")
    .eq("market", market)
    .not("from_tone", "is", null) // 노이즈(산출불가→값 생김) 가드(STEP 765b) — 노이즈만 있는 날은 최신으로 안 침
    .order("change_date", { ascending: false })
    .limit(1);
  return (data?.[0] as { change_date: string } | undefined)?.change_date ?? null;
}

export async function getTodayChanges(params: {
  market: "KR" | "US";
  limit: number;
  date?: string | null;
  watchSymbols?: Set<string> | null; // null=필터 없음(시장 전체) · size 0=로그인했지만 관심종목 0(빈 결과)
}): Promise<ChangesResult> {
  const { market, limit, watchSymbols = null } = params;
  const sb = createAdminClient();
  const zeroCounts: ToneCounts = { total: 0, pos: 0, warn: 0 };

  if (watchSymbols && watchSymbols.size === 0) {
    return { date: await latestDate(sb, market), count: 0, counts: zeroCounts, items: [] };
  }

  // 요청 날짜에 행이 없으면(주말·휴장) 최신 change_date로 폴백 — 응답의 date로 실제 반영된 날짜를 명시.
  let date = params.date ?? null;
  if (date) {
    const { count } = await sb
      .from("lens_state_changes")
      .select("id", { count: "exact", head: true })
      .eq("market", market)
      .eq("change_date", date)
      .not("from_tone", "is", null); // 노이즈(산출불가→값 생김) 가드(STEP 765b) — 없는 날로 취급
    if (!count) date = await latestDate(sb, market);
  } else {
    date = await latestDate(sb, market);
  }
  if (!date) return { date: null, count: 0, counts: zeroCounts, items: [] };

  const cacheKey = `${market}:${date}:${limit}:${watchSymbols ? [...watchSymbols].sort().join(",") : "all"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  let q = sb
    .from("lens_state_changes")
    .select("symbol,name,lens_key,from_state,to_state,from_tone,to_tone,trade_amount")
    .eq("market", market)
    .eq("change_date", date)
    .not("from_tone", "is", null) // 노이즈(산출불가→값 생김) 가드 — 기존 노이즈 행 방어(STEP 765b)
    .order("trade_amount", { ascending: false, nullsFirst: false });
  if (watchSymbols) q = q.in("symbol", [...watchSymbols]);

  // watchlist 필터 시 유니크 심볼 수가 적어 넉넉히 가져와 정렬 후 자름(정확한 limit 적용).
  const { data, error } = await q.limit(watchSymbols ? 2000 : limit);
  if (error) return { date, count: 0, counts: zeroCounts, items: [] };

  // 전체 건수(limit 절단 전, 톤별 포함) — "N건 더 보기"·톤 필터 칩 건수가 실제 전체 모수를 말하도록(근거 없는 숫자 금지 — STEP 775 §2).
  function countQuery(toTone?: "pos" | "warn") {
    let query = sb.from("lens_state_changes").select("id", { count: "exact", head: true }).eq("market", market).eq("change_date", date).not("from_tone", "is", null);
    if (watchSymbols) query = query.in("symbol", [...watchSymbols]);
    if (toTone) query = query.eq("to_tone", toTone);
    return query;
  }
  const [{ count }, { count: posCount }, { count: warnCount }] = await Promise.all([
    countQuery(), countQuery("pos"), countQuery("warn"),
  ]);
  const counts: ToneCounts = { total: count ?? 0, pos: posCount ?? 0, warn: warnCount ?? 0 };

  const rows = ((data ?? []) as ChangeRow[]).slice(0, limit);
  const snaps = await snapMap(sb, market, rows.map((r) => r.symbol));
  const items: ChangeItemData[] = rows.map((r) => {
    const snap = snaps.get(r.symbol);
    return {
      symbol: r.symbol,
      name: r.name,
      lensKey: r.lens_key,
      fromState: r.from_state,
      toState: r.to_state,
      fromTone: r.from_tone,
      toTone: r.to_tone,
      tradeAmount: r.trade_amount,
      price: snap?.price ?? null,
      changePercent: snap?.changePercent ?? null,
      nameKo: snap?.nameKo ?? null,
      nameEn: snap?.nameEn ?? null,
    };
  });

  const result: ChangesResult = { date, count: count ?? items.length, counts, items };
  cache.set(cacheKey, { at: Date.now(), data: result });
  return result;
}
