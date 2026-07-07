import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 매매처(증권사) = 언어권(사용자 지역) 기준. region 파라미터로 조회.
// 플레이북 §4-3: 국가 탭이 바뀌어도 증권사는 유지, '언어'를 바꿀 때만 그 언어권 매매처로 교체.
// 지금은 한국어 전용 → 화면은 region=KR 고정 호출. 언어 스위처 생기면 region만 바꾸면 됨.
export const revalidate = 86400; // 하루 캐시 (분기 갱신 데이터)

export async function GET(req: Request) {
  const region = (new URL(req.url).searchParams.get("region") || "KR").toUpperCase();
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("brokers")
      .select("name, domain, url, display_order, share, note")
      .eq("region", region)
      .order("display_order", { ascending: true });
    if (error || !data) return NextResponse.json({ brokers: [] });
    const brokers = data.map((b) => ({
      rank: b.display_order as number,
      name: b.name as string,
      domain: b.domain as string,
      url: b.url as string,
      share: b.share != null && String(b.share) !== "" ? Number(b.share) : undefined,
      note: (b.note as string) || undefined,
    }));
    return NextResponse.json({ brokers });
  } catch {
    return NextResponse.json({ brokers: [] });
  }
}
