// 어제→오늘 렌즈 상태 변화 조회 — 홈 "오늘" 다이제스트의 원료(STEP 764). 결정론·LLM 무사용.
// 쿼리 로직은 lib/todayChanges.ts로 이전(STEP 771 §3) — 서버 프리페치(app/[locale]/page.tsx)와 공용, 내부 HTTP 왕복 없이 직접 호출.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayChanges } from "@/lib/todayChanges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const marketParam = req.nextUrl.searchParams.get("market");
  const market = marketParam === "KR" || marketParam === "US" ? marketParam : null;
  if (!market) return NextResponse.json({ error: "market must be KR or US" }, { status: 400 });

  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 1), 200);
  const wantWatchlist = req.nextUrl.searchParams.get("watchlist") === "true";
  const date = req.nextUrl.searchParams.get("date");

  // 관심목록 필터 — 로그인 세션 확인 후 심볼 집합. 비로그인 + watchlist=true는 정직하게 0건(임의로 전체를 보여주지 않음).
  let watchSymbols: Set<string> | null = null;
  if (wantWatchlist) {
    const supaSession = await createClient();
    const { data: { user } } = await supaSession.auth.getUser();
    if (user) {
      const sb = createAdminClient();
      const { data: wl } = await sb.from("watchlist").select("symbol").eq("user_id", user.id);
      watchSymbols = new Set(((wl ?? []) as { symbol: string }[]).map((w) => w.symbol));
    } else {
      watchSymbols = new Set();
    }
  }

  const result = await getTodayChanges({ market, limit, date, watchSymbols });
  return NextResponse.json(result);
}
