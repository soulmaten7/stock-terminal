import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickLocale } from "@/lib/lensCopy";
import { fetchGrowthStoryLocaleData } from "@/lib/growthStoryI18n";

// 🔴 2026-09-07(채팅 지시): channel_growth_stories를 symbol로 조회 — channel-reports와 달리
// 종목당 1행이 원칙이라 .maybeSingle()로 받는다. 없으면 { symbol, story: null }(빈 상태 문구 없이
// 섹션 자체를 안 보이게 하는 판단은 화면 쪽 몫 — 이 라우트는 사실만 돌려준다).
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });
  const loc = pickLocale(req.nextUrl.searchParams.get("lang"));

  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("channel_growth_stories")
      .select("id, source_doc, intro, challenge, response, summary, video_url")
      .eq("symbol", symbol)
      .maybeSingle();
    if (error) return NextResponse.json({ symbol, story: null, error: "fetch_failed" });
    if (!data) return NextResponse.json({ symbol, story: null });

    const tr = await fetchGrowthStoryLocaleData({ storyId: data.id, loc });
    const ok = tr && tr.status === "ok";

    return NextResponse.json({
      symbol,
      story: {
        source_doc: data.source_doc,
        intro: ok && tr!.intro ? tr!.intro : data.intro,
        challenge: ok && tr!.challenge ? tr!.challenge : data.challenge,
        response: ok && tr!.response ? tr!.response : data.response,
        summary: ok && tr!.summary ? tr!.summary : data.summary,
        video_url: data.video_url,
      },
    });
  } catch {
    return NextResponse.json({ symbol, story: null, error: "fetch_failed" });
  }
}
